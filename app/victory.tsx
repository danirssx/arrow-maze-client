import { useRouter } from "expo-router";

import { VictoryScreen } from "@/presentation/screens/VictoryScreen";

export default function VictoryRoute() {
  const router = useRouter();

  return <VictoryScreen onPlayAgain={() => router.back()} onHome={() => router.dismissAll()} />;
}
