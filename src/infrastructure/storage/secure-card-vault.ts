import * as SecureStore from 'expo-secure-store';

import type { CardVault } from '@/application/ports/card';
import type { LoyaltyCard } from '@/domain/card/card';

const KEY = 'card.current';
const OPTIONS: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

type Stored = { userId: string; card: LoyaltyCard };

export const secureCardVault: CardVault = {
  async load(userId) {
    try {
      const raw = await SecureStore.getItemAsync(KEY, OPTIONS);
      if (!raw) return null;
      const stored = JSON.parse(raw) as Stored;
      return stored.userId === userId ? stored.card : null;
    } catch {
      return null;
    }
  },
  async save(userId, card) {
    const value: Stored = { userId, card };
    await SecureStore.setItemAsync(KEY, JSON.stringify(value), OPTIONS);
  },
  async clear() {
    await SecureStore.deleteItemAsync(KEY, OPTIONS);
  },
};
