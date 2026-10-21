import { Image } from 'expo-image';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { benefitLabel, type Benefit } from '@/domain/offers/offers';
import { Text } from '@/shared/ui/text';
import { radius, spacing, useTheme } from '@/shared/ui/theme';

export function BenefitBadge({ benefit, large }: { benefit: Benefit; large?: boolean }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.badge, { backgroundColor: colors.primary }, large && styles.badgeLarge]}>
      <Text style={[styles.badgeText, { color: colors.onPrimary }, large && styles.badgeTextLarge]}>
        {benefitLabel(benefit)}
      </Text>
    </View>
  );
}

export function OfferImage({
  url,
  icon,
  style,
}: {
  url: string | null;
  icon: SymbolViewProps['name'];
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();
  return (
    <View style={[styles.image, { backgroundColor: colors.surfaceStrong }, style]}>
      {url ? (
        <Image
          source={{ uri: url }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={150}
          accessibilityIgnoresInvertColors
        />
      ) : (
        <SymbolView name={icon} size={32} tintColor={colors.ink} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.md,
  },
  badgeLarge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  badgeText: {
    fontSize: 14,
    fontWeight: '700',
  },
  badgeTextLarge: {
    fontSize: 22,
  },
  image: {
    width: 72,
    height: 72,
    borderRadius: radius.md,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
