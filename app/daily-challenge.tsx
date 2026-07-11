import { useMemo, useState } from "react";
import { useRouter } from "expo-router";

import { createDailyChallengeViewModel } from "@/framework/config/dailyChallenge";
import { useScreenMusic } from "@/framework/audio/useScreenMusic";
import { safeBack } from "@/framework/navigation/safeBack";
import { DailyChallengeScreen } from "@/presentation/screens/DailyChallengeScreen";
import { GameScreen } from "@/presentation/screens/GameScreen";
import { useGameSession } from "@/presentation/hooks/useGameSession";
import type { DailyChallenge } from "@/application/ports/IDailyChallengeRepository";

/**
 * Daily Challenge route.
 *
 * Shows the fetch/loading/error entrypoint until the player starts today's
 * puzzle, then hosts the existing gameplay session with the daily level. The
 * daily level is anonymous (seed id, not a UUID), so gameplay makes no
 * leaderboard or progress write — no `onNextLevel`/`onViewLeaderboard` is wired.
 */
export default function DailyChallengeRoute() {
  const router = useRouter();
  useScreenMusic("gameplay");

  const dailyViewModel = useMemo(() => createDailyChallengeViewModel(), []);
  const [challenge, setChallenge] = useState<DailyChallenge | null>(null);

  const definition = challenge?.definition;
  const { viewModel, controller } = useGameSession(definition?.id ?? "", definition);

  if (challenge === null) {
    return (
      <DailyChallengeScreen
        viewModel={dailyViewModel}
        onBack={() => safeBack(router, "/")}
        onPlay={setChallenge}
      />
    );
  }

  return (
    <GameScreen
      viewModel={viewModel}
      controller={controller}
      levelOrder={0}
      onExit={() => setChallenge(null)}
      onHome={() => router.dismissAll()}
    />
  );
}
