import React, { useState } from 'react';
import { Settings, User, Bell, Shield, Save, Check, Lock, HelpCircle, MessageCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useApp } from '../contexts/AppContext';
import { useNotification } from '../contexts/NotificationContext';
import SupportModal from '../components/dashboard/SupportModal';

export default function SettingsPage() {
  const { profile, user, updateProfile, resetPassword } = useAuth();
  const { activeMode, notifEnabled, setNotifEnabled, autoSync, setAutoSync, setActivePage } = useApp();
  const { push } = useNotification();
  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);

  async function handlePasswordReset() {
    if (!user?.email) return;
    const { error } = await resetPassword(user.email);
    if (error) {
      push({ type: 'error', title: 'Gagal Mengirim Email', message: error });
    } else {
      push({ type: 'success', title: 'Email Terkirim', message: 'Silakan periksa email Anda untuk tautan ubah kata sandi.' });
    }
  }

  async function handleSave() {
    setSaving(true);
    await updateProfile({ full_name: fullName, system_type: activeMode });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  function SettingRow({ icon, label, desc, children }: { icon: React.ReactNode; label: string; desc?: string; children?: React.ReactNode }) {
    return (
      <div className="flex items-center justify-between py-4 border-b border-gray-50 last:border-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center shrink-0">
            {icon}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-800">{label}</p>
            {desc && <p className="text-xs text-gray-400 mt-0.5">{desc}</p>}
          </div>
        </div>
        <div className="shrink-0">{children}</div>
      </div>
    );
  }

  function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
    return (
      <button
        onClick={() => onChange(!on)}
        className={`w-10 h-6 rounded-full transition-colors duration-200 relative ${on ? 'bg-primary shadow-primary/20' : 'bg-gray-200'}`}
      >
        <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${on ? 'translate-x-4' : 'translate-x-0.5'}`} />
      </button>
    );
  }

  return (
    <div className="space-y-5 max-w-7xl">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shadow-lg shadow-primary/5">
          <Settings className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-900 uppercase tracking-tighter">Pengaturan</h2>
          <p className="text-sm text-neutral-muted font-medium">Kelola akun dan preferensi sistem</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
          <User className="w-4 h-4 text-primary" />
          Profil Pengguna
        </h3>
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Nama Lengkap</label>
              <input
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-secondary transition-colors"
                placeholder="Nama lengkap Anda"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Email</label>
              <input
                type="email"
                value={user?.email ?? ''}
                disabled
                className="w-full border border-gray-100 bg-gray-50 rounded-xl px-4 py-2.5 text-sm text-gray-400 cursor-not-allowed"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-6 py-3 rounded-xl transition-all duration-700 shadow-sm shadow-primary/20"
        >
          {saving ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : saved ? (
            <Check className="w-4 h-4" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {saving ? 'Menyimpan...' : saved ? 'Tersimpan!' : 'Simpan Perubahan'}
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
          <Bell className="w-4 h-4 text-primary" />
          Notifikasi & Sinkronisasi
        </h3>
        <div className="divide-y divide-gray-100">
          <SettingRow icon={<Bell className="w-4 h-4 text-primary" />} label="Notifikasi Peringatan" desc="Dapatkan notifikasi saat sensor di luar rentang">
            <Toggle on={notifEnabled} onChange={setNotifEnabled} />
          </SettingRow>
          <SettingRow icon={<Shield className="w-4 h-4 text-primary" />} label="Sinkronisasi Otomatis" desc="Perbarui data setiap 10 menit secara otomatis">
            <Toggle on={autoSync} onChange={setAutoSync} />
          </SettingRow>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
          <Lock className="w-4 h-4 text-primary" />
          Keamanan Akun
        </h3>
        <button onClick={handlePasswordReset} className="flex items-center gap-3 w-full p-3 hover:bg-gray-50 rounded-xl transition-colors">
          <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
            <Lock className="w-4 h-4 text-primary" />
          </div>
          <div className="text-left">
            <p className="text-sm font-medium text-gray-800">Ubah Kata Sandi</p>
            <p className="text-xs text-gray-400">Perbarui kata sandi akun Anda</p>
          </div>
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-primary" />
          Pusat Bantuan & Layanan
        </h3>
        <div className="divide-y divide-gray-100">
          <button onClick={() => setActivePage('guidebook')} className="flex items-center gap-3 w-full py-3 hover:bg-gray-50 rounded-xl transition-colors">
            <div className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center shrink-0">
              <HelpCircle className="w-4 h-4 text-gray-600" />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-gray-800">Buku Panduan</p>
            </div>
          </button>
          <button onClick={() => setShowSupportModal(true)} className="flex items-center gap-3 w-full py-3 hover:bg-gray-50 rounded-xl transition-colors">
            <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
              <MessageCircle className="w-4 h-4 text-primary" />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-gray-800">Support Kami</p>
            </div>
          </button>
        </div>
      </div>

      <SupportModal isOpen={showSupportModal} onClose={() => setShowSupportModal(false)} />
    </div>
  );
}
