create type public.customer_status as enum ('active', 'blocked');
create type public.consent_kind as enum ('terms', 'marketing_push', 'marketing_email');
create type public.card_status as enum ('active', 'blocked', 'replaced');
create type public.ledger_kind as enum (
  'welcome', 'purchase', 'purchase_refund', 'reward', 'reward_refund', 'expiry', 'adjustment'
);

create table public.customers (
  id                          uuid primary key references auth.users (id) on delete cascade,
  first_name                  text check (char_length(btrim(first_name)) between 1 and 40),
  home_store_id               uuid references public.stores (id) on delete set null,
  birthday_month              smallint check (birthday_month between 1 and 12),
  birthday_day                smallint check (birthday_day between 1 and 31),
  points_balance              integer not null default 0 check (points_balance >= 0),
  lifetime_points             integer not null default 0 check (lifetime_points >= 0),
  terms_version               text,
  terms_accepted_at           timestamptz,
  marketing_push              boolean not null default false,
  marketing_email             boolean not null default false,
  status                      public.customer_status not null default 'active',
  last_activity_at            timestamptz not null default now(),
  points_expiry_reminded_at   timestamptz,
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now(),
  constraint customers_birthday_complete check ((birthday_month is null) = (birthday_day is null)),
  constraint customers_birthday_valid check (
    birthday_month is null
    or birthday_day <= case when birthday_month = 2 then 29 when birthday_month in (4, 6, 9, 11) then 30 else 31 end
  ),
  constraint customers_terms_complete check ((terms_version is null) = (terms_accepted_at is null))
);

create index customers_home_store_id_idx on public.customers (home_store_id);
create index customers_birthday_idx on public.customers (birthday_month, birthday_day) where birthday_month is not null;
create index customers_points_activity_idx on public.customers (last_activity_at) where points_balance > 0;

create trigger customers_set_updated_at before update on public.customers
  for each row execute function private.set_updated_at();

create table public.customer_consents (
  id           uuid primary key default gen_random_uuid(),
  customer_id  uuid not null references public.customers (id) on delete cascade,
  kind         public.consent_kind not null,
  granted      boolean not null,
  version      text,
  created_at   timestamptz not null default now()
);

create index customer_consents_customer_idx on public.customer_consents (customer_id, created_at desc);

create function private.log_customer_consents()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.terms_version is distinct from old.terms_version and new.terms_version is not null then
    insert into public.customer_consents (customer_id, kind, granted, version)
    values (new.id, 'terms', true, new.terms_version);
  end if;
  if new.marketing_push is distinct from old.marketing_push then
    insert into public.customer_consents (customer_id, kind, granted, version)
    values (new.id, 'marketing_push', new.marketing_push, new.terms_version);
  end if;
  if new.marketing_email is distinct from old.marketing_email then
    insert into public.customer_consents (customer_id, kind, granted, version)
    values (new.id, 'marketing_email', new.marketing_email, new.terms_version);
  end if;
  return new;
end;
$$;

create trigger customers_log_consents after update on public.customers
  for each row execute function private.log_customer_consents();

create function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.customers (id) values (new.id) on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function private.handle_new_user();

