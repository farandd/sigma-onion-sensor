/*
  # Add sync_state table

  ## Purpose
  Stores the last sensor sync timestamp per user/system/land combination
  so that multiple devices using the same account share the same countdown timer.

  ## New Tables
  - `sync_state`
    - `id` (uuid, primary key)
    - `user_id` (uuid, FK to auth.users)
    - `system_type` (text)
    - `land_id` (text)
    - `last_synced_at` (timestamptz) — timestamp of the last successful sync
    - `updated_at` (timestamptz)

  ## Security
  - RLS enabled; users can only read and write their own rows
*/

CREATE TABLE IF NOT EXISTS sync_state (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  system_type text NOT NULL,
  land_id text NOT NULL,
  last_synced_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, system_type, land_id)
);

ALTER TABLE sync_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select own sync state"
  ON sync_state FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sync state"
  ON sync_state FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sync state"
  ON sync_state FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
