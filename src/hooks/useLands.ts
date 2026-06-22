import { Land, LandValidationResult, SystemType } from '../types';
import { useLands as useLandsContext } from '../contexts/LandsContext';

function haversineM(lat1: number, lon1: number, lat2: number, lon2: number): number {
  // ... (keep the same)
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function validateLandCoords(
  lat: number,
  lon: number,
  lands: Land[],
): LandValidationResult {
  // ... (keep the same)
  const landsWithCoords = lands.filter(l => l.latitude != null && l.longitude != null);

  if (landsWithCoords.length === 0) {
    return { matched: false, land: null, distanceM: null, withinRadius: false };
  }

  let closest: Land | null = null;
  let minDist = Infinity;

  for (const land of landsWithCoords) {
    const dist = haversineM(lat, lon, land.latitude!, land.longitude!);
    if (dist < minDist) {
      minDist = dist;
      closest = land;
    }
  }

  const radius = closest?.radius_m ?? 500;
  return {
    matched: minDist <= radius,
    land: closest,
    distanceM: Math.round(minDist),
    withinRadius: minDist <= radius,
  };
}

export function useLands(systemType?: SystemType) {
    return useLandsContext(systemType);
}

