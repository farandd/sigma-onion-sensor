import React from 'react';
import { LayoutDashboard, BrainCircuit, History, Settings } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { ActivePage } from '../../types';

const navItems: { page: ActivePage; label: string; icon: React.ReactNode }[] = [
  { page: 'dashboard', label: 'Beranda', icon: <LayoutDashboard className="w-5 h-5" /> },
  { page: 'ai-analysis', label: 'Kamera AI', icon: <BrainCircuit className="w-5 h-5" /> },
  { page: 'history', label: 'Riwayat', icon: <History className="w-5 h-5" /> },
  { page: 'settings', label: 'Pengaturan', icon: <Settings className="w-5 h-5" /> },
];

export default function MobileBottomNav() {
  const { activePage, setActivePage } = useApp();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-neutral-surface/95 backdrop-blur border-t border-primary/10 z-20 safe-area-pb">
      <div className="flex items-center">
        {navItems.map(item => (
          <button
            key={item.page}
            onClick={() => setActivePage(item.page)}
            className={`flex-1 flex flex-col items-center gap-1 py-3 transition-all duration-200 ${
              activePage === item.page ? 'text-primary' : 'text-tertiary hover:text-secondary'
            }`}
          >
            {item.icon}
            <span className="text-xs font-medium">{item.label}</span>
            {activePage === item.page && (
              <div className="absolute bottom-0 h-0.5 w-8 bg-primary rounded-full" />
            )}
          </button>
        ))}
      </div>
    </nav>
  );
}
