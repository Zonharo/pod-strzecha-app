import { router } from 'expo-router';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { formatPoints } from '@/domain/points/points';
import {
  isSoldOut,
  pointsMissing,
  rewardProgress,
  validityLabel,
  type Redemption,
  type Reward,
} from '@/domain/offers/offers';
import { useCustomer } from '@/features/account';
import { useNow } from '@/shared/hooks/use-now';
import { EmptyState } from '@/shared/ui/empty-state';
import { GlassCard } from '@/shared/ui/glass-card';
import { StatusScreen } from '@/shared/ui/status-screen';
import { Text } from '@/shared/ui/text';
import { spacing, useTheme } from '@/shared/ui/theme';

import { useRewards } from '../queries';
import { OfferImage } from './offer-visual';

export const REWARD_ICON = { ios: 'gift.fill', android: 'redeem' } as const;

function Progress({ value }: { value: number }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.track, { backgroundColor: colors.surfaceStrong }]}>
      <View style={[styles.bar, { width: `${value * 100}%`, backgroundColor: colors.primary }]} />
    </View>
  );
}

function WaitingReward({ item, now }: { item: Redemption; now: number }) {
  const { colors } = useTheme();
  return (
    <Pressable onPress={() => router.push(`/rewards/redemptions/${item.id}`)}>
      <GlassCard style={styles.card}>
        <View style={styles.row}>
          <OfferImage url={item.reward.imageUrl} icon={REWARD_ICON} />
          <View style={styles.texts}>
            <Text style={styles.title}>{item.reward.title}</Text>
            <Text variant="caption" muted>
              Odbierz: {validityLabel(item.expiresAt, now).toLowerCase()}
            </Text>
            <Text variant="caption" style={{ color: colors.ink, fontWeight: '600' }}>
              Pokaż kod karty przy kasie
            </Text>
          </View>
        </View>
      </GlassCard>
    </Pressable>
  );
}

function CatalogReward({ reward, balance }: { reward: Reward; balance: number }) {
  const { colors } = useTheme();
  const missing = pointsMissing(balance, reward);
  const soldOut = isSoldOut(reward);

  return (
    <Pressable onPress={() => router.push(`/rewards/${reward.id}`)}>
      <GlassCard style={styles.card}>
        <View style={styles.row}>
          <OfferImage url={reward.imageUrl} icon={REWARD_ICON} />
          <View style={styles.texts}>
            <Text style={styles.title}>{reward.title}</Text>
            <Text style={[styles.cost, { color: colors.ink }]}>
              {formatPoints(reward.pointsCost)}
            </Text>
            <Text variant="caption" muted>
              {soldOut
                ? 'Chwilowo się skończyła'
                : missing > 0
                  ? `Brakuje ${formatPoints(missing)}`
                  : 'Możesz ją wymienić'}
            </Text>
          </View>
        </View>
        {!soldOut ? <Progress value={rewardProgress(balance, reward)} /> : null}
      </GlassCard>
    </Pressable>
  );
}

export function RewardsScreen() {
  const { colors } = useTheme();
  const customer = useCustomer();
  const rewards = useRewards();
  const now = useNow(60_000);
  const balance = customer?.pointsBalance ?? 0;

  if (rewards.isPending) return <StatusScreen loading />;
  if (rewards.isError) {
    return (
      <StatusScreen
        title="Nie udało się wczytać nagród"
        description="Sprawdź internet i spróbuj jeszcze raz."
        actionTitle="Spróbuj ponownie"
        onAction={() => rewards.refetch()}
      />
    );
  }

  const { waiting, rewards: catalog } = rewards.data;

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={rewards.isRefetching}
          onRefresh={() => {
            rewards.refetch();
          }}
        />
      }
    >
      <GlassCard style={styles.balance}>
        <Text variant="label" muted>
          Masz do wydania
        </Text>
        <Text variant="title" style={styles.balanceValue}>
          {formatPoints(balance)}
        </Text>
      </GlassCard>

      {waiting.length > 0 ? (
        <View style={styles.section}>
          <Text variant="title">Do odebrania</Text>
          {waiting.map((item) => (
            <WaitingReward key={item.id} item={item} now={now} />
          ))}
        </View>
      ) : null}

      <View style={styles.section}>
        <Text variant="title">Za kłoski</Text>
        {catalog.length === 0 ? (
          <EmptyState
            icon={REWARD_ICON}
            title="Nagrody już niedługo"
            description="Zbieraj kłoski, a wkrótce wymienisz je tutaj na pyszności."
          />
        ) : (
          catalog.map((reward) => (
            <CatalogReward key={reward.id} reward={reward} balance={balance} />
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.md,
    gap: spacing.xl,
  },
  balance: {
    gap: spacing.xs,
  },
  balanceValue: {
    fontSize: 30,
  },
  section: {
    gap: spacing.sm,
  },
  card: {
    gap: spacing.md,
    padding: spacing.md,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  texts: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontWeight: '600',
  },
  cost: {
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  track: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    borderRadius: 3,
  },
});
