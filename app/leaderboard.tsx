import { useRouter } from "expo-router";

import { LeaderboardScreen } from "@/presentation/screens/LeaderboardScreen";

export default function LeaderboardRoute() {
  const router = useRouter();

  // No authenticated session is wired in this milestone (see AM-043 / future
  // integration), so the screen renders its empty state. The MVVM data path
  // through LeaderboardViewModel → LeaderboardFacade is covered by unit tests.
  return <LeaderboardScreen viewModel={null} levelId={null} onBack={() => router.back()} />;
}
