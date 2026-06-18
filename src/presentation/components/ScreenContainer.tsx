import type { ReactNode } from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface ScreenContainerProps {
  children: ReactNode;
  testID?: string;
  /** Soft lavender app background (default) or plain white. */
  variant?: "app" | "card";
}

/**
 * Shared screen shell — applies the FlechaGo background and safe-area padding.
 *
 * Every screen renders inside this so backgrounds, insets, and horizontal
 * padding stay consistent with the design system.
 */
export function ScreenContainer({ children, testID, variant = "app" }: ScreenContainerProps) {
  const background = variant === "app" ? "bg-background" : "bg-background-card";
  return (
    <SafeAreaView testID={testID} className={`flex-1 ${background}`}>
      <View className="flex-1 px-6">{children}</View>
    </SafeAreaView>
  );
}
