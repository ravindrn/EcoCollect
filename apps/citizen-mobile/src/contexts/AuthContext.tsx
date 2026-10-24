import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from "react";
import {
  AuthResult,
  AuthUser,
  getMe,
  login as apiLogin,
  register as apiRegister,
  RegisterInput,
} from "../services/auth";
import { clearToken, getToken, saveToken } from "../services/tokenStorage";
import { setUnauthorizedHandler } from "../services/http";

type AuthState = {
  user: AuthUser | null;
  loading: boolean;
  initializing: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (input: RegisterInput) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [loading, setLoading] = useState(false);

  const signOut = useCallback(async () => {
    await clearToken();
    setUser(null);
  }, []);

  // Called once on mount: if a token exists, validate it by fetching /me.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const token = await getToken();
        if (!token) {
          if (!cancelled) setInitializing(false);
          return;
        }
        const me = await getMe();
        if (!cancelled) {
          setUser({
            id: me.id,
            email: me.email,
            role: me.role,
            fullName: me.profile?.fullName ?? null,
            areaName: me.profile?.area?.name ?? null,
          });
        }
      } catch {
        await clearToken();
      } finally {
        if (!cancelled) setInitializing(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Hook into the API client so 401 responses trigger sign-out.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      setUser(null);
    });
    return () => setUnauthorizedHandler(null);
  }, []);

  const applyAuthResult = useCallback(async (result: AuthResult) => {
    await saveToken(result.token);

    const me = await getMe();

    setUser({
      id: me.id,
      email: me.email,
      role: me.role,
      fullName: me.profile?.fullName ?? null,
      areaName: me.profile?.area?.name ?? null,
    });
  }, []);

  const signIn = useCallback(
    async (email: string, password: string) => {
      setLoading(true);
      try {
        const result = await apiLogin(email, password);
        await applyAuthResult(result);
      } finally {
        setLoading(false);
      }
    },
    [applyAuthResult],
  );

  const signUp = useCallback(async (input: RegisterInput) => {
  setLoading(true);
  try {
    // Do NOT save token — user must sign in after registration.
    await apiRegister(input);
  } finally {
    setLoading(false);
  }
}, []);

  const value = useMemo<AuthState>(
    () => ({
      user,
      loading,
      initializing,
      signIn,
      signUp,
      signOut,
    }),
    [user, loading, initializing, signIn, signUp, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
