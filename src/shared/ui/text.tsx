import { StyleSheet, Text as NativeText, type TextProps } from 'react-native';

import { useTheme } from './theme';

type Variant = 'display' | 'title' | 'body' | 'caption' | 'label';

type Props = TextProps & {
  variant?: Variant;
  muted?: boolean;
};

export function Text({ variant = 'body', muted = false, style, ...props }: Props) {
  const { colors } = useTheme();
  return (
    <NativeText
      style={[styles[variant], { color: muted ? colors.textMuted : colors.text }, style]}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  display: { fontSize: 40, fontWeight: '800', letterSpacing: -0.5 },
  title: { fontSize: 22, fontWeight: '700' },
  body: { fontSize: 17, lineHeight: 24 },
  caption: { fontSize: 14, lineHeight: 20 },
  label: { fontSize: 13, fontWeight: '600', letterSpacing: 0.6, textTransform: 'uppercase' },
});
