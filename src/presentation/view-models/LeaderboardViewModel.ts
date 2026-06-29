import type { LeaderboardFacade } from "@/application/facades/LeaderboardFacade";
import type { Leaderboard } from "@/application/ports/ILeaderboardRepository";
import { AsyncStatus, idle } from "@/presentation/state/AsyncUiState";
import type { AsyncUiState } from "@/presentation/state/AsyncUiState";
import { isUuid } from "@/shared/isUuid";
import { ObservableViewModel } from "./ObservableViewModel";

/**
 * MVVM — leaderboard ViewModel.
 *
 * Loads a level's top scores through the `LeaderboardFacade` and exposes them as
 * an `AsyncUiState` so the screen renders loading/empty/error/content without
 * ever touching HTTP or repositories.
 */
export class LeaderboardViewModel extends ObservableViewModel<AsyncUiState<Leaderboard>> {
  constructor(private readonly facade: LeaderboardFacade) {
    super(idle<Leaderboard>());
  }

  async load(levelId: string): Promise<void> {
    // A non-UUID levelId (offline slug fallback) would 422 on the backend; show
    // the empty state instead of firing a doomed request.
    if (!isUuid(levelId)) {
      this.setState({ status: AsyncStatus.Empty, data: null });
      return;
    }
    this.setState({ status: AsyncStatus.Loading, data: null });
    try {
      const leaderboard = await this.facade.getTopScores(levelId);
      if (leaderboard.entries.length === 0) {
        this.setState({ status: AsyncStatus.Empty, data: leaderboard });
        return;
      }
      this.setState({ status: AsyncStatus.Loaded, data: leaderboard });
    } catch {
      this.setState({ status: AsyncStatus.Error, data: null });
    }
  }
}
