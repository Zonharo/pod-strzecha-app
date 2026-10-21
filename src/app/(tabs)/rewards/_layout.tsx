import { Stack } from 'expo-router';

export default function RewardsLayout() {
  return (
    <Stack>
      <Stack.Screen name="index">
        <Stack.Title large>Nagrody</Stack.Title>
      </Stack.Screen>
      <Stack.Screen name="[id]">
        <Stack.Title>Nagroda</Stack.Title>
      </Stack.Screen>
      <Stack.Screen name="redemptions/[id]">
        <Stack.Title>Do odebrania</Stack.Title>
      </Stack.Screen>
    </Stack>
  );
}
