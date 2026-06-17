import type { IGameObserver } from "./IGameObserver";

/**
 * Observer pattern — subject contract.
 *
 * Anything that emits domain game events and lets observers register and
 * unregister. Registration is idempotent and unregistration is safe to call
 * with an observer that was never registered.
 */
export interface IObservable {
  register(observer: IGameObserver): void;
  unregister(observer: IGameObserver): void;
}
