/*
  # SIGMA - Major Feature Update

  1. Changes to Existing Tables
    - `sensor_readings`
      - Add `land_id` column (text, for panel mode land selection: lahan1, lahan2, lahan3)
      - Defaults to 'default' for portable mode readings

  2. New Tables
    - `ai_analysis`
      - Stores manually saved AI analysis results
      - Columns: id, user_id, system_type, land_id, disease_name, confidence,
        recommendation, image_url, bbox_x, bbox_y, bbox_width, bbox_height, created_at

  3. Security
    - RLS enabled on ai_analysis
    - Policies for SELECT and INSERT scoped to authenticated + own user data

  4. Notes
    - land_id = 'default' for portable mode or when no land is selected
    - Only manually saved analyses appear in the ai_analysis table
    - The old ai_detections table remains for backwards compatibility
*/

-- Add land_id to sensor_readings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sensor_readings' AND column_name = 'land_id'
  ) THEN
    ALTER TABLE sensor_readings ADD COLUMN land_id text DEFAULT 'default';
  END IF;
END $$;

-- Create ai_analysis table
CREATE TABLE IF NOT EXISTS ai_analysis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  system_type text DEFAULT 'portable' CHECK (system_type IN ('portable', 'panel')),
  land_id text DEFAULT 'default',
  disease_name text DEFAULT '',
  confidence numeric(5,2) DEFAULT 0,
  recommendation text DEFAULT '',
  image_url text DEFAULT '',
  bbox_x numeric(7,4) DEFAULT 0,
  bbox_y numeric(7,4) DEFAULT 0,
  bbox_width numeric(7,4) DEFAULT 0,
  bbox_height numeric(7,4) DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ai_analysis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own ai analysis"
  ON ai_analysis FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own ai analysis"
  ON ai_analysis FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_ai_analysis_user_created ON ai_analysis(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sensor_readings_land ON sensor_readings(user_id, land_id, created_at DESC);
