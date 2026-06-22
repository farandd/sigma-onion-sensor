import {
  AIDetection,
  SensorReading,
  Land,
  PipelineResult,
  ActionStep,
  ImageQualityStatus,
  SensorCorrelation,
} from '../types';

// ── Lapis 1: Image Quality & Metadata ───────────────────────────────────────

export async function checkImageQuality(
  imageElement: HTMLImageElement,
): Promise<{ status: ImageQualityStatus; message: string }> {
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return { status: 'ok', message: 'Kualitas gambar tidak dapat diperiksa.' };

    const SAMPLE = 200;
    canvas.width = SAMPLE;
    canvas.height = SAMPLE;
    ctx.drawImage(imageElement, 0, 0, SAMPLE, SAMPLE);

    const { data } = ctx.getImageData(0, 0, SAMPLE, SAMPLE);
    // Laplacian variance proxy: sum squared differences between adjacent pixels
    let sum = 0;
    let count = 0;
    for (let i = 0; i < data.length - 4; i += 4) {
      const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      const grayNext = 0.299 * data[i + 4] + 0.587 * data[i + 5] + 0.114 * data[i + 6];
      sum += (gray - grayNext) ** 2;
      count++;
    }
    const variance = count > 0 ? sum / count : 999;

    if (variance < 8) {
      return {
        status: 'blurry',
        message: `Gambar terlalu buram (skor: ${variance.toFixed(1)}). Foto ulang dengan kamera yang stabil.`,
      };
    }
    return { status: 'ok', message: 'Kualitas gambar baik.' };
  } catch {
    return { status: 'ok', message: 'Pemeriksaan kualitas dilewati.' };
  }
}

export function checkMetadata(
  photoTimestamp: Date | null,
  photoCoords: { latitude: number; longitude: number } | null,
  land: Land | null,
): { status: ImageQualityStatus; message: string; ageHours: number | null; distanceM: number | null } {
  let ageHours: number | null = null;
  let distanceM: number | null = null;

  if (photoTimestamp) {
    ageHours = (Date.now() - photoTimestamp.getTime()) / 3_600_000;
    if (ageHours > 24) {
      return {
        status: 'metadata_stale',
        message: `Foto berumur ${ageHours.toFixed(0)} jam — melebihi batas 24 jam. Data mungkin tidak relevan.`,
        ageHours,
        distanceM,
      };
    }
  }

  if (photoCoords && land?.latitude != null && land?.longitude != null) {
    distanceM = haversineMeters(
      photoCoords.latitude, photoCoords.longitude,
      land.latitude, land.longitude,
    );
    const radius = land.radius_m ?? 500;
    if (distanceM > radius) {
      return {
        status: 'location_mismatch',
        message: `Lokasi foto ${distanceM < 1000 ? distanceM + ' m' : (distanceM / 1000).toFixed(1) + ' km'} dari lahan — di luar radius ${radius} m.`,
        ageHours,
        distanceM,
      };
    }
  }

  return { status: 'ok', message: 'Metadata valid.', ageHours, distanceM };
}

function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6_371_000;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}
function toRad(deg: number) { return (deg * Math.PI) / 180; }

// ── Lapis 2: Multimodal Cross-Validation ────────────────────────────────────

const FUNGAL_DISEASES = ['Alternaria Porri', 'Botrytis Leaf Blight', 'Purple Blotch', 'Stemphylium Leaf Blight'];

