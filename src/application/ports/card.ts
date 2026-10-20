import type { LoyaltyCard } from '@/domain/card/card';

export type CardRepository = {
  fetchMyCard(): Promise<LoyaltyCard | null>;
};

export type CardVault = {
  load(userId: string): Promise<LoyaltyCard | null>;
  save(userId: string, card: LoyaltyCard): Promise<void>;
  clear(): Promise<void>;
};
