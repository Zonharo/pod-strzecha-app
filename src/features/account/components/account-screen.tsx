import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { formatBirthday } from '@/domain/customer/customer';
import { container } from '@/infrastructure/container';
import { Button } from '@/shared/ui/button';
import { GlassCard } from '@/shared/ui/glass-card';
import { ListRow, SwitchRow } from '@/shared/ui/list-row';
import { Screen } from '@/shared/ui/screen';
import { Text } from '@/shared/ui/text';
import { spacing, useTheme } from '@/shared/ui/theme';

import { accountErrorMessage } from '../messages';
import { useCustomer, useRefreshAccount } from '../queries';

export function AccountScreen() {
  const { colors } = useTheme();
  const customer = useCustomer();
  const refreshAccount = useRefreshAccount();
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (!customer) return null;

  const updateMarketing = async (change: { marketingPush?: boolean; marketingEmail?: boolean }) => {
    setSaving(true);
    const result = await container.account.updateMarketing({
      marketingPush: change.marketingPush ?? customer.marketingPush,
      marketingEmail: change.marketingEmail ?? customer.marketingEmail,
    });
    await refreshAccount();
    setSaving(false);
    if (!result.ok) Alert.alert('Nie udało się zapisać', accountErrorMessage(result.error));
  };

  const confirmDelete = () => {
    Alert.alert(
      'Usunąć konto?',
      'Stracisz kłoski, kupony, nagrody i historię zakupów. Tego nie da się cofnąć.',
      [
        { text: 'Anuluj', style: 'cancel' },
        {
          text: 'Usuń konto',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            const result = await container.account.deleteAccount();
            setDeleting(false);
            if (!result.ok)
              Alert.alert('Nie udało się usunąć konta', accountErrorMessage(result.error));
          },
        },
      ],
    );
  };

  return (
    <Screen>
      <GlassCard style={styles.card}>
        <Text variant="title">{customer.firstName}</Text>
        {customer.email ? <Text muted>{customer.email}</Text> : null}
      </GlassCard>

      <GlassCard style={styles.list}>
        <ListRow
          title="Twój sklep"
          subtitle={customer.homeStoreName ?? 'Nie wybrano'}
          onPress={() => router.push('/account/store')}
        />
        <ListRow
          title="Urodziny"
          subtitle={customer.birthday ? formatBirthday(customer.birthday) : 'Nie podano'}
        />
      </GlassCard>

      <GlassCard style={styles.list}>
        <SwitchRow
          title="Powiadomienia o promocjach"
          value={customer.marketingPush}
          disabled={saving}
          onValueChange={(value) => updateMarketing({ marketingPush: value })}
        />
        <SwitchRow
          title="Oferty na e-mail"
          value={customer.marketingEmail}
          disabled={saving}
          onValueChange={(value) => updateMarketing({ marketingEmail: value })}
        />
      </GlassCard>

      <GlassCard style={styles.list}>
        <ListRow title="Regulamin programu" onPress={() => router.push('/terms')} />
      </GlassCard>

      <View style={styles.actions}>
        <Button variant="secondary" title="Wyloguj się" onPress={() => container.auth.signOut()} />
        <Button
          variant="destructive"
          title="Usuń konto"
          onPress={confirmDelete}
          loading={deleting}
        />
      </View>
      <Text variant="caption" muted style={[styles.center, { color: colors.textMuted }]}>
        Pod Strzechą, program lojalnościowy
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.xs,
  },
  list: {
    paddingVertical: spacing.sm,
  },
  actions: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  center: {
    textAlign: 'center',
  },
});
