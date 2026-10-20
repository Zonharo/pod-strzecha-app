import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { StyleSheet, View } from 'react-native';

import { GlassCard } from './glass-card';
import { Text } from './text';
import { spacing, useTheme } from './theme';

type Props = {
  icon: SymbolViewProps['name'];
  title: string;
  description: string;
};

export function EmptyState({ icon, title, description }: Props) {
  const { colors } = useTheme();
  return (
    <GlassCard style={styles.card}>
      <View style={[styles.badge, { backgroundColor: colors.primary }]}>
        <SymbolView name={icon} size={30} tintColor={colors.onPrimary} />
      </View>
      <Text variant="title" style={styles.center}>
        {title}
      </Text>
      <Text muted style={styles.center}>
        {description}
      </Text>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xl,
  },
  badge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  center: {
    textAlign: 'center',
  },
});
