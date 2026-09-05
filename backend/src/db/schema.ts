import { integer, primaryKey, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  tokenHash: text('token_hash').notNull().unique(),
  ageBand: text('age_band').notNull(),
  mbti: text('mbti').notNull(),
  createdAt: integer('created_at').notNull(),
});

export const userHobbies = sqliteTable(
  'user_hobbies',
  {
    userId: text('user_id').notNull().references(() => users.id),
    hobby: text('hobby').notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.hobby] })],
);

export const venues = sqliteTable('venues', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  category: text('category').notNull(),
  lat: real('lat').notNull(),
  lng: real('lng').notNull(),
});

export const checkins = sqliteTable('checkins', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  venueId: text('venue_id').notNull().references(() => venues.id),
  checkedInAt: integer('checked_in_at').notNull(),
  checkedOutAt: integer('checked_out_at'),
});

export const likes = sqliteTable(
  'likes',
  {
    fromUser: text('from_user').notNull().references(() => users.id),
    toUser: text('to_user').notNull().references(() => users.id),
    createdAt: integer('created_at').notNull(),
  },
  (t) => [primaryKey({ columns: [t.fromUser, t.toUser] })],
);

export const messages = sqliteTable('messages', {
  id: text('id').primaryKey(),
  fromUser: text('from_user').notNull().references(() => users.id),
  toUser: text('to_user').notNull().references(() => users.id),
  text: text('text').notNull(),
  kind: text('kind').notNull().default('text'), // 'text' | 'like'(いいね通知)
  createdAt: integer('created_at').notNull(),
});

export const userLocations = sqliteTable('user_locations', {
  userId: text('user_id').primaryKey().references(() => users.id),
  lat: real('lat').notNull(),
  lng: real('lng').notNull(),
  updatedAt: integer('updated_at').notNull(),
});
