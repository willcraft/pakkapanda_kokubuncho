import { StyleSheet, Text, View } from 'react-native';

import { colors, rankColor } from '@/theme';
import type { Rank } from '@/types';

interface Props {
  rank: Rank;
  size?: number;
}

export function RankBadge({ rank, size = 20 }: Props) {
  return (
    <View
      style={[
        styles.badge,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: rankColor(rank) },
      ]}
    >
      <Text style={[styles.label, { fontSize: size * 0.55 }]}>{rank}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.bg,
  },
  label: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
});