export function crossValidate(
  detection: AIDetection,
  sensor: SensorReading | null,
): { correlation: SensorCorrelation; message: string; overriddenLabel: string | null; verified: boolean } {
  if (!sensor) {
    return {
      correlation: 'insufficient_data',
      message: 'Data sensor tidak tersedia untuk validasi silang.',
      overriddenLabel: null,
      verified: false,
    };
  }

  const label = detection.label;
  const conf = detection.confidence;
  const isFungal = FUNGAL_DISEASES.includes(label);

  // Defisiensi nutrisi override: pH rendah atau N rendah dengan gejala klorosis
  if (isFungal && (sensor.ph < 5.5 || sensor.nitrogen < 15)) {
    return {
      correlation: 'nutrient_issue',
      message: `pH ${sensor.ph} atau N ${sensor.nitrogen} mg/kg rendah — gejala mungkin akibat defisiensi nutrisi, bukan infeksi jamur.`,
      overriddenLabel: 'Masalah Nutrisi Tanah',
      verified: false,
    };
  }

  // Kondisi terlalu kering untuk jamur
  if (isFungal && sensor.moisture < 50) {
    return {
      correlation: 'contradiction',
      message: `Kelembaban ${sensor.moisture}% terlalu rendah untuk perkembangan jamur (min 50%). Kepercayaan dikurangi.`,
      overriddenLabel: null,
      verified: false,
    };
  }

  // Verified: AI tinggi DAN kondisi lingkungan mendukung
  const envSupports = isFungal
    ? sensor.moisture >= 50 && sensor.temperature >= 18 && sensor.temperature <= 35
    : true;

  if (conf >= 80 && envSupports) {
    return {
      correlation: 'verified',
      message: `Confidence ${conf.toFixed(1)}% dan kondisi lingkungan mendukung — diagnosis terverifikasi saintifik.`,
      overriddenLabel: null,
      verified: true,
    };
  }

  return {
    correlation: 'insufficient_data',
    message: `Confidence ${conf.toFixed(1)}% — kondisi lingkungan cukup mendukung tetapi belum memenuhi ambang verifikasi (80%).`,
    overriddenLabel: null,
    verified: false,
  };
}

// ── Lapis 3: Severity Score & Action Steps ──────────────────────────────────

function calcSeverity(bbox_width: number, bbox_height: number): { score: number; label: 'Ringan' | 'Sedang' | 'Berat' } {
  const score = Math.min(100, Math.round(bbox_width * bbox_height * 100));
  const label = score < 15 ? 'Ringan' : score < 35 ? 'Sedang' : 'Berat';
  return { score, label };
}

const ACTION_LIBRARY: Record<string, (sev: 'Ringan' | 'Sedang' | 'Berat') => ActionStep[]> = {
  'Alternaria Porri': (sev) => [
    { phase: 'physical', label: 'Buang daun terinfeksi', detail: 'Cabut dan musnahkan daun bergejala bercak coklat. Jangan dikompos.', urgency: sev === 'Berat' ? 'immediate' : 'within_24h' },
    { phase: 'chemical', label: 'Fungisida Iprodione', detail: sev === 'Berat' ? 'Semprot iprodione 50 WP dosis 2 g/L setiap 5 hari selama 3 siklus.' : 'Semprot mancozeb 80 WP dosis 2 g/L setiap 7 hari.', urgency: sev === 'Berat' ? 'immediate' : 'within_24h' },
    { phase: 'monitoring', label: 'Pantau kelembaban', detail: 'Jaga kelembaban tanah 50–70%. Perbaiki drainase jika genang.', urgency: 'routine' },
  ],
  'Botrytis Leaf Blight': (sev) => [
    { phase: 'physical', label: 'Kurangi kepadatan tanam', detail: 'Tingkatkan jarak antar tanaman untuk sirkulasi udara.', urgency: 'within_24h' },
    { phase: 'chemical', label: 'Fungisida Chlorothalonil', detail: sev === 'Berat' ? 'Semprot chlorothalonil 75 WP dosis 2 g/L + tebuconazole 250 SC 0.5 mL/L.' : 'Aplikasi chlorothalonil 75 WP dosis 1.5 g/L setiap 7 hari.', urgency: sev === 'Berat' ? 'immediate' : 'within_24h' },
    { phase: 'monitoring', label: 'Hindari irigasi malam', detail: 'Irigasi pagi hari agar daun kering sebelum malam.', urgency: 'routine' },
  ],
  'Purple Blotch': (sev) => [
    { phase: 'physical', label: 'Sanitasi lahan', detail: 'Bersihkan sisa tanaman sakit dari musim lalu. Rotasi tanaman direkomendasikan.', urgency: 'within_24h' },
    { phase: 'chemical', label: 'Fungisida Difenokonazol', detail: sev === 'Berat' ? 'Score 250 EC dosis 0.5 mL/L, semprot 2x seminggu selama 3 minggu.' : 'Score 250 EC dosis 0.3 mL/L setiap 10 hari.', urgency: sev === 'Berat' ? 'immediate' : 'within_24h' },
    { phase: 'monitoring', label: 'Cek kondisi tanah', detail: 'Pastikan pH 6.0–7.0 dan nitrogen cukup untuk ketahanan tanaman.', urgency: 'routine' },
  ],
  'Stemphylium Leaf Blight': (sev) => [
    { phase: 'physical', label: 'Hindari pemupukan N berlebih', detail: 'Kurangi pupuk nitrogen 30% sementara untuk mengurangi jaringan lunak.', urgency: 'within_24h' },
    { phase: 'chemical', label: 'Fungisida Difenokonazol', detail: 'Score 250 EC 0.5 mL/L. Tambah adjuvant perekat bila hujan sering.', urgency: sev === 'Berat' ? 'immediate' : 'within_24h' },
    { phase: 'monitoring', label: 'Pantau kelembaban relatif', detail: 'Hindari kelembaban > 80% berkepanjangan. Pasang mulsa jika perlu.', urgency: 'routine' },
  ],
  'Sehat': () => [
    { phase: 'monitoring', label: 'Pertahankan praktik budidaya', detail: 'Tanaman sehat. Lanjutkan jadwal pemupukan dan irigasi rutin.', urgency: 'routine' },
    { phase: 'monitoring', label: 'Pantau 7 hari ke depan', detail: 'Periksa gejala awal bercak daun setiap pagi hari.', urgency: 'routine' },
  ],
  'Masalah Nutrisi Tanah': () => [
    { phase: 'physical', label: 'Koreksi pH tanah', detail: 'Jika pH < 5.5, tambahkan kapur pertanian (dolomit) 1–2 ton/Ha. Tunggu 2 minggu sebelum tanam ulang.', urgency: 'within_24h' },
    { phase: 'chemical', label: 'Pupuk NPK berimbang', detail: 'Aplikasi pupuk Urea 200 kg/Ha + TSP 150 kg/Ha + KCl 100 kg/Ha secara bertahap.', urgency: 'within_24h' },
    { phase: 'monitoring', label: 'Uji tanah ulang', detail: 'Lakukan uji tanah setelah 3 minggu untuk memastikan perbaikan pH dan NPK.', urgency: 'routine' },
  ],
};

