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
import {
  makeSupabaseProgramRepository,
  makeSupabaseStoreRepository,
} from '@/infrastructure/repositories/supabase-catalog-repositories';
import { makeSupabaseAuthGateway } from '@/infrastructure/repositories/supabase-auth-gateway';
import { makeSupabaseCustomerRepository } from '@/infrastructure/repositories/supabase-customer-repository';
import { supabase } from '@/infrastructure/supabase/client';

const auth = makeSupabaseAuthGateway(supabase);
const customers = makeSupabaseCustomerRepository(supabase);
const program = makeSupabaseProgramRepository(supabase);
const stores = makeSupabaseStoreRepository(supabase);

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
    signOut: makeSignOut({ auth }),
  },
  account: {
    getState: makeGetAccountState({ customers, program }),
    completeOnboarding: makeCompleteOnboarding({ customers, program }),
    acceptTerms: makeAcceptTerms({ customers }),
    updateMarketing: makeUpdateMarketing({ customers }),
    updateHomeStore: makeUpdateHomeStore({ customers }),
    deleteAccount: makeDeleteAccount({ customers, auth }),
  },
  program: {
    getSettings: () => program.getSettings(),
  },
  stores: {
    listActive: () => stores.listActive(),
  },
};
