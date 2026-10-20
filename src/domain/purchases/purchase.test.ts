import { describe, expect, it } from 'vitest';

import { formatDateTime, formatMoney } from '../format';
import { canRate, ratingDeadline, tagMood, toPage } from './purchase';

describe('canRate', () => {
  const occurredAt = '2026-10-20T10:00:00.000Z';
  const at = (iso: string) => new Date(iso).getTime();

  it('można ocenić w ciągu okna', () => {
    expect(canRate({ occurredAt, refunded: false }, at('2026-10-27T09:59:59Z'), 7)).toBe(true);
  });

  it('po oknie już nie', () => {
    expect(canRate({ occurredAt, refunded: false }, at('2026-10-27T10:00:00Z'), 7)).toBe(false);
  });

  it('zwróconych zakupów nie ocenia się', () => {
    expect(canRate({ occurredAt, refunded: true }, at('2026-10-20T11:00:00Z'), 7)).toBe(false);
  });

  it('termin to data zakupu plus okno', () => {
    expect(ratingDeadline({ occurredAt }, 7).toISOString()).toBe('2026-10-27T10:00:00.000Z');
  });
});

describe('tagMood', () => {
  it('4 i 5 gwiazdek to pochwała, mniej to uwagi', () => {
    expect(tagMood(5)).toBe('praise');
    expect(tagMood(4)).toBe('praise');
    expect(tagMood(3)).toBe('complaint');
    expect(tagMood(1)).toBe('complaint');
  });
});

describe('toPage', () => {
  it('pobiera o jeden wiersz więcej, żeby wiedzieć o kolejnej stronie', () => {
    const rows = Array.from({ length: 21 }, (_, i) => i);
    expect(toPage(rows, 0)).toEqual({ items: rows.slice(0, 20), nextPage: 1 });
    expect(toPage(rows.slice(0, 5), 3)).toEqual({ items: rows.slice(0, 5), nextPage: null });
  });
});

describe('formatMoney', () => {
  it.each([
    [23.45, '23,45 zł'],
    [0, '0,00 zł'],
    [7, '7,00 zł'],
    [1234.5, '1234,50 zł'],
    [12345.678, '12 345,68 zł'],
    [-3.2, '-3,20 zł'],
  ])('%d → %s', (amount, text) => {
    expect(formatMoney(amount)).toBe(text);
  });
});

describe('formatDateTime', () => {
  const now = new Date(2026, 9, 20, 18, 30);
  const iso = (...args: [number, number, number, number, number]) =>
    new Date(...args).toISOString();

  it('dziś i wczoraj', () => {
    expect(formatDateTime(iso(2026, 9, 20, 7, 5), now)).toBe('Dziś, 7:05');
    expect(formatDateTime(iso(2026, 9, 19, 23, 59), now)).toBe('Wczoraj, 23:59');
  });

  it('w tym roku z godziną, w poprzednich z rokiem', () => {
    expect(formatDateTime(iso(2026, 2, 3, 12, 0), now)).toBe('3 marca, 12:00');
    expect(formatDateTime(iso(2025, 11, 24, 9, 0), now)).toBe('24 grudnia 2025');
  });
});
