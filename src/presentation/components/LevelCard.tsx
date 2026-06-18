import { Pressable, Text, View } from "react-native";
import type { LevelListItem } from "@/presentation/view-models/LevelSelectViewModel";

interface LevelCardProps {
  level: LevelListItem;
  onPress: (levelId: string) => void;
}

const DIFFICULTY_STARS: Record<string, number> = { EASY: 1, MEDIUM: 2, HARD: 3 };

/**
 * Level grid tile — shows the level number and a difficulty star rating.
 */
export function LevelCard({ level, onPress }: LevelCardProps) {
  const stars = DIFFICULTY_STARS[level.difficulty] ?? 1;

  return (
    <Pressable
      testID={`level-card-${level.id}`}
      accessibilityRole="button"
      onPress={() => onPress(level.id)}
      className="h-24 flex-1 items-center justify-center rounded-2xl bg-background-card border border-border-soft active:opacity-80"
    >
      <Text className="text-2xl font-black text-text-primary">{level.order}</Text>
      <View className="mt-1 flex-row">
        {Array.from({ length: 3 }).map((_, index) => (
          <Text
            key={`star-${index}`}
            className={index < stars ? "text-reward-gold" : "text-border-soft"}
          >
            ★
          </Text>
        ))}
      </View>
      {level.timed ? <Text className="mt-0.5 text-[10px] font-semibold text-primary-500">⏱</Text> : null}
    </Pressable>
  );
}
