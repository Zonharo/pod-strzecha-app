import { hexToBytes, secondsUntilNextCode, totp, type TotpConfig } from './totp';

export type LoyaltyCard = {
  number: string;
  secretHex: string;
} & TotpConfig;

export type CardCode = {
  payload: string;
  code: string;
  secondsLeft: number;
};

const CARD_NUMBER = /^29[0-9]{11}$/;

export const ean13CheckDigit = (first12: string): string => {
  const sum = [...first12].reduce(
    (acc, digit, index) => acc + Number(digit) * (index % 2 === 0 ? 1 : 3),
    0,
  );
  return String((10 - (sum % 10)) % 10);
};

export const isValidCardNumber = (number: string): boolean =>
  CARD_NUMBER.test(number) && ean13CheckDigit(number.slice(0, 12)) === number.slice(12);

export const cardCodeAt = (card: LoyaltyCard, nowMs: number): CardCode => {
  const code = totp(hexToBytes(card.secretHex), nowMs, card);
  return {
    payload: `PS1.${card.number}.${code}`,
    code,
    secondsLeft: secondsUntilNextCode(nowMs, card.periodSeconds),
  };
};

export const formatCardNumber = (number: string): string =>
  number.replace(/^(\d{4})(\d{4})(\d{4})(\d)$/, '$1 $2 $3 $4');

export const formatCode = (code: string): string => code.replace(/^(\d{3})(\d{3})$/, '$1 $2');
