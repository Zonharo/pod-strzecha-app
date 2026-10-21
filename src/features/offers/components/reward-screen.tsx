import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { isSoldOut, pointsMissing } from '@/domain/offers/offers';
import { formatPoints } from '@/domain/points/points';
import { useCustomer, useProgramSettings } from '@/features/account';
import { Button } from '@/shared/ui/button';
import { GlassCard } from '@/shared/ui/glass-card';
import { Screen } from '@/shared/ui/screen';
import { StatusScreen } from '@/shared/ui/status-screen';
import { Text } from '@/shared/ui/text';
import { spacing, useTheme } from '@/shared/ui/theme';

import { offerErrorMessage } from '../messages';
import { useRedeemReward, useRewards } from '../queries';
import { OfferImage } from './offer-visual';
import { REWARD_ICON } from './rewards-screen';

export function RewardScreen() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const customer = useCustomer();
  const settings = useProgramSettings();
  const rewards = useRewards();
  const redeem = useRedeemReward();
  const [error, setError] = useState<string | null>(null);

  if (rewards.isPending) return <StatusScreen loading />;
  const reward = rewards.data?.rewards.find((item) => item.id === id);
  if (!reward) {
    return (
      <StatusScreen
        title="Ta nagroda jest już niedostępna"
        actionTitle="Wróć do nagród"
        onAction={() => router.back()}
      />
    );
  }

  const balance = customer?.pointsBalance ?? 0;
  const missing = pointsMissing(balance, reward);
  const soldOut = isSoldOut(reward);
  const validDays = settings.data?.rewardValidDays ?? 14;

  const confirm = () =>
    Alert.alert(
      `Wymienić ${formatPoints(reward.pointsCost)}?`,
      `${reward.title} będzie czekać na Ciebie ${validDays} dni. Do tego czasu możesz anulować wymianę i odzyskać kłoski.`,
      [
        { text: 'Anuluj', style: 'cancel' },
        {
          text: 'Wymień',
          onPress: async () => {
            setError(null);
            const result = await redeem.mutateAsync({ reward, balance });
            if (!result.ok) {
              setError(offerErrorMessage(result.error));
              return;
            }
            router.replace(`/rewards/redemptions/${result.value}`);
          },
        },
      ],
    );

  return (
    <Screen>
      <OfferImage url={reward.imageUrl} icon={REWARD_ICON} style={styles.hero} />
      <GlassCard style={styles.card}>
        <Text variant="title">{reward.title}</Text>
        <Text style={[styles.cost, { color: colors.ink }]}>{formatPoints(reward.pointsCost)}</Text>
        {reward.description ? <Text>{reward.description}</Text> : null}
        <Text variant="caption" muted>
          Po wymianie masz {validDays} dni na odbiór w dowolnym sklepie.
        </Text>
      </GlassCard>

      <View style={styles.actions}>
        {error ? (
          <Text variant="caption" style={{ color: colors.danger }}>
            {error}
          </Text>
        ) : null}
        {soldOut ? (
          <Text muted>Ta nagroda chwilowo się skończyła.</Text>
        ) : missing > 0 ? (
          <Text muted>Brakuje Ci {formatPoints(missing)}. Zbierasz je przy każdych zakupach.</Text>
        ) : (
          <Button
            title={`Wymień za ${formatPoints(reward.pointsCost)}`}
            onPress={confirm}
            loading={redeem.isPending}
          />
        )}
      </View>

      {reward.terms ? (
        <View style={styles.terms}>
          <Text variant="label" muted>
            Warunki
          </Text>
          <Text variant="caption" muted>
            {reward.terms}
          </Text>
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    width: '100%',
    height: 180,
  },
  card: {
    gap: spacing.sm,
  },
  cost: {
    fontSize: 22,
    fontWeight: '700',
  },
  actions: {
    gap: spacing.sm,
  },
  terms: {
    gap: spacing.xs,
  },
});
