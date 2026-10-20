import { describe, expect, it, vi } from 'vitest';

import { aCustomer, fakeAuth, fakeCustomers, fakeProgram } from '@/application/testing/fakes';
import { err } from '@/domain/result';

import { makeCompleteOnboarding, makeDeleteAccount, makeGetAccountState } from './account';

const validInput = {
  firstName: '  Ala ',
  homeStoreId: '0b9c6a6e-3a51-4c6f-9f63-2f2b8ad0d002',
  birthdayDay: '',
  birthdayMonth: '',
  marketingPush: true,
  marketingEmail: false,
  acceptTerms: true,
};

describe('makeGetAccountState', () => {
  it('bez klienta zwraca null', async () => {
    const run = makeGetAccountState({ customers: fakeCustomers(null), program: fakeProgram() });
    expect(await run()).toBeNull();
  });

  it('wykrywa nowy regulamin', async () => {
    const run = makeGetAccountState({
      customers: fakeCustomers(aCustomer()),
      program: fakeProgram({ termsVersion: '2027-01-01' }),
    });
    expect(await run()).toEqual({ kind: 'needs_terms', termsVersion: '2027-01-01' });
  });
});

describe('makeCompleteOnboarding', () => {
  it('przycina imię, pomija puste urodziny i bierze wersję regulaminu z ustawień', async () => {
    const customers = fakeCustomers();
    const result = await makeCompleteOnboarding({ customers, program: fakeProgram() })(validInput);
    expect(result.ok).toBe(true);
    expect(customers.completeOnboarding).toHaveBeenCalledWith({
      firstName: 'Ala',
      homeStoreId: validInput.homeStoreId,
      birthday: null,
      marketingPush: true,
      marketingEmail: false,
      termsVersion: '2026-10-20',
    });
  });

  it('przekazuje poprawne urodziny', async () => {
    const customers = fakeCustomers();
    await makeCompleteOnboarding({ customers, program: fakeProgram() })({
      ...validInput,
      birthdayDay: '29',
      birthdayMonth: '2',
    });
    expect(vi.mocked(customers.completeOnboarding).mock.calls[0]?.[0].birthday).toEqual({
      day: 29,
      month: 2,
    });
  });

  it.each([
    [{ firstName: '   ' }, 'firstName', 'first_name_required'],
    [{ homeStoreId: '' }, 'homeStoreId', 'store_required'],
    [{ acceptTerms: false }, 'acceptTerms', 'terms_required'],
    [{ birthdayDay: '31', birthdayMonth: '4' }, 'birthdayDay', 'birthday_invalid'],
    [{ birthdayDay: '12', birthdayMonth: '' }, 'birthdayDay', 'birthday_invalid'],
  ])('walidacja %o', async (override, field, message) => {
    const customers = fakeCustomers();
    const result = await makeCompleteOnboarding({ customers, program: fakeProgram() })({
      ...validInput,
      ...override,
    } as typeof validInput);
    expect(result).toEqual(err({ kind: 'validation', field, message }));
    expect(customers.completeOnboarding).not.toHaveBeenCalled();
  });

  it('przekazuje błąd z bazy', async () => {
    const customers = fakeCustomers();
    vi.mocked(customers.completeOnboarding).mockResolvedValueOnce(err('store_invalid'));
    const result = await makeCompleteOnboarding({ customers, program: fakeProgram() })(validInput);
    expect(result).toEqual(err({ kind: 'domain', code: 'store_invalid' }));
  });
});

describe('makeDeleteAccount', () => {
  it('usuwa konto i wylogowuje', async () => {
    const customers = fakeCustomers();
    const auth = fakeAuth();
    expect((await makeDeleteAccount({ customers, auth })()).ok).toBe(true);
    expect(auth.signOut).toHaveBeenCalled();
  });

  it('nie wylogowuje, gdy usunięcie się nie udało', async () => {
    const customers = fakeCustomers();
    vi.mocked(customers.deleteAccount).mockResolvedValueOnce(err('network'));
    const auth = fakeAuth();
    expect(await makeDeleteAccount({ customers, auth })()).toEqual(
      err({ kind: 'domain', code: 'network' }),
    );
    expect(auth.signOut).not.toHaveBeenCalled();
  });
});
