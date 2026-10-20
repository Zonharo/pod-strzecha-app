import { useQuery, useQueryClient } from '@tanstack/react-query';

import type { Customer } from '@/domain/customer/customer';
import { container } from '@/infrastructure/container';

import { useSession } from './session';

export const accountKey = (userId: string | undefined) => ['account', userId] as const;

export const useAccountState = () => {
  const session = useSession();
  const userId = session.status === 'signed_in' ? session.user.id : undefined;
  return useQuery({
    queryKey: accountKey(userId),
    queryFn: () => container.account.getState(),
    enabled: !!userId,
  });
};

export const useCustomer = (): Customer | null => {
  const { data } = useAccountState();
  return data?.kind === 'ready' ? data.customer : null;
};

export const useRefreshAccount = () => {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ['account'] });
};

export const useProgramSettings = () =>
  useQuery({
    queryKey: ['program-settings'],
    queryFn: () => container.program.getSettings(),
    staleTime: 10 * 60_000,
  });

export const useStores = () =>
  useQuery({
    queryKey: ['stores'],
    queryFn: () => container.stores.listActive(),
    staleTime: 60 * 60_000,
  });
