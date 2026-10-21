import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useSession } from '@/features/account';
import { container } from '@/infrastructure/container';

const useUserId = () => {
  const session = useSession();
  return session.status === 'signed_in' ? session.user.id : undefined;
};

export const useUnreadCount = () => {
  const userId = useUserId();
  return useQuery({
    queryKey: ['notifications', userId, 'unread'],
    queryFn: () => container.notifications.unreadCount(),
    enabled: !!userId,
  });
};

export const useNotifications = () => {
  const userId = useUserId();
  return useInfiniteQuery({
    queryKey: ['notifications', userId, 'list'],
    queryFn: ({ pageParam }) => container.notifications.list(pageParam),
    initialPageParam: 0,
    getNextPageParam: (last) => last.nextPage,
    enabled: !!userId,
    staleTime: 0,
  });
};

export const useMarkAllRead = () => {
  const queryClient = useQueryClient();
  const userId = useUserId();
  return useMutation({
    mutationFn: () => container.notifications.markAllRead(),
    onSuccess: () => queryClient.setQueryData(['notifications', userId, 'unread'], 0),
  });
};
