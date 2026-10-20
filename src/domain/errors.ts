export const DOMAIN_ERROR_CODES = [
  'not_authenticated',
  'customer_blocked',
  'onboarding_required',
  'terms_outdated',
  'store_invalid',
  'birthday_locked',
  'card_not_found',
  'coupon_unavailable',
  'coupon_sold_out',
  'reward_unavailable',
  'reward_sold_out',
  'not_enough_points',
  'too_many_active_rewards',
  'redemption_not_active',
  'purchase_not_found',
  'rating_closed',
] as const;

export type DomainErrorCode = (typeof DOMAIN_ERROR_CODES)[number] | 'network' | 'unknown';

export const toDomainErrorCode = (hint: string | null | undefined): DomainErrorCode =>
  (DOMAIN_ERROR_CODES as readonly string[]).includes(hint ?? '')
    ? (hint as DomainErrorCode)
    : 'unknown';
