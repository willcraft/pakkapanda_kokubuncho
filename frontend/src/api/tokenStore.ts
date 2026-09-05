// トークンの永続化。ネイティブは SecureStore、web(モック確認用)は localStorage にフォールバック。
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const KEY = 'yoawase.token';

export async function loadToken(): Promise<string | null> {
  try {
    if (Platform.OS === 'web') {
      return globalThis.localStorage?.getItem(KEY) ?? null;
    }
    return await SecureStore.getItemAsync(KEY);
  } catch {
    return null;
  }
}

export async function saveToken(token: string): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      globalThis.localStorage?.setItem(KEY, token);
      return;
    }
    await SecureStore.setItemAsync(KEY, token);
  } catch {
    // 保存失敗時はメモリのみ(アプリ再起動で消える)
  }
}

export async function clearToken(): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      globalThis.localStorage?.removeItem(KEY);
      return;
    }
    await SecureStore.deleteItemAsync(KEY);
  } catch {
    // noop
  }
}
