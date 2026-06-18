import type { ProgressFacade } from "@/application/facades/ProgressFacade";
import type { LocalProgress } from "@/application/ports/IProgressRepository";
import { AsyncStatus, idle } from "@/presentation/state/AsyncUiState";
import type { AsyncUiState } from "@/presentation/state/AsyncUiState";
import { ObservableViewModel } from "./ObservableViewModel";

/**
 * MVVM — player progress ViewModel.
 *
 * Loads offline-first progress through the `ProgressFacade` and exposes it as an
 * `AsyncUiState`. The screen reads completed levels and pending-sync state from
 * here and never calls storage or HTTP directly.
 */
export class ProgressViewModel extends ObservableViewModel<AsyncUiState<LocalProgress>> {
  constructor(private readonly facade: ProgressFacade) {
    super(idle<LocalProgress>());
  }

  async load(userId: string, accessToken: string): Promise<void> {
    this.setState({ status: AsyncStatus.Loading, data: null });
    try {
      const progress = await this.facade.load(userId, accessToken);
      if (progress.completedLevels.length === 0) {
        this.setState({ status: AsyncStatus.Empty, data: progress });
        return;
      }
      this.setState({ status: AsyncStatus.Loaded, data: progress });
    } catch {
      this.setState({ status: AsyncStatus.Error, data: null });
    }
  }
}
