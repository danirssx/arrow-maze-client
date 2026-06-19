import { useCallback, useEffect, useMemo, useState } from "react";
import { type Href, useRouter } from "expo-router";

import { createLevelSelectViewModel } from "@/framework/config/levelCatalog";
import { LevelSelectScreen } from "@/presentation/screens/LevelSelectScreen";
import type { LevelListItem } from "@/presentation/view-models/LevelSelectViewModel";

const getGameRoute = (levelId: string): Href => ({
  pathname: "/game",
  params: { levelId },
} as unknown as Href);

export default function LevelsRoute() {
  const router = useRouter();
  const viewModel = useMemo(() => createLevelSelectViewModel(), []);
  const [levels, setLevels] = useState<readonly LevelListItem[]>(viewModel.getLevels());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadLevels = useCallback(() => {
    setLoading(true);
    setError(false);
    void viewModel.loadLevels()
      .then((remoteLevels) => {
        setLevels(remoteLevels);
        setLoading(false);
      })
      .catch(() => {
        setLevels(viewModel.getLevels());
        setError(true);
        setLoading(false);
      });
  }, [viewModel]);

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
