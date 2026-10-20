import { StyleSheet, View } from 'react-native';

import { formatPoints } from '@/domain/points/points';
import { GlassCard } from '@/shared/ui/glass-card';
import { Screen } from '@/shared/ui/screen';
import { StatusScreen } from '@/shared/ui/status-screen';
import { Text } from '@/shared/ui/text';
import { spacing } from '@/shared/ui/theme';

import { useProgramSettings } from '../queries';

export function TermsContent() {
  const settings = useProgramSettings();
  if (!settings.data) {
    return settings.isError ? (
      <StatusScreen
        title="Nie udało się wczytać zasad"
        actionTitle="Spróbuj ponownie"
        onAction={() => settings.refetch()}
      />
    ) : (
      <StatusScreen loading />
    );
  }

  const s = settings.data;
  const rules = [
    `Za każdą pełną złotówkę wydaną w sklepach Pod Strzechą dostajesz ${formatPoints(Math.max(1, Math.round(s.pointsPerZloty)))}.`,
    `Na powitanie dostajesz ${formatPoints(s.welcomeBonus)}.`,
    'Kłoski dopisują się, gdy pokażesz kartę z aplikacji przy kasie.',
    `Kłoski wymieniasz na nagrody. Nagrodę odbierasz w ciągu ${s.rewardValidDays} dni, a jeśli nie zdążysz, kłoski wrócą na Twoje konto.`,
    `Kłoski wygasają, jeśli przez ${s.pointsInactivityMonths} mies. nie zrobisz zakupów. Przypomnimy Ci o tym wcześniej.`,
    'Kupony aktywujesz w aplikacji, a kasjer zobaczy je po zeskanowaniu karty.',
    'Konto możesz usunąć w każdej chwili w zakładce Konto.',
  ];

  return (
    <Screen>
      <GlassCard style={styles.card}>
        <Text variant="title">Najważniejsze zasady</Text>
        {rules.map((rule) => (
          <View key={rule} style={styles.rule}>
            <Text>•</Text>
            <Text style={styles.ruleText}>{rule}</Text>
          </View>
        ))}
      </GlassCard>
      <Text variant="caption" muted>
        Wersja regulaminu z dnia {s.termsVersion}.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.sm,
  },
  rule: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  ruleText: {
    flex: 1,
  },
});
