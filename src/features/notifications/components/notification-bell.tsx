import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, View } from 'react-native';

import { badgeLabel } from '@/domain/notifications/notifications';
import { GlassCard } from '@/shared/ui/glass-card';
import { Text } from '@/shared/ui/text';
import { useTheme } from '@/shared/ui/theme';

import { useUnreadCount } from '../queries';

export function NotificationBell() {
  const { colors } = useTheme();
  const unread = useUnreadCount();
  const label = badgeLabel(unread.data ?? 0);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label ? `Powiadomienia, nowe: ${unread.data}` : 'Powiadomienia'}
      onPress={() => router.push('/notifications')}
      hitSlop={8}
    >
      <GlassCard style={styles.button}>
        <SymbolView
          name={{ ios: label ? 'bell.badge.fill' : 'bell', android: 'notifications' }}
          size={22}
          tintColor={colors.text}
        />
      </GlassCard>
      {label ? (
        <View style={[styles.badge, { backgroundColor: colors.danger }]}>
          <Text style={styles.badgeText}>{label}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 44,
    height: 44,
    padding: 0,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});
