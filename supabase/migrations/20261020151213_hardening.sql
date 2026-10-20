create or replace function public.coupons_for_store(p_store_id uuid default null)
returns setof public.coupons
language sql
stable
security invoker
set search_path = ''
as $$
  select c.* from public.coupons c
  where c.audience = 'everyone' and c.is_active and c.starts_at <= now() and c.ends_at > now()
    and (
      p_store_id is null
      or c.scope = 'network'
      or (c.scope = 'region' and exists (
        select 1 from public.stores s where s.id = p_store_id and s.region_id = c.region_id
      ))
      or (c.scope = 'stores' and exists (
        select 1 from public.coupon_stores cs where cs.coupon_id = c.id and cs.store_id = p_store_id
      ))
    )
  order by c.sort_order, c.ends_at
$$;

alter function public.offers_for_store(uuid) security invoker;

drop policy coupons_select_public on public.coupons;
drop policy coupons_select_owned on public.coupons;
create policy coupons_select on public.coupons
  for select to anon, authenticated
  using (
    (is_active and audience = 'everyone' and starts_at <= now() and ends_at > now())
    or exists (
      select 1 from public.customer_coupons cc
      where cc.coupon_id = coupons.id and cc.customer_id = (select auth.uid())
    )
  );

drop policy rewards_select on public.rewards;
drop policy rewards_select_redeemed on public.rewards;
create policy rewards_select on public.rewards
  for select to anon, authenticated
  using (
    is_active
    or exists (
      select 1 from public.reward_redemptions rr
      where rr.reward_id = rewards.id and rr.customer_id = (select auth.uid())
    )
  );

create index checkout_sessions_completed_purchase_id_idx on private.checkout_sessions (completed_purchase_id);
create index program_settings_birthday_coupon_id_idx on public.program_settings (birthday_coupon_id);
