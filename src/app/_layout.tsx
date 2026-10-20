import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { SessionProvider, useAccountState, useSession } from '@/features/account';
import { QueryProvider } from '@/shared/providers/query-provider';
import { StatusScreen } from '@/shared/ui/status-screen';
import { palette, useTheme } from '@/shared/ui/theme';

const navigationTheme = (scheme: 'light' | 'dark') => {
  const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
  const colors = palette[scheme];
  return {
    ...base,
    colors: {
      ...base.colors,
      primary: colors.ink,
      background: colors.background,
      card: colors.background,
      text: colors.text,
      border: colors.border,
    },
  };
};

function RootNavigator() {
  const session = useSession();
  const account = useAccountState();
  const signedIn = session.status === 'signed_in';
  const state = account.data?.kind;

  if (session.status === 'loading' || (signedIn && account.isPending)) {
    return <StatusScreen loading />;
  }

  if (signedIn && (account.isError || !account.data)) {
    return (
      <StatusScreen
        title="Nie możemy się połączyć"
        description="Sprawdź internet i spróbuj jeszcze raz."
        actionTitle="Spróbuj ponownie"
        onAction={() => account.refetch()}
      />
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!signedIn}>
        <Stack.Screen name="sign-in" />
        <Stack.Screen name="verify" />
      </Stack.Protected>
      <Stack.Protected guard={signedIn && state === 'needs_onboarding'}>
        <Stack.Screen name="onboarding" />
      </Stack.Protected>
      <Stack.Protected guard={signedIn && state === 'needs_terms'}>
        <Stack.Screen name="accept-terms" />
      </Stack.Protected>
      <Stack.Protected guard={signedIn && state === 'blocked'}>
        <Stack.Screen name="blocked" />
      </Stack.Protected>
      <Stack.Protected guard={signedIn && state === 'ready'}>
        <Stack.Screen name="(tabs)" />
      </Stack.Protected>
      <Stack.Screen
        name="terms"
        options={{ presentation: 'modal', headerShown: true, title: 'Regulamin' }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  const { scheme } = useTheme();
  return (
    <SafeAreaProvider>
      <QueryProvider>
        <SessionProvider>
          <ThemeProvider value={navigationTheme(scheme)}>
            <StatusBar style="auto" />
            <RootNavigator />
          </ThemeProvider>
        </SessionProvider>
      </QueryProvider>
    </SafeAreaProvider>
  );
}
