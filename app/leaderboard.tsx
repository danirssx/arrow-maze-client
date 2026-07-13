import { useEffect, useMemo, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";

import { createLevelSelectViewModel } from "@/framework/config/levelCatalog";
import { createLeaderboardViewModel } from "@/framework/config/leaderboard";
import { safeBack } from "@/framework/navigation/safeBack";
import { LeaderboardScreen } from "@/presentation/screens/LeaderboardScreen";
import type { LeaderboardTarget } from "@/presentation/screens/LeaderboardScreen";

export default function LeaderboardRoute() {
  const router = useRouter();
  const params = useLocalSearchParams<{ levelId?: string }>();
  const explicitLevelId =
    typeof params.levelId === "string" && params.levelId.length > 0 ? params.levelId : null;

  const catalog = useMemo(() => createLevelSelectViewModel(), []);
  const viewModel = useMemo(() => createLeaderboardViewModel(), []);
  const [levelIds, setLevelIds] = useState<string[] | null>(null);

  useEffect(() => {
    // Per-level mode (opened from a specific level) doesn't need the catalog.
    if (explicitLevelId !== null) return;

    let active = true;
    void catalog.loadLevels()
      .then((levels) => {
        if (active) setLevelIds(levels.map((level) => level.id));
      })
      .catch(() => {
        if (active) setLevelIds([]);
      });

    return () => {
      active = false;
    };
  }, [catalog, explicitLevelId]);

  const target = useMemo<LeaderboardTarget | null>(() => {
    if (explicitLevelId !== null) return { kind: "level", levelId: explicitLevelId };
    if (levelIds !== null) return { kind: "global", levelIds };
    return null; // still loading the catalog for the global board
  }, [explicitLevelId, levelIds]);

  return <LeaderboardScreen viewModel={viewModel} target={target} onBack={() => safeBack(router, "/")} />;
}
