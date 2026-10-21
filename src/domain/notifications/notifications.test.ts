import { describe, expect, it } from 'vitest';

import { appRoute, badgeLabel, unreadCount } from './notifications';

const ID = '714cc3f7-7265-4bd9-bbd5-4db95eaca06b';

describe('appRoute', () => {
  it.each([
    ['/card', '/'],
    ['/coupons', '/coupons'],
    ['/rewards', '/rewards'],
    [`/rewards/redemptions/${ID}`, `/rewards/redemptions/${ID}`],
    [`/history/${ID}`, `/history/${ID}`],
    [`/offers/${ID.toUpperCase()}`, `/offers/${ID}`],
  ])('%s → %s', (link, route) => {
    expect(appRoute(link)).toBe(route);
  });

  it.each([
    null,
    '',
    'https://example.com',
    '/history/abc',
    '/../account',
    '/settings',
    `/coupons/${ID}/x`,
  ])('odrzuca %j', (link) => {
    expect(appRoute(link)).toBeNull();
  });
});

describe('licznik', () => {
  it('liczy nieprzeczytane', () => {
    expect(
      unreadCount([{ readAt: null }, { readAt: '2026-10-21T10:00:00Z' }, { readAt: null }]),
    ).toBe(2);
  });

  it('skraca duże liczby', () => {
    expect(badgeLabel(0)).toBeNull();
    expect(badgeLabel(3)).toBe('3');
    expect(badgeLabel(12)).toBe('9+');
  });
});
