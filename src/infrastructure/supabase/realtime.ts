import type { SupabaseClient } from './client';

export const makeRealtime = (supabase: SupabaseClient) => ({
  watchCustomer(userId: string, onChange: () => void): () => void {
    const channel = supabase
      .channel(`customer:${userId}`)
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
          event: 'UPDATE',
          schema: 'public',
          table: 'reward_redemptions',
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
