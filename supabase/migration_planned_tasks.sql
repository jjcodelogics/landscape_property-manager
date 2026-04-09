-- ═══════════════════════════════════════════════════════════════
-- Planned Tasks Migration
-- Adds table for planning future zone work
-- ═══════════════════════════════════════════════════════════════

-- Create planned_tasks table
CREATE TABLE IF NOT EXISTS planned_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  zone_id UUID NOT NULL REFERENCES zones(id) ON DELETE CASCADE,
  estimated_minutes INTEGER NOT NULL CHECK (estimated_minutes > 0),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(date, zone_id) -- Prevent duplicate planning for same zone on same day
);

-- Add index for faster date range queries
CREATE INDEX idx_planned_tasks_date ON planned_tasks(date);
CREATE INDEX idx_planned_tasks_zone_id ON planned_tasks(zone_id);

-- Add RLS policies
ALTER TABLE planned_tasks ENABLE ROW LEVEL SECURITY;

-- Allow all operations for now (adjust based on your auth setup)
CREATE POLICY "Allow all operations on planned_tasks"
  ON planned_tasks
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Add comment
COMMENT ON TABLE planned_tasks IS 'Stores planned future work assignments of zones to specific dates';
