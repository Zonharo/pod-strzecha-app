create extension if not exists pg_net with schema extensions;

create table private.push_requests (
  request_id    bigint primary key,
  kind          text not null check (kind in ('send', 'receipts')),
  tokens        text[] not null default '{}',
  ticket_ids    text[] not null default '{}',
  created_at    timestamptz not null default now(),
  processed_at  timestamptz
);

create index push_requests_pending_idx on private.push_requests (created_at) where processed_at is null;

create table private.push_tickets (
  ticket_id           text primary key,
  token               text not null,
  created_at          timestamptz not null default now(),
  receipt_request_id  bigint,
  checked_at          timestamptz
);

create index push_tickets_pending_idx on private.push_tickets (created_at) where receipt_request_id is null;

create function private.send_push()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_tokens text[];
  v_messages jsonb;
  v_request bigint;
begin
  if new.kind = 'offer' and not exists (
    select 1 from public.customers where id = new.customer_id and marketing_push
  ) then
    return new;
  end if;

  select array_agg(t.token) into v_tokens
  from (
    select token from public.push_tokens
    where customer_id = new.customer_id
    order by last_seen_at desc
    limit 10
  ) t;
  if v_tokens is null then
    return new;
  end if;

  select jsonb_agg(jsonb_build_object(
    'to', t.token,
    'title', new.title,
    'body', new.body,
    'sound', 'default',
    'channelId', 'default',
    'priority', 'high',
    'data', jsonb_build_object('link', new.link, 'notificationId', new.id)
  ) order by t.ordinality)
  into v_messages
  from unnest(v_tokens) with ordinality as t (token, ordinality);

  select net.http_post(
    url := 'https://exp.host/--/api/v2/push/send',
    body := v_messages,
    headers := jsonb_build_object('Content-Type', 'application/json', 'Accept', 'application/json'),
    timeout_milliseconds := 10000
  ) into v_request;

  insert into private.push_requests (request_id, kind, tokens) values (v_request, 'send', v_tokens);
  return new;
end;
$$;

create trigger customer_notifications_push after insert on public.customer_notifications
  for each row execute function private.send_push();

create function private.process_push()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_row record;
  v_content jsonb;
  v_ids text[];
  v_request bigint;
begin
  for v_row in
    select pr.request_id, pr.kind, pr.tokens, pr.ticket_ids, r.status_code, r.content
    from private.push_requests pr
    join net._http_response r on r.id = pr.request_id
    where pr.processed_at is null
  loop
    begin
      v_content := v_row.content::jsonb;
    exception when others then
      v_content := null;
    end;

    if v_row.status_code = 200 and v_content is not null and v_row.kind = 'send' then
      delete from public.push_tokens
      where token in (
        select v_row.tokens[t.ordinality]
        from jsonb_array_elements(v_content -> 'data') with ordinality as t (ticket, ordinality)
        where t.ticket ->> 'status' = 'error' and t.ticket -> 'details' ->> 'error' = 'DeviceNotRegistered'
      );
      insert into private.push_tickets (ticket_id, token)
      select t.ticket ->> 'id', v_row.tokens[t.ordinality]
      from jsonb_array_elements(v_content -> 'data') with ordinality as t (ticket, ordinality)
      where t.ticket ->> 'status' = 'ok' and t.ticket ->> 'id' is not null
      on conflict (ticket_id) do nothing;
    elsif v_row.status_code = 200 and v_content is not null and v_row.kind = 'receipts' then
      delete from public.push_tokens
      where token in (
        select pt.token
        from jsonb_each(v_content -> 'data') as r (ticket_id, receipt)
        join private.push_tickets pt on pt.ticket_id = r.ticket_id
        where r.receipt ->> 'status' = 'error' and r.receipt -> 'details' ->> 'error' = 'DeviceNotRegistered'
      );
      update private.push_tickets set checked_at = now() where ticket_id = any (v_row.ticket_ids);
    end if;

    update private.push_requests set processed_at = now() where request_id = v_row.request_id;
  end loop;

  select array_agg(ticket_id) into v_ids
  from (
    select ticket_id from private.push_tickets
    where receipt_request_id is null and created_at < now() - interval '15 minutes'
    order by created_at
    limit 1000
  ) t;
  if v_ids is not null then
    select net.http_post(
      url := 'https://exp.host/--/api/v2/push/getReceipts',
      body := jsonb_build_object('ids', to_jsonb(v_ids)),
      headers := jsonb_build_object('Content-Type', 'application/json', 'Accept', 'application/json'),
      timeout_milliseconds := 10000
    ) into v_request;
    insert into private.push_requests (request_id, kind, ticket_ids) values (v_request, 'receipts', v_ids);
    update private.push_tickets set receipt_request_id = v_request where ticket_id = any (v_ids);
  end if;

  delete from private.push_requests where created_at < now() - interval '2 days';
  delete from private.push_tickets where created_at < now() - interval '2 days';
end;
$$;

select cron.schedule('process-push', '*/10 * * * *', 'select private.process_push()');
