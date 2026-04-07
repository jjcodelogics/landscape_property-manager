-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Zones table
create table if not exists zones (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  type text not null check (type in ('grass', 'waste', 'maintenance')),
  instructions text,
  geojson jsonb not null,
  created_at timestamptz default now()
);

-- Tasks table
create table if not exists tasks (
  id uuid primary key default uuid_generate_v4(),
  zone_id uuid references zones(id) on delete cascade,
  task_type text not null check (task_type in ('mowing', 'waste', 'maintenance')),
  duration_minutes integer not null check (duration_minutes > 0),
  notes text,
  created_at timestamptz default now()
);

-- Enable Row Level Security
alter table zones enable row level security;
alter table tasks enable row level security;

-- RLS Policies for zones table
-- Allow anonymous read access (public viewing)
create policy "Allow public read access to zones"
  on zones for select
  using (true);

-- Allow anonymous insert (for now - restrict this in production with authentication)
create policy "Allow insert for zones"
  on zones for insert
  with check (true);

-- Allow anonymous update (for now - restrict this in production with authentication)
create policy "Allow update for zones"
  on zones for update
  using (true);

-- Allow anonymous delete (for now - restrict this in production with authentication)
create policy "Allow delete for zones"
  on zones for delete
  using (true);

-- RLS Policies for tasks table
-- Allow anonymous read access
create policy "Allow public read access to tasks"
  on tasks for select
  using (true);

-- Allow anonymous insert (for now - restrict this in production with authentication)
create policy "Allow insert for tasks"
  on tasks for insert
  with check (true);

-- Indexes for performance
create index if not exists idx_zones_type on zones(type);
create index if not exists idx_zones_created_at on zones(created_at desc);
create index if not exists idx_tasks_zone_id on tasks(zone_id);
create index if not exists idx_tasks_task_type on tasks(task_type);
create index if not exists idx_tasks_created_at on tasks(created_at desc);

-- Add constraint to limit geojson size (1MB)
alter table zones add constraint zones_geojson_size_check 
  check (pg_column_size(geojson) < 1048576);

-- Add constraint to limit text field sizes
alter table zones add constraint zones_name_length_check 
  check (char_length(name) <= 200);
  
alter table zones add constraint zones_instructions_length_check 
  check (char_length(instructions) <= 2000);

alter table tasks add constraint tasks_notes_length_check 
  check (char_length(notes) <= 2000);

alter table tasks add constraint tasks_duration_max_check 
  check (duration_minutes <= 1440); -- Max 24 hours

-- Comments for documentation
comment on table zones is 'Geographical zones for landscape management';
comment on table tasks is 'Tasks performed on zones';
comment on column zones.geojson is 'GeoJSON geometry data (max 1MB)';
comment on column tasks.duration_minutes is 'Task duration in minutes (max 1440 = 24 hours)';

-- NOTE: For production deployment with authentication, update RLS policies to:
-- 1. Replace 'true' with 'auth.role() = ''authenticated''' for write operations
-- 2. Add user-specific policies if needed
-- 3. Consider adding admin role checks for delete operations
-- Example authenticated policy:
-- create policy "Authenticated users can insert zones"
--   on zones for insert
--   to authenticated
--   with check (true);
