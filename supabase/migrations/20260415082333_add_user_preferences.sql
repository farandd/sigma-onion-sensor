/*
  # Add User Preferences Table

  1. New Tables
    - `user_preferences`
      - `user_id` (uuid, PK, references auth.users)
      - `active_mode` (text: 'portable' | 'panel', default 'portable')
      - `selected_land` (text: land ID, default 'lahan1')
      - `notif_enabled` (boolean, default true)
      - `auto_sync` (boolean, default true)
      - `updated_at` (timestamptz)

  2. Security
    - RLS enabled
    - Users can SELECT, INSERT, and UPDATE only their own row
*/

CREATE TABLE IF NOT EXISTS user_preferences (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  active_mode text DEFAULT 'portable' CHECK (active_mode IN ('portable', 'panel')),
  selected_land text DEFAULT 'lahan1',
  notif_enabled boolean DEFAULT true,
  auto_sync boolean DEFAULT true,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own preferences"
  ON user_preferences FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
  ON user_preferences FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON user_preferences FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
