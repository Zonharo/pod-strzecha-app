import { Stack } from 'expo-router';

export default function RewardsLayout() {
  return (
    <Stack>
      <Stack.Screen name="index">
        <Stack.Title large>Nagrody</Stack.Title>
      </Stack.Screen>
    </Stack>
  );
}
