# 夜あわせ バックエンド Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** docs/バックエンド仕様書.md のAPI(Cloudflare Workers + Hono + D1)を実装し、Workers実環境相当のAPIテストで検証する。

**Architecture:** モノレポに `backend/` を追加。ドメイン型・相性ロジックはリポジトリ直下 `shared/` に移してアプリと共有(アプリ側は既存パスの再エクスポートで無変更)。D1スキーマは手書きSQLマイグレーション(wrangler `d1 migrations` 形式)、クエリは drizzle-orm。テストは vitest + @cloudflare/vitest-pool-workers(ローカルD1にマイグレーション適用)。

**Tech Stack:** Hono, drizzle-orm, zod, ulidx, wrangler, @cloudflare/vitest-pool-workers

**Spec:** docs/バックエンド仕様書.md(API・スキーマ・ドメインルールの正)

## Global Constraints

- エラーレスポンスは共通形式 `{ error: { code, message } }`。code は仕様書 §5 の6種
- `POST /auth/register` 以外は Bearer 認証必須(トークンはSHA-256ハッシュで保存)
- プレゼンス: updated_at が10分以内 かつ 中心(38.2610, 140.8722)から250m以内 = アクティブ
- 相性計算は `shared/compatibility.ts` のみを使用(重複実装禁止)
- メッセージIDは ULID。`?after=` は辞書順比較
- 仕様書との差分: マイグレーションは drizzle-kit 生成ではなく手書きSQL(wrangler形式)。仕様書 §1 を追従修正する

---

### Task 1: shared/ 抽出

**Files:**
- Create: `shared/types.ts`(src/types.ts の中身を移動)
- Create: `shared/compatibility.ts`(src/logic/compatibility.ts の中身を移動。import元を `./types` に)
- Create: `shared/venueStats.ts`(src/logic/venueStats.ts を汎用化: `venueMbtiCharacter(members: { mbti: MbtiType }[])`, `venueCompatPct(me: {mbti, hobbies}, members: {mbti, hobbies}[])`。venueMembers はアプリ専用なので src に残す)
- Modify: `src/types.ts` → `export * from '../shared/types';` のみ
- Modify: `src/logic/compatibility.ts` → `export * from '../../shared/compatibility';` のみ
- Modify: `src/logic/venueStats.ts` → venueMembers 実装 + shared/venueStats の再エクスポート

**Steps:**
- [ ] 上記移動・汎用化(compat の `totalScore(me: Profile, p: Person)` は `{mbti, hobbies}` を受ける形に緩める。既存呼び出しはそのまま型互換)
- [ ] `npm test` 24件パス / `npx tsc --noEmit` PASS(アプリ側無変更で通ること)
- [ ] Commit: `refactor: extract shared domain logic for backend reuse`

### Task 2: backend scaffold + テスト基盤

**Files:**
- Create: `backend/package.json`(deps: hono, drizzle-orm, zod, ulidx / devDeps: wrangler, typescript, vitest, @cloudflare/vitest-pool-workers)
- Create: `backend/wrangler.toml`(name yoawase-api, D1 binding `DB`, migrations_dir migrations)
- Create: `backend/tsconfig.json`(strict, types: @cloudflare/workers-types 相当は vitest-pool-workers 付属の型)
- Create: `backend/src/index.ts`(Hono app + `GET /health` → `{ ok: true }` + onError で共通エラー形式)
- Create: `backend/vitest.config.ts`(defineWorkersConfig, miniflare d1Databases + TEST_MIGRATIONS)
- Create: `backend/test/setup.ts`(applyD1Migrations)
- Create: `backend/test/health.test.ts`(SELF.fetch で /health 200)
- Create: `backend/migrations/0001_init.sql`(仕様書 §3 のDDL全文)
- Create: `backend/migrations/0002_seed_venues.sql`(モックの5店舗INSERT)

**Steps:**
- [ ] scaffold一式を作成、`cd backend && npm i`
- [ ] `npm test`(backend)で health テストPASS(= マイグレーション適用含む基盤動作確認)
- [ ] Commit: `feat(backend): scaffold hono worker with d1 migrations and test harness`

### Task 3: DBスキーマ(drizzle)+ 認証・プロフィールAPI

**Files:**
- Create: `backend/src/db/schema.ts`(users, userHobbies, venues, checkins, likes, messages, userLocations — 0001_init.sql と同構造)
- Create: `backend/src/lib/auth.ts`(`hashToken(token)`, `generateToken()`, authMiddleware: Bearer→users逆引き、c.set('userId'))
- Create: `backend/src/lib/errors.ts`(ApiError(code, message, status) + onError 変換)
- Create: `backend/src/routes/auth.ts`(POST /auth/register: zod検証 {ageBand, hobbies[1..10], mbti, ageConfirmed:true} → users+user_hobbies INSERT → {userId, token})
- Create: `backend/src/routes/me.ts`(GET /me, PUT /me)
- Test: `backend/test/auth.test.ts`

