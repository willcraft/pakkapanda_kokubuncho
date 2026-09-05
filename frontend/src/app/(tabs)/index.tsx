import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  useHomePolling,
  useMatchesList,
  useMyCheckin,
  useMyLocation,
  useMyProfile,
  useNearby,
  useVenueSummaries,
  useVenueSummary,
} from '@/api/client';
import { MbtiAvatar } from '@/components/MbtiAvatar';
import { VenueMap } from '@/components/map/VenueMap';
import type { VenuePinData } from '@/components/map/pins';
import { colors } from '@/theme';
import type { Person } from '@/types';

export default function MapScreen() {
  const router = useRouter();
  useHomePolling();

  const venues = useVenueSummaries();
  const nearby = useNearby();
  const matches = useMatchesList();
  const myCheckin = useMyCheckin();
  const myVenue = useVenueSummary(myCheckin?.venueId);
  const profile = useMyProfile();
  const myLocation = useMyLocation();

  const venuePins: VenuePinData[] = venues.map((v) => ({
    venue: {
      id: v.id,
      name: v.name,
      category: v.category,
      coord: { latitude: v.lat, longitude: v.lng },
      distanceM: v.distanceM ?? 0,
    },
    count: v.memberCount,
    character: v.mbtiCharacter,
  }));

  // 街歩き中(venueIdなし)の人だけ座標付きで返る
  const walkers: Person[] = nearby
    .filter((p) => p.venueId === null && p.lat !== null && p.lng !== null)
    .map((p) => ({
      id: p.userId,
      mbti: p.mbti,
      ageBand: p.ageBand,
      hobbies: p.hobbies,
      venueId: null,
      coord: { latitude: p.lat!, longitude: p.lng! },
    }));

  return (
    <View style={styles.container}>
      <VenueMap
        venuePins={venuePins}
        walkers={walkers}
        me={profile && myLocation ? { coord: myLocation, mbti: profile.mbti } : null}
        onPressVenue={(id) => router.push(`/venue/${id}`)}
        onPressPerson={(id) => router.push(`/person/${id}`)}
      />

      <SafeAreaView style={styles.overlay} pointerEvents="box-none">
        <View style={styles.header} pointerEvents="box-none">
          <View style={styles.logoRow}>
            <View style={styles.logoMark}>
              <Text style={styles.logoMarkText}>T</Text>
            </View>
            <Text style={styles.logoText}>TypeSync</Text>
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

        <Text style={styles.osmCredit}>店舗データ © OpenStreetMap contributors</Text>
        <Pressable style={styles.banner} onPress={() => router.push('/(tabs)/matches')}>
          <View style={styles.bannerAvatars}>
            {matches.map((m, i) => (
              <View key={m.userId} style={[styles.bannerAvatar, { marginLeft: i === 0 ? 0 : -8 }]}>
                <MbtiAvatar type={m.mbti} size={28} />
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
  osmCredit: {
    color: colors.textDim,
    fontSize: 9,
    textAlign: 'right',
    marginBottom: 4,
    textShadowColor: colors.bg,
    textShadowRadius: 3,
  },
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
});
