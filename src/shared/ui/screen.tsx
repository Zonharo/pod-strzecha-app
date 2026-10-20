import type { ReactNode } from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import { spacing, useTheme } from './theme';

type Props = {
  children: ReactNode;
};

export function Screen({ children }: Props) {
  const { colors } = useTheme();
  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.content}
      contentInsetAdjustmentBehavior="automatic"
    >
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.md,
    gap: spacing.md,
  },
});
