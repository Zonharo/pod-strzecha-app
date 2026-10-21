import { pluralPl } from '../format';

export const pointsWord = (count: number): string => pluralPl(count, 'kłosek', 'kłoski', 'kłosków');

export const formatPoints = (count: number): string =>
  `${Math.trunc(count).toLocaleString('pl-PL')} ${pointsWord(count)}`;
