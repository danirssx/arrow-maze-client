import { Text, View } from "react-native";

interface CoinBadgeProps {
  amount: number;
  testID?: string;
}

/**
 * Coin/reward pill — gold accent reserved for points and rewards.
 */
export function CoinBadge({ amount, testID }: CoinBadgeProps) {
  return (
    <View
      testID={testID}
      className="flex-row items-center gap-1 rounded-full bg-background-card px-3 py-1.5 border border-border-soft"
    >
      <View className="h-4 w-4 rounded-full bg-reward-gold" />
      <Text className="text-sm font-bold text-text-primary">{amount.toLocaleString()}</Text>
    </View>
  );
}
