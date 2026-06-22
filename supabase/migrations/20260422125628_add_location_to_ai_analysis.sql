/*
  # Tambah Kolom Lokasi ke Tabel ai_analysis

  ## Perubahan
  - Tabel `ai_analysis`
    - `latitude` (float8, nullable) — koordinat lintang dari GPS atau metadata EXIF foto
    - `longitude` (float8, nullable) — koordinat bujur dari GPS atau metadata EXIF foto
    - `location_source` (text, nullable) — sumber lokasi: 'gps', 'exif', atau 'manual'

  ## Catatan
  - Kolom nullable karena lokasi bisa tidak tersedia (GPS mati, EXIF kosong)
  - Ketika lokasi tidak tersedia, user memilih lahan secara manual (fallback)
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ai_analysis' AND column_name = 'latitude'
  ) THEN
    ALTER TABLE ai_analysis ADD COLUMN latitude float8;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ai_analysis' AND column_name = 'longitude'
  ) THEN
    ALTER TABLE ai_analysis ADD COLUMN longitude float8;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ai_analysis' AND column_name = 'location_source'
  ) THEN
    ALTER TABLE ai_analysis ADD COLUMN location_source text;
  END IF;
END $$;
