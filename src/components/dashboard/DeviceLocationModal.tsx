import React, { useState, useEffect } from 'react';
import { MapPin, X, Loader2, Save } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useLands } from '../../hooks/useLands';
import { useNotification } from '../../contexts/NotificationContext';

interface DeviceLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DeviceLocationModal({ isOpen, onClose }: DeviceLocationModalProps) {
  const { lands } = useLands();
  const { push } = useNotification();
  const [selectedLand, setSelectedLand] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const loadConfig = async () => {
      const { data } = await supabase
        .from('device_config')
        .select('land_id')
        .eq('device_id', 'ESP32-001')
        .single();
      if (data) setSelectedLand(data.land_id);
    };
    loadConfig();
  }, [isOpen]);

  const handleSave = async () => {
    if (!selectedLand) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      push({ type: 'error', title: 'Gagal', message: 'Sesi tidak ditemukan.' });
      return;
    }

    setLoading(true);
    const { error } = await supabase
      .from('device_config')
      .upsert({ 
        device_id: 'ESP32-001', 
        land_id: selectedLand,
        user_id: user.id
      });

    setLoading(false);
    if (error) push({ type: 'error', title: 'Gagal', message: 'Gagal memperbarui lokasi alat: ' + error.message });
    else {
        push({ type: 'success', title: 'Berhasil', message: 'Lokasi alat telah diperbarui.' });
        onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-[2rem] w-full max-w-sm shadow-2xl relative p-6">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-red-500 rounded-full">
          <X className="w-5 h-5" />
        </button>
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" /> Atur Lokasi Alat
        </h3>
        <select 
            value={selectedLand} 
            onChange={(e) => setSelectedLand(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm mb-4"
        >
            <option value="">Pilih Lahan Saat Ini...</option>
            {lands.map(l => <option key={l.id} value={l.id}>{l.label}</option>)}
        </select>
        <button 
            onClick={handleSave} 
            disabled={loading}
            className="w-full bg-primary text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
        >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> Simpan Lokasi Alat</>}
        </button>
      </div>
    </div>
  );
}
