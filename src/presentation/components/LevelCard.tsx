import { Pressable, Text, View } from "react-native";
import type { LevelListItem } from "@/presentation/view-models/LevelSelectViewModel";

interface LevelCardProps {
  level: LevelListItem;
  onPress: (levelId: string) => void;
}

/**
 * Level grid tile — shows the level name, its number and a difficulty star rating.
 *
 * Difficulty arrives ready-to-consume from the ViewState (`difficultyStars` /
 * `difficultyLabel`); the card maps no domain difficulty itself. The name comes
 * from the catalog (backend `LevelCatalogSummary.name` or the offline fixture),
 * so the player can identify the level (MAZ-192); it truncates to one line so a
 * long name never overlaps the order/difficulty metadata on a narrow device.
 */
export function LevelCard({ level, onPress }: LevelCardProps) {
  const stars = level.difficultyStars;

  return (
    <Pressable
      testID={`level-card-${level.id}`}
      accessibilityRole="button"
      accessibilityLabel={`${level.name}, level ${level.order}, ${level.difficultyLabel}`}
      onPress={() => onPress(level.id)}
      className="h-24 flex-1 items-center justify-center rounded-2xl bg-background-card border border-border-soft px-1 active:opacity-80"
    >
      <Text className="text-xl font-black text-text-primary">{level.order}</Text>
      <Text
        testID={`level-card-name-${level.id}`}
        numberOfLines={1}
        className="mt-0.5 w-full px-1 text-center text-[11px] font-semibold text-text-secondary"
      >
        {level.name}
      </Text>
      <View className="mt-1 flex-row items-center">
        {Array.from({ length: 3 }).map((_, index) => (
          <Text
            key={`star-${index}`}
            className={index < stars ? "text-reward-gold" : "text-border-soft"}
          >
            ★
          </Text>
        ))}
        {level.timed ? <Text className="ml-1 text-[10px] font-semibold text-primary-500">⏱</Text> : null}
      </View>
    </Pressable>
  );
}
