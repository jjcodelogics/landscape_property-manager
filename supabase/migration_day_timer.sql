-- Day Timer System Migration
-- Tracks overall productive vs non-productive time throughout the workday

CREATE TABLE IF NOT EXISTS day_sessions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  date date NOT NULL DEFAULT CURRENT_DATE,
  mode text NOT NULL CHECK (mode IN ('productive', 'non_productive')),
  start_time timestamptz NOT NULL DEFAULT now(),
  end_time timestamptz,
  non_productive_reason text CHECK (non_productive_reason IN ('driving', 'break', 'loading', 'talking', 'other')),
  created_at timestamptz DEFAULT now()
);

-- Only one active session allowed at a time (end_time = null)
CREATE UNIQUE INDEX idx_day_sessions_active ON day_sessions (date) 
  WHERE end_time IS NULL;

-- Index for date-based queries
CREATE INDEX idx_day_sessions_date ON day_sessions (date DESC);

-- RLS policies (public access for now)
ALTER TABLE day_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to day_sessions"
  ON day_sessions FOR SELECT USING (true);

CREATE POLICY "Allow insert for day_sessions" 
  ON day_sessions FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow update for day_sessions" 
  ON day_sessions FOR UPDATE USING (true) WITH CHECK (true);

-- Comments
COMMENT ON TABLE day_sessions IS 'Tracks productive vs non-productive time throughout the workday';
COMMENT ON COLUMN day_sessions.mode IS 'Current mode: productive | non_productive';
COMMENT ON COLUMN day_sessions.start_time IS 'When this session started';
COMMENT ON COLUMN day_sessions.end_time IS 'When this session ended (null = active)';
COMMENT ON COLUMN day_sessions.non_productive_reason IS 'Optional reason when mode is non_productive';
