import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { Reward } from '@/domain/offers/offers';
import { useCustomer, useSession } from '@/features/account';
import { container } from '@/infrastructure/container';

const useUserId = () => {
  const session = useSession();
  return session.status === 'signed_in' ? session.user.id : undefined;
};

export const useCoupons = () => {
  const userId = useUserId();
  const customer = useCustomer();
  const storeId = customer?.homeStoreId ?? null;
  return useQuery({
    queryKey: ['coupons', userId, storeId],
    queryFn: () => container.offers.listCoupons(storeId, Date.now()),
    enabled: !!userId,
  });
};

export const useRewards = () => {
  const userId = useUserId();
  return useQuery({
    queryKey: ['rewards', userId],
    queryFn: () => container.offers.listRewards(Date.now()),
    enabled: !!userId,
  });
};

export const useActivateCoupon = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (couponId: string) => container.offers.activateCoupon(couponId),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['coupons'] }),
  });
};

export const useRedeemReward = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ reward, balance }: { reward: Reward; balance: number }) =>
      container.offers.redeemReward(reward, balance),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['rewards'] });
      queryClient.invalidateQueries({ queryKey: ['account'] });
      queryClient.invalidateQueries({ queryKey: ['points-history'] });
    },
  });
};

export const useCancelRedemption = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (redemptionId: string) => container.offers.cancelRedemption(redemptionId),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['rewards'] });
      queryClient.invalidateQueries({ queryKey: ['account'] });
      queryClient.invalidateQueries({ queryKey: ['points-history'] });
    },
  });
};
