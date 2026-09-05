-- いいね通知をチャットメッセージとして扱うための種別列
ALTER TABLE messages ADD COLUMN kind TEXT NOT NULL DEFAULT 'text';