create table public.loyalty_cards (
  id           uuid primary key default gen_random_uuid(),
  customer_id  uuid not null references public.customers (id) on delete cascade,
  number       text not null unique check (number ~ '^29[0-9]{11}$'),
  status       public.card_status not null default 'active',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index loyalty_cards_customer_id_idx on public.loyalty_cards (customer_id);
create unique index loyalty_cards_one_active_idx on public.loyalty_cards (customer_id) where status = 'active';

create trigger loyalty_cards_set_updated_at before update on public.loyalty_cards
  for each row execute function private.set_updated_at();

create table private.card_secrets (
  card_id     uuid primary key references public.loyalty_cards (id) on delete cascade,
  secret      bytea not null check (octet_length(secret) = 20),
  rotated_at  timestamptz not null default now()
);

create function private.ean13_check_digit(p_digits text)
returns text
language sql
immutable
set search_path = ''
as $$
  select ((10 - (sum(substr(p_digits, i, 1)::int * case when i % 2 = 0 then 3 else 1 end) % 10)) % 10)::text
  from generate_series(1, 12) as i
$$;

create function private.new_card_number()
returns text
language plpgsql
volatile
set search_path = ''
as $$
declare
  v_number text;
begin
  loop
    v_number := '29' || lpad(
      (('x' || encode(extensions.gen_random_bytes(5), 'hex'))::bit(40)::bigint % 10000000000)::text, 10, '0'
    );
    v_number := v_number || private.ean13_check_digit(v_number);
    exit when not exists (select 1 from public.loyalty_cards where number = v_number);
  end loop;
  return v_number;
end;
$$;

create function private.hotp(p_secret bytea, p_counter bigint)
returns text
language plpgsql
immutable
set search_path = ''
as $$
declare
  h bytea := extensions.hmac(int8send(p_counter), p_secret, 'sha1');
  o int := get_byte(h, 19) & 15;
begin
  return lpad((
    (((get_byte(h, o) & 127)::bigint << 24)
      | (get_byte(h, o + 1)::bigint << 16)
      | (get_byte(h, o + 2)::bigint << 8)
      | get_byte(h, o + 3)::bigint) % 1000000
  )::text, 6, '0');
end;
$$;

create function private.totp_matches(p_secret bytea, p_code text, p_at timestamptz default now())
returns boolean
language sql
stable
set search_path = ''
as $$
  select exists (
    select 1 from generate_series(-2, 1) as d
    where private.hotp(p_secret, floor(extract(epoch from p_at) / 30)::bigint + d) = p_code
  )
$$;

create function private.issue_card(p_customer_id uuid)
returns uuid
language plpgsql
set search_path = ''
as $$
declare
  v_card uuid;
begin
  insert into public.loyalty_cards (customer_id, number)
  values (p_customer_id, private.new_card_number())
  returning id into v_card;
  insert into private.card_secrets (card_id, secret) values (v_card, extensions.gen_random_bytes(20));
  return v_card;
end;
$$;

create function private.current_customer_id()
returns uuid
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_customer public.customers;
begin
  select * into v_customer from public.customers where id = auth.uid();
  if v_customer.id is null then
    perform private.fail('not_authenticated', 'Zaloguj się, żeby kontynuować');
  end if;
  if v_customer.status <> 'active' then
    perform private.fail('customer_blocked', 'Konto jest zablokowane');
  end if;
  if v_customer.terms_accepted_at is null then
    perform private.fail('onboarding_required', 'Dokończ zakładanie konta');
  end if;
  return v_customer.id;
end;
$$;

create table public.points_ledger (
  id             uuid primary key default gen_random_uuid(),
  customer_id    uuid not null references public.customers (id) on delete cascade,
  delta          integer not null check (delta <> 0),
  kind           public.ledger_kind not null,
  purchase_id    uuid,
  redemption_id  uuid,
  note           text check (char_length(note) <= 200),
  created_at     timestamptz not null default now()
);

create index points_ledger_customer_idx on public.points_ledger (customer_id, created_at desc);
create index points_ledger_purchase_id_idx on public.points_ledger (purchase_id);
create index points_ledger_redemption_id_idx on public.points_ledger (redemption_id);
create unique index points_ledger_welcome_once_idx on public.points_ledger (customer_id) where kind = 'welcome';

create function private.apply_ledger_entry()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  update public.customers
  set points_balance = points_balance + new.delta,
      lifetime_points = lifetime_points
        + case when new.delta > 0 and new.kind in ('welcome', 'purchase', 'adjustment') then new.delta else 0 end,
      last_activity_at = case when new.kind = 'purchase' then now() else last_activity_at end
  where id = new.customer_id;
  return new;
end;
$$;

create trigger points_ledger_apply after insert on public.points_ledger
  for each row execute function private.apply_ledger_entry();

create function public.complete_onboarding(
  p_first_name text,
  p_home_store_id uuid,
  p_terms_version text,
  p_marketing_push boolean default false,
  p_marketing_email boolean default false,
  p_birthday_month smallint default null,
  p_birthday_day smallint default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_settings public.program_settings;
  v_customer public.customers;
begin
  select * into v_settings from public.program_settings;
  select * into v_customer from public.customers where id = auth.uid() for update;
  if v_customer.id is null then
    perform private.fail('not_authenticated', 'Zaloguj się, żeby kontynuować');
  end if;
  if v_customer.status <> 'active' then
    perform private.fail('customer_blocked', 'Konto jest zablokowane');
  end if;
  if p_terms_version is distinct from v_settings.terms_version then
    perform private.fail('terms_outdated', 'Zaakceptuj aktualny regulamin');
  end if;
  if p_home_store_id is not null and not exists (
    select 1 from public.stores where id = p_home_store_id and is_active
  ) then
    perform private.fail('store_invalid', 'Wybierz sklep z listy');
  end if;

  update public.customers
  set first_name = btrim(p_first_name),
      home_store_id = p_home_store_id,
      terms_version = p_terms_version,
      terms_accepted_at = coalesce(terms_accepted_at, now()),
      marketing_push = coalesce(p_marketing_push, false),
      marketing_email = coalesce(p_marketing_email, false),
      birthday_month = case when v_customer.birthday_month is null then p_birthday_month else birthday_month end,
      birthday_day = case when v_customer.birthday_month is null then p_birthday_day else birthday_day end
  where id = v_customer.id;

  if not exists (select 1 from public.loyalty_cards where customer_id = v_customer.id and status = 'active') then
    perform private.issue_card(v_customer.id);
  end if;

  if v_settings.welcome_bonus > 0
     and not exists (select 1 from public.points_ledger where customer_id = v_customer.id and kind = 'welcome') then
    insert into public.points_ledger (customer_id, delta, kind)
    values (v_customer.id, v_settings.welcome_bonus, 'welcome');
  end if;
end;
$$;

create function public.accept_terms(p_terms_version text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_terms_version is distinct from (select terms_version from public.program_settings) then
    perform private.fail('terms_outdated', 'Zaakceptuj aktualny regulamin');
  end if;
  update public.customers
  set terms_version = p_terms_version, terms_accepted_at = now()
  where id = auth.uid() and terms_accepted_at is not null and status = 'active';
  if not found then
    perform private.fail('onboarding_required', 'Dokończ zakładanie konta');
  end if;
end;
$$;

create function public.set_birthday(p_month smallint, p_day smallint)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.customers
  set birthday_month = p_month, birthday_day = p_day
  where id = private.current_customer_id() and birthday_month is null;
  if not found then
    perform private.fail('birthday_locked', 'Datę urodzin można podać tylko raz');
  end if;
end;
$$;

create function public.my_card()
returns table (card_number text, secret_hex text, period_seconds integer, digits integer)
language sql
stable
security definer
set search_path = ''
as $$
  select c.number, encode(s.secret, 'hex'), 30, 6
  from public.loyalty_cards c
  join private.card_secrets s on s.card_id = c.id
  join public.customers cu on cu.id = c.customer_id
  where c.customer_id = auth.uid() and c.status = 'active' and cu.status = 'active'
$$;

create function public.rotate_card_secret()
returns table (card_number text, secret_hex text, period_seconds integer, digits integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_card uuid;
begin
  select id into v_card from public.loyalty_cards
  where customer_id = private.current_customer_id() and status = 'active';
  if v_card is null then
    perform private.fail('card_not_found', 'Nie masz jeszcze karty');
  end if;
  update private.card_secrets set secret = extensions.gen_random_bytes(20), rotated_at = now() where card_id = v_card;
  return query select * from public.my_card();
end;
$$;

alter table public.customers enable row level security;
alter table public.customer_consents enable row level security;
alter table public.loyalty_cards enable row level security;
alter table public.points_ledger enable row level security;

create policy customers_select_own on public.customers
  for select to authenticated using (id = (select auth.uid()));
create policy customers_update_own on public.customers
  for update to authenticated
  using (id = (select auth.uid()) and status = 'active')
  with check (id = (select auth.uid()));

create policy customer_consents_select_own on public.customer_consents
  for select to authenticated using (customer_id = (select auth.uid()));

create policy loyalty_cards_select_own on public.loyalty_cards
  for select to authenticated using (customer_id = (select auth.uid()));

create policy points_ledger_select_own on public.points_ledger
  for select to authenticated using (customer_id = (select auth.uid()));

grant select on public.customers, public.customer_consents, public.loyalty_cards, public.points_ledger to authenticated;
grant update (first_name, home_store_id, marketing_push, marketing_email) on public.customers to authenticated;

grant execute on function
  public.complete_onboarding, public.accept_terms, public.set_birthday, public.my_card, public.rotate_card_secret
to authenticated;
