import { useMemo } from "react";
import { type Href, useRouter } from "expo-router";

import { LevelSelectScreen } from "@/presentation/screens/LevelSelectScreen";
import { LevelSelectViewModel } from "@/presentation/view-models/LevelSelectViewModel";

const getGameRoute = (levelId: string): Href => ({
  pathname: "/game",
  params: { levelId },
} as unknown as Href);

export default function LevelsRoute() {
  const router = useRouter();
  const viewModel = useMemo(() => new LevelSelectViewModel(), []);

  return (
    <LevelSelectScreen
      levels={viewModel.getLevels()}
      onSelect={(levelId) => router.push(getGameRoute(levelId))}
      onBack={() => router.back()}
    />
  );
}
