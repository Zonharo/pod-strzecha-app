create type public.benefit_kind as enum (
  'percent_off', 'amount_off', 'fixed_price', 'free_item', 'bonus_points', 'points_multiplier'
);
create type public.content_scope as enum ('network', 'region', 'stores');
create type public.coupon_audience as enum ('everyone', 'personal');
create type public.coupon_source as enum ('activated', 'birthday', 'gift');
create type public.redemption_status as enum ('active', 'used', 'expired', 'cancelled');

create function private.benefit_value_valid(p_benefit public.benefit_kind, p_value numeric)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select case p_benefit
    when 'percent_off' then p_value > 0 and p_value <= 100
    when 'amount_off' then p_value > 0
    when 'fixed_price' then p_value >= 0
    when 'free_item' then p_value is null
    when 'bonus_points' then p_value >= 1 and p_value = trunc(p_value)
    when 'points_multiplier' then p_value > 1 and p_value <= 10
  end
$$;

create table public.coupons (
  id                      uuid primary key default gen_random_uuid(),
  title                   text not null check (char_length(title) between 1 and 60),
  description             text not null default '' check (char_length(description) <= 500),
  terms                   text not null default '' check (char_length(terms) <= 1000),
  image_path              text check (char_length(image_path) <= 200),
  benefit                 public.benefit_kind not null,
  value                   numeric(10,2),
  product_sku             text check (char_length(product_sku) <= 64),
  min_total               numeric(10,2) check (min_total > 0),
  audience                public.coupon_audience not null default 'everyone',
  scope                   public.content_scope not null default 'network',
  region_id               uuid references public.regions (id) on delete restrict,
  starts_at               timestamptz not null default now(),
  ends_at                 timestamptz not null,
  valid_days_after_grant  integer check (valid_days_after_grant between 1 and 365),
  uses_per_customer       integer not null default 1 check (uses_per_customer between 1 and 100),
  max_activations         integer check (max_activations > 0),
  activations_count       integer not null default 0 check (activations_count >= 0),
  is_active               boolean not null default true,
  sort_order              integer not null default 0,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),
  constraint coupons_dates check (ends_at > starts_at),
  constraint coupons_region_scope check ((scope = 'region') = (region_id is not null)),
  constraint coupons_value_valid check (private.benefit_value_valid(benefit, value))
);

create index coupons_region_id_idx on public.coupons (region_id);
create index coupons_listing_idx on public.coupons (ends_at, sort_order) where is_active and audience = 'everyone';

create trigger coupons_set_updated_at before update on public.coupons
  for each row execute function private.set_updated_at();

create table public.coupon_stores (
  coupon_id  uuid not null references public.coupons (id) on delete cascade,
  store_id   uuid not null references public.stores (id) on delete cascade,
  primary key (coupon_id, store_id)
);

create index coupon_stores_store_id_idx on public.coupon_stores (store_id);

create table public.customer_coupons (
  id           uuid primary key default gen_random_uuid(),
  customer_id  uuid not null references public.customers (id) on delete cascade,
  coupon_id    uuid not null references public.coupons (id) on delete restrict,
  source       public.coupon_source not null default 'activated',
  uses_left    integer not null check (uses_left >= 0),
  valid_from   timestamptz not null default now(),
  valid_until  timestamptz not null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint customer_coupons_dates check (valid_until > valid_from)
);

create index customer_coupons_customer_idx on public.customer_coupons (customer_id, valid_until desc);
create index customer_coupons_coupon_id_idx on public.customer_coupons (coupon_id);
create unique index customer_coupons_activated_once_idx on public.customer_coupons (customer_id, coupon_id)
  where source = 'activated';

create trigger customer_coupons_set_updated_at before update on public.customer_coupons
  for each row execute function private.set_updated_at();