**Steps(TDD):**
- [ ] テスト: 登録→{userId,token}が返る / ageConfirmed:false→400 / 不正mbti→400 / Bearerなし GET /me→401 / 正Bearer→プロフィール一致 / PUT /me で更新反映
- [ ] FAIL確認 → 実装 → PASS
- [ ] Commit: `feat(backend): schema, anonymous auth, profile endpoints`

### Task 4: 位置・プレゼンス

**Files:**
- Create: `backend/src/domain/area.ts`(AREA定数、haversine `distanceM(a,b)`、`isActive(loc, now)`: 10分以内+250m以内、`ACTIVE_WINDOW_MS`)
- Create: `backend/src/routes/location.ts`(POST /location: upsert user_locations → {inArea})
- Test: `backend/test/location.test.ts`

**Steps(TDD):**
- [ ] テスト: エリア内座標→{inArea:true} / エリア外→false / upsertで更新されること / haversineの近似値(中心から既知距離)
- [ ] FAIL→実装→PASS / Commit: `feat(backend): location heartbeat and presence domain`

### Task 5: 店舗・チェックインAPI

**Files:**
- Create: `backend/src/domain/activeUsers.ts`(アクティブユーザー+滞在中チェックインのJOIN取得ヘルパー。以降のroutesで共用)
- Create: `backend/src/routes/venues.ts`(GET /venues, GET /venues/:id — memberCount/mbtiCharacter/compatPct/members は shared/venueStats+compatibility で算出)
- Create: `backend/src/routes/checkins.ts`(POST /checkins: 既存滞在中を自動checkout→INSERT / DELETE /checkins/current: なければ404)
- Test: `backend/test/venues.test.ts`, `backend/test/checkins.test.ts`

**Steps(TDD):**
- [ ] テスト: 2店舗目チェックインで1店舗目が自動解除 / DELETEで解除・二重DELETEは404 / GET /venues のmemberCountがアクティブ滞在者数と一致 / 位置心拍が古い(10分超)ユーザーはmemberCountから消える / mbtiCharacter最頻・同数タイブレーク / compatPct が shared の期待値と一致 / GET /venues/:id のmembersがチェックイン古い順
- [ ] FAIL→実装→PASS / Commit: `feat(backend): venues and checkins endpoints`

### Task 6: 周辺・マッチAPI

**Files:**
- Create: `backend/src/routes/people.ts`(GET /people/nearby, GET /people/:userId, GET /matches?limit=)
- Test: `backend/test/people.test.ts`

**Steps(TDD):**
- [ ] テスト: nearbyに自分が含まれない / 非アクティブユーザーが出ない / 店舗滞在中はvenueIdのみで座標(lat,lng)が返らない / matchesが総合スコア降順・limit反映・liked反映 / GET /people/:userId 非アクティブ404・チャット解禁済みなら取得可
- [ ] FAIL→実装→PASS / Commit: `feat(backend): nearby people and matches endpoints`

### Task 7: いいね・チャットAPI

**Files:**
- Create: `backend/src/routes/likes.ts`(POST /likes: 冪等200)
- Create: `backend/src/routes/chats.ts`(GET /chats, GET /chats/:userId/messages?after=, POST /chats/:userId/messages — ULID採番)
- Test: `backend/test/chats.test.ts`

**Steps(TDD):**
- [ ] テスト: 片方向いいねで双方のGET /chatsに会話が出る / 未解禁ペアのPOST messages→403 / 送信→取得往復 / afterカーソルで差分のみ / 1001文字→400 / 重複いいね200
- [ ] FAIL→実装→PASS / Commit: `feat(backend): likes and chat endpoints`

### Task 8: 仕上げ

**Files:**
- Modify: `docs/バックエンド仕様書.md`(§1 マイグレーション記述を手書きSQL+wranglerに追従)
- Modify: `README.md`(backend/ の起動・テスト・デプロイ手順を追記)
- Modify: ルート `package.json` に `test:backend` スクリプト

**Steps:**
- [ ] 全テスト(アプリ24件+backend)PASS / 両tsc PASS / `wrangler deploy --dry-run` 成功
- [ ] 仕様書 §5 の全エンドポイントが実装済みかチェックリスト突き合わせ
- [ ] Commit: `docs: backend setup, deploy notes; align spec with wrangler migrations`
