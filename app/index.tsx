import { type Href, useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native"; // TEMP SPIKE (MAZ-225)

import { useAuthSession } from "@/framework/auth/AuthGate";
import { useScreenMusic } from "@/framework/audio/useScreenMusic";
import { HomeScreen } from "@/presentation/screens/HomeScreen";

const LEVELS_ROUTE = "/levels" as Href;
const DAILY_ROUTE = "/daily-challenge" as Href;
const LEADERBOARD_ROUTE = "/leaderboard" as Href;
const PROGRESS_ROUTE = "/progress" as Href;
const SETTINGS_ROUTE = "/settings" as Href;

export default function HomeRoute() {
  const router = useRouter();
  const { session, clearSession } = useAuthSession();
  useScreenMusic("home");

  const handleLogout = () => {
    void clearSession();
  };

  return (
    <View style={{ flex: 1 }}>
      <HomeScreen
        {...(session !== null ? { username: session.username } : {})}
        onPlay={() => router.push(LEVELS_ROUTE)}
        onDailyChallenge={() => router.push(DAILY_ROUTE)}
        onLeaderboard={() => router.push(LEADERBOARD_ROUTE)}
        onProgress={() => router.push(PROGRESS_ROUTE)}
        onSettings={() => router.push(SETTINGS_ROUTE)}
        onLogout={handleLogout}
      />
      {/* TEMP SPIKE (MAZ-225) — throwaway button, remove with the spike. */}
      <Pressable
        onPress={() => router.push("/spike-3d" as Href)}
        style={{ position: "absolute", bottom: 40, alignSelf: "center", backgroundColor: "#B026FF", paddingHorizontal: 20, paddingVertical: 12, borderRadius: 999 }}
      >
        <Text style={{ color: "white", fontWeight: "700" }}>▶ 3D SPIKE</Text>
      </Pressable>
    </View>
  );
}
