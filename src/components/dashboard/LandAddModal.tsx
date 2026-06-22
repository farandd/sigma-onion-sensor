import React from 'react';
import { X, Info, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Land, SystemType } from '../../types';

interface LandAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newLand: Land) => void;
  systemType: SystemType;
}

export default function LandAddModal({ isOpen, onClose, onSuccess, systemType }: LandAddModalProps) {
  const [newLocName, setNewLocName] = React.useState('');
  const [onionType, setOnionType] = React.useState('Bawang Merah');
  const [coords, setCoords] = React.useState({ lat: '', lng: '' });
  const [isSaving, setIsSaving] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState('');

  const isPortable = systemType === 'portable';

  if (!isOpen) return null;

  const handleAddLocation = async () => {
    if (!newLocName) {
      setErrorMsg("Nama tidak boleh kosong!");
      return;
    }

    setErrorMsg('');
    setIsSaving(true);

    try {
      const { data: authData } = await supabase.auth.getUser();
      const userId = authData.user?.id;

      if (!userId) {
        throw new Error("Sesi pengguna tidak ditemukan. Silakan login kembali.");
      }

      const newEntry = {
        label: newLocName,
        crop: isPortable ? 'Bawang Merah' : onionType, // Portable defaults to Bawang Merah as crop is not selectable
        system_type: systemType,
        latitude: coords.lat ? parseFloat(coords.lat) : null,
        longitude: coords.lng ? parseFloat(coords.lng) : null,
        user_id: userId
      };

      const { data, error } = await supabase
        .from('lands')
        .insert([newEntry])
        .select()
        .single();

      if (error) throw error;

      onSuccess(data);
      setNewLocName('');
      setCoords({ lat: '', lng: '' });
      onClose();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Gagal menyimpan data ke database.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-[2rem] w-full max-w-md shadow-2xl flex flex-col max-h-[90vh] relative animate-in fade-in zoom-in duration-300">
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 bg-gray-50 text-gray-400 hover:text-red-500 rounded-full transition-all z-10 shadow-sm"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="p-8 pb-4">
          <h3 className="text-xl font-bold text-gray-800 uppercase">Tambah {isPortable ? 'Lokasi' : 'Lahan'}</h3>
          <p className="text-sm text-gray-400 font-medium">Input Data Koordinat G-Maps</p>
        </div>

        <div className="px-8 py-4 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
          <div>
            <label className="block text-[11px] font-bold text-gray-400 mb-2 uppercase tracking-widest leading-none">NAMA {isPortable ? 'LOKASI' : 'LAHAN'}</label>
            <input 
              type="text" 
              value={newLocName} 
              onChange={(e) => {setNewLocName(e.target.value); setErrorMsg('');}}
              placeholder="Misal: Lahan Kos Tika"
              className={`w-full px-5 py-4 bg-secondary/10 border border-gray-100 rounded-2xl focus:border-secondary outline-none transition-all font-bold ${errorMsg ? 'border-red-400' : ''}`}
            />
            {errorMsg && (
              <p className="mt-2 text-[10px] font-black text-red-500 uppercase tracking-widest italic flex items-center gap-1 animate-bounce">
                ⚠️ {errorMsg}
              </p>
            )}
          </div>

          {!isPortable && (
            <div>
              <label className="block text-[11px] font-bold text-gray-400 mb-3 uppercase tracking-widest">VARIETAS BAWANG</label>
              <div className="grid grid-cols-2 gap-3">
                {['Bawang Merah', 'Bawang Putih'].map((type) => (
                  <button 
                    type="button"
                    key={type} 
                    onClick={() => setOnionType(type)}
                    className={`py-3.5 rounded-2xl border-2 font-bold transition-all text-xs ${onionType === type ? 'border-primary bg-primary/10 text-primary shadow-md shadow-primary/10' : 'border-gray-100 text-gray-400'}`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-4">
            <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest leading-none">TEMPEL KORDINAT (ONE-STEP)</label>
            <input 
              type="text" 
              placeholder="PASTE HASIL COPY DISINI..."
              className="w-full px-5 py-4 bg-secondary/10 border-2 border-secondary/20 rounded-2xl focus:border-secondary outline-none transition-all font-black text-secondary placeholder:opacity-50 text-sm"
              onChange={(e) => {
                const val = e.target.value;
                if (val.includes(',')) {
                  const [lat, lng] = val.split(',').map(s => s.trim());
                  setCoords({ lat, lng });
                }
              }}
            />

            <div className="grid grid-cols-2 gap-3 p-4 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-100 font-mono text-[10px] text-center uppercase tracking-widest font-black">
               <div className="border-r border-gray-100 pr-2">
                 <p className="text-gray-300 mb-1">Lat</p>
                 <p className="text-secondary truncate">{coords.lat || '-'}</p>
               </div>
               <div className="pl-2 text-left">
                 <p className="text-gray-300 mb-1">Long</p>
                 <p className="text-secondary truncate">{coords.lng || '-'}</p>
               </div>
            </div>

            <div className="bg-tertiary/10 rounded-[1.5rem] p-5 border border-tertiary/20 mt-2">
               <div className="flex items-center gap-3 mb-4 text-tertiary font-bold text-xs uppercase tracking-tight">
                  <div className="w-8 h-8 bg-tertiary/20 rounded-lg flex items-center justify-center shrink-0 shadow-sm">
                    <Info className="w-5 h-5 text-tertiary" />
                  </div>
                  <span>CARA COPY KOORDINAT:</span>
               </div>
               <ul className="text-[10px] text-tertiary/80 leading-relaxed font-bold opacity-80 list-none space-y-1">
                 <li>• Cari titik di Google Maps.</li>
                 <li>• Klik Kanan (PC) / Tahan (HP).</li>
                 <li>• Klik angka kordinat untuk Copy.</li>
               </ul>
               <a 
                 href="https://www.google.com/maps" 
                 target="_blank" 
                 rel="noreferrer"
                 className="mt-4 flex items-center justify-center gap-2 w-full py-3.5 bg-white border-2 border-tertiary/30 text-tertiary rounded-xl text-[11px] font-black hover:bg-tertiary hover:text-white transition-all shadow-md active:scale-95 uppercase"
               >
                 BUKA MAPS SEKARANG →
               </a>
            </div>
          </div>
        </div>

        <div className="p-8 flex gap-4 mt-2 bg-white rounded-b-[2rem]">
          <button 
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-4 text-gray-400 font-bold hover:bg-gray-50 rounded-2xl"
          >
            BATAL
          </button>
          <button 
            type="button"
            onClick={handleAddLocation}
            disabled={isSaving}
            className="flex-[2] py-4.5 bg-primary text-white font-black rounded-2xl shadow-xl shadow-primary/30 hover:opacity-90 transition-all flex items-center justify-center gap-2 uppercase text-[13px] disabled:opacity-50 active:scale-95"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "SIMPAN"}
          </button>
        </div>
      </div>
    </div>
  );
}
