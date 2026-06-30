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
import type { ProgressViewModel } from "@/presentation/view-models/ProgressViewModel";

interface ProgressScreenProps {
  viewModel: ProgressViewModel | null;
  userId: string | null;
  levelNameById?: Record<string, string>;
  onBack: () => void;
}

function ProgressContent({
  viewModel,
  userId,
  levelNameById
}: {
  viewModel: ProgressViewModel;
  userId: string;
  levelNameById: Record<string, string> | undefined;
}) {
  const { t } = useTranslation();
  const state = useViewModelState(viewModel);

  useEffect(() => {
    void viewModel.load(userId);
  }, [viewModel, userId]);

  if (state.status === AsyncStatus.Idle || state.status === AsyncStatus.Loading) {
    return <LoadingState />;
  }
  if (state.status === AsyncStatus.Error) {
    return <ErrorState onRetry={() => void viewModel.load(userId)} />;
  }
  if (state.status === AsyncStatus.Empty || state.data === null) {
    return <EmptyState variant="progress" />;
  }

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <View className="gap-3 pb-8">
        <View className="rounded-2xl bg-primary-100 p-4">
          <Text className="text-3xl font-black text-primary-900">
            {state.data.completedLevels.length}
          </Text>
          <Text className="text-sm text-text-secondary">{t("progress.completed")}</Text>
          {state.data.pendingSync ? (
            <Text className="mt-1 text-xs font-semibold text-reward-orange">
              {t("progress.pendingSync")}
            </Text>
          ) : null}
        </View>
        {state.data.completedLevels.map((level) => (
          <View
            key={level.levelId}
            className="flex-row items-center justify-between rounded-2xl bg-background-card border border-border-soft p-4"
          >
            <Text className="flex-1 text-base font-semibold text-text-primary">
              {levelNameById?.[level.levelId] ?? t("progress.unknownLevel")}
            </Text>
            <Text className="text-base font-bold text-text-secondary">
              {t("progress.bestScore", { score: level.score })}
            </Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

/**
 * MVVM view — player progress.
 *
 * Reads offline-first progress from the `ProgressViewModel`. With no
 * authenticated session it shows the empty state. It never calls storage or HTTP
 * directly.
 */
export function ProgressScreen({ viewModel, userId, levelNameById, onBack }: ProgressScreenProps) {
  const { t } = useTranslation();

  return (
    <ScreenContainer testID="progress-screen">
      <Header title={t("progress.title")} onBack={onBack} />
      {viewModel !== null && userId !== null ? (
        <ProgressContent
          viewModel={viewModel}
          userId={userId}
          levelNameById={levelNameById}
        />
      ) : (
        <EmptyState variant="progress" />
      )}
    </ScreenContainer>
  );
}
