create extension if not exists pgcrypto with schema extensions;

alter default privileges in schema public revoke all on tables from anon, authenticated;
alter default privileges in schema public revoke all on sequences from anon, authenticated;
alter default privileges in schema public revoke all on functions from anon, authenticated;
alter default privileges revoke execute on functions from public;

create schema private;
revoke all on schema private from public, anon, authenticated;

create function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create function private.fail(p_hint text, p_message text)
returns void
language plpgsql
set search_path = ''
as $$
begin
  raise exception '%', p_message using errcode = 'P0001', hint = p_hint;
end;
$$;

create table public.regions (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique check (char_length(name) between 1 and 60),
  created_at  timestamptz not null default now()
);

create table public.stores (
  id             uuid primary key default gen_random_uuid(),
  code           text not null unique check (code ~ '^[A-Z]{3}-[0-9]{2,3}$'),
  name           text not null check (char_length(name) between 1 and 80),
  address        text not null check (char_length(address) between 1 and 120),
  city           text not null check (char_length(city) between 1 and 60),
  postal_code    text check (postal_code ~ '^[0-9]{2}-[0-9]{3}$'),
  region_id      uuid references public.regions (id) on delete set null,
  latitude       double precision check (latitude between -90 and 90),
  longitude      double precision check (longitude between -180 and 180),
  opening_hours  jsonb check (opening_hours is null or jsonb_typeof(opening_hours) = 'object'),
  phone          text check (char_length(phone) <= 20),
  is_active      boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  constraint stores_location_complete check ((latitude is null) = (longitude is null))
);

create index stores_region_id_idx on public.stores (region_id);

create trigger stores_set_updated_at before update on public.stores
  for each row execute function private.set_updated_at();

create table public.program_settings (
  id                        boolean primary key default true check (id),
  points_per_zloty          numeric(6,2) not null default 1 check (points_per_zloty >= 0),
  welcome_bonus             integer not null default 50 check (welcome_bonus >= 0),
  points_inactivity_months  integer not null default 12 check (points_inactivity_months between 1 and 60),
  reward_valid_days         integer not null default 14 check (reward_valid_days between 1 and 365),
  max_active_rewards        integer not null default 5 check (max_active_rewards between 1 and 50),
  rating_window_days        integer not null default 7 check (rating_window_days between 1 and 90),
  max_purchase_total        numeric(10,2) not null default 2000 check (max_purchase_total > 0),
  daily_points_cap          integer not null default 1000 check (daily_points_cap > 0),
  terms_version             text not null default '2026-10-20' check (char_length(terms_version) between 1 and 20),
  updated_at                timestamptz not null default now()
);

insert into public.program_settings default values;

create trigger program_settings_set_updated_at before update on public.program_settings
  for each row execute function private.set_updated_at();

alter table public.regions enable row level security;
alter table public.stores enable row level security;
alter table public.program_settings enable row level security;

create policy regions_select on public.regions
  for select to anon, authenticated using (true);

create policy stores_select on public.stores
  for select to anon, authenticated using (is_active);

create policy program_settings_select on public.program_settings
  for select to anon, authenticated using (true);

grant select on public.regions, public.stores, public.program_settings to anon, authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;
