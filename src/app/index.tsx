import { Redirect } from 'expo-router';

// プロフィール未登録ならオンボーディングへ。登録済みはタブへ。
// ゲート本体は onboarding 完了時の遷移と (tabs) 側で担保する(モックのため常に初回はオンボーディング)。
export default function Index() {
  return <Redirect href="/onboarding/age" />;
}
