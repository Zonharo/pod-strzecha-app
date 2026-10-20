import { vi } from 'vitest';

import type {
  AuthGateway,
  CustomerRepository,
  ProgramRepository,
  ProgramSettings,
} from '@/application/ports/account';
import type { Customer } from '@/domain/customer/customer';
import { ok } from '@/domain/result';

export const settings: ProgramSettings = {
  termsVersion: '2026-10-20',
  welcomeBonus: 50,
  pointsPerZloty: 1,
  pointsInactivityMonths: 12,
  rewardValidDays: 14,
};

export const aCustomer = (overrides: Partial<Customer> = {}): Customer => ({
  id: '0b9c6a6e-3a51-4c6f-9f63-2f2b8ad0d001',
  email: 'ala@example.com',
  firstName: 'Ala',
  homeStoreId: '0b9c6a6e-3a51-4c6f-9f63-2f2b8ad0d002',
  homeStoreName: 'Gniezno PKP',
  birthday: null,
  pointsBalance: 50,
  lifetimePoints: 50,
  termsVersion: settings.termsVersion,
  marketingPush: false,
  marketingEmail: false,
  status: 'active',
  ...overrides,
});

export const fakeAuth = (): AuthGateway => ({
  sendCode: vi.fn(async () => ok(undefined)),
  verifyCode: vi.fn(async () => ok(undefined)),
  signOut: vi.fn(async () => undefined),
});

export const fakeCustomers = (customer: Customer | null = aCustomer()): CustomerRepository => ({
  findMe: vi.fn(async () => customer),
  completeOnboarding: vi.fn(async () => ok(undefined)),
  acceptTerms: vi.fn(async () => ok(undefined)),
  updateMarketing: vi.fn(async () => ok(undefined)),
  updateHomeStore: vi.fn(async () => ok(undefined)),
  deleteAccount: vi.fn(async () => ok(undefined)),
});

export const fakeProgram = (overrides: Partial<ProgramSettings> = {}): ProgramRepository => ({
  getSettings: vi.fn(async () => ({ ...settings, ...overrides })),
});
