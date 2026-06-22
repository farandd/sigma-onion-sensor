# Device API

Endpoint alat sebaiknya masuk lewat Supabase Edge Function, bukan langsung ke tabel REST Supabase.

## Endpoint

```text
POST https://zstlyahhowekebbibkxs.supabase.co/functions/v1/ingest-sensor
```

Header:

```text
Content-Type: application/json
X-Device-Key: isi_dari_secret_DEVICE_INGEST_KEY
```

## Payload

```json
{
  "device_id": "portable-001",
  "user_id": "UUID_USER_LOGIN",
  "system_type": "portable",
  "land_id": "lahan1",
  "nitrogen": 25,
  "phosphorus": 18,
  "potassium": 32,
  "ph": 6.5,
  "ec": 450,
  "moisture": 30.2,
  "temperature": 27.5
}
```

Catatan:

- `system_type` bernilai `portable` atau `panel`.
- `land_id` mengikuti aplikasi sekarang, misalnya `lahan1`, `lahan2`, atau `lahan3`.
- `user_id` masih wajib selama belum ada tabel registrasi perangkat.
- `ec` dari alat akan disimpan sebagai `conductivity`.
- Jika `ec` lebih besar dari `20`, backend menganggap satuannya `uS/cm` dan membagi `1000`, contoh `450` menjadi `0.45 mS/cm`.

## Response Berhasil

```json
{
  "ok": true,
  "data": {
    "id": "uuid-reading",
    "user_id": "UUID_USER_LOGIN",
    "system_type": "portable",
    "land_id": "lahan1",
    "nitrogen": 25,
    "phosphorus": 18,
    "potassium": 32,
    "ph": 6.5,
    "conductivity": 0.45,
    "moisture": 30.2,
    "temperature": 27.5
  }
}
```

## cURL Test

```bash
curl -X POST "https://zstlyahhowekebbibkxs.supabase.co/functions/v1/ingest-sensor" \
  -H "Content-Type: application/json" \
  -H "X-Device-Key: isi_dari_secret_DEVICE_INGEST_KEY" \
  -d '{
    "device_id": "portable-001",
    "user_id": "UUID_USER_LOGIN",
    "system_type": "portable",
    "land_id": "lahan1",
    "nitrogen": 25,
    "phosphorus": 18,
    "potassium": 32,
    "ph": 6.5,
    "ec": 450,
    "moisture": 30.2,
    "temperature": 27.5
  }'
```

## Supabase Secrets

Sebelum deploy function, siapkan secret:

```bash
supabase secrets set DEVICE_INGEST_KEY="buat_key_rahasia_sendiri"
```

`SUPABASE_URL` dan `SUPABASE_SERVICE_ROLE_KEY` biasanya tersedia di runtime Supabase Edge Function. Jika belum, set juga melalui Supabase dashboard atau CLI.

## Alur UI

```text
Alat kirim data ke ingest-sensor
-> Edge Function simpan ke sensor_readings
-> Dashboard membaca data terbaru dari sensor_readings
-> History membaca tabel sensor_readings
```

