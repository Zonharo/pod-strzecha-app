import { zodResolver } from '@hookform/resolvers/zod';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';

import { emailSchema, type EmailInput } from '@/application/dto/account';
import { container } from '@/infrastructure/container';
import { Button } from '@/shared/ui/button';
import { FormScreen } from '@/shared/ui/form-screen';
import { Text } from '@/shared/ui/text';
import { TextField } from '@/shared/ui/text-field';
import { spacing } from '@/shared/ui/theme';

import { authErrorMessage } from '../messages';

export function SignInScreen() {
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EmailInput>({ resolver: zodResolver(emailSchema), defaultValues: { email: '' } });

  const submit = handleSubmit(async (values) => {
    setServerError(null);
    const result = await container.auth.sendLoginCode(values);
    if (!result.ok) {
      setServerError(authErrorMessage(result.error));
      return;
    }
    router.push({ pathname: '/verify', params: { email: result.value.email } });
  });

  return (
    <FormScreen footer={<Button title="Wyślij kod" onPress={submit} loading={isSubmitting} />}>
      <View style={styles.hero}>
        <Image
          source={require('@/assets/images/icon.png')}
          style={styles.logo}
          contentFit="contain"
          accessibilityIgnoresInvertColors
        />
        <Text variant="display" style={styles.center}>
          Witaj!
        </Text>
        <Text muted style={styles.center}>
          Zbieraj kłoski za zakupy i wymieniaj je na pyszności. Zaloguj się kodem z e-maila, bez
          hasła.
        </Text>
      </View>

      <Controller
        control={control}
        name="email"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextField
            label="E-mail"
            placeholder="ty@przyklad.pl"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            onSubmitEditing={() => submit()}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            textContentType="emailAddress"
            autoCorrect={false}
            returnKeyType="send"
            error={errors.email ? authErrorMessage('invalid_email') : serverError}
          />
        )}
      />
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  logo: {
    width: 160,
    height: 160,
    borderRadius: 32,
  },
  center: {
    textAlign: 'center',
  },
});
