import { useEffect, useMemo, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";

import { createLevelSelectViewModel } from "@/framework/config/levelCatalog";
import { createLeaderboardViewModel } from "@/framework/config/leaderboard";
import { LeaderboardScreen } from "@/presentation/screens/LeaderboardScreen";

export default function LeaderboardRoute() {
  const router = useRouter();
  const params = useLocalSearchParams<{ levelId?: string }>();
  const catalog = useMemo(() => createLevelSelectViewModel(), []);
  const [defaultLevelId, setDefaultLevelId] = useState<string | null>(null);

  const viewModel = useMemo(() => createLeaderboardViewModel(), []);
  const levelId =
    typeof params.levelId === "string" && params.levelId.length > 0 ? params.levelId : defaultLevelId;

  useEffect(() => {
    let active = true;
    void catalog.loadLevels()
      .then((levels) => {
        if (active) setDefaultLevelId(levels[0]?.id ?? null);
      })
      .catch(() => undefined);

    return () => {
      active = false;
    };
  }, [catalog]);

  return <LeaderboardScreen viewModel={viewModel} levelId={levelId} onBack={() => router.back()} />;
}
