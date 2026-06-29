import { useEffect, useMemo, useRef, useState } from "react";
import { type Href, useLocalSearchParams, useRouter } from "expo-router";

import { createLeaderboardFacade } from "@/framework/config/leaderboard";
import { createLevelSelectViewModel } from "@/framework/config/levelCatalog";
import { createProgressFacade } from "@/framework/config/progress";
import { useAuthSession } from "@/framework/auth/AuthGate";
import { GameScreen } from "@/presentation/screens/GameScreen";
import { useGameSession } from "@/presentation/hooks/useGameSession";
import { useViewModelState } from "@/presentation/hooks/useViewModelState";
import { ErrorState } from "@/presentation/components/ErrorState";
import { LoadingState } from "@/presentation/components/LoadingState";
import { ScreenContainer } from "@/presentation/components/ScreenContainer";
import { GameOverlay } from "@/presentation/state/GameUiState";
import type { LevelDefinition } from "@/application/level-build/LevelDefinition";
import { createUuid } from "@/shared/createUuid";

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

  const catalog = useMemo(() => createLevelSelectViewModel(), []);
  const progressFacade = useMemo(() => createProgressFacade(), []);
  const leaderboardFacade = useMemo(() => createLeaderboardFacade(), []);
  const { loading: sessionLoading, session } = useAuthSession();
  const [definition, setDefinition] = useState<LevelDefinition | undefined>(() => catalog.getDefinition(levelId));
  const [levels, setLevels] = useState(() => catalog.getLevels());
  const [loadingLevel, setLoadingLevel] = useState(true);
  const [levelError, setLevelError] = useState(false);
  const order = levels.find((level) => level.id === levelId)?.order ?? 0;
  const nextLevel = levels.find((level) => level.order === order + 1);

  const { facade, viewModel, controller } = useGameSession(levelId, definition);
  const gameState = useViewModelState(viewModel);
  const submittedVictoryKey = useRef<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoadingLevel(true);
    setLevelError(false);

    void Promise.all([catalog.loadLevels(), catalog.loadDefinition(levelId)])
      .then(([remoteLevels, remoteDefinition]) => {
        if (!active) return;
        setLevels(remoteLevels);
        setDefinition(remoteDefinition);
        setLoadingLevel(false);
      })
      .catch(() => {
        if (!active) return;
        const fallbackDefinition = catalog.getDefinition(levelId);
        setLevels(catalog.getLevels());
        setDefinition(fallbackDefinition);
        setLevelError(fallbackDefinition === undefined);
        setLoadingLevel(false);
      });

    return () => {
      active = false;
    };
  }, [catalog, levelId]);

  useEffect(() => {
    if (gameState.overlay !== GameOverlay.Victory || levelId.length === 0) return;
    if (session === null) return;

    const victoryKey = `${session.userId}:${levelId}:${gameState.extractedArrowIds.length}`;
    if (submittedVictoryKey.current === victoryKey) return;
    submittedVictoryKey.current = victoryKey;

    // Result already calculated in the application layer (no scoring/clock here).
    const { score, timeSeconds, movesCount } = facade.getLevelOutcome();
    const completedAt = new Date().toISOString();

    void progressFacade.completeLevel(session.userId, {
      levelId,
      score,
      timeSeconds,
      movesCount,
      completedAt,
    }).catch(() => undefined);

    void leaderboardFacade.submitScore({
      leaderboardId: createUuid(),
      entryId: createUuid(),
      levelId,
      usernameSnapshot: session.username,
      score,
      timeSeconds,
      movesCount,
    }).catch(() => undefined);
  }, [facade, gameState.extractedArrowIds.length, gameState.overlay, leaderboardFacade, levelId, progressFacade, session]);

  useEffect(() => {
    if (gameState.overlay === GameOverlay.None) {
      submittedVictoryKey.current = null;
    }
  }, [gameState.overlay]);

  if (sessionLoading || session === null || loadingLevel) {
    return (
      <ScreenContainer>
        <LoadingState />
      </ScreenContainer>
    );
  }

  if (levelError || definition === undefined) {
    return (
      <ScreenContainer>
        <ErrorState onRetry={() => router.replace(getGameRoute(levelId))} />
      </ScreenContainer>
    );
  }

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
