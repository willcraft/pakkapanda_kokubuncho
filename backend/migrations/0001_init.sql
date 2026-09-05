-- 夜あわせ 初期スキーマ(docs/バックエンド仕様書.md §3)
CREATE TABLE users (
  id            TEXT PRIMARY KEY,
  token_hash    TEXT NOT NULL UNIQUE,
  age_band      TEXT NOT NULL,
  mbti          TEXT NOT NULL,
  created_at    INTEGER NOT NULL
);

CREATE TABLE user_hobbies (
  user_id  TEXT NOT NULL REFERENCES users(id),
  hobby    TEXT NOT NULL,
  PRIMARY KEY (user_id, hobby)
);

CREATE TABLE venues (
  id        TEXT PRIMARY KEY,
  name      TEXT NOT NULL,
  category  TEXT NOT NULL,
  lat       REAL NOT NULL,
  lng       REAL NOT NULL
);

CREATE TABLE checkins (
  id             TEXT PRIMARY KEY,
  user_id        TEXT NOT NULL REFERENCES users(id),
  venue_id       TEXT NOT NULL REFERENCES venues(id),
  checked_in_at  INTEGER NOT NULL,
  checked_out_at INTEGER
);
CREATE UNIQUE INDEX idx_active_checkin
  ON checkins(user_id) WHERE checked_out_at IS NULL;

CREATE TABLE likes (
  from_user  TEXT NOT NULL REFERENCES users(id),
  to_user    TEXT NOT NULL REFERENCES users(id),
  created_at INTEGER NOT NULL,
  PRIMARY KEY (from_user, to_user)
);

CREATE TABLE messages (
  id         TEXT PRIMARY KEY,
  from_user  TEXT NOT NULL REFERENCES users(id),
  to_user    TEXT NOT NULL REFERENCES users(id),
  text       TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX idx_messages_pair ON messages(from_user, to_user, id);

CREATE TABLE user_locations (
  user_id    TEXT PRIMARY KEY REFERENCES users(id),
  lat        REAL NOT NULL,
  lng        REAL NOT NULL,
  updated_at INTEGER NOT NULL
);
