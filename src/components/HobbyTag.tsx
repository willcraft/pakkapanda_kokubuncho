import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/theme';

export function HobbyTag({ label }: { label: string }) {
  return (
    <View style={styles.tag}>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tag: {
    backgroundColor: colors.card,
    borderColor: colors.cardBorder,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  label: {
    color: colors.text,
    fontSize: 12,
  },
});
