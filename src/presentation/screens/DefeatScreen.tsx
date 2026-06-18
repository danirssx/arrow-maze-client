import { Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { PrimaryButton } from "@/presentation/components/PrimaryButton";

interface DefeatScreenProps {
  onRetry: () => void;
  onHome: () => void;
}

/**
 * MVVM view — defeat result (out of attempts).
 *
 * Rendered by `GameScreen` when `GameUiState.overlay` is defeat and also
 * reachable as a standalone route. Presentation only.
 */
export function DefeatScreen({ onRetry, onHome }: DefeatScreenProps) {
  const { t } = useTranslation();

  return (
    <View testID="defeat-screen" className="flex-1 items-center justify-center gap-6 bg-background px-8">
      <View className="h-20 w-20 items-center justify-center rounded-full bg-primary-100">
        <Text className="text-4xl">❌</Text>
      </View>
      <View className="items-center gap-1">
        <Text className="text-3xl font-black text-text-primary">{t("defeat.title")}</Text>
        <Text className="text-center text-base text-text-secondary">{t("defeat.subtitle")}</Text>
      </View>

      <View className="w-full gap-3">
        <PrimaryButton testID="defeat-retry" label={t("defeat.retry")} onPress={onRetry} />
        <PrimaryButton testID="defeat-home" label={t("defeat.home")} variant="secondary" onPress={onHome} />
      </View>
    </View>
  );
}
