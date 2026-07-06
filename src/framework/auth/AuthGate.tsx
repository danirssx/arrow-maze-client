import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { useRouter, useSegments } from "expo-router";

import type { AuthSession } from "@/application/auth/AuthSession";
import { LoadingState } from "@/presentation/components/LoadingState";
import { ScreenContainer } from "@/presentation/components/ScreenContainer";
import { clearCurrentSession, getCurrentSession } from "@/framework/config/session";
import { onSessionInvalidated } from "@/framework/auth/sessionInvalidation";

type AuthGateState = {
  readonly loading: boolean;
  readonly session: AuthSession | null;
  readonly refreshSession: () => Promise<AuthSession | null>;
  readonly clearSession: () => Promise<void>;
};

const AuthSessionContext = createContext<AuthGateState | null>(null);

export function useAuthSession(): AuthGateState {
  const value = useContext(AuthSessionContext);
  if (value === null) {
    throw new Error("useAuthSession must be used inside AuthGate");
  }
  return value;
}

function isLoginRoute(segments: string[]): boolean {
  return segments[0] === "login";
}

interface AuthGateProps {
  children: ReactNode;
}

export function AuthGate({ children }: AuthGateProps) {
  const router = useRouter();
  const segments = useSegments();
  const loginRoute = isLoginRoute([...segments]);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<AuthSession | null>(null);

  const refreshSession = useCallback(async (): Promise<AuthSession | null> => {
    setLoading(true);
    try {
      const current = await getCurrentSession();
      setSession(current);
      return current;
    } catch {
      setSession(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearSession = useCallback(async (): Promise<void> => {
    await clearCurrentSession();
    setSession(null);
    setLoading(false);
  }, []);

  // A 401 on an authed request invalidates the session: clear it and let the
  // redirect below send the user to login.
  useEffect(() => onSessionInvalidated(() => void clearSession()), [clearSession]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    void getCurrentSession()
      .then((current) => {
        if (!active) return;
        setSession(current);
        setLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setSession(null);
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (loading) return;

    if (session === null && !loginRoute) {
      router.replace("/login");
      return;
    }

    if (session !== null && loginRoute) {
      router.replace("/");
    }
  }, [loading, loginRoute, router, session]);

  const value = useMemo<AuthGateState>(
    () => ({ loading, session, refreshSession, clearSession }),
    [clearSession, loading, refreshSession, session],
  );

  return (
    <AuthSessionContext.Provider value={value}>
      {children}
      {loading ? (
        <View pointerEvents="auto" style={StyleSheet.absoluteFill}>
          <ScreenContainer>
            <LoadingState />
          </ScreenContainer>
        </View>
      ) : null}
    </AuthSessionContext.Provider>
  );
}
