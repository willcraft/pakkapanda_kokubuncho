import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { useBootstrap } from '@/api/client';
import { colors } from '@/theme';

export default function RootLayout() {
  useBootstrap();
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bg },
        }}
      />
    </>
  );
}