create function private.coupon_covers_store(p_coupon_id uuid, p_store_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((
    select case c.scope
      when 'network' then true
      when 'region' then exists (select 1 from public.stores s where s.id = p_store_id and s.region_id = c.region_id)
      else exists (select 1 from public.coupon_stores cs where cs.coupon_id = c.id and cs.store_id = p_store_id)
    end
    from public.coupons c where c.id = p_coupon_id
  ), false)
$$;

create table public.rewards (
  id           uuid primary key default gen_random_uuid(),
  title        text not null check (char_length(title) between 1 and 60),
  description  text not null default '' check (char_length(description) <= 500),
  terms        text not null default '' check (char_length(terms) <= 1000),
  image_path   text check (char_length(image_path) <= 200),
  points_cost  integer not null check (points_cost > 0),
  benefit      public.benefit_kind not null default 'free_item'
                 check (benefit in ('percent_off', 'amount_off', 'fixed_price', 'free_item')),
  value        numeric(10,2),
  product_sku  text check (char_length(product_sku) <= 64),
  valid_days   integer check (valid_days between 1 and 365),
  stock        integer check (stock >= 0),
  is_active    boolean not null default true,
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint rewards_value_valid check (private.benefit_value_valid(benefit, value))
);

create index rewards_listing_idx on public.rewards (points_cost, sort_order) where is_active;

create trigger rewards_set_updated_at before update on public.rewards
  for each row execute function private.set_updated_at();

create table public.reward_redemptions (
  id            uuid primary key default gen_random_uuid(),
  customer_id   uuid not null references public.customers (id) on delete cascade,
  reward_id     uuid not null references public.rewards (id) on delete restrict,
  points_spent  integer not null check (points_spent > 0),
  status        public.redemption_status not null default 'active',
  expires_at    timestamptz not null,
  used_at       timestamptz,
  purchase_id   uuid,
  reminded_at   timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint reward_redemptions_used check ((status = 'used') = (used_at is not null))
);

create index reward_redemptions_customer_idx on public.reward_redemptions (customer_id, created_at desc);
create index reward_redemptions_reward_id_idx on public.reward_redemptions (reward_id);
create index reward_redemptions_purchase_id_idx on public.reward_redemptions (purchase_id);
create index reward_redemptions_active_idx on public.reward_redemptions (expires_at) where status = 'active';

create trigger reward_redemptions_set_updated_at before update on public.reward_redemptions
  for each row execute function private.set_updated_at();

alter table public.points_ledger
  add constraint points_ledger_redemption_id_fkey
  foreign key (redemption_id) references public.reward_redemptions (id) on delete set null;

alter table public.program_settings
  add column birthday_coupon_id uuid references public.coupons (id) on delete set null;

create function public.activate_coupon(p_coupon_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_customer uuid := private.current_customer_id();
  v_coupon public.coupons;
  v_id uuid;
begin
  select * into v_coupon from public.coupons where id = p_coupon_id for update;
  if v_coupon.id is null or not v_coupon.is_active or v_coupon.audience <> 'everyone'
     or now() < v_coupon.starts_at or now() >= v_coupon.ends_at then
    perform private.fail('coupon_unavailable', 'Ten kupon jest już niedostępny');
  end if;

  select id into v_id from public.customer_coupons
  where customer_id = v_customer and coupon_id = v_coupon.id and source = 'activated';
  if v_id is not null then
    return v_id;
  end if;

  if v_coupon.max_activations is not null and v_coupon.activations_count >= v_coupon.max_activations then
    perform private.fail('coupon_sold_out', 'Te kupony już się skończyły');
  end if;

  insert into public.customer_coupons (customer_id, coupon_id, source, uses_left, valid_until)
  values (v_customer, v_coupon.id, 'activated', v_coupon.uses_per_customer, v_coupon.ends_at)
  returning id into v_id;

  update public.coupons set activations_count = activations_count + 1 where id = v_coupon.id;
  return v_id;
end;
$$;

create function public.redeem_reward(p_reward_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_customer uuid := private.current_customer_id();
  v_settings public.program_settings;
  v_reward public.rewards;
  v_balance integer;
  v_id uuid;
begin
  select * into v_settings from public.program_settings;
  select * into v_reward from public.rewards where id = p_reward_id and is_active for update;
  if v_reward.id is null then
    perform private.fail('reward_unavailable', 'Ta nagroda jest już niedostępna');
  end if;
  if v_reward.stock is not null and v_reward.stock <= 0 then
    perform private.fail('reward_sold_out', 'Ta nagroda chwilowo się skończyła');
  end if;

  select points_balance into v_balance from public.customers where id = v_customer for update;
  if v_balance < v_reward.points_cost then
    perform private.fail('not_enough_points', 'Masz za mało punktów na tę nagrodę');
  end if;
  if (select count(*) from public.reward_redemptions
      where customer_id = v_customer and status = 'active') >= v_settings.max_active_rewards then
    perform private.fail('too_many_active_rewards', 'Najpierw odbierz nagrody, które już masz');
  end if;

  insert into public.reward_redemptions (customer_id, reward_id, points_spent, expires_at)
  values (
    v_customer, v_reward.id, v_reward.points_cost,
    now() + make_interval(days => coalesce(v_reward.valid_days, v_settings.reward_valid_days))
  )
  returning id into v_id;

  insert into public.points_ledger (customer_id, delta, kind, redemption_id)
  values (v_customer, -v_reward.points_cost, 'reward', v_id);

  if v_reward.stock is not null then
    update public.rewards set stock = stock - 1 where id = v_reward.id;
  end if;
  return v_id;
end;
$$;

create function private.release_redemption(p_id uuid, p_status public.redemption_status)
returns public.reward_redemptions
language plpgsql
set search_path = ''
as $$
declare
  v_row public.reward_redemptions;
begin
  update public.reward_redemptions set status = p_status
  where id = p_id and status = 'active'
  returning * into v_row;
  if v_row.id is null then
    return null;
  end if;
  insert into public.points_ledger (customer_id, delta, kind, redemption_id)
  values (v_row.customer_id, v_row.points_spent, 'reward_refund', v_row.id);
  update public.rewards set stock = stock + 1 where id = v_row.reward_id and stock is not null;
  return v_row;
end;
$$;

create function public.cancel_reward_redemption(p_redemption_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_customer uuid := private.current_customer_id();
begin
  perform 1 from public.reward_redemptions
  where id = p_redemption_id and customer_id = v_customer and status = 'active'
  for update;
  if not found then
    perform private.fail('redemption_not_active', 'Tej nagrody nie da się już anulować');
  end if;
  perform private.release_redemption(p_redemption_id, 'cancelled');
end;
$$;

create function public.coupons_for_store(p_store_id uuid default null)
returns setof public.coupons
language sql
stable
security definer
set search_path = ''
as $$
  select c.* from public.coupons c
  where c.audience = 'everyone' and c.is_active and c.starts_at <= now() and c.ends_at > now()
    and (p_store_id is null or private.coupon_covers_store(c.id, p_store_id))
  order by c.sort_order, c.ends_at
$$;

alter table public.coupons enable row level security;
alter table public.coupon_stores enable row level security;
alter table public.customer_coupons enable row level security;
alter table public.rewards enable row level security;
alter table public.reward_redemptions enable row level security;

create policy coupons_select_public on public.coupons
  for select to anon, authenticated
  using (is_active and audience = 'everyone' and starts_at <= now() and ends_at > now());
create policy coupons_select_owned on public.coupons
  for select to authenticated
  using (exists (
    select 1 from public.customer_coupons cc
    where cc.coupon_id = coupons.id and cc.customer_id = (select auth.uid())
  ));

create policy coupon_stores_select on public.coupon_stores
  for select to anon, authenticated using (true);

create policy customer_coupons_select_own on public.customer_coupons
  for select to authenticated using (customer_id = (select auth.uid()));

create policy rewards_select on public.rewards
  for select to anon, authenticated using (is_active);
create policy rewards_select_redeemed on public.rewards
  for select to authenticated
  using (exists (
    select 1 from public.reward_redemptions rr
    where rr.reward_id = rewards.id and rr.customer_id = (select auth.uid())
  ));

create policy reward_redemptions_select_own on public.reward_redemptions
  for select to authenticated using (customer_id = (select auth.uid()));

grant select on public.coupons, public.coupon_stores, public.rewards to anon, authenticated;
grant select on public.customer_coupons, public.reward_redemptions to authenticated;

grant execute on function public.coupons_for_store to anon, authenticated;
grant execute on function public.activate_coupon, public.redeem_reward, public.cancel_reward_redemption to authenticated;
