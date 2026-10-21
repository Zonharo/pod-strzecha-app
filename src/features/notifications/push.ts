import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router, type Href } from 'expo-router';
import { useEffect, useRef } from 'react';

import { appRoute } from '@/domain/notifications/notifications';
import { container } from '@/infrastructure/container';

export const usePushStatus = () =>
  useQuery({
    queryKey: ['push-status'],
    queryFn: () => container.push.status(),
  });

export const useEnablePush = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => container.push.enable(true),
    onSuccess: (status) => queryClient.setQueryData(['push-status'], status),
  });
};

export const usePushOnLaunch = () => {
  const handled = useRef<string | null>(null);
  const last = container.push.useLastNotificationLink();

  useEffect(() => {
    container.push.enable(false);
  }, []);

  useEffect(() => {
    if (!last || handled.current === last.id) return;
    handled.current = last.id;
    const route = appRoute(last.link);
    if (route) router.push(route as Href);
  }, [last]);
};
