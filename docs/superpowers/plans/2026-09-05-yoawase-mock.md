# 夜あわせ Expoモック Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** docs/仕様書.md に定義した「夜あわせ」(国分町限定・MBTIマッチング)のインタラクティブモックをExpoで実装する。

**Architecture:** expo-router によるファイルベースルーティング(オンボーディング → 4タブ + 詳細スタック)。純粋関数の相性ロジック(`src/logic/`)と静的シード(`src/data/`)を zustand ストア(`src/store/`)が束ね、画面は `src/api/` クライアント層経由でのみデータに触れる(将来 Node.js+Hono に差し替え)。地図は react-native-maps。

**Tech Stack:** Expo SDK(最新)+ TypeScript, expo-router, react-native-maps, zustand, vitest(純ロジックのみテスト)

**Spec:** docs/仕様書.md

## Global Constraints

- 表示テキストはすべて日本語、仕様書・PDFの文言に合わせる(例: 「S 運命級」「どちらかが『いいね』を送るとチャットができるようになります」)
- ダークテーマ固定: 背景 #0B0E14 / アクセント コーラル #F87171・ティール #2DD4BF
- ニックネーム・性別・写真は扱わない。ユーザー表現はMBTI円形バッジのみ
- 相性ランクは基礎スコアのみで決定(85/70/50境界)。趣味ボーナスは並び順と%表示のみに影響
- バックエンドなし。永続化なし(メモリ内)。位置情報は固定(国分町内想定)
- 画面は `src/api/client.ts` の関数のみからデータ取得・更新(ストア直接importしない)

---

### Task 1: Expoプロジェクト scaffold

**Files:**
- Create: Expoテンプレート一式(`app/`, `package.json`, `tsconfig.json`, `app.json` 等)

**Steps:**
- [ ] `npx create-expo-app@latest . --template default --yes`(既存 .git/docs はそのまま)
- [ ] `npx expo install react-native-maps` / `npm i zustand` / `npm i -D vitest`
- [ ] `app.json`: `"userInterfaceStyle": "dark"`, name/slug を「夜あわせ」/ `yoawase` に
- [ ] `package.json` scripts に `"test": "vitest run"`, `"typecheck": "tsc --noEmit"` 追加
- [ ] テンプレートのサンプル画面(app/(tabs)配下の example コンテンツ, components のサンプル)を削除し空タブ4つに置き換え(次タスク以降で実装)
- [ ] `npm run typecheck` が通ることを確認
- [ ] Commit: `chore: scaffold expo app (expo-router, maps, zustand, vitest)`

### Task 2: ドメイン型とテーマ

**Files:**
- Create: `src/types.ts`, `src/theme.ts`

**Produces(以降の全タスクが使用):**

```ts
// src/types.ts
export const MBTI_TYPES = ['ISTJ','ISFJ','INFJ','INTJ','ISTP','ISFP','INFP','INTP',
  'ESTP','ESFP','ENFP','ENTP','ESTJ','ESFJ','ENFJ','ENTJ'] as const
export type MbtiType = typeof MBTI_TYPES[number]
export const AGE_BANDS = ['20代前半','20代後半','30代','40代','50代以上'] as const
export type AgeBand = typeof AGE_BANDS[number]
export const HOBBIES = ['映画','音楽','カフェ巡り','スポーツ観戦','旅行','ゲーム','アウトドア','読書','グルメ','アート'] as const
export type Hobby = typeof HOBBIES[number]
export type Rank = 'S' | 'A' | 'B' | 'C'
export interface Profile { ageBand: AgeBand; hobbies: Hobby[]; mbti: MbtiType }
export interface Coord { latitude: number; longitude: number }
export interface Person { id: string; mbti: MbtiType; ageBand: AgeBand; hobbies: Hobby[];
  venueId: string | null; checkedInAt?: number; coord: Coord }
export type VenueCategory = 'バー' | '居酒屋' | 'カフェ' | 'ラウンジ'
export interface Venue { id: string; name: string; category: VenueCategory; coord: Coord; distanceM: number }
export interface ChatMessage { id: string; personId: string; from: 'me'|'them'|'system'; text: string; at: number }
```

```ts
// src/theme.ts
export const colors = {
  bg: '#0B0E14', card: '#161B26', cardBorder: '#232B3A',
  text: '#F1F5F9', textDim: '#94A3B8',
  coral: '#F87171', teal: '#2DD4BF', yellow: '#FACC15', gray: '#64748B',
}
// MBTIグループ色: NT=ティール系 #0F766E / NF=レッドブラウン #8C3B44 / SJ=ブルー #1D4ED8系 #274F8C / SP=パープル #6D5BA6
export function mbtiColor(t: MbtiType): string
export function rankColor(r: Rank): string  // S=coral A=teal B=yellow C=gray
```

