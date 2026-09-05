import type { Coord } from '@/types';

export interface Cluster<T> {
  key: string;
  coord: Coord;
  items: T[];
}

/**
 * グリッドベースの簡易クラスタリング。
 * cellSizeDeg(度)のセルに区切り、同一セルの項目をまとめる。
 * クラスタ座標はメンバーの重心。ズームレベルに応じて cellSizeDeg を変えることで
 * ズームイン時に自然と分解される。
 */
export function clusterByGrid<T>(
  items: T[],
  getCoord: (item: T) => Coord,
  cellSizeDeg: number,
): Cluster<T>[] {
  const cells = new Map<string, T[]>();
  for (const item of items) {
    const c = getCoord(item);
    const key = `${Math.floor(c.latitude / cellSizeDeg)}:${Math.floor(c.longitude / cellSizeDeg)}`;
    const list = cells.get(key) ?? [];
    list.push(item);
    cells.set(key, list);
  }
  return [...cells.entries()].map(([key, members]) => ({
    key,
    coord: {
      latitude: members.reduce((a, m) => a + getCoord(m).latitude, 0) / members.length,
      longitude: members.reduce((a, m) => a + getCoord(m).longitude, 0) / members.length,
    },
    items: members,
  }));
}
