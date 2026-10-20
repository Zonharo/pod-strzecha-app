import { SymbolView } from 'expo-symbols';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Switch, View } from 'react-native';

import { Text } from './text';
import { spacing, useTheme } from './theme';

type BaseProps = {
  title: string;
  subtitle?: string | null;
};

export function ListRow({
  title,
  subtitle,
  onPress,
  trailing,
}: BaseProps & { onPress?: () => void; trailing?: ReactNode }) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [styles.row, { opacity: pressed ? 0.6 : 1 }]}
    >
      <View style={styles.texts}>
        <Text>{title}</Text>
        {subtitle ? (
          <Text variant="caption" muted>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {trailing ??
        (onPress ? (
          <SymbolView
            name={{ ios: 'chevron.right', android: 'chevron_right' }}
            size={16}
            tintColor={colors.textMuted}
          />
        ) : null)}
    </Pressable>
  );
}

export function SwitchRow({
  title,
  subtitle,
  value,
  onValueChange,
  disabled,
}: BaseProps & { value: boolean; onValueChange: (value: boolean) => void; disabled?: boolean }) {
  const { colors } = useTheme();
  return (
    <View style={styles.row}>
      <View style={styles.texts}>
        <Text>{title}</Text>
        {subtitle ? (
          <Text variant="caption" muted>
            {subtitle}
          </Text>
        ) : null}
      </View>
      <Switch
        accessibilityLabel={title}
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ true: colors.primary }}
      />
    </View>
  );
}

export function CheckRow({
  title,
  checked,
  onToggle,
  error,
}: {
  title: ReactNode;
  checked: boolean;
  onToggle: () => void;
  error?: string | null;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.checkWrapper}>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked }}
        onPress={onToggle}
        style={styles.row}
      >
        <View
          style={[
            styles.box,
            {
              borderColor: error ? colors.danger : checked ? colors.primary : colors.border,
              backgroundColor: checked ? colors.primary : 'transparent',
            },
          ]}
        >
          {checked ? (
            <SymbolView
              name={{ ios: 'checkmark', android: 'check' }}
              size={16}
              tintColor={colors.onPrimary}
            />
          ) : null}
        </View>
        <View style={styles.texts}>{typeof title === 'string' ? <Text>{title}</Text> : title}</View>
      </Pressable>
      {error ? (
        <Text variant="caption" style={{ color: colors.danger }}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 48,
  },
  texts: {
    flex: 1,
    gap: 2,
  },
  checkWrapper: {
    gap: spacing.xs,
  },
  box: {
    width: 26,
    height: 26,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
