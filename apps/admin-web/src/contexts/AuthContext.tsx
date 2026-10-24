import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { adminSession } from '../services/session';
import { adminLogin, getMe, type AdminUser } from '../services/adminApi';

type AuthState = {
  user: AdminUser | null;
  initializing: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => void;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [loading, setLoading] = useState(false);

  // On mount: if we have a token, verify it by calling /users/me
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const token = adminSession.getToken();
        if (!token) return;
        const me = await getMe();
        if (!cancelled) {
          setUser({
            id: me.id,
            email: me.email,
            role: me.role,
            fullName: me.fullName ?? null,
          });
        }
      } catch {
        adminSession.clear();
      } finally {
        if (!cancelled) setInitializing(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    setLoading(true);
    try {
      const result = await adminLogin(email, password);
      if (result.user.role !== 'ADMIN') {
        throw new Error(
          'This account does not have admin access. Contact your supervisor.',
        );
      }
      adminSession.setToken(result.token);
      setUser(result.user);
    } finally {
      setLoading(false);
    }
  }, []);

  const signOut = useCallback(() => {
    adminSession.clear();
    setUser(null);
  }, []);

  const value = useMemo<AuthState>(
    () => ({ user, initializing, loading, signIn, signOut }),
    [user, initializing, loading, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}