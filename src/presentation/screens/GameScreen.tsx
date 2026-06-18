import { Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { BoardView } from "@/presentation/components/BoardView";
import { CoinBadge } from "@/presentation/components/CoinBadge";
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
}

/**
 * MVVM view — gameplay screen.
 *
 * Binds to `GameViewModel` state and routes every cell tap through
 * `GameUIController.handleCellTap`, which calls `GameViewModel.playTurn` only.
 * When the ViewModel flips the overlay (from a domain level-finished event), it
 * renders the victory or defeat result. The screen calls no use cases directly.
 */
export function GameScreen({
  viewModel,
  controller,
  levelOrder,
  onExit,
  onHome,
  onNextLevel
}: GameScreenProps) {
  const { t } = useTranslation();
  const state = useViewModelState(viewModel);

  return (
    <ScreenContainer testID="game-screen">
      <Header
        title={t("game.level", { order: levelOrder })}
        onBack={onExit}
        right={<CoinBadge amount={0} />}
      />

      <View className="mt-2 flex-row justify-between rounded-2xl bg-background-card border border-border-soft p-4">
        <View className="items-center">
          <Text testID="game-moves" className="text-xl font-black text-text-primary">
            {state.moves}
          </Text>
          <Text className="text-xs text-text-secondary">{t("game.moves")}</Text>
        </View>
        <View className="items-center">
          <Text className="text-xl font-black text-primary-700">{state.optimalMoves}</Text>
          <Text className="text-xs text-text-secondary">{t("game.optimal")}</Text>
        </View>
        <View className="items-center">
          <Text className="text-xl">🏁</Text>
          <Text className="text-xs text-text-secondary">{t("game.objective")}</Text>
        </View>
      </View>

      <View className="flex-1 items-center justify-center">
        <BoardView state={state} onCellTap={(position) => controller.handleCellTap(position)} />
        {state.invalidMoveAt !== null ? (
          <Text testID="invalid-move" className="mt-4 text-sm text-text-muted">
            {t("game.invalidMove")}
          </Text>
        ) : null}
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
            moves={state.moves}
            optimalMoves={state.optimalMoves}
            onPlayAgain={() => controller.handleRestart()}
            onHome={onHome}
            onNextLevel={onNextLevel}
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
