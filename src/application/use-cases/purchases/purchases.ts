import { ratingSchema, type RatingInput } from '@/application/dto/purchases';
import type { PurchaseRepository } from '@/application/ports/purchases';
import type { DomainErrorCode } from '@/domain/errors';
import {
  PAGE_SIZE,
  toPage,
  type Page,
  type PointsEntry,
  type PurchaseSummary,
} from '@/domain/purchases/purchase';
import { err, ok, type Result } from '@/domain/result';

export type RatingError =
  { kind: 'validation'; message: string } | { kind: 'domain'; code: DomainErrorCode };

export const makeListPurchases =
  ({ purchases }: { purchases: PurchaseRepository }) =>
  async (page: number): Promise<Page<PurchaseSummary>> =>
    toPage(await purchases.list(page * PAGE_SIZE, PAGE_SIZE + 1), page);

export const makeListPointsHistory =
  ({ purchases }: { purchases: PurchaseRepository }) =>
  async (page: number): Promise<Page<PointsEntry>> =>
    toPage(await purchases.pointsHistory(page * PAGE_SIZE, PAGE_SIZE + 1), page);

export const makeGetPurchase =
  ({ purchases }: { purchases: PurchaseRepository }) =>
  (id: string) =>
    purchases.get(id);

export const makeRatePurchase =
  ({ purchases }: { purchases: PurchaseRepository }) =>
  async (input: RatingInput): Promise<Result<void, RatingError>> => {
    const parsed = ratingSchema.safeParse(input);
    if (!parsed.success) {
      return err({ kind: 'validation', message: parsed.error.issues[0]?.message ?? 'invalid' });
    }
    const { purchaseId, rating, tags, comment } = parsed.data;
    const result = await purchases.rate(purchaseId, { rating, tags, comment });
    return result.ok ? ok(undefined) : err({ kind: 'domain', code: result.error });
  };
