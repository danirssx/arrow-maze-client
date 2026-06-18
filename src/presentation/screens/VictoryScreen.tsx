import { Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { PrimaryButton } from "@/presentation/components/PrimaryButton";

interface VictoryScreenProps {
  onPlayAgain: () => void;
  onHome: () => void;
  onNextLevel?: (() => void) | undefined;
  onViewLeaderboard?: (() => void) | undefined;
}

/**
 * MVVM view — victory result.
 *
 * Rendered by `GameScreen` when `GameUiState.overlay` is victory and also
 * reachable as a standalone route. Presentation only: it shows the win state and
 * routing actions.
 */
export function VictoryScreen({ onPlayAgain, onHome, onNextLevel, onViewLeaderboard }: VictoryScreenProps) {
  const { t } = useTranslation();

  return (
    <View testID="victory-screen" className="flex-1 items-center justify-center gap-6 bg-background px-8">
      <View className="h-20 w-20 items-center justify-center rounded-full bg-reward-green">
        <Text className="text-4xl">🏆</Text>
      </View>
      <View className="items-center gap-1">
        <Text className="text-3xl font-black text-text-primary">{t("victory.title")}</Text>
        <Text className="text-center text-base text-text-secondary">{t("victory.subtitle")}</Text>
      </View>

      <View className="w-full gap-3">
        {onNextLevel !== undefined ? (
          <PrimaryButton testID="victory-next" label={t("victory.next")} onPress={onNextLevel} />
        ) : null}
        <PrimaryButton
          testID="victory-play-again"
          label={t("victory.playAgain")}
          variant="secondary"
          onPress={onPlayAgain}
        />
        {onViewLeaderboard !== undefined ? (
          <PrimaryButton
            testID="victory-leaderboard"
            label={t("victory.leaderboard")}
            variant="secondary"
            onPress={onViewLeaderboard}
          />
        ) : null}
        <PrimaryButton testID="victory-home" label={t("victory.home")} variant="secondary" onPress={onHome} />
      </View>
    </View>
  );
}
