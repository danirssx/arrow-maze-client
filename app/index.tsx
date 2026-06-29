import { type Href, useRouter } from "expo-router";

import { useAuthSession } from "@/framework/auth/AuthGate";
import { HomeScreen } from "@/presentation/screens/HomeScreen";

const LEVELS_ROUTE = "/levels" as Href;
const LEADERBOARD_ROUTE = "/leaderboard" as Href;
const PROGRESS_ROUTE = "/progress" as Href;
const SETTINGS_ROUTE = "/settings" as Href;

export default function HomeRoute() {
  const router = useRouter();
  const { session, clearSession } = useAuthSession();

  const handleLogout = () => {
    void clearSession().then(() => router.replace("/login"));
  };

  return (
    <HomeScreen
      {...(session !== null ? { username: session.username } : {})}
      onPlay={() => router.push(LEVELS_ROUTE)}
      onChallenges={() => router.push(LEVELS_ROUTE)}
      onLeaderboard={() => router.push(LEADERBOARD_ROUTE)}
      onProgress={() => router.push(PROGRESS_ROUTE)}
      onSettings={() => router.push(SETTINGS_ROUTE)}
      onLogout={handleLogout}
    />
  );
}
