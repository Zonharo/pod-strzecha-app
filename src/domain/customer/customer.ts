import { MONTHS_GENITIVE } from '../format';

export type Birthday = { month: number; day: number };

export type Customer = {
  id: string;
  email: string | null;
  firstName: string | null;
  homeStoreId: string | null;
  homeStoreName: string | null;
  birthday: Birthday | null;
  pointsBalance: number;
  lifetimePoints: number;
  termsVersion: string | null;
  marketingPush: boolean;
  marketingEmail: boolean;
  status: 'active' | 'blocked';
};

export type AccountState =
  | { kind: 'blocked' }
  | { kind: 'needs_onboarding' }
  | { kind: 'needs_terms'; termsVersion: string }
  | { kind: 'ready'; customer: Customer };

export const accountStateOf = (customer: Customer, currentTermsVersion: string): AccountState => {
  if (customer.status === 'blocked') return { kind: 'blocked' };
  if (!customer.termsVersion || !customer.firstName) return { kind: 'needs_onboarding' };
  if (customer.termsVersion !== currentTermsVersion) {
    return { kind: 'needs_terms', termsVersion: currentTermsVersion };
  }
  return { kind: 'ready', customer };
};

const DAYS_IN_MONTH = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

export const isValidBirthday = ({ month, day }: Birthday): boolean => {
  if (!Number.isInteger(month) || !Number.isInteger(day)) return false;
  const max = DAYS_IN_MONTH[month - 1];
  return max !== undefined && day >= 1 && day <= max;
};

export const formatBirthday = ({ month, day }: Birthday): string =>
  `${day} ${MONTHS_GENITIVE[month - 1]}`;
