import { useQueryClient } from '@tanstack/react-query';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import { container, type SessionUser } from '@/infrastructure/container';

type Session =
  { status: 'loading' } | { status: 'signed_out' } | { status: 'signed_in'; user: SessionUser };

const SessionContext = createContext<Session>({ status: 'loading' });

export function SessionProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<Session>({ status: 'loading' });

  useEffect(() => {
    let active = true;
    container.session.current().then((user) => {
      if (active) setSession(user ? { status: 'signed_in', user } : { status: 'signed_out' });
    });
    const unsubscribe = container.session.subscribe((user) => {
      if (!user) queryClient.clear();
      setSession(user ? { status: 'signed_in', user } : { status: 'signed_out' });
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, [queryClient]);

  return <SessionContext.Provider value={session}>{children}</SessionContext.Provider>;
}

export const useSession = () => useContext(SessionContext);
