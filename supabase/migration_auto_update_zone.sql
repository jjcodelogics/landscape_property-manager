-- ═══════════════════════════════════════════════════════════════
-- Auto-Update Zone Last Worked Date Trigger
-- When a task is created, automatically update the zone's last_worked_at
-- ═══════════════════════════════════════════════════════════════

-- Function to update zone last_worked_at
CREATE OR REPLACE FUNCTION update_zone_last_worked()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the zone's last_worked_at to the task creation time
  UPDATE zones
  SET last_worked_at = NEW.created_at
  WHERE id = NEW.zone_id
    -- Only update if this task is newer than current last_worked_at
    AND (last_worked_at IS NULL OR NEW.created_at > last_worked_at);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_update_zone_last_worked ON tasks;
CREATE TRIGGER trigger_update_zone_last_worked
  AFTER INSERT ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_zone_last_worked();

-- Add comment
COMMENT ON FUNCTION update_zone_last_worked IS 'Automatically updates zone last_worked_at when a task is created';
