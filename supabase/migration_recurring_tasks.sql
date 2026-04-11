-- ═══════════════════════════════════════════════════════════════
-- Recurring Tasks Migration
-- Simple recurring task suggestions system
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS recurring_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('zone', 'custom')),
  zone_id UUID REFERENCES zones(id) ON DELETE CASCADE,
  custom_description TEXT,
  frequency TEXT NOT NULL CHECK (frequency IN ('weekly', 'biweekly', 'monthly')),
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT zone_or_custom CHECK (
    (type = 'zone' AND zone_id IS NOT NULL AND custom_description IS NULL) OR
    (type = 'custom' AND zone_id IS NULL AND custom_description IS NOT NULL)
  )
);

-- Add indexes
CREATE INDEX idx_recurring_tasks_zone_id ON recurring_tasks(zone_id);
CREATE INDEX idx_recurring_tasks_day ON recurring_tasks(day_of_week);

-- Add RLS policies
ALTER TABLE recurring_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on recurring_tasks"
  ON recurring_tasks
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Add comments
COMMENT ON TABLE recurring_tasks IS 'Recurring task templates that generate weekly suggestions';
COMMENT ON COLUMN recurring_tasks.day_of_week IS '0=Monday, 1=Tuesday, ..., 6=Sunday (ISO 8601)';
COMMENT ON COLUMN recurring_tasks.frequency IS 'How often: weekly, biweekly, monthly';
