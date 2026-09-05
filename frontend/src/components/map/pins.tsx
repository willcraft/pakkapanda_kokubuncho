import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { colors, mbtiColor } from '@/theme';
import type { MbtiType, Person, Venue } from '@/types';

export interface VenuePinData {
  venue: Venue;
  count: number;
  character: MbtiType | null;
}

export function VenuePinView({ venue, count, character }: VenuePinData) {
  return (
    <View style={styles.venuePinWrap}>
      <View style={styles.venuePin}>
        <Ionicons name="wine" size={18} color="#1A0E10" />
        {count > 0 && (
          <View style={styles.venueCount}>
            <Text style={styles.venueCountText}>{count}</Text>
          </View>
        )}
        {character && (
          <View style={styles.venueChar}>
            <Text style={styles.venueCharText}>{character}</Text>
          </View>
        )}
      </View>
      <Text style={styles.venueName}>{venue.name}</Text>
    </View>
  );
}

export function PersonPinView({ person }: { person: Person }) {
  return (
    <View style={[styles.personPin, { borderColor: mbtiColor(person.mbti) }]}>
      <Text style={styles.personPinText}>{person.mbti}</Text>
    </View>
  );
}

export function SelfPinView({ mbti }: { mbti: MbtiType }) {
  return (
    <View style={styles.selfPinWrap}>
      <View style={[styles.selfPin, { backgroundColor: mbtiColor(mbti) }]}>
        <Text style={styles.selfPinText}>{mbti}</Text>
      </View>
      <View style={styles.selfLabel}>
        <Text style={styles.selfLabelText}>あなた</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  venuePinWrap: { alignItems: 'center' },
  venuePin: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.coral,
    alignItems: 'center',
    justifyContent: 'center',
  },
  venueCount: {
    position: 'absolute',
    top: -6,
    right: -6,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.bg,
    borderColor: colors.coral,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  venueCountText: { color: colors.text, fontSize: 11, fontWeight: '700' },
  venueChar: {
    position: 'absolute',
    bottom: -8,
    alignSelf: 'center',
    backgroundColor: colors.bg,
    borderColor: colors.teal,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  venueCharText: { color: colors.teal, fontSize: 8, fontWeight: '800' },
  venueName: {
    color: colors.text,
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
    textShadowColor: colors.bg,
    textShadowRadius: 4,
  },
  personPin: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    backgroundColor: 'rgba(11, 14, 20, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  personPinText: { fontSize: 10, fontWeight: '700', color: colors.text },
  selfPinWrap: { alignItems: 'center' },
  selfPin: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 3,
    borderColor: colors.coral,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.coral,
    shadowOpacity: 0.6,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },
  selfPinText: { fontSize: 11, fontWeight: '800', color: '#FFFFFF' },
  selfLabel: {
    backgroundColor: colors.coral,
    borderRadius: 7,
    paddingHorizontal: 6,
    paddingVertical: 1,
    marginTop: 3,
  },
  selfLabelText: { color: '#1A0E10', fontSize: 9, fontWeight: '800' },
});
