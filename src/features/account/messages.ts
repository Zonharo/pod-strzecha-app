import type { AuthErrorCode } from '@/application/ports/account';
import type { AccountError } from '@/application/use-cases/account/account';
import type { DomainErrorCode } from '@/domain/errors';

const GENERIC = 'Coś poszło nie tak. Spróbuj jeszcze raz.';
const NETWORK = 'Brak połączenia z internetem. Sprawdź sieć i spróbuj ponownie.';

const AUTH: Record<AuthErrorCode, string> = {
  invalid_email: 'Sprawdź adres e-mail.',
  invalid_code: 'Ten kod nie pasuje albo już wygasł.',
  rate_limited: 'Za dużo prób. Spróbuj za kilka minut.',
  network: NETWORK,
  server_error: 'Coś nie działa po naszej stronie. Spróbuj za kilka minut.',
  unknown: GENERIC,
};

const VALIDATION: Record<string, string> = {
  first_name_required: 'Wpisz imię.',
  first_name_too_long: 'Imię może mieć najwyżej 40 znaków.',
  store_required: 'Wybierz sklep.',
  birthday_invalid: 'Sprawdź datę urodzin.',
  terms_required: 'Zaakceptuj regulamin, żeby dołączyć.',
};

const DOMAIN: Partial<Record<DomainErrorCode, string>> = {
  not_authenticated: 'Zaloguj się jeszcze raz.',
  customer_blocked: 'Twoje konto jest zablokowane.',
  terms_outdated: 'Regulamin właśnie się zmienił. Spróbuj jeszcze raz.',
  store_invalid: 'Wybierz sklep z listy.',
  birthday_locked: 'Datę urodzin można podać tylko raz.',
  network: NETWORK,
};

export const authErrorMessage = (code: AuthErrorCode): string => AUTH[code];

export const validationMessage = (message: string | undefined): string | null =>
  message ? (VALIDATION[message] ?? GENERIC) : null;

export const accountErrorMessage = (error: AccountError): string =>
  error.kind === 'validation'
    ? (VALIDATION[error.message] ?? GENERIC)
    : (DOMAIN[error.code] ?? GENERIC);
