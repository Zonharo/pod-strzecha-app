import { NativeTabs } from 'expo-router/unstable-native-tabs';

import { useLiveAccount } from '@/features/account';
import { usePushOnLaunch } from '@/features/notifications';
import { useTheme } from '@/shared/ui/theme';

export default function TabsLayout() {
  const { colors } = useTheme();
  useLiveAccount();
  usePushOnLaunch();

  return (
    <NativeTabs
      minimizeBehavior="onScrollDown"
      tintColor={colors.ink}
      backgroundColor={colors.background}
      indicatorColor={colors.surfaceStrong}
      labelStyle={{ selected: { color: colors.text } }}
    >
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Icon
          sf={{ default: 'creditcard', selected: 'creditcard.fill' }}
          md="credit_card"
        />
        <NativeTabs.Trigger.Label>Karta</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="coupons">
        <NativeTabs.Trigger.Icon
          sf={{ default: 'ticket', selected: 'ticket.fill' }}
          md="confirmation_number"
        />
        <NativeTabs.Trigger.Label>Kupony</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="rewards">
        <NativeTabs.Trigger.Icon sf={{ default: 'gift', selected: 'gift.fill' }} md="redeem" />
        <NativeTabs.Trigger.Label>Nagrody</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="history">
        <NativeTabs.Trigger.Icon sf={{ default: 'bag', selected: 'bag.fill' }} md="shopping_bag" />
        <NativeTabs.Trigger.Label>Historia</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="account">
        <NativeTabs.Trigger.Icon
          sf={{ default: 'person.crop.circle', selected: 'person.crop.circle.fill' }}
          md="account_circle"
        />
        <NativeTabs.Trigger.Label>Konto</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
