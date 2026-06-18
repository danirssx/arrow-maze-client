import type { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";

interface HeaderProps {
  title?: string | undefined;
  onBack?: (() => void) | undefined;
  right?: ReactNode | undefined;
}

/**
 * Top navigation bar — optional back affordance, centered title, right slot.
 */
export function Header({ title, onBack, right }: HeaderProps) {
  return (
    <View className="h-14 flex-row items-center justify-between">
      <View className="w-12">
        {onBack !== undefined ? (
          <Pressable
            testID="header-back"
            accessibilityRole="button"
            accessibilityLabel="Back"
            onPress={onBack}
            className="h-10 w-10 items-center justify-center rounded-full bg-background-card border border-border-soft active:opacity-80"
          >
            <Text className="text-lg font-bold text-primary-700">‹</Text>
          </Pressable>
        ) : null}
      </View>

      {title !== undefined ? (
        <Text className="text-base font-bold text-text-primary">{title}</Text>
      ) : (
        <View />
      )}

      <View className="w-12 items-end">{right}</View>
    </View>
  );
}