**Steps:**
- [ ] 上記2ファイルを実装(`mbtiColor` は2文字目N/Sと3文字目T/Fで4グループ判定)
- [ ] `npm run typecheck` → PASS
- [ ] Commit: `feat: domain types and dark theme tokens`

### Task 3: 相性ロジック(TDD)

**Files:**
- Create: `src/logic/compatibility.ts`, `src/logic/compatibility.test.ts`

**Produces:**

```ts
export function baseScore(a: MbtiType, b: MbtiType): number   // 50 ±各軸(仕様書4.4)
export function rankOf(base: number): Rank                     // 85/70/50境界
export function hobbyBonus(a: Hobby[], b: Hobby[]): number     // 共通×3, max 9
export function totalScore(me: Profile, p: Person): number     // min(100, base+bonus)
export interface Compat { base: number; total: number; rank: Rank }
export function compat(me: Profile, p: Person): Compat
```

**Steps:**
- [ ] 失敗するテストを書く: `INFJ×ENFP baseScore=96 / rank S`、`INFJ×ISTJ = 50-16+2+2+0=38 / rank C`、`INFJ×ESTP = 50-16+12+6+0=52 / rank B`、`INFJ×INTJ = 78 / rank A`、対称性 `baseScore(a,b)===baseScore(b,a)`、`hobbyBonus(['映画','旅行'],['映画','旅行','音楽'])===6`、bonus上限9、`total` は100上限、rankはbaseのみ依存(bonusで境界を跨がない)
- [ ] `npm test` → FAIL 確認
- [ ] 実装(仕様書4.4の式そのまま)
- [ ] `npm test` → PASS
- [ ] Commit: `feat: MBTI compatibility scoring (S/A/B/C)`

### Task 4: シードデータ・性格テキスト・店舗集計(TDD)

**Files:**
- Create: `src/data/seed.ts`, `src/data/personality.ts`, `src/logic/venueStats.ts`, `src/logic/venueStats.test.ts`

**Produces:**

```ts
// seed.ts — 国分町中心 38.2610,140.8722 周辺 ±0.0015
export const VENUES: Venue[]   // 5件: BAR CIELO(バー,120m), 炉ばた一期(居酒屋), Lounge NOIR(ラウンジ), Cafe Luna(カフェ), 立ち呑みハチ(居酒屋)
export const PEOPLE: Person[]  // 12人: BAR CIELOに6人(ENFP30代[映画,旅行,グルメ], ISFP20代前半[カフェ巡り,音楽] 含む), Lounge NOIRにINTJ20代後半[アート,読書]ほか2人, 残りは venueId:null で路上に配置。checkedInAt は「n分前」表示が出る相対値(Date.now()-n*60_000)を生成関数で付与
// personality.ts
export const PERSONALITY: Record<MbtiType, { title: string; text: string }> // 16タイプの日本語解説(各1〜2文)
export function pairReason(me: MbtiType, them: MbtiType): string // 軸の一致/補完から相性理由文を組み立て
// venueStats.ts
export function venueMembers(people: Person[], venueId: string): Person[]        // checkedInAt降順ではなく古い順不問→チェックイン時刻昇順
export function venueCompatPct(me: Profile, members: Person[]): number | null    // totalScore平均を四捨五入。0人ならnull
export function venueMbtiCharacter(members: Person[]): MbtiType | null           // 最頻タイプ。同数はタイプ名昇順で先勝ち。0人null
```

**Steps:**
- [ ] venueStats のテストを書く(空配列→null / 最頻判定 / 同数タイブレーク / %平均の丸め)→ FAIL確認
- [ ] venueStats 実装 → PASS
- [ ] seed.ts / personality.ts を実装(16タイプ全部に日本語テキスト。pairReason は N/S一致・E/I補完・J/P補完・T/F一致の該当項目から2文生成)
- [ ] `npm test && npm run typecheck` → PASS
- [ ] Commit: `feat: seed data, personality texts, venue stats`

### Task 5: zustandストア + APIクライアント層

**Files:**
- Create: `src/store/useAppStore.ts`, `src/api/client.ts`, `src/store/store.test.ts`

**Produces:**

