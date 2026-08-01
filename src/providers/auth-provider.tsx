import {
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { firebaseAuthService, type AuthSession } from '@/services';
import type { AdminProfile, User } from '@/types';

interface AuthContextValue {
  profile: AdminProfile | null;
  /** Full `users/{uid}` document for the signed-in operator. */
  account: User | null;
  isAuthenticated: boolean;
  /** True until Firebase has restored (or ruled out) a persisted session. */
  isResolving: boolean;
  signInWithPassword: (email: string, password: string) => Promise<AdminProfile>;
  signInWithGoogle: () => Promise<AdminProfile>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Real Firebase Auth session, gated on the `users/{uid}.role` document.
 *
 * `firebaseAuthService.subscribe` emits `null` both for signed-out visitors and
 * for authenticated non-admins (signing them out as it does so), so a crew
 * member with a valid PWA session can never end up inside the console.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isResolving, setResolving] = useState(true);

  useEffect(() => {
    const unsubscribe = firebaseAuthService.subscribe((next) => {
      setSession(next);
      setResolving(false);
    });
    return unsubscribe;
  }, []);

  const signInWithPassword = useCallback(async (email: string, password: string) => {
    const next = await firebaseAuthService.signInWithPassword(email, password);
    setSession(next);
    return next.profile;
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const next = await firebaseAuthService.signInWithGoogle();
    setSession(next);
    return next.profile;
  }, []);

  const signOut = useCallback(async () => {
    await firebaseAuthService.signOut();
    setSession(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      profile: session?.profile ?? null,
      account: session?.user ?? null,
      isAuthenticated: session !== null,
      isResolving,
      signInWithPassword,
      signInWithGoogle,
      signOut,
    }),
    [session, isResolving, signInWithPassword, signInWithGoogle, signOut],
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}

export function useAuth(): AuthContextValue {
  const context = use(AuthContext);
  if (!context) throw new Error('useAuth must be used within an <AuthProvider>');
  return context;
}
