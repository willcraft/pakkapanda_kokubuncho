import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useChatsList, useChatsPolling } from '@/api/client';
import { MbtiAvatar } from '@/components/MbtiAvatar';
import { colors } from '@/theme';

function formatTime(at: number): string {
  const d = new Date(at);
  return `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export default function ChatsScreen() {
  const router = useRouter();
  useChatsPolling();
  const chats = useChatsList();

  return (
    <SafeAreaView style={styles.safe}>
      <Text style={styles.title}>チャット</Text>
      {chats.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="chatbubble-ellipses-outline" size={44} color={colors.gray} />
          <Text style={styles.emptyText}>いいねを送るとチャットができます</Text>
        </View>
      ) : (
        <FlatList
          data={chats}
          keyExtractor={(item) => item.peer.userId}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Pressable style={styles.row} onPress={() => router.push(`/chat/${item.peer.userId}`)}>
              <MbtiAvatar type={item.peer.mbti} size={48} />
              <View style={styles.rowBody}>
                <Text style={styles.rowName}>{item.peer.mbti}</Text>
                <Text style={styles.rowLast} numberOfLines={1}>
                  {item.lastMessage
                    ? item.lastMessage.kind === 'like'
                      ? item.lastMessage.from === 'me'
                        ? '♡ いいねを送りました'
                        : '♡ いいねが届きました'
                      : item.lastMessage.text
                    : 'チャットができるようになりました'}
                </Text>
              </View>
              {item.lastMessage && <Text style={styles.rowTime}>{formatTime(item.lastMessage.createdAt)}</Text>}
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  title: {
    color: colors.text,
    fontSize: 26,
    fontWeight: '800',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 },
  emptyText: { color: colors.textDim, fontSize: 14 },
  list: { paddingHorizontal: 20, paddingTop: 18 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 12,
  },
  rowBody: { flex: 1 },
  rowName: { color: colors.text, fontSize: 16, fontWeight: '700' },
  rowLast: { color: colors.textDim, fontSize: 13, marginTop: 3 },
  rowTime: { color: colors.textDim, fontSize: 12 },
});
