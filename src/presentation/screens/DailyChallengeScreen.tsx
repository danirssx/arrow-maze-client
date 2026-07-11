import { useEffect } from "react";
import { Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { ErrorState } from "@/presentation/components/ErrorState";
import { Header } from "@/presentation/components/Header";
import { LoadingState } from "@/presentation/components/LoadingState";
import { PrimaryButton } from "@/presentation/components/PrimaryButton";
import { ScreenContainer } from "@/presentation/components/ScreenContainer";
import { useViewModelState } from "@/presentation/hooks/useViewModelState";
import { AsyncStatus } from "@/presentation/state/AsyncUiState";
import type { DailyChallenge } from "@/application/ports/IDailyChallengeRepository";
import type { DailyChallengeViewModel } from "@/presentation/view-models/DailyChallengeViewModel";

interface DailyChallengeScreenProps {
  viewModel: DailyChallengeViewModel;
  onBack: () => void;
  onPlay: (challenge: DailyChallenge) => void;
}

/**
 * MVVM view — daily challenge entrypoint.
 *
 * Loads today's puzzle through the injected `DailyChallengeViewModel` and renders
 * loading, recoverable-error, or a ready-to-play card. Starting the challenge is
 * an injected `onPlay` intent carrying the loaded challenge; the View holds no
 * game rules and never calls HTTP or repositories.
 */
export function DailyChallengeScreen({ viewModel, onBack, onPlay }: DailyChallengeScreenProps) {
  const { t } = useTranslation();
  const state = useViewModelState(viewModel);

  useEffect(() => {
    void viewModel.load();
  }, [viewModel]);

  const content = (() => {
    if (state.status === AsyncStatus.Idle || state.status === AsyncStatus.Loading) {
      return <LoadingState />;
    }
    if (state.status === AsyncStatus.Error || state.data === null) {
      return <ErrorState onRetry={() => void viewModel.load()} />;
    }

    const challenge = state.data;
    return (
      <View testID="daily-ready" className="flex-1 gap-6 px-1 pt-4">
        <View
          testID="daily-meta"
          className="gap-2 rounded-2xl border border-border-soft bg-background-card p-5"
        >
          <Text className="text-xs font-semibold uppercase tracking-[3px] text-text-secondary">
            {t("dailyChallenge.subtitle")}
          </Text>
          <Text testID="daily-date" className="text-lg font-black text-text-primary">
            {t("dailyChallenge.date", { date: challenge.meta.date })}
          </Text>
          <Text testID="daily-difficulty" className="text-sm font-semibold text-primary-700">
            {t("dailyChallenge.difficulty", {
              difficulty: t(`difficulty.${challenge.meta.difficulty}`),
            })}
          </Text>
          {challenge.meta.fallbackUsed ? (
            <Text testID="daily-fallback-note" className="text-xs text-text-secondary">
              {t("dailyChallenge.fallbackNote")}
            </Text>
          ) : null}
        </View>
        <PrimaryButton
          testID="daily-play"
          label={t("dailyChallenge.play")}
          onPress={() => onPlay(challenge)}
        />
      </View>
    );
  })();

  return (
    <ScreenContainer testID="daily-challenge-screen">
      <Header title={t("dailyChallenge.title")} onBack={onBack} />
      {content}
    </ScreenContainer>
  );
}
