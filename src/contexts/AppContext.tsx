import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { SystemType, LandId, ActivePage, UserPreferences } from '../types';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

interface AppContextType {
  activeMode: SystemType;
  setActiveMode: (mode: SystemType) => void;
  selectedLand: LandId;
  setSelectedLand: (land: LandId) => void;
  activePage: ActivePage;
  setActivePage: (page: ActivePage) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  notifEnabled: boolean;
  setNotifEnabled: (v: boolean) => void;
  autoSync: boolean;
  setAutoSync: (v: boolean) => void;
  prefsLoaded: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [activeMode, setActiveModeState] = useState<SystemType>('portable');
  const [selectedLand, setSelectedLandState] = useState<LandId>('lahan1');
  const [activePage, setActivePage] = useState<ActivePage>('home');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifEnabled, setNotifEnabledState] = useState(true);
  const [autoSync, setAutoSyncState] = useState(true);
  const [prefsLoaded, setPrefsLoaded] = useState(false);

  useEffect(() => {
    if (!user) {
      setPrefsLoaded(false);
      return;
    }
    supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setActiveModeState(data.active_mode as SystemType);
          setSelectedLandState(data.selected_land as LandId);
          setNotifEnabledState(data.notif_enabled);
          setAutoSyncState(data.auto_sync);
        }
        setPrefsLoaded(true);
      });
  }, [user]);

  const savePrefs = useCallback(async (patch: Partial<Omit<UserPreferences, 'user_id' | 'updated_at'>>) => {
    if (!user) return;
    await supabase.from('user_preferences').upsert(
      { user_id: user.id, ...patch, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    );
  }, [user]);

  function setActiveMode(mode: SystemType) {
    setActiveModeState(mode);
    savePrefs({ active_mode: mode });
  }

  function setSelectedLand(land: LandId) {
    setSelectedLandState(land);
    savePrefs({ selected_land: land });
  }

  function setNotifEnabled(v: boolean) {
    setNotifEnabledState(v);
    savePrefs({ notif_enabled: v });
  }

  function setAutoSync(v: boolean) {
    setAutoSyncState(v);
    savePrefs({ auto_sync: v });
  }

  return (
    <AppContext.Provider value={{
      activeMode, setActiveMode,
      selectedLand, setSelectedLand,
      activePage, setActivePage,
      sidebarOpen, setSidebarOpen,
      notifEnabled, setNotifEnabled,
      autoSync, setAutoSync,
      prefsLoaded,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) throw new Error('useApp must be used within AppProvider');
  return context;
}
