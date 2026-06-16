import { Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { useHomeUiStore } from "@/presentation/state/useHomeUiStore";

export default function HomeScreen() {
  const { t } = useTranslation();
  const isArchitectureNoteVisible = useHomeUiStore(
    (state) => state.isArchitectureNoteVisible
  );
  const toggleArchitectureNote = useHomeUiStore(
    (state) => state.toggleArchitectureNote
  );

  return (
    <View className="flex-1 bg-maze-parchment px-6 py-12">
      <View className="flex-1 justify-center gap-8">
        <View className="gap-3">
          <Text className="text-sm font-semibold uppercase tracking-[4px] text-maze-moss">
            {t("app.kicker")}
          </Text>
          <Text className="text-5xl font-black leading-tight text-maze-ink">
            {t("app.title")}
          </Text>
          <Text className="max-w-sm text-lg leading-7 text-maze-slate">
            {t("app.setupStatus")}
          </Text>
        </View>

        <View className="rounded-[32px] border border-maze-ink/10 bg-white/70 p-5 shadow-sm">
          <View className="mb-4 h-44 overflow-hidden rounded-[24px] bg-maze-ink">
            <View className="absolute -left-10 -top-10 h-32 w-32 rounded-full bg-maze-ember/80" />
            <View className="absolute bottom-6 left-6 right-6 flex-row justify-between">
              <Text className="text-6xl text-maze-parchment">→</Text>
              <Text className="text-6xl text-maze-sand">↓</Text>
              <Text className="text-6xl text-maze-parchment">←</Text>
            </View>
          </View>

          {isArchitectureNoteVisible ? (
            <Text className="mb-4 text-base leading-6 text-maze-slate">
              {t("app.architectureNote")}
            </Text>
          ) : null}

          <Pressable
            accessibilityRole="button"
            className="self-start rounded-full bg-maze-ember px-5 py-3 active:opacity-80"
            onPress={toggleArchitectureNote}
          >
            <Text className="font-bold text-white">
              {isArchitectureNoteVisible
                ? t("app.hideDetails")
                : t("app.showDetails")}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
