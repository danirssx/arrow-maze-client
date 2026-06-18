import { useMemo } from "react";
import { type Href, useLocalSearchParams, useRouter } from "expo-router";

import { GameScreen } from "@/presentation/screens/GameScreen";
import { useGameSession } from "@/presentation/hooks/useGameSession";
import { LevelSelectViewModel } from "@/presentation/view-models/LevelSelectViewModel";

const getGameRoute = (levelId: string): Href => ({
  pathname: "/game",
  params: { levelId },
} as unknown as Href);

export default function GameRoute() {
  const router = useRouter();
  const params = useLocalSearchParams<{ levelId?: string }>();
  const levelId = typeof params.levelId === "string" ? params.levelId : "";

  const catalog = useMemo(() => new LevelSelectViewModel(), []);
  const definition = useMemo(() => catalog.getDefinition(levelId), [catalog, levelId]);
  const levels = catalog.getLevels();
  const order = levels.find((level) => level.id === levelId)?.order ?? 0;
  const nextLevel = levels.find((level) => level.order === order + 1);

  const { viewModel, controller } = useGameSession(levelId, definition);

  return (
    <GameScreen
      viewModel={viewModel}
      controller={controller}
      levelOrder={order}
      onExit={() => router.back()}
      onHome={() => router.dismissAll()}
      onNextLevel={
        nextLevel !== undefined
          ? () => router.replace(getGameRoute(nextLevel.id))
          : undefined
      }
    />
  );
}
