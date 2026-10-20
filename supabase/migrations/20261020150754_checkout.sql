create table public.pos_terminals (
  id            uuid primary key default gen_random_uuid(),
  store_id      uuid not null references public.stores (id) on delete restrict,
  name          text not null check (char_length(name) between 1 and 60),
  key_hash      bytea not null unique,
  is_active     boolean not null default true,
  last_seen_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index pos_terminals_store_id_idx on public.pos_terminals (store_id);

create trigger pos_terminals_set_updated_at before update on public.pos_terminals
  for each row execute function private.set_updated_at();

create table public.purchases (
  id              uuid primary key default gen_random_uuid(),
  customer_id     uuid references public.customers (id) on delete set null,
  card_id         uuid references public.loyalty_cards (id) on delete set null,
  store_id        uuid not null references public.stores (id) on delete restrict,
  terminal_id     uuid references public.pos_terminals (id) on delete set null,
  transaction_id  text not null check (char_length(transaction_id) between 1 and 64),
  receipt_number  text check (char_length(receipt_number) <= 64),
  total           numeric(10,2) not null check (total >= 0),
  discount_total  numeric(10,2) not null default 0 check (discount_total >= 0),
  points_earned   integer not null default 0 check (points_earned >= 0),
  occurred_at     timestamptz not null default now(),
  refunded_at     timestamptz,
  created_at      timestamptz not null default now(),
  constraint purchases_transaction_unique unique (store_id, transaction_id)
);

create index purchases_customer_idx on public.purchases (customer_id, occurred_at desc);
create index purchases_store_idx on public.purchases (store_id, occurred_at desc);
create index purchases_card_id_idx on public.purchases (card_id);
create index purchases_terminal_id_idx on public.purchases (terminal_id);

create table public.purchase_items (
  id           uuid primary key default gen_random_uuid(),
  purchase_id  uuid not null references public.purchases (id) on delete cascade,
  position     smallint not null check (position > 0),
  product_sku  text check (char_length(product_sku) <= 64),
  name         text not null check (char_length(name) between 1 and 120),
  quantity     numeric(10,3) not null check (quantity > 0),
  unit_price   numeric(10,2) not null check (unit_price >= 0),
  total        numeric(10,2) not null check (total >= 0),
  constraint purchase_items_position_unique unique (purchase_id, position)
);

create table public.coupon_uses (
  id                  uuid primary key default gen_random_uuid(),
  customer_coupon_id  uuid not null references public.customer_coupons (id) on delete cascade,
  purchase_id         uuid not null references public.purchases (id) on delete cascade,
  created_at          timestamptz not null default now(),
  constraint coupon_uses_unique unique (customer_coupon_id, purchase_id)
);

create index coupon_uses_purchase_id_idx on public.coupon_uses (purchase_id);

alter table public.points_ledger
  add constraint points_ledger_purchase_id_fkey
  foreign key (purchase_id) references public.purchases (id) on delete set null;

alter table public.reward_redemptions
  add constraint reward_redemptions_purchase_id_fkey
  foreign key (purchase_id) references public.purchases (id) on delete set null;

create table private.checkout_sessions (
  id                     uuid primary key default gen_random_uuid(),
  terminal_id            uuid not null references public.pos_terminals (id) on delete cascade,
  card_id                uuid not null references public.loyalty_cards (id) on delete cascade,
  customer_id            uuid not null references public.customers (id) on delete cascade,
  is_dynamic             boolean not null,
  created_at             timestamptz not null default now(),
  expires_at             timestamptz not null default now() + interval '20 minutes',
  completed_purchase_id  uuid references public.purchases (id) on delete set null
);

create index checkout_sessions_terminal_id_idx on private.checkout_sessions (terminal_id);
create index checkout_sessions_card_id_idx on private.checkout_sessions (card_id);
create index checkout_sessions_customer_id_idx on private.checkout_sessions (customer_id);
create index checkout_sessions_created_at_idx on private.checkout_sessions (created_at);

create function private.create_pos_terminal(p_store_code text, p_name text)
returns text
language plpgsql
set search_path = ''
as $$
declare
  v_store uuid;
  v_key text := 'pst_' || encode(extensions.gen_random_bytes(32), 'hex');
begin
  select id into v_store from public.stores where code = p_store_code;
  if v_store is null then
    perform private.fail('store_invalid', 'Nie ma sklepu o takim kodzie');
  end if;
  insert into public.pos_terminals (store_id, name, key_hash)
  values (v_store, p_name, extensions.digest(v_key, 'sha256'));
  return v_key;
end;
$$;

create function private.terminal_by_key(p_key text)
returns public.pos_terminals
language plpgsql
set search_path = ''
as $$
declare
  v_terminal public.pos_terminals;
begin
  select * into v_terminal from public.pos_terminals
  where key_hash = extensions.digest(coalesce(p_key, ''), 'sha256') and is_active;
  if v_terminal.id is null then
    perform private.fail('terminal_invalid', 'Nieznany terminal kasowy');
  end if;
  if v_terminal.last_seen_at is null or v_terminal.last_seen_at < now() - interval '5 minutes' then
    update public.pos_terminals set last_seen_at = now() where id = v_terminal.id;
  end if;
  return v_terminal;
end;
$$;

create function private.resolve_card(p_code text, out card_id uuid, out customer_id uuid, out is_dynamic boolean)
language plpgsql
stable
set search_path = ''
as $$
declare
  v_code text := btrim(coalesce(p_code, ''));
  v_number text;
  v_otp text;
  v_secret bytea;
begin
  if v_code ~ '^PS1\.29[0-9]{11}\.[0-9]{6}$' then
    v_number := split_part(v_code, '.', 2);
    v_otp := split_part(v_code, '.', 3);
    is_dynamic := true;
  elsif v_code ~ '^29[0-9]{11}$' then
    v_number := v_code;
    is_dynamic := false;
  else
    perform private.fail('code_invalid', 'To nie jest kod karty Pod Strzechą');
  end if;

  if private.ean13_check_digit(left(v_number, 12)) <> right(v_number, 1) then
    perform private.fail('code_invalid', 'To nie jest kod karty Pod Strzechą');
  end if;

  select c.id, c.customer_id, s.secret into card_id, customer_id, v_secret
  from public.loyalty_cards c
  join private.card_secrets s on s.card_id = c.id
  join public.customers cu on cu.id = c.customer_id
  where c.number = v_number and c.status = 'active' and cu.status = 'active';

  if card_id is null then
    perform private.fail('card_not_found', 'Ta karta jest nieaktywna');
  end if;
  if is_dynamic and not private.totp_matches(v_secret, v_otp) then
    perform private.fail('code_expired', 'Kod wygasł. Poproś o pokazanie karty jeszcze raz');
  end if;
end;
$$;

create function public.pos_identify(p_terminal_key text, p_code text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_terminal public.pos_terminals := private.terminal_by_key(p_terminal_key);
  v_card record;
  v_customer public.customers;
  v_session uuid;
begin
  select * into v_card from private.resolve_card(p_code);
  select * into v_customer from public.customers where id = v_card.customer_id;

  insert into private.checkout_sessions (terminal_id, card_id, customer_id, is_dynamic)
  values (v_terminal.id, v_card.card_id, v_card.customer_id, v_card.is_dynamic)
  returning id into v_session;

  return jsonb_build_object(
    'session_id', v_session,
    'first_name', v_customer.first_name,
    'points_balance', v_customer.points_balance,
    'can_redeem', v_card.is_dynamic,
    'coupons', case when not v_card.is_dynamic then '[]'::jsonb else coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', cc.id,
        'title', co.title,
        'benefit', co.benefit,
        'value', co.value,
        'product_sku', co.product_sku,
        'min_total', co.min_total,
        'uses_left', cc.uses_left,
        'valid_until', cc.valid_until
      ) order by cc.valid_until)
      from public.customer_coupons cc
      join public.coupons co on co.id = cc.coupon_id
      where cc.customer_id = v_customer.id
        and cc.uses_left > 0
        and now() >= cc.valid_from and now() < cc.valid_until
        and co.is_active
        and private.coupon_covers_store(co.id, v_terminal.store_id)
    ), '[]'::jsonb) end,
    'rewards', case when not v_card.is_dynamic then '[]'::jsonb else coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', rr.id,
        'title', r.title,
        'benefit', r.benefit,
        'value', r.value,
        'product_sku', r.product_sku,
        'expires_at', rr.expires_at
      ) order by rr.expires_at)
      from public.reward_redemptions rr
      join public.rewards r on r.id = rr.reward_id
      where rr.customer_id = v_customer.id and rr.status = 'active' and rr.expires_at > now()
    ), '[]'::jsonb) end
  );
