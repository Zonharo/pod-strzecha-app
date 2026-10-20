import { describe, expect, it } from 'vitest';

import { formatPoints, pointsWord } from './points';

describe('pointsWord', () => {
  it.each([
    [0, 'kłosków'],
    [1, 'kłosek'],
    [2, 'kłoski'],
    [4, 'kłoski'],
    [5, 'kłosków'],
    [11, 'kłosków'],
    [12, 'kłosków'],
    [14, 'kłosków'],
    [21, 'kłosków'],
    [22, 'kłoski'],
    [104, 'kłoski'],
    [112, 'kłosków'],
    [-3, 'kłoski'],
  ])('%i → %s', (count, word) => {
    expect(pointsWord(count)).toBe(word);
  });
});

describe('formatPoints', () => {
  it('łączy liczbę z odmianą', () => {
    expect(formatPoints(50)).toBe('50 kłosków');
    expect(formatPoints(1)).toBe('1 kłosek');
  });
});
