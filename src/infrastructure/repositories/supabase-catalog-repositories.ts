import type { ProgramRepository, StoreRepository } from '@/application/ports/account';
import type { SupabaseClient } from '@/infrastructure/supabase/client';

export const makeSupabaseProgramRepository = (supabase: SupabaseClient): ProgramRepository => ({
  async getSettings() {
    const { data, error } = await supabase.from('program_settings').select('*').single();
    if (error) throw new Error(error.message);
    return {
      termsVersion: data.terms_version,
      welcomeBonus: data.welcome_bonus,
      pointsPerZloty: Number(data.points_per_zloty),
      pointsInactivityMonths: data.points_inactivity_months,
      rewardValidDays: data.reward_valid_days,
    };
  },
});

export const makeSupabaseStoreRepository = (supabase: SupabaseClient): StoreRepository => ({
  async listActive() {
    const { data, error } = await supabase
      .from('stores')
      .select('id, code, name, address, city')
      .order('city')
      .order('name');
    if (error) throw new Error(error.message);
    return data;
  },
});
