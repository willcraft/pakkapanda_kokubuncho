// 国分町エリア定義とプレゼンス判定(docs/バックエンド仕様書.md §4.1)
export interface LatLng {
  lat: number;
  lng: number;
}

export const AREA = {
  name: '国分町',
  center: { lat: 38.261, lng: 140.8722 } satisfies LatLng,
  radiusM: 250,
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
