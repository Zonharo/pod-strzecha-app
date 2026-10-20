import { describe, expect, it } from 'vitest';

import {
  cardCodeAt,
  ean13CheckDigit,
  formatCardNumber,
  formatCode,
  isValidCardNumber,
  type LoyaltyCard,
} from './card';

const card: LoyaltyCard = {
  number: '2994144055423',
  secretHex: [...new TextEncoder().encode('12345678901234567890')]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join(''),
  periodSeconds: 30,
  digits: 6,
};

describe('numer karty', () => {
  it('cyfra kontrolna EAN-13 zgodna z bazą', () => {
    expect(ean13CheckDigit('590123412345')).toBe('7');
    expect(isValidCardNumber('2994144055423')).toBe(true);
    expect(isValidCardNumber('2994144055424')).toBe(false);
    expect(isValidCardNumber('5901234123457')).toBe(false);
  });

  it('formatuje do czytania', () => {
    expect(formatCardNumber('2994144055423')).toBe('2994 1440 5542 3');
    expect(formatCode('287082')).toBe('287 082');
  });
});

describe('cardCodeAt', () => {
  it('składa treść QR w formacie oczekiwanym przez kasę', () => {
    expect(cardCodeAt(card, 59_000)).toEqual({
      payload: 'PS1.2994144055423.287082',
      code: '287082',
      secondsLeft: 1,
    });
  });

  it('zmienia kod co 30 sekund', () => {
    expect(cardCodeAt(card, 0).code).toBe('755224');
    expect(cardCodeAt(card, 29_999).code).toBe('755224');
    expect(cardCodeAt(card, 30_000).code).toBe('287082');
  });
});
