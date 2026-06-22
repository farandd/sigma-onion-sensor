import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { Land, SystemType } from '../types';

interface LandsContextType {
  lands: Land[];
  loading: boolean;
  refetch: () => Promise<void>;
}

const LandsContext = createContext<LandsContextType | undefined>(undefined);

export function LandsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [lands, setLands] = useState<Land[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchLands = useCallback(async () => {
    if (!user) {
        setLands([]);
        return;
    };
    setLoading(true);

    const { data } = await supabase.from('lands').select('*').eq('user_id', user.id).order('id');

    setLands(data ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchLands(); }, [fetchLands]);

  return (
    <LandsContext.Provider value={{ lands, loading, refetch: fetchLands }}>
      {children}
    </LandsContext.Provider>
  );
}

export function useLands(systemType?: SystemType) {
  const context = useContext(LandsContext);
  if (context === undefined) throw new Error('useLands must be used within LandsProvider');
  
  // Filter by systemType if provided
  const lands = systemType ? context.lands.filter(l => l.system_type === systemType) : context.lands;
  
  return { ...context, lands };
}
