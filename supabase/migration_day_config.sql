-- ═══════════════════════════════════════════════════════════════
-- Day Config Migration
-- Adds table for storing daily team capacity configuration
-- ═══════════════════════════════════════════════════════════════

-- Create day_config table
CREATE TABLE IF NOT EXISTS day_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL UNIQUE,
  team_members INTEGER NOT NULL CHECK (team_members > 0 AND team_members <= 50),
  hours_per_member DECIMAL(4,2) NOT NULL CHECK (hours_per_member > 0 AND hours_per_member <= 24),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add index for faster date queries
CREATE INDEX idx_day_config_date ON day_config(date);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_day_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER day_config_updated_at
  BEFORE UPDATE ON day_config
  FOR EACH ROW
  EXECUTE FUNCTION update_day_config_updated_at();

-- Add RLS policies
ALTER TABLE day_config ENABLE ROW LEVEL SECURITY;

-- Allow all operations for now (adjust based on your auth setup)
CREATE POLICY "Allow all operations on day_config"
  ON day_config
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Add comment
COMMENT ON TABLE day_config IS 'Stores daily team capacity configuration for workload planning';
