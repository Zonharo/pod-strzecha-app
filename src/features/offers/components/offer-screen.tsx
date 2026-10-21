import { router, useLocalSearchParams, type Href } from 'expo-router';
import { Linking, StyleSheet } from 'react-native';

import { formatDate } from '@/domain/format';
import { offerTarget } from '@/domain/offers/offers';
import { Button } from '@/shared/ui/button';
import { GlassCard } from '@/shared/ui/glass-card';
import { Screen } from '@/shared/ui/screen';
import { StatusScreen } from '@/shared/ui/status-screen';
import { Text } from '@/shared/ui/text';
import { spacing } from '@/shared/ui/theme';

import { useOffers } from '../queries';
import { OfferImage } from './offer-visual';

export function OfferScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const offers = useOffers();

  if (offers.isPending) return <StatusScreen loading />;
  const offer = offers.data?.find((item) => item.id === id);
  if (!offer) {
    return (
      <StatusScreen
        title="Ta oferta już się skończyła"
        actionTitle="Wróć"
        onAction={() => router.back()}
      />
    );
  }

  const target = offerTarget(offer);

  return (
    <Screen>
      <OfferImage
        url={offer.imageUrl}
        icon={{ ios: 'megaphone.fill', android: 'campaign' }}
        style={styles.hero}
      />
      <GlassCard style={styles.card}>
        <Text variant="title">{offer.title}</Text>
        {offer.body ? <Text>{offer.body}</Text> : null}
        <Text variant="caption" muted>
          Do {formatDate(offer.endsAt)}
        </Text>
      </GlassCard>
      {target?.kind === 'coupon' ? (
        <Button title="Zobacz kupon" onPress={() => router.push(target.route as Href)} />
      ) : target?.kind === 'reward' ? (
        <Button title="Zobacz nagrodę" onPress={() => router.push(target.route as Href)} />
      ) : target?.kind === 'web' ? (
        <Button
          variant="secondary"
          title="Dowiedz się więcej"
          onPress={() => Linking.openURL(target.url)}
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    width: '100%',
    height: 200,
  },
  card: {
    gap: spacing.sm,
  },
});