```ts
// useAppStore.ts — 内部実装。画面からは import しない
interface AppState {
  profile: Profile | null
  draft: { ageBand?: AgeBand; hobbies: Hobby[]; mbti?: MbtiType }
  people: Person[]; venues: Venue[]
  myVenueId: string | null; myCheckedInAt: number | null
  likedIds: string[]
  chats: Record<string, ChatMessage[]>
  // actions: setDraftAge/toggleDraftHobby/setDraftMbti/completeProfile/
  //          checkIn(venueId)/checkOut()/sendLike(personId)/sendMessage(personId,text)/receiveReply(personId)
}
// api/client.ts — 画面が使う唯一の入口(将来Hono REST化)。zustandフックの薄いラッパー
export const useVenues = () => Venue[]
export const usePeople = () => Person[]
export const useMyProfile = () => Profile | null
export const useMyCheckin = () => { venue: Venue | null; at: number | null }
export const useMatches = () => Array<{ person: Person; compat: Compat }>  // total降順 TOP3
export const useChats = () => Array<{ person: Person; last: ChatMessage }>
export const useChatMessages = (personId: string) => ChatMessage[]
export const useIsLiked = (personId: string) => boolean
export const api = { setDraftAge, toggleDraftHobby, setDraftMbti, completeProfile,
  checkIn, checkOut, sendLike, sendMessage }
```

挙動:
- `checkIn(venueId)`: `myVenueId` 差し替え(前の店は自動解除)。`myCheckedInAt = Date.now()`
- `sendLike(personId)`: likedIds 追加 + `chats[personId]` を system メッセージ「いいねが届いたので、チャットができるようになりました」で初期化(既存なら何もしない)
- `sendMessage`: me メッセージ追加後、1.5秒後に `receiveReply` で定型文(配列を順繰り: 「いいですね!」「今度ぜひ話しましょう」等5種)を追加
- `useMatches`: profile 未登録時は空。venueId有無に関わらずエリア内全員が対象

**Steps:**
- [ ] ストアのテスト(vitest, フックでなくstore APIを直接): checkInで店が切り替わる / sendLikeでsystemメッセージ生成・二重likeで増えない / sendMessageでmeが積まれる → FAIL確認
- [ ] ストア+クライアント層を実装 → `npm test` PASS
- [ ] Commit: `feat: app store and api client layer`

### Task 6: 共通コンポーネント

**Files:**
- Create: `components/MbtiAvatar.tsx`(size/type/rank? → 円形+タイプ名+右上ランクバッジ), `components/RankBadge.tsx`, `components/HobbyTag.tsx`, `components/PrimaryButton.tsx`(コーラル角丸大ボタン)

**Steps:**
- [ ] 4コンポーネント実装(theme.tsのトークン使用)
- [ ] `npm run typecheck` → PASS / Commit: `feat: shared UI components`

### Task 7: オンボーディング3画面 + ルートゲート

**Files:**
- Create: `app/onboarding/age.tsx`, `app/onboarding/hobbies.tsx`, `app/onboarding/mbti.tsx`, `app/onboarding/_layout.tsx`
- Modify: `app/_layout.tsx`(profile===null なら /onboarding/age へリダイレクト)

**Steps(PDF ①②③準拠):**
- [ ] age: 「STEP 1 / 3」チップ、見出し「年代を選んでください」、説明文、ラジオカード5つ(選択時コーラル枠)、20歳以上注意カード、「次へ」(未選択時disabled)
- [ ] hobbies: 「STEP 2 / 3」、戻るボタン、見出し「趣味を選んでください」、2列チップ10個(選択時ティール枠)、「n / 10 選択中」、「次へ」(0個時disabled)
- [ ] mbti: 「STEP 3 / 3」、見出し「あなたのMBTIタイプは?」、説明2文(性別非表示・外部診断案内)、4×4グリッド、「プロフィールを完成する」→ `api.completeProfile()` → `/(tabs)` へ replace
- [ ] typecheck PASS / Commit: `feat: onboarding (age, hobbies, mbti)`

### Task 8: タブレイアウト + マップ画面

**Files:**
- Modify: `app/(tabs)/_layout.tsx`(マップ/マッチ/チャット/プロフィール、アクティブ=コーラル、Ionicons: map/heart/chatbubble/person)
- Create: `app/(tabs)/index.tsx`(マップ)

**Steps(PDF ホーム・マップ準拠):**
- [ ] MapView: initialRegion 国分町(38.2610, 140.8722, delta 0.004)。Android向け customMapStyle にダークJSON、iOSはOS darkに任せる
- [ ] エリア境界: `Circle`(半径約250m, 破線不可のため strokeColor teal/半透明fill)
- [ ] 店舗Marker: 角丸四角(コーラル)+カップアイコン+人数バッジ、店舗MBTIキャラがあれば略称表示 → タップで `/venue/[id]`
- [ ] 人Marker(venueId===nullの人): MbtiAvatar小 → タップで `/person/[id]`
- [ ] ヘッダーオーバーレイ: 「夜」ロゴ+「夜あわせ」+「国分町エリア」バッジ
- [ ] チェックイン中カード: 「チェックイン中 / {店名}」(未チェックイン時「チェックインしていません / お店を選んでチェックイン」)+「エリア外・利用不可」チップ
- [ ] 下部バナー: TOP3のミニアイコン3つ+「近くに相性がいい人 {n}人 / タップして見てみる」→ マッチタブへ
- [ ] typecheck PASS / Commit: `feat: tab layout and map home`

