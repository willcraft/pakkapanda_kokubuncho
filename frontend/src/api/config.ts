// APIのベースURL。
// 実機で試す場合は `EXPO_PUBLIC_API_URL=http://<MacのLAN IP>:8787 npm start` のように
// 環境変数で差し替えるか、デプロイ済みの workers.dev URL を設定する。

/** スキーム省略(例: 192.168.1.4:8787)や末尾スラッシュを補正する */
export function normalizeApiUrl(raw: string): string {
  const withScheme = /^https?:\/\//.test(raw) ? raw : `http://${raw}`;
  return withScheme.replace(/\/+$/, '');
}

export const API_URL = normalizeApiUrl(process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8787');
