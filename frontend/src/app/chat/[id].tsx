import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  api,
  runAction,
  useMarkRead,
  useMessages,
  useMessagesPolling,
  usePersonDetail,
  useVenueSummary,
} from '@/api/client';
import type { ApiMessage } from '@/api/types';
import { MbtiAvatar } from '@/components/MbtiAvatar';
import { colors } from '@/theme';

function formatTime(at: number): string {
  const d = new Date(at);
  return `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function Bubble({ message }: { message: ApiMessage }) {
  const mine = message.from === 'me';
  if (message.kind === 'like') {
    return (
      <View style={styles.systemWrap}>
        <Text style={styles.likeHeart}>♡</Text>
        <Text style={styles.systemText}>
          {mine
            ? 'いいねを送りました。チャットができるようになりました'
            : 'いいねが届きました。チャットができるようになりました'}
        </Text>
      </View>
    );
  }
  return (
    <View style={[styles.bubbleWrap, mine ? styles.bubbleWrapMe : styles.bubbleWrapThem]}>
      <View style={[styles.bubble, mine ? styles.bubbleMe : styles.bubbleThem]}>
        <Text style={[styles.bubbleText, mine && styles.bubbleTextMe]}>{message.text}</Text>
      </View>
      <Text style={styles.time}>{formatTime(message.createdAt)}</Text>
    </View>
  );
}

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { person } = usePersonDetail(id);
  const venue = useVenueSummary(person?.venueId);
  useMessagesPolling(id);
  const messages = useMessages(id);
  useMarkRead(id, messages);
  const [text, setText] = useState('');
  const listRef = useRef<FlatList>(null);

  const send = () => {
    if (!text.trim()) return;
    runAction(api.sendMessage(id, text));
    setText('');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable style={styles.back} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={20} color={colors.text} />
        </Pressable>
        {person && (
          <>
            <MbtiAvatar type={person.mbti} size={40} />
            <View style={styles.headerText}>
              <Text style={styles.headerName}>{person.mbti}</Text>
              <Text style={styles.headerSub}>
                相性 {person.compat.rank}
                {venue ? `・${venue.name}` : ''}
              </Text>
            </View>
          </>
        )}
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={8}
      >
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => <Bubble message={item} />}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        />

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="メッセージを入力"
            placeholderTextColor={colors.gray}
            value={text}
            onChangeText={setText}
            onSubmitEditing={send}
            returnKeyType="send"
          />
          <Pressable style={styles.sendButton} onPress={send}>
            <Ionicons name="paper-plane" size={20} color="#1A0E10" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomColor: colors.cardBorder,
    borderBottomWidth: 1,
  },
  back: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: { flex: 1 },
  headerName: { color: colors.text, fontSize: 17, fontWeight: '800' },
  headerSub: { color: colors.teal, fontSize: 12, marginTop: 2 },
  list: { paddingHorizontal: 16, paddingVertical: 16, gap: 4 },
  systemWrap: {
    alignSelf: 'center',
    backgroundColor: colors.card,
    borderColor: colors.cardBorder,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 12,
    marginBottom: 12,
    maxWidth: '90%',
  },
  systemText: { color: colors.textDim, fontSize: 12, textAlign: 'center', lineHeight: 18 },
  likeHeart: { color: colors.coral, fontSize: 20, textAlign: 'center', marginBottom: 4 },
  bubbleWrap: { marginBottom: 10, maxWidth: '78%' },
  bubbleWrapThem: { alignSelf: 'flex-start' },
  bubbleWrapMe: { alignSelf: 'flex-end', alignItems: 'flex-end' },
  bubble: { borderRadius: 16, paddingHorizontal: 14, paddingVertical: 11 },
  bubbleThem: { backgroundColor: colors.card },
  bubbleMe: { backgroundColor: colors.coral },
  bubbleText: { color: colors.text, fontSize: 14, lineHeight: 21 },
  bubbleTextMe: { color: '#1A0E10' },
  time: { color: colors.textDim, fontSize: 11, marginTop: 4 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  input: {
    flex: 1,
    backgroundColor: colors.card,
    borderColor: colors.cardBorder,
    borderWidth: 1,
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 12,
    color: colors.text,
    fontSize: 14,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.coral,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
