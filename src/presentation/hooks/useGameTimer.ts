import { useEffect } from "react";
import type { GameViewModel } from "@/presentation/view-models/GameViewModel";

/**
 * Sub-second so the displayed second never drifts a full tick behind the
 * session clock the ViewModel reads.
 */
export const GAME_TIMER_TICK_MS = 500;

/**
 * Drives the gameplay HUD timer.
 *
 * The interval lifecycle is a view concern, so it lives here instead of inside
 * the ViewModel: the hook only asks the ViewModel to re-read the elapsed time
 * the application session already measured. It refreshes once per run so a match
 * that just ended still paints its frozen final time, keeps ticking only while
 * `isRunning`, and clears the interval on unmount or when the match ends.
 */
export function useGameTimer(viewModel: GameViewModel, isRunning: boolean): void {
  useEffect(() => {
    viewModel.refreshElapsedTime();
    if (!isRunning) {
      return;
    }

    const intervalId = setInterval(() => viewModel.refreshElapsedTime(), GAME_TIMER_TICK_MS);
    return () => clearInterval(intervalId);
  }, [viewModel, isRunning]);
}
