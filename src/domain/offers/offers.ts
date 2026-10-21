import { formatMoney, MONTHS_GENITIVE } from '../format';
import { formatPoints } from '../points/points';

export type BenefitKind =
  'percent_off' | 'amount_off' | 'fixed_price' | 'free_item' | 'bonus_points' | 'points_multiplier';

export type Benefit = { kind: BenefitKind; value: number | null };

export type Coupon = {
  id: string;
  title: string;
  description: string;
  terms: string;
  imageUrl: string | null;
  benefit: Benefit;
  minTotal: number | null;
  limitedToStores: boolean;
  startsAt: string;
  endsAt: string;
  usesPerCustomer: number;
};

export type CustomerCoupon = {
  id: string;
  source: 'activated' | 'birthday' | 'gift';
  usesLeft: number;
  validFrom: string;
  validUntil: string;
  coupon: Coupon;
};

export type Reward = {
  id: string;
  title: string;
  description: string;
  terms: string;
  imageUrl: string | null;
  pointsCost: number;
  benefit: Benefit;
  stock: number | null;
};

export type Redemption = {
  id: string;
  status: 'active' | 'used' | 'expired' | 'cancelled';
  pointsSpent: number;
  createdAt: string;
  expiresAt: string;
  usedAt: string | null;
  reward: Pick<Reward, 'id' | 'title' | 'description' | 'imageUrl' | 'benefit'>;
};

const formatNumber = (value: number) =>
  Number.isInteger(value) ? String(value) : String(value).replace('.', ',');

export const benefitLabel = ({ kind, value }: Benefit): string => {
  switch (kind) {
    case 'percent_off':
      return `-${formatNumber(value ?? 0)}%`;
    case 'amount_off':
      return `-${formatMoney(value ?? 0)}`;
    case 'fixed_price':
      return `za ${formatMoney(value ?? 0)}`;
    case 'free_item':
      return 'Gratis';
    case 'bonus_points':
      return `+${formatPoints(value ?? 0)}`;
    case 'points_multiplier':
      return `Kłoski ×${formatNumber(value ?? 1)}`;
  }
};

const DAY_MS = 86_400_000;

export const isCouponUsable = (coupon: CustomerCoupon, nowMs: number): boolean =>
  coupon.usesLeft > 0 &&
  nowMs >= new Date(coupon.validFrom).getTime() &&
  nowMs < new Date(coupon.validUntil).getTime();

export const validityLabel = (untilIso: string, nowMs: number): string => {
  const until = new Date(untilIso);
  const msLeft = until.getTime() - nowMs;
  if (msLeft <= 0) return 'Wygasł';
  if (msLeft < DAY_MS) {
    const hours = Math.max(1, Math.ceil(msLeft / 3_600_000));
    return hours === 1 ? 'Wygasa w ciągu godziny' : `Wygasa za ${hours} godz.`;
  }
  const days = Math.ceil(msLeft / DAY_MS);
  if (days <= 3) return days === 1 ? 'Ostatni dzień' : `Zostały ${days} dni`;
  return `Ważny do ${until.getDate()} ${MONTHS_GENITIVE[until.getMonth()]}`;
};

export const splitCoupons = (
  available: readonly Coupon[],
  owned: readonly CustomerCoupon[],
  nowMs: number,
): { active: CustomerCoupon[]; toActivate: Coupon[] } => {
  const ownedIds = new Set(owned.filter((c) => c.source === 'activated').map((c) => c.coupon.id));
  return {
    active: owned
      .filter((c) => isCouponUsable(c, nowMs))
      .sort((a, b) => a.validUntil.localeCompare(b.validUntil)),
    toActivate: available.filter((c) => !ownedIds.has(c.id)),
  };
};

export const pointsMissing = (balance: number, reward: Pick<Reward, 'pointsCost'>): number =>
  Math.max(0, reward.pointsCost - balance);

export const rewardProgress = (balance: number, reward: Pick<Reward, 'pointsCost'>): number =>
  Math.min(1, Math.max(0, balance / reward.pointsCost));

export const isSoldOut = (reward: Pick<Reward, 'stock'>): boolean =>
  reward.stock !== null && reward.stock <= 0;
