import { ScrollView, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { Header } from "@/presentation/components/Header";
import { LevelCard } from "@/presentation/components/LevelCard";
import { ScreenContainer } from "@/presentation/components/ScreenContainer";
import type { LevelListItem } from "@/presentation/view-models/LevelSelectViewModel";

interface LevelSelectScreenProps {
  levels: readonly LevelListItem[];
  onSelect: (levelId: string) => void;
  onBack: () => void;
}

function chunk<T>(items: readonly T[], size: number): T[][] {
  const rows: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    rows.push(items.slice(index, index + size));
  }
  return rows;
}

/**
 * MVVM view — level select.
 *
 * Renders the level catalog the `LevelSelectViewModel` provides as a tappable
 * grid and reports the chosen level id upward. No level building happens here.
 */
export function LevelSelectScreen({ levels, onSelect, onBack }: LevelSelectScreenProps) {
  const { t } = useTranslation();
  const rows = chunk(levels, 3);

  return (
    <ScreenContainer testID="level-select-screen">
      <Header title={t("levels.title")} onBack={onBack} />
      <Text className="mb-4 mt-2 text-sm text-text-secondary">{t("levels.subtitle")}</Text>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="gap-3 pb-8">
          {rows.map((row, rowIndex) => (
            <View key={`level-row-${rowIndex}`} className="flex-row gap-3">
              {row.map((level) => (
                <LevelCard key={level.id} level={level} onPress={onSelect} />
              ))}
              {Array.from({ length: 3 - row.length }).map((_, fillerIndex) => (
                <View key={`filler-${rowIndex}-${fillerIndex}`} className="flex-1" />
              ))}
            </View>
          ))}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
