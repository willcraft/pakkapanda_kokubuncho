import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { api, useMyCheckin, useVenueDetail } from '@/api/client';
import { MbtiAvatar } from '@/components/MbtiAvatar';
import { PrimaryButton } from '@/components/PrimaryButton';
import { RankBadge } from '@/components/RankBadge';
import { colors } from '@/theme';

function minutesAgo(at: number | null): string {
  if (!at) return '';
  const min = Math.max(1, Math.round((Date.now() - at) / 60_000));
  return `${min}分前にチェックイン`;
}

export default function VenueScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const venue = useVenueDetail(id);
  const myCheckin = useMyCheckin();

  if (!venue) return <SafeAreaView style={styles.safe} />;

  const isCheckedIn = myCheckin?.venueId === venue.id;
  // 自分のチェックインも人数に即時反映する(仕様4.5。サーバー集計は他人のみのため+1)
  const memberCount = venue.memberCount + (isCheckedIn ? 1 : 0);
  const visible = venue.members.slice(0, 3);
  const restCount = venue.members.length - visible.length;

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
            <Text style={styles.metaText}>
              国分町エリア内{venue.distanceM !== null ? `・${venue.distanceM}m` : ''}
            </Text>
          </View>

          <View style={styles.compatCard}>
            <View style={styles.ring}>
              <Text style={styles.ringText}>
                {venue.compatPct !== null ? `${venue.compatPct}%` : '--'}
              </Text>
            </View>
            <View style={styles.compatTextWrap}>
              <Text style={styles.compatTitle}>
                {venue.compatPct !== null ? `このお店との相性 ${venue.compatPct}%` : 'まだ誰もいません'}
              </Text>
              <Text style={styles.compatSub}>
                {venue.compatPct !== null
                  ? '今いるメンバーのMBTIの組み合わせから算出した、今夜のノリの合いやすさです。'
                  : '最初にチェックインして、この店の夜を始めましょう。'}
              </Text>
            </View>
          </View>

          {venue.mbtiCharacter && (
            <View style={styles.characterRow}>
              <MbtiAvatar type={venue.mbtiCharacter} size={32} />
              <Text style={styles.characterText}>
                この店はいま <Text style={styles.characterType}>{venue.mbtiCharacter}</Text> な夜
              </Text>
            </View>
          )}

          <Text style={styles.sectionTitle}>いまお店にいる人・{memberCount}人</Text>
          <View style={styles.memberList}>
            {visible.map((m) => (
              <Pressable
                key={m.userId}
                style={styles.memberRow}
                onPress={() => router.push(`/person/${m.userId}`)}
              >
                <MbtiAvatar type={m.mbti} size={44} />
                <View style={styles.memberInfo}>
                  <Text style={styles.memberTitle}>
                    {m.ageBand}・{m.hobbies.slice(0, 2).join('/')}
                  </Text>
                  <Text style={styles.memberSub}>{minutesAgo(m.checkedInAt)}</Text>
                </View>
                <RankBadge rank={m.compat.rank} size={24} />
              </Pressable>
            ))}
          </View>
          {restCount > 0 && <Text style={styles.restText}>ほか{restCount}人がチェックイン中</Text>}
        </ScrollView>

        <View style={styles.footer}>
          {isCheckedIn ? (
            <Pressable onPress={() => void api.checkOut()}>
              <Text style={styles.checkoutLink}>チェックインを解除する</Text>
            </Pressable>
          ) : (
            <PrimaryButton label="この店にチェックインする" onPress={() => void api.checkIn(venue.id)} />
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
