import { useMemo } from "react";
import { useRouter } from "expo-router";

import { useAuthSession } from "@/framework/auth/AuthGate";
import { createProgressViewModel } from "@/framework/config/progress";
import { LoadingState } from "@/presentation/components/LoadingState";
import { ScreenContainer } from "@/presentation/components/ScreenContainer";
import { ProgressScreen } from "@/presentation/screens/ProgressScreen";

export default function ProgressRoute() {
  const router = useRouter();
  const viewModel = useMemo(() => createProgressViewModel(), []);
  const { loading, session } = useAuthSession();

  if (loading || session === null) {
    return (
      <ScreenContainer>
        <LoadingState />
      </ScreenContainer>
    );
  }

  return (
    <ProgressScreen
      viewModel={viewModel}
      userId={session?.userId ?? null}
      onBack={() => router.back()}
    />
  );
}
