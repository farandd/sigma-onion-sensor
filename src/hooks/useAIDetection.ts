import { useState, useCallback, useRef } from 'react';
import { AIDetection, EnrichedDetection, SensorReading, SystemType, LandId, Land } from '../types';
import { DISEASES, DUMMY_IMAGE_URL } from '../constants/sensors';
import { runAIPipeline } from '../lib/aiPipeline';
import { supabase } from '../lib/supabase';

const LS_KEY = (st: SystemType, lid: LandId) => `sigma_analysis_${st}_${lid}`;

function generateRawDetection(systemType: SystemType, landId: LandId): AIDetection {
  const disease = DISEASES[Math.floor(Math.random() * DISEASES.length)];
  return {
    system_type: systemType,
    land_id: landId,
    image_url: DUMMY_IMAGE_URL,
    label: disease.label,
    confidence: parseFloat((disease.confidence + (Math.random() * 4 - 2)).toFixed(1)),
    bbox_x: parseFloat((0.15 + Math.random() * 0.3).toFixed(3)),
    bbox_y: parseFloat((0.1 + Math.random() * 0.3).toFixed(3)),
    bbox_width: parseFloat((0.28 + Math.random() * 0.22).toFixed(3)),
    bbox_height: parseFloat((0.22 + Math.random() * 0.22).toFixed(3)),
  };
}

async function fetchLatestSensor(
  userId: string,
  systemType: SystemType,
  landId: LandId,
): Promise<SensorReading | null> {
  const tableName = systemType === 'portable' ? 'sensor_readings_portable' : 'sensor_readings_panel';
  const { data } = await supabase
    .from(tableName)
    .select('*')
    .eq('user_id', userId)
    .eq('system_type', systemType)
    .eq('land_id', landId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  return data ?? null;
}

function loadFromStorage(st: SystemType, lid: LandId): EnrichedDetection | null {
  try {
    const raw = localStorage.getItem(LS_KEY(st, lid));
    return raw ? (JSON.parse(raw) as EnrichedDetection) : null;
  } catch {
    return null;
  }
}

function saveToStorage(st: SystemType, lid: LandId, detection: EnrichedDetection) {
  try {
    localStorage.setItem(LS_KEY(st, lid), JSON.stringify(detection));
  } catch { /* storage full */ }
}

export interface RunDetectionOptions {
  imageElement?: HTMLImageElement | null;
  photoTimestamp?: Date | null;
  photoCoords?: { latitude: number; longitude: number } | null;
  land?: Land | null;
}

export function useAIDetection(systemType: SystemType, landId: LandId, userId: string | null) {
  const [detection, setDetection] = useState<EnrichedDetection | null>(
    () => loadFromStorage(systemType, landId),
  );
  const [analyzing, setAnalyzing] = useState(false);
  const [lastAnalyzed, setLastAnalyzed] = useState<Date | null>(null);

  // Keep a mutable ref so the callback always sees the latest params
  const paramsRef = useRef({ userId, systemType, landId });
  paramsRef.current = { userId, systemType, landId };

  const runDetection = useCallback(async (opts: RunDetectionOptions = {}) => {
    const { userId: uid, systemType: st, landId: lid } = paramsRef.current;
    setAnalyzing(true);

    let rawLabel = 'Sehat';
    try {
      if (opts.imageElement) {
        const canvas = document.createElement('canvas');
        canvas.width = opts.imageElement.width;
        canvas.height = opts.imageElement.height;
        canvas.getContext('2d')!.drawImage(opts.imageElement, 0, 0);
        const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg'));
        
        if (blob) {
          const formData = new FormData();
          formData.append('file', blob, 'onion.jpg');
          const res = await fetch('http://127.0.0.1:5000/predict', { method: 'POST', body: formData });
          const json = await res.json();
          const apiLabel = json.result; // 'Healthy', 'Moler', 'Purple blotch'

          // Map API label to internal labels
          if (apiLabel === 'Healthy') rawLabel = 'Sehat';
          else if (apiLabel === 'Purple blotch') rawLabel = 'Purple Blotch';
          else rawLabel = apiLabel; // 'Moler' or others
        }
      }
    } catch (e) {
      console.error("AI API Error:", e);
      // Fallback if API fails
      rawLabel = 'Sehat';
    }

    const raw: AIDetection = {
      system_type: st,
      land_id: lid,
      image_url: DUMMY_IMAGE_URL,
      label: rawLabel,
      confidence: 90.0,
      bbox_x: 0.2, bbox_y: 0.2, bbox_width: 0.2, bbox_height: 0.2,
    };

    const sensor = uid ? await fetchLatestSensor(uid, st, lid) : null;

    const pipeline = await runAIPipeline({
      detection: raw,
      sensor,
      imageElement: opts.imageElement ?? null,
      photoTimestamp: opts.photoTimestamp ?? null,
      photoCoords: opts.photoCoords ?? null,
      land: opts.land ?? null,
    });

    const enriched: EnrichedDetection = {
      ...raw,
      // Apply label override from Lapis 2 if present
      label: pipeline.overriddenLabel ?? raw.label,
      pipeline,
    };

    setDetection(enriched);
    setLastAnalyzed(new Date());
    setAnalyzing(false);
    saveToStorage(st, lid, enriched);

    return enriched;
  }, []);

  const clearDetection = useCallback(() => {
    setDetection(null);
    setAnalyzing(false);
    setLastAnalyzed(null);
  }, []);

  return { detection, analyzing, lastAnalyzed, runDetection, clearDetection };
}
