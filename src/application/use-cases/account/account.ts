import {
  marketingSchema,
  onboardingSchema,
  type MarketingInput,
  type OnboardingInput,
} from '@/application/dto/account';
import type { CustomerRepository, ProgramRepository } from '@/application/ports/account';
import { accountStateOf, type AccountState } from '@/domain/customer/customer';
import type { DomainErrorCode } from '@/domain/errors';
import { err, ok, type Result } from '@/domain/result';

export type ValidationError = { kind: 'validation'; field: string; message: string };
export type AccountError = ValidationError | { kind: 'domain'; code: DomainErrorCode };

const domainError = (code: DomainErrorCode): AccountError => ({ kind: 'domain', code });

export const makeGetAccountState =
  ({ customers, program }: { customers: CustomerRepository; program: ProgramRepository }) =>
  async (): Promise<AccountState | null> => {
    const [customer, settings] = await Promise.all([customers.findMe(), program.getSettings()]);
    return customer ? accountStateOf(customer, settings.termsVersion) : null;
  };

export const makeCompleteOnboarding =
  ({ customers, program }: { customers: CustomerRepository; program: ProgramRepository }) =>
  async (input: OnboardingInput): Promise<Result<void, AccountError>> => {
    const parsed = onboardingSchema.safeParse(input);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      return err({
        kind: 'validation',
        field: String(issue?.path[0] ?? ''),
        message: issue?.message ?? 'invalid',
      });
    }
    const values = parsed.data;
    const { termsVersion } = await program.getSettings();
    const result = await customers.completeOnboarding({
      firstName: values.firstName,
      homeStoreId: values.homeStoreId,
      birthday:
        values.birthdayDay !== undefined && values.birthdayMonth !== undefined
          ? { day: values.birthdayDay, month: values.birthdayMonth }
          : null,
      marketingPush: values.marketingPush,
      marketingEmail: values.marketingEmail,
      termsVersion,
    });
    return result.ok ? ok(undefined) : err(domainError(result.error));
  };

export const makeAcceptTerms =
  ({ customers }: { customers: CustomerRepository }) =>
  async (termsVersion: string): Promise<Result<void, AccountError>> => {
    const result = await customers.acceptTerms(termsVersion);
    return result.ok ? ok(undefined) : err(domainError(result.error));
  };

export const makeUpdateMarketing =
  ({ customers }: { customers: CustomerRepository }) =>
  async (input: MarketingInput): Promise<Result<void, AccountError>> => {
    const parsed = marketingSchema.safeParse(input);
    if (!parsed.success) return err({ kind: 'validation', field: '', message: 'invalid' });
    const result = await customers.updateMarketing(parsed.data);
    return result.ok ? ok(undefined) : err(domainError(result.error));
  };

export const makeUpdateHomeStore =
  ({ customers }: { customers: CustomerRepository }) =>
  async (storeId: string): Promise<Result<void, AccountError>> => {
    const result = await customers.updateHomeStore(storeId);
    return result.ok ? ok(undefined) : err(domainError(result.error));
  };

export const makeDeleteAccount =
  ({ customers, signOut }: { customers: CustomerRepository; signOut: () => Promise<void> }) =>
  async (): Promise<Result<void, AccountError>> => {
    const result = await customers.deleteAccount();
    if (!result.ok) return err(domainError(result.error));
    await signOut();
    return ok(undefined);
  };
