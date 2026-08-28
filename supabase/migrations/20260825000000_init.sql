-- RV Park Tracker initial schema
-- Two-user shared CRM: no multi-tenancy, any authenticated user can read/write everything.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- parks
-- ---------------------------------------------------------------------------
create table if not exists public.parks (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text,
  city text,
  state text,
  zip text,
  owner_name text,
  phone text,
  email text,
  asking_price numeric,
  num_sites integer,
  status text not null default 'lead'
    constraint parks_status_check
    check (status in ('lead', 'contacted', 'negotiating', 'passed', 'closed')),
  rating integer
    constraint parks_rating_check
    check (rating is null or (rating between 1 and 5)),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.parks is 'RV parks being evaluated for acquisition.';

create index if not exists parks_status_idx on public.parks (status);
create index if not exists parks_state_idx on public.parks (state);

-- keep updated_at current on every update
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists parks_set_updated_at on public.parks;
create trigger parks_set_updated_at
  before update on public.parks
  for each row
  execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- activity
-- ---------------------------------------------------------------------------
create table if not exists public.activity (
  id uuid primary key default gen_random_uuid(),
  park_id uuid not null references public.parks (id) on delete cascade,
  date date not null default current_date,
  type text not null
    constraint activity_type_check
    check (type in ('call', 'email', 'visit', 'other')),
  notes text,
  created_at timestamptz not null default now()
);

comment on table public.activity is 'Timeline of interactions with a given park.';

create index if not exists activity_park_id_idx on public.activity (park_id);
create index if not exists activity_date_idx on public.activity (date);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.parks enable row level security;
alter table public.activity enable row level security;

-- Any authenticated user (the two shared accounts) can do everything.
create policy "Authenticated users can select parks"
  on public.parks for select
  to authenticated
  using (true);

create policy "Authenticated users can insert parks"
  on public.parks for insert
  to authenticated
  with check (true);

create policy "Authenticated users can update parks"
  on public.parks for update
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated users can delete parks"
  on public.parks for delete
  to authenticated
  using (true);

create policy "Authenticated users can select activity"
  on public.activity for select
  to authenticated
  using (true);

create policy "Authenticated users can insert activity"
  on public.activity for insert
  to authenticated
  with check (true);

create policy "Authenticated users can update activity"
  on public.activity for update
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated users can delete activity"
  on public.activity for delete
  to authenticated
  using (true);
