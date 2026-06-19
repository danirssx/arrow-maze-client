import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { BoardView } from "@/presentation/components/BoardView";
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

/** Circular dark icon button used by the HUD top bar. */
function IconButton({
  glyph,
  onPress,
  label,
  disabled = false
}: {
  glyph: string;
  onPress: () => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      disabled={disabled}
      className={`h-11 w-11 items-center justify-center rounded-2xl bg-[#1B2042] border border-[#2C3360] active:opacity-70 ${
        disabled ? "opacity-30" : ""
      }`}
    >
      <Text className="text-lg font-black text-[#C7CEF7]">{glyph}</Text>
    </Pressable>
  );
}

/** Wide dark control button used by the HUD footer. */
function ControlButton({
  testID,
  label,
  glyph,
  onPress,
  disabled = false
}: {
  testID: string;
  label: string;
  glyph: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      className={`flex-1 flex-row items-center justify-center gap-2 rounded-2xl bg-[#1B2042] border border-[#2C3360] py-4 active:opacity-80 ${
        disabled ? "opacity-40" : ""
      }`}
    >
      <Text className="text-base text-[#C7CEF7]">{glyph}</Text>
      <Text className="text-base font-bold text-[#C7CEF7]">{label}</Text>
    </Pressable>
  );
}

/**
 * MVVM view — gameplay screen (arrow untangle), dark art-directed HUD.
 *
 * Binds to `GameViewModel` state and routes every arrow tap through
 * `GameUIController.handleArrowTap`. The HUD shows a top pill with arrows-remaining,
 * an attempts (hearts) row, and footer Undo/Restart controls; the board renders the
 * snake arrows. Victory/defeat overlays come from the ViewModel; no use case is
 * called directly.
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
    <SafeAreaView testID="game-screen" className="flex-1 bg-[#0B0E1F]">
      <View className="flex-1 px-4">
        <View className="flex-row items-center justify-between pt-1">
          <IconButton glyph="‹" label="Back" onPress={onExit} />

          <View className="items-center">
            <View className="flex-row items-center gap-2 rounded-full bg-[#232A52] border border-[#394070] px-6 py-2">
              <Text className="text-[13px] text-[#9AA3D8]">{t("game.arrows")}</Text>
              <Text testID="game-arrows" className="text-2xl font-black text-white">
                {state.arrowsRemaining}
              </Text>
            </View>
            <Text className="mt-1 text-[11px] font-semibold text-[#6F77A8]">
              {t("game.level", { order: levelOrder })}
            </Text>
          </View>

          <IconButton glyph="⟲" label={t("game.restart")} onPress={() => controller.handleRestart()} />
        </View>

        <View className="mt-2 flex-row items-center justify-center gap-1">
          <Text className="text-sm text-[#FF5D7A]">{"♥".repeat(Math.max(0, state.attemptsRemaining))}</Text>
          <Text testID="game-attempts" className="ml-1 text-xs font-bold text-[#9AA3D8]">
            {state.attemptsRemaining}
          </Text>
        </View>

        <View className="my-3 flex-1">
          <BoardView state={state} onArrowTap={(arrowId) => controller.handleArrowTap(arrowId)} />
        </View>

        <View className="flex-row gap-3 pb-2">
          <ControlButton
            testID="game-undo"
            glyph="↺"
            label={t("game.undo")}
            onPress={() => controller.handleUndo()}
            disabled={!state.canUndo}
          />
          <ControlButton
            testID="game-restart"
            glyph="⟳"
            label={t("game.restart")}
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
    </SafeAreaView>
  );
}
