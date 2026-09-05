import { Alert, Platform } from 'react-native';

/** Alert.alert はwebでは何も表示しないため、webは window.alert にフォールバックする */
export function showAlert(title: string, message: string): void {
  if (Platform.OS === 'web') {
    globalThis.alert?.(`${title}\n\n${message}`);
    return;
  }
  Alert.alert(title, message);
}
