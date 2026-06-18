import type { BaseLevel } from "../level/BaseLevel";
import { GamePhase } from "./GamePhase";
import type { GameContext } from "./GameContext";
import { BaseGameState } from "./BaseGameState";
import { PlayingState } from "./PlayingState";

/**
 * State pattern — menu state.
 *
 * Idle lifecycle state before a level starts. Starting a level activates the
 * level and transitions the context to `PlayingState`.
 */
export class MenuState extends BaseGameState {
  constructor() {
    super(GamePhase.Menu);
  }

  override start(context: GameContext, level: BaseLevel): void {
    context.activateLevel(level);
    context.transitionTo(new PlayingState());
  }
}
