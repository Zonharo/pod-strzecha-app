import { useQuery } from '@tanstack/react-query';
import * as Brightness from 'expo-brightness';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { AppState, Platform } from 'react-native';

import { useSession } from '@/features/account';
import { container } from '@/infrastructure/container';

export const useCard = () => {
  const session = useSession();
  const userId = session.status === 'signed_in' ? session.user.id : undefined;
  return useQuery({
    queryKey: ['card', userId],
    queryFn: () => container.card.get(userId!),
    enabled: !!userId,
    staleTime: 5 * 60_000,
    retry: false,
  });
};

export const useNow = (intervalMs = 1000): number => {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);
  return now;
};

const restore = async (previous: number | null) => {
  if (Platform.OS === 'android') {
    await Brightness.restoreSystemBrightnessAsync();
  } else if (previous !== null) {
    await Brightness.setBrightnessAsync(previous);
  }
};

export const useFullBrightness = (enabled: boolean) => {
  useFocusEffect(
    useCallback(() => {
      if (!enabled) return;
      let previous: number | null = null;
      let raised = false;

      const raise = async () => {
        if (raised) return;
        raised = true;
        try {
          previous = await Brightness.getBrightnessAsync();
          await Brightness.setBrightnessAsync(1);
        } catch {
          raised = false;
        }
      };

      const lower = async () => {
        if (!raised) return;
        raised = false;
        try {
          await restore(previous);
        } catch {
          return;
        }
      };

      raise();
      const subscription = AppState.addEventListener('change', (state) => {
        if (state === 'active') raise();
        else lower();
      });

      return () => {
        subscription.remove();
        lower();
      };
    }, [enabled]),
  );
};
