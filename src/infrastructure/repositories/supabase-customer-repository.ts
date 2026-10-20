import type { CustomerRepository } from '@/application/ports/account';
import type { Customer } from '@/domain/customer/customer';
import { err } from '@/domain/result';
import type { SupabaseClient } from '@/infrastructure/supabase/client';
import { toResult } from '@/infrastructure/supabase/errors';

const currentUser = async (supabase: SupabaseClient) => {
  const { data } = await supabase.auth.getSession();
  return data.session?.user ?? null;
};

export const makeSupabaseCustomerRepository = (supabase: SupabaseClient): CustomerRepository => ({
  async findMe() {
    const user = await currentUser(supabase);
    if (!user) return null;
    const { data, error } = await supabase
      .from('customers')
      .select('*, home_store:stores(name)')
      .eq('id', user.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return null;
    const customer: Customer = {
      id: data.id,
      email: user.email ?? null,
      firstName: data.first_name,
      homeStoreId: data.home_store_id,
      homeStoreName: data.home_store?.name ?? null,
      birthday:
        data.birthday_month && data.birthday_day
          ? { month: data.birthday_month, day: data.birthday_day }
          : null,
      pointsBalance: data.points_balance,
      lifetimePoints: data.lifetime_points,
      termsVersion: data.terms_version,
      marketingPush: data.marketing_push,
      marketingEmail: data.marketing_email,
      status: data.status,
    };
    return customer;
  },

  async completeOnboarding(command) {
    const { error } = await supabase.rpc('complete_onboarding', {
      p_first_name: command.firstName,
      p_home_store_id: command.homeStoreId,
      p_terms_version: command.termsVersion,
      p_marketing_push: command.marketingPush,
      p_marketing_email: command.marketingEmail,
      ...(command.birthday
        ? { p_birthday_month: command.birthday.month, p_birthday_day: command.birthday.day }
        : {}),
    });
    return toResult(error);
  },

  async acceptTerms(termsVersion) {
    const { error } = await supabase.rpc('accept_terms', { p_terms_version: termsVersion });
    return toResult(error);
  },

  async updateMarketing({ marketingPush, marketingEmail }) {
    const user = await currentUser(supabase);
    if (!user) return err('not_authenticated');
    const { error } = await supabase
      .from('customers')
      .update({ marketing_push: marketingPush, marketing_email: marketingEmail })
      .eq('id', user.id);
    return toResult(error);
  },

  async updateHomeStore(storeId) {
    const user = await currentUser(supabase);
    if (!user) return err('not_authenticated');
    const { error } = await supabase
      .from('customers')
      .update({ home_store_id: storeId })
      .eq('id', user.id);
    return toResult(error);
  },

  async deleteAccount() {
    const { error } = await supabase.rpc('delete_my_account');
    return toResult(error);
  },
});
