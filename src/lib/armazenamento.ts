/**
 * Guarda pequenos valores (a sessão) de forma segura. No aparelho usa o cofre do sistema
 * (SecureStore); no navegador, o localStorage. É o único lugar que sabe dessa diferença.
 */
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

export async function salvarItem(chave: string, valor: string): Promise<void> {
  if (Platform.OS === 'web') {
    try { window.localStorage.setItem(chave, valor); } catch { /* modo privado */ }
    return;
  }
  await SecureStore.setItemAsync(chave, valor);
}

export async function lerItem(chave: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    try { return window.localStorage.getItem(chave); } catch { return null; }
  }
  return SecureStore.getItemAsync(chave);
}

export async function apagarItem(chave: string): Promise<void> {
  if (Platform.OS === 'web') {
    try { window.localStorage.removeItem(chave); } catch { /* modo privado */ }
    return;
  }
  await SecureStore.deleteItemAsync(chave);
}
