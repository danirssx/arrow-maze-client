import { Pressable, Text, View } from "react-native";
import type { LevelListItem } from "@/presentation/view-models/LevelSelectViewModel";

interface LevelCardProps {
  level: LevelListItem;
  onPress: (levelId: string) => void;
}

/**
 * Level grid tile — shows the level number and a difficulty star rating.
 *
 * Difficulty arrives ready-to-consume from the ViewState (`difficultyStars` /
 * `difficultyLabel`); the card maps no domain difficulty itself. A locked level
 * (sequential progression, MAZ-191) is dimmed, shows a lock indicator, and cannot
 * be pressed — the locked decision comes from the domain policy via the ViewModel.
 */
export function LevelCard({ level, onPress }: LevelCardProps) {
  const stars = level.difficultyStars;
  const locked = level.locked;

  return (
    <Pressable
      testID={`level-card-${level.id}`}
      accessibilityRole="button"
      accessibilityState={{ disabled: locked }}
      accessibilityLabel={
        locked
          ? `Level ${level.order}, locked`
          : `Level ${level.order}, ${level.difficultyLabel}`
      }
      disabled={locked}
      onPress={() => {
        if (!locked) onPress(level.id);
      }}
      className={
        locked
          ? "h-24 flex-1 items-center justify-center rounded-2xl bg-background-card border border-border-soft opacity-40"
          : "h-24 flex-1 items-center justify-center rounded-2xl bg-background-card border border-border-soft active:opacity-80"
      }
    >
      <Text className="text-2xl font-black text-text-primary">{level.order}</Text>
      {locked ? (
        <Text testID={`level-card-lock-${level.id}`} className="mt-1 text-base">
          🔒
        </Text>
      ) : (
        <>
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
        </>
      )}
    </Pressable>
  );
}
