import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { api, useDraft } from '@/api/client';
import { OnboardingFrame } from '@/components/onboarding/OnboardingFrame';
import { colors } from '@/theme';
import { HOBBIES } from '@/types';

export default function HobbiesScreen() {
  const router = useRouter();
  const draft = useDraft();

  return (
    <OnboardingFrame
      step={2}
      title="趣味を選んでください"
      description="気になる話題から会話が広がります。3〜6個くらいがおすすめです。"
      showBack
      ctaLabel="次へ"
      ctaDisabled={draft.hobbies.length === 0}
      onCta={() => router.push('/onboarding/mbti')}
    >
      <View style={styles.grid}>
        {HOBBIES.map((hobby) => {
          const selected = draft.hobbies.includes(hobby);
          return (
            <Pressable
              key={hobby}
              onPress={() => api.toggleDraftHobby(hobby)}
              style={[styles.chip, selected && styles.chipSelected]}
            >
              <Text style={[styles.chipLabel, selected && styles.chipLabelSelected]}>{hobby}</Text>
            </Pressable>
          );
        })}
      </View>
      <Text style={styles.counter}>
        <Text style={styles.counterNum}>{draft.hobbies.length}</Text> / 10 選択中
      </Text>
    </OnboardingFrame>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 14,
  },
  chip: {
    width: '47%',
    backgroundColor: colors.card,
    borderColor: colors.cardBorder,
    borderWidth: 1.5,
    borderRadius: 28,
    paddingVertical: 20,
    alignItems: 'center',
  },
  chipSelected: {
    backgroundColor: colors.tealDark,
    borderColor: colors.teal,
  },
  chipLabel: { color: colors.text, fontSize: 15, fontWeight: '600' },
  chipLabelSelected: { color: colors.teal },
  counter: { color: colors.textDim, textAlign: 'center', marginTop: 24, fontSize: 14 },
  counterNum: { color: colors.text, fontWeight: '700' },
});
