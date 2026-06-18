import { useMemo } from "react";
import { useRouter } from "expo-router";

import { LevelSelectScreen } from "@/presentation/screens/LevelSelectScreen";
import { LevelSelectViewModel } from "@/presentation/view-models/LevelSelectViewModel";

export default function LevelsRoute() {
  const router = useRouter();
  const viewModel = useMemo(() => new LevelSelectViewModel(), []);

  return (
    <LevelSelectScreen
      levels={viewModel.getLevels()}
      onSelect={(levelId) => router.push({ pathname: "/game", params: { levelId } })}
      onBack={() => router.back()}
    />
  );
}
