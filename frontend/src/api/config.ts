// APIのベースURL。
// 実機で試す場合は `EXPO_PUBLIC_API_URL=http://<MacのLAN IP>:8787 npm start` のように
// 環境変数で差し替えるか、デプロイ済みの workers.dev URL を設定する。
export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8787';
