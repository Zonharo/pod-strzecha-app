import type { RatingError } from '@/application/use-cases/purchases/purchases';
import type { PointsEntry, RatingTag } from '@/domain/purchases/purchase';

export const TAG_LABELS: Record<RatingTag, string> = {
  freshness: 'Świeżość',
  taste: 'Smak',
  service: 'Obsługa',
  wait_time: 'Czas czekania',
  choice: 'Wybór',
  cleanliness: 'Czystość',
  prices: 'Ceny',
};

export const STAR_LABELS = ['', 'Słabo', 'Mogło być lepiej', 'W porządku', 'Dobrze', 'Super'];

export const pointsEntryTitle = (entry: PointsEntry): string => {
  switch (entry.kind) {
    case 'welcome':
      return 'Na powitanie';
    case 'purchase':
      return entry.storeName ? `Zakupy, ${entry.storeName}` : 'Zakupy';
    case 'purchase_refund':
      return 'Zwrot zakupów';
    case 'reward':
      return entry.rewardTitle ? `Nagroda: ${entry.rewardTitle}` : 'Nagroda';
    case 'reward_refund':
      return entry.rewardTitle ? `Zwrot za nagrodę: ${entry.rewardTitle}` : 'Zwrot za nagrodę';
    case 'expiry':
      return 'Kłoski wygasły';
    case 'adjustment':
      return entry.note ?? 'Korekta';
  }
};

export const ratingErrorMessage = (error: RatingError): string => {
  if (error.kind === 'validation') {
    if (error.message === 'rating_required') return 'Wybierz liczbę gwiazdek.';
    if (error.message === 'comment_too_long') return 'Komentarz może mieć najwyżej 500 znaków.';
    return 'Sprawdź ocenę i spróbuj jeszcze raz.';
  }
  if (error.code === 'rating_closed') return 'Te zakupy można już tylko przeglądać.';
  if (error.code === 'network') return 'Brak połączenia z internetem. Spróbuj ponownie.';
  return 'Nie udało się zapisać oceny. Spróbuj jeszcze raz.';
};
