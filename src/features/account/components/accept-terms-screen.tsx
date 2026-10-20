import { router } from 'expo-router';
import { useState } from 'react';

import { container } from '@/infrastructure/container';
import { Button } from '@/shared/ui/button';
import { FormScreen } from '@/shared/ui/form-screen';
import { Text } from '@/shared/ui/text';
import { useTheme } from '@/shared/ui/theme';

import { accountErrorMessage } from '../messages';
import { useAccountState, useRefreshAccount } from '../queries';

export function AcceptTermsScreen() {
  const { colors } = useTheme();
  const account = useAccountState();
  const refreshAccount = useRefreshAccount();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const termsVersion = account.data?.kind === 'needs_terms' ? account.data.termsVersion : null;

  const accept = async () => {
    if (!termsVersion) return;
    setBusy(true);
    setError(null);
    const result = await container.account.acceptTerms(termsVersion);
    setBusy(false);
    if (!result.ok) {
      setError(accountErrorMessage(result.error));
      return;
    }
    await refreshAccount();
  };

  return (
    <FormScreen
      footer={
        <>
          {error ? (
            <Text variant="caption" style={{ color: colors.danger }}>
              {error}
            </Text>
          ) : null}
          <Button title="Akceptuję" onPress={accept} loading={busy} />
          <Button
            variant="plain"
            title="Przeczytaj regulamin"
            onPress={() => router.push('/terms')}
          />
          <Button variant="plain" title="Wyloguj się" onPress={() => container.auth.signOut()} />
        </>
      }
    >
      <Text variant="display">Zmienił się regulamin</Text>
      <Text muted>
        Zanim zbierzesz kolejne kłoski, przeczytaj nową wersję regulaminu i ją zaakceptuj.
      </Text>
    </FormScreen>
  );
}
