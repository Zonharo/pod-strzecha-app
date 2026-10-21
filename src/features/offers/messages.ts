import type { DomainErrorCode } from '@/domain/errors';
import { formatMoney } from '@/domain/format';
import type { Coupon } from '@/domain/offers/offers';

const MESSAGES: Partial<Record<DomainErrorCode, string>> = {
  coupon_unavailable: 'Ten kupon jest już niedostępny.',
  coupon_sold_out: 'Te kupony już się skończyły.',
  reward_unavailable: 'Ta nagroda jest już niedostępna.',
  reward_sold_out: 'Ta nagroda chwilowo się skończyła.',
  not_enough_points: 'Masz za mało kłosków na tę nagrodę.',
  too_many_active_rewards: 'Masz już 5 nagród do odebrania. Najpierw odbierz którąś z nich.',
  redemption_not_active: 'Tej nagrody nie da się już anulować.',
  onboarding_required: 'Dokończ zakładanie konta.',
  customer_blocked: 'Twoje konto jest zablokowane.',
  network: 'Brak połączenia z internetem. Spróbuj ponownie.',
};

export const offerErrorMessage = (code: DomainErrorCode): string =>
  MESSAGES[code] ?? 'Coś poszło nie tak. Spróbuj jeszcze raz.';

export const couponConditions = (coupon: Coupon): string[] =>
  [
    coupon.minTotal ? `Przy zakupach od ${formatMoney(coupon.minTotal)}.` : null,
    coupon.limitedToStores ? 'Tylko w wybranych sklepach.' : null,
    coupon.usesPerCustomer > 1 ? `Możesz go użyć ${coupon.usesPerCustomer} razy.` : null,
  ].filter((line): line is string => line !== null);
