/**
 * Tiny observable base for MVVM ViewModels.
 *
 * Holds an immutable UI-state snapshot and notifies subscribers when it changes.
 * The contract (`getState` + `subscribe`) matches React's `useSyncExternalStore`
 * so screens can bind without the ViewModel importing React. Keeping it
 * framework-neutral lets ViewModels be unit-tested with no renderer.
 */
export abstract class ObservableViewModel<TState> {
  private readonly listeners = new Set<() => void>();

  protected constructor(private currentState: TState) {}

  getState = (): TState => this.currentState;

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  protected setState(next: TState): void {
    if (next === this.currentState) {
      return;
    }
    this.currentState = next;
    for (const listener of [...this.listeners]) {
      listener();
    }
  }
}
