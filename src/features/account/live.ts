import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { container } from '@/infrastructure/container';

import { useSession } from './session';

export const useLiveAccount = () => {
  const session = useSession();
  const queryClient = useQueryClient();
  const userId = session.status === 'signed_in' ? session.user.id : null;

  useEffect(() => {
    if (!userId) return;
    return container.realtime.watchCustomer(userId, () => {
      queryClient.invalidateQueries({ queryKey: ['account'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    });
  }, [userId, queryClient]);
};
