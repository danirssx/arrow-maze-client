import { useEffect } from "react";
import { ScrollView, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { EmptyState } from "@/presentation/components/EmptyState";
import { ErrorState } from "@/presentation/components/ErrorState";
import { Header } from "@/presentation/components/Header";
import { LoadingState } from "@/presentation/components/LoadingState";
import { ScreenContainer } from "@/presentation/components/ScreenContainer";
import { useViewModelState } from "@/presentation/hooks/useViewModelState";
import { AsyncStatus } from "@/presentation/state/AsyncUiState";
import type { LeaderboardViewModel } from "@/presentation/view-models/LeaderboardViewModel";

interface LeaderboardScreenProps {
  viewModel: LeaderboardViewModel | null;
  levelId: string | null;
  onBack: () => void;
}

function LeaderboardList({
  viewModel,
  levelId
}: {
  viewModel: LeaderboardViewModel;
  levelId: string;
}) {
  const { t } = useTranslation();
  const state = useViewModelState(viewModel);

  useEffect(() => {
    void viewModel.load(levelId);
  }, [viewModel, levelId]);

  if (state.status === AsyncStatus.Idle || state.status === AsyncStatus.Loading) {
    return <LoadingState />;
  }
  if (state.status === AsyncStatus.Error) {
    return <ErrorState onRetry={() => void viewModel.load(levelId)} />;
  }
  if (state.status === AsyncStatus.Empty || state.data === null) {
    return <EmptyState variant="leaderboard" />;
  }

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <View className="gap-2 pb-8">
        {state.data.entries.map((entry) => (
          <View
            key={entry.entryId}
            className="flex-row items-center gap-3 rounded-2xl bg-background-card border border-border-soft p-4"
          >
            <Text className="w-7 text-base font-black text-primary-700">{entry.rank}</Text>
            <Text className="flex-1 text-base font-semibold text-text-primary">
              {entry.usernameSnapshot}
            </Text>
            <Text className="text-base font-bold text-text-secondary">
              {t("leaderboard.score", { score: entry.score })}
            </Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

/**
 * MVVM view — leaderboard.
 *
 * Reads top scores from the `LeaderboardViewModel` and renders loading, empty,
 * error, or list states. When no session-scoped ViewModel is provided it shows
 * the empty state. It never calls HTTP or repositories directly.
 */
export function LeaderboardScreen({ viewModel, levelId, onBack }: LeaderboardScreenProps) {
  const { t } = useTranslation();

  return (
    <ScreenContainer testID="leaderboard-screen">
      <Header title={t("leaderboard.title")} onBack={onBack} />
      {viewModel !== null && levelId !== null ? (
        <LeaderboardList viewModel={viewModel} levelId={levelId} />
      ) : (
        <EmptyState variant="leaderboard" />
      )}
    </ScreenContainer>
  );
}
