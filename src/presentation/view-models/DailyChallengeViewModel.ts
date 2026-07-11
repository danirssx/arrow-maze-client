import type { DailyChallengeFacade } from "@/application/facades/DailyChallengeFacade";
import type { DailyChallenge } from "@/application/ports/IDailyChallengeRepository";
import { AsyncStatus, idle } from "@/presentation/state/AsyncUiState";
import type { AsyncUiState } from "@/presentation/state/AsyncUiState";
import { ObservableViewModel } from "./ObservableViewModel";

/**
 * MVVM — daily challenge ViewModel.
 *
 * Loads today's puzzle through the `DailyChallengeFacade` and exposes it as an
 * `AsyncUiState` so the screen renders loading/error/loaded without ever touching
 * HTTP or repositories. A backend failure becomes a recoverable `Error` state.
 */
export class DailyChallengeViewModel extends ObservableViewModel<AsyncUiState<DailyChallenge>> {
  constructor(private readonly facade: DailyChallengeFacade) {
    super(idle<DailyChallenge>());
  }

  async load(): Promise<void> {
    this.setState({ status: AsyncStatus.Loading, data: null });
    try {
      const challenge = await this.facade.getDailyChallenge();
      this.setState({ status: AsyncStatus.Loaded, data: challenge });
    } catch {
      this.setState({ status: AsyncStatus.Error, data: null });
    }
  }
}
