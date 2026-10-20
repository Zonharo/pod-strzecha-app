import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { Button } from './button';
import { Text } from './text';
import { spacing, useTheme } from './theme';

type Props = {
  loading?: boolean;
  title?: string;
  description?: string;
  actionTitle?: string;
  onAction?: () => void;
};

export function StatusScreen({ loading, title, description, actionTitle, onAction }: Props) {
  const { colors } = useTheme();
  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {loading ? <ActivityIndicator size="large" color={colors.ink} /> : null}
      {title ? (
        <Text variant="title" style={styles.center}>
          {title}
        </Text>
      ) : null}
      {description ? (
        <Text muted style={styles.center}>
          {description}
        </Text>
      ) : null}
      {actionTitle && onAction ? <Button title={actionTitle} onPress={onAction} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  center: {
    textAlign: 'center',
  },
});
