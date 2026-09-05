import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { api, useMatchesList, useMatchesPolling, useVenueSummary } from '@/api/client';
import type { ApiPerson } from '@/api/types';
import { HobbyTag } from '@/components/HobbyTag';
import { MbtiAvatar } from '@/components/MbtiAvatar';
import { colors, rankColor } from '@/theme';
import { RANK_LABELS, type Rank } from '@/types';

const RANKS: Rank[] = ['S', 'A', 'B', 'C'];

function MatchCard({ person }: { person: ApiPerson }) {
  const router = useRouter();
  const venue = useVenueSummary(person.venueId);

  return (
    <Pressable style={styles.card} onPress={() => router.push(`/person/${person.userId}`)}>
      <MbtiAvatar type={person.mbti} size={56} rank={person.compat.rank} />
      <View style={styles.cardBody}>
        <View style={styles.nameRow}>
          <Text style={styles.name}>{person.mbti}</Text>
          <Text style={styles.age}>・{person.ageBand}</Text>
        </View>
        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={13} color={colors.teal} />
          <Text style={styles.location}>
            {venue ? `${venue.name}にいます` : '近くを歩いています'}
          </Text>
        </View>
        <View style={styles.tags}>
          {person.hobbies.slice(0, 2).map((h) => (
            <HobbyTag key={h} label={h} />
          ))}
        </View>
      </View>
      <Pressable
        style={[styles.likeButton, person.liked && styles.likeButtonActive]}
        onPress={() => void api.sendLike(person.userId)}
      >
        <Ionicons name={person.liked ? 'heart' : 'heart-outline'} size={22} color={colors.coral} />
      </Pressable>
    </Pressable>
  );
}

export default function MatchesScreen() {
  useMatchesPolling();
  const matches = useMatchesList();

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>あなたと相性がいい人</Text>
        <Text style={styles.subtitle}>国分町エリア内・上位3人を表示しています</Text>

        <View style={styles.legend}>
          {RANKS.map((r) => (
            <View key={r} style={styles.legendChip}>
              <View style={[styles.legendDot, { backgroundColor: rankColor(r) }]} />
              <Text style={styles.legendText}>
                {r} {RANK_LABELS[r]}
              </Text>
            </View>
          ))}
        </View>

        {matches.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="people-outline" size={44} color={colors.gray} />
            <Text style={styles.emptyText}>いまエリア内に相手がいません</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {matches.map((m) => (
              <MatchCard key={m.userId} person={m} />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  body: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 24 },
  title: { color: colors.text, fontSize: 26, fontWeight: '800' },
  subtitle: { color: colors.textDim, fontSize: 13, marginTop: 6 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 18 },
  legendChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderColor: colors.cardBorder,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { color: colors.textDim, fontSize: 12 },
  empty: { alignItems: 'center', gap: 12, marginTop: 80 },
  emptyText: { color: colors.textDim, fontSize: 14 },
  list: { gap: 14, marginTop: 22 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.card,
    borderColor: colors.cardBorder,
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
  },
  cardBody: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'baseline' },
  name: { color: colors.text, fontSize: 18, fontWeight: '800' },
  age: { color: colors.textDim, fontSize: 13 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  location: { color: colors.teal, fontSize: 13 },
  tags: { flexDirection: 'row', gap: 6, marginTop: 8 },
  likeButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderColor: colors.cardBorder,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  likeButtonActive: { borderColor: colors.coral, backgroundColor: colors.coralDark },
});
