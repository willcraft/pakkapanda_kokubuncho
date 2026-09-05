// web用フォールバック。react-native-maps はweb非対応(codegenNativeComponentが
// react-native-web に存在しない)ため、緯度経度を%座標に写像した
// スタイライズドマップ(デザインPDF準拠のダークな抽象マップ)を描く。
import { Pressable, StyleSheet, View } from 'react-native';

import { PersonPinView, SelfPinView, VenuePinView, type VenuePinData } from '@/components/map/pins';
import { KOKUBUNCHO_CENTER } from '@/data/seed';
import { colors } from '@/theme';
import type { Coord, Person } from '@/types';

import type { VenueMapProps } from './VenueMap';

const LAT_SPAN = 0.004;
const LNG_SPAN = 0.004;

function toPercent(coord: Coord): { top: string; left: string } {
  const x = (coord.longitude - (KOKUBUNCHO_CENTER.longitude - LNG_SPAN / 2)) / LNG_SPAN;
  const y = ((KOKUBUNCHO_CENTER.latitude + LAT_SPAN / 2) - coord.latitude) / LAT_SPAN;
  return { top: `${Math.min(95, Math.max(5, y * 100))}%`, left: `${Math.min(95, Math.max(5, x * 100))}%` };
}

const GRID_LINES = [0.2, 0.4, 0.6, 0.8];

export function VenueMap({ venuePins, walkers, me, onPressVenue, onPressPerson }: VenueMapProps) {
  return (
    <View style={styles.container}>
      {GRID_LINES.map((p) => (
        <View key={`h${p}`} style={[styles.gridH, { top: `${p * 100}%` }]} />
      ))}
      {GRID_LINES.map((p) => (
        <View key={`v${p}`} style={[styles.gridV, { left: `${p * 100}%` }]} />
      ))}
      <View style={styles.areaEllipse} />
      {venuePins.map((pin) => {
        const pos = toPercent(pin.venue.coord);
        return (
          <Pressable
            key={pin.venue.id}
            style={[styles.pin, pos as object]}
            onPress={() => onPressVenue(pin.venue.id)}
          >
            <VenuePinView {...pin} />
          </Pressable>
        );
      })}
      {walkers.map((person) => {
        const pos = toPercent(person.coord);
        return (
          <Pressable
            key={person.id}
            style={[styles.pin, pos as object]}
            onPress={() => onPressPerson(person.id)}
          >
            <PersonPinView person={person} />
          </Pressable>
        );
      })}
      {me && (
        <View style={[styles.pin, toPercent(me.coord) as object]}>
          <SelfPinView mbti={me.mbti} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#0D1119',
    overflow: 'hidden',
  },
  gridH: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 10,
    backgroundColor: '#151A23',
  },
  gridV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 10,
    backgroundColor: '#151A23',
  },
  areaEllipse: {
    position: 'absolute',
    top: '12%',
    bottom: '12%',
    left: '8%',
    right: '8%',
    borderWidth: 1.5,
    borderColor: 'rgba(45, 212, 191, 0.7)',
    borderStyle: 'dashed',
    borderRadius: 999,
  },
  pin: {
    position: 'absolute',
    transform: [{ translateX: -22 }, { translateY: -22 }],
  },
});
