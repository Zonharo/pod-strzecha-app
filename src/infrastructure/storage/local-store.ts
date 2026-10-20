import AsyncStorage from '@react-native-async-storage/async-storage';

import type { LocalCache } from '@/application/ports/account';

export const makeJsonCache = <T>(key: string) => ({
  async read(): Promise<T | null> {
    try {
      const raw = await AsyncStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  },
  async write(value: T): Promise<void> {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch {
      return;
    }
  },
  async clear(): Promise<void> {
    await AsyncStorage.removeItem(key);
  },
});

export type JsonCache<T> = ReturnType<typeof makeJsonCache<T>> & LocalCache;
