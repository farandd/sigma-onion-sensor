import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  History, Thermometer, BrainCircuit, Calendar, Search, X,
  AlertTriangle, ShieldAlert, CheckCircle, ChevronRight,
  Droplets, Leaf, Zap, Flame, FlaskConical, Activity,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useApp } from '../contexts/AppContext';
import { SensorReading, AIAnalysisRecord, Land } from '../types';
import { SENSOR_CONFIGS } from '../constants/sensors';
import { useLands } from '../hooks/useLands';

type TabType = 'sensor' | 'ai';

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}
function monthAgoStr() {
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  return d.toISOString().slice(0, 10);
}
function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

const SENSOR_ICONS: Record<string, React.ReactNode> = {
  moisture: <Droplets className="w-4 h-4" />,
  nitrogen: <Leaf className="w-4 h-4" />,
  phosphorus: <FlaskConical className="w-4 h-4" />,
  potassium: <Zap className="w-4 h-4" />,
  temperature: <Flame className="w-4 h-4" />,
  ph: <Activity className="w-4 h-4" />,
  conductivity: <Zap className="w-4 h-4" />,
};

const DISEASE_SEVERITY: Record<string, 'high' | 'medium' | 'none'> = {
  'Alternaria Porri': 'high',
  'Botrytis Leaf Blight': 'high',
  'Purple Blotch': 'medium',
  'Stemphylium Leaf Blight': 'medium',
  'Sehat': 'none',
};

