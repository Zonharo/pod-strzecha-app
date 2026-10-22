import type { SupabaseClient } from './client';

let sequence = 0;

export const makeRealtime = (supabase: SupabaseClient) => ({
  watchCustomer(userId: string, onChange: () => void): () => void {
    sequence += 1;
    const channel = supabase
      .channel(`customer:${userId}:${sequence}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'customers', filter: `id=eq.${userId}` },
        onChange,
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'customer_notifications',
          filter: `customer_id=eq.${userId}`,
        },
        onChange,
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reward_redemptions',
          filter: `customer_id=eq.${userId}`,
        },
        onChange,
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'customer_coupons',
          filter: `customer_id=eq.${userId}`,
        },
        onChange,
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  },
});
