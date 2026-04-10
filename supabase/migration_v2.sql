-- Migration v2: Field Operations Upgrade
-- Run this after the initial schema.sql

-- ─── Zone improvements ──────────────────────────────────────────────────────

-- Add area_m2 and tags to zones
alter table zones
  add column if not exists area_m2 numeric,
  add column if not exists tags text[] default '{}';

-- ─── Task improvements ──────────────────────────────────────────────────────

-- Add new fields to tasks
alter table tasks
  add column if not exists weather_condition text
    check (weather_condition in ('good', 'normal', 'bad')),
  add column if not exists difficulty text
    check (difficulty in ('normal', 'dirty', 'heavy')),
  add column if not exists mode text
    check (mode in ('productive', 'non_productive')),
  add column if not exists productive_minutes integer
    default 0 check (productive_minutes >= 0),
  add column if not exists non_productive_minutes integer
    default 0 check (non_productive_minutes >= 0);

-- ─── Points table ────────────────────────────────────────────────────────────

create table if not exists points (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  type text not null default 'trash_bin'
    check (type in ('trash_bin', 'asset', 'other')),
  notes text,
  geojson jsonb not null,
  created_at timestamptz default now()
);

alter table points add constraint points_title_length_check
  check (char_length(title) <= 200);

-- ─── Routes table ────────────────────────────────────────────────────────────

create table if not exists routes (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  point_ids uuid[] default '{}',
  created_at timestamptz default now()
);

alter table routes add constraint routes_title_length_check
  check (char_length(title) <= 200);

-- ─── Daily plans table ───────────────────────────────────────────────────────

create table if not exists daily_plans (
  id uuid primary key default uuid_generate_v4(),
  plan_date date not null,
  zone_ids uuid[] default '{}',
  team_members integer default 1,
  hours_per_member numeric default 8,
  notes text,
  created_at timestamptz default now()
);

-- ─── RLS ─────────────────────────────────────────────────────────────────────

alter table points enable row level security;
alter table routes enable row level security;
alter table daily_plans enable row level security;

-- Public read access
create policy "Allow public read access to points"
  on points for select using (true);

create policy "Allow public read access to routes"
  on routes for select using (true);

create policy "Allow public read access to daily_plans"
  on daily_plans for select using (true);

-- Authenticated write access
create policy "Authenticated users can insert points"
  on points for insert to authenticated with check (true);

create policy "Authenticated users can update points"
  on points for update to authenticated using (true) with check (true);

create policy "Authenticated users can delete points"
  on points for delete to authenticated using (true);

create policy "Authenticated users can insert routes"
  on routes for insert to authenticated with check (true);

create policy "Authenticated users can update routes"
  on routes for update to authenticated using (true) with check (true);

create policy "Authenticated users can delete routes"
  on routes for delete to authenticated using (true);

create policy "Authenticated users can insert daily_plans"
  on daily_plans for insert to authenticated with check (true);

create policy "Authenticated users can update daily_plans"
  on daily_plans for update to authenticated using (true) with check (true);

create policy "Authenticated users can delete daily_plans"
  on daily_plans for delete to authenticated using (true);

-- ─── Indexes ─────────────────────────────────────────────────────────────────

create index if not exists idx_zones_tags on zones using gin (tags);
create index if not exists idx_points_type on points (type);
create index if not exists idx_points_created_at on points (created_at desc);
create index if not exists idx_routes_created_at on routes (created_at desc);
create index if not exists idx_daily_plans_date on daily_plans (plan_date desc);
create index if not exists idx_tasks_weather on tasks (weather_condition);
create index if not exists idx_tasks_mode on tasks (mode);

-- ─── Comments ────────────────────────────────────────────────────────────────

comment on column zones.area_m2 is 'Calculated polygon area in square metres';
comment on column zones.tags is 'Array of tag strings for grouping and filtering';
comment on column tasks.weather_condition is 'Weather during the task: good | normal | bad';
comment on column tasks.difficulty is 'Task difficulty: normal | dirty | heavy';
comment on column tasks.mode is 'Primary mode of the task: productive | non_productive';
comment on column tasks.productive_minutes is 'Productive time recorded by chess clock';
comment on column tasks.non_productive_minutes is 'Non-productive time recorded by chess clock';
comment on table points is 'Point markers (trash bins, assets) — not polygons';
comment on table routes is 'Named groups of points for route-based logging';
comment on table daily_plans is 'Daily work plans with zone selection and team capacity';
