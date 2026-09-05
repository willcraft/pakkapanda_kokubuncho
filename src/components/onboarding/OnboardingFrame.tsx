import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/PrimaryButton';
import { colors } from '@/theme';

interface Props {
  step: 1 | 2 | 3;
  title: string;
  description: string;
  showBack?: boolean;
  ctaLabel: string;
  ctaDisabled?: boolean;
  onCta: () => void;
  children: ReactNode;
}

export function OnboardingFrame({
  step,
  title,
  description,
  showBack,
  ctaLabel,
  ctaDisabled,
  onCta,
  children,
}: Props) {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        {showBack ? (
          <Pressable style={styles.back} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={20} color={colors.text} />
          </Pressable>
        ) : (
          <View style={styles.back} />
        )}
        <View style={styles.stepChip}>
          <Text style={styles.stepText}>STEP {step} / 3</Text>
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
        {children}
      </ScrollView>
      <View style={styles.footer}>
        <PrimaryButton label={ctaLabel} onPress={onCta} disabled={ctaDisabled} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  back: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepChip: {
    borderColor: colors.cardBorder,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  stepText: { color: colors.textDim, fontSize: 12, fontWeight: '600', letterSpacing: 1 },
  body: { paddingHorizontal: 20, paddingTop: 32, paddingBottom: 24 },
  title: { color: colors.text, fontSize: 26, fontWeight: '800', marginBottom: 10 },
  description: { color: colors.textDim, fontSize: 14, lineHeight: 22, marginBottom: 28 },
  footer: { paddingHorizontal: 20, paddingBottom: 12 },
});
