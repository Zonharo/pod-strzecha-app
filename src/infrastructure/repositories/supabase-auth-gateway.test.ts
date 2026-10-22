import { describe, expect, it } from 'vitest';

import { toAuthErrorCode } from './supabase-auth-gateway';

const error = (overrides: Partial<Parameters<typeof toAuthErrorCode>[0]>) => ({
  name: 'AuthApiError',
  status: 400,
  code: undefined,
  message: '',
  ...overrides,
});

describe('toAuthErrorCode', () => {
  it('błąd serwera przy wysyłce e-maila to nie brak internetu', () => {
    expect(
      toAuthErrorCode(
        error({ name: 'AuthRetryableFetchError', status: 500, message: 'Error sending email' }),
      ),
    ).toBe('server_error');
  });

  it('prawdziwy brak sieci', () => {
    expect(
      toAuthErrorCode(
        error({ name: 'AuthRetryableFetchError', status: 0, message: 'Network request failed' }),
      ),
    ).toBe('network');
  });

  it('limit, zły kod i zły adres', () => {
    expect(toAuthErrorCode(error({ status: 429 }))).toBe('rate_limited');
    expect(toAuthErrorCode(error({ code: 'otp_expired' }))).toBe('invalid_code');
    expect(toAuthErrorCode(error({ code: 'email_address_invalid' }))).toBe('invalid_email');
  });
});
