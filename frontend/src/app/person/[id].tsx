import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { api, useCompatWith, useIsLiked, useMyProfile, usePerson, useVenue } from '@/api/client';
import { HobbyTag } from '@/components/HobbyTag';
import { MbtiAvatar } from '@/components/MbtiAvatar';
import { PrimaryButton } from '@/components/PrimaryButton';
import { pairReason, PERSONALITY } from '@/data/personality';
import { colors, mbtiColor, rankColor } from '@/theme';
import { RANK_LABELS } from '@/types';

export default function PersonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const person = usePerson(id);
  const profile = useMyProfile();
  const compat = useCompatWith(id);
  const liked = useIsLiked(id);
  const venue = useVenue(person?.venueId);

  if (!person || !profile || !compat) return null;

  const personality = PERSONALITY[person.mbti];

  return (
    <View style={styles.container}>
      <View style={[styles.hero, { backgroundColor: `${mbtiColor(person.mbti)}33` }]}>
        <SafeAreaView style={styles.heroInner}>
          <View style={styles.heroBar}>
            <Pressable style={styles.back} onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={20} color={colors.text} />
            </Pressable>
            <View style={[styles.rankChip, { borderColor: rankColor(compat.rank) }]}>
              <View style={[styles.rankDot, { backgroundColor: rankColor(compat.rank) }]}>
                <Text style={styles.rankDotText}>{compat.rank}</Text>
              </View>
              <Text style={styles.rankChipText}>相性:{RANK_LABELS[compat.rank]}</Text>
            </View>
          </View>
          <View style={styles.heroAvatar}>
            <MbtiAvatar type={person.mbti} size={160} />
          </View>
        </SafeAreaView>
      </View>

      <ScrollView style={styles.sheet} contentContainerStyle={styles.body}>
        <View style={styles.nameRow}>
          <Text style={styles.name}>{person.mbti}</Text>
          <Text style={styles.age}>・{person.ageBand}</Text>
        </View>
        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={14} color={colors.teal} />
          <Text style={styles.location}>
            {venue ? `${venue.name}にチェックイン中` : '国分町エリアを歩いています'}
          </Text>
        </View>
        <View style={styles.tags}>
          {person.hobbies.map((h) => (
            <HobbyTag key={h} label={h} />
          ))}
        </View>

        <View style={styles.divider} />

        <View style={styles.card}>
          <Text style={styles.cardHeading}>
            {person.mbti}は「{personality.title}」
          </Text>
          <Text style={styles.cardText}>{personality.text}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardHeading}>
            {profile.mbti}のあなたとの相性
          </Text>
          <Text style={styles.cardText}>{pairReason(profile.mbti, person.mbti)}</Text>
        </View>

        <Text style={styles.notice}>
          プロフィールは国分町エリア内にいる間だけ表示されます。性別は表示されません。
        </Text>
      </ScrollView>

      <View style={styles.footer}>
        {liked ? (
          <PrimaryButton label="チャットを開く" onPress={() => router.push(`/chat/${person.id}`)} />
        ) : (
          <PrimaryButton label="♡ いいねを送る" onPress={() => api.sendLike(person.id)} />
        )}
        <Text style={styles.footerCaption}>
          どちらかが「いいね」を送るとチャットができるようになります
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  hero: { paddingBottom: 32 },
  heroInner: { paddingHorizontal: 16 },
  heroBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  back: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(22, 27, 38, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 20,
    paddingLeft: 6,
    paddingRight: 14,
    paddingVertical: 5,
    backgroundColor: 'rgba(11, 14, 20, 0.7)',
  },
  rankDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankDotText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
  rankChipText: { color: colors.text, fontSize: 13, fontWeight: '600' },
  heroAvatar: { alignItems: 'center', marginTop: 16 },
  sheet: { flex: 1 },
  body: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 16 },
  nameRow: { flexDirection: 'row', alignItems: 'baseline' },
  name: { color: colors.text, fontSize: 30, fontWeight: '800' },
  age: { color: colors.textDim, fontSize: 15 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 10 },
  location: { color: colors.teal, fontSize: 14 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  divider: { height: 1, backgroundColor: colors.cardBorder, marginVertical: 20 },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  cardHeading: { color: colors.text, fontSize: 15, fontWeight: '700' },
  cardText: { color: colors.textDim, fontSize: 13, lineHeight: 21, marginTop: 8 },
  notice: { color: colors.textDim, fontSize: 12, lineHeight: 19, marginTop: 8 },
  footer: { paddingHorizontal: 20, paddingBottom: 24, paddingTop: 8 },
  footerCaption: { color: colors.textDim, fontSize: 11, textAlign: 'center', marginTop: 10 },
});
