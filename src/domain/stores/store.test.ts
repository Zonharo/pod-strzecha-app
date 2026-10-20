import { describe, expect, it } from 'vitest';

import { searchStores, storeLabel, type Store } from './store';

const stores: Store[] = [
  { id: '1', code: 'GNW-04', name: 'Gniezno PKP', address: 'Dworcowa 7', city: 'Gniezno' },
  { id: '2', code: 'POZ-35', name: 'Łokietka Netto', address: 'Os. Łokietka 102', city: 'Poznań' },
  {
    id: '3',
    code: 'OKP-42',
    name: 'Swarzędz Dąbrowszczaków',
    address: 'Dąbrowszczaków 9A',
    city: 'Swarzędz',
  },
  {
    id: '4',
    code: 'POZ-01',
    name: 'Aleje Marcinkowskiego',
    address: 'Al. Marcinkowskiego 14/2',
    city: 'Poznań',
  },
];

describe('searchStores', () => {
  it('bez zapytania zwraca wszystkie posortowane po mieście i nazwie', () => {
    expect(searchStores(stores, '  ').map((s) => s.code)).toEqual([
      'GNW-04',
      'POZ-01',
      'POZ-35',
      'OKP-42',
    ]);
  });

  it('ignoruje polskie znaki i wielkość liter', () => {
    expect(searchStores(stores, 'lokietka').map((s) => s.code)).toEqual(['POZ-35']);
    expect(searchStores(stores, 'POZNAN').map((s) => s.code)).toEqual(['POZ-01', 'POZ-35']);
    expect(searchStores(stores, 'swarzedz dabrow').map((s) => s.code)).toEqual(['OKP-42']);
  });

  it('szuka też po adresie', () => {
    expect(searchStores(stores, 'dworcowa').map((s) => s.code)).toEqual(['GNW-04']);
  });

  it('każde słowo musi pasować', () => {
    expect(searchStores(stores, 'gniezno netto')).toEqual([]);
  });
});

describe('storeLabel', () => {
  it('nie powtarza miasta, gdy jest w nazwie', () => {
    expect(storeLabel(stores[0]!)).toBe('Gniezno PKP');
    expect(storeLabel(stores[1]!)).toBe('Poznań, Łokietka Netto');
  });
});
