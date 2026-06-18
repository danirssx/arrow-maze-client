import { useLocalSearchParams, useRouter } from "expo-router";

import { VictoryScreen } from "@/presentation/screens/VictoryScreen";

export default function VictoryRoute() {
  const router = useRouter();
  const params = useLocalSearchParams<{ moves?: string; optimalMoves?: string }>();

  return (
    <VictoryScreen
      moves={Number(params.moves ?? 0)}
      optimalMoves={Number(params.optimalMoves ?? 0)}
      onPlayAgain={() => router.back()}
      onHome={() => router.dismissAll()}
    />
  );
}
