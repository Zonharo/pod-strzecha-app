import { router } from 'expo-router';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';

import { formatDateTime, formatMoney } from '@/domain/format';
import { formatPoints } from '@/domain/points/points';
import { canRate, type PurchaseSummary } from '@/domain/purchases/purchase';
import { useCustomer, useProgramSettings } from '@/features/account';
import { useNow } from '@/shared/hooks/use-now';
import { EmptyState } from '@/shared/ui/empty-state';
import { GlassCard } from '@/shared/ui/glass-card';
import { ListRow } from '@/shared/ui/list-row';
import { StatusScreen } from '@/shared/ui/status-screen';
import { Text } from '@/shared/ui/text';
import { radius, spacing, useTheme } from '@/shared/ui/theme';

import { usePurchases } from '../queries';
import { Stars } from './stars';

function PurchaseRow({
  purchase,
  ratingWindowDays,
  now,
}: {
  purchase: PurchaseSummary;
  ratingWindowDays: number;
  now: number;
}) {
  const { colors } = useTheme();
  const rateable = !purchase.rating && canRate(purchase, now, ratingWindowDays);

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push(`/history/${purchase.id}`)}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: colors.surface, opacity: pressed ? 0.7 : 1 },
      ]}
    >
      <View style={styles.rowMain}>
        <Text numberOfLines={1}>{purchase.storeName}</Text>
        <Text variant="caption" muted>
          {formatDateTime(purchase.occurredAt)} · {formatMoney(purchase.total)}
        </Text>
        {purchase.rating ? (
          <Stars value={purchase.rating.rating} size={14} />
        ) : rateable ? (
          <Text variant="caption" style={{ color: colors.ink, fontWeight: '600' }}>
            Oceń zakupy
          </Text>
        ) : null}
      </View>
      <View style={styles.rowSide}>
        {purchase.refunded ? (
          <Text variant="caption" muted>
            Zwrot
          </Text>
        ) : (
          <Text style={[styles.points, { color: colors.ink }]}>+{purchase.pointsEarned}</Text>
        )}
      </View>
    </Pressable>
  );
}

export function HistoryScreen() {
  const { colors } = useTheme();
  const customer = useCustomer();
  const settings = useProgramSettings();
  const purchases = usePurchases();
  const now = useNow(60_000);
  const items = purchases.data?.pages.flatMap((page) => page.items) ?? [];
  const ratingWindowDays = settings.data?.ratingWindowDays ?? 7;

  if (purchases.isPending) return <StatusScreen loading />;
  if (purchases.isError) {
    return (
      <StatusScreen
        title="Nie udało się wczytać zakupów"
        description="Sprawdź internet i spróbuj jeszcze raz."
        actionTitle="Spróbuj ponownie"
        onAction={() => purchases.refetch()}
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
      renderItem={({ item }) => (
        <PurchaseRow purchase={item} ratingWindowDays={ratingWindowDays} now={now} />
      )}
      refreshControl={
        <RefreshControl
          refreshing={purchases.isRefetching}
          onRefresh={() => {
            purchases.refetch();
          }}
        />
      }
      onEndReachedThreshold={0.5}
      onEndReached={() => {
        if (purchases.hasNextPage && !purchases.isFetchingNextPage) purchases.fetchNextPage();
      }}
      ListHeaderComponent={
        <GlassCard style={styles.header}>
          <Text variant="label" muted>
            Masz teraz
          </Text>
          <Text variant="title">{formatPoints(customer?.pointsBalance ?? 0)}</Text>
          <ListRow
            title="Historia kłosków"
            subtitle="Wszystkie naliczenia i wymiany"
            onPress={() => router.push('/history/points')}
          />
        </GlassCard>
      }
      ListEmptyComponent={
        <EmptyState
          icon={{ ios: 'bag.fill', android: 'shopping_bag' }}
          title="Jeszcze nic tu nie ma"
          description="Pokaż kartę przy kasie, a zakupy pojawią się tutaj. Każde możesz ocenić."
        />
      }
      ListFooterComponent={
        purchases.isFetchingNextPage ? (
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
  header: {
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
  },
  rowMain: {
    flex: 1,
    gap: 4,
  },
  rowSide: {
    alignItems: 'flex-end',
  },
  points: {
    fontSize: 20,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  footer: {
    marginVertical: spacing.lg,
  },
});
