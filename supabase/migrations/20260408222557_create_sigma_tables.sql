/*
  # SIGMA - Smart IoT for Growth Monitoring in Agriculture

  1. New Tables
    - `profiles`
      - Stores user profile data including preferred system type (portable/panel)
    - `sensor_readings`
      - Stores historical sensor readings (moisture, nitrogen, phosphorus, potassium, temperature, ph, conductivity)
      - Linked to user and system type
    - `ai_detections`
      - Stores AI disease detection results including label, confidence, and bounding box coordinates

  2. Security
    - Enable RLS on all tables
    - Users can only read/write their own data
*/

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text DEFAULT '',
  system_type text DEFAULT 'portable' CHECK (system_type IN ('portable', 'panel')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Sensor readings table
CREATE TABLE IF NOT EXISTS sensor_readings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  system_type text DEFAULT 'portable' CHECK (system_type IN ('portable', 'panel')),
  moisture numeric(5,2) DEFAULT 0,
  nitrogen numeric(6,2) DEFAULT 0,
  phosphorus numeric(6,2) DEFAULT 0,
  potassium numeric(6,2) DEFAULT 0,
  temperature numeric(5,2) DEFAULT 0,
  ph numeric(4,2) DEFAULT 0,
  conductivity numeric(5,3) DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE sensor_readings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sensor readings"
  ON sensor_readings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sensor readings"
  ON sensor_readings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- AI Detections table
CREATE TABLE IF NOT EXISTS ai_detections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  system_type text DEFAULT 'portable' CHECK (system_type IN ('portable', 'panel')),
  image_url text DEFAULT '',
  label text DEFAULT '',
  confidence numeric(5,2) DEFAULT 0,
  bbox_x numeric(7,2) DEFAULT 0,
  bbox_y numeric(7,2) DEFAULT 0,
  bbox_width numeric(7,2) DEFAULT 0,
  bbox_height numeric(7,2) DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ai_detections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own ai detections"
  ON ai_detections FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own ai detections"
  ON ai_detections FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_sensor_readings_user_created ON sensor_readings(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_detections_user_created ON ai_detections(user_id, created_at DESC);
