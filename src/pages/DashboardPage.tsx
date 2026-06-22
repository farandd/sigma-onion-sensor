import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Smartphone, MonitorSpeaker,
  BrainCircuit, Camera, AlertTriangle, ShieldAlert, CheckCircle, Clock, MapPin, RefreshCw, Plus,
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { useSensorData } from '../hooks/useSensorData';
import { useLands } from '../hooks/useLands';
import SensorCard from '../components/dashboard/SensorCard';
import StatusLegendCard from '../components/dashboard/StatusLegendCard';
import LandSelector from '../components/dashboard/LandSelector';
import LandAddModal from '../components/dashboard/LandAddModal';
import SensorGuide from '../components/dashboard/SensorGuide';
import { SENSOR_CONFIGS } from '../constants/sensors';
import { SensorReading, Land, AIAnalysisRecord, SystemType, LandId } from '../types';
import { supabase } from '../lib/supabase';

const DISEASE_SEVERITY: Record<string, 'high' | 'medium' | 'none'> = {
  'Alternaria Porri': 'high',
  'Botrytis Leaf Blight': 'high',
  'Purple Blotch': 'medium',
  'Stemphylium Leaf Blight': 'medium',
  'Sehat': 'none',
};

const severityCfg = {
  high: { label: 'Risiko Tinggi', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', dot: 'bg-red-500', icon: <AlertTriangle className="w-3.5 h-3.5" /> },
  medium: { label: 'Risiko Sedang', color: 'text-accent-viola', bg: 'bg-accent-viola/10', border: 'border-accent-viola/20', dot: 'bg-accent-viola', icon: <ShieldAlert className="w-3.5 h-3.5" /> },
  none: { label: 'Sehat', color: 'text-accent-straken', bg: 'bg-accent-straken/10', border: 'border-accent-straken/20', dot: 'bg-accent-straken', icon: <CheckCircle className="w-3.5 h-3.5" /> },
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Baru saja';
  if (mins < 60) return `${mins} mnt lalu`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} jam lalu`;
  return `${Math.floor(hrs / 24)} hari lalu`;
}

function useLatestAI(systemType: SystemType, landId: LandId) {
  const { user } = useAuth();
  const [latest, setLatest] = useState<AIAnalysisRecord | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('ai_analysis')
      .select('*')
      .eq('user_id', user.id)
      .eq('system_type', systemType)
      .eq('land_id', landId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => setLatest(data));
  }, [user, systemType, landId]);

  return latest;
}

function AIStatusBanner({ systemType, landId }: { systemType: SystemType; landId: LandId }) {
  const { setActivePage } = useApp();
  const latest = useLatestAI(systemType, landId);
  const severity = latest ? (DISEASE_SEVERITY[latest?.disease_name] ?? 'none') : null;
  const sev = severity ? severityCfg[severity] : null;

  return (
    <div className={`rounded-2xl border px-4 py-3 flex items-center gap-3 ${sev ? `${sev.border} ${sev.bg}` : 'border-black/5 bg-white'}`}>
      {sev ? (
        <>
          <div className={`w-2 h-2 rounded-full shrink-0 ${sev.dot}`} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className={`text-xs font-bold ${sev.color}`}>{latest?.disease_name ?? '—'}</p>
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${sev.bg} ${sev.color} border ${sev.border}`}>
                {sev.label}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <span className="flex items-center gap-1 text-xs text-gray-400">
                <Clock className="w-3 h-3 shrink-0" />
                {latest?.created_at ? timeAgo(latest.created_at) : '—'}
              </span>
              {latest?.confidence != null && (
                <span className="text-xs text-gray-400">{latest.confidence?.toFixed(0) ?? '0'}% kepercayaan</span>
              )}
              {latest?.latitude != null && (
                <span className="flex items-center gap-0.5 text-xs text-secondary">
                  <MapPin className="w-3 h-3 shrink-0" />
                  {latest.latitude?.toFixed(4) ?? '0'}, {latest.longitude?.toFixed(4) ?? '0'}
                </span>
              )}
            </div>
          </div>
        </>
      ) : (
        <>
          <BrainCircuit className="w-4 h-4 text-gray-300 shrink-0" />
          <p className="text-xs text-gray-400 flex-1">Belum ada analisis penyakit untuk lahan ini</p>
        </>
      )}
      <button
        onClick={() => setActivePage('ai-analysis')}
        className="flex items-center gap-1.5 text-xs font-semibold text-white bg-accent-texture hover:bg-accent-texture/90 px-3 py-1.5 rounded-xl transition-colors shrink-0 shadow-sm shadow-accent-texture/20"
      >
        <Camera className="w-3.5 h-3.5" />
        Analisis Foto
      </button>
    </div>
  );
}

