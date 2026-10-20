import { describe, expect, it, vi } from 'vitest';

import type { PurchaseRepository } from '@/application/ports/purchases';
import type { PurchaseSummary } from '@/domain/purchases/purchase';
import { err, ok } from '@/domain/result';

import { makeListPurchases, makeRatePurchase } from './purchases';

const PURCHASE_ID = '0b9c6a6e-3a51-4c6f-9f63-2f2b8ad0d010';

const summary = (i: number): PurchaseSummary => ({
  id: String(i),
  storeName: 'Gniezno PKP',
  occurredAt: '2026-10-20T10:00:00.000Z',
  total: 10,
  discountTotal: 0,
  pointsEarned: 10,
  refunded: false,
  rating: null,
});

const fakePurchases = (rows: PurchaseSummary[] = []): PurchaseRepository => ({
  list: vi.fn(async (offset: number, limit: number) => rows.slice(offset, offset + limit)),
  get: vi.fn(async () => null),
  rate: vi.fn(async () => ok(undefined)),
  pointsHistory: vi.fn(async () => []),
});

describe('makeListPurchases', () => {
  it('stronicuje po 20 i wie, czy jest dalej', async () => {
    const purchases = fakePurchases(Array.from({ length: 25 }, (_, i) => summary(i)));
    const list = makeListPurchases({ purchases });
    const first = await list(0);
    expect(first.items).toHaveLength(20);
    expect(first.nextPage).toBe(1);
    expect(purchases.list).toHaveBeenCalledWith(0, 21);
    const second = await list(1);
    expect(second.items).toHaveLength(5);
    expect(second.nextPage).toBeNull();
  });
});

describe('makeRatePurchase', () => {
  it('usuwa powtórzone tagi i pusty komentarz', async () => {
    const purchases = fakePurchases();
    const result = await makeRatePurchase({ purchases })({
      purchaseId: PURCHASE_ID,
      rating: 5,
      tags: ['taste', 'service', 'taste'],
      comment: '   ',
    });
    expect(result.ok).toBe(true);
    expect(purchases.rate).toHaveBeenCalledWith(PURCHASE_ID, {
      rating: 5,
      tags: ['taste', 'service'],
      comment: null,
    });
  });

  it('wymaga gwiazdek', async () => {
    const purchases = fakePurchases();
    const result = await makeRatePurchase({ purchases })({
      purchaseId: PURCHASE_ID,
      rating: 0,
      tags: [],
      comment: '',
    });
    expect(result).toEqual(err({ kind: 'validation', message: 'rating_required' }));
    expect(purchases.rate).not.toHaveBeenCalled();
  });

  it('pilnuje długości komentarza', async () => {
    const result = await makeRatePurchase({ purchases: fakePurchases() })({
      purchaseId: PURCHASE_ID,
      rating: 3,
      tags: [],
      comment: 'x'.repeat(501),
    });
    expect(result).toEqual(err({ kind: 'validation', message: 'comment_too_long' }));
  });

  it('przekazuje zamknięte okno oceny z bazy', async () => {
    const purchases = fakePurchases();
    vi.mocked(purchases.rate).mockResolvedValueOnce(err('rating_closed'));
    const result = await makeRatePurchase({ purchases })({
      purchaseId: PURCHASE_ID,
      rating: 4,
      tags: [],
      comment: '',
    });
    expect(result).toEqual(err({ kind: 'domain', code: 'rating_closed' }));
  });
});
