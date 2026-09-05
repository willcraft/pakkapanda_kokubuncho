import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { useAuthLoaded, useMyProfile } from '@/api/client';
import { colors } from '@/theme';

export default function Index() {
  const authLoaded = useAuthLoaded();
  const profile = useMyProfile();

  if (!authLoaded) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator color={colors.coral} />
      </View>
    );
  }
  return profile ? <Redirect href="/(tabs)" /> : <Redirect href="/onboarding/age" />;
}
