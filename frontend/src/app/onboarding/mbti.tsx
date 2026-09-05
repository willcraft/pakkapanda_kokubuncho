import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { api, useDraft } from '@/api/client';
import { OnboardingFrame } from '@/components/onboarding/OnboardingFrame';
import { colors } from '@/theme';
import { MBTI_TYPES } from '@/types';

export default function MbtiScreen() {
  const router = useRouter();
  const draft = useDraft();

  return (
    <OnboardingFrame
      step={3}
      title="あなたのMBTIタイプは?"
      description={
        '相性のいい人を探すために使います。性別は表示されません。\n診断がまだの方は、外部の診断サイトで調べてから選んでください。'
      }
      showBack
      ctaLabel="プロフィールを完成する"
      ctaDisabled={!draft.mbti}
      onCta={() => {
        api.completeProfile();
        router.replace('/(tabs)');
      }}
    >
      <View style={styles.grid}>
        {MBTI_TYPES.map((type) => {
          const selected = draft.mbti === type;
          return (
            <Pressable
              key={type}
              onPress={() => api.setDraftMbti(type)}
              style={[styles.cell, selected && styles.cellSelected]}
            >
              <Text style={[styles.cellLabel, selected && styles.cellLabelSelected]}>{type}</Text>
            </Pressable>
          );
        })}
      </View>
    </OnboardingFrame>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  cell: {
    width: '22.7%',
    backgroundColor: colors.card,
    borderColor: colors.cardBorder,
    borderWidth: 1.5,
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
  },
  cellSelected: {
    backgroundColor: colors.coralDark,
    borderColor: colors.coral,
  },
  cellLabel: { color: colors.text, fontSize: 14, fontWeight: '700', letterSpacing: 0.5 },
  cellLabelSelected: { color: colors.coral },
});
