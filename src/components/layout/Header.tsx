import { useState, useRef, useEffect } from 'react';
import { Menu, ChevronRight, Bell, ChevronDown, LogOut, User, Settings } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import NotificationCenter from '../notifications/NotificationCenter';
import { ActivePage } from '../../types';

const pageLabels: Record<ActivePage, string> = {
  'home': 'Beranda',
  'dashboard': 'Dasbor',
  'ai-analysis': 'Analisis AI',
  'history': 'Riwayat',
  'settings': 'Pengaturan',
};

export default function Header() {
  const { activePage, setSidebarOpen, setActivePage } = useApp();
  const { user, signOut } = useAuth();
  const { unreadCount } = useNotification();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notificationCenterOpen, setNotificationCenterOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <header className="h-16 bg-neutral-surface/95 backdrop-blur border-b border-primary/10 flex items-center px-4 lg:px-6 gap-4 sticky top-0 z-20">
      <button
        onClick={() => setSidebarOpen(true)}
        className="lg:hidden p-2 rounded-xl hover:bg-primary/10 transition-colors text-tertiary"
      >
        <Menu className="w-5 h-5" />
      </button>

      <div className="flex items-center gap-2 text-sm text-tertiary flex-1 min-w-0 font-medium">
        <span className="text-primary font-bold hidden sm:block tracking-tighter uppercase">SIGMA</span>
        <ChevronRight className="w-4 h-4 hidden sm:block opacity-30" />
        <span className="text-primary font-bold tracking-tighter truncate">{pageLabels[activePage]}</span>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative" ref={notificationRef}>
          <button
            onClick={() => setNotificationCenterOpen(!notificationCenterOpen)}
            className="relative p-2 rounded-xl hover:bg-primary/10 transition-colors text-tertiary group"
          >
            <Bell className="w-5 h-5 transition-transform group-hover:rotate-12" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-red-600 rounded-full flex items-center justify-center border-2 border-neutral-surface">
                <span className="text-white text-[9px] font-black leading-none px-0.5">{unreadCount}</span>
              </span>
            )}
          </button>
          <NotificationCenter
            isOpen={notificationCenterOpen}
            onClose={() => setNotificationCenterOpen(false)}
          />
        </div>

        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-primary/10 transition-all"
          >
            <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/10">
              <span className="text-white text-xs font-black">{user?.email?.[0]?.toUpperCase() ?? 'U'}</span>
            </div>
            <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl border border-black/5 py-2 z-50 animate-in slide-in-from-top-2">
              <div className="px-4 py-3 border-b border-black/5">
                <p className="text-sm font-bold text-gray-800 truncate">{user?.email}</p>
                <p className="text-[10px] text-gray-400 font-bold tracking-widest mt-1 opacity-50">Petani Terdaftar</p>
              </div>
              <button
                onClick={() => { setActivePage('settings'); setDropdownOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-gray-600 hover:bg-primary/5 hover:text-primary transition-all tracking-tighter"
              >
                <User className="w-4 h-4 opacity-40" />
                Profil Petani
              </button>
              <button
                onClick={() => { setActivePage('settings'); setDropdownOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-gray-600 hover:bg-primary/5 hover:text-primary transition-all tracking-tighter"
              >
                <Settings className="w-4 h-4 opacity-40" />
                Pengaturan Sistem
              </button>
              <div className="border-t border-black/5 mt-1 pt-1">
                <button
                  onClick={signOut}
                  className="w-full flex items-center gap-3 px-4 py-3 text-xs font-black text-red-600 hover:bg-red-50 transition-all tracking-tighter"
                >
                  <LogOut className="w-4 h-4" />
                  Keluar Akun
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
