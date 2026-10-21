import { AccountScreen } from '@/features/account';
import { PushSettings } from '@/features/notifications';

export default function AccountRoute() {
  return <AccountScreen notifications={<PushSettings />} />;
}
