import { router, type Href } from 'expo-router';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { useEffect } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';

import { formatDateTime } from '@/domain/format';
import {
  appRoute,
  type AppNotification,
  type NotificationKind,
} from '@/domain/notifications/notifications';
import { EmptyState } from '@/shared/ui/empty-state';
import { StatusScreen } from '@/shared/ui/status-screen';
import { Text } from '@/shared/ui/text';
import { radius, spacing, useTheme } from '@/shared/ui/theme';

import { useMarkAllRead, useNotifications } from '../queries';

const ICONS: Record<NotificationKind, SymbolViewProps['name']> = {
  welcome: { ios: 'hand.wave.fill', android: 'waving_hand' },
  points_earned: { ios: 'leaf.fill', android: 'eco' },
  points_refunded: { ios: 'arrow.uturn.backward', android: 'undo' },
  points_expiring: { ios: 'clock.fill', android: 'schedule' },
  points_expired: { ios: 'clock.fill', android: 'schedule' },
  reward_expiring: { ios: 'gift.fill', android: 'redeem' },
  reward_expired: { ios: 'gift.fill', android: 'redeem' },
  birthday: { ios: 'birthday.cake.fill', android: 'cake' },
  offer: { ios: 'megaphone.fill', android: 'campaign' },
  system: { ios: 'info.circle.fill', android: 'info' },
};

function NotificationRow({ item }: { item: AppNotification }) {
  const { colors } = useTheme();
  const route = appRoute(item.link);
  const unread = item.readAt === null;
  const icon = ICONS[item.kind];

  return (
    <Pressable
      disabled={!route}
      onPress={() => route && router.push(route as Href)}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: unread ? colors.surfaceStrong : colors.surface,
          opacity: pressed ? 0.7 : 1,
        },
      ]}
      accessibilityRole={route ? 'button' : undefined}
      accessibilityLabel={`${unread ? 'Nowe. ' : ''}${item.title}. ${item.body}`}
    >
      <View style={[styles.icon, { backgroundColor: colors.primary }]}>
        <SymbolView name={icon} size={18} tintColor={colors.onPrimary} />
      </View>
      <View style={styles.texts}>
        <Text style={unread ? styles.unreadTitle : undefined}>{item.title}</Text>
        {item.body ? (
          <Text variant="caption" muted>
            {item.body}
          </Text>
        ) : null}
        <Text variant="caption" muted>
          {formatDateTime(item.createdAt)}
        </Text>
      </View>
      {unread ? <View style={[styles.dot, { backgroundColor: colors.ink }]} /> : null}
    </Pressable>
  );
}

export function NotificationsScreen() {
  const { colors } = useTheme();
  const notifications = useNotifications();
  const markAllRead = useMarkAllRead();
  const items = notifications.data?.pages.flatMap((page) => page.items) ?? [];
  const hasUnread = items.some((item) => item.readAt === null);
  const { mutate } = markAllRead;

  useEffect(() => {
    if (hasUnread) mutate();
  }, [hasUnread, mutate]);

  if (notifications.isPending) return <StatusScreen loading />;
  if (notifications.isError) {
    return (
      <StatusScreen
        title="Nie udało się wczytać powiadomień"
        actionTitle="Spróbuj ponownie"
        onAction={() => notifications.refetch()}
      />
    );
  }

  return (
    <FlatList
      style={{ backgroundColor: colors.background }}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={styles.content}
      data={items}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <NotificationRow item={item} />}
      refreshControl={
        <RefreshControl
          refreshing={notifications.isRefetching}
          onRefresh={() => {
            notifications.refetch();
          }}
        />
      }
      onEndReachedThreshold={0.5}
      onEndReached={() => {
        if (notifications.hasNextPage && !notifications.isFetchingNextPage)
          notifications.fetchNextPage();
      }}
      ListEmptyComponent={
        <EmptyState
          icon={{ ios: 'bell', android: 'notifications' }}
          title="Cisza i spokój"
          description="Tu zobaczysz nowe kłoski, przypomnienia o nagrodach i prezenty."
        />
      }
      ListFooterComponent={
        notifications.isFetchingNextPage ? (
          <ActivityIndicator color={colors.ink} style={styles.footer} />
        ) : undefined
      }
    />
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    alignItems: 'flex-start',
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texts: {
    flex: 1,
    gap: 2,
  },
  unreadTitle: {
    fontWeight: '700',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 6,
  },
  footer: {
    marginVertical: spacing.lg,
  },
});
