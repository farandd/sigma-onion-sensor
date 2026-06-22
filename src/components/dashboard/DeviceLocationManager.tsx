import React, { useState, useEffect } from 'react';
import { MapPin, Save, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useLands } from '../../hooks/useLands';
import { useNotification } from '../../contexts/NotificationContext';

export default function DeviceLocationManager() {
  const { lands } = useLands();
  const { push } = useNotification();
  const [selectedLand, setSelectedLand] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Muat konfigurasi saat ini
    const loadConfig = async () => {
      const { data } = await supabase
        .from('device_config')
        .select('land_id')
        .eq('device_id', 'ESP32-001') // Sudah disamakan dengan device_id di ESP32
        .single();
      if (data) setSelectedLand(data.land_id);
    };
    loadConfig();
  }, []);

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
        device_id: 'ESP32-001', // Sudah disamakan dengan device_id di ESP32
        land_id: selectedLand,
        user_id: user.id
      });

    setLoading(false);
    if (error) push({ type: 'error', title: 'Gagal', message: 'Gagal memperbarui lokasi alat: ' + error.message });
    else push({ type: 'success', title: 'Berhasil', message: 'Lokasi alat telah diperbarui.' });
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-4">
      <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
        <MapPin className="w-4 h-4 text-primary" /> Atur Lokasi Alat
      </h3>
      <select 
        value={selectedLand} 
        onChange={(e) => setSelectedLand(e.target.value)}
        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm"
      >
        <option value="">Pilih Lahan Saat Ini...</option>
        {lands.map(l => <option key={l.id} value={l.id}>{l.label}</option>)}
      </select>
      <button 
        onClick={handleSave} 
        disabled={loading}
        className="w-full bg-primary text-white py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> Simpan Lokasi Alat</>}
      </button>
    </div>
  );
}
