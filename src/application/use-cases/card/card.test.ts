import { describe, expect, it, vi } from 'vitest';

import type { CardRepository, CardVault } from '@/application/ports/card';
import type { LoyaltyCard } from '@/domain/card/card';

import { makeGetCard } from './card';

const card: LoyaltyCard = {
  number: '2994144055423',
  secretHex: 'a'.repeat(40),
  periodSeconds: 30,
  digits: 6,
};

const fakeVault = (stored: LoyaltyCard | null = null): CardVault => ({
  load: vi.fn(async () => stored),
  save: vi.fn(async () => undefined),
  clear: vi.fn(async () => undefined),
});

const fakeCards = (result: LoyaltyCard | null | Error): CardRepository => ({
  fetchMyCard: vi.fn(async () => {
    if (result instanceof Error) throw result;
    return result;
  }),
});

describe('makeGetCard', () => {
  it('pobiera kartę z serwera i zapisuje ją w telefonie', async () => {
    const vault = fakeVault();
    const result = await makeGetCard({ cards: fakeCards(card), vault })('u1');
    expect(result).toEqual({ kind: 'ready', card, offline: false });
    expect(vault.save).toHaveBeenCalledWith('u1', card);
  });

  it('bez internetu używa zapisanej karty', async () => {
    const result = await makeGetCard({
      cards: fakeCards(new Error('Network request failed')),
      vault: fakeVault(card),
    })('u1');
    expect(result).toEqual({ kind: 'ready', card, offline: true });
  });

  it('bez internetu i bez zapisanej karty zgłasza brak dostępu', async () => {
    const result = await makeGetCard({
      cards: fakeCards(new Error('offline')),
      vault: fakeVault(null),
    })('u1');
    expect(result).toEqual({ kind: 'unavailable' });
  });

  it('serwer bez karty to brak karty, nie zapisuje niczego', async () => {
    const vault = fakeVault();
    expect(await makeGetCard({ cards: fakeCards(null), vault })('u1')).toEqual({ kind: 'missing' });
    expect(vault.save).not.toHaveBeenCalled();
  });

  it('odrzuca uszkodzone dane z pamięci telefonu', async () => {
    const result = await makeGetCard({
      cards: fakeCards(new Error('offline')),
      vault: fakeVault({ ...card, secretHex: 'xyz' }),
    })('u1');
    expect(result).toEqual({ kind: 'unavailable' });
  });
});
