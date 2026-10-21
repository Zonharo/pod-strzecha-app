import { describe, expect, it } from 'vitest';

import {
  benefitLabel,
  isCouponUsable,
  isSoldOut,
  pointsMissing,
  rewardProgress,
  splitCoupons,
  validityLabel,
  type Coupon,
  type CustomerCoupon,
} from './offers';

const coupon = (id: string): Coupon => ({
  id,
  title: `Kupon ${id}`,
  description: '',
  terms: '',
  imageUrl: null,
  benefit: { kind: 'percent_off', value: 20 },
  minTotal: null,
  limitedToStores: false,
  startsAt: '2026-10-01T00:00:00Z',
  endsAt: '2026-11-01T00:00:00Z',
  usesPerCustomer: 1,
});

const owned = (id: string, overrides: Partial<CustomerCoupon> = {}): CustomerCoupon => ({
  id: `cc-${id}`,
  source: 'activated',
  usesLeft: 1,
  validFrom: '2026-10-01T00:00:00Z',
  validUntil: '2026-11-01T00:00:00Z',
  coupon: coupon(id),
  ...overrides,
});

const NOW = new Date('2026-10-21T12:00:00Z').getTime();

describe('benefitLabel', () => {
  it.each([
    [{ kind: 'percent_off', value: 20 }, '-20%'],
    [{ kind: 'percent_off', value: 12.5 }, '-12,5%'],
    [{ kind: 'amount_off', value: 5 }, '-5,00 zł'],
    [{ kind: 'fixed_price', value: 3.99 }, 'za 3,99 zł'],
    [{ kind: 'free_item', value: null }, 'Gratis'],
    [{ kind: 'bonus_points', value: 50 }, '+50 kłosków'],
    [{ kind: 'bonus_points', value: 2 }, '+2 kłoski'],
    [{ kind: 'points_multiplier', value: 2 }, 'Kłoski ×2'],
    [{ kind: 'points_multiplier', value: 1.5 }, 'Kłoski ×1,5'],
  ] as const)('%o → %s', (benefit, label) => {
    expect(benefitLabel(benefit)).toBe(label);
  });
});

describe('isCouponUsable', () => {
  it('wymaga użyć i terminu', () => {
    expect(isCouponUsable(owned('a'), NOW)).toBe(true);
    expect(isCouponUsable(owned('a', { usesLeft: 0 }), NOW)).toBe(false);
    expect(isCouponUsable(owned('a', { validUntil: '2026-10-21T11:59:59Z' }), NOW)).toBe(false);
    expect(isCouponUsable(owned('a', { validFrom: '2026-10-22T00:00:00Z' }), NOW)).toBe(false);
  });
});

describe('splitCoupons', () => {
  it('aktywne osobno, aktywowanych nie pokazuje do aktywacji, zużytych też nie', () => {
    const result = splitCoupons(
      [coupon('a'), coupon('b'), coupon('c')],
      [
        owned('a'),
        owned('b', { usesLeft: 0 }),
        owned('bday', { source: 'birthday', validUntil: '2026-10-25T00:00:00Z' }),
      ],
      NOW,
    );
    expect(result.active.map((c) => c.coupon.id)).toEqual(['bday', 'a']);
    expect(result.toActivate.map((c) => c.id)).toEqual(['c']);
  });
});

describe('validityLabel', () => {
  it.each([
    ['2026-10-21T11:00:00Z', 'Wygasł'],
    ['2026-10-21T12:30:00Z', 'Wygasa w ciągu godziny'],
    ['2026-10-21T17:00:00Z', 'Wygasa za 5 godz.'],
    ['2026-10-22T13:00:00Z', 'Zostały 2 dni'],
    ['2026-10-24T11:00:00Z', 'Zostały 3 dni'],
  ])('%s → %s', (until, label) => {
    expect(validityLabel(until, NOW)).toBe(label);
  });

  it('dalekie terminy podaje datą', () => {
    expect(validityLabel(new Date(2026, 10, 15, 12).toISOString(), NOW)).toBe(
      'Ważny do 15 listopada',
    );
  });
});

describe('nagrody', () => {
  it('liczy brakujące kłoski i postęp', () => {
    expect(pointsMissing(48, { pointsCost: 60 })).toBe(12);
    expect(pointsMissing(80, { pointsCost: 60 })).toBe(0);
    expect(rewardProgress(30, { pointsCost: 60 })).toBe(0.5);
    expect(rewardProgress(90, { pointsCost: 60 })).toBe(1);
  });

  it('wyczerpana pula', () => {
    expect(isSoldOut({ stock: 0 })).toBe(true);
    expect(isSoldOut({ stock: null })).toBe(false);
    expect(isSoldOut({ stock: 3 })).toBe(false);
  });
});
