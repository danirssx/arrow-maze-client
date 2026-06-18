import { Text, View } from "react-native";

interface BrandProps {
  size?: "md" | "lg";
}

/**
 * FlechaGo wordmark — "Flecha" in deep blue, "Go" in vibrant blue.
 *
 * Pure presentation; matches the brand guideline logo lockup using palette
 * tokens only.
 */
export function Brand({ size = "lg" }: BrandProps) {
  const textSize = size === "lg" ? "text-4xl" : "text-2xl";
  return (
    <View className="flex-row items-center" accessibilityRole="header">
      <Text className={`${textSize} font-black text-primary-900`}>Flecha</Text>
      <Text className={`${textSize} font-black text-primary-500`}>Go</Text>
      <Text className={`${textSize} font-black text-primary-300`}> →</Text>
    </View>
  );
}
