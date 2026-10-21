import { Linking } from 'react-native';

import type { PushStatus } from '@/application/ports/push';
import { Button } from '@/shared/ui/button';
import { ListRow } from '@/shared/ui/list-row';

import { useEnablePush, usePushStatus } from '../push';

const SUBTITLES: Record<PushStatus, string> = {
  enabled: 'Włączone. Dostaniesz znać o nowych kłoskach i nagrodach.',
  undetermined: 'Wyłączone. Włącz, żeby nie przegapić kłosków i prezentów.',
  denied: 'Wyłączone w ustawieniach telefonu.',
  unavailable: 'Zadziałają w pełnej wersji aplikacji ze sklepu.',
};

export function PushSettings() {
  const status = usePushStatus();
  const enable = useEnablePush();
  const current = enable.data ?? status.data;

  if (!current) return null;

  return (
    <>
      <ListRow title="Powiadomienia na telefonie" subtitle={SUBTITLES[current]} />
      {current === 'undetermined' ? (
        <Button
          variant="secondary"
          title="Włącz powiadomienia"
          onPress={() => enable.mutate()}
          loading={enable.isPending}
        />
      ) : current === 'denied' ? (
        <Button
          variant="secondary"
          title="Otwórz ustawienia"
          onPress={() => Linking.openSettings()}
        />
      ) : null}
    </>
  );
}
