import { useMemo } from "react";
import { useRouter } from "expo-router";

import { useAuthSession } from "@/framework/auth/AuthGate";
import { createProgressViewModel } from "@/framework/config/progress";
import { createLevelSelectViewModel } from "@/framework/config/levelCatalog";
import { LoadingState } from "@/presentation/components/LoadingState";
import { ScreenContainer } from "@/presentation/components/ScreenContainer";
import { ProgressScreen } from "@/presentation/screens/ProgressScreen";

export default function ProgressRoute() {
  const router = useRouter();
  const viewModel = useMemo(() => createProgressViewModel(), []);
  const levelNameById = useMemo(() => {
    const map: Record<string, string> = {};
    for (const level of createLevelSelectViewModel().getLevels()) {
      map[level.id] = level.name;
    }
    return map;
  }, []);
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
      userId={session.userId}
      accessToken={session.accessToken}
      levelNameById={levelNameById}
      onBack={() => router.back()}
    />
  );
}
