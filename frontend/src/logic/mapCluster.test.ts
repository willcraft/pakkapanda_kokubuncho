import { describe, expect, it } from 'vitest';

import { clusterByGrid } from '@/logic/mapCluster';
import type { Coord } from '@/types';

interface Item {
  id: string;
  coord: Coord;
}

const item = (id: string, latitude: number, longitude: number): Item => ({
  id,
  coord: { latitude, longitude },
});

const getCoord = (i: Item) => i.coord;

describe('clusterByGrid', () => {
  it('離れた2点は別クラスタになる', () => {
    const clusters = clusterByGrid([item('a', 38.26, 140.86), item('b', 38.27, 140.88)], getCoord, 0.001);
    expect(clusters).toHaveLength(2);
    expect(clusters.every((c) => c.items.length === 1)).toBe(true);
  });

  it('同じセル内の2点は1クラスタにまとまり、座標は重心になる', () => {
    const clusters = clusterByGrid(
      [item('a', 38.2601, 140.8601), item('b', 38.2603, 140.8603)],
      getCoord,
      0.001,
    );
    expect(clusters).toHaveLength(1);
    expect(clusters[0].items.map((i) => i.id)).toEqual(['a', 'b']);
    expect(clusters[0].coord.latitude).toBeCloseTo(38.2602, 5);
    expect(clusters[0].coord.longitude).toBeCloseTo(140.8602, 5);
  });

  it('セルサイズが小さいほど分割される(ズームイン相当)', () => {
    const items = [item('a', 38.2601, 140.8601), item('b', 38.2609, 140.8609)];
    expect(clusterByGrid(items, getCoord, 0.01)).toHaveLength(1);
    expect(clusterByGrid(items, getCoord, 0.0005)).toHaveLength(2);
  });

  it('空配列は空を返す', () => {
    expect(clusterByGrid([], getCoord, 0.001)).toEqual([]);
  });
});
