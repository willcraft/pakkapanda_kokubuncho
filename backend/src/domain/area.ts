// 国分町エリア定義とプレゼンス判定(docs/バックエンド仕様書.md §4.1)
// 座標の単一の情報源は shared/area.json
import area from '../../../shared/area.json';

export interface LatLng {
  lat: number;
  lng: number;
}

export const AREA = {
  name: area.name,
  center: { lat: area.lat, lng: area.lng } satisfies LatLng,
  radiusM: area.radiusM,
};

export const ACTIVE_WINDOW_MS = 10 * 60_000;

const EARTH_RADIUS_M = 6_371_000;

export function distanceM(a: LatLng, b: LatLng): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(s));
}

export function inArea(coord: LatLng): boolean {
  return distanceM(coord, AREA.center) <= AREA.radiusM;
}

export function isActive(loc: LatLng & { updatedAt: number }, now: number): boolean {
  return now - loc.updatedAt <= ACTIVE_WINDOW_MS && inArea(loc);
}
