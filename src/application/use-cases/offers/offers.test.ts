import { describe, expect, it, vi } from 'vitest';

import type { OfferRepository } from '@/application/ports/offers';
import type { Redemption, Reward } from '@/domain/offers/offers';
import { err, ok } from '@/domain/result';

import { makeListRewards, makeRedeemReward } from './offers';

const reward = (id: string, pointsCost: number, stock: number | null = null): Reward => ({
  id,
  title: id,
  description: '',
  terms: '',
  imageUrl: null,
  pointsCost,
  benefit: { kind: 'free_item', value: null },
  stock,
});

const redemption = (id: string, status: Redemption['status'], expiresAt: string): Redemption => ({
  id,
  status,
  pointsSpent: 60,
  createdAt: '2026-10-20T00:00:00Z',
  expiresAt,
  usedAt: null,
  reward: {
    id: 'r',
    title: 'r',
    description: '',
    imageUrl: null,
    benefit: { kind: 'free_item', value: null },
  },
});

const fakeOffers = (overrides: Partial<OfferRepository> = {}): OfferRepository => ({
  availableCoupons: vi.fn(async () => []),
  myCoupons: vi.fn(async () => []),
  activateCoupon: vi.fn(async () => ok('cc')),
  rewards: vi.fn(async () => []),
  myRedemptions: vi.fn(async () => []),
  redeemReward: vi.fn(async () => ok('rr')),
  cancelRedemption: vi.fn(async () => ok(undefined)),
  ...overrides,
});

const NOW = new Date('2026-10-21T12:00:00Z').getTime();

describe('makeListRewards', () => {
  it('sortuje katalog po cenie i pokazuje tylko nagrody czekające na odbiór', async () => {
    const offers = fakeOffers({
      rewards: vi.fn(async () => [
        reward('kawa', 120),
        reward('bulka', 30),
        reward('drozdzowka', 60),
      ]),
      myRedemptions: vi.fn(async () => [
        redemption('pozniej', 'active', '2026-11-01T00:00:00Z'),
        redemption('uzyta', 'used', '2026-11-01T00:00:00Z'),
        redemption('przeterminowana', 'active', '2026-10-21T11:00:00Z'),
        redemption('wczesniej', 'active', '2026-10-25T00:00:00Z'),
      ]),
    });
    const view = await makeListRewards({ offers })(NOW);
    expect(view.rewards.map((r) => r.id)).toEqual(['bulka', 'drozdzowka', 'kawa']);
    expect(view.waiting.map((r) => r.id)).toEqual(['wczesniej', 'pozniej']);
  });
});

describe('makeRedeemReward', () => {
  it('nie pyta serwera, gdy brakuje kłosków albo puli', async () => {
    const offers = fakeOffers();
    const redeem = makeRedeemReward({ offers });
    expect(await redeem(reward('a', 60), 59)).toEqual(err('not_enough_points'));
    expect(await redeem(reward('a', 60, 0), 100)).toEqual(err('reward_sold_out'));
    expect(offers.redeemReward).not.toHaveBeenCalled();
  });

  it('wymienia, gdy wystarcza kłosków', async () => {
    const offers = fakeOffers();
    expect(await makeRedeemReward({ offers })(reward('a', 60), 60)).toEqual(ok('rr'));
    expect(offers.redeemReward).toHaveBeenCalledWith('a');
  });
});
