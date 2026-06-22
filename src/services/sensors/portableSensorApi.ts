import { SensorReading, SystemType, LandId } from '../../types';
import { DeviceSensorPayload, mapDeviceSensorPayload } from './sensorMapper';

type SensorSnapshot = Omit<SensorReading, 'id' | 'user_id'>;

type StrapiSensorRecord = Record<string, unknown> & {
  attributes?: Record<string, unknown>;
};

const DEFAULT_STRAPI_URL = 'http://localhost:1337';

const PORTABLE_SENSOR_API_URL =
  (import.meta.env.VITE_PORTABLE_SENSOR_API_URL as string | undefined)?.replace(/\/$/, '') ||
  DEFAULT_STRAPI_URL;

const LATEST_SENSOR_PATH = '/api/data-sensors?sort[0]=createdAt:desc&pagination[limit]=1';

function normalizeStrapiRecord(
  record: StrapiSensorRecord,
  systemType: SystemType,
  landId: LandId,
): SensorSnapshot {
  const source = record.attributes ?? record;
  return mapDeviceSensorPayload(
    {
      ...(source as DeviceSensorPayload),
      created_at: String(source.createdAt ?? source.created_at ?? new Date().toISOString()),
    },
    systemType,
    landId,
  );
}

export async function fetchLatestPortableSensor(
  systemType: SystemType,
  landId: LandId,
): Promise<SensorSnapshot | null> {
  const response = await fetch(`${PORTABLE_SENSOR_API_URL}${LATEST_SENSOR_PATH}`);
  if (!response.ok) {
    throw new Error(`Portable sensor API returned ${response.status}`);
  }

  const result = (await response.json()) as { data?: StrapiSensorRecord[] };
  const latest = result.data?.[0];
  if (!latest) return null;

  return normalizeStrapiRecord(latest, systemType, landId);
}