end;
$$;

create function private.purchase_result(p_purchase public.purchases)
returns jsonb
language sql
stable
set search_path = ''
as $$
  select jsonb_build_object(
    'purchase_id', p_purchase.id,
    'points_earned', p_purchase.points_earned,
    'points_balance', (select points_balance from public.customers where id = p_purchase.customer_id),
    'refunded', p_purchase.refunded_at is not null
  )
$$;

create function public.pos_complete(
  p_terminal_key text,
  p_session_id uuid,
  p_transaction_id text,
  p_total numeric,
  p_discount_total numeric default 0,
  p_receipt_number text default null,
  p_occurred_at timestamptz default null,
  p_items jsonb default '[]'::jsonb,
  p_customer_coupon_ids uuid[] default '{}',
  p_redemption_ids uuid[] default '{}'
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_terminal public.pos_terminals := private.terminal_by_key(p_terminal_key);
  v_settings public.program_settings;
  v_session private.checkout_sessions;
  v_purchase public.purchases;
  v_coupon record;
  v_coupon_ids uuid[] := coalesce(p_customer_coupon_ids, '{}');
  v_redemption_ids uuid[] := coalesce(p_redemption_ids, '{}');
  v_occurred_at timestamptz := coalesce(p_occurred_at, now());
  v_multiplier numeric := 1;
  v_bonus integer := 0;
  v_points integer;
  v_today integer;
  v_found integer;
begin
  select * into v_purchase from public.purchases
  where store_id = v_terminal.store_id and transaction_id = p_transaction_id;
  if v_purchase.id is not null then
    return private.purchase_result(v_purchase);
  end if;

  select * into v_settings from public.program_settings;

  select * into v_session from private.checkout_sessions
  where id = p_session_id and terminal_id = v_terminal.id
  for update;
  if v_session.id is null or v_session.expires_at < now() then
    perform private.fail('session_expired', 'Sesja wygasła. Zeskanuj kartę jeszcze raz');
  end if;
  if v_session.completed_purchase_id is not null then
    perform private.fail('session_used', 'Ta karta została już rozliczona w tej transakcji');
  end if;
  if p_total is null or p_total < 0 or p_total > v_settings.max_purchase_total
     or coalesce(p_discount_total, 0) < 0 then
    perform private.fail('total_invalid', 'Nieprawidłowa kwota zakupów');
  end if;
  if v_occurred_at < now() - interval '24 hours' or v_occurred_at > now() + interval '2 minutes' then
    perform private.fail('occurred_at_invalid', 'Nieprawidłowa godzina zakupów');
  end if;
  if (cardinality(v_coupon_ids) > 0 or cardinality(v_redemption_ids) > 0) and not v_session.is_dynamic then
    perform private.fail('dynamic_code_required', 'Kupony i nagrody wymagają kodu z aplikacji');
  end if;
  if jsonb_typeof(coalesce(p_items, '[]'::jsonb)) <> 'array' or jsonb_array_length(coalesce(p_items, '[]'::jsonb)) > 300 then
    perform private.fail('items_invalid', 'Nieprawidłowa lista produktów');
  end if;

  perform 1 from public.customers where id = v_session.customer_id and status = 'active' for update;
  if not found then
    perform private.fail('customer_blocked', 'Konto klienta jest zablokowane');
  end if;

  v_found := 0;
  for v_coupon in
    select cc.id, co.benefit, co.value
    from public.customer_coupons cc
    join public.coupons co on co.id = cc.coupon_id
    where cc.id = any (v_coupon_ids)
      and cc.customer_id = v_session.customer_id
      and cc.uses_left > 0
      and now() >= cc.valid_from and now() < cc.valid_until
      and co.is_active
      and private.coupon_covers_store(co.id, v_terminal.store_id)
      and (co.min_total is null or p_total + coalesce(p_discount_total, 0) >= co.min_total)
    for update of cc
  loop
    v_found := v_found + 1;
    if v_coupon.benefit = 'points_multiplier' then
      v_multiplier := greatest(v_multiplier, v_coupon.value);
    elsif v_coupon.benefit = 'bonus_points' then
      v_bonus := v_bonus + v_coupon.value::integer;
    end if;
  end loop;
  if v_found <> cardinality(array(select distinct unnest(v_coupon_ids))) then
    perform private.fail('coupon_invalid', 'Któryś z kuponów nie działa w tej transakcji');
  end if;

  select count(*) into v_found from public.reward_redemptions
  where id = any (v_redemption_ids)
    and customer_id = v_session.customer_id
    and status = 'active' and expires_at > now();
  if v_found <> cardinality(array(select distinct unnest(v_redemption_ids))) then
    perform private.fail('reward_invalid', 'Któraś z nagród nie działa w tej transakcji');
  end if;

  v_points := floor(floor(p_total * v_settings.points_per_zloty) * v_multiplier)::integer + v_bonus;

  select coalesce(sum(points_earned), 0) into v_today from public.purchases
  where customer_id = v_session.customer_id
    and occurred_at >= (date_trunc('day', now() at time zone 'Europe/Warsaw') at time zone 'Europe/Warsaw');
  v_points := least(v_points, greatest(v_settings.daily_points_cap - v_today, 0));

  insert into public.purchases (
    customer_id, card_id, store_id, terminal_id, transaction_id, receipt_number,
    total, discount_total, points_earned, occurred_at
  )
  values (
    v_session.customer_id, v_session.card_id, v_terminal.store_id, v_terminal.id, p_transaction_id,
    nullif(btrim(p_receipt_number), ''), p_total, coalesce(p_discount_total, 0), v_points, v_occurred_at
  )
  returning * into v_purchase;

  insert into public.purchase_items (purchase_id, position, product_sku, name, quantity, unit_price, total)
  select v_purchase.id, x.ordinality, x.item ->> 'sku', x.item ->> 'name',
         (x.item ->> 'quantity')::numeric, (x.item ->> 'unit_price')::numeric, (x.item ->> 'total')::numeric
  from jsonb_array_elements(coalesce(p_items, '[]'::jsonb)) with ordinality as x (item, ordinality);

  insert into public.coupon_uses (customer_coupon_id, purchase_id)
  select distinct unnest(v_coupon_ids), v_purchase.id;
  update public.customer_coupons set uses_left = uses_left - 1 where id = any (v_coupon_ids);

  update public.reward_redemptions
  set status = 'used', used_at = now(), purchase_id = v_purchase.id
  where id = any (v_redemption_ids);

  if v_points > 0 then
    insert into public.points_ledger (customer_id, delta, kind, purchase_id)
    values (v_session.customer_id, v_points, 'purchase', v_purchase.id);
  else
    update public.customers set last_activity_at = now() where id = v_session.customer_id;
  end if;

  update private.checkout_sessions set completed_purchase_id = v_purchase.id where id = v_session.id;

  return private.purchase_result(v_purchase);
end;
$$;

create function public.pos_refund(p_terminal_key text, p_transaction_id text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_terminal public.pos_terminals := private.terminal_by_key(p_terminal_key);
  v_purchase public.purchases;
  v_balance integer;
  v_points integer;
begin
  select * into v_purchase from public.purchases
  where store_id = v_terminal.store_id and transaction_id = p_transaction_id
  for update;
  if v_purchase.id is null then
    perform private.fail('purchase_not_found', 'Nie ma takiej transakcji');
  end if;
  if v_purchase.refunded_at is not null then
    return private.purchase_result(v_purchase);
  end if;

  update public.purchases set refunded_at = now() where id = v_purchase.id returning * into v_purchase;

  if v_purchase.customer_id is not null and v_purchase.points_earned > 0 then
    select points_balance into v_balance from public.customers where id = v_purchase.customer_id for update;
    v_points := least(v_purchase.points_earned, v_balance);
    if v_points > 0 then
      insert into public.points_ledger (customer_id, delta, kind, purchase_id)
      values (v_purchase.customer_id, -v_points, 'purchase_refund', v_purchase.id);
    end if;
  end if;

  return private.purchase_result(v_purchase);
end;
$$;

alter table public.pos_terminals enable row level security;
alter table public.purchases enable row level security;
alter table public.purchase_items enable row level security;
alter table public.coupon_uses enable row level security;

create policy purchases_select_own on public.purchases
  for select to authenticated using (customer_id = (select auth.uid()));

create policy purchase_items_select_own on public.purchase_items
  for select to authenticated
  using (exists (
    select 1 from public.purchases p
    where p.id = purchase_items.purchase_id and p.customer_id = (select auth.uid())
  ));

create policy coupon_uses_select_own on public.coupon_uses
  for select to authenticated
  using (exists (
    select 1 from public.purchases p
    where p.id = coupon_uses.purchase_id and p.customer_id = (select auth.uid())
  ));

grant select on public.purchases, public.purchase_items, public.coupon_uses to authenticated;

grant execute on function public.pos_identify, public.pos_complete, public.pos_refund to anon;
