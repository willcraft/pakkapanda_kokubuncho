interface ChatLike {
  peer: { userId: string };
  lastMessage: { id: string; from: 'me' | 'them' } | null;
}

/**
 * 未読の会話数。メッセージIDはULID(辞書順=時系列)なので文字列比較でよい。
 * readMarks は peerId → 既読済み最終メッセージID。
 */
export function countUnreadChats(chats: ChatLike[], readMarks: Record<string, string>): number {
  return chats.filter(
    (c) =>
      c.lastMessage &&
      c.lastMessage.from === 'them' &&
      c.lastMessage.id > (readMarks[c.peer.userId] ?? ''),
  ).length;
}
