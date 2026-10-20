export const pointsWord = (count: number): string => {
  const n = Math.abs(Math.trunc(count));
  if (n === 1) return 'kłosek';
  const lastDigit = n % 10;
  const lastTwo = n % 100;
  if (lastDigit >= 2 && lastDigit <= 4 && (lastTwo < 12 || lastTwo > 14)) return 'kłoski';
  return 'kłosków';
};

export const formatPoints = (count: number): string =>
  `${Math.trunc(count).toLocaleString('pl-PL')} ${pointsWord(count)}`;
