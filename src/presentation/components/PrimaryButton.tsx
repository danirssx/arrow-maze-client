import { Pressable, Text } from "react-native";

interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary";
  testID?: string;
  disabled?: boolean;
}

/**
 * Primary call-to-action button.
 *
 * `primary` uses the brand blue with white text; `secondary` uses the soft
 * lavender surface with blue text. Both follow the rounded, high-contrast style
 * from the design guideline.
 */
export function PrimaryButton({
  label,
  onPress,
  variant = "primary",
  testID,
  disabled = false
}: PrimaryButtonProps) {
  const base = "rounded-2xl px-6 py-4 active:opacity-80";
  const styles =
    variant === "primary"
      ? `${base} bg-primary-700`
      : `${base} bg-background-soft border border-border-soft`;
  const textStyles =
    variant === "primary"
      ? "text-center text-base font-bold text-text-inverse"
      : "text-center text-base font-bold text-primary-700";

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      className={`${styles} ${disabled ? "opacity-40" : ""}`}
    >
      <Text className={textStyles}>{label}</Text>
    </Pressable>
  );
}
