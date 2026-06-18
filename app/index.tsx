import { useRouter } from "expo-router";

import { HomeScreen } from "@/presentation/screens/HomeScreen";

export default function HomeRoute() {
  const router = useRouter();

  return (
    <HomeScreen
      onPlay={() => router.push("/levels")}
      onChallenges={() => router.push("/levels")}
      onLeaderboard={() => router.push("/leaderboard")}
      onProgress={() => router.push("/progress")}
      onSettings={() => router.push("/settings")}
    />
  );
}
