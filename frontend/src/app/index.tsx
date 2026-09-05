import { Redirect } from 'expo-router';

import { useMyProfile } from '@/api/client';

export default function Index() {
  const profile = useMyProfile();
  return profile ? <Redirect href="/(tabs)" /> : <Redirect href="/onboarding/age" />;
}
