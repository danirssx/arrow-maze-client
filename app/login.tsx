import { useEffect, useMemo } from "react";
import { useRouter } from "expo-router";

import { createAuthViewModel } from "@/framework/config/auth";
import { AuthScreen } from "@/presentation/screens/AuthScreen";

export default function LoginRoute() {
  const router = useRouter();
  const viewModel = useMemo(() => createAuthViewModel(), []);

  useEffect(() => {
    void viewModel.loadSession();
  }, [viewModel]);

  return <AuthScreen viewModel={viewModel} onBack={() => router.back()} onAuthenticated={() => router.back()} />;
}
