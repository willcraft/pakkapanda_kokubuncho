import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import MapView, { Circle, Marker } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useMatches, useMyCheckin, useMyProfile, usePeople, useVenues } from '@/api/client';
import { MbtiAvatar } from '@/components/MbtiAvatar';
import { AREA_RADIUS_M, KOKUBUNCHO_CENTER } from '@/data/seed';
import { DARK_MAP_STYLE } from '@/data/mapStyle';
import { venueMbtiCharacter, venueMembers } from '@/logic/venueStats';
import { colors, mbtiColor } from '@/theme';

export default function MapScreen() {
  const router = useRouter();
  const venues = useVenues();
  const people = usePeople();
  const profile = useMyProfile();
  const { venue: myVenue } = useMyCheckin();
  const matches = useMatches(3);

  const walkers = people.filter((p) => p.venueId === null);

  return (
    <View style={styles.container}>
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
        {venues.map((venue) => {
          const members = venueMembers(people, venue.id);
          const isMine = myVenue?.id === venue.id;
          // 自分のチェックインも人数・MBTI分布に即時反映する(仕様4.5)
          const count = members.length + (isMine ? 1 : 0);
          const character = venueMbtiCharacter(
            isMine && profile
              ? [...members, { ...members[0], id: 'me', mbti: profile.mbti } as (typeof members)[number]]
              : members,
          );
          return (
            <Marker
              key={venue.id}
              coordinate={venue.coord}
              onPress={() => router.push(`/venue/${venue.id}`)}
            >
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
            </Marker>
          );
        })}
        {walkers.map((person) => (
          <Marker
            key={person.id}
            coordinate={person.coord}
            onPress={() => router.push(`/person/${person.id}`)}
          >
            <View style={[styles.personPin, { borderColor: mbtiColor(person.mbti) }]}>
              <Text style={[styles.personPinText, { color: colors.text }]}>{person.mbti}</Text>
            </View>
          </Marker>
        ))}
      </MapView>

      <SafeAreaView style={styles.overlay} pointerEvents="box-none">
        <View style={styles.header} pointerEvents="box-none">
          <View style={styles.logoRow}>
            <View style={styles.logoMark}>
              <Text style={styles.logoMarkText}>夜</Text>
            </View>
            <Text style={styles.logoText}>夜あわせ</Text>
          </View>
          <View style={styles.areaBadge}>
            <Text style={styles.areaBadgeText}>国分町エリア</Text>
          </View>
        </View>

        <Pressable
          style={[styles.checkinCard, myVenue && styles.checkinCardActive]}
          onPress={() => myVenue && router.push(`/venue/${myVenue.id}`)}
        >
          <Ionicons
            name="location"
            size={20}
            color={myVenue ? colors.coral : colors.textDim}
          />
          <View>
            <Text style={styles.checkinLabel}>
              {myVenue ? 'チェックイン中' : 'チェックインしていません'}
            </Text>
            <Text style={styles.checkinVenue}>
              {myVenue ? myVenue.name : 'お店を選んでチェックイン'}
            </Text>
          </View>
        </Pressable>
        <View style={styles.lockChip}>
          <Ionicons name="lock-closed" size={11} color={colors.textDim} />
          <Text style={styles.lockChipText}>エリア外・利用不可</Text>
        </View>

        <View style={styles.spacer} pointerEvents="none" />

        <Pressable style={styles.banner} onPress={() => router.push('/(tabs)/matches')}>
          <View style={styles.bannerAvatars}>
            {matches.map((m, i) => (
              <View key={m.person.id} style={[styles.bannerAvatar, { marginLeft: i === 0 ? 0 : -8 }]}>
                <MbtiAvatar type={m.person.mbti} size={28} />
              </View>
            ))}
          </View>
          <View style={styles.bannerTextWrap}>
            <Text style={styles.bannerTitle}>近くに相性がいい人 {matches.length}人</Text>
            <Text style={styles.bannerSub}>タップして見てみる</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textDim} />
        </Pressable>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  overlay: { flex: 1, paddingHorizontal: 16 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoMark: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.coral,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoMarkText: { color: '#1A0E10', fontSize: 18, fontWeight: '800' },
  logoText: { color: colors.text, fontSize: 20, fontWeight: '800' },
  areaBadge: {
    borderColor: colors.teal,
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: 'rgba(11, 14, 20, 0.7)',
  },
  areaBadgeText: { color: colors.teal, fontSize: 13, fontWeight: '600' },
  checkinCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(22, 27, 38, 0.95)',
    borderColor: colors.cardBorder,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginTop: 8,
  },
  checkinCardActive: { borderColor: colors.coral },
  checkinLabel: { color: colors.textDim, fontSize: 12 },
  checkinVenue: { color: colors.text, fontSize: 17, fontWeight: '700', marginTop: 2 },
  lockChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(22, 27, 38, 0.9)',
    borderColor: colors.cardBorder,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginTop: 8,
  },
  lockChipText: { color: colors.textDim, fontSize: 11 },
  spacer: { flex: 1 },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(22, 27, 38, 0.97)',
    borderColor: colors.cardBorder,
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 10,
  },
  bannerAvatars: { flexDirection: 'row' },
  bannerAvatar: {
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.bg,
  },
  bannerTextWrap: { flex: 1 },
  bannerTitle: { color: colors.text, fontSize: 15, fontWeight: '700' },
  bannerSub: { color: colors.textDim, fontSize: 12, marginTop: 2 },
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
  personPinText: { fontSize: 10, fontWeight: '700' },
});
