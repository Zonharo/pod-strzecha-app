import type { CardRepository, CardVault } from '@/application/ports/card';
import { isValidCardNumber, type LoyaltyCard } from '@/domain/card/card';

export type CardResult =
  | { kind: 'ready'; card: LoyaltyCard; offline: boolean }
  | { kind: 'missing' }
  | { kind: 'unavailable' };

const isUsable = (card: LoyaltyCard | null): card is LoyaltyCard =>
  !!card && isValidCardNumber(card.number) && /^[0-9a-f]{40}$/i.test(card.secretHex);

export const makeGetCard =
  ({ cards, vault }: { cards: CardRepository; vault: CardVault }) =>
  async (userId: string): Promise<CardResult> => {
    let remote: LoyaltyCard | null;
    try {
      remote = await cards.fetchMyCard();
    } catch {
      const cached = await vault.load(userId);
      return isUsable(cached)
        ? { kind: 'ready', card: cached, offline: true }
        : { kind: 'unavailable' };
    }
    if (!isUsable(remote)) return { kind: 'missing' };
    await vault.save(userId, remote);
    return { kind: 'ready', card: remote, offline: false };
  };
