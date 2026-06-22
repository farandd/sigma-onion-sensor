import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { SensorReading, SystemType } from '../../types';
import { 
  Droplets, FlaskConical, Thermometer, 
  Smartphone, Activity, RefreshCw, AlertCircle 
} from 'lucide-react';

interface OnionRealtimeDashboardProps {
  landId?: string;
  systemType?: SystemType;
}

export default function OnionRealtimeDashboard({ 
  landId = "lahan1",
  systemType = 'panel'
}: OnionRealtimeDashboardProps) {
  
  // FIX: Mengunci inisialisasi awal pada angka 0 (Bukan data random)
  const [sensorData, setSensorData] = useState<SensorReading>({
    system_type: systemType,
    land_id: landId,
    nitrogen: 0,
    phosphorus: 0,
    potassium: 0,
    ph: 0,
    moisture: 0,
    temperature: 0,
    conductivity: 0,
    created_at: undefined
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [pulseEffect, setPulseEffect] = useState(false);

  // FIX: Tarik 1 baris teratas data paling teranyar secara global bebas filter
  // Menggunakan tabel yang sesuai berdasarkan system_type
  const fetchLatestData = async () => {
    try {
      setLoading(true);
      const tableName = systemType === 'portable' ? 'sensor_readings_portable' : 'sensor_readings_panel';
      const { data, error: dbError } = await supabase
        .from(tableName)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (dbError) throw dbError;
      if (data) {
        setSensorData(data);
      }
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      console.error("Gagal mengambil data sensor global:", message);
      setError("Gagal memuat data terbaru dari database.");
    } finally {
      setLoading(false);
    }
  };

  // FIX: Pasang koneksi broadcast realtime secara global tanpa mengunci filter string
  useEffect(() => {
    fetchLatestData();

    const tableName = systemType === 'portable' ? 'sensor_readings_portable' : 'sensor_readings_panel';
    console.log(`[DASHBOARD] Membuka koneksi Realtime Global untuk tabel ${tableName}...`);

    const channel = supabase
      .channel(`sensor-dashboard-${systemType}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: tableName
        },
        (payload) => {
          const newReading = payload.new as SensorReading;
          console.log(`Dashboard mendeteksi data baru masuk secara global (${tableName}):`, newReading);
          
          setSensorData(newReading);
          
          setPulseEffect(true);
          setTimeout(() => setPulseEffect(false), 1500);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsLive(true);
          console.log("Dashboard sukses terhubung ke broadcast Realtime Supabase!");
        } else {
          setIsLive(false);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [systemType]);

  const getSoilStatus = () => {
    if (!sensorData.created_at) {
      return { text: "Menunggu Transmisi Data Pertama dari Alat Lapangan...", color: "text-gray-600 bg-gray-50 border-gray-200" };
    }
    if (sensorData.ph < 5.5) return { text: "Kadar Asam Tinggi (Butuh Kapur Dolomit)", color: "text-red-600 bg-red-50 border-red-200 animate-pulse" };
    if (sensorData.ph > 7.0) return { text: "Terlalu Basa (Butuh Pemupukan Sulfur/ZA)", color: "text-amber-600 bg-amber-50 border-amber-200" };
    if (sensorData.moisture < 40) return { text: "Tanah Kering (Perlu Penyiraman / Irigasi)", color: "text-accent-viola bg-accent-viola/10 border-accent-viola/20" };
    return { text: "Kondisi Tanah Optimal (Sangat Ideal untuk Bawang Merah)", color: "text-accent-straken bg-accent-straken/10 border-accent-straken/20" };
  };

  const status = getSoilStatus();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[350px] bg-neutral-50 rounded-2xl border border-black/5 p-8">
        <RefreshCw className="w-8 h-8 text-secondary animate-spin mb-3" />
        <p className="text-sm font-semibold text-gray-500 font-sans">Mengkoneksikan ke database...</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      
      {/* Header Dashboard */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-black/5 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-gray-800 tracking-tight">SIGMA REALTIME MONITOR</h1>
            {isLive ? (
              <span className="flex items-center gap-1 text-[10px] font-extrabold text-accent-straken bg-accent-straken/10 border border-accent-straken/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-accent-straken animate-ping" /> Live Connection
              </span>
            ) : (
              <span className="text-[10px] font-bold text-gray-400 bg-gray-100 border border-gray-200 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Offline
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-1 flex items-center gap-1.5">
            <Smartphone className="w-3.5 h-3.5" /> Sumber Database: <span className="font-semibold text-accent-straken font-mono">{systemType === 'portable' ? 'sensor_readings_portable' : 'sensor_readings_panel'}</span>
            {sensorData.land_id && (
              <>
                <span className="text-gray-300">|</span>
                <span>Lahan Terdeteksi: <span className="font-semibold text-accent-texture font-mono">{sensorData.land_id}</span></span>
              </>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {sensorData.created_at && (
            <span className="text-xs text-gray-400 font-medium">
              Transmisi Alat: {new Date(sensorData.created_at).toLocaleTimeString('id-ID')}
            </span>
          )}
          <button 
            onClick={fetchLatestData}
            className="p-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 transition-colors border border-black/5 text-gray-600"
            title="Refresh Data Manual"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-semibold">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Indikator Status Kelayakan */}
      <div className={`p-4 rounded-xl border flex items-center justify-between transition-all duration-500 ${status.color} ${pulseEffect ? 'ring-4 ring-accent-melrose/50 border-accent-melrose bg-accent-melrose/20' : ''}`}>
        <div className="flex items-center gap-3">
          <Activity className="w-5 h-5 shrink-0" />
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide opacity-80">Rekomendasi Lahan</p>
            <p className="text-sm font-black tracking-tight mt-0.5">{status.text}</p>
          </div>
        </div>
        <span className="text-[10px] font-black px-3 py-1 bg-white/70 border border-current rounded-xl uppercase">
          Bawang Merah
        </span>
      </div>

      {/* Grid parameter sensor */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* NPK Card */}
        <div className="bg-white p-6 rounded-2xl border border-black/5 shadow-sm space-y-4">
          <h2 className="text-xs font-black uppercase text-gray-400 tracking-wider">Kadar NPK Tanah (mg/kg)</h2>
          
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span>Nitrogen (N)</span>
                <span className="text-accent-straken font-extrabold">{sensorData.nitrogen} mg/kg</span>
              </div>
              <div className="w-full bg-neutral-100 h-2 rounded-full overflow-hidden">
                <div className="bg-accent-straken h-full rounded-full transition-all duration-1000" style={{ width: `${Math.min((sensorData.nitrogen / 100) * 100, 100)}%` }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span>Fosfor (P)</span>
                <span className="text-accent-rosemary font-extrabold">{sensorData.phosphorus} mg/kg</span>
              </div>
              <div className="w-full bg-neutral-100 h-2 rounded-full overflow-hidden">
                <div className="bg-accent-rosemary h-full rounded-full transition-all duration-1000" style={{ width: `${Math.min((sensorData.phosphorus / 100) * 100, 100)}%` }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span>Kalium (K)</span>
                <span className="text-accent-viola font-extrabold">{sensorData.potassium} mg/kg</span>
              </div>
              <div className="w-full bg-neutral-100 h-2 rounded-full overflow-hidden">
                <div className="bg-accent-viola h-full rounded-full transition-all duration-1000" style={{ width: `${Math.min((sensorData.potassium / 200) * 100, 100)}%` }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* pH Card */}
        <div className="bg-white p-6 rounded-2xl border border-black/5 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-xs font-black uppercase text-gray-400 tracking-wider">Derajat Keasaman (pH)</span>
            <div className="w-10 h-10 rounded-xl bg-accent-rosemary/15 flex items-center justify-center text-accent-straken"><FlaskConical className="w-5 h-5" /></div>
          </div>
          <div className="my-4">
            <h3 className="text-4xl font-black text-gray-800 tracking-tight">{Number(sensorData.ph).toFixed(2)}</h3>
            <p className="text-[10px] font-bold text-gray-400 mt-1">Sifat tanah: {sensorData.ph < 7.0 ? 'Asam' : sensorData.ph > 7.0 ? 'Basa' : 'Netral'}</p>
          </div>
          <div className="w-full bg-neutral-100 h-2 rounded-full overflow-hidden">
            <div className="bg-accent-straken h-full rounded-full transition-all duration-1000" style={{ width: `${(sensorData.ph / 14) * 100}%` }}></div>
          </div>
        </div>

        {/* Kelembaban & Suhu */}
        <div className="bg-white p-6 rounded-2xl border border-black/5 shadow-sm flex flex-col justify-between gap-4">
          <div className="flex items-center justify-between border-b pb-2">
            <div className="flex items-center gap-2">
              <Droplets className="w-4 h-4 text-accent-viola" />
              <span className="text-xs font-bold text-gray-600">Kelembaban Tanah</span>
            </div>
            <span className="text-lg font-black text-gray-800">{sensorData.moisture}%</span>
          </div>

          <div className="flex items-center justify-between border-b pb-2">
            <div className="flex items-center gap-2">
              <Thermometer className="w-4 h-4 text-red-500" />
              <span className="text-xs font-bold text-gray-600">Suhu Tanah</span>
            </div>
            <span className="text-lg font-black text-gray-800">{sensorData.temperature}°C</span>
          </div>

          <div className="text-[9px] text-gray-400 font-semibold italic">
            * Parameter tanah di-broadcast instan menggunakan Supabase Realtime Channel secara global.
          </div>
        </div>
      </div>

      {/* Section Indikator Lengkap */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 rounded-2xl border border-black/5 shadow-sm">
        <h2 className="col-span-full text-sm font-black uppercase text-gray-800 tracking-wider mb-2">Panduan Nilai Optimal Parameter Tanah</h2>
        
        {[
          { label: 'Nitrogen (N)', optimal: '20–60 mg/kg', desc: 'Penting untuk pertumbuhan vegetatif tanaman.' },
          { label: 'Fosfor (P)', optimal: '10–40 mg/kg', desc: 'Mendukung perkembangan akar dan energi tanaman.' },
          { label: 'Kalium (K)', optimal: '80–200 mg/kg', desc: 'Meningkatkan ketahanan tanaman terhadap penyakit.' },
          { label: 'pH Tanah', optimal: '5.5–7.0', desc: 'Tingkat keasaman yang ideal untuk penyerapan nutrisi.' },
          { label: 'Kelembaban', optimal: '40–70 %', desc: 'Kadar air tanah agar bawang tetap tumbuh subur.' },
          { label: 'Konduktivitas', optimal: '0.5–2.5 mS/cm', desc: 'Tingkat konsentrasi garam/nutrisi terlarut.' }
        ].map((item) => (
          <div key={item.label} className="flex gap-3 p-3 rounded-xl bg-gray-50">
            <div className="w-1.5 rounded-full bg-primary" />
            <div>
              <p className="text-xs font-bold text-gray-800">{item.label} <span className="text-primary font-normal">({item.optimal})</span></p>
              <p className="text-[10px] text-gray-500 mt-0.5">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
