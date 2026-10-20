import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, View } from 'react-native';

import { spacing, useTheme } from '@/shared/ui/theme';

type Props = {
  value: number;
  size?: number;
  onChange?: (value: number) => void;
};

export function Stars({ value, size = 18, onChange }: Props) {
  const { colors } = useTheme();
  return (
    <View
      style={[styles.row, { gap: onChange ? spacing.sm : 2 }]}
      accessibilityRole={onChange ? 'adjustable' : 'image'}
      accessibilityLabel={`Ocena ${value} na 5`}
      accessibilityActions={
        onChange
          ? [
              { name: 'increment', label: 'Więcej gwiazdek' },
              { name: 'decrement', label: 'Mniej gwiazdek' },
            ]
          : undefined
      }
      onAccessibilityAction={(event) => {
        if (!onChange) return;
        if (event.nativeEvent.actionName === 'increment') onChange(Math.min(5, value + 1));
        if (event.nativeEvent.actionName === 'decrement') onChange(Math.max(1, value - 1));
      }}
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const icon = (
          <SymbolView
            name={
              star <= value
                ? { ios: 'star.fill', android: 'star' }
                : { ios: 'star', android: 'star_outline' }
            }
            size={size}
            tintColor={star <= value ? colors.primary : colors.textMuted}
          />
        );
        return onChange ? (
          <Pressable
            key={star}
            onPress={() => onChange(star)}
            hitSlop={6}
            importantForAccessibility="no"
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
          >
            {icon}
          </Pressable>
        ) : (
          <View key={star}>{icon}</View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
