import { SymbolView } from 'expo-symbols';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { formatPoints } from '@/domain/points/points';
import { useCustomer } from '@/features/account';
import { GlassCard } from '@/shared/ui/glass-card';
import { Text } from '@/shared/ui/text';
import { radius, spacing, useTheme } from '@/shared/ui/theme';

export function CardScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const customer = useCustomer();

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

          <View style={[styles.code, { backgroundColor: colors.surfaceStrong }]}>
            <SymbolView
              name={{ ios: 'qrcode', android: 'qr_code_2' }}
              size={120}
              tintColor={colors.textMuted}
            />
          </View>

          <Text variant="caption" muted style={styles.center}>
            Kod do zeskanowania przy kasie pojawi się tutaj już wkrótce.
          </Text>
        </GlassCard>

        <GlassCard>
          <Text variant="body">Pokaż kartę przy kasie, a kłoski dopiszą się same.</Text>
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
  center: {
    textAlign: 'center',
  },
});
