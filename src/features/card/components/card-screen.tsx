import { SymbolView } from 'expo-symbols';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { pluralPl } from '@/domain/format';
import { formatPoints } from '@/domain/points/points';
import { useCustomer } from '@/features/account';
import { useCoupons, useRewards } from '@/features/offers';
import { Button } from '@/shared/ui/button';
import { GlassCard } from '@/shared/ui/glass-card';
import { Text } from '@/shared/ui/text';
import { radius, spacing, useTheme } from '@/shared/ui/theme';

import { useCard, useFullBrightness } from '../hooks';
import { CardCode } from './card-code';

export function CardScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const customer = useCustomer();
  const card = useCard();
  const coupons = useCoupons();
  const rewards = useRewards();
  const couponCount = coupons.data?.active.length ?? 0;
  const rewardCount = rewards.data?.waiting.length ?? 0;
  const extras = [
    couponCount ? `${couponCount} ${pluralPl(couponCount, 'kupon', 'kupony', 'kuponów')}` : null,
    rewardCount ? `${rewardCount} ${pluralPl(rewardCount, 'nagroda', 'nagrody', 'nagród')}` : null,
  ].filter(Boolean);
  const ready = card.data?.kind === 'ready' ? card.data : null;
  useFullBrightness(!!ready);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.blob, styles.blobTop, { backgroundColor: colors.primary }]} />
      <View style={[styles.blob, styles.blobSide, { backgroundColor: colors.ink }]} />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.lg }]}
        contentInsetAdjustmentBehavior="never"
      >
        <View style={styles.header}>
          <Text variant="label" muted>
            Pod Strzechą
          </Text>
          <Text variant="display">
            {customer?.firstName ? `Cześć, ${customer.firstName}!` : 'Dzień dobry!'}
          </Text>
        </View>

        <GlassCard style={styles.card}>
          <View style={styles.cardTop}>
            <View>
              <Text variant="label" muted>
                Twoje kłoski
              </Text>
              <Text variant="title" style={styles.points}>
                {formatPoints(customer?.pointsBalance ?? 0)}
              </Text>
            </View>
            <SymbolView
              name={{ ios: 'leaf.fill', android: 'eco' }}
              size={28}
              tintColor={colors.ink}
            />
          </View>

          {ready ? (
            <CardCode card={ready.card} />
          ) : (
            <View style={[styles.code, { backgroundColor: colors.surfaceStrong }]}>
              {card.isPending ? (
                <ActivityIndicator color={colors.ink} />
              ) : (
                <View style={styles.codeMessage}>
                  <SymbolView
                    name={{ ios: 'wifi.exclamationmark', android: 'wifi_off' }}
                    size={40}
                    tintColor={colors.textMuted}
                  />
                  <Text muted style={styles.center}>
                    {card.data?.kind === 'missing'
                      ? 'Nie widzimy Twojej karty. Spróbuj za chwilę.'
                      : 'Połącz się z internetem, żeby pobrać kartę. Potem zadziała też bez sieci.'}
                  </Text>
                  <Button
                    variant="secondary"
                    title="Spróbuj ponownie"
                    onPress={() => card.refetch()}
                  />
                </View>
              )}
            </View>
          )}
        </GlassCard>

        <GlassCard>
          <Text variant="body">
            Pokaż kod przy kasie, a kłoski dopiszą się same. Kod zmienia się co pół minuty, więc
            zrzut ekranu nie zadziała.
          </Text>
          {extras.length ? (
            <Text
              variant="caption"
              style={[styles.offline, { color: colors.ink, fontWeight: '600' }]}
            >
              Przy kasie zadziałają też: {extras.join(' i ')}.
            </Text>
          ) : null}
          {ready?.offline ? (
            <Text variant="caption" muted style={styles.offline}>
              Jesteś bez internetu. Kod działa, a saldo odświeży się po połączeniu.
            </Text>
          ) : null}
        </GlassCard>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  blob: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.85,
  },
  blobTop: {
    width: 320,
    height: 320,
    top: -80,
    right: -120,
  },
  blobSide: {
    width: 220,
    height: 220,
    top: 280,
    left: -110,
    opacity: 0.35,
  },
  content: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xxl * 2,
    gap: spacing.md,
  },
  header: {
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  card: {
    gap: spacing.md,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  points: {
    fontSize: 32,
    marginTop: spacing.xs,
  },
  code: {
    aspectRatio: 1,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeMessage: {
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
  },
  center: {
    textAlign: 'center',
  },
  offline: {
    marginTop: spacing.sm,
  },
});