### Task 9: 店舗詳細(チェックイン)

**Files:**
- Create: `app/venue/[id].tsx`(モーダル風スタック画面)

**Steps(PDF 店舗チェックイン準拠):**
- [ ] ヘッダー: 戻る / 店名 / カテゴリタグ / 「国分町エリア内・{distanceM}m」/ チェックイン中なら「● チェックイン中」バッジ
- [ ] 相性リング: SVGでなくborderベースの簡易リング(円形Viewの中央に「{pct}%」)+見出し「このお店との相性 {pct}%」+説明文(仕様書4.5の文言)。0人時は「まだ誰もいません」表示
- [ ] 店舗MBTIキャラ行: 「この店はいま {TYPE} な夜」(venueMbtiCharacter, 0人時非表示)
- [ ] 「いまお店にいる人・{n}人」: 上位3人(MbtiAvatar/年代・趣味/「{m}分前にチェックイン」/ランクバッジ)+「ほか{n-3}人がチェックイン中」。行タップで `/person/[id]`
- [ ] フッター: 未チェックイン→PrimaryButton「この店にチェックインする」/ チェックイン中→リンク「チェックインを解除する」
- [ ] typecheck PASS / Commit: `feat: venue detail with check-in`

### Task 10: マッチ一覧

**Files:**
- Create: `app/(tabs)/matches.tsx`

**Steps(PDF マッチ一覧(TOP3)準拠):**
- [ ] 見出し「あなたと相性がいい人」/サブ「国分町エリア内・上位3人を表示しています」
- [ ] 凡例チップ4つ(●色+「S 運命級」「A 好相性」「B 普通」「C 微妙」)
- [ ] `useMatches()` のカード×3: MbtiAvatar(ランクバッジ付)/「{MBTI}・{年代}」/位置行(venueあり→「{店名}にいます」ティール色・なし→「近くを歩いています」)/趣味タグ2個/右にハートボタン(liked時は塗りつぶし)
- [ ] カードタップ→ `/person/[id]`、ハート→ `api.sendLike`
- [ ] typecheck PASS / Commit: `feat: matches top3 list`

### Task 11: 相手プロフィール詳細

**Files:**
- Create: `app/person/[id].tsx`

**Steps(PDF プロフィール詳細+性格解説準拠):**
- [ ] 上部ヒーロー: 大MbtiAvatar(タイプ色のグロー背景)/右上「{R} 相性:{運命級|好相性|普通|微妙}」バッジ
- [ ] 本体: タイプ名・年代 / 「{店名}にチェックイン中」(venueなし→「国分町エリアを歩いています」)/ 趣味タグ全部
- [ ] 性格解説カード: PERSONALITY[type].title + text
- [ ] 相性の理由カード: pairReason(自分, 相手)
- [ ] 注意書き「プロフィールは国分町エリア内にいる間だけ表示されます。性別は表示されません。」
- [ ] フッター: PrimaryButton「♡ いいねを送る」(liked後は「チャットを開く」に変化して `/chat/[id]` へ)+キャプション「どちらかが『いいね』を送るとチャットができるようになります」
- [ ] typecheck PASS / Commit: `feat: person profile detail`

### Task 12: チャット一覧 + トーク画面

**Files:**
- Create: `app/(tabs)/chats.tsx`, `app/chat/[id].tsx`

**Steps(PDF チャット準拠):**
- [ ] 一覧: `useChats()` を行表示(MbtiAvatar/タイプ名/最終メッセージ/時刻)。空時「いいねを送るとチャットができます」
- [ ] トーク: ヘッダー(戻る/MbtiAvatar/タイプ名/「相性 {R}・{店名}」ティール)。systemは中央グレー角丸、themは左グレー、meは右コーラル。各吹き出し下に HH:mm
- [ ] 入力欄「メッセージを入力」+円形送信ボタン(コーラル)。送信で `api.sendMessage` → 1.5秒後自動返信が届く(KeyboardAvoidingView対応)
- [ ] typecheck PASS / Commit: `feat: chat list and room`

### Task 13: 自分プロフィールタブ + 仕上げ検証

**Files:**
- Create: `app/(tabs)/profile.tsx`

**Steps:**
- [ ] 自分の MbtiAvatar 大+タイプ名+PERSONALITY解説 / 年代・趣味タグ / チェックイン中店舗 / 「プロフィールを編集」→ onboarding を再利用(編集モードで戻れる)
- [ ] 全体検証: `npm test` / `npm run typecheck` / `npx expo start` でバンドルが起動することを確認
- [ ] 仕様書と突き合わせ(4.1〜4.8の各要件が画面に存在するか目視チェックリスト)
- [ ] Commit: `feat: my profile tab`
