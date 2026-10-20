import { EmptyState } from '@/shared/ui/empty-state';
import { Screen } from '@/shared/ui/screen';

export function CouponsScreen() {
  return (
    <Screen>
      <EmptyState
        icon={{ ios: 'ticket.fill', android: 'confirmation_number' }}
        title="Kupony już niedługo"
        description="Aktywujesz je jednym dotknięciem, a kasjer zobaczy je po zeskanowaniu karty."
      />
    </Screen>
  );
}
