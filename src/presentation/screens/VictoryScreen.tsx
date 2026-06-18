import { Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { PrimaryButton } from "@/presentation/components/PrimaryButton";

interface VictoryScreenProps {
  moves: number;
  optimalMoves: number;
  onPlayAgain: () => void;
  onHome: () => void;
  onNextLevel?: (() => void) | undefined;
}

/**
 * MVVM view — victory result.
 *
 * Rendered by `GameScreen` when `GameUiState.overlay` is victory and also
 * reachable as a standalone route. Presentation only: it shows the run summary
 * and routing actions.
 */
export function VictoryScreen({
  moves,
  optimalMoves,
  onPlayAgain,
  onHome,
  onNextLevel
}: VictoryScreenProps) {
  const { t } = useTranslation();
  const isOptimal = optimalMoves > 0 && moves <= optimalMoves;

  return (
    <View testID="victory-screen" className="flex-1 items-center justify-center gap-6 bg-background px-8">
      <View className="h-20 w-20 items-center justify-center rounded-full bg-reward-green">
        <Text className="text-4xl">🏆</Text>
      </View>
      <View className="items-center gap-1">
        <Text className="text-3xl font-black text-text-primary">{t("victory.title")}</Text>
        <Text className="text-center text-base text-text-secondary">{t("victory.subtitle")}</Text>
      </View>

      <View className="w-full flex-row justify-center gap-3">
        <View className="items-center rounded-2xl bg-background-card border border-border-soft px-6 py-4">
          <Text className="text-2xl font-black text-primary-700">{moves}</Text>
          <Text className="text-xs text-text-secondary">{t("victory.moves")}</Text>
        </View>
        <View className="items-center rounded-2xl bg-background-card border border-border-soft px-6 py-4">
          <Text className="text-2xl font-black text-primary-700">{optimalMoves}</Text>
          <Text className="text-xs text-text-secondary">{t("victory.optimal")}</Text>
        </View>
      </View>

      {isOptimal ? (
        <Text className="text-sm font-bold text-reward-orange">{t("victory.perfect")}</Text>
      ) : null}

      <View className="w-full gap-3">
        {onNextLevel !== undefined ? (
          <PrimaryButton testID="victory-next" label={t("victory.next")} onPress={onNextLevel} />
        ) : null}
        <PrimaryButton testID="victory-play-again" label={t("victory.playAgain")} variant="secondary" onPress={onPlayAgain} />
        <PrimaryButton testID="victory-home" label={t("victory.home")} variant="secondary" onPress={onHome} />
      </View>
    </View>
  );
}