function PortableDashboard() {
  const { activeMode, selectedLand, setSelectedLand } = useApp();
  const { lands, loading: landsLoading, refetch } = useLands(activeMode);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const {
    sensorData,
    loading,
    refreshSensorData,
  } = useSensorData(activeMode, selectedLand);
  
  const prevDataRef = useRef<SensorReading | null>(null);

  useEffect(() => {
    if (lands.length === 0) return;
    const exists = lands.some(l => l.id === selectedLand);
    if (!exists) setSelectedLand(lands[0].id);
  }, [lands, selectedLand, setSelectedLand]);

  if (landsLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <RefreshCw className="w-6 h-6 text-gray-400 animate-spin" />
      </div>
    );
  }

  if (lands.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] bg-gray-50 border border-gray-100 rounded-[2rem] p-8 md:p-16 text-center animate-in fade-in duration-300 shadow-xl shadow-black/5">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6 border-2 border-dashed border-gray-300">
          <MapPin className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight mb-2">
          Belum Ada Lokasi Tersimpan
        </h3>
        <p className="text-sm text-gray-500 max-w-sm mb-8 font-medium">
          Anda belum memiliki lokasi yang tersimpan di sistem Portable Anda. Mau tambah lokasi sekarang?
        </p>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-6 py-3 bg-primary text-white font-black rounded-2xl shadow-xl shadow-primary/30 hover:opacity-90 active:scale-95 transition-all uppercase text-xs tracking-wider"
        >
          <Plus className="w-4 h-4" />
          Tambah Lokasi Baru
        </button>
        
        <LandAddModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSuccess={(newLand) => {
            refetch();
            setSelectedLand(newLand.id);
          }}
          systemType={activeMode}
        />
      </div>
    );
  }
  
  const prevData = prevDataRef.current;
  prevDataRef.current = sensorData;

  const currentLandName = lands.find(l => l.id === selectedLand)?.label || 'Lokasi Portable';
  const detectedCount = SENSOR_CONFIGS.filter(config => (sensorData[config.key as keyof SensorReading] as number) > 0).length;

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-accent-rosemary/15 rounded-xl flex items-center justify-center shrink-0">
            <Smartphone className="w-5 h-5 text-accent-straken" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">Portable Mode</h2>
            <p className="text-sm text-neutral-muted font-medium">Pembacaan manual dari sensor lapangan</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => refreshSensorData(true)}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-accent-straken text-white text-xs font-black shadow-sm shadow-accent-straken/20 disabled:opacity-60 disabled:cursor-not-allowed hover:bg-accent-straken/90 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 shrink-0 ${loading ? 'animate-spin' : ''}`} />
            AMBIL DATA
          </button>
          <div className="flex-1">
            <LandSelector selectedLand={selectedLand} onSelect={setSelectedLand} systemType={activeMode} />
          </div>
        </div>
      </div>

      <motion.div
        key={selectedLand}
        initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }}
        className="space-y-6"
      >
        <AIStatusBanner systemType={activeMode} landId={selectedLand} />

        <div>
          <div className="flex items-center justify-between mb-4 border-b border-black/5 pb-2">
            <h3 className="text-base font-black text-gray-800 tracking-tighter uppercase leading-none">
              Data Sensor <span className="text-primary">{currentLandName}</span>
            </h3>
            <span className="text-[10px] font-black text-neutral-muted bg-gray-50 border px-3 py-1 rounded-full uppercase italic">{detectedCount} Parameter Terdeteksi</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {SENSOR_CONFIGS.map((config, i) => (
              <SensorCard key={`${selectedLand}-${config.key}`} config={config} value={sensorData[config.key] as number} prevValue={prevData ? (prevData[config.key] as number) : undefined} index={i} />
            ))}
            <StatusLegendCard />
          </div>
          <div className="mt-6">
             <SensorGuide />
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function PanelDashboard() {
  const { activeMode, selectedLand, setSelectedLand } = useApp();
  const { lands, loading: landsLoading, refetch } = useLands(activeMode);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const { sensorData } = useSensorData(activeMode, selectedLand);
  
  const prevDataRef = useRef<SensorReading | null>(null);

  useEffect(() => {
    if (lands.length === 0) return;
    
    const exists = lands.some(l => l.id === selectedLand);
    if (!exists) {
      setSelectedLand(lands[0].id);
    }
  }, [lands, selectedLand, setSelectedLand]);

  if (landsLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <RefreshCw className="w-6 h-6 text-gray-400 animate-spin" />
      </div>
    );
  }

  if (lands.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] bg-gray-50 border border-gray-100 rounded-[2rem] p-8 md:p-16 text-center animate-in fade-in duration-300 shadow-xl shadow-black/5">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6 border-2 border-dashed border-gray-300">
          <MapPin className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight mb-2">
          Belum Ada Lahan Tersimpan
        </h3>
        <p className="text-sm text-gray-500 max-w-sm mb-8 font-medium">
          Anda belum memiliki lahan yang tersimpan di sistem Panel Anda. Mau tambah lahan sekarang?
        </p>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-6 py-3 bg-primary text-white font-black rounded-2xl shadow-xl shadow-primary/30 hover:opacity-90 active:scale-95 transition-all uppercase text-xs tracking-wider"
        >
          <Plus className="w-4 h-4" />
          Tambah Lahan Baru
        </button>
        
        <LandAddModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSuccess={(newLand) => {
            refetch();
            setSelectedLand(newLand.id);
          }}
          systemType={activeMode}
        />
      </div>
    );
  }
  
  const prevData = prevDataRef.current;
  prevDataRef.current = sensorData;

  const currentLand = lands.find(l => l.id === selectedLand) || lands[0];
  const detectedCount = SENSOR_CONFIGS.filter(config => (sensorData[config.key as keyof SensorReading] as number) > 0).length;

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="w-10 h-10 bg-accent-melrose/25 rounded-xl flex items-center justify-center shadow-inner">
            <MonitorSpeaker className="w-5 h-5 text-accent-texture" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">Panel Mode</h2>
            <p className="text-sm text-neutral-muted font-medium">Pemantauan otomatis multi-lahan</p>
          </div>
        </div>
        <LandSelector selectedLand={selectedLand} onSelect={setSelectedLand} systemType={activeMode} />
      </div>

      <motion.div
        key={selectedLand}
        initial={{ opacity: 0, scale: 0.99 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }}
        className="space-y-6"
      >
        <AIStatusBanner systemType={activeMode} landId={selectedLand} />

        <div>
          <div className="flex items-center justify-between mb-4 border-b border-black/5 pb-2">
            <h3 className="text-base font-black text-gray-800 tracking-tighter uppercase leading-none">
              Data Sensor <span className="text-primary">{currentLand?.label}</span>
            </h3>
            <span className="text-[10px] font-black text-neutral-muted bg-gray-50 border px-3 py-1 rounded-full uppercase italic">{detectedCount} Parameter Terdeteksi</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {SENSOR_CONFIGS.map((config, i) => (
              <SensorCard key={`${selectedLand}-${config.key}`} config={config} value={sensorData[config.key] as number} prevValue={prevData ? (prevData[config.key] as number) : undefined} index={i} />
            ))}
            <StatusLegendCard />
          </div>
          <div className="mt-6">
             <SensorGuide />
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function DashboardPage() {
  const { activeMode } = useApp();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={activeMode}
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.3 }}
        className="p-1 min-h-full"
      >
        {activeMode === 'portable' ? <PortableDashboard /> : <PanelDashboard />}
      </motion.div>
    </AnimatePresence>
  );
}
