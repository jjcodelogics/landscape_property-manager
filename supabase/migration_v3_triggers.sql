-- Migration v3: Array Field Validation Triggers
-- Prevents orphaned references when zones/points are deleted
-- Run this after migration_v2.sql

-- ─── Validation Functions ──────────────────────────────────────────────────

-- Validate that all zone_ids in an array exist
CREATE OR REPLACE FUNCTION validate_zone_ids_exist()
RETURNS TRIGGER AS $$
BEGIN
  -- Check each zone_id in the array exists
  IF NEW.zone_ids IS NOT NULL AND array_length(NEW.zone_ids, 1) > 0 THEN
    IF NOT (
      SELECT bool_and(EXISTS(SELECT 1 FROM zones WHERE id = zone_id))
      FROM unnest(NEW.zone_ids) AS zone_id
    ) THEN
      RAISE EXCEPTION 'One or more zone_ids reference non-existent zones';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Validate that all point_ids in an array exist
CREATE OR REPLACE FUNCTION validate_point_ids_exist()
RETURNS TRIGGER AS $$
BEGIN
  -- Check each point_id in the array exists
  IF NEW.point_ids IS NOT NULL AND array_length(NEW.point_ids, 1) > 0 THEN
    IF NOT (
      SELECT bool_and(EXISTS(SELECT 1 FROM points WHERE id = point_id))
      FROM unnest(NEW.point_ids) AS point_id
    ) THEN
      RAISE EXCEPTION 'One or more point_ids reference non-existent points';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ─── Apply Triggers ─────────────────────────────────────────────────────────

-- Trigger for daily_plans zone_ids validation
DROP TRIGGER IF EXISTS validate_plan_zone_ids ON daily_plans;
CREATE TRIGGER validate_plan_zone_ids
  BEFORE INSERT OR UPDATE ON daily_plans
  FOR EACH ROW
  EXECUTE FUNCTION validate_zone_ids_exist();

-- Trigger for routes point_ids validation
DROP TRIGGER IF EXISTS validate_route_point_ids ON routes;
CREATE TRIGGER validate_route_point_ids
  BEFORE INSERT OR UPDATE ON routes
  FOR EACH ROW
  EXECUTE FUNCTION validate_point_ids_exist();

-- ─── Cleanup Functions ──────────────────────────────────────────────────────

-- Function to remove deleted zone_ids from daily_plans
CREATE OR REPLACE FUNCTION cleanup_deleted_zone_references()
RETURNS TRIGGER AS $$
BEGIN
  -- Remove the deleted zone_id from all daily_plans
  UPDATE daily_plans
  SET zone_ids = array_remove(zone_ids, OLD.id)
  WHERE OLD.id = ANY(zone_ids);
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Function to remove deleted point_ids from routes
CREATE OR REPLACE FUNCTION cleanup_deleted_point_references()
RETURNS TRIGGER AS $$
BEGIN
  -- Remove the deleted point_id from all routes
  UPDATE routes
  SET point_ids = array_remove(point_ids, OLD.id)
  WHERE OLD.id = ANY(point_ids);
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- ─── Apply Cleanup Triggers ─────────────────────────────────────────────────

-- Trigger to clean up zone references when a zone is deleted
DROP TRIGGER IF EXISTS cleanup_zone_references ON zones;
CREATE TRIGGER cleanup_zone_references
  BEFORE DELETE ON zones
  FOR EACH ROW
  EXECUTE FUNCTION cleanup_deleted_zone_references();

-- Trigger to clean up point references when a point is deleted
DROP TRIGGER IF EXISTS cleanup_point_references ON points;
CREATE TRIGGER cleanup_point_references
  BEFORE DELETE ON points
  FOR EACH ROW
  EXECUTE FUNCTION cleanup_deleted_point_references();

-- ─── Comments ────────────────────────────────────────────────────────────────

COMMENT ON FUNCTION validate_zone_ids_exist() IS 
  'Validates that all zone_ids in an array reference existing zones';
COMMENT ON FUNCTION validate_point_ids_exist() IS 
  'Validates that all point_ids in an array reference existing points';
COMMENT ON FUNCTION cleanup_deleted_zone_references() IS 
  'Removes deleted zone_id from daily_plans arrays before deletion';
COMMENT ON FUNCTION cleanup_deleted_point_references() IS 
  'Removes deleted point_id from routes arrays before deletion';
