// ネイティブ(iOS/Android)用の実地図。webでは VenueMap.web.tsx が使われ、
// react-native-maps はネイティブ以外で import されない(web非対応のため)。
import { useMemo, useRef, useState } from 'react';
import { StyleSheet } from 'react-native';
import MapView, { Circle, Marker } from 'react-native-maps';

import {
  ClusterPinView,
  PersonPinView,
  SelfPinView,
  VenuePinView,
  type VenuePinData,
} from '@/components/map/pins';
import { AREA_RADIUS_M, KOKUBUNCHO_CENTER } from '@/data/seed';
import { DARK_MAP_STYLE } from '@/data/mapStyle';
import { clusterByGrid } from '@/logic/mapCluster';
import type { Coord, MbtiType, Person } from '@/types';

export interface VenueMapProps {
  venuePins: VenuePinData[];
  walkers: Person[];
  me: { coord: Coord; mbti: MbtiType } | null;
  onPressVenue: (venueId: string) => void;
  onPressPerson: (personId: string) => void;
}

const INITIAL_LAT_DELTA = 0.004;
// 画面の縦を約8セルに分割してクラスタリングする
const CELLS_PER_SCREEN = 8;

export function VenueMap({ venuePins, walkers, me, onPressVenue, onPressPerson }: VenueMapProps) {
  const mapRef = useRef<MapView>(null);
  const [latDelta, setLatDelta] = useState(INITIAL_LAT_DELTA);

  const clusters = useMemo(
    () => clusterByGrid(venuePins, (p) => p.venue.coord, latDelta / CELLS_PER_SCREEN),
    [venuePins, latDelta],
  );

  const zoomInto = (coord: Coord) => {
    mapRef.current?.animateToRegion(
      {
        ...coord,
        latitudeDelta: latDelta / 3,
        longitudeDelta: latDelta / 3,
      },
      250,
    );
  };

  return (
    <MapView
      ref={mapRef}
      style={StyleSheet.absoluteFill}
      customMapStyle={DARK_MAP_STYLE}
      initialRegion={{
        ...KOKUBUNCHO_CENTER,
        latitudeDelta: INITIAL_LAT_DELTA,
        longitudeDelta: INITIAL_LAT_DELTA,
      }}
      onRegionChangeComplete={(region) => setLatDelta(region.latitudeDelta)}
    >
      <Circle
        center={KOKUBUNCHO_CENTER}
        radius={AREA_RADIUS_M}
        strokeColor="rgba(45, 212, 191, 0.7)"
        strokeWidth={1.5}
        fillColor="rgba(45, 212, 191, 0.05)"
      />
      {clusters.map((cluster) =>
        cluster.items.length === 1 ? (
          <Marker
            key={cluster.items[0].venue.id}
            coordinate={cluster.items[0].venue.coord}
            onPress={() => onPressVenue(cluster.items[0].venue.id)}
          >
            <VenuePinView {...cluster.items[0]} />
          </Marker>
        ) : (
          <Marker
            key={`cluster-${cluster.key}`}
            coordinate={cluster.coord}
            onPress={() => zoomInto(cluster.coord)}
          >
            <ClusterPinView count={cluster.items.length} />
          </Marker>
        ),
      )}
      {walkers.map((person) => (
        <Marker key={person.id} coordinate={person.coord} onPress={() => onPressPerson(person.id)}>
          <PersonPinView person={person} />
        </Marker>
      ))}
      {me && (
        <Marker coordinate={me.coord} zIndex={10}>
          <SelfPinView mbti={me.mbti} />
        </Marker>
      )}
    </MapView>
  );
}
