import { EmptyState } from '@/shared/ui/empty-state';
import { Screen } from '@/shared/ui/screen';

export function RewardsScreen() {
  return (
    <Screen>
      <EmptyState
        icon={{ ios: 'gift.fill', android: 'redeem' }}
        title="Nagrody za kłoski"
        description="Wymienisz tu kłoski na pyszności z naszej piekarni."
      />
    </Screen>
  );
}
