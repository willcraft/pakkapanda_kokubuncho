import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { api, useDraft } from '@/api/client';
import { OnboardingFrame } from '@/components/onboarding/OnboardingFrame';
import { colors } from '@/theme';
import { AGE_BANDS } from '@/types';

export default function AgeScreen() {
  const router = useRouter();
  const draft = useDraft();

  return (
    <OnboardingFrame
      step={1}
      title="年代を選んでください"
      description="近くにいる相性のいい人を探すために使います。年代はプロフィールに公開されます。"
      ctaLabel="次へ"
      ctaDisabled={!draft.ageBand}
      onCta={() => router.push('/onboarding/hobbies')}
    >
      <View style={styles.list}>
        {AGE_BANDS.map((band) => {
          const selected = draft.ageBand === band;
          return (
            <Pressable
              key={band}
              onPress={() => api.setDraftAge(band)}
              style={[styles.row, selected && styles.rowSelected]}
            >
              <Text style={styles.rowLabel}>{band}</Text>
              <View style={[styles.radio, selected && styles.radioSelected]}>
                {selected && <View style={styles.radioDot} />}
              </View>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.notice}>
        <Ionicons name="warning-outline" size={16} color={colors.yellow} />
        <Text style={styles.noticeText}>
          国分町エリアはお酒を提供する店舗が中心のため、ご利用は20歳以上の方に限らせていただいています。
        </Text>
      </View>
    </OnboardingFrame>
  );
}

const styles = StyleSheet.create({
  list: { gap: 12 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderColor: colors.cardBorder,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  rowSelected: {
    backgroundColor: colors.coralDark,
    borderColor: colors.coral,
  },
  rowLabel: { color: colors.text, fontSize: 16, fontWeight: '600' },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.gray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: { borderColor: colors.coral },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.coral },
  notice: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 24,
    backgroundColor: colors.card,
    borderColor: colors.cardBorder,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
  },
  noticeText: { flex: 1, color: colors.textDim, fontSize: 12, lineHeight: 19 },
});
