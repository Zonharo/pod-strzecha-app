create type public.rating_tag as enum (
  'service', 'freshness', 'taste', 'cleanliness', 'choice', 'wait_time', 'prices'
);
create type public.notification_kind as enum (
  'welcome', 'points_earned', 'points_refunded', 'points_expiring', 'points_expired',
  'reward_expiring', 'reward_expired', 'birthday', 'offer', 'system'
);
create type public.push_platform as enum ('ios', 'android');

create table public.purchase_ratings (
  purchase_id  uuid primary key references public.purchases (id) on delete cascade,
  customer_id  uuid not null references public.customers (id) on delete cascade,
  store_id     uuid not null references public.stores (id) on delete restrict,
  rating       smallint not null check (rating between 1 and 5),
  tags         public.rating_tag[] not null default '{}' check (cardinality(tags) <= 7),
  comment      text check (char_length(comment) <= 500),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index purchase_ratings_customer_id_idx on public.purchase_ratings (customer_id);
create index purchase_ratings_store_idx on public.purchase_ratings (store_id, created_at desc);

create trigger purchase_ratings_set_updated_at before update on public.purchase_ratings
  for each row execute function private.set_updated_at();

create function public.rate_purchase(
  p_purchase_id uuid,
  p_rating smallint,
  p_tags public.rating_tag[] default '{}',
  p_comment text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_customer uuid := private.current_customer_id();
  v_purchase public.purchases;
begin
  select * into v_purchase from public.purchases where id = p_purchase_id and customer_id = v_customer;
  if v_purchase.id is null then
    perform private.fail('purchase_not_found', 'Nie znaleźliśmy tych zakupów');
  end if;
  if v_purchase.refunded_at is not null
     or v_purchase.occurred_at < now() - make_interval(days => (select rating_window_days from public.program_settings)) then
    perform private.fail('rating_closed', 'Te zakupy można już tylko przeglądać');
  end if;

  insert into public.purchase_ratings (purchase_id, customer_id, store_id, rating, tags, comment)
  values (
    v_purchase.id, v_customer, v_purchase.store_id, p_rating,
    array(select distinct unnest(coalesce(p_tags, '{}'))), nullif(btrim(p_comment), '')
  )
  on conflict (purchase_id) do update
  set rating = excluded.rating, tags = excluded.tags, comment = excluded.comment;
end;
$$;

create table public.offers (
  id          uuid primary key default gen_random_uuid(),
  title       text not null check (char_length(title) between 1 and 80),
  body        text not null default '' check (char_length(body) <= 1000),
  image_path  text check (char_length(image_path) <= 200),
  coupon_id   uuid references public.coupons (id) on delete set null,
  reward_id   uuid references public.rewards (id) on delete set null,
  link_url    text check (link_url ~ '^https://' and char_length(link_url) <= 300),
  scope       public.content_scope not null default 'network',
  region_id   uuid references public.regions (id) on delete restrict,
  starts_at   timestamptz not null default now(),
  ends_at     timestamptz not null,
  is_active   boolean not null default true,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint offers_dates check (ends_at > starts_at),
  constraint offers_region_scope check ((scope = 'region') = (region_id is not null))
);

create index offers_coupon_id_idx on public.offers (coupon_id);
create index offers_reward_id_idx on public.offers (reward_id);
create index offers_region_id_idx on public.offers (region_id);
create index offers_listing_idx on public.offers (ends_at, sort_order) where is_active;

create trigger offers_set_updated_at before update on public.offers
  for each row execute function private.set_updated_at();

create table public.offer_stores (
  offer_id  uuid not null references public.offers (id) on delete cascade,
  store_id  uuid not null references public.stores (id) on delete cascade,
  primary key (offer_id, store_id)
);

create index offer_stores_store_id_idx on public.offer_stores (store_id);

create function public.offers_for_store(p_store_id uuid default null)
returns setof public.offers
language sql
stable
security definer
set search_path = ''
as $$
  select o.* from public.offers o
  where o.is_active and o.starts_at <= now() and o.ends_at > now()
    and (
      p_store_id is null
      or o.scope = 'network'
      or (o.scope = 'region' and exists (
        select 1 from public.stores s where s.id = p_store_id and s.region_id = o.region_id
      ))
      or (o.scope = 'stores' and exists (
        select 1 from public.offer_stores os where os.offer_id = o.id and os.store_id = p_store_id
      ))
    )
  order by o.sort_order, o.starts_at desc
$$;

create table public.customer_notifications (
  id           uuid primary key default gen_random_uuid(),
  customer_id  uuid not null references public.customers (id) on delete cascade,
  kind         public.notification_kind not null,
  title        text not null check (char_length(title) between 1 and 80),
  body         text not null default '' check (char_length(body) <= 300),
  link         text check (char_length(link) <= 200),
  read_at      timestamptz,
  created_at   timestamptz not null default now()
);

create index customer_notifications_customer_idx on public.customer_notifications (customer_id, created_at desc);
create index customer_notifications_unread_idx on public.customer_notifications (customer_id) where read_at is null;

create function private.notify(
  p_customer_id uuid,
  p_kind public.notification_kind,
  p_title text,
  p_body text,
  p_link text default null
)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.customer_notifications (customer_id, kind, title, body, link)
  values (p_customer_id, p_kind, p_title, p_body, p_link)
$$;

create function private.points_word(p_count integer)
returns text
language sql
immutable
set search_path = ''
as $$
  select case
    when abs(p_count) = 1 then 'kłosek'
    when abs(p_count) % 10 between 2 and 4 and abs(p_count) % 100 not between 12 and 14 then 'kłoski'
    else 'kłosków'
  end
$$;

create function private.notify_ledger_entry()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_store text;
  v_count integer := abs(new.delta);
begin
  if new.kind = 'welcome' then
    perform private.notify(new.customer_id, 'welcome', 'Witamy w programie',
      format('Na dobry początek masz %s %s.', v_count, private.points_word(v_count)), '/card');
  elsif new.kind = 'purchase' then
    select s.name into v_store from public.purchases p join public.stores s on s.id = p.store_id where p.id = new.purchase_id;
    perform private.notify(new.customer_id, 'points_earned', 'Kłoski już są',
      format('Za zakupy w sklepie %s dostajesz %s %s.', coalesce(v_store, 'Pod Strzechą'), v_count, private.points_word(v_count)),
      '/history/' || new.purchase_id);
  elsif new.kind = 'purchase_refund' then
    perform private.notify(new.customer_id, 'points_refunded', 'Zwrot zakupów',
      format('Po zwrocie zakupów odjęliśmy %s %s.', v_count, private.points_word(v_count)),
      '/history/' || new.purchase_id);
  end if;
  return new;
end;
$$;

create trigger points_ledger_notify after insert on public.points_ledger
  for each row execute function private.notify_ledger_entry();

create table public.push_tokens (
  id            uuid primary key default gen_random_uuid(),
  customer_id   uuid not null references public.customers (id) on delete cascade,
  token         text not null unique check (char_length(token) between 1 and 255),
  platform      public.push_platform not null,
  created_at    timestamptz not null default now(),
  last_seen_at  timestamptz not null default now()
);

create index push_tokens_customer_id_idx on public.push_tokens (customer_id);

create function public.register_push_token(p_token text, p_platform public.push_platform)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_customer uuid := auth.uid();
begin
  if v_customer is null or not exists (select 1 from public.customers where id = v_customer) then
    perform private.fail('not_authenticated', 'Zaloguj się, żeby kontynuować');
  end if;
  insert into public.push_tokens (customer_id, token, platform)
  values (v_customer, p_token, p_platform)
  on conflict (token) do update
  set customer_id = excluded.customer_id, platform = excluded.platform, last_seen_at = now();
end;
$$;

create function public.unregister_push_token(p_token text)
returns void
language sql
security definer
set search_path = ''
as $$
  delete from public.push_tokens where token = p_token and customer_id = auth.uid()
$$;

create function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    perform private.fail('not_authenticated', 'Zaloguj się, żeby kontynuować');
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;

create function public.export_my_data()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'exported_at', now(),
    'account', (select jsonb_build_object('email', u.email, 'created_at', u.created_at) from auth.users u where u.id = c.id),
    'customer', to_jsonb(c),
    'consents', coalesce((select jsonb_agg(to_jsonb(x) order by x.created_at) from public.customer_consents x where x.customer_id = c.id), '[]'),
    'cards', coalesce((select jsonb_agg(jsonb_build_object('number', x.number, 'status', x.status, 'created_at', x.created_at)) from public.loyalty_cards x where x.customer_id = c.id), '[]'),
    'points', coalesce((select jsonb_agg(to_jsonb(x) order by x.created_at) from public.points_ledger x where x.customer_id = c.id), '[]'),
    'purchases', coalesce((select jsonb_agg(to_jsonb(p) || jsonb_build_object(
        'items', coalesce((select jsonb_agg(to_jsonb(i) order by i.position) from public.purchase_items i where i.purchase_id = p.id), '[]')
      ) order by p.occurred_at) from public.purchases p where p.customer_id = c.id), '[]'),
    'coupons', coalesce((select jsonb_agg(to_jsonb(x) order by x.created_at) from public.customer_coupons x where x.customer_id = c.id), '[]'),
    'rewards', coalesce((select jsonb_agg(to_jsonb(x) order by x.created_at) from public.reward_redemptions x where x.customer_id = c.id), '[]'),
    'ratings', coalesce((select jsonb_agg(to_jsonb(x) order by x.created_at) from public.purchase_ratings x where x.customer_id = c.id), '[]'),
    'notifications', coalesce((select jsonb_agg(to_jsonb(x) order by x.created_at) from public.customer_notifications x where x.customer_id = c.id), '[]'),
    'push_tokens', coalesce((select jsonb_agg(jsonb_build_object('platform', x.platform, 'created_at', x.created_at)) from public.push_tokens x where x.customer_id = c.id), '[]')
  )
  from public.customers c
  where c.id = auth.uid()
$$;

alter table public.purchase_ratings enable row level security;
alter table public.offers enable row level security;
alter table public.offer_stores enable row level security;
alter table public.customer_notifications enable row level security;
alter table public.push_tokens enable row level security;

create policy purchase_ratings_select_own on public.purchase_ratings
  for select to authenticated using (customer_id = (select auth.uid()));

create policy offers_select on public.offers
  for select to anon, authenticated using (is_active and starts_at <= now() and ends_at > now());

create policy offer_stores_select on public.offer_stores
  for select to anon, authenticated using (true);

create policy customer_notifications_select_own on public.customer_notifications
  for select to authenticated using (customer_id = (select auth.uid()));
create policy customer_notifications_update_own on public.customer_notifications
  for update to authenticated
  using (customer_id = (select auth.uid()))
  with check (customer_id = (select auth.uid()));

create policy push_tokens_select_own on public.push_tokens
  for select to authenticated using (customer_id = (select auth.uid()));

grant select on public.offers, public.offer_stores to anon, authenticated;
grant select on public.purchase_ratings, public.customer_notifications, public.push_tokens to authenticated;
grant update (read_at) on public.customer_notifications to authenticated;

grant execute on function public.offers_for_store to anon, authenticated;
grant execute on function
  public.rate_purchase, public.register_push_token, public.unregister_push_token,
  public.delete_my_account, public.export_my_data
to authenticated;

alter publication supabase_realtime add table
  public.customers, public.customer_notifications, public.customer_coupons, public.reward_redemptions;
