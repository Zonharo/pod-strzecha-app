import { Stack } from 'expo-router';

export default function AccountLayout() {
  return (
    <Stack>
      <Stack.Screen name="index">
        <Stack.Title large>Konto</Stack.Title>
      </Stack.Screen>
      <Stack.Screen name="store">
        <Stack.Title>Twój sklep</Stack.Title>
      </Stack.Screen>
    </Stack>
  );
}
