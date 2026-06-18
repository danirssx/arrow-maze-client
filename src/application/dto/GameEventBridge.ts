import type { GameEvent } from "../../domain/observer";
import type { IGameObserver } from "../../domain/observer";
import { mapGameEvent } from "./GameEventMapper";
import type { IGameEventListener } from "./IGameEventListener";

/**
 * Observer bridge — domain subject to presentation listener adapter.
 *
 * Implements the domain `IGameObserver` so it can subscribe to a level (the
 * domain subject), maps each domain `GameEvent` to a UI-neutral `GameEventDto`,
 * and forwards it to an `IGameEventListener`. This is what keeps presentation
 * from implementing the domain observer interface directly.
 */
export class GameEventBridge implements IGameObserver {
  constructor(private readonly listener: IGameEventListener) {}

  onGameEvent(event: GameEvent): void {
    this.listener.onGameEvent(mapGameEvent(event));
  }
}
