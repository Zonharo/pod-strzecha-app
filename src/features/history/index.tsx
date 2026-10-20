import { EmptyState } from '@/shared/ui/empty-state';
import { Screen } from '@/shared/ui/screen';

export function HistoryScreen() {
  return (
    <Screen>
      <EmptyState
        icon={{ ios: 'bag.fill', android: 'shopping_bag' }}
        title="Jeszcze nic tu nie ma"
        description="Po pierwszych zakupach zobaczysz je tutaj i ocenisz, jak było."
      />
    </Screen>
  );
}
