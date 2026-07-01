import { useCallback, useEffect, useMemo, useState } from "react";
import { type Href, useRouter } from "expo-router";

import { createLevelSelectViewModel } from "@/framework/config/levelCatalog";
import { createProgressFacade } from "@/framework/config/progress";
import { useAuthSession } from "@/framework/auth/AuthGate";
import { LevelSelectScreen } from "@/presentation/screens/LevelSelectScreen";
import type { LevelListItem } from "@/presentation/view-models/LevelSelectViewModel";

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
  const [levels, setLevels] = useState<readonly LevelListItem[]>(viewModel.getLevels());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadLevels = useCallback(() => {
    setLoading(true);
    setError(false);
    // Sequential progression (MAZ-191): the completed level ids gate which cards
    // are unlocked. Progress is read offline-first, so unlocking works offline too.
    const completedIds: Promise<readonly string[]> = userId
      ? progressFacade
          .load(userId)
          .then((progress) => progress.completedLevels.map((completion) => completion.levelId))
          .catch(() => [])
      : Promise.resolve([]);
    void completedIds.then((ids) =>
      viewModel
        .loadLevels(ids)
        .then((remoteLevels) => {
          setLevels(remoteLevels);
          setLoading(false);
        })
        .catch(() => {
          setLevels(viewModel.getLevels(ids));
          setError(true);
          setLoading(false);
        }),
    );
  }, [viewModel, progressFacade, userId]);

  useEffect(() => {
    loadLevels();
  }, [loadLevels]);

  return (
    <LevelSelectScreen
      levels={levels}
      onSelect={(levelId) => router.push(getGameRoute(levelId))}
      onBack={() => router.back()}
      loading={loading}
      error={error}
      onRetry={loadLevels}
    />
  );
}
