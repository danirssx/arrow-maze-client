import { Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { BoardView } from "@/presentation/components/BoardView";
import { Header } from "@/presentation/components/Header";
import { PrimaryButton } from "@/presentation/components/PrimaryButton";
import { ScreenContainer } from "@/presentation/components/ScreenContainer";
import { useViewModelState } from "@/presentation/hooks/useViewModelState";
import { GameOverlay } from "@/presentation/state/GameUiState";
import type { GameUIController } from "@/presentation/controllers/GameUIController";
import type { GameViewModel } from "@/presentation/view-models/GameViewModel";
import { DefeatScreen } from "./DefeatScreen";
import { VictoryScreen } from "./VictoryScreen";

interface GameScreenProps {
  viewModel: GameViewModel;
  controller: GameUIController;
  levelOrder: number;
  onExit: () => void;
  onHome: () => void;
  onNextLevel?: (() => void) | undefined;
  onViewLeaderboard?: (() => void) | undefined;
}

/**
 * MVVM view — gameplay screen (arrow untangle).
 *
 * Binds to `GameViewModel` state and routes every arrow tap through
 * `GameUIController.handleArrowTap`, which calls `GameViewModel.tapArrow` only.
 * The HUD shows arrows-remaining and attempts-remaining; the screen renders the
 * victory/defeat overlay from the ViewModel and calls no use cases directly.
 */
export function GameScreen({
  viewModel,
  controller,
  levelOrder,
  onExit,
  onHome,
  onNextLevel,
  onViewLeaderboard
}: GameScreenProps) {
  const { t } = useTranslation();
  const state = useViewModelState(viewModel);

  return (
    <ScreenContainer testID="game-screen">
      <Header title={t("game.level", { order: levelOrder })} onBack={onExit} />

      <View className="mt-2 flex-row justify-around rounded-2xl bg-background-card border border-border-soft p-4">
        <View className="items-center">
          <Text testID="game-arrows" className="text-xl font-black text-text-primary">
            {state.arrowsRemaining}
          </Text>
          <Text className="text-xs text-text-secondary">{t("game.arrows")}</Text>
        </View>
        <View className="items-center">
          <Text testID="game-attempts" className="text-xl font-black text-primary-700">
            {state.attemptsRemaining}
          </Text>
          <Text className="text-xs text-text-secondary">{t("game.attempts")}</Text>
        </View>
      </View>

      <View className="my-3 flex-1">
        <BoardView state={state} onArrowTap={(arrowId) => controller.handleArrowTap(arrowId)} />
      </View>

      <View className="flex-row gap-3 pb-2">
        <View className="flex-1">
          <PrimaryButton
            testID="game-undo"
            label={t("game.undo")}
            variant="secondary"
            onPress={() => controller.handleUndo()}
            disabled={!state.canUndo}
          />
        </View>
        <View className="flex-1">
          <PrimaryButton
            testID="game-restart"
            label={t("game.restart")}
            variant="secondary"
            onPress={() => controller.handleRestart()}
          />
        </View>
      </View>

      {state.overlay === GameOverlay.Victory ? (
        <View className="absolute inset-0">
          <VictoryScreen
            onPlayAgain={() => controller.handleRestart()}
            onHome={onHome}
            onNextLevel={onNextLevel}
            onViewLeaderboard={onViewLeaderboard}
          />
        </View>
      ) : null}

      {state.overlay === GameOverlay.Defeat ? (
        <View className="absolute inset-0">
          <DefeatScreen onRetry={() => controller.handleRestart()} onHome={onHome} />
        </View>
      ) : null}
    </ScreenContainer>
  );
}
