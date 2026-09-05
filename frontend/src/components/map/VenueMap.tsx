// ネイティブ(iOS/Android)用の実地図。webでは VenueMap.web.tsx が使われ、
// react-native-maps はネイティブ以外で import されない(web非対応のため)。
import { StyleSheet } from 'react-native';
import MapView, { Circle, Marker } from 'react-native-maps';

import { PersonPinView, SelfPinView, VenuePinView, type VenuePinData } from '@/components/map/pins';
import { AREA_RADIUS_M, KOKUBUNCHO_CENTER } from '@/data/seed';
import { DARK_MAP_STYLE } from '@/data/mapStyle';
import type { Coord, MbtiType, Person } from '@/types';

export interface VenueMapProps {
  venuePins: VenuePinData[];
  walkers: Person[];
  me: { coord: Coord; mbti: MbtiType } | null;
  onPressVenue: (venueId: string) => void;
  onPressPerson: (personId: string) => void;
}

export function VenueMap({ venuePins, walkers, me, onPressVenue, onPressPerson }: VenueMapProps) {
  return (
    <MapView
      style={StyleSheet.absoluteFill}
      customMapStyle={DARK_MAP_STYLE}
      initialRegion={{
        ...KOKUBUNCHO_CENTER,
        latitudeDelta: 0.004,
        longitudeDelta: 0.004,
      }}
    >
      <Circle
        center={KOKUBUNCHO_CENTER}
        radius={AREA_RADIUS_M}
        strokeColor="rgba(45, 212, 191, 0.7)"
        strokeWidth={1.5}
        fillColor="rgba(45, 212, 191, 0.05)"
      />
      {venuePins.map((pin) => (
        <Marker
          key={pin.venue.id}
          coordinate={pin.venue.coord}
          onPress={() => onPressVenue(pin.venue.id)}
        >
          <VenuePinView {...pin} />
        </Marker>
      ))}
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
