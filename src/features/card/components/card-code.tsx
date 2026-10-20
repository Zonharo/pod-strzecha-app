import { StyleSheet, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

import { cardCodeAt, formatCardNumber, formatCode, type LoyaltyCard } from '@/domain/card/card';
import { Text } from '@/shared/ui/text';
import { radius, spacing, useTheme } from '@/shared/ui/theme';

import { useNow } from '../hooks';

const QR_SIZE = 232;

export function CardCode({ card }: { card: LoyaltyCard }) {
  const { colors } = useTheme();
  const now = useNow();
  const { payload, code, secondsLeft } = cardCodeAt(card, now);
  const progress = secondsLeft / card.periodSeconds;

  return (
    <View style={styles.root}>
      <View
        style={styles.qr}
        accessible
        accessibilityRole="image"
        accessibilityLabel="Kod karty do zeskanowania przy kasie"
      >
        <QRCode value={payload} size={QR_SIZE} ecl="M" color="#1D1D1B" backgroundColor="#FFFFFF" />
      </View>

      <View style={styles.texts}>
        <Text
          variant="title"
          style={styles.code}
          accessibilityLabel={`Kod ${code.split('').join(' ')}`}
        >
          {formatCode(code)}
        </Text>
        <Text variant="caption" muted>
          Karta {formatCardNumber(card.number)}
        </Text>
      </View>

      <View
        style={[styles.track, { backgroundColor: colors.surfaceStrong }]}
        accessibilityLabel={`Nowy kod za ${secondsLeft} s`}
      >
        <View
          style={[styles.bar, { width: `${progress * 100}%`, backgroundColor: colors.primary }]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    gap: spacing.md,
  },
  qr: {
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: '#FFFFFF',
  },
  texts: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  code: {
    fontSize: 30,
    letterSpacing: 4,
    fontVariant: ['tabular-nums'],
  },
  track: {
    height: 6,
    borderRadius: 3,
    alignSelf: 'stretch',
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    borderRadius: 3,
  },
});
