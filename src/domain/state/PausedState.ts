import { GamePhase } from "./GamePhase";
import type { GameContext } from "./GameContext";
import { BaseGameState } from "./BaseGameState";
import { PlayingState } from "./PlayingState";

/**
 * State pattern — paused state.
 *
 * Movement remains rejected by `BaseGameState`. The only lifecycle command this
 * state accepts is resuming play.
 */
export class PausedState extends BaseGameState {
  constructor() {
    super(GamePhase.Paused);
  }

  override resume(context: GameContext): void {
    context.transitionTo(new PlayingState());
  }
}
