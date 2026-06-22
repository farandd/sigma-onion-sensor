import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { LandId, SensorReading, SystemType } from '../types';

export const SENSOR_SYNC_INTERVAL_MS = 6 * 60 * 60 * 1000;
export const SIGNIFICANT_SENSOR_CHANGE = 0.1;

export function generateSensorData(
  systemType: SystemType,
  landId: LandId,
): Omit<SensorReading, 'id' | 'user_id' | 'created_at'> {
  const variance = systemType === 'portable' ? 1.0 : 0.5;
  const offset = landId === 'lahan2' ? 5 : landId === 'lahan3' ? 10 : 0;

  return {
    system_type: systemType,
    land_id: landId,
    moisture: parseFloat((40 + offset * 0.5 + Math.random() * 30 * variance).toFixed(1)),
    nitrogen: parseFloat((20 + offset * 0.8 + Math.random() * 30 * variance).toFixed(1)),
    phosphorus: parseFloat((10 + offset * 0.3 + Math.random() * 18 * variance).toFixed(1)),
    potassium: parseFloat((80 + offset * 2 + Math.random() * 100 * variance).toFixed(1)),
    temperature: parseFloat((24 + offset * 0.2 + Math.random() * 8 * variance).toFixed(1)),
    ph: parseFloat((5.8 + offset * 0.05 + Math.random() * 1.2 * variance).toFixed(2)),
    conductivity: parseFloat((0.6 + offset * 0.05 + Math.random() * 1.8 * variance).toFixed(3)),
  };
}

export function getCriticalSensorMessages(data: SensorReading): string[] {
  const msgs: string[] = [];
  if (data.ph < 5.0) msgs.push(`pH sangat rendah: ${data.ph}`);
  if (data.ph > 8.5) msgs.push(`pH sangat tinggi: ${data.ph}`);
  if (data.moisture < 20) msgs.push(`Kelembaban kritis rendah: ${data.moisture}%`);
  if (data.temperature > 38) msgs.push(`Suhu terlalu tinggi: ${data.temperature}°C`);
  if (data.nitrogen < 5) msgs.push(`Nitrogen sangat rendah: ${data.nitrogen} mg/kg`);
  return msgs;
}

export function isSignificantSensorChange(prev: SensorReading, next: SensorReading): boolean {
  const keys: Array<keyof SensorReading> = ['moisture', 'nitrogen', 'phosphorus', 'potassium', 'temperature', 'ph', 'conductivity'];
  return keys.some(key => {
    const prevValue = prev[key] as number;
    const nextValue = next[key] as number;
    if (!prevValue) return !!nextValue;
    return Math.abs(nextValue - prevValue) / Math.abs(prevValue) >= SIGNIFICANT_SENSOR_CHANGE;
  });
}

export async function fetchLatestSensorReading(
  userId: string,
  systemType: SystemType,
  landId: LandId,
): Promise<SensorReading | null> {
  const { data, error } = await supabase
    .from('sensor_readings')
    .select('*')
    .eq('user_id', userId)
    .eq('system_type', systemType)
    .eq('land_id', landId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
}

export async function fetchTodaySensorReading(
  userId: string,
  systemType: SystemType,
  landId: LandId,
): Promise<SensorReading | null> {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from('sensor_readings')
    .select('*')
    .eq('user_id', userId)
    .eq('system_type', systemType)
    .eq('land_id', landId)
    .gte('created_at', todayStart.toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
}

export async function insertSensorReading(
  userId: string,
  reading: Omit<SensorReading, 'id' | 'user_id' | 'created_at'>,
): Promise<void> {
  const { error } = await supabase.from('sensor_readings').insert({ ...reading, user_id: userId });
  if (error) throw error;
}

export async function fetchSyncState(userId: string, systemType: SystemType, landId: LandId): Promise<Date | null> {
  const { data, error } = await supabase
    .from('sync_state')
    .select('last_synced_at')
    .eq('user_id', userId)
    .eq('system_type', systemType)
    .eq('land_id', landId)
    .maybeSingle();

  if (error) throw error;
  return data ? new Date(data.last_synced_at) : null;
}

export async function saveSyncState(userId: string, systemType: SystemType, landId: LandId): Promise<void> {
  const now = new Date().toISOString();
  const { error } = await supabase
    .from('sync_state')
    .upsert(
      { user_id: userId, system_type: systemType, land_id: landId, last_synced_at: now, updated_at: now },
      { onConflict: 'user_id,system_type,land_id' },
    );

  if (error) throw error;
}

export function subscribeToSensorReadings(
  userId: string,
  systemType: SystemType,
  landId: LandId,
  onReading: (reading: SensorReading) => void,
): RealtimeChannel {
  return supabase
    .channel(`sensor_readings:${userId}:${systemType}:${landId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'sensor_readings',
        filter: `user_id=eq.${userId}`,
      },
      payload => {
        const next = payload.new as SensorReading;
        if (next.system_type === systemType && next.land_id === landId) onReading(next);
      },
    )
    .subscribe();
}
