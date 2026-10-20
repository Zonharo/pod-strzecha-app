import { router } from 'expo-router';
import { Alert } from 'react-native';

import { container } from '@/infrastructure/container';

import { accountErrorMessage } from '../messages';
import { useCustomer, useRefreshAccount } from '../queries';
import { StorePicker } from './store-picker';

export function HomeStoreScreen() {
  const customer = useCustomer();
  const refreshAccount = useRefreshAccount();

  return (
    <StorePicker
      selectedId={customer?.homeStoreId ?? null}
      onSelect={async (store) => {
        const result = await container.account.updateHomeStore(store.id);
        if (!result.ok) {
          Alert.alert('Nie udało się zapisać', accountErrorMessage(result.error));
          return;
        }
        await refreshAccount();
        router.back();
      }}
    />
  );
}
