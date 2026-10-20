import { describe, expect, it, vi } from 'vitest';

import { fakeAuth } from '@/application/testing/fakes';
import { err } from '@/domain/result';

import { makeSendLoginCode, makeVerifyLoginCode } from './auth';

describe('makeSendLoginCode', () => {
  it('normalizuje adres i wysyła kod', async () => {
    const auth = fakeAuth();
    const result = await makeSendLoginCode({ auth })({ email: '  Ala@Example.COM ' });
    expect(result).toEqual({ ok: true, value: { email: 'ala@example.com' } });
    expect(auth.sendCode).toHaveBeenCalledWith('ala@example.com');
  });

  it('odrzuca zły adres bez wywołania serwera', async () => {
    const auth = fakeAuth();
    const result = await makeSendLoginCode({ auth })({ email: 'ala@' });
    expect(result).toEqual(err('invalid_email'));
    expect(auth.sendCode).not.toHaveBeenCalled();
  });

  it('przekazuje błąd limitu wysyłki', async () => {
    const auth = fakeAuth();
    vi.mocked(auth.sendCode).mockResolvedValueOnce(err('rate_limited'));
    expect(await makeSendLoginCode({ auth })({ email: 'ala@example.com' })).toEqual(
      err('rate_limited'),
    );
  });
});

describe('makeVerifyLoginCode', () => {
  it('weryfikuje 6 cyfr', async () => {
    const auth = fakeAuth();
    const result = await makeVerifyLoginCode({ auth })({
      email: 'ala@example.com',
      code: ' 123456 ',
    });
    expect(result.ok).toBe(true);
    expect(auth.verifyCode).toHaveBeenCalledWith('ala@example.com', '123456');
  });

  it.each(['12345', '1234567', 'abcdef', ''])('odrzuca kod %j', async (code) => {
    const auth = fakeAuth();
    expect(await makeVerifyLoginCode({ auth })({ email: 'ala@example.com', code })).toEqual(
      err('invalid_code'),
    );
    expect(auth.verifyCode).not.toHaveBeenCalled();
  });
});
