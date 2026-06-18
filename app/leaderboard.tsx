import { useMemo } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";

import { manualLevels } from "@/application/level-build/fixtures";
import { createLeaderboardViewModel } from "@/framework/config/leaderboard";
import { LeaderboardScreen } from "@/presentation/screens/LeaderboardScreen";

// Temporary default when no levelId is passed (e.g. opening the tab directly):
// fall back to the first manual level so the screen always has a real board.
const DEFAULT_LEVEL_ID = manualLevels[0]?.id ?? null;

export default function LeaderboardRoute() {
  const router = useRouter();
  const params = useLocalSearchParams<{ levelId?: string }>();
  const levelId =
    typeof params.levelId === "string" && params.levelId.length > 0 ? params.levelId : DEFAULT_LEVEL_ID;

  // Composition root (framework) wires Axios → repository → facade → ViewModel,
  // pointed at EXPO_PUBLIC_API_BASE_URL.
  const viewModel = useMemo(() => createLeaderboardViewModel(), []);

  return <LeaderboardScreen viewModel={viewModel} levelId={levelId} onBack={() => router.back()} />;
}
