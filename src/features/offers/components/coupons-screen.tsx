import { router } from 'expo-router';
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { validityLabel, type Coupon, type CustomerCoupon } from '@/domain/offers/offers';
import { useNow } from '@/shared/hooks/use-now';
import { Button } from '@/shared/ui/button';
import { EmptyState } from '@/shared/ui/empty-state';
import { GlassCard } from '@/shared/ui/glass-card';
import { StatusScreen } from '@/shared/ui/status-screen';
import { Text } from '@/shared/ui/text';
import { spacing, useTheme } from '@/shared/ui/theme';

import { offerErrorMessage } from '../messages';
import { useActivateCoupon, useCoupons } from '../queries';
import { BenefitBadge, OfferImage } from './offer-visual';

const COUPON_ICON = { ios: 'ticket.fill', android: 'confirmation_number' } as const;

function ActiveCoupon({ item, now }: { item: CustomerCoupon; now: number }) {
  const { colors } = useTheme();
  return (
    <Pressable onPress={() => router.push(`/coupons/${item.coupon.id}`)}>
      <GlassCard style={styles.card}>
        <View style={styles.row}>
          <OfferImage url={item.coupon.imageUrl} icon={COUPON_ICON} />
          <View style={styles.texts}>
            <BenefitBadge benefit={item.coupon.benefit} />
            <Text numberOfLines={2} style={styles.title}>
              {item.coupon.title}
            </Text>
            <Text variant="caption" muted>
              {item.source === 'birthday' ? 'Prezent urodzinowy · ' : ''}
              {validityLabel(item.validUntil, now)}
              {item.usesLeft > 1 ? ` · zostało ${item.usesLeft} użyć` : ''}
            </Text>
          </View>
        </View>
        <Text variant="caption" style={{ color: colors.ink, fontWeight: '600' }}>
          Aktywny. Pokaż kod karty przy kasie.
        </Text>
      </GlassCard>
    </Pressable>
  );
}

function AvailableCoupon({ coupon, now }: { coupon: Coupon; now: number }) {
  const activate = useActivateCoupon();

  const onActivate = async () => {
    const result = await activate.mutateAsync(coupon.id);
    if (!result.ok) Alert.alert('Nie udało się aktywować', offerErrorMessage(result.error));
  };

  return (
    <Pressable onPress={() => router.push(`/coupons/${coupon.id}`)}>
      <GlassCard style={styles.card}>
        <View style={styles.row}>
          <OfferImage url={coupon.imageUrl} icon={COUPON_ICON} />
          <View style={styles.texts}>
            <BenefitBadge benefit={coupon.benefit} />
            <Text numberOfLines={2} style={styles.title}>
              {coupon.title}
            </Text>
            <Text variant="caption" muted>
              {validityLabel(coupon.endsAt, now)}
            </Text>
          </View>
        </View>
        <Button
          variant="secondary"
          title="Aktywuj"
          onPress={onActivate}
          loading={activate.isPending}
        />
      </GlassCard>
    </Pressable>
  );
}

export function CouponsScreen() {
  const { colors } = useTheme();
  const coupons = useCoupons();
  const now = useNow(60_000);

  if (coupons.isPending) return <StatusScreen loading />;
  if (coupons.isError) {
    return (
      <StatusScreen
        title="Nie udało się wczytać kuponów"
        description="Sprawdź internet i spróbuj jeszcze raz."
        actionTitle="Spróbuj ponownie"
        onAction={() => coupons.refetch()}
      />
    );
  }

  const { active, toActivate } = coupons.data;

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={coupons.isRefetching}
          onRefresh={() => {
            coupons.refetch();
          }}
        />
      }
    >
      {active.length === 0 && toActivate.length === 0 ? (
        <EmptyState
          icon={COUPON_ICON}
          title="Na razie brak kuponów"
          description="Zajrzyj tu wkrótce. Nowe kupony pojawiają się regularnie."
        />
      ) : null}

      {active.length > 0 ? (
        <View style={styles.section}>
          <Text variant="title">Twoje kupony</Text>
          <Text variant="caption" muted>
            Kasjer zobaczy je po zeskanowaniu kodu z karty.
          </Text>
          {active.map((item) => (
            <ActiveCoupon key={item.id} item={item} now={now} />
          ))}
        </View>
      ) : null}

      {toActivate.length > 0 ? (
        <View style={styles.section}>
          <Text variant="title">Do aktywacji</Text>
          <Text variant="caption" muted>
            Aktywuj kupon, a przy kasie zadziała sam.
          </Text>
          {toActivate.map((coupon) => (
            <AvailableCoupon key={coupon.id} coupon={coupon} now={now} />
          ))}
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.md,
    gap: spacing.xl,
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
});
