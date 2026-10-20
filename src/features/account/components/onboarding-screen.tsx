import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  onboardingSchema,
  type OnboardingInput,
  type OnboardingValues,
} from '@/application/dto/account';
import { formatPoints } from '@/domain/points/points';
import { container } from '@/infrastructure/container';
import { Button } from '@/shared/ui/button';
import { FormScreen } from '@/shared/ui/form-screen';
import { CheckRow, SwitchRow } from '@/shared/ui/list-row';
import { Text } from '@/shared/ui/text';
import { TextField } from '@/shared/ui/text-field';
import { spacing, useTheme } from '@/shared/ui/theme';

import { accountErrorMessage, validationMessage } from '../messages';
import { useProgramSettings, useRefreshAccount } from '../queries';
import { StorePicker } from './store-picker';

type Step = 'name' | 'store' | 'details';

const STEP_NUMBER: Record<Step, number> = { name: 1, store: 2, details: 3 };

function StepLabel({ step }: { step: Step }) {
  return (
    <Text variant="label" muted>
      Krok {STEP_NUMBER[step]} z 3
    </Text>
  );
}

export function OnboardingScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const refreshAccount = useRefreshAccount();
  const settings = useProgramSettings();
  const [step, setStep] = useState<Step>('name');
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    trigger,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<OnboardingInput, unknown, OnboardingValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      firstName: '',
      homeStoreId: '',
      birthdayDay: '',
      birthdayMonth: '',
      marketingPush: false,
      marketingEmail: false,
      acceptTerms: false,
    },
  });

  const firstName = useWatch({ control, name: 'firstName' });
  const homeStoreId = useWatch({ control, name: 'homeStoreId' });

  const submit = handleSubmit(async (values) => {
    setServerError(null);
    const result = await container.account.completeOnboarding(values);
    if (!result.ok) {
      setServerError(accountErrorMessage(result.error));
      return;
    }
    await refreshAccount();
  });

  if (step === 'name') {
    return (
      <FormScreen
        footer={
          <Button
            title="Dalej"
            onPress={async () => {
              if (await trigger('firstName')) setStep('store');
            }}
          />
        }
      >
        <StepLabel step={step} />
        <Text variant="display">Jak masz na imię?</Text>
        <Text muted>Tak będziemy się do Ciebie zwracać w aplikacji.</Text>
        <Controller
          control={control}
          name="firstName"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextField
              label="Imię"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              autoComplete="given-name"
              textContentType="givenName"
              autoCapitalize="words"
              autoFocus
              returnKeyType="next"
              maxLength={40}
              error={validationMessage(errors.firstName?.message)}
            />
          )}
        />
      </FormScreen>
    );
  }

  if (step === 'store') {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <View style={{ flex: 1, paddingTop: insets.top }}>
          <StorePicker
            selectedId={homeStoreId || null}
            onSelect={(store) => setValue('homeStoreId', store.id, { shouldValidate: true })}
            header={
              <View style={styles.storeHeader}>
                <StepLabel step={step} />
                <Text variant="display">Twój sklep</Text>
                <Text muted>
                  {firstName.trim()}, gdzie najczęściej robisz zakupy? Pokażemy Ci oferty z tego
                  sklepu. Zmienisz go w każdej chwili.
                </Text>
              </View>
            }
          />
        </View>
        <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
          {errors.homeStoreId ? (
            <Text variant="caption" style={{ color: colors.danger }}>
              {validationMessage(errors.homeStoreId.message)}
            </Text>
          ) : null}
          <Button
            title="Dalej"
            onPress={async () => {
              if (await trigger('homeStoreId')) setStep('details');
            }}
          />
          <Button variant="plain" title="Wróć" onPress={() => setStep('name')} />
        </View>
      </View>
    );
  }

  const welcome = settings.data?.welcomeBonus ?? 0;

  return (
    <FormScreen
      footer={
        <>
          {serverError ? (
            <Text variant="caption" style={{ color: colors.danger }}>
              {serverError}
            </Text>
          ) : null}
          <Button title="Zaczynamy" onPress={submit} loading={isSubmitting} />
          <Button variant="plain" title="Wróć" onPress={() => setStep('store')} />
        </>
      }
    >
      <StepLabel step={step} />
      <Text variant="display">Jeszcze chwila</Text>
      {welcome > 0 ? <Text muted>Na start dostaniesz {formatPoints(welcome)}.</Text> : null}

      <View style={styles.section}>
        <Text variant="title">Urodziny</Text>
        <Text variant="caption" muted>
          Nieobowiązkowe. W dniu urodzin czeka na Ciebie prezent. Datę podajesz tylko raz.
        </Text>
        <View style={styles.birthday}>
          <View style={styles.birthdayField}>
            <Controller
              control={control}
              name="birthdayDay"
              render={({ field: { onChange, value } }) => (
                <TextField
                  label="Dzień"
                  placeholder="np. 15"
                  value={String(value ?? '')}
                  onChangeText={(text) => onChange(text.replace(/\D/g, ''))}
                  keyboardType="number-pad"
                  maxLength={2}
                  error={validationMessage(errors.birthdayDay?.message)}
                />
              )}
            />
          </View>
          <View style={styles.birthdayField}>
            <Controller
              control={control}
              name="birthdayMonth"
              render={({ field: { onChange, value } }) => (
                <TextField
                  label="Miesiąc"
                  placeholder="np. 3"
                  value={String(value ?? '')}
                  onChangeText={(text) => onChange(text.replace(/\D/g, ''))}
                  keyboardType="number-pad"
                  maxLength={2}
                />
              )}
            />
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text variant="title">Oferty</Text>
        <Controller
          control={control}
          name="marketingPush"
          render={({ field: { onChange, value } }) => (
            <SwitchRow
              title="Powiadomienia o promocjach"
              subtitle="Nowe kupony i oferty Twojego sklepu."
              value={value}
              onValueChange={onChange}
            />
          )}
        />
        <Controller
          control={control}
          name="marketingEmail"
          render={({ field: { onChange, value } }) => (
            <SwitchRow
              title="Oferty na e-mail"
              subtitle="Najwyżej kilka wiadomości w miesiącu."
              value={value}
              onValueChange={onChange}
            />
          )}
        />
      </View>

      <Controller
        control={control}
        name="acceptTerms"
        render={({ field: { onChange, value } }) => (
          <CheckRow
            checked={value === true}
            onToggle={() => onChange(!value)}
            error={validationMessage(errors.acceptTerms?.message)}
            title={
              <Text>
                Akceptuję{' '}
                <Text
                  style={{ color: colors.ink, fontWeight: '600' }}
                  onPress={() => router.push('/terms')}
                >
                  regulamin programu
                </Text>
                .
              </Text>
            }
          />
        )}
      />
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  storeHeader: {
    gap: spacing.sm,
    paddingTop: spacing.lg,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    gap: spacing.sm,
  },
  section: {
    gap: spacing.sm,
  },
  birthday: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  birthdayField: {
    flex: 1,
  },
});
