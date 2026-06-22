/*
  # Buat tabel lands

  ## Deskripsi
  Tabel untuk menyimpan data lahan milik user. Setiap lahan memiliki koordinat GPS
  yang digunakan untuk memvalidasi apakah foto analisis AI diambil di lokasi yang sesuai.

  ## Tabel Baru
  - `lands`
    - `id` (text, PK) — ID lahan, misalnya 'lahan1', 'lahan2', dll.
    - `user_id` (uuid, FK ke auth.users)
    - `label` (text) — Nama tampilan lahan, misalnya 'Lahan 1'
    - `crop` (text) — Jenis tanaman
    - `area` (text, nullable) — Luas lahan (opsional)
    - `latitude` (float8, nullable) — Koordinat pusat lahan
    - `longitude` (float8, nullable) — Koordinat pusat lahan
    - `radius_m` (float4) — Radius toleransi validasi dalam meter, default 500m
    - `system_type` (text) — 'portable' atau 'panel'
    - `created_at` (timestamptz)

  ## Security
  - RLS diaktifkan
  - User hanya bisa SELECT, INSERT, UPDATE data milik sendiri
*/

CREATE TABLE IF NOT EXISTS lands (
  id          text NOT NULL,
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label       text NOT NULL,
  crop        text NOT NULL DEFAULT 'Bawang Merah',
  area        text,
  latitude    float8,
  longitude   float8,
  radius_m    float4 NOT NULL DEFAULT 500,
  system_type text NOT NULL DEFAULT 'panel',
  created_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id, user_id)
);

ALTER TABLE lands ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own lands"
  ON lands FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own lands"
  ON lands FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own lands"
  ON lands FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_lands_user
  ON lands (user_id, system_type);
