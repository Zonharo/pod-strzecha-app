import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { formatDate, formatDateTime, formatMoney } from '@/domain/format';
import { formatPoints } from '@/domain/points/points';
import { canRate, ratingDeadline } from '@/domain/purchases/purchase';
import { useProgramSettings } from '@/features/account';
import { useNow } from '@/shared/hooks/use-now';
import { GlassCard } from '@/shared/ui/glass-card';
import { Screen } from '@/shared/ui/screen';
import { StatusScreen } from '@/shared/ui/status-screen';
import { Text } from '@/shared/ui/text';
import { spacing, useTheme } from '@/shared/ui/theme';

import { TAG_LABELS } from '../messages';
import { usePurchase } from '../queries';
import { RatingForm } from './rating-form';
import { Stars } from './stars';

function Line({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <View style={styles.line}>
      <Text muted={!strong} style={strong ? styles.strong : undefined}>
        {label}
      </Text>
      <Text style={[styles.value, strong ? styles.strong : undefined]}>{value}</Text>
    </View>
  );
}

export function PurchaseScreen() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const purchase = usePurchase(id);
  const settings = useProgramSettings();
  const now = useNow(60_000);
  const windowDays = settings.data?.ratingWindowDays ?? 7;

  if (purchase.isPending) return <StatusScreen loading />;
  if (purchase.isError) {
    return (
      <StatusScreen
        title="Nie udało się wczytać zakupów"
        actionTitle="Spróbuj ponownie"
        onAction={() => purchase.refetch()}
      />
    );
  }
  if (!purchase.data) return <StatusScreen title="Nie znaleźliśmy tych zakupów" />;

  const p = purchase.data;
  const rateable = canRate(p, now, windowDays);

  return (
    <Screen>
      <GlassCard style={styles.card}>
        <Text variant="title">{p.storeName}</Text>
        <Text muted>{formatDateTime(p.occurredAt)}</Text>
        {p.refunded ? (
          <Text variant="caption" style={{ color: colors.danger }}>
            Te zakupy zostały zwrócone, więc kłoski za nie odjęliśmy.
          </Text>
        ) : null}
      </GlassCard>

      <GlassCard style={styles.card}>
        {p.items.map((item) => (
          <Line
            key={item.position}
            label={
              item.quantity === 1
                ? item.name
                : `${item.name} × ${String(item.quantity).replace('.', ',')}`
            }
            value={formatMoney(item.total)}
          />
        ))}
        {p.items.length === 0 ? (
          <Text variant="caption" muted>
            Kasa nie przesłała listy produktów, widzimy tylko sumę.
          </Text>
        ) : null}
        {p.discountTotal > 0 ? (
          <Line label="Rabaty" value={`-${formatMoney(p.discountTotal)}`} />
        ) : null}
        <Line label="Razem" value={formatMoney(p.total)} strong />
        <Line label="Kłoski" value={`+${formatPoints(p.pointsEarned)}`} />
        {p.couponTitles.length > 0 ? (
          <Text variant="caption" muted>
            Użyte kupony: {p.couponTitles.join(', ')}
          </Text>
        ) : null}
        {p.receiptNumber ? (
          <Text variant="caption" muted>
            Paragon {p.receiptNumber}
          </Text>
        ) : null}
      </GlassCard>

      {rateable ? (
        <GlassCard>
          <RatingForm purchaseId={p.id} initial={p.rating} />
          <Text variant="caption" muted style={styles.deadline}>
            Ocenę możesz zmienić do {formatDate(ratingDeadline(p, windowDays).toISOString())}.
          </Text>
        </GlassCard>
      ) : p.rating ? (
        <GlassCard style={styles.card}>
          <Text variant="title">Twoja ocena</Text>
          <Stars value={p.rating.rating} size={24} />
          {p.rating.tags.length > 0 ? (
            <Text muted>{p.rating.tags.map((tag) => TAG_LABELS[tag]).join(', ')}</Text>
          ) : null}
          {p.rating.comment ? <Text>„{p.rating.comment}”</Text> : null}
        </GlassCard>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.sm,
  },
  line: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  value: {
    fontVariant: ['tabular-nums'],
  },
  strong: {
    fontWeight: '700',
  },
  deadline: {
    marginTop: spacing.md,
  },
});
