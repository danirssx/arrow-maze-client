import { useEffect, useMemo } from "react";
import { useRouter } from "expo-router";

import { createAuthViewModel } from "@/framework/config/auth";
import { useAuthSession } from "@/framework/auth/AuthGate";
import { AuthScreen } from "@/presentation/screens/AuthScreen";

export default function LoginRoute() {
  const router = useRouter();
  const { refreshSession } = useAuthSession();
  const viewModel = useMemo(() => createAuthViewModel(), []);

  useEffect(() => {
    void viewModel.loadSession();
  }, [viewModel]);

  const handleAuthenticated = () => {
    void refreshSession();
  };

  return <AuthScreen viewModel={viewModel} onBack={() => router.back()} onAuthenticated={handleAuthenticated} />;
}
