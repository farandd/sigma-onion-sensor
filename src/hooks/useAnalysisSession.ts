import { useState, useCallback } from 'react';
import { SystemType, LandId } from '../types';

type LocationSource = 'gps' | 'exif' | 'manual' | null;

export interface PersistedLocation {
  latitude: number | null;
  longitude: number | null;
  source: LocationSource;
  timestamp?: string;
  photoTimestamp?: string | null; // ISO string
  error: string | null;
}

interface PersistedSession {
  capturedImageBase64: string | null;
  captureMode: 'camera' | 'upload' | null;
  location: PersistedLocation;
  manualLand: string;
}

const SESSION_KEY = (st: SystemType, lid: LandId) => `sigma_session_${st}_${lid}`;

const EMPTY_LOCATION: PersistedLocation = {
  latitude: null, longitude: null, source: null,
  timestamp: undefined, photoTimestamp: null, error: null,
};

const EMPTY_SESSION: PersistedSession = {
  capturedImageBase64: null,
  captureMode: null,
  location: EMPTY_LOCATION,
  manualLand: 'lahan1',
};

function loadSession(st: SystemType, lid: LandId): PersistedSession {
  try {
    const raw = localStorage.getItem(SESSION_KEY(st, lid));
    return raw ? (JSON.parse(raw) as PersistedSession) : EMPTY_SESSION;
  } catch {
    return EMPTY_SESSION;
  }
}

function saveSession(st: SystemType, lid: LandId, session: PersistedSession) {
  try {
    localStorage.setItem(SESSION_KEY(st, lid), JSON.stringify(session));
  } catch {
    // localStorage penuh — coba hapus base64 saja agar state lain tetap tersimpan
    try {
      const slim = { ...session, capturedImageBase64: null };
      localStorage.setItem(SESSION_KEY(st, lid), JSON.stringify(slim));
    } catch { /* skip */ }
  }
}

export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function useAnalysisSession(systemType: SystemType, landId: LandId) {
  const [session, setSessionState] = useState<PersistedSession>(
    () => {
        const loaded = loadSession(systemType, landId);
        // If no land is selected or it's the default, set manualLand to current landId
        if (loaded.manualLand === 'lahan1' && landId !== 'lahan1') {
            return { ...loaded, manualLand: landId };
        }
        return loaded;
    }
  );

  const updateSession = useCallback((patch: Partial<PersistedSession>) => {
    setSessionState(prev => {
      const next = { ...prev, ...patch };
      saveSession(systemType, landId, next);
      return next;
    });
  }, [systemType, landId]);

  const resetSession = useCallback(() => {
    const freshSession = { ...EMPTY_SESSION, manualLand: landId };
    setSessionState(freshSession);
    saveSession(systemType, landId, freshSession);
  }, [systemType, landId]);

  return { session, updateSession, resetSession };
}