const severityCfg = {
  high: { label: 'Risiko Tinggi', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', dot: 'bg-red-500', icon: <AlertTriangle className="w-4 h-4" /> },
  medium: { label: 'Risiko Sedang', color: 'text-tertiary', bg: 'bg-tertiary/10', border: 'border-tertiary/20', dot: 'bg-amber-500', icon: <ShieldAlert className="w-4 h-4" /> },
  none: { label: 'Sehat', color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/20', dot: 'bg-primary', icon: <CheckCircle className="w-4 h-4" /> },
};

function SensorDetailModal({ record, onClose, lands }: { record: SensorReading; onClose: () => void; lands: Land[] }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.2 }}
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary shadow-sm">
              <Thermometer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm tracking-tighter">Rincian Sensor</h3>
              <p className="text-[10px] text-neutral-muted opacity-60 ">{record.created_at ? formatDate(record.created_at) : '—'}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-2 bg-gray-50 border-b border-gray-100 shrink-0">
          <div className="flex gap-4 text-xs text-gray-500">
            <span>Jenis Mode: <span className="font-medium text-gray-700 capitalize">{record.system_type}</span></span>
            <span>Nama Lahan: <span className="font-medium text-gray-700 capitalize">
              {lands.find(l => l.id === record.land_id)?.label ?? record.land_id ?? 'Tidak Ada'}
            </span></span>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 overscroll-contain">
        <div className="px-6 py-5 grid grid-cols-2 gap-3">
          {SENSOR_CONFIGS.map(c => {
            const val = record[c.key] as number;
            const isGood = val >= c.goodMin && val <= c.goodMax;
            const pct = Math.min(100, Math.max(0, ((val - c.min) / (c.max - c.min)) * 100));
            return (
              <div key={c.key} className={`rounded-xl border p-3.5 ${isGood ? 'border-primary/20 bg-primary/5' : 'border-tertiary/20 bg-tertiary/5'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className={isGood ? 'text-primary' : 'text-tertiary'}>{SENSOR_ICONS[c.key]}</span>
                  <span className="text-neutral-muted opacity-50">{c.label}</span>
                </div>
                <p className={`text-xl font-bold ${isGood ? 'text-primary' : 'text-tertiary'}`}>
                  {c.key === 'conductivity' ? val.toFixed(3) : c.key === 'ph' ? val.toFixed(2) : val.toFixed(1)}
                  <span className="text-xs font-normal text-gray-400 ml-1">{c.unit}</span>
                </p>
                <div className="mt-2 h-1.5 bg-white rounded-full overflow-hidden border border-gray-100">
                  <div
                    className={`h-full rounded-full transition-all ${isGood ? 'bg-primary' : 'bg-tertiary'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className={`text-xs mt-1.5 font-medium ${isGood ? 'text-primary' : 'text-tertiary'}`}>
                  {isGood ? 'Baik' : 'Tidak Baik'}
                </p>
              </div>
            );
          })}
        </div>
        </div>
      </motion.div>
    </div>
  );
}

function AIDetailModal({ record, onClose, lands }: { record: AIAnalysisRecord; onClose: () => void; lands: Land[] }) {
  const severity = DISEASE_SEVERITY[record.disease_name] ?? 'none';
  const sev = severityCfg[severity];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.2 }}
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm tracking-tighter text-gray-800">Detail Analisis AI</h3>
              <p className="text-xs text-gray-400">{record.created_at ? formatDate(record.created_at) : '—'}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 overscroll-contain">
        <div className={`mx-6 mt-5 rounded-xl border p-4 ${sev.border} ${sev.bg}`}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-gray-500">Penyakit Terdeteksi</p>
            <div className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${sev.bg} ${sev.color}`}>
              {sev.icon}
              {sev.label}
            </div>
          </div>
          <p className={`text-2xl font-bold ${sev.color}`}>{record.disease_name}</p>
          <div className="mt-3">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>Kepercayaan Model</span>
              <span className="font-bold text-gray-700">{record.confidence.toFixed(1)}%</span>
            </div>
            <div className="h-2 bg-white/60 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${record.confidence}%` }}
                transition={{ duration: 0.8 }}
                className={`h-full rounded-full ${sev.dot}`}
              />
            </div>
          </div>
        </div>

        <div className="px-6 mt-4">
          <p className="text-xs font-semibold text-gray-700 mb-2">Rekomendasi Tindakan</p>
          <p className="text-sm text-gray-500 leading-relaxed">{record.recommendation}</p>
        </div>

        <div className="px-6 mt-4 pb-5">
          <p className="text-xs font-semibold text-gray-700 mb-2">Rincian Analisis</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {[
              { label: 'Jenis Mode', value: record.system_type },
              { label: 'Nama Lahan', value: lands.find(l => l.id === record.land_id)?.label ?? record.land_id },
              { label: 'Bbox X', value: record.bbox_x?.toFixed(3) ?? '—' },
              { label: 'Bbox Y', value: record.bbox_y?.toFixed(3) ?? '—' },
              { label: 'Lebar', value: record.bbox_width?.toFixed(3) ?? '—' },
              { label: 'Tinggi', value: record.bbox_height?.toFixed(3) ?? '—' },
            ].map(item => (
              <div key={item.label} className="flex justify-between bg-gray-50 rounded-lg px-3 py-2">
                <span className="text-gray-400">{item.label}</span>
                <span className="font-medium text-gray-700 capitalize">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function HistoryPage() {
  const { user } = useAuth();
  const { activeMode } = useApp();
  const { lands } = useLands();
  const [tab, setTab] = useState<TabType>('sensor');
  const [historyViewMode, setHistoryViewMode] = useState(activeMode);

  useEffect(() => {
    setHistoryViewMode(activeMode);
  }, [activeMode]);
  
  const [sensorHistory, setSensorHistory] = useState<SensorReading[]>([]);
  const [aiHistory, setAiHistory] = useState<AIAnalysisRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState(monthAgoStr());
  const [endDate, setEndDate] = useState(todayStr());
  const [dateError, setDateError] = useState('');
  const [selectedSensor, setSelectedSensor] = useState<SensorReading | null>(null);
  const [selectedAI, setSelectedAI] = useState<AIAnalysisRecord | null>(null);

  useEffect(() => {
    if (!user) return;
    if (startDate > endDate) {
      setDateError('Tanggal mulai tidak boleh lebih besar dari tanggal akhir.');
      return;
    }
    setDateError('');
    setLoading(true);

    const startIso = `${startDate}T00:00:00.000Z`;
    const endIso = `${endDate}T23:59:59.999Z`;

    if (tab === 'sensor') {
      // Menggunakan tabel yang sesuai berdasarkan system_type
      const tableName = historyViewMode === 'portable' ? 'sensor_readings_portable' : 'sensor_readings_panel';
      supabase
        .from(tableName)
        .select('*')
        .eq('user_id', user.id)
        .eq('system_type', historyViewMode)
        .gte('created_at', startIso)
        .lte('created_at', endIso)
        .order('created_at', { ascending: false })
        .limit(100)
        .then(({ data }) => {
          setSensorHistory(data ?? []);
          setLoading(false);
        });
    } else {
      supabase
        .from('ai_analysis')
        .select('*')
        .eq('user_id', user.id)
        .eq('system_type', historyViewMode)
        .gte('created_at', startIso)
        .lte('created_at', endIso)
        .order('created_at', { ascending: false })
        .limit(100)
        .then(({ data }) => {
          setAiHistory(data ?? []);
          setLoading(false);
        });
    }
  }, [user, historyViewMode, tab, startDate, endDate]);

  function resetDates() {
    setStartDate(monthAgoStr());
    setEndDate(todayStr());
  }

  const hasCustomRange = startDate !== monthAgoStr() || endDate !== todayStr();

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-white shadow-xl shadow-primary/20">
          <History className="w-6 h-6" />
        </div>
          <div>
            <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">Riwayat Pemantauan</h2>
            <p className="text-sm text-neutral-muted font-medium">{historyViewMode === 'portable' ? 'Portable Mode' : 'Panel Mode'}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 mb-4">
          <p className="text-[10px] font-black uppercase italic tracking-widest text-primary">Pilih Mode</p>
          <div className="flex bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => setHistoryViewMode('portable')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                historyViewMode === 'portable' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Portable Mode
            </button>
            <button
              onClick={() => setHistoryViewMode('panel')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                historyViewMode === 'panel' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Panel Mode
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
            <div className="flex items-center gap-2 mb-5 text-[10px] font-black uppercase italic tracking-widest text-primary">
              <Calendar className="w-3.5 h-3.5" />
              <span className="font-medium text-gray-700">Pilih Tanggal</span>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 flex-1">
              <div className="flex items-center gap-2 flex-1">
                <span className="text-xs text-gray-400 whitespace-nowrap">Dari</span>
                <input
                  type="date"
                  value={startDate}
                  max={endDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="w-full bg-transparent border-2 border-black/5 rounded-xl p-3 text-xs font-bold text-gray-700 focus:outline-none focus:border-primary transition-all uppercase tracking-widest"
                />
              </div>
              <div className="flex items-center gap-2 flex-1">
                <span className="text-xs text-gray-400 whitespace-nowrap">Sampai</span>
                <input
                  type="date"
                  value={endDate}
                  min={startDate}
                  max={todayStr()}
                  onChange={e => setEndDate(e.target.value)}
                  className="w-full bg-transparent border-2 border-black/5 rounded-xl p-3 text-xs font-bold text-gray-700 focus:outline-none focus:border-primary transition-all uppercase tracking-widest"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              {hasCustomRange && (
                <button
                  onClick={resetDates}
                  className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 bg-gray-100 px-3 py-2 rounded-xl transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                  Reset
                </button>
              )}
              <div className="flex items-center gap-1.5 text-xs text-primary bg-primary/10 px-3 py-2 rounded-xl">
                <Search className="w-3.5 h-3.5" />
                {loading ? 'Memuat...' : 'Data Terbaru'}
              </div>
            </div>
          </div>
          {dateError && <p className="text-xs text-red-500 mt-2">{dateError}</p>}
        </div>


      <div className="flex items-center gap-3">
        <div className="flex bg-gray-100 rounded-xl p-1">
          <button
            onClick={() => setTab('sensor')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              tab === 'sensor' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Thermometer className="w-4 h-4" />
            Data Sensor
            {tab === 'sensor' && !loading && (
              <span className="bg-primary/10 text-primary text-xs px-1.5 py-0.5 rounded-full">{sensorHistory.length}</span>
            )}
          </button>
          <button
            onClick={() => setTab('ai')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              tab === 'ai' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <BrainCircuit className="w-4 h-4" />
            Analisis AI
            {tab === 'ai' && !loading && (
              <span className="bg-primary/10 text-primary text-xs px-1.5 py-0.5 rounded-full">{aiHistory.length}</span>
            )}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
          </div>
        ) : tab === 'sensor' ? (
          sensorHistory.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <Thermometer className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">Belum ada Catatan Sensor</p>
              <p className="text-sm mt-1">Coba atur ulang tanggal atau tunggu pembaruan otomatis</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Waktu Pencatatan</th>
                    <th className="text-left px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Nama Lahan</th>
                    {SENSOR_CONFIGS.map(c => (
                      <th key={c.key} className="text-right px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                        {c.label}
                      </th>
                    ))}
                    <th className="px-3 py-3 w-8" />
                  </tr>
                </thead>
                <tbody>
                  {sensorHistory.map((row, i) => (
                    <motion.tr
                      key={row.id ?? i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.02 }}
                      onClick={() => setSelectedSensor(row)}
                      className="group hover:bg-primary/5 cursor-pointer transition-all duration-300"
                    >
                      <td className="px-6 py-4 text-[11px] font-mono text-gray-500 font-bold tracking-tight whitespace-nowrap">{formatDate(row.created_at!)}</td>
                            <td className="px-3 py-4 text-[10px] font-black capitalize text-center text-primary/70">
                              {lands.find(l => l.id === row.land_id)?.label ?? row.land_id ?? 'Tidak Ada'}
                            </td>
                      {SENSOR_CONFIGS.map(c => {
                        const val = row[c.key] as number;
                        const isGood = val >= c.goodMin && val <= c.goodMax;
                        return (
                          <td key={c.key} className="px-3 py-3 text-right">
                            <span className={`font-medium ${isGood ? 'text-primary' : 'text-tertiary'}`}>
                              {c.key === 'conductivity' ? val.toFixed(3) : c.key === 'ph' ? val.toFixed(2) : val.toFixed(1)}
                              <span className="text-gray-400 font-normal ml-0.5 text-xs">{c.unit}</span>
                            </span>
                          </td>
                        );
                      })}
                      <td className="px-6 text-gray-300 group-hover:text-primary transition-all">
                        <ChevronRight className="w-4 h-4 translate-x-[-4px] group-hover:translate-x-0" />
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          aiHistory.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <BrainCircuit className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">Belum ada Catatan Analisis AI</p>
              <p className="text-sm mt-1">Simpan hasil analisis di halaman Analisis AI untuk melihat daftar riwayat</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {aiHistory.map((row, i) => {
                const severity = DISEASE_SEVERITY[row.disease_name] ?? 'none';
                const sev = severityCfg[severity];
                return (
                  <motion.div
                    key={row.id ?? i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    onClick={() => setSelectedAI(row)}
                    className="group flex items-center gap-6 px-8 py-6 hover:bg-primary/5 cursor-pointer transition-all border-l-4 border-transparent hover:border-primary"
                  >
                    <div className={`w-2 h-2 rounded-full shrink-0 ${sev.dot}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-gray-800">{row.disease_name}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${sev.bg} ${sev.color}`}>
                          {sev.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <p className="text-xs text-gray-400">{row.created_at ? formatDate(row.created_at) : '—'}</p>
                        <span className="text-gray-300">·</span>
                        <p className="text-xs text-gray-400 capitalize font-medium">
                          {lands.find(l => l.id === row.land_id)?.label ?? row.land_id}
                        </p>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className={`text-sm font-bold ${sev.color}`}>{row.confidence.toFixed(1)}%</p>
                      <p className="text-xs text-gray-400">Tingkat Keyakinan</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-200 group-hover:text-primary transition-all translate-x-[-10px] group-hover:translate-x-0" />
                  </motion.div>
                );
              })}
            </div>
          )
        )}
      </div>

      <AnimatePresence>
        {selectedSensor && (
          <SensorDetailModal record={selectedSensor} onClose={() => setSelectedSensor(null)} lands={lands} />
        )}
        {selectedAI && (
          <AIDetailModal record={selectedAI} onClose={() => setSelectedAI(null)} lands={lands} />
        )}
      </AnimatePresence>
    </div>
  );
}