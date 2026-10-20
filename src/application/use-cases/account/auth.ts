import {
  codeSchema,
  emailSchema,
  type CodeInput,
  type EmailInput,
} from '@/application/dto/account';
import type { AuthErrorCode, AuthGateway, LocalCache } from '@/application/ports/account';
import { err, ok, type Result } from '@/domain/result';

export const makeSendLoginCode =
  ({ auth }: { auth: AuthGateway }) =>
  async (input: EmailInput): Promise<Result<{ email: string }, AuthErrorCode>> => {
    const parsed = emailSchema.safeParse(input);
    if (!parsed.success) return err('invalid_email');
    const sent = await auth.sendCode(parsed.data.email);
    return sent.ok ? ok({ email: parsed.data.email }) : sent;
  };

export const makeVerifyLoginCode =
  ({ auth }: { auth: AuthGateway }) =>
  async (input: CodeInput): Promise<Result<void, AuthErrorCode>> => {
    const parsed = codeSchema.safeParse(input);
    if (!parsed.success) {
      return err(
        parsed.error.issues.some((i) => i.path[0] === 'email') ? 'invalid_email' : 'invalid_code',
      );
    }
    return auth.verifyCode(parsed.data.email, parsed.data.code);
  };

export const makeSignOut =
  ({ auth, caches }: { auth: AuthGateway; caches: LocalCache[] }) =>
  async (): Promise<void> => {
    await Promise.allSettled(caches.map((cache) => cache.clear()));
    await auth.signOut();
  };
