import { GlassView, isGlassEffectAPIAvailable, isLiquidGlassAvailable } from 'expo-glass-effect';
import type { ReactNode } from 'react';
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { radius, spacing, useTheme } from './theme';

const glassSupported =
  Platform.OS === 'ios' && isLiquidGlassAvailable() && isGlassEffectAPIAvailable();

type Props = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  tintColor?: string;
};

export function GlassCard({ children, style, tintColor }: Props) {
  const { colors } = useTheme();

  if (glassSupported) {
    return (
      <GlassView glassEffectStyle="regular" tintColor={tintColor} style={[styles.card, style]}>
        {children}
      </GlassView>
    );
  }

  return (
    <View
      style={[
        styles.card,
        styles.fallback,
        { backgroundColor: colors.surface, borderColor: colors.border },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.xl,
    padding: spacing.lg,
    overflow: 'hidden',
  },
  fallback: {
    borderWidth: StyleSheet.hairlineWidth,
  },
});
