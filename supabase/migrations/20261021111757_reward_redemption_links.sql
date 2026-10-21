create or replace function private.expire_rewards()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_row record;
begin
  for v_row in
    select rr.id from public.reward_redemptions rr
    where rr.status = 'active' and rr.expires_at <= now()
    for update skip locked
  loop
    perform private.release_redemption(v_row.id, 'expired');
  end loop;

  for v_row in
    update public.reward_redemptions rr
    set reminded_at = now()
    from public.rewards r
    where r.id = rr.reward_id
      and rr.status = 'active' and rr.reminded_at is null
      and rr.expires_at <= now() + interval '2 days'
    returning rr.customer_id, rr.id, rr.status, r.title
  loop
    perform private.notify(v_row.customer_id, 'reward_expiring', 'Nagroda czeka na odbiór',
      format('%s jest ważna jeszcze dwa dni. Pokaż kartę przy kasie.', v_row.title),
      '/rewards/redemptions/' || v_row.id);
  end loop;
end;
$$;
