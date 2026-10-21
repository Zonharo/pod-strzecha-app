import { Stack } from 'expo-router';

export default function CouponsLayout() {
  return (
    <Stack>
      <Stack.Screen name="index">
        <Stack.Title large>Kupony</Stack.Title>
      </Stack.Screen>
      <Stack.Screen name="[id]">
        <Stack.Title>Kupon</Stack.Title>
      </Stack.Screen>
    </Stack>
  );
}
