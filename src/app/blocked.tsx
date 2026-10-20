import { container } from '@/infrastructure/container';
import { StatusScreen } from '@/shared/ui/status-screen';

export default function BlockedRoute() {
  return (
    <StatusScreen
      title="Konto jest zablokowane"
      description="Jeśli to pomyłka, napisz do nas, a wyjaśnimy sprawę."
      actionTitle="Wyloguj się"
      onAction={() => container.auth.signOut()}
    />
  );
}
