import { LandId, SensorReading, SystemType } from '../../types';

export type DeviceSensorPayload = {
  device_id?: string;
  user_id?: string;
  system_type?: SystemType;
  land_id?: LandId;
  nitrogen?: number | string;
  phosphorus?: number | string;
  phosphor?: number | string;
  potassium?: number | string;
  kalium?: number | string;
  ph?: number | string;
  ph_tanah?: number | string;
  ec?: number | string;
  conductivity?: number | string;
  konduktivitas?: number | string;
  moisture?: number | string;
  kelembapan_tanah?: number | string;
  temperature?: number | string;
  suhu_tanah?: number | string;
  created_at?: string;
};

type SensorSnapshot = Omit<SensorReading, 'id' | 'user_id'>;

function toNumber(value: unknown): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value === 'string') {
    const parsed = Number(value.replace(',', '.').trim());
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function pick(payload: DeviceSensorPayload, keys: Array<keyof DeviceSensorPayload>): unknown {
  for (const key of keys) {
    const value = payload[key];
    if (value !== undefined && value !== null && value !== '') return value;
  }
  return undefined;
}

function normalizeConductivity(payload: DeviceSensorPayload): number {
  const explicitConductivity = pick(payload, ['conductivity', 'konduktivitas']);
  if (explicitConductivity !== undefined) return toNumber(explicitConductivity);

  const ec = toNumber(payload.ec);
  if (ec > 20) return parseFloat((ec / 1000).toFixed(3));
  return ec;
}

export function mapDeviceSensorPayload(
  payload: DeviceSensorPayload,
  fallbackSystemType: SystemType,
  fallbackLandId: LandId,
): SensorSnapshot {
  return {
    system_type: payload.system_type ?? fallbackSystemType,
    land_id: payload.land_id ?? fallbackLandId,
    moisture: toNumber(pick(payload, ['moisture', 'kelembapan_tanah'])),
    nitrogen: toNumber(payload.nitrogen),
    phosphorus: toNumber(pick(payload, ['phosphorus', 'phosphor'])),
    potassium: toNumber(pick(payload, ['potassium', 'kalium'])),
    temperature: toNumber(pick(payload, ['temperature', 'suhu_tanah'])),
    ph: toNumber(pick(payload, ['ph', 'ph_tanah'])),
    conductivity: normalizeConductivity(payload),
    created_at: payload.created_at ?? new Date().toISOString(),
  };
}

