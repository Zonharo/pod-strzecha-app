import type { AuthError } from '@supabase/supabase-js';

import type { AuthErrorCode, AuthGateway } from '@/application/ports/account';
import { err, ok } from '@/domain/result';
import type { SupabaseClient } from '@/infrastructure/supabase/client';

const toAuthErrorCode = (error: AuthError): AuthErrorCode => {
  if (error.status === 429 || /rate_limit/.test(error.code ?? '')) return 'rate_limited';
  if (['otp_expired', 'invalid_credentials'].includes(error.code ?? '') || error.status === 403) {
    return 'invalid_code';
  }
  if (['email_address_invalid', 'validation_failed'].includes(error.code ?? '')) {
    return 'invalid_email';
  }
  if (error.name === 'AuthRetryableFetchError' || /network/i.test(error.message)) return 'network';
  return 'unknown';
};

export const makeSupabaseAuthGateway = (supabase: SupabaseClient): AuthGateway => ({
  async sendCode(email) {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });
    return error ? err(toAuthErrorCode(error)) : ok(undefined);
  },

  async verifyCode(email, code) {
    const { error } = await supabase.auth.verifyOtp({ email, token: code, type: 'email' });
    return error ? err(toAuthErrorCode(error)) : ok(undefined);
  },

  async signOut() {
    await supabase.auth.signOut({ scope: 'local' });
  },
});
