import { useEffect, useMemo, useRef, useState } from "react";
import { type Href, useLocalSearchParams, useRouter } from "expo-router";

import { ScoreContext } from "@/domain/scoring/ScoreContext";
import { TimeScoringStrategy } from "@/domain/scoring/TimeScoringStrategy";
import { LevelResult } from "@/domain/level/LevelResult";
import { createLeaderboardFacade } from "@/framework/config/leaderboard";
import { createLevelSelectViewModel } from "@/framework/config/levelCatalog";
import { createProgressFacade } from "@/framework/config/progress";
import { useCurrentSession } from "@/framework/hooks/useCurrentSession";
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
  const { session } = useCurrentSession();
  const [definition, setDefinition] = useState<LevelDefinition | undefined>(() => catalog.getDefinition(levelId));
  const [levels, setLevels] = useState(() => catalog.getLevels());
  const [loadingLevel, setLoadingLevel] = useState(true);
  const [levelError, setLevelError] = useState(false);
  const order = levels.find((level) => level.id === levelId)?.order ?? 0;
  const nextLevel = levels.find((level) => level.order === order + 1);

  const { viewModel, controller } = useGameSession(levelId, definition);
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
    if (gameState.overlay !== GameOverlay.Victory || session === null || levelId.length === 0) return;

    const victoryKey = `${session.userId}:${levelId}:${gameState.extractedArrowIds.length}`;
    if (submittedVictoryKey.current === victoryKey) return;
    submittedVictoryKey.current = victoryKey;

    const elapsedMs = viewModel.elapsedMs();
    const timeSeconds = Math.max(1, Math.floor(elapsedMs / 1000));
    const movesCount = Math.max(1, viewModel.movesCount());
    const score = new TimeScoringStrategy().score(
      ScoreContext.create({ result: LevelResult.won(), elapsedMs }),
    ).value;
    const completedAt = new Date().toISOString();

    void progressFacade.completeLevel(session.userId, session.accessToken, {
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
    }, session.accessToken).catch(() => undefined);
  }, [gameState.extractedArrowIds.length, gameState.overlay, leaderboardFacade, levelId, progressFacade, session, viewModel]);

  useEffect(() => {
    if (gameState.overlay === GameOverlay.None) {
      submittedVictoryKey.current = null;
    }
  }, [gameState.overlay]);

  if (loadingLevel) {
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
