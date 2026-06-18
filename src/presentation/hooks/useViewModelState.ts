import { useSyncExternalStore } from "react";
import type { ObservableViewModel } from "@/presentation/view-models/ObservableViewModel";

/**
 * Binds a framework-neutral ViewModel to React.
 *
 * Re-renders the calling screen whenever the ViewModel publishes a new UI-state
 * snapshot, using React's external-store contract. This is the only bridge
 * between ViewModels and the view layer; ViewModels stay free of React imports.
 */
export function useViewModelState<TState>(viewModel: ObservableViewModel<TState>): TState {
  return useSyncExternalStore(viewModel.subscribe, viewModel.getState, viewModel.getState);
}
