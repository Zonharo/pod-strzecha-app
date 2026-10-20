import type { CardRepository } from '@/application/ports/card';
import type { SupabaseClient } from '@/infrastructure/supabase/client';

export const makeSupabaseCardRepository = (supabase: SupabaseClient): CardRepository => ({
  async fetchMyCard() {
    const { data, error } = await supabase.rpc('my_card');
    if (error) throw new Error(error.message);
    const row = data[0];
    return row
      ? {
          number: row.card_number,
          secretHex: row.secret_hex,
          periodSeconds: row.period_seconds,
          digits: row.digits,
        }
      : null;
  },
});
