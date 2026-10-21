import type { OfferRepository } from '@/application/ports/offers';
import type { DomainErrorCode } from '@/domain/errors';
import {
  isSoldOut,
  splitCoupons,
  type Coupon,
  type CustomerCoupon,
  type Redemption,
  type Reward,
} from '@/domain/offers/offers';
import { err, type Result } from '@/domain/result';

export type CouponsView = { active: CustomerCoupon[]; toActivate: Coupon[] };

export type RewardsView = { rewards: Reward[]; waiting: Redemption[] };

export const makeListCoupons =
  ({ offers }: { offers: OfferRepository }) =>
  async (storeId: string | null, nowMs: number): Promise<CouponsView> => {
    const [available, owned] = await Promise.all([
      offers.availableCoupons(storeId),
      offers.myCoupons(),
    ]);
    return splitCoupons(available, owned, nowMs);
  };

export const makeActivateCoupon =
  ({ offers }: { offers: OfferRepository }) =>
  (couponId: string): Promise<Result<string, DomainErrorCode>> =>
    offers.activateCoupon(couponId);

export const makeListRewards =
  ({ offers }: { offers: OfferRepository }) =>
  async (nowMs: number): Promise<RewardsView> => {
    const [rewards, redemptions] = await Promise.all([offers.rewards(), offers.myRedemptions()]);
    return {
      rewards: [...rewards].sort((a, b) => a.pointsCost - b.pointsCost),
      waiting: redemptions
        .filter((r) => r.status === 'active' && new Date(r.expiresAt).getTime() > nowMs)
        .sort((a, b) => a.expiresAt.localeCompare(b.expiresAt)),
    };
  };

export const makeRedeemReward =
  ({ offers }: { offers: OfferRepository }) =>
  async (reward: Reward, balance: number): Promise<Result<string, DomainErrorCode>> => {
    if (isSoldOut(reward)) return err('reward_sold_out');
    if (balance < reward.pointsCost) return err('not_enough_points');
    return offers.redeemReward(reward.id);
  };

export const makeCancelRedemption =
  ({ offers }: { offers: OfferRepository }) =>
  (redemptionId: string): Promise<Result<void, DomainErrorCode>> =>
    offers.cancelRedemption(redemptionId);

export const makeListOffers =
  ({ offers }: { offers: OfferRepository }) =>
  (storeId: string | null) =>
    offers.offersForStore(storeId);
