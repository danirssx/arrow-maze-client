import type { GameEvent } from "./GameEvent";

/**
 * Observer pattern — observer contract.
 *
 * A subscriber that reacts to domain game events. Concrete observers (audio,
 * analytics, view-model bridges) live outside the domain; the domain depends
 * only on this interface, so it never imports UI or device APIs.
 */
export interface IGameObserver {
  onGameEvent(event: GameEvent): void;
}
