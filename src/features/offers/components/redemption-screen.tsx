import { router, useLocalSearchParams } from 'expo-router';
import { Alert, StyleSheet, View } from 'react-native';

import { formatDateTime } from '@/domain/format';
import { validityLabel } from '@/domain/offers/offers';
import { formatPoints } from '@/domain/points/points';
import { useNow } from '@/shared/hooks/use-now';
import { Button } from '@/shared/ui/button';
import { GlassCard } from '@/shared/ui/glass-card';
import { Screen } from '@/shared/ui/screen';
import { StatusScreen } from '@/shared/ui/status-screen';
import { Text } from '@/shared/ui/text';
import { spacing, useTheme } from '@/shared/ui/theme';

import { offerErrorMessage } from '../messages';
import { useCancelRedemption, useRewards } from '../queries';
import { OfferImage } from './offer-visual';
import { REWARD_ICON } from './rewards-screen';

export function RedemptionScreen() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const rewards = useRewards();
  const cancel = useCancelRedemption();
  const now = useNow(60_000);

  if (rewards.isPending) return <StatusScreen loading />;
  const item = rewards.data?.waiting.find((redemption) => redemption.id === id);
  if (!item) {
    return (
      <StatusScreen
        title="Ta nagroda nie czeka już na odbiór"
        description="Została odebrana, anulowana albo minął jej termin. Kłoski za nieodebrane nagrody wracają na konto."
        actionTitle="Wróć do nagród"
        onAction={() => router.navigate('/rewards')}
      />
    );
  }

  const confirmCancel = () =>
    Alert.alert('Anulować wymianę?', `Oddamy Ci ${formatPoints(item.pointsSpent)}.`, [
      { text: 'Zostaw', style: 'cancel' },
      {
        text: 'Anuluj wymianę',
        style: 'destructive',
        onPress: async () => {
          const result = await cancel.mutateAsync(item.id);
          if (!result.ok) {
            Alert.alert('Nie udało się anulować', offerErrorMessage(result.error));
            return;
          }
          router.navigate('/rewards');
        },
      },
    ]);

  return (
    <Screen>
      <OfferImage url={item.reward.imageUrl} icon={REWARD_ICON} style={styles.hero} />
      <GlassCard style={styles.card}>
        <Text variant="label" muted>
          Czeka na odbiór
        </Text>
        <Text variant="title">{item.reward.title}</Text>
        <Text style={{ color: colors.ink, fontWeight: '600' }}>
          {validityLabel(item.expiresAt, now)}
        </Text>
        <Text muted>
          Pokaż kod z karty w dowolnym sklepie Pod Strzechą. Kasjer zobaczy nagrodę i wyda ją od
          razu.
        </Text>
        <Text variant="caption" muted>
          Wymieniono {formatDateTime(item.createdAt)} za {formatPoints(item.pointsSpent)}.
        </Text>
      </GlassCard>
      <View style={styles.actions}>
        <Button title="Pokaż kartę" onPress={() => router.navigate('/')} />
        <Button
          variant="destructive"
          title="Anuluj i oddaj kłoski"
          onPress={confirmCancel}
          loading={cancel.isPending}
        />
      </View>
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
  actions: {
    gap: spacing.sm,
  },
});
