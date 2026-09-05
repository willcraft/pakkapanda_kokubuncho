import { StyleSheet, Text, View } from 'react-native';

import { RankBadge } from '@/components/RankBadge';
import { mbtiColor } from '@/theme';
import type { MbtiType, Rank } from '@/types';

interface Props {
  type: MbtiType;
  size?: number;
  rank?: Rank;
}

export function MbtiAvatar({ type, size = 56, rank }: Props) {
  const fontSize = Math.max(10, size * 0.24);
  return (
    <View style={{ width: size, height: size }}>
      <View
        style={[
          styles.circle,
          { width: size, height: size, borderRadius: size / 2, backgroundColor: mbtiColor(type) },
        ]}
      >
        <Text style={[styles.label, { fontSize }]}>{type}</Text>
      </View>
      {rank && (
        <View style={styles.badge}>
          <RankBadge rank={rank} size={Math.max(18, size * 0.32)} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    color: '#FFFFFF',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
  },
});
