import { Stack } from 'expo-router';

export default function HistoryLayout() {
  return (
    <Stack>
      <Stack.Screen name="index">
        <Stack.Title large>Historia</Stack.Title>
      </Stack.Screen>
    </Stack>
  );
}
