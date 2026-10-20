import { describe, expect, it } from 'vitest';

import { accountStateOf, formatBirthday, isValidBirthday, type Customer } from './customer';

const customer = (overrides: Partial<Customer> = {}): Customer => ({
  id: 'c1',
  email: 'ala@example.com',
  firstName: 'Ala',
  homeStoreId: 's1',
  homeStoreName: 'Gniezno PKP',
  birthday: null,
  pointsBalance: 50,
  lifetimePoints: 50,
  termsVersion: '2026-10-20',
  marketingPush: false,
  marketingEmail: false,
  status: 'active',
  ...overrides,
});

describe('accountStateOf', () => {
  it('nowe konto wymaga dokończenia rejestracji', () => {
    expect(accountStateOf(customer({ termsVersion: null, firstName: null }), '2026-10-20')).toEqual(
      { kind: 'needs_onboarding' },
    );
  });

  it('nowy regulamin wymaga akceptacji', () => {
    expect(accountStateOf(customer(), '2027-01-01')).toEqual({
      kind: 'needs_terms',
      termsVersion: '2027-01-01',
    });
  });

  it('zablokowane konto ma pierwszeństwo', () => {
    expect(accountStateOf(customer({ status: 'blocked' }), '2026-10-20')).toEqual({
      kind: 'blocked',
    });
  });

  it('gotowe konto zwraca klienta', () => {
    const c = customer();
    expect(accountStateOf(c, '2026-10-20')).toEqual({ kind: 'ready', customer: c });
  });
});

describe('isValidBirthday', () => {
  it.each([
    [{ month: 2, day: 29 }, true],
    [{ month: 2, day: 30 }, false],
    [{ month: 4, day: 31 }, false],
    [{ month: 12, day: 31 }, true],
    [{ month: 13, day: 1 }, false],
    [{ month: 0, day: 1 }, false],
    [{ month: 5, day: 0 }, false],
    [{ month: 5.5, day: 1 }, false],
  ])('%o → %s', (birthday, valid) => {
    expect(isValidBirthday(birthday)).toBe(valid);
  });
});

describe('formatBirthday', () => {
  it('odmienia miesiąc', () => {
    expect(formatBirthday({ month: 3, day: 15 })).toBe('15 marca');
  });
});
