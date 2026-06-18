import { useRouter } from "expo-router";

import { ProgressScreen } from "@/presentation/screens/ProgressScreen";

export default function ProgressRoute() {
  const router = useRouter();

  // No authenticated session is wired in this milestone, so the screen renders
  // its empty state. The MVVM data path through ProgressViewModel →
  // ProgressFacade is covered by unit tests.
  return (
    <ProgressScreen viewModel={null} userId={null} accessToken={null} onBack={() => router.back()} />
  );
}
