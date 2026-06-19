import { useEffect, useMemo, useRef } from "react";
import { type Href, useLocalSearchParams, useRouter } from "expo-router";

import { createSubmitScoreUseCase } from "@/framework/config/submitScore";
import { GameScreen } from "@/presentation/screens/GameScreen";
import { useGameSession } from "@/presentation/hooks/useGameSession";
import { useViewModelState } from "@/presentation/hooks/useViewModelState";
import { GameOverlay } from "@/presentation/state/GameUiState";
import { LevelSelectViewModel } from "@/presentation/view-models/LevelSelectViewModel";

const getGameRoute = (levelId: string): Href => ({
  pathname: "/game",
  params: { levelId },
} as unknown as Href);

const getLeaderboardRoute = (levelId: string): Href => ({
  pathname: "/leaderboard",
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
  const state = useViewModelState(viewModel);
  const submitScore = useMemo(() => createSubmitScoreUseCase(), []);
  const submittedRef = useRef(false);

  // On victory, submit the run once (best-effort). The use case no-ops when the
  // player is not authenticated, so this is safe before auth login is wired.
  useEffect(() => {
    if (state.overlay !== GameOverlay.Victory) {
      submittedRef.current = false;
      return;
    }
    if (submittedRef.current || levelId.length === 0) {
      return;
    }
    submittedRef.current = true;
    void submitScore
      .execute({ levelId, elapsedMs: viewModel.elapsedMs(), arrowCount: state.arrows.length })
      .catch(() => undefined);
  }, [state.overlay, state.arrows.length, levelId, submitScore, viewModel]);

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
      onViewLeaderboard={
        levelId.length > 0 ? () => router.push(getLeaderboardRoute(levelId)) : undefined
      }
    />
  );
}
