create extension if not exists pg_cron with schema pg_catalog;

grant usage on schema cron to postgres;
grant all privileges on all tables in schema cron to postgres;

create function private.expire_rewards()
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
      format('%s jest ważna jeszcze dwa dni. Pokaż kartę przy kasie.', v_row.title), '/rewards/' || v_row.id);
  end loop;
end;
$$;

create function private.notify_reward_expired()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status = 'expired' and old.status = 'active' then
    perform private.notify(new.customer_id, 'reward_expired', 'Nagroda wygasła',
      format('Termin odbioru minął. Oddaliśmy Ci %s %s.', new.points_spent, private.points_word(new.points_spent)),
      '/rewards');
  end if;
  return new;
end;
$$;

create trigger reward_redemptions_notify_expired after update of status on public.reward_redemptions
  for each row execute function private.notify_reward_expired();

create function private.expire_points()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_months integer := (select points_inactivity_months from public.program_settings);
  v_row record;
begin
  for v_row in
    select c.id, c.points_balance from public.customers c
    where c.points_balance > 0
      and c.last_activity_at < now() - make_interval(months => v_months)
    for update skip locked
  loop
    insert into public.points_ledger (customer_id, delta, kind, note)
    values (v_row.id, -v_row.points_balance, 'expiry', 'Brak zakupów przez ' || v_months || ' mies.');
    perform private.notify(v_row.id, 'points_expired', 'Kłoski wygasły',
      format('Przez %s mies. nie było zakupów, więc kłoski wygasły. Zbieraj od nowa przy kolejnych zakupach.', v_months),
      '/card');
  end loop;

  for v_row in
    update public.customers c
    set points_expiry_reminded_at = now()
    where c.points_balance > 0
      and c.status = 'active'
      and c.last_activity_at < now() - make_interval(months => v_months) + interval '30 days'
      and (c.points_expiry_reminded_at is null or c.points_expiry_reminded_at < c.last_activity_at)
    returning c.id, c.points_balance
  loop
    perform private.notify(v_row.id, 'points_expiring', 'Twoje kłoski niedługo wygasną',
      format('Masz %s %s. Zrób zakupy w ciągu 30 dni, a zostaną z Tobą.', v_row.points_balance, private.points_word(v_row.points_balance)),
      '/card');
  end loop;
end;
$$;

create function private.grant_birthday_coupons()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_today date := (now() at time zone 'Europe/Warsaw')::date;
  v_coupon public.coupons;
  v_row record;
begin
  select c.* into v_coupon
  from public.program_settings s
  join public.coupons c on c.id = s.birthday_coupon_id
  where c.is_active and c.audience = 'personal' and c.starts_at <= now() and c.ends_at > now();
  if v_coupon.id is null then
    return;
  end if;

  for v_row in
    select cu.id from public.customers cu
    where cu.status = 'active'
      and cu.terms_accepted_at is not null
      and cu.birthday_month = extract(month from v_today)
      and (
        cu.birthday_day = extract(day from v_today)
        or (cu.birthday_month = 2 and cu.birthday_day = 29 and extract(day from v_today) = 28
            and extract(day from (v_today + 1)) = 1)
      )
      and not exists (
        select 1 from public.customer_coupons cc
        where cc.customer_id = cu.id and cc.coupon_id = v_coupon.id and cc.source = 'birthday'
          and cc.valid_from > now() - interval '300 days'
      )
  loop
    insert into public.customer_coupons (customer_id, coupon_id, source, uses_left, valid_until)
    values (v_row.id, v_coupon.id, 'birthday', v_coupon.uses_per_customer,
            now() + make_interval(days => coalesce(v_coupon.valid_days_after_grant, 7)));
    perform private.notify(v_row.id, 'birthday', 'Wszystkiego najlepszego!',
      'Mamy dla Ciebie urodzinowy prezent. Znajdziesz go w kuponach.', '/coupons');
  end loop;
end;
$$;

create function private.cleanup()
returns void
language sql
security definer
set search_path = ''
as $$
  delete from private.checkout_sessions where created_at < now() - interval '2 days';
  delete from public.customer_notifications where created_at < now() - interval '180 days';
  delete from cron.job_run_details where end_time < now() - interval '14 days';
$$;

select cron.schedule('expire-rewards', '*/15 * * * *', 'select private.expire_rewards()');
select cron.schedule('expire-points', '30 2 * * *', 'select private.expire_points()');
select cron.schedule('birthday-coupons', '0 6 * * *', 'select private.grant_birthday_coupons()');
select cron.schedule('cleanup', '0 3 * * *', 'select private.cleanup()');
