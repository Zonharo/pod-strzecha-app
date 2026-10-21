import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { validityLabel } from '@/domain/offers/offers';
import { useNow } from '@/shared/hooks/use-now';
import { Button } from '@/shared/ui/button';
import { GlassCard } from '@/shared/ui/glass-card';
import { Screen } from '@/shared/ui/screen';
import { StatusScreen } from '@/shared/ui/status-screen';
import { Text } from '@/shared/ui/text';
import { spacing, useTheme } from '@/shared/ui/theme';

import { couponConditions, offerErrorMessage } from '../messages';
import { useActivateCoupon, useCoupons } from '../queries';
import { BenefitBadge, OfferImage } from './offer-visual';

export function CouponScreen() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const coupons = useCoupons();
  const activate = useActivateCoupon();
  const now = useNow(60_000);
  const [error, setError] = useState<string | null>(null);

  if (coupons.isPending) return <StatusScreen loading />;

  const owned = coupons.data?.active.find((item) => item.coupon.id === id);
  const coupon = owned?.coupon ?? coupons.data?.toActivate.find((item) => item.id === id);
  if (!coupon) {
    return (
      <StatusScreen
        title="Ten kupon jest już niedostępny"
        actionTitle="Wróć do kuponów"
        onAction={() => router.back()}
      />
    );
  }

  const onActivate = async () => {
    setError(null);
    const result = await activate.mutateAsync(coupon.id);
    if (!result.ok) setError(offerErrorMessage(result.error));
  };

  const conditions = couponConditions(coupon);

  return (
    <Screen>
      <OfferImage
        url={coupon.imageUrl}
        icon={{ ios: 'ticket.fill', android: 'confirmation_number' }}
        style={styles.hero}
      />
      <GlassCard style={styles.card}>
        <BenefitBadge benefit={coupon.benefit} large />
        <Text variant="title">{coupon.title}</Text>
        {coupon.description ? <Text>{coupon.description}</Text> : null}
        <Text variant="caption" muted>
          {validityLabel(owned?.validUntil ?? coupon.endsAt, now)}
        </Text>
        {conditions.map((line) => (
          <Text key={line} variant="caption" muted>
            {line}
          </Text>
        ))}
      </GlassCard>

      {owned ? (
        <GlassCard style={styles.card}>
          <Text style={{ color: colors.ink, fontWeight: '600' }}>Kupon jest aktywny</Text>
          <Text muted>Pokaż kod z karty przy kasie. Kasjer zobaczy kupon i naliczy rabat.</Text>
          <Button title="Pokaż kartę" onPress={() => router.navigate('/')} />
        </GlassCard>
      ) : (
        <View style={styles.actions}>
          {error ? (
            <Text variant="caption" style={{ color: colors.danger }}>
              {error}
            </Text>
          ) : null}
          <Button title="Aktywuj kupon" onPress={onActivate} loading={activate.isPending} />
        </View>
      )}

      {coupon.terms ? (
        <View style={styles.terms}>
          <Text variant="label" muted>
            Warunki
          </Text>
          <Text variant="caption" muted>
            {coupon.terms}
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
  actions: {
    gap: spacing.sm,
  },
  terms: {
    gap: spacing.xs,
  },
});
