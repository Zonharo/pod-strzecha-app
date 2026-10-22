import { z } from 'zod';

import { isValidBirthday } from '@/domain/customer/customer';

export const emailSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.email({ message: 'invalid_email' }).max(254, { message: 'invalid_email' })),
});

export type EmailInput = z.input<typeof emailSchema>;

export const CODE_MIN_LENGTH = 6;
export const CODE_MAX_LENGTH = 10;

export const codeSchema = z.object({
  email: emailSchema.shape.email,
  code: z
    .string()
    .trim()
    .regex(/^[0-9]{6,10}$/, { message: 'invalid_code' }),
});

export type CodeInput = z.input<typeof codeSchema>;

const optionalNumber = z.preprocess(
  (value) => (value === '' || value === null || value === undefined ? undefined : Number(value)),
  z.number().int().optional(),
);

export const onboardingSchema = z
  .object({
    firstName: z
      .string()
      .trim()
      .min(1, { message: 'first_name_required' })
      .max(40, { message: 'first_name_too_long' }),
    homeStoreId: z.uuid({ message: 'store_required' }),
    birthdayDay: optionalNumber,
    birthdayMonth: optionalNumber,
    marketingPush: z.boolean(),
    marketingEmail: z.boolean(),
    acceptTerms: z.boolean().refine((value) => value, { message: 'terms_required' }),
  })
  .superRefine((value, ctx) => {
    const { birthdayDay: day, birthdayMonth: month } = value;
    if (day === undefined && month === undefined) return;
    if (day === undefined || month === undefined || !isValidBirthday({ day, month })) {
      ctx.addIssue({ code: 'custom', path: ['birthdayDay'], message: 'birthday_invalid' });
    }
  });

export type OnboardingInput = z.input<typeof onboardingSchema>;
export type OnboardingValues = z.output<typeof onboardingSchema>;

export const marketingSchema = z.object({
  marketingPush: z.boolean(),
  marketingEmail: z.boolean(),
});

export type MarketingInput = z.infer<typeof marketingSchema>;
