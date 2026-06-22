import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BrainCircuit, Play, Save, CheckCircle, AlertTriangle, ShieldAlert,
  Scan, Info, Camera, Upload, MapPin, Loader2, MapPinOff, ChevronDown,
  ShieldCheck, ShieldX, Navigation, ShieldQuestion, BadgeCheck,
  FlaskConical, Activity, Wrench, Clock,
} from 'lucide-react';
import exifr from 'exifr';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { useAIDetection } from '../hooks/useAIDetection';
import { useAnalysisSession, fileToBase64, type PersistedLocation } from '../hooks/useAnalysisSession';
import { useNotification } from '../contexts/NotificationContext';
import { useLands, validateLandCoords } from '../hooks/useLands';
import { supabase } from '../lib/supabase';
import {
  AIAnalysisRecord, Land, LandValidationResult,
  PipelineResult, SensorCorrelation, ActionStep,
} from '../types';
import LandSelector from '../components/dashboard/LandSelector';

const DISEASE_DATA: Record<string, { severity: 'high' | 'medium' | 'none'; recommendation: string }> = {
  'Alternaria Porri': {
    severity: 'high',
    recommendation: 'Semprot fungisida berbahan aktif iprodione atau mancozeb. Kurangi kelembaban, perbaiki drainase, dan musnahkan daun terinfeksi segera.',
  },
  'Botrytis Leaf Blight': {
    severity: 'high',
    recommendation: 'Gunakan fungisida sistemik (chlorothalonil atau tebuconazole). Hindari irigasi berlebih, tingkatkan sirkulasi udara di lahan.',
  },
  'Purple Blotch': {
    severity: 'medium',
    recommendation: 'Aplikasikan fungisida protektif saat gejala awal. Lakukan rotasi tanaman dan hindari penanaman pada musim hujan berlebih.',
  },
  'Stemphylium Leaf Blight': {
    severity: 'medium',
    recommendation: 'Semprot dengan fungisida difenokonazol. Pantau kelembaban relatif dan hindari pemupukan nitrogen berlebihan.',
  },
  'Sehat': {
    severity: 'none',
    recommendation: 'Tanaman dalam kondisi sehat. Pertahankan praktik budidaya yang baik, pantau secara rutin, dan jaga kebersihan lahan.',
  },
  'Masalah Nutrisi Tanah': {
    severity: 'medium',
    recommendation: 'Koreksi pH dan kadar NPK tanah. Lakukan uji tanah dan aplikasi pupuk berimbang sesuai kebutuhan.',
  },
};

