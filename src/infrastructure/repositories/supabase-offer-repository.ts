import type { OfferRepository } from '@/application/ports/offers';
import type { Benefit, Coupon, Reward } from '@/domain/offers/offers';
import { err, ok } from '@/domain/result';
import type { SupabaseClient } from '@/infrastructure/supabase/client';
import type { Tables } from '@/infrastructure/supabase/database.types';
import { toResult } from '@/infrastructure/supabase/errors';

const imageUrl = (supabase: SupabaseClient, path: string | null): string | null =>
  path ? supabase.storage.from('media').getPublicUrl(path).data.publicUrl : null;

const benefitOf = (row: { benefit: Benefit['kind']; value: number | null }): Benefit => ({
  kind: row.benefit,
  value: row.value === null ? null : Number(row.value),
});

const toCoupon = (supabase: SupabaseClient, row: Tables<'coupons'>): Coupon => ({
  id: row.id,
  title: row.title,
  description: row.description,
  terms: row.terms,
  imageUrl: imageUrl(supabase, row.image_path),
  benefit: benefitOf(row),
  minTotal: row.min_total === null ? null : Number(row.min_total),
  limitedToStores: row.scope !== 'network',
  startsAt: row.starts_at,
  endsAt: row.ends_at,
  usesPerCustomer: row.uses_per_customer,
});

type RewardRow = Pick<
  Tables<'rewards'>,
  | 'id'
  | 'title'
  | 'description'
  | 'terms'
  | 'image_path'
  | 'points_cost'
  | 'benefit'
  | 'value'
  | 'stock'
>;

const toReward = (supabase: SupabaseClient, row: RewardRow): Reward => ({
  id: row.id,
  title: row.title,
  description: row.description,
  terms: row.terms,
  imageUrl: imageUrl(supabase, row.image_path),
  pointsCost: row.points_cost,
  benefit: benefitOf(row),
  stock: row.stock,
});

export const makeSupabaseOfferRepository = (supabase: SupabaseClient): OfferRepository => ({
  async availableCoupons(storeId) {
    const { data, error } = await supabase.rpc(
      'coupons_for_store',
      storeId ? { p_store_id: storeId } : {},
    );
    if (error) throw new Error(error.message);
    return data.map((row) => toCoupon(supabase, row));
  },

  async myCoupons() {
    const { data, error } = await supabase
      .from('customer_coupons')
      .select('id, source, uses_left, valid_from, valid_until, coupon:coupons(*)')
      .order('valid_until', { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    return data
      .filter((row) => row.coupon !== null)
      .map((row) => ({
        id: row.id,
        source: row.source,
        usesLeft: row.uses_left,
        validFrom: row.valid_from,
        validUntil: row.valid_until,
        coupon: toCoupon(supabase, row.coupon!),
      }));
  },

  async activateCoupon(couponId) {
    const { data, error } = await supabase.rpc('activate_coupon', { p_coupon_id: couponId });
    const result = toResult(error);
    return result.ok ? ok(data!) : err(result.error);
  },

  async rewards() {
    const { data, error } = await supabase
      .from('rewards')
      .select('id, title, description, terms, image_path, points_cost, benefit, value, stock')
      .eq('is_active', true)
      .order('points_cost')
      .order('sort_order');
    if (error) throw new Error(error.message);
    return data.map((row) => toReward(supabase, row));
  },

  async myRedemptions() {
    const { data, error } = await supabase
      .from('reward_redemptions')
      .select(
        'id, status, points_spent, created_at, expires_at, used_at, reward:rewards(id, title, description, terms, image_path, points_cost, benefit, value, stock)',
      )
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return data
      .filter((row) => row.reward !== null)
      .map((row) => {
        const reward = toReward(supabase, row.reward!);
        return {
          id: row.id,
          status: row.status,
          pointsSpent: row.points_spent,
          createdAt: row.created_at,
          expiresAt: row.expires_at,
          usedAt: row.used_at,
          reward: {
            id: reward.id,
            title: reward.title,
            description: reward.description,
            imageUrl: reward.imageUrl,
            benefit: reward.benefit,
          },
        };
      });
  },

  async redeemReward(rewardId) {
    const { data, error } = await supabase.rpc('redeem_reward', { p_reward_id: rewardId });
    const result = toResult(error);
    return result.ok ? ok(data!) : err(result.error);
  },

  async offersForStore(storeId) {
    const { data, error } = await supabase.rpc(
      'offers_for_store',
      storeId ? { p_store_id: storeId } : {},
    );
    if (error) throw new Error(error.message);
    return data.map((row) => ({
      id: row.id,
      title: row.title,
      body: row.body,
      imageUrl: imageUrl(supabase, row.image_path),
      couponId: row.coupon_id,
      rewardId: row.reward_id,
      linkUrl: row.link_url,
      endsAt: row.ends_at,
    }));
  },

  async cancelRedemption(redemptionId) {
    const { error } = await supabase.rpc('cancel_reward_redemption', {
      p_redemption_id: redemptionId,
    });
    return toResult(error);
  },
});
