/**
 * Auth context for the Zarpay mobile app. Holds the current user, handles
 * sign in, sign up, and sign out, and persists the JWT via `expo-secure-store`
 * through the api client. On first mount it tries to hydrate from a stored
 * token by calling `/api/me`.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { api, ApiClientError } from "./api";
import type { PublicUser, SignUpRequest } from "@zarpay/types";

export type AuthState =
  | { status: "loading" }
  | { status: "unauthenticated" }
  | { status: "authenticated"; user: PublicUser };

interface AuthContextValue {
  state: AuthState;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (data: SignUpRequest) => Promise<void>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: "loading" });

  const hydrate = useCallback(async () => {
    try {
      const { user } = await api.getMe();
      setState({ status: "authenticated", user });
    } catch (err) {
      // Any 401 or network error means no valid session. Clear any stored
      // token just in case and drop into unauthenticated.
      if (err instanceof ApiClientError && err.status === 401) {
        await api.signOut();
      }
      setState({ status: "unauthenticated" });
    }
  }, []);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { user } = await api.signIn({ email, password });
    setState({ status: "authenticated", user });
  }, []);

  const signUp = useCallback(async (data: SignUpRequest) => {
    const { user } = await api.signUp(data);
    setState({ status: "authenticated", user });
  }, []);

  const signOut = useCallback(async () => {
    await api.signOut();
    setState({ status: "unauthenticated" });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ state, signIn, signUp, signOut, refresh: hydrate }),
    [state, signIn, signUp, signOut, hydrate],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
