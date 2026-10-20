import type { PurchaseRepository } from '@/application/ports/purchases';
import type { PurchaseRating, PurchaseSummary } from '@/domain/purchases/purchase';
import type { SupabaseClient } from '@/infrastructure/supabase/client';
import { toResult } from '@/infrastructure/supabase/errors';

const SUMMARY = `
  id, occurred_at, total, discount_total, points_earned, refunded_at,
  store:stores(name),
  rating:purchase_ratings(rating, tags, comment)
` as const;

type SummaryRow = {
  id: string;
  occurred_at: string;
  total: number;
  discount_total: number;
  points_earned: number;
  refunded_at: string | null;
  store: { name: string } | null;
  rating: { rating: number; tags: PurchaseRating['tags']; comment: string | null } | null;
};

const toSummary = (row: SummaryRow): PurchaseSummary => ({
  id: row.id,
  storeName: row.store?.name ?? 'Pod Strzechą',
  occurredAt: row.occurred_at,
  total: Number(row.total),
  discountTotal: Number(row.discount_total),
  pointsEarned: row.points_earned,
  refunded: row.refunded_at !== null,
  rating: row.rating
    ? { rating: row.rating.rating, tags: row.rating.tags, comment: row.rating.comment }
    : null,
});

export const makeSupabasePurchaseRepository = (supabase: SupabaseClient): PurchaseRepository => ({
  async list(offset, limit) {
    const { data, error } = await supabase
      .from('purchases')
      .select(SUMMARY)
      .order('occurred_at', { ascending: false })
      .range(offset, offset + limit - 1);
    if (error) throw new Error(error.message);
    return data.map(toSummary);
  },

  async get(id) {
    const { data, error } = await supabase
      .from('purchases')
      .select(
        `${SUMMARY},
        receipt_number,
        items:purchase_items(position, name, quantity, unit_price, total),
        coupon_uses(customer_coupon:customer_coupons(coupon:coupons(title)))`,
      )
      .eq('id', id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return null;
    return {
      ...toSummary(data),
      receiptNumber: data.receipt_number,
      items: [...data.items]
        .sort((a, b) => a.position - b.position)
        .map((item) => ({
          position: item.position,
          name: item.name,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unit_price),
          total: Number(item.total),
        })),
      couponTitles: data.coupon_uses
        .map((use) => use.customer_coupon?.coupon?.title)
        .filter((title): title is string => !!title),
    };
  },

  async rate(purchaseId, { rating, tags, comment }) {
    const { error } = await supabase.rpc('rate_purchase', {
      p_purchase_id: purchaseId,
      p_rating: rating,
      p_tags: tags,
      ...(comment ? { p_comment: comment } : {}),
    });
    return toResult(error);
  },

  async pointsHistory(offset, limit) {
    const { data, error } = await supabase
      .from('points_ledger')
      .select(
        `id, kind, delta, created_at, note, purchase_id,
        purchase:purchases(store:stores(name)),
        redemption:reward_redemptions(reward:rewards(title))`,
      )
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    if (error) throw new Error(error.message);
    return data.map((row) => ({
      id: row.id,
      kind: row.kind,
      delta: row.delta,
      createdAt: row.created_at,
      purchaseId: row.purchase_id,
      storeName: row.purchase?.store?.name ?? null,
      rewardTitle: row.redemption?.reward?.title ?? null,
      note: row.note,
    }));
  },
});
