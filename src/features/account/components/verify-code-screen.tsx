import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import { CODE_MAX_LENGTH, CODE_MIN_LENGTH } from '@/application/dto/account';
import { container } from '@/infrastructure/container';
import { useNow } from '@/shared/hooks/use-now';
import { Button } from '@/shared/ui/button';
import { FormScreen } from '@/shared/ui/form-screen';
import { Text } from '@/shared/ui/text';
import { TextField } from '@/shared/ui/text-field';

import { authErrorMessage } from '../messages';

const RESEND_SECONDS = 60;

export function VerifyCodeScreen() {
  const { email = '' } = useLocalSearchParams<{ email?: string }>();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [resendAt, setResendAt] = useState(() => Date.now() + RESEND_SECONDS * 1000);
  const now = useNow(1000);
  const secondsLeft = Math.max(0, Math.ceil((resendAt - now) / 1000));

  const verify = async (value: string) => {
    setBusy(true);
    setError(null);
    const result = await container.auth.verifyLoginCode({ email, code: value });
    setBusy(false);
    if (!result.ok) setError(authErrorMessage(result.error));
  };

  const onChange = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, CODE_MAX_LENGTH);
    const pasted = digits.length - code.length > 1;
    setCode(digits);
    if (pasted && digits.length >= CODE_MIN_LENGTH) verify(digits);
  };

  const resend = async () => {
    setError(null);
    setNotice(null);
    const result = await container.auth.sendLoginCode({ email });
    if (!result.ok) {
      setError(authErrorMessage(result.error));
      return;
    }
    setResendAt(Date.now() + RESEND_SECONDS * 1000);
    setNotice('Wysłaliśmy nowy kod.');
  };

  return (
    <FormScreen
      footer={
        <>
          <Button
            title="Zaloguj się"
            onPress={() => verify(code)}
            loading={busy}
            disabled={code.length < CODE_MIN_LENGTH}
          />
          <Button
            variant="plain"
            title={secondsLeft > 0 ? `Nowy kod za ${secondsLeft} s` : 'Wyślij kod jeszcze raz'}
            onPress={resend}
            disabled={secondsLeft > 0}
          />
          <Button variant="plain" title="Zmień e-mail" onPress={() => router.back()} />
        </>
      }
    >
      <Text variant="display">Wpisz kod</Text>
      <Text muted>Wysłaliśmy kod na {email}. Jeśli nie widzisz wiadomości, zajrzyj do spamu.</Text>
      <TextField
        label="Kod z e-maila"
        value={code}
        onChangeText={onChange}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="one-time-code"
        maxLength={CODE_MAX_LENGTH}
        autoFocus
        style={{ fontSize: 28, letterSpacing: 6, textAlign: 'center' }}
        error={error}
        hint={notice ?? undefined}
      />
    </FormScreen>
  );
}
