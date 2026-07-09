import { useCallback, useEffect, useMemo } from "react";
import { type Href, useRouter } from "expo-router";

import { createLevelSelectViewModel } from "@/framework/config/levelCatalog";
import { createProgressFacade } from "@/framework/config/progress";
import { useAuthSession } from "@/framework/auth/AuthGate";
import { LevelSelectScreen } from "@/presentation/screens/LevelSelectScreen";
import { useViewModelState } from "@/presentation/hooks/useViewModelState";
import { AsyncStatus } from "@/presentation/state/AsyncUiState";
import type { LevelAccessContext } from "@/presentation/view-models/LevelSelectViewModel";

const getGameRoute = (levelId: string): Href => ({
  pathname: "/game",
  params: { levelId },
} as unknown as Href);

export default function LevelsRoute() {
  const router = useRouter();
  const viewModel = useMemo(() => createLevelSelectViewModel(), []);
  const progressFacade = useMemo(() => createProgressFacade(), []);
  const { session } = useAuthSession();
  const userId = session?.userId ?? null;
  const access = useMemo<LevelAccessContext>(
    () => (session === null ? {} : { role: session.role }),
    [session],
  );

  const vmState = useViewModelState(viewModel);

  const loadLevels = useCallback(() => {
    const completedIds: Promise<readonly string[]> = userId
      ? progressFacade
          .load(userId)
          .then((progress) => progress.completedLevels.map((completion) => completion.levelId))
          .catch(() => [])
      : Promise.resolve([]);
    void completedIds.then((ids) => viewModel.load(ids, access));
  }, [viewModel, progressFacade, userId, access]);

  useEffect(() => {
    loadLevels();
  }, [loadLevels]);

  return (
    <LevelSelectScreen
      levels={vmState.levels}
      onSelect={(levelId) => router.push(getGameRoute(levelId))}
      onBack={() => router.back()}
      loading={vmState.status === AsyncStatus.Loading}
      error={vmState.error}
      onRetry={loadLevels}
    />
  );
}
