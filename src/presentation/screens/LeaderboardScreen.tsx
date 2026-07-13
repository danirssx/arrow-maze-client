import { useCallback, useEffect } from "react";
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

/**
 * What the leaderboard should show: a single level's board, or the cross-level
 * aggregate (Home). The route decides which based on whether a levelId is in scope.
 */
export type LeaderboardTarget =
  | { readonly kind: "level"; readonly levelId: string }
  | { readonly kind: "global"; readonly levelIds: readonly string[] };

interface LeaderboardScreenProps {
  viewModel: LeaderboardViewModel | null;
  target: LeaderboardTarget | null;
  onBack: () => void;
}

function LeaderboardList({
  viewModel,
  target
}: {
  viewModel: LeaderboardViewModel;
  target: LeaderboardTarget;
}) {
  const { t } = useTranslation();
  const state = useViewModelState(viewModel);

  const reload = useCallback(() => {
    if (target.kind === "global") {
      void viewModel.loadGlobal(target.levelIds);
    } else {
      void viewModel.load(target.levelId);
    }
  }, [viewModel, target]);

  useEffect(() => {
    reload();
  }, [reload]);

  if (state.status === AsyncStatus.Idle || state.status === AsyncStatus.Loading) {
    return <LoadingState />;
  }
  if (state.status === AsyncStatus.Error) {
    return <ErrorState onRetry={reload} />;
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
export function LeaderboardScreen({ viewModel, target, onBack }: LeaderboardScreenProps) {
  const { t } = useTranslation();

  return (
    <ScreenContainer testID="leaderboard-screen">
      <Header title={t("leaderboard.title")} onBack={onBack} />
      {viewModel !== null && target !== null ? (
        <LeaderboardList viewModel={viewModel} target={target} />
      ) : (
        <EmptyState variant="leaderboard" />
      )}
    </ScreenContainer>
  );
}
