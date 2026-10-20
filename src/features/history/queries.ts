import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { RatingInput } from '@/application/dto/purchases';
import { useSession } from '@/features/account';
import { container } from '@/infrastructure/container';

const useUserId = () => {
  const session = useSession();
  return session.status === 'signed_in' ? session.user.id : undefined;
};

export const usePurchases = () => {
  const userId = useUserId();
  return useInfiniteQuery({
    queryKey: ['purchases', userId],
    queryFn: ({ pageParam }) => container.purchases.list(pageParam),
    initialPageParam: 0,
    getNextPageParam: (last) => last.nextPage,
    enabled: !!userId,
  });
};

export const usePointsHistory = () => {
  const userId = useUserId();
  return useInfiniteQuery({
    queryKey: ['points-history', userId],
    queryFn: ({ pageParam }) => container.purchases.pointsHistory(pageParam),
    initialPageParam: 0,
    getNextPageParam: (last) => last.nextPage,
    enabled: !!userId,
  });
};

export const usePurchase = (id: string | undefined) => {
  const userId = useUserId();
  return useQuery({
    queryKey: ['purchases', userId, 'detail', id],
    queryFn: () => container.purchases.get(id!),
    enabled: !!userId && !!id,
  });
};

export const useRatePurchase = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: RatingInput) => container.purchases.rate(input),
    onSuccess: (result) => {
      if (result.ok) queryClient.invalidateQueries({ queryKey: ['purchases'] });
    },
  });
};
