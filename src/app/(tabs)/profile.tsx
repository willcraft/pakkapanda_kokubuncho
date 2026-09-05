import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useMyCheckin, useMyProfile } from '@/api/client';
import { HobbyTag } from '@/components/HobbyTag';
import { MbtiAvatar } from '@/components/MbtiAvatar';
import { PERSONALITY } from '@/data/personality';
import { colors } from '@/theme';

export default function ProfileScreen() {
  const router = useRouter();
  const profile = useMyProfile();
  const { venue } = useMyCheckin();

  if (!profile) return null;

  const personality = PERSONALITY[profile.mbti];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>プロフィール</Text>

        <View style={styles.heroCard}>
          <MbtiAvatar type={profile.mbti} size={96} />
          <Text style={styles.mbti}>{profile.mbti}</Text>
          <Text style={styles.personalityTitle}>「{personality.title}」</Text>
          <Text style={styles.personalityText}>{personality.text}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>年代</Text>
          <Text style={styles.cardValue}>{profile.ageBand}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>趣味</Text>
          <View style={styles.tags}>
            {profile.hobbies.map((h) => (
              <HobbyTag key={h} label={h} />
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>チェックイン中の店舗</Text>
          {venue ? (
            <View style={styles.venueRow}>
              <Ionicons name="location" size={15} color={colors.coral} />
              <Text style={styles.cardValue}>{venue.name}</Text>
            </View>
          ) : (
            <Text style={styles.cardValueDim}>チェックインしていません</Text>
          )}
        </View>

        <Pressable style={styles.editButton} onPress={() => router.push('/onboarding/age')}>
          <Ionicons name="create-outline" size={17} color={colors.text} />
          <Text style={styles.editButtonText}>プロフィールを編集</Text>
        </Pressable>

        <Text style={styles.notice}>
          ニックネームや性別は登録されません。あなたはMBTIタイプのアイコンとして表示されます。
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  body: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 24 },
  title: { color: colors.text, fontSize: 26, fontWeight: '800' },
  heroCard: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 24,
    marginTop: 20,
  },
  mbti: { color: colors.text, fontSize: 24, fontWeight: '800', marginTop: 14 },
  personalityTitle: { color: colors.teal, fontSize: 14, fontWeight: '700', marginTop: 4 },
  personalityText: {
    color: colors.textDim,
    fontSize: 13,
    lineHeight: 21,
    textAlign: 'center',
    marginTop: 10,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
  },
  cardLabel: { color: colors.textDim, fontSize: 12 },
  cardValue: { color: colors.text, fontSize: 16, fontWeight: '600', marginTop: 6 },
  cardValueDim: { color: colors.textDim, fontSize: 14, marginTop: 6 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  venueRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderColor: colors.cardBorder,
    borderWidth: 1,
    borderRadius: 28,
    paddingVertical: 14,
    marginTop: 20,
  },
  editButtonText: { color: colors.text, fontSize: 15, fontWeight: '600' },
  notice: { color: colors.textDim, fontSize: 11, lineHeight: 18, textAlign: 'center', marginTop: 18 },
});
