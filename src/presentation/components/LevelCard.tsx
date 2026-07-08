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
 * `difficultyLabel`); the card maps no domain difficulty itself. A locked level
 * (sequential progression, MAZ-191) is dimmed, shows a lock indicator, and cannot
 * be pressed — the locked decision comes from the domain policy via the ViewModel.
 * The name comes from the catalog and truncates to one line so long names do not
 * overlap the order/difficulty metadata on narrow cards.
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
          ? `${level.name}, level ${level.order}, locked`
          : `${level.name}, level ${level.order}, ${level.difficultyLabel}`
      }
      disabled={locked}
      onPress={() => {
        if (!locked) onPress(level.id);
      }}
      className={
        locked
          ? "h-28 flex-1 items-center justify-center rounded-2xl bg-background-card border border-border-soft px-1 opacity-40"
          : "h-28 flex-1 items-center justify-center rounded-2xl bg-background-card border border-border-soft px-1 active:opacity-80"
      }
    >
      <Text className="text-xl font-black text-text-primary">
        {level.order}
      </Text>
      <Text
        testID={`level-card-name-${level.id}`}
        numberOfLines={1}
        className="mt-0.5 w-full px-1 text-center text-[11px] font-semibold text-text-secondary"
      >
        {level.name}
      </Text>
      {locked ? (
        <Text testID={`level-card-lock-${level.id}`} className="mt-1 text-base">
          🔒
        </Text>
      ) : (
        <>
          <View className="mt-1 flex-row items-center">
            {Array.from({ length: 3 }).map((_, index) => (
              <Text
                key={`star-${index}`}
                className={
                  index < stars ? "text-reward-gold" : "text-border-soft"
                }
              >
                ★
              </Text>
            ))}
            {level.timed ? (
              <Text className="ml-1 text-[10px] font-semibold text-primary-500">
                ⏱
              </Text>
            ) : null}
          </View>
        </>
      )}
    </Pressable>
  );
}
