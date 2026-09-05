import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

import { useBadgePolling, useHeartbeat, useReceivedLikes, useUnreadCount } from '@/api/client';
import { colors } from '@/theme';

export default function TabLayout() {
  useHeartbeat();
  useBadgePolling();
  const unread = useUnreadCount();
  const receivedLikes = useReceivedLikes().length;
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.coral,
        tabBarInactiveTintColor: colors.textDim,
        tabBarStyle: {
          backgroundColor: colors.bg,
          borderTopColor: colors.cardBorder,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'マップ',
          tabBarIcon: ({ color, size }) => <Ionicons name="map-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="matches"
        options={{
          title: 'マッチ',
          tabBarBadge: receivedLikes > 0 ? receivedLikes : undefined,
          tabBarBadgeStyle: { backgroundColor: colors.coral, color: '#1A0E10', fontWeight: '700' },
          tabBarIcon: ({ color, size }) => <Ionicons name="heart-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="chats"
        options={{
          title: 'チャット',
          tabBarBadge: unread > 0 ? unread : undefined,
          tabBarBadgeStyle: { backgroundColor: colors.coral, color: '#1A0E10', fontWeight: '700' },
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubble-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'プロフィール',
          tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
