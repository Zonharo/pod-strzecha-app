export const RATING_TAGS = [
  'freshness',
  'taste',
  'service',
  'wait_time',
  'choice',
  'cleanliness',
  'prices',
] as const;

export type RatingTag = (typeof RATING_TAGS)[number];

export type PurchaseRating = {
  rating: number;
  tags: RatingTag[];
  comment: string | null;
};

export type PurchaseSummary = {
  id: string;
  storeName: string;
  occurredAt: string;
  total: number;
  discountTotal: number;
  pointsEarned: number;
  refunded: boolean;
  rating: PurchaseRating | null;
};

export type PurchaseItem = {
  position: number;
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
};

export type PurchaseDetail = PurchaseSummary & {
  receiptNumber: string | null;
  items: PurchaseItem[];
  couponTitles: string[];
};

const DAY_MS = 86_400_000;

export const ratingDeadline = (purchase: Pick<PurchaseSummary, 'occurredAt'>, windowDays: number) =>
  new Date(new Date(purchase.occurredAt).getTime() + windowDays * DAY_MS);

export const canRate = (
  purchase: Pick<PurchaseSummary, 'occurredAt' | 'refunded'>,
  nowMs: number,
  windowDays: number,
): boolean => !purchase.refunded && nowMs < ratingDeadline(purchase, windowDays).getTime();

export const tagMood = (rating: number): 'praise' | 'complaint' =>
  rating >= 4 ? 'praise' : 'complaint';

export type PointsEntryKind =
  'welcome' | 'purchase' | 'purchase_refund' | 'reward' | 'reward_refund' | 'expiry' | 'adjustment';

export type PointsEntry = {
  id: string;
  kind: PointsEntryKind;
  delta: number;
  createdAt: string;
  purchaseId: string | null;
  storeName: string | null;
  rewardTitle: string | null;
  note: string | null;
};

export type Page<T> = { items: T[]; nextPage: number | null };

export const PAGE_SIZE = 20;

export const toPage = <T>(rows: T[], page: number): Page<T> => ({
  items: rows.slice(0, PAGE_SIZE),
  nextPage: rows.length > PAGE_SIZE ? page + 1 : null,
});
