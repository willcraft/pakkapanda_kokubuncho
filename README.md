# 夜あわせ

仙台・国分町エリア限定の位置情報×MBTIマッチングアプリ。
アプリは React Native (Expo) 製モック、バックエンドは Cloudflare Workers + Hono + D1。
仕様は [docs/仕様書.md](docs/仕様書.md)(アプリ)と
[docs/バックエンド仕様書.md](docs/バックエンド仕様書.md)(API)を参照。

## アプリ(モック)の起動

```bash
npm install
npm start          # Expo Dev Server 起動 → Expo Go で読み取り
```

iOSシミュレータ: `npm run ios` / Android: `npm run android`

## バックエンド

```bash
cd backend
npm install
npm run dev        # wrangler dev(ローカルD1で起動)
npm test           # APIテスト(vitest + Workers実環境相当)
```

デプロイ:

```bash
cd backend
npx wrangler d1 create yoawase        # 初回のみ。発行されたIDを wrangler.toml に設定
npx wrangler d1 migrations apply yoawase --remote
npm run deploy
```

## 検証

```bash
npm test              # アプリ: 相性ロジック・店舗集計・ストア
npm run typecheck     # アプリ: 型チェック
npm run test:backend  # バックエンド: APIテスト
```

## 構成

```
src/
  app/            # 画面(expo-router)
    onboarding/   # 年代→趣味→MBTI の登録3ステップ
    (tabs)/       # マップ / マッチ / チャット / プロフィール
    venue/[id]    # 店舗詳細(チェックイン)
    person/[id]   # 相手プロフィール詳細
    chat/[id]     # トーク画面
  api/            # データ入口(backend/ の REST に差し替える層)
  store/          # zustand ストア(メモリ内・永続化なし)
  logic/          # 相性スコア・店舗集計(純粋関数)
  data/           # シードデータ・MBTI性格テキスト・地図スタイル
  components/     # 共通UI
```

## モックの前提

- バックエンドなし。データは静的シード+アプリ内メモリ(再起動で消える)
- 位置情報は固定(国分町エリア内にいる想定)
- チャットの相手の返信はダミー自動返信
