import React from 'react';
import { MapPin, ChevronDown, Plus, Check, Trash } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { deleteLand } from '../../services/landsService';
import { LandId, SystemType, Land } from '../../types';
import { useLands } from '../../hooks/useLands';
import LandAddModal from './LandAddModal';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  landLabel: string;
}

function DeleteConfirmationModal({
  isOpen, onClose, onConfirm, landLabel,
}: DeleteConfirmationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]">
      <div className="bg-white rounded-2xl p-6 shadow-xl max-w-sm w-full mx-4 text-center">
        <Trash className="w-10 h-10 text-red-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-gray-800 mb-2">Hapus Lahan Ini?</h3>
        <p className="text-sm text-gray-600 mb-6">
          Anda yakin ingin menghapus <strong>{landLabel}</strong>? Tindakan ini tidak dapat dibatalkan.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
          >
            Batal
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 rounded-xl bg-red-500 text-white font-medium hover:bg-red-600 transition-colors"
          >
            Hapus
          </button>
        </div>
      </div>
    </div>
  );
}

interface LandSelectorProps {
  selectedLand: LandId;
  onSelect: (land: LandId) => void;
  systemType: SystemType;
}

export default function LandSelector({ selectedLand, onSelect, systemType }: LandSelectorProps) {
  const { user } = useAuth();
  const [open, setOpen] = React.useState(false);
  const [showAddModal, setShowAddModal] = React.useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = React.useState(false);
  const [landToDelete, setLandToDelete] = React.useState<Land | null>(null);
  const { lands, refetch } = useLands();
  
  const ref = React.useRef<HTMLDivElement>(null);
  const isPortable = systemType === 'portable';

  // --- FILTER & PILIH DATA ---
  const currentViewLands = lands.filter(l => l.system_type === systemType);
  const selected = currentViewLands.find(l => l.id === selectedLand) || currentViewLands[0];

  React.useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleDeleteLand = async () => {
    if (!user || !landToDelete) return;
    try {
      await deleteLand(user.id, landToDelete.id, landToDelete.system_type);
      refetch();
      setShowDeleteConfirmModal(false);
      // If the deleted land was the selected one, select the first available land
      if (selectedLand === landToDelete.id) {
        const remainingLands = currentViewLands.filter(l => l.id !== landToDelete.id);
        if (remainingLands.length > 0) {
          onSelect(remainingLands[0].id);
        } else {
          onSelect(''); // No lands left, clear selection
        }
      }
    } catch (error) {
      console.error("Error deleting land:", error);
      // TODO: Show an error message to the user
    }
  };

  const handleLandSelect = async (landId: LandId) => {
    // 1. Update state di UI
    onSelect(landId);
    setOpen(false);

    // 2. Jika mode portable, otomatis update lokasi alat di database
    if (isPortable && user) {
      await supabase
        .from('device_config')
        .upsert({ 
          device_id: 'ESP32-001', 
          land_id: landId,
          user_id: user.id 
        });
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2.5 bg-white border border-gray-200 hover:border-primary rounded-xl px-4 py-2.5 transition-all duration-200 shadow-sm"
      >
        <div className="w-7 h-7 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
          <MapPin className="w-4 h-4 text-primary" />
        </div>
        <div className="text-left shrink-0">
          <p className="text-xs text-gray-400 leading-none">{isPortable ? 'Pilih Lokasi' : 'Pilih Lahan'}</p>
          <p className="text-sm font-semibold text-gray-800 mt-0.5 truncate max-w-[130px]">
            {selected ? selected.label : (isPortable ? 'Tidak ada lokasi' : 'Tidak ada lahan')}
          </p>
        </div>
        <ChevronDown className={`w-3 h-3 text-gray-400 ml-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-3 w-80 bg-white rounded-[2rem] shadow-2xl shadow-black/10 border border-black/5 z-50 animate-in slide-in-from-top-2 origin-top-right overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{isPortable ? 'Daftar Lokasi' : 'Daftar Lahan'}</p>
            <button onClick={() => { setShowAddModal(true); setOpen(false); }} className="p-1 hover:bg-primary/10 rounded-lg text-primary transition-colors">
              <Plus className="w-5 h-5" />
            </button>
          </div>
          <div className="max-h-[calc(3*5rem)] overflow-y-auto custom-scrollbar">
            {currentViewLands.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4">Belum ada {isPortable ? 'lokasi' : 'lahan'} tersimpan</p>
            ) : (
              currentViewLands.map((land, index) => {
                const isLast = index === currentViewLands.length - 1;
                return (
                  <div 
                    key={land.id} 
                    className={`flex items-center group ${selectedLand === land.id ? 'bg-primary/10' : 'hover:bg-gray-50'} ${isLast ? 'rounded-b-[2rem]' : ''}`}
                  >
                    <button
                      onClick={() => handleLandSelect(land.id)}
                      className="flex-1 flex items-center gap-3 px-4 py-3"
                    >
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${selectedLand === land.id ? 'bg-primary text-white' : 'bg-gray-100 text-gray-400'}`}>
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div className="flex-1 text-left">
                        <p className={`text-sm font-bold ${selectedLand === land.id ? 'text-primary' : 'text-gray-700'}`}>{land.label}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{isPortable ? 'Portable' : `${land.crop} ${land.area ? `• ${land.area}` : ''}`}</p>
                      </div>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setLandToDelete(land);
                        setShowDeleteConfirmModal(true);
                      }}
                      className="w-8 h-8 mr-3 flex items-center justify-center rounded-full text-gray-400 hover:text-white hover:bg-red-500 transition-colors"
                      title="Hapus Lahan"
                    >
                      <Trash className="w-4 h-4" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      <LandAddModal 
        isOpen={showAddModal} 
        onClose={() => setShowAddModal(false)} 
        onSuccess={(newLand) => {
          refetch();
          onSelect(newLand.id);
        }} 
        systemType={systemType} 
      />

      <DeleteConfirmationModal
        isOpen={showDeleteConfirmModal}
        onClose={() => setShowDeleteConfirmModal(false)}
        onConfirm={handleDeleteLand}
        landLabel={landToDelete?.label || ''}
      />
    </div>
  );
}

