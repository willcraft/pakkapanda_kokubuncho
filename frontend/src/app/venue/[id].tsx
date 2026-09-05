import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { api, useMyProfile, useMyVenueId, usePeople, useVenue } from '@/api/client';
import { MbtiAvatar } from '@/components/MbtiAvatar';
import { PrimaryButton } from '@/components/PrimaryButton';
import { RankBadge } from '@/components/RankBadge';
import { compat } from '@/logic/compatibility';
import { venueCompatPct, venueMbtiCharacter, venueMembers } from '@/logic/venueStats';
import { colors } from '@/theme';

function minutesAgo(at?: number): string {
  if (!at) return '';
  const min = Math.max(1, Math.round((Date.now() - at) / 60_000));
  return `${min}分前にチェックイン`;
}

export default function VenueScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const venue = useVenue(id);
  const people = usePeople();
  const profile = useMyProfile();
  const myVenueId = useMyVenueId();

  if (!venue || !profile) return null;

  const members = venueMembers(people, venue.id);
  const pct = venueCompatPct(profile, members);
  const isCheckedIn = myVenueId === venue.id;
  // 自分のチェックインも人数・MBTI分布に即時反映する(仕様4.5)
  const character = venueMbtiCharacter(
    isCheckedIn
      ? [...members, { ...members[0], id: 'me', mbti: profile.mbti } as (typeof members)[number]]
      : members,
  );
  const memberCount = members.length + (isCheckedIn ? 1 : 0);
  const visible = members.slice(0, 3);
  const restCount = members.length - visible.length;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topBar}>
        <Pressable style={styles.back} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={20} color={colors.text} />
        </Pressable>
      </View>

      <View style={styles.sheet}>
        <View style={styles.handle} />
        <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{venue.name}</Text>
            {isCheckedIn && (
              <View style={styles.checkedinBadge}>
                <View style={styles.dot} />
                <Text style={styles.checkedinBadgeText}>チェックイン中</Text>
              </View>
            )}
          </View>
          <View style={styles.metaRow}>
            <View style={styles.categoryTag}>
              <Text style={styles.categoryTagText}>{venue.category}</Text>
            </View>
            <Text style={styles.metaText}>国分町エリア内・{venue.distanceM}m</Text>
          </View>

          <View style={styles.compatCard}>
            <View style={styles.ring}>
              <Text style={styles.ringText}>
                {pct !== null ? `${pct}%` : '--'}
              </Text>
            </View>
            <View style={styles.compatTextWrap}>
              <Text style={styles.compatTitle}>
                {pct !== null ? `このお店との相性 ${pct}%` : 'まだ誰もいません'}
              </Text>
              <Text style={styles.compatSub}>
                {pct !== null
                  ? '今いるメンバーのMBTIの組み合わせから算出した、今夜のノリの合いやすさです。'
                  : '最初にチェックインして、この店の夜を始めましょう。'}
              </Text>
            </View>
          </View>

          {character && (
            <View style={styles.characterRow}>
              <MbtiAvatar type={character} size={32} />
              <Text style={styles.characterText}>
                この店はいま <Text style={styles.characterType}>{character}</Text> な夜
              </Text>
            </View>
          )}

          <Text style={styles.sectionTitle}>いまお店にいる人・{memberCount}人</Text>
          <View style={styles.memberList}>
            {visible.map((p) => {
              const c = compat(profile, p);
              return (
                <Pressable
                  key={p.id}
                  style={styles.memberRow}
                  onPress={() => router.push(`/person/${p.id}`)}
                >
                  <MbtiAvatar type={p.mbti} size={44} />
                  <View style={styles.memberInfo}>
                    <Text style={styles.memberTitle}>
                      {p.ageBand}・{p.hobbies.slice(0, 2).join('/')}
                    </Text>
                    <Text style={styles.memberSub}>{minutesAgo(p.checkedInAt)}</Text>
                  </View>
                  <RankBadge rank={c.rank} size={24} />
                </Pressable>
              );
            })}
          </View>
          {restCount > 0 && <Text style={styles.restText}>ほか{restCount}人がチェックイン中</Text>}
        </ScrollView>

        <View style={styles.footer}>
          {isCheckedIn ? (
            <Pressable onPress={() => api.checkOut()}>
              <Text style={styles.checkoutLink}>チェックインを解除する</Text>
            </Pressable>
          ) : (
            <PrimaryButton label="この店にチェックインする" onPress={() => api.checkIn(venue.id)} />
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#080B10' },
  topBar: { paddingHorizontal: 16, paddingVertical: 8 },
  back: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheet: {
    flex: 1,
    backgroundColor: colors.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: 24,
  },
  handle: {
    alignSelf: 'center',
    width: 48,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.cardBorder,
    marginTop: 10,
  },
  body: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { color: colors.text, fontSize: 26, fontWeight: '800' },
  checkedinBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderColor: colors.coral,
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.coral },
  checkedinBadgeText: { color: colors.coral, fontSize: 12, fontWeight: '600' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 },
  categoryTag: {
    backgroundColor: colors.card,
    borderColor: colors.cardBorder,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  categoryTagText: { color: colors.textDim, fontSize: 11 },
  metaText: { color: colors.textDim, fontSize: 13 },
  compatCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 18,
    marginTop: 20,
  },
  ring: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 7,
    borderColor: colors.coral,
    borderTopColor: '#3A2228',
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '45deg' }],
  },
  ringText: { color: colors.text, fontSize: 18, fontWeight: '800', transform: [{ rotate: '-45deg' }] },
  compatTextWrap: { flex: 1 },
  compatTitle: { color: colors.text, fontSize: 16, fontWeight: '700' },
  compatSub: { color: colors.textDim, fontSize: 12, lineHeight: 19, marginTop: 6 },
  characterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 14,
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 12,
  },
  characterText: { color: colors.textDim, fontSize: 14 },
  characterType: { color: colors.teal, fontWeight: '800' },
  sectionTitle: { color: colors.text, fontSize: 15, fontWeight: '700', marginTop: 24, marginBottom: 12 },
  memberList: { gap: 10 },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 14,
  },
  memberInfo: { flex: 1 },
  memberTitle: { color: colors.text, fontSize: 15, fontWeight: '600' },
  memberSub: { color: colors.textDim, fontSize: 12, marginTop: 3 },
  restText: { color: colors.textDim, fontSize: 13, textAlign: 'center', marginTop: 14 },
  footer: { paddingHorizontal: 20, paddingVertical: 14, alignItems: 'center' },
  checkoutLink: {
    color: colors.textDim,
    fontSize: 14,
    textDecorationLine: 'underline',
    paddingVertical: 10,
  },
});
