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
