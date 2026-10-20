drop policy coupons_select on public.coupons;
create policy coupons_select_anon on public.coupons
  for select to anon
  using (is_active and audience = 'everyone' and starts_at <= now() and ends_at > now());
create policy coupons_select_authenticated on public.coupons
  for select to authenticated
  using (
    (is_active and audience = 'everyone' and starts_at <= now() and ends_at > now())
    or exists (
      select 1 from public.customer_coupons cc
      where cc.coupon_id = coupons.id and cc.customer_id = (select auth.uid())
    )
  );

drop policy rewards_select on public.rewards;
create policy rewards_select_anon on public.rewards
  for select to anon using (is_active);
create policy rewards_select_authenticated on public.rewards
  for select to authenticated
  using (
    is_active
    or exists (
      select 1 from public.reward_redemptions rr
      where rr.reward_id = rewards.id and rr.customer_id = (select auth.uid())
    )
  );
