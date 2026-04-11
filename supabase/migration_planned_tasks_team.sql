-- ═══════════════════════════════════════════════════════════════
-- Planned Tasks Team Members Migration
-- Adds team_members field to track workload properly
-- ═══════════════════════════════════════════════════════════════

-- Add team_members column to planned_tasks
-- Default to 1 for existing records (single person)
ALTER TABLE planned_tasks
ADD COLUMN IF NOT EXISTS team_members INTEGER NOT NULL DEFAULT 1 CHECK (team_members > 0);

-- Add comment
COMMENT ON COLUMN planned_tasks.team_members IS 'Number of team members assigned to this task (for calculating total workload)';
