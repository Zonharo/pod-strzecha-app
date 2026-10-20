import type { Customer } from '@/domain/customer/customer';
import type { DomainErrorCode } from '@/domain/errors';
import type { Result } from '@/domain/result';
import type { Store } from '@/domain/stores/store';

export type AuthErrorCode =
  'invalid_code' | 'rate_limited' | 'invalid_email' | 'network' | 'unknown';

export type AuthGateway = {
  sendCode(email: string): Promise<Result<void, AuthErrorCode>>;
  verifyCode(email: string, code: string): Promise<Result<void, AuthErrorCode>>;
  signOut(): Promise<void>;
};

export type CompleteOnboardingCommand = {
  firstName: string;
  homeStoreId: string;
  birthday: { month: number; day: number } | null;
  marketingPush: boolean;
  marketingEmail: boolean;
  termsVersion: string;
};

export type CustomerRepository = {
  findMe(): Promise<Customer | null>;
  completeOnboarding(command: CompleteOnboardingCommand): Promise<Result<void, DomainErrorCode>>;
  acceptTerms(termsVersion: string): Promise<Result<void, DomainErrorCode>>;
  updateMarketing(consents: {
    marketingPush: boolean;
    marketingEmail: boolean;
  }): Promise<Result<void, DomainErrorCode>>;
  updateHomeStore(storeId: string): Promise<Result<void, DomainErrorCode>>;
  deleteAccount(): Promise<Result<void, DomainErrorCode>>;
};

export type ProgramSettings = {
  termsVersion: string;
  welcomeBonus: number;
  pointsPerZloty: number;
  pointsInactivityMonths: number;
  rewardValidDays: number;
};

export type ProgramRepository = {
  getSettings(): Promise<ProgramSettings>;
};

export type StoreRepository = {
  listActive(): Promise<Store[]>;
};
