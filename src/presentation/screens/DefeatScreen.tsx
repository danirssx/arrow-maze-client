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
    <View testID="defeat-screen" className="flex-1 items-center justify-center gap-6 bg-[#0B0E1F] px-8">
      <View className="h-20 w-20 items-center justify-center rounded-full bg-[#2A1730]">
        <Text className="text-4xl">❌</Text>
      </View>
      <View className="items-center gap-1">
        <Text className="text-3xl font-black text-white">{t("defeat.title")}</Text>
        <Text className="text-center text-base text-[#9AA3D8]">{t("defeat.subtitle")}</Text>
      </View>

      <View className="w-full gap-3">
        <PrimaryButton testID="defeat-retry" label={t("defeat.retry")} onPress={onRetry} />
        <PrimaryButton testID="defeat-home" label={t("defeat.home")} variant="secondary" onPress={onHome} />
      </View>
    </View>
  );
}
