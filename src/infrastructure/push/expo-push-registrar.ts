import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { AndroidImportance, IosAuthorizationStatus } from 'expo-notifications';
import { Platform } from 'react-native';

import type { LocalCache } from '@/application/ports/account';
import type { PushRegistrar } from '@/application/ports/push';
import type { SupabaseClient } from '@/infrastructure/supabase/client';

const TOKEN_KEY = 'push.token';

const projectId = (): string | undefined =>
  Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;

const isGranted = (settings: Notifications.NotificationPermissionsStatus) =>
  settings.granted ||
  settings.ios?.status === IosAuthorizationStatus.PROVISIONAL ||
  settings.ios?.status === IosAuthorizationStatus.EPHEMERAL;

const ensureChannel = async () => {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('default', {
    name: 'Kłoski i nagrody',
    importance: AndroidImportance.HIGH,
    lightColor: '#FBC329',
  });
};

export const makeExpoPushRegistrar = (supabase: SupabaseClient): PushRegistrar & LocalCache => ({
  async status() {
    if (!projectId()) return 'unavailable';
    const settings = await Notifications.getPermissionsAsync();
    if (isGranted(settings)) return 'enabled';
    return settings.canAskAgain ? 'undetermined' : 'denied';
  },

  async enable(ask) {
    const id = projectId();
    if (!id) return 'unavailable';
    try {
      await ensureChannel();
      let settings = await Notifications.getPermissionsAsync();
      if (!isGranted(settings) && ask && settings.canAskAgain) {
        settings = await Notifications.requestPermissionsAsync();
      }
      if (!isGranted(settings)) return settings.canAskAgain ? 'undetermined' : 'denied';
      const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId: id });
      const { error } = await supabase.rpc('register_push_token', {
        p_token: token,
        p_platform: Platform.OS === 'ios' ? 'ios' : 'android',
      });
      if (error) return 'unavailable';
      await AsyncStorage.setItem(TOKEN_KEY, token);
      return 'enabled';
    } catch {
      return 'unavailable';
    }
  },

  async clear() {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    if (!token) return;
    await supabase.rpc('unregister_push_token', { p_token: token });
    await AsyncStorage.removeItem(TOKEN_KEY);
  },
});

export const configureNotificationHandler = () => {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
};

export const useLastNotificationLink = (): { id: string; link: string | null } | null => {
  const response = Notifications.useLastNotificationResponse();
  if (!response) return null;
  const link = response.notification.request.content.data?.link;
  return {
    id: response.notification.request.identifier,
    link: typeof link === 'string' ? link : null,
  };
};
