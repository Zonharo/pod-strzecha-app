import {
  makeAcceptTerms,
  makeCompleteOnboarding,
  makeDeleteAccount,
  makeGetAccountState,
  makeUpdateHomeStore,
  makeUpdateMarketing,
} from '@/application/use-cases/account/account';
import {
  makeSendLoginCode,
  makeSignOut,
  makeVerifyLoginCode,
} from '@/application/use-cases/account/auth';
import { makeGetCard } from '@/application/use-cases/card/card';
import type { ProgramSettings } from '@/application/ports/account';
import type { Customer } from '@/domain/customer/customer';
import {
  makeSupabaseProgramRepository,
  makeSupabaseStoreRepository,
} from '@/infrastructure/repositories/supabase-catalog-repositories';
import { makeSupabaseAuthGateway } from '@/infrastructure/repositories/supabase-auth-gateway';
import { makeSupabaseCardRepository } from '@/infrastructure/repositories/supabase-card-repository';
import { makeSupabaseCustomerRepository } from '@/infrastructure/repositories/supabase-customer-repository';
import { makeJsonCache } from '@/infrastructure/storage/local-store';
import { secureCardVault } from '@/infrastructure/storage/secure-card-vault';
import { supabase } from '@/infrastructure/supabase/client';
import { makeRealtime } from '@/infrastructure/supabase/realtime';

const customerCache = makeJsonCache<Customer>('account.current');
const settingsCache = makeJsonCache<ProgramSettings>('program.settings');

const auth = makeSupabaseAuthGateway(supabase);
const customers = makeSupabaseCustomerRepository(supabase, customerCache);
const program = makeSupabaseProgramRepository(supabase, settingsCache);
const stores = makeSupabaseStoreRepository(supabase);
const cards = makeSupabaseCardRepository(supabase);
const realtime = makeRealtime(supabase);

const signOut = makeSignOut({ auth, caches: [customerCache, secureCardVault] });

export type SessionUser = { id: string; email: string | null };

export const container = {
  session: {
    async current(): Promise<SessionUser | null> {
      const { data } = await supabase.auth.getSession();
      const user = data.session?.user;
      return user ? { id: user.id, email: user.email ?? null } : null;
    },
    subscribe(listener: (user: SessionUser | null) => void): () => void {
      const { data } = supabase.auth.onAuthStateChange((_event, session) => {
        const user = session?.user;
        listener(user ? { id: user.id, email: user.email ?? null } : null);
      });
      return () => data.subscription.unsubscribe();
    },
  },
  auth: {
    sendLoginCode: makeSendLoginCode({ auth }),
    verifyLoginCode: makeVerifyLoginCode({ auth }),
    signOut,
  },
  account: {
    getState: makeGetAccountState({ customers, program }),
    completeOnboarding: makeCompleteOnboarding({ customers, program }),
    acceptTerms: makeAcceptTerms({ customers }),
    updateMarketing: makeUpdateMarketing({ customers }),
    updateHomeStore: makeUpdateHomeStore({ customers }),
    deleteAccount: makeDeleteAccount({ customers, signOut }),
  },
  program: {
    getSettings: () => program.getSettings(),
  },
  stores: {
    listActive: () => stores.listActive(),
  },
  card: {
    get: makeGetCard({ cards, vault: secureCardVault }),
  },
  realtime: {
    watchCustomer: realtime.watchCustomer,
  },
};
