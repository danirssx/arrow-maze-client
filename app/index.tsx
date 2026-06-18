import { type Href, useRouter } from "expo-router";

import { HomeScreen } from "@/presentation/screens/HomeScreen";

const LEVELS_ROUTE = "/levels" as Href;
const LEADERBOARD_ROUTE = "/leaderboard" as Href;
const PROGRESS_ROUTE = "/progress" as Href;
const SETTINGS_ROUTE = "/settings" as Href;

export default function HomeRoute() {
  const router = useRouter();

  return (
    <HomeScreen
      onPlay={() => router.push(LEVELS_ROUTE)}
      onChallenges={() => router.push(LEVELS_ROUTE)}
      onLeaderboard={() => router.push(LEADERBOARD_ROUTE)}
      onProgress={() => router.push(PROGRESS_ROUTE)}
      onSettings={() => router.push(SETTINGS_ROUTE)}
    />
  );
}
