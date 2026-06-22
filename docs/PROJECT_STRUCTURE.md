# Struktur Proyek SIGMA Onion Sensor

Dokumen ini menjadi gambaran struktur target untuk menyatukan logic portable, panel, histori sensor, AI analysis, dan integrasi alat.

## Struktur Utama

```text
sigma-onion-sensor/
├─ src/
│  ├─ assets/                 # Logo, maskot, dan aset visual aplikasi
│  ├─ components/             # Komponen UI reusable
│  │  ├─ dashboard/           # Card sensor, gauge, timer, selector lahan
│  │  ├─ layout/              # Sidebar, header, bottom nav
│  │  └─ notifications/       # Toast/notifikasi aplikasi
│  ├─ constants/              # Konfigurasi statis, contoh rentang sensor
│  ├─ contexts/               # State global: auth, app mode, notifikasi
│  ├─ hooks/                  # Logic halaman; UI memanggil hook
│  ├─ lib/                    # Client eksternal umum, contoh Supabase
│  ├─ pages/                  # Halaman aplikasi
│  ├─ services/               # Integrasi data/API yang tidak bercampur UI
│  │  └─ sensors/
│  │     ├─ portableSensorApi.ts
│  │     └─ sensorMapper.ts
│  └─ types/                  # TypeScript type/interface lintas modul
├─ supabase/
│  ├─ functions/
│  │  ├─ ingest-sensor/       # Endpoint alat masuk ke Supabase
│  │  └─ roboflow-detect/     # Edge Function AI detection
│  └─ migrations/             # Struktur database Supabase
├─ docs/
│  ├─ DEVICE_API.md           # Dokumentasi payload alat
│  └─ PROJECT_STRUCTURE.md    # Dokumen ini
├─ references/                # Referensi lama, bukan aplikasi aktif
│  ├─ fe-abmas-melon/
│  ├─ strapi-abmas-melon/
│  ├─ mqtt-onion-sensor/
│  └─ SIGMA-Onion-Monitoring/
└─ package.json
```

## Prinsip Pemisahan

- `pages/` dan `components/` fokus ke tampilan.
- `hooks/` mengatur state halaman dan siklus data.
- `services/` menjadi tempat komunikasi ke alat/API dan normalisasi payload.
- `types/` menjadi kontrak data tunggal agar portable dan panel memakai format sensor yang sama.
- `supabase/` menyimpan backend final: migrations, edge function, histori sensor, preferensi user, lahan, dan hasil AI.
- `references/` hanya bahan pembanding dari proyek lama.

## Alur Data Utama

```text
Alat portable atau panel
  -> supabase/functions/ingest-sensor
  -> Supabase sensor_readings
  -> src/hooks/useSensorData.ts
  -> DashboardPage dan HistoryPage
```

Strapi portable lama masih disimpan sebagai referensi/fallback sementara di `references/strapi-abmas-melon`.

## Normalisasi Field Sensor

Backend dan service menerima nama field dari alat, Strapi lama, atau nama Indonesia:

| Format aplikasi final | Field lama/alternatif |
| --- | --- |
| `temperature` | `temperature`, `suhu_tanah` |
| `ph` | `ph`, `ph_tanah` |
| `moisture` | `moisture`, `kelembapan_tanah` |
| `conductivity` | `conductivity`, `konduktivitas`, `ec` |
| `nitrogen` | `nitrogen` |
| `phosphorus` | `phosphorus`, `phosphor` |
| `potassium` | `potassium`, `kalium` |

Jika `ec` lebih besar dari `20`, nilainya dianggap `uS/cm` dan dikonversi menjadi `mS/cm`.

## Tahap Berikutnya

1. Deploy `supabase/functions/ingest-sensor`.
2. Set secret `DEVICE_INGEST_KEY` di Supabase.
3. Arahkan firmware alat ke endpoint `ingest-sensor`.
4. Pastikan `sensor_readings` menjadi sumber utama dashboard dan riwayat.
5. Setelah alat stabil, hapus fallback demo atau jadikan mode demo eksplisit.