// ── Main Pipeline Runner ─────────────────────────────────────────────────────

export interface PipelineInput {
  detection: AIDetection;
  sensor: SensorReading | null;
  imageElement: HTMLImageElement | null;
  photoTimestamp: Date | null;
  photoCoords: { latitude: number; longitude: number } | null;
  land: Land | null;
}

export async function runAIPipeline(input: PipelineInput): Promise<PipelineResult> {
  const { detection, sensor, imageElement, photoTimestamp, photoCoords, land } = input;

  // Lapis 1
  let imageQuality: ImageQualityStatus = 'ok';
  let imageQualityMessage = 'Kualitas gambar baik.';
  if (imageElement) {
    const qr = await checkImageQuality(imageElement);
    imageQuality = qr.status;
    imageQualityMessage = qr.message;
  }

  const meta = checkMetadata(photoTimestamp, photoCoords, land);
  if (imageQuality === 'ok' && meta.status !== 'ok') {
    imageQuality = meta.status;
    imageQualityMessage = meta.message;
  }

  // Lapis 2
  const cv = crossValidate(detection, sensor);
  const effectiveLabel = cv.overriddenLabel ?? detection.label;

  // Lapis 3
  const { score, label: severityLabel } = calcSeverity(detection.bbox_width, detection.bbox_height);
  const actionFn = ACTION_LIBRARY[effectiveLabel] ?? ACTION_LIBRARY['Sehat'];
  const actionSteps = actionFn(severityLabel);

  return {
    imageQuality,
    imageQualityMessage,
    metadataAgeHours: meta.ageHours,
    locationDistanceM: meta.distanceM,
    sensorCorrelation: cv.correlation,
    sensorCorrelationMessage: cv.message,
    overriddenLabel: cv.overriddenLabel,
    scientificVerified: cv.verified,
    severityScore: score,
    severityLabel,
    actionSteps,
  };
}
