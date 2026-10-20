import { toDomainErrorCode, type DomainErrorCode } from '@/domain/errors';
import { err, ok, type Result } from '@/domain/result';

type PostgrestLikeError = { code?: string; hint?: string | null; message?: string } | null;

const isNetworkError = (error: { message?: string }): boolean =>
  /network request failed|fetch failed|timeout/i.test(error.message ?? '');

export const toResult = (error: PostgrestLikeError): Result<void, DomainErrorCode> => {
  if (!error) return ok(undefined);
  if (error.code === 'P0001') return err(toDomainErrorCode(error.hint));
  if (isNetworkError(error)) return err('network');
  return err('unknown');
};
