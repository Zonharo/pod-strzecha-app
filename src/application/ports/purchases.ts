import type { DomainErrorCode } from '@/domain/errors';
import type {
  PointsEntry,
  PurchaseDetail,
  PurchaseRating,
  PurchaseSummary,
} from '@/domain/purchases/purchase';
import type { Result } from '@/domain/result';

export type PurchaseRepository = {
  list(offset: number, limit: number): Promise<PurchaseSummary[]>;
  get(id: string): Promise<PurchaseDetail | null>;
  rate(purchaseId: string, rating: PurchaseRating): Promise<Result<void, DomainErrorCode>>;
  pointsHistory(offset: number, limit: number): Promise<PointsEntry[]>;
};
