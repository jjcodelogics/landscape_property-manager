-- ═══════════════════════════════════════════════════════════════
-- Zone Model Simplification Migration
-- Removes name field, adds frequency, prepares for simplified model
-- ═══════════════════════════════════════════════════════════════

-- Remove name column (title is primary identifier)
ALTER TABLE zones DROP COLUMN IF EXISTS name;

-- Add frequency field for recurring work schedules
-- NULL = no recurring schedule, manual planning only
-- Common values: 'weekly', 'biweekly', 'monthly', '2weeks', '4weeks'
ALTER TABLE zones 
ADD COLUMN IF NOT EXISTS frequency TEXT;

-- Add comment
COMMENT ON COLUMN zones.frequency IS 'Recommended frequency for this zone work (e.g., weekly, biweekly, monthly)';
