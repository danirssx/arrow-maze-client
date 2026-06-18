import type { GameEvent } from "./GameEvent";
import type { IGameObserver } from "./IGameObserver";
import type { IObservable } from "./IObservable";

/**
 * Observer pattern — reusable subject.
 *
 * Holds the set of registered observers and fans out events to them. Backed by
 * a `Set`, so registering the same observer twice keeps a single subscription
 * and unregistering an unknown observer is a no-op. It iterates over a snapshot
 * of the observers so an observer that unregisters itself while handling an
 * event does not corrupt the in-progress notification.
 *
 * Kept separate from any concrete subject (e.g. `BaseLevel`) so the
 * registration/notification logic is shared and unit-testable on its own.
 */
export class GameEventEmitter implements IObservable {
  private readonly observers = new Set<IGameObserver>();

  register(observer: IGameObserver): void {
    this.observers.add(observer);
  }

  unregister(observer: IGameObserver): void {
    this.observers.delete(observer);
  }

  emit(event: GameEvent): void {
    for (const observer of [...this.observers]) {
      observer.onGameEvent(event);
    }
  }

  get observerCount(): number {
    return this.observers.size;
  }
}
