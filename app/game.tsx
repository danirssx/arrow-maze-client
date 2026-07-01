import { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
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
import type { VictoryLeaderboardStatus } from "@/presentation/screens/VictoryScreen";
import type { LevelDefinition } from "@/application/level-build/LevelDefinition";
import { isLevelUnlocked } from "@/application/level-build/levelUnlock";
import { isUuid } from "@/shared/isUuid";

const getLevelsRoute = (): Href => ("/levels" as unknown as Href);

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
  const { t } = useTranslation();
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
  const [locked, setLocked] = useState(false);
  const order = levels.find((level) => level.id === levelId)?.order ?? 0;
  const nextLevel = levels.find((level) => level.order === order + 1);

  const { facade, viewModel, controller } = useGameSession(levelId, definition);
  const gameState = useViewModelState(viewModel);
  const submittedVictoryKey = useRef<string | null>(null);
  const [leaderboardSubmitStatus, setLeaderboardSubmitStatus] = useState<VictoryLeaderboardStatus>("idle");

  useEffect(() => {
    let active = true;
    setLoadingLevel(true);
    setLevelError(false);

    // Sequential progression guard (MAZ-191): block a deep link / manual navigation to
    // a level whose predecessor is not completed. Progress is read offline-first.
    const completedIds: Promise<readonly string[]> = session
      ? progressFacade
          .load(session.userId)
          .then((progress) => progress.completedLevels.map((completion) => completion.levelId))
          .catch(() => [])
      : Promise.resolve([]);

    void Promise.all([catalog.loadLevels(), catalog.loadDefinition(levelId), completedIds])
      .then(([remoteLevels, remoteDefinition, ids]) => {
        if (!active) return;
        setLevels(remoteLevels);
        setDefinition(remoteDefinition);
        setLocked(!isLevelUnlocked(remoteLevels, ids, levelId));
        setLoadingLevel(false);
      })
      .catch(() => {
        if (!active) return;
        const fallbackDefinition = catalog.getDefinition(levelId);
        setLevels(catalog.getLevels());
        setDefinition(fallbackDefinition);
        setLevelError(fallbackDefinition === undefined);
        setLocked(false);
        setLoadingLevel(false);
      });

    return () => {
      active = false;
    };
  }, [catalog, levelId, progressFacade, session]);

  useEffect(() => {
    if (gameState.overlay !== GameOverlay.Victory || levelId.length === 0) return;
    if (session === null) return;

    const victoryKey = `${session.userId}:${levelId}:${gameState.extractedArrowIds.length}`;
    if (submittedVictoryKey.current === victoryKey) return;
    submittedVictoryKey.current = victoryKey;
    setLeaderboardSubmitStatus("syncing");

    // Result already calculated in the application layer (no scoring/clock here).
    const { score, timeSeconds, movesCount } = facade.getLevelOutcome();
    const completedAt = new Date().toISOString();

    void progressFacade.completeLevel(session.userId, {
      levelId,
      score,
      timeSeconds,
      movesCount,
      completedAt,
    }).catch((error: unknown) => {
      console.warn("Failed to persist completed level", error);
    });

    if (!isUuid(levelId)) {
      setLeaderboardSubmitStatus("skipped");
      return;
    }

    void leaderboardFacade.submitScore({
      levelId,
      score,
      timeSeconds,
      movesCount,
    })
      .then(() => {
        setLeaderboardSubmitStatus("synced");
      })
      .catch((error: unknown) => {
        console.warn("Failed to submit leaderboard score", error);
        setLeaderboardSubmitStatus("failed");
      });
  }, [facade, gameState.extractedArrowIds.length, gameState.overlay, leaderboardFacade, levelId, progressFacade, session]);

  useEffect(() => {
    if (gameState.overlay === GameOverlay.None) {
      submittedVictoryKey.current = null;
      setLeaderboardSubmitStatus("idle");
    }
  }, [gameState.overlay]);

  if (sessionLoading || session === null || loadingLevel) {
    return (
      <ScreenContainer>
        <LoadingState />
      </ScreenContainer>
    );
  }

  if (locked) {
    return (
      <ScreenContainer>
        <View testID="level-locked" className="flex-1 items-center justify-center gap-4 px-6">
          <Text className="text-5xl">🔒</Text>
          <Text className="text-xl font-black text-text-primary">{t("levels.lockedTitle")}</Text>
          <Text className="text-center text-sm text-text-secondary">{t("levels.lockedMessage")}</Text>
          <Pressable
            testID="level-locked-back"
            accessibilityRole="button"
            onPress={() => router.replace(getLevelsRoute())}
            className="mt-2 rounded-2xl bg-primary-500 px-6 py-3 active:opacity-80"
          >
            <Text className="text-base font-bold text-white">{t("levels.backToLevels")}</Text>
          </Pressable>
        </View>
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
      leaderboardSubmitStatus={leaderboardSubmitStatus}
    />
  );
}
