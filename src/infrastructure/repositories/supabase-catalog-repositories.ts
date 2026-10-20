import type {
  ProgramRepository,
  ProgramSettings,
  StoreRepository,
} from '@/application/ports/account';
import type { JsonCache } from '@/infrastructure/storage/local-store';
import type { SupabaseClient } from '@/infrastructure/supabase/client';
import { isNetworkError } from '@/infrastructure/supabase/errors';

export const makeSupabaseProgramRepository = (
  supabase: SupabaseClient,
  cache: JsonCache<ProgramSettings>,
): ProgramRepository => ({
  async getSettings() {
    const { data, error } = await supabase.from('program_settings').select('*').single();
    if (error) {
      const cached = isNetworkError(error) ? await cache.read() : null;
      if (cached) return cached;
      throw new Error(error.message);
    }
    const settings: ProgramSettings = {
      termsVersion: data.terms_version,
      welcomeBonus: data.welcome_bonus,
      pointsPerZloty: Number(data.points_per_zloty),
      pointsInactivityMonths: data.points_inactivity_months,
      rewardValidDays: data.reward_valid_days,
    };
    await cache.write(settings);
    return settings;
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
