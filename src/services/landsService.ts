import { supabase } from '../lib/supabase';
import { Land, SystemType } from '../types';

export const DEFAULT_LANDS: Omit<Land, 'user_id' | 'created_at'>[] = [
  { id: 'lahan1', label: 'Lahan 1', crop: 'Bawang Merah', area: '0.5 Ha', system_type: 'panel', radius_m: 500 },
  { id: 'lahan2', label: 'Lahan 2', crop: 'Bawang Putih', area: '0.8 Ha', system_type: 'panel', radius_m: 500 },
  { id: 'lahan3', label: 'Lahan 3', crop: 'Bawang Merah', area: '1.0 Ha', system_type: 'panel', radius_m: 500 },
  { id: 'lahan1', label: 'Lokasi Portable 1', crop: 'Bawang Merah', system_type: 'portable', radius_m: 500 },
  { id: 'lahan2', label: 'Lokasi Portable 2', crop: 'Bawang Merah', system_type: 'portable', radius_m: 500 },
  { id: 'lahan3', label: 'Lokasi Portable 3', crop: 'Bawang Merah', system_type: 'portable', radius_m: 500 },
];

export async function fetchUserLands(userId: string, systemType?: SystemType): Promise<Land[]> {
  let query = supabase.from('lands').select('*').eq('user_id', userId);
  if (systemType) query = query.eq('system_type', systemType);

  const { data, error } = await query.order('created_at', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function seedDefaultLands(userId: string, systemType?: SystemType): Promise<Land[]> {
  const rows = DEFAULT_LANDS
    .filter(land => !systemType || land.system_type === systemType)
    .map(land => ({ ...land, user_id: userId }));

  const { data, error } = await supabase
    .from('lands')
    .upsert(rows, { onConflict: 'id,user_id,system_type' })
    .select();

  if (error) throw error;
  return data ?? [];
}

export async function createLand(
  userId: string,
  payload: Pick<Land, 'label' | 'crop' | 'system_type'> & Partial<Pick<Land, 'area' | 'latitude' | 'longitude' | 'radius_m'>>,
): Promise<Land> {
  const id = `lahan-${crypto.randomUUID()}`;
  const { data, error } = await supabase
    .from('lands')
    .insert({ id, user_id: userId, ...payload })
    .select()
    .single();

  if (error) error;
  return data;
}

export async function deleteLand(userId: string, landId: string, systemType: SystemType): Promise<void> {
  const { error } = await supabase
    .from('lands')
    .delete()
    .eq('user_id', userId)
    .eq('id', landId)
    .eq('system_type', systemType);

  if (error) throw error;
}