const severityCfg = {
  high: { label: 'Risiko Tinggi', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', icon: <AlertTriangle className="w-4 h-4" /> },
  medium: { label: 'Risiko Sedang', color: 'text-tertiary', bg: 'bg-tertiary/10', border: 'border-tertiary/20', icon: <ShieldAlert className="w-4 h-4" /> },
  none: { label: 'Sehat', color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/20', icon: <CheckCircle className="w-4 h-4" /> },
};

const correlationCfg: Record<SensorCorrelation, { label: string; color: string; bg: string; border: string; icon: React.ReactNode }> = {
  verified: { label: 'Terverifikasi Saintifik', color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/30', icon: <BadgeCheck className="w-4 h-4" /> },
  contradiction: { label: 'Kontradiksi Sensor', color: 'text-tertiary', bg: 'bg-tertiary/10', border: 'border-tertiary/30', icon: <ShieldAlert className="w-4 h-4" /> },
  nutrient_issue: { label: 'Masalah Nutrisi', color: 'text-tertiary', bg: 'bg-tertiary/10', border: 'border-tertiary/20', icon: <FlaskConical className="w-4 h-4" /> },
  insufficient_data: { label: 'Data Sensor Terbatas', color: 'text-gray-500', bg: 'bg-gray-50', border: 'border-gray-200', icon: <ShieldQuestion className="w-4 h-4" /> },
};

const phaseIcon: Record<ActionStep['phase'], React.ReactNode> = {
  physical: <Wrench className="w-3.5 h-3.5" />,
  chemical: <FlaskConical className="w-3.5 h-3.5" />,
  monitoring: <Activity className="w-3.5 h-3.5" />,
};
const phaseLabel: Record<ActionStep['phase'], string> = {
  physical: 'Fisik',
  chemical: 'Kimia',
  monitoring: 'Pantau',
};
const urgencyColor: Record<ActionStep['urgency'], string> = {
  immediate: 'text-red-600 bg-red-50 border-red-200',
  within_24h: 'text-tertiary bg-tertiary/10 border-tertiary/20',
  routine: 'text-gray-500 bg-gray-50 border-gray-200',
};
const urgencyLabel: Record<ActionStep['urgency'], string> = {
  immediate: 'Segera',
  within_24h: '< 24 Jam',
  routine: 'Rutin',
};


type LocationSource = 'gps' | 'exif' | 'manual' | null;

function formatCoord(val: number | null, dir: 'lat' | 'lon') {
  if (val === null) return '—';
  const abs = Math.abs(val).toFixed(6);
  const label = dir === 'lat' ? (val >= 0 ? 'U' : 'S') : (val >= 0 ? 'T' : 'B');
  return `${abs}° ${label}`;
}

// ── Pipeline Status Panel ────────────────────────────────────────────────────

function PipelineStatusPanel({ pipeline }: { pipeline: PipelineResult }) {
  const corr = correlationCfg[pipeline.sensorCorrelation];
  const sevColor = pipeline.severityLabel === 'Berat' ? 'bg-red-500' : pipeline.severityLabel === 'Sedang' ? 'bg-amber-400' : 'bg-primary';

  return (
    <div className="space-y-3">
      {/* Lapis 1: Image Quality */}
      {pipeline.imageQuality !== 'ok' && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-amber-700">Peringatan Kualitas Gambar</p>
            <p className="text-xs text-amber-600 mt-0.5">{pipeline.imageQualityMessage}</p>
          </div>
        </div>
      )}

      {/* Lapis 2: Sensor Correlation */}
      <div className={`flex items-start gap-3 rounded-xl border px-4 py-3 ${corr.bg} ${corr.border}`}>
        <span className={`shrink-0 mt-0.5 ${corr.color}`}>{corr.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className={`text-xs font-bold ${corr.color}`}>{corr.label}</p>
            {pipeline.scientificVerified && (
              <span className="text-[10px] bg-primary text-white px-1.5 py-0.5 rounded-full font-semibold">
                Saintifik
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{pipeline.sensorCorrelationMessage}</p>
        </div>
      </div>

      {/* Lapis 3: Severity Score */}
      <div className="bg-white rounded-xl border border-gray-100 px-4 py-3 space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-gray-600">Skor Keparahan</p>
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full text-white ${sevColor}`}>
            {pipeline.severityLabel}
          </span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pipeline.severityScore}%` }}
            transition={{ duration: 0.8 }}
            className={`h-full rounded-full ${sevColor}`}
          />
        </div>
        <p className="text-[10px] text-gray-400">
          Area deteksi: {pipeline.severityScore}% dari total gambar
        </p>
      </div>
    </div>
  );
}

// ── Action Steps Panel ───────────────────────────────────────────────────────

function ActionStepsPanel({ steps }: { steps: ActionStep[] }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-3">
      <h3 className="text-sm font-bold text-gray-700">Panduan Penanganan</h3>
      <div className="space-y-2">
        {steps.map((step, i) => (
          <div key={i} className="flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50/50 px-3 py-2.5">
            <div className="w-6 h-6 rounded-lg bg-white border border-gray-100 flex items-center justify-center shrink-0 text-gray-500 shadow-sm">
              {phaseIcon[step.phase]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                <span className="text-[10px] font-bold text-gray-400 uppercase">{phaseLabel[step.phase]}</span>
                <span className={`text-[10px] font-semibold border rounded-full px-1.5 py-px ${urgencyColor[step.urgency]}`}>
                  {urgencyLabel[step.urgency]}
                </span>
              </div>
              <p className="text-xs font-semibold text-gray-700">{step.label}</p>
              <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{step.detail}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function AIAnalysisPage() {
  const { activeMode, setActiveMode, selectedLand, setSelectedLand } = useApp();
  const { user } = useAuth();
  const { push } = useNotification();
  const { detection, analyzing, lastAnalyzed, runDetection, clearDetection } = useAIDetection(activeMode, selectedLand, user?.id ?? null);
  const { lands } = useLands(activeMode);
  const { session, updateSession, resetSession } = useAnalysisSession(activeMode, selectedLand);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  // locationLoading is transient — not persisted
  const [locationLoading, setLocationLoading] = useState(false);
  // Restore validation from detection if available (validation object not stored)
  const [locationValidation, setLocationValidation] = useState<LandValidationResult | null>(null);

  const imgRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const { capturedImageBase64, captureMode, location: loc, manualLand } = session;

  // Reset state saat berganti mode
  useEffect(() => {
    resetSession();
    clearDetection();
    setImgLoaded(false);
    setLocationValidation(null);
    setSaved(false);
  }, [activeMode, resetSession, clearDetection]);

  const effectiveLabel = detection?.label ?? '';
  const diseaseInfo = detection ? (DISEASE_DATA[effectiveLabel] ?? DISEASE_DATA['Sehat']) : null;
  const severity = diseaseInfo?.severity ?? 'none';
  const sevCfg = severityCfg[severity];
  const hasLocation = loc.latitude !== null && loc.longitude !== null;

  const bboxStyle = detection && imgLoaded && imgRef.current ? {
    left: `${detection.bbox_x * 100}%`,
    top: `${detection.bbox_y * 100}%`,
    width: `${detection.bbox_width * 100}%`,
    height: `${detection.bbox_height * 100}%`,
  } : null;

  function captureGPS(): Promise<{ latitude: number; longitude: number } | null> {
    return new Promise(resolve => {
      if (!navigator.geolocation) { resolve(null); return; }
      navigator.geolocation.getCurrentPosition(
        pos => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
        () => resolve(null),
        { enableHighAccuracy: true, timeout: 8000 },
      );
    });
  }

  function handleCameraCapture() { cameraInputRef.current?.click(); }

  async function processImageFile(file: File, mode: 'camera' | 'upload') {
    setSaved(false);
    setImgLoaded(false);
    setLocationLoading(true);

    // Convert to base64 so it survives navigation
    const base64 = await fileToBase64(file);
    updateSession({ capturedImageBase64: base64, captureMode: mode });

    let coords: { latitude: number; longitude: number } | null = null;
    let source: LocationSource = null;
    let timestamp: string | undefined;
    let photoTimestamp: Date | null = null;
    let error: string | null = null;

    if (mode === 'camera') {
      coords = await captureGPS();
      if (coords) { source = 'gps'; photoTimestamp = new Date(); }
      else { error = 'GPS tidak tersedia. Pilih lahan secara manual.'; }
    } else {
      try {
        const exifData = await exifr.gps(file);
        if (exifData?.latitude != null && exifData?.longitude != null) {
          coords = { latitude: exifData.latitude, longitude: exifData.longitude };
          source = 'exif';
          try {
            const full = await exifr.parse(file, ['DateTimeOriginal']);
            if (full?.DateTimeOriginal) {
              photoTimestamp = new Date(full.DateTimeOriginal);
              timestamp = photoTimestamp.toLocaleString('id-ID');
            }
          } catch { /* optional */ }
        } else {
          error = 'Metadata GPS tidak ditemukan dalam foto. Pilih lahan secara manual.';
        }
      } catch {
        error = 'Gagal membaca EXIF foto. Pilih lahan secara manual.';
      }
    }

    let validation: LandValidationResult | null = null;
    if (coords) {
      validation = validateLandCoords(coords.latitude, coords.longitude, lands);
      if (validation.matched && validation.land) setSelectedLand(validation.land.id);
    }
    setLocationValidation(validation);

    updateSession({
      location: {
        latitude: coords?.latitude ?? null,
        longitude: coords?.longitude ?? null,
        source,
        timestamp,
        photoTimestamp: photoTimestamp?.toISOString() ?? null,
        error,
      },
    });
    setLocationLoading(false);

    const currentLand = lands.find(l => l.id === selectedLand) ?? null;
    await runDetection({
      photoTimestamp,
      photoCoords: coords,
      land: currentLand,
      imageElement: imgRef.current,
    });
  }

  async function handleCameraInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    await processImageFile(file, 'camera');
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    await processImageFile(file, 'upload');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function handleSaveToHistory() {
    if (!user || !detection || !diseaseInfo) return;
    setSaving(true);

    const record: Omit<AIAnalysisRecord, 'id' | 'created_at'> = {
      user_id: user.id,
      system_type: activeMode,
      land_id: hasLocation ? selectedLand : manualLand,
      disease_name: detection.label,
      confidence: detection.confidence,
      recommendation: diseaseInfo.recommendation,
      image_url: capturedImageBase64 ?? detection.image_url,
      bbox_x: detection.bbox_x,
      bbox_y: detection.bbox_y,
      bbox_width: detection.bbox_width,
      bbox_height: detection.bbox_height,
      latitude: loc.latitude,
      longitude: loc.longitude,
      location_source: hasLocation ? loc.source : 'manual',
    };

    await supabase.from('ai_analysis').insert(record);
    setSaving(false);
    setSaved(true);
    push({ type: 'success', title: 'Analisis Disimpan', message: `Hasil deteksi "${detection.label}" berhasil disimpan ke riwayat.` });
    if (severity === 'high') {
      push({ type: 'error', title: 'Penyakit Berat Terdeteksi!', message: `${detection.label} terdeteksi (${detection.confidence.toFixed(1)}%). Segera ambil tindakan.` });
    }
    setTimeout(() => setSaved(false), 3000);
  }

  async function handleRunDetection() {
    setSaved(false);
    const currentLand = lands.find(l => l.id === selectedLand) ?? null;
    const photoTimestamp = loc.photoTimestamp ? new Date(loc.photoTimestamp) : null;
    await runDetection({
      imageElement: imgRef.current,
      photoTimestamp,
      photoCoords: hasLocation ? { latitude: loc.latitude!, longitude: loc.longitude! } : null,
      land: currentLand,
    });
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={activeMode}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        transition={{ duration: 0.3 }}
        className="space-y-5"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary shadow-sm shadow-primary/10">
            <BrainCircuit className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">SIGMA PATHOGEN INTELLIGENCE</h2>
            <p className="text-sm text-neutral-muted font-medium">{activeMode === 'portable' ? 'Portable Mode' : 'Panel Mode'}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => setActiveMode('portable')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeMode === 'portable' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Portable Mode
            </button>
            <button
              onClick={() => setActiveMode('panel')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeMode === 'panel' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Panel Mode
            </button>
          </div>
          <LandSelector selectedLand={selectedLand} onSelect={setSelectedLand} systemType={activeMode} />
        </div>
      </div>

      {!detection && !analyzing && (
        <motion.div
          key={`analysis-initial-${activeMode}-${lands.length > 0 ? 'has-lands' : 'no-lands'}`}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-[2rem] border border-black/5 p-12 flex flex-col items-center gap-6 text-center shadow-xl shadow-black/5"
        >
          <div className="w-24 h-24 bg-primary/5 rounded-full flex items-center justify-center border-2 border-dashed border-primary/20">
            <Scan className="w-10 h-10 text-primary opacity-60" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-800 uppercase italic">Siap Menganalisis</h3>
            <p className="text-gray-400 text-sm mt-1 max-w-xs">
              Ambil foto langsung dari kamera atau unggah dari galeri untuk memulai deteksi penyakit.
            </p>
          </div>

          <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleCameraInputChange} />
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />

          {lands.length === 0 ? (
            <div className="flex flex-col items-center gap-3 w-full max-w-sm">
              <p className="text-sm text-gray-500">
                Belum ada {activeMode === 'portable' ? 'lokasi' : 'lahan'} tersimpan. Tambahkan satu untuk memulai analisis.
              </p>
              <button
                disabled
                className="flex-1 flex items-center justify-center gap-2.5 bg-gray-200 text-gray-400 px-3 py-2.5 rounded-2xl cursor-not-allowed uppercase tracking-tighter"
              >
                <Camera className="w-4 h-4" />
                Kamera
              </button>
              <button
                disabled
                className="flex-1 flex items-center justify-center gap-2.5 bg-gray-200 text-gray-400 px-3 py-2.5 rounded-2xl cursor-not-allowed uppercase tracking-tighter"
              >
                <Upload className="w-4 h-4 opacity-50" />
                Unggah Foto
              </button>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
              <button
                onClick={handleCameraCapture}
                className="flex-1 flex items-center justify-center gap-2.5 bg-primary hover:bg-primary/90 text-white px-3 py-2.5 rounded-2xl transition-all shadow-xl shadow-primary/20 uppercase tracking-tighter"
              >
                <Camera className="w-4 h-4" />
                Kamera
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 flex items-center justify-center gap-2.5 bg-white hover:bg-gray-50 text-gray-700 px-3 py-2.5 rounded-2xl transition-all border border-gray-100 uppercase tracking-tighter"
              >
                <Upload className="w-4 h-4 opacity-50" />
                Unggah Foto
              </button>
            </div>
          )}

          <div className="flex items-center gap-2 text-xs text-gray-400 bg-gray-50 px-4 py-2 rounded-xl">
            <Info className="w-3.5 h-3.5 shrink-0" />
            Kamera menangkap GPS real-time. Galeri membaca metadata EXIF foto.
          </div>
        </motion.div>
      )}

      {(detection || analyzing) && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          {/* ── Kolom Kiri ── */}
          <div className="lg:col-span-3 space-y-4">
            {/* Image Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <div className="flex items-center gap-2 text-primary">
                  <Scan className="w-4 h-4" />
                  <span className="text-sm font-semibold text-gray-700">Foto Dari Lapangan</span>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => fileInputRef.current?.click()} disabled={analyzing}
                    className="flex items-center gap-1.5 text-xs bg-white hover:bg-gray-50 border border-gray-200 disabled:opacity-50 text-gray-600 px-3 py-1.5 rounded-lg transition-colors font-medium">
                    <Upload className="w-3.5 h-3.5" /> Ganti Foto
                  </button>
                  <button onClick={handleCameraCapture} disabled={analyzing}
                    className="flex items-center gap-1.5 text-xs bg-white hover:bg-gray-50 border border-gray-200 disabled:opacity-50 text-gray-600 px-3 py-1.5 rounded-lg transition-colors font-medium">
                    <Camera className="w-3.5 h-3.5" /> Kamera
                  </button>
                  <button onClick={handleRunDetection} disabled={analyzing}
                    className="flex items-center gap-1.5 text-xs bg-primary hover:bg-primary/90 disabled:bg-gray-200 text-white px-3 py-1.5 rounded-lg transition-colors font-medium">
                    <Play className="w-3.5 h-3.5" />
                    {analyzing ? 'Menganalisis...' : 'Analisis Ulang'}
                  </button>
                </div>
              </div>

              <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleCameraInputChange} />
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />

              <div className="relative bg-gray-900 aspect-video overflow-hidden">
                {capturedImageBase64 ? (
                  <img
                    ref={imgRef}
                    src={capturedImageBase64}
                    alt="Tangkapan kamera lapangan"
                    onLoad={() => setImgLoaded(true)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-gray-800">
                    <Scan className="w-10 h-10 text-gray-600" />
                    <p className="text-gray-500 text-sm">Belum ada gambar</p>
                  </div>
                )}

                {analyzing && (
                  <div className="absolute inset-0 bg-primary/80 flex flex-col items-center justify-center gap-6">
                    <div className="w-16 h-16 border-4 border-secondary/10 border-t-secondary rounded-full animate-spin shadow-2xl" />
                    <div className="text-center">
                      <p className="text-white font-semibold">Proses Analisis Sedang Berjalan...</p>
                      <p className="text-secondary font-bold text-xs uppercase mt-2 tracking-[0.2em] animate-pulse">Validasi Foto → Cek Sensor → Saran Aksi</p>
                    </div>
                    <div className="flex gap-3">
                      {['Kualitas', 'Prediksi', 'Kesesuaian'].map((s, i) => (
                        <div key={s} className="flex items-center gap-1">
                          <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                          <span className="text-primary-300/70 text-xs">{s}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}


                {!analyzing && detection && imgLoaded && bboxStyle && (
                  <AnimatePresence>
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute" style={bboxStyle}>
                      <div className={`w-full h-full border-2 rounded-sm relative ${severity === 'none' ? 'border-primary' : severity === 'high' ? 'border-red-400' : 'border-tertiary'}`}>
                        <div className={`absolute -top-6 left-0 px-2 py-0.5 rounded text-xs font-bold text-white whitespace-nowrap ${severity === 'none' ? 'bg-primary' : severity === 'high' ? 'bg-red-500' : 'bg-tertiary'}`}>
                          {detection.label} — {detection.confidence.toFixed(1)}%
                        </div>
                      </div>
                      <div className={`absolute inset-0 opacity-10 ${severity === 'none' ? 'bg-primary' : severity === 'high' ? 'bg-red-400' : 'bg-tertiary'}`} />
                    </motion.div>
                  </AnimatePresence>
                )}

                <div className="absolute bottom-3 right-3 flex items-center gap-2 bg-primary rounded-full px-4 py-2 border border-white/10 shadow-2xl">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
                  <span className="text-white text-xs font-medium">SIGMA CAM</span>
                </div>
              </div>
            </div>

            {/* Location Card */}
            <LocationCard
              location={loc}
              locationLoading={locationLoading}
              validation={locationValidation}
              captureMode={captureMode}
              manualLand={manualLand}
              onManualLandChange={v => updateSession({ manualLand: v })}
              lands={lands}
            />

            {/* Save Bar */}
            {!analyzing && detection && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-5 py-4 flex items-center gap-4">
                {lastAnalyzed && (
                  <p className="text-xs text-gray-400 flex-1 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {lastAnalyzed.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </p>
                )}
                <button
                  onClick={handleSaveToHistory}
                  disabled={saving || saved}
                  className={`flex items-center gap-2 font-semibold px-5 py-2.5 rounded-xl transition-all duration-200 text-sm ${
                    saved ? 'bg-primary/10 text-primary shadow-inner border border-primary/20'
                      : 'bg-primary text-white hover:opacity-90 shadow-primary/20 active:scale-95'
                  }`}
                >
                  {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : saved ? <CheckCircle className="w-4 h-4" />
                    : <Save className="w-4 h-4" />}
                  {saving ? 'Menyimpan...' : saved ? 'Tersimpan!' : 'Simpan ke Riwayat'}
                </button>
              </div>
            )}
          </div>

          {/* ── Kolom Kanan ── */}
          <div className="lg:col-span-2 space-y-4">
            <AnimatePresence mode="wait">
              {analyzing ? (
                <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 flex flex-col items-center gap-4 text-center"
                >
                  <div className="w-14 h-14 border-4 border-primary/5 border-t-primary rounded-full animate-spin shadow-lg" />
                  <p className="text-gray-500 font-medium">Memproses pipeline analisis...</p>
                </motion.div>
              ) : detection && (
                <motion.div key={detection.label} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="space-y-4"
                >
                  {/* Detection Result */}
                  <div className={`bg-white rounded-2xl shadow-sm border p-5 ${sevCfg.border}`}>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-bold text-gray-700">Hasil Analisis</h3>
                      <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${sevCfg.bg} ${sevCfg.color}`}>
                        {sevCfg.icon} {sevCfg.label}
                      </div>
                    </div>
                    <div className="text-center py-2">
                      <p className="text-2xl font-bold text-gray-900">{detection.label}</p>
                      {detection.pipeline?.overriddenLabel && (
                        <p className="text-xs text-tertiary mt-1">Dikoreksi dari hasil AI asli</p>
                      )}
                      <p className="text-gray-400 text-sm mt-1">Penyakit Terdeteksi</p>
                      <div className="mt-4">
                        <div className="flex justify-between text-xs text-gray-400 mb-1.5">
                          <span>Tingkat Keyakinan</span>
                          <span className="font-bold text-gray-700">{detection.confidence.toFixed(1)}%</span>
                        </div>
                        <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${detection.confidence}%` }}
                            transition={{ duration: 1, delay: 0.2 }}
                            className={`h-full rounded-full ${severity === 'none' ? 'bg-primary' : severity === 'high' ? 'bg-red-500' : 'bg-tertiary'}`}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Pipeline Status */}
                  {detection.pipeline && (
                    <PipelineStatusPanel pipeline={detection.pipeline} />
                  )}

                  {/* Action Steps */}
                  {detection.pipeline?.actionSteps && detection.pipeline.actionSteps.length > 0 && (
                    <ActionStepsPanel steps={detection.pipeline.actionSteps} />
                  )}

                  {/* Recommendation */}
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                    <h3 className="text-sm font-bold text-gray-700 mb-3">Saran Tindakan</h3>
                    <p className="text-sm text-gray-500 leading-relaxed">{diseaseInfo?.recommendation}</p>
                  </div>

                  {/* Model Info */}
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                    <h3 className="text-sm font-bold text-gray-700 mb-3">Rincian Teknis</h3>
                    <div className="space-y-2">
                      {[
                        { label: 'Versi AI', value: 'penyakit-bawang/1' },
                        { label: 'Lahan', value: activeMode === 'panel' ? selectedLand.replace('lahan', 'Lahan ') : 'Portable' },
                        { label: 'Bbox X', value: detection.bbox_x.toFixed(3) },
                        { label: 'Bbox Y', value: detection.bbox_y.toFixed(3) },
                        { label: 'Lebar', value: detection.bbox_width.toFixed(3) },
                        { label: 'Tinggi', value: detection.bbox_height.toFixed(3) },
                      ].map(item => (
                        <div key={item.label} className="flex justify-between text-sm">
                          <span className="text-gray-400">{item.label}</span>
                          <span className="font-medium text-gray-700">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}
    </motion.div>
    </AnimatePresence>
  );
}

// ── Location Card ────────────────────────────────────────────────────────────

function LocationCard({
  location, locationLoading, validation, captureMode, manualLand, onManualLandChange, lands,
}: {
  location: PersistedLocation;
  locationLoading: boolean;
  validation: LandValidationResult | null;
  captureMode: 'camera' | 'upload' | null;
  manualLand: string;
  onManualLandChange: (v: string) => void;
  lands: Land[];
}) {
  const hasLocation = location.latitude !== null && location.longitude !== null;
  const landsWithCoords = lands.filter(l => l.latitude != null && l.longitude != null);

  if (locationLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-5 py-4 flex items-center gap-3">
        <Loader2 className="w-4 h-4 text-primary animate-spin shrink-0" />
        <p className="text-sm text-gray-500">
          {captureMode === 'upload' ? 'Membaca metadata EXIF foto...' : 'Mendapatkan lokasi GPS...'}
        </p>
      </div>
    );
  }

  if (hasLocation) {
    return (
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
        className="bg-secondary/5 rounded-[2rem] border-2 border-dashed border-secondary/10 px-8 py-6 shadow-sm shadow-secondary/5 space-y-4"
      >
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 bg-secondary rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-secondary/20">
            <MapPin className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-sm font-semibold text-secondary">Lokasi Foto</p>
              <span className="text-xs bg-secondary/10 text-secondary px-2 py-0.5 rounded-full font-medium uppercase tracking-wide">
                {location.source === 'gps' ? 'GPS Real-time' : 'EXIF Foto'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2">
              <div>
                <p className="text-xs text-secondary/70">Lintang (Lat)</p>
                <p className="text-sm font-mono font-medium text-secondary">{formatCoord(location.latitude, 'lat')}</p>
              </div>
              <div>
                <p className="text-xs text-secondary/70">Bujur (Lon)</p>
                <p className="text-sm font-mono font-medium text-secondary/80">{formatCoord(location.longitude, 'lon')}</p>
              </div>
            </div>
            {location.timestamp && (
              <p className="text-xs text-secondary/70 mt-1.5">Waktu Pengambilan: {location.timestamp}</p>
            )}
          </div>
        </div>

        {landsWithCoords.length > 0 && validation && (
          <div className={`rounded-2xl border px-4 py-3.5 ${validation.withinRadius ? 'bg-secondary/10 border-secondary/20' : 'bg-red-50 border-red-200'}`}>
            <div className="flex items-start gap-3">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${validation.withinRadius ? 'bg-secondary' : 'bg-red-500'}`}>
                {validation.withinRadius ? <ShieldCheck className="w-4 h-4 text-white" /> : <ShieldX className="w-4 h-4 text-white" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold ${validation.withinRadius ? 'text-secondary' : 'text-red-700'}`}>
                  {validation.withinRadius ? 'Lokasi Sesuai — Valid' : 'Lokasi Tidak Sesuai — Di Luar Lahan'}
                </p>
                {validation.land && (
                  <p className={`text-xs mt-0.5 ${validation.withinRadius ? 'text-tertiary' : 'text-red-600'}`}>
                    Lahan terdekat: <span className="font-semibold">{validation.land.label}</span>
                    {validation.distanceM != null && (
                      <span className="ml-1 opacity-70">({validation.distanceM < 1000 ? `${validation.distanceM} m` : `${(validation.distanceM / 1000).toFixed(1)} km`})</span>
                    )}
                  </p>
                )}
                {!validation.withinRadius && validation.land && (
                  <p className="text-xs text-red-500 mt-1">
                    Melebihi radius toleransi {validation.land.radius_m ?? 500} m.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {landsWithCoords.length === 0 && (
          <div className="flex items-center gap-2.5 bg-white/70 rounded-xl border border-secondary/10 px-4 py-3">
            <Navigation className="w-4 h-4 text-secondary shrink-0" />
            <p className="text-xs text-secondary/70">
              Atur koordinat lahan di Pengaturan untuk mengaktifkan validasi otomatis.
            </p>
          </div>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
      className="bg-tertiary/10 rounded-2xl border border-tertiary/20 px-5 py-4"
    >
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
          <MapPinOff className="w-4 h-4 text-tertiary opacity-40" />
        </div>
        <div className="flex-1">
          {location.error && <p className="text-sm text-tertiary font-medium mb-3">{location.error}</p>}
          {!location.error && <p className="text-sm text-tertiary font-medium mb-3">Pilih lahan untuk melanjutkan penyimpanan.</p>}
          <div className="relative">
            <select
              value={manualLand}
              onChange={e => onManualLandChange(e.target.value)}
              disabled={lands.length === 0}
              className="w-full appearance-none bg-white border border-black/5 rounded-2xl px-5 py-4 text-[13px] font-black uppercase tracking-widest italic text-tertiary focus:outline-none focus:ring-4 focus:ring-tertiary/10 transition-all pr-12 shadow-sm disabled:opacity-50"
            >
              {lands.length > 0 ? (
                lands.map(o => <option key={o.id} value={o.id}>{o.label}</option>)
              ) : (
                <option value="">Belum Ada Lahan</option>
              )}
            </select>
            <ChevronDown className="w-4 h-4 text-tertiary/30 absolute right-4 top-1/2 -translate-y-1/2" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
