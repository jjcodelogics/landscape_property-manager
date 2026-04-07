-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Zones table
create table if not exists zones (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  name text,
  type text not null check (type in ('grass', 'waste', 'maintenance')),
  instructions text,
  geojson jsonb not null,
  last_worked_at timestamptz,
  next_scheduled_work timestamptz,
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
-- Allow public read access (viewing zones on map)
create policy "Allow public read access to zones"
  on zones for select
  using (true);

-- Require authentication for write operations
create policy "Authenticated users can insert zones"
  on zones for insert
  to authenticated
  with check (true);

create policy "Authenticated users can update zones"
  on zones for update
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated users can delete zones"
  on zones for delete
  to authenticated
  using (true);

-- RLS Policies for tasks table
-- Allow public read access (viewing task history)
create policy "Allow public read access to tasks"
  on tasks for select
  using (true);

-- Require authentication for task creation
create policy "Authenticated users can insert tasks"
  on tasks for insert
  to authenticated
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
alter table zones add constraint zones_title_length_check 
  check (char_length(title) <= 200);

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
comment on column zones.title is 'Zone title (required, max 200 chars)';
comment on column zones.last_worked_at is 'Last work completion date';
comment on column zones.next_scheduled_work is 'Estimated next work date';
comment on column zones.geojson is 'GeoJSON geometry data (max 1MB)';
comment on column tasks.duration_minutes is 'Task duration in minutes (max 1440 = 24 hours)';

-- NOTE: RLS policies now require authentication for write operations.
-- To allow anonymous writes during development/testing, you can temporarily run:
-- drop policy "Authenticated users can insert zones" on zones;
-- create policy "Allow insert for zones" on zones for insert with check (true);
-- 
-- For production with user-specific permissions, consider adding:
-- - User ownership tracking (add user_id columns)
-- - Admin role checks for delete operations
-- - Audit logging for sensitive operations
