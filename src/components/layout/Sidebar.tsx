import React, { useState } from 'react';
import logo from '../../assets/logo-sigma.png';
import { motion, AnimatePresence } from 'framer-motion';
import { Smartphone, MonitorSpeaker, BrainCircuit, History, X, Home, Settings, LogOut, Bell, Menu } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { SystemType } from '../../types';
import NotificationCenter from '../notifications/NotificationCenter';

const modeItems: { mode: SystemType; label: string; subtitle: string; icon: React.ReactNode; color: string }[] = [
  { mode: 'portable', label: 'Portable Mode', subtitle: 'Mobile Monitoring', icon: <Smartphone className="w-5 h-5" />, color: 'from-accent-rosemary to-accent-straken' },
  { mode: 'panel', label: 'Panel Mode', subtitle: 'Land Monitoring', icon: <MonitorSpeaker className="w-5 h-5" />, color: 'from-secondary to-primary' },
];

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const { activePage, activeMode, setActiveMode, setActivePage } = useApp();
  const { user, profile, signOut } = useAuth();
  const { unreadCount } = useNotification();
  const [notificationCenterOpen, setNotificationCenterOpen] = useState(false);

  function navigate(page: 'home' | 'dashboard' | 'history' | 'ai-analysis' | 'settings') {
    setActivePage(page);
    onClose?.();
  }

  function navigateMode(mode: SystemType) {
    setActiveMode(mode);
    setActivePage('dashboard');
    onClose?.();
  }

  const navItems = [
    { id: 'home' as const, label: 'Beranda', icon: Home, color: 'from-accent-straken to-secondary' },
    { id: 'ai-analysis' as const, label: 'Analisis AI', icon: BrainCircuit, color: 'from-accent-viola to-accent-texture' },
    { id: 'history' as const, label: 'Riwayat', icon: History, color: 'from-accent-rosemary to-accent-straken' },
  ];

  return (
    <div className="relative flex flex-col h-full bg-gradient-to-b from-primary via-[#12362D] to-[#061D18]">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-0 w-40 h-40 bg-neutral-surface rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-40 h-40 bg-secondary-light rounded-full blur-3xl" />
      </div>

      {/* Logo Section */}
      <div className="relative px-5 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <motion.button
            onClick={() => navigate('home')}
            whileHover={{ scale: 1.02 }}
            className="flex items-center gap-3 text-left group"
          >
            <img src={logo} alt="SIGMA Logo" className="w-11 h-11 object-contain" />
            <div>
              <h1 className="text-white font-black text-3xl tracking-tighter leading-none">SIGMA</h1>
              <p className="text-white/40 text-[10px] mt-0.5 leading-tight font-medium">Smart IoT for Growth Monitoring in Agriculture</p>
            </div>
          </motion.button>

          <div className="relative">
            <button
              onClick={() => setNotificationCenterOpen(!notificationCenterOpen)}
              className="relative w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 text-white/75 hover:text-white transition-all flex items-center justify-center"
              aria-label="Buka notifikasi"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-accent-melrose text-primary rounded-full border-2 border-primary flex items-center justify-center text-[9px] font-black px-1">
                  {unreadCount}
                </span>
              )}
            </button>
            <NotificationCenter
              isOpen={notificationCenterOpen}
              onClose={() => setNotificationCenterOpen(false)}
            />
          </div>

          {onClose && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              onClick={onClose}
              className="lg:hidden w-10 h-10 rounded-xl bg-white/10 text-white/60 hover:text-white hover:bg-white/20 transition-colors flex items-center justify-center"
              aria-label="Tutup sidebar"
            >
              <X className="w-5 h-5" />
            </motion.button>
          )}
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto">
        {/* Mode Selector */}
        <div className="space-y-2 mb-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 px-3 mb-3">Mode Monitoring</p>
          {modeItems.map((item) => (
            <motion.button
              key={item.mode}
              onClick={() => navigateMode(item.mode)}
              whileHover={{ x: 4 }}
              className={`w-full group relative overflow-hidden rounded-xl transition-all duration-300 ${
                activeMode === item.mode ? 'ring-2 ring-white/30' : ''
              }`}
            >
              {/* Gradient Background */}
              <div className={`absolute inset-0 bg-gradient-to-r ${item.color} ${activeMode === item.mode ? 'opacity-20' : 'opacity-0 group-hover:opacity-10'} transition-opacity duration-300`} />

              <div className="relative px-4 py-3 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${item.color} flex items-center justify-center text-white shadow-lg transition-transform group-hover:scale-110`}>
                  {item.icon}
                </div>
                <div className="flex-1 text-left">
                  <p className={`text-sm font-bold ${activeMode === item.mode ? 'text-white' : 'text-white/70'}`}>{item.label}</p>
                  <p className={`text-[10px] ${activeMode === item.mode ? 'text-white/60' : 'text-white/40'}`}>{item.subtitle}</p>
                </div>
                {activeMode === item.mode && (
                  <motion.div className="w-2 h-2 rounded-full bg-white" layoutId="activeIndicator" />
                )}
              </div>
            </motion.button>
          ))}
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-white/0 via-white/20 to-white/0 my-4" />

        {/* Main Pages */}
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 px-3 mb-3">Menu Utama</p>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;

          return (
            <motion.button
              key={item.id}
              onClick={() => navigate(item.id)}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
              className="w-full group relative overflow-hidden rounded-xl transition-all duration-300"
            >
              {/* Active Background */}
              {isActive && (
                <motion.div layoutId="sidebarActive" className={`absolute inset-0 bg-gradient-to-r ${item.color} opacity-15`} />
              )}

              {/* Hover Background */}
              <div className={`absolute inset-0 bg-gradient-to-r ${item.color} ${isActive ? 'opacity-15' : 'opacity-0 group-hover:opacity-5'} transition-opacity duration-300`} />

              <div className="relative px-4 py-3 flex items-center gap-3">
                <motion.div
                  className={`w-10 h-10 rounded-lg bg-gradient-to-br ${item.color} flex items-center justify-center transition-all ${isActive ? 'text-white shadow-lg shadow-current/50' : 'text-white/60 group-hover:text-white'}`}
                  whileHover={{ scale: 1.1, rotate: 6 }}
                >
                  <Icon className="w-5 h-5" />
                </motion.div>
                <div className="flex-1 text-left">
                  <p className={`text-sm font-bold transition-colors ${isActive ? 'text-white' : 'text-white/70 group-hover:text-white'}`}>
                    {item.label}
                  </p>
                </div>
                {isActive && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-2 h-2 rounded-full bg-white"
                  />
                )}
              </div>
            </motion.button>
          );
        })}
      </nav>

      {/* Divider */}
      <div className="h-px bg-gradient-to-r from-white/0 via-white/20 to-white/0" />

      {/* User Profile Section */}
      <div className="relative px-3 py-4 space-y-3">
        {/* Profile Card */}
        <div className="rounded-xl bg-gradient-to-br from-white/5 to-white/0 border border-white/10 p-3 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-melrose to-accent-viola flex items-center justify-center text-white text-xs font-bold shadow-lg">
              {profile?.full_name?.[0]?.toUpperCase() || 'P'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white truncate">{profile?.full_name || 'Petani'}</p>
              <p className="text-[10px] text-white/50 truncate">{user?.email || 'User'}</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <motion.button
            onClick={() => navigate('settings')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1"
          >
            <Settings className="w-3.5 h-3.5" />
            Setelan
          </motion.button>
          <motion.button
            onClick={signOut}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-3 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1"
          >
            <LogOut className="w-3.5 h-3.5" />
            Keluar
          </motion.button>
        </div>
      </div>
    </div>
  );
}

export default function Sidebar() {
  const { sidebarOpen, setSidebarOpen } = useApp();

  return (
    <>
      <button
        onClick={() => setSidebarOpen(true)}
        className="lg:hidden fixed left-4 top-4 z-30 w-11 h-11 rounded-2xl bg-primary text-neutral-surface shadow-xl shadow-primary/20 border border-white/20 flex items-center justify-center"
        aria-label="Buka sidebar"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 fixed left-0 top-0 h-full z-30 shadow-2xl">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
            />
            <motion.aside
              initial={{ x: -280, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -280, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200, duration: 0.3 }}
              className="fixed left-0 top-0 h-full w-72 shadow-2xl z-50 lg:hidden"
            >
              <SidebarContent onClose={() => setSidebarOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
