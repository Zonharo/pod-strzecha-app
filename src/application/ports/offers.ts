import type { DomainErrorCode } from '@/domain/errors';
import type { Coupon, CustomerCoupon, Offer, Redemption, Reward } from '@/domain/offers/offers';
import type { Result } from '@/domain/result';

export type OfferRepository = {
  availableCoupons(storeId: string | null): Promise<Coupon[]>;
  myCoupons(): Promise<CustomerCoupon[]>;
  activateCoupon(couponId: string): Promise<Result<string, DomainErrorCode>>;
  rewards(): Promise<Reward[]>;
  myRedemptions(): Promise<Redemption[]>;
  redeemReward(rewardId: string): Promise<Result<string, DomainErrorCode>>;
  cancelRedemption(redemptionId: string): Promise<Result<void, DomainErrorCode>>;
  offersForStore(storeId: string | null): Promise<Offer[]>;
};
