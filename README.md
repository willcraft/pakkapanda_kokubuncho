# 夜あわせ

仙台・国分町エリア限定の位置情報×MBTIマッチングアプリ。
仕様は [docs/仕様書.md](docs/仕様書.md)(アプリ)と
[docs/バックエンド仕様書.md](docs/バックエンド仕様書.md)(API)を参照。

## 構成(モノレポ)

```
frontend/   # React Native (Expo) アプリ
backend/    # Cloudflare Workers + Hono + D1 API
shared/     # 両方で使うドメイン型・相性計算ロジック
docs/       # 仕様書
```

## 開発の始め方

ターミナル1: APIサーバー

```bash
cd backend
npm install
npx wrangler d1 migrations apply yoawase --local   # 初回のみ
npm run dev                                        # http://localhost:8787
```

ターミナル2: アプリ

```bash
cd frontend
npm install
npm start          # Expo Dev Server → Expo Go / シミュレータ
```

- APIの接続先は既定で `http://localhost:8787`(iOSシミュレータ・webはそのままでOK)
- **実機(Expo Go)で試す場合**は localhost に届かないため、
  `EXPO_PUBLIC_API_URL=http://<MacのLAN IP>:8787 npm start` で起動するか、
  デプロイ済みの workers.dev URL を指定する
- 位置情報はモックとして国分町中心の固定座標を送信する(実GPSは未実装)

## デプロイ(バックエンド)

```bash
cd backend
npx wrangler d1 migrations apply yoawase --remote  # 適用済み
npm run deploy                                     # workers.dev に公開
```

デプロイ後はアプリを `EXPO_PUBLIC_API_URL=https://yoawase-api.<account>.workers.dev` で起動する。

## 検証

```bash
npm run test:frontend   # ロジック・ストアのユニットテスト
npm run test:backend    # APIテスト(Workers実環境相当+ローカルD1)
npm run typecheck       # 両方の型チェック
```
