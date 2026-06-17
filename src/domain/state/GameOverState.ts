import { GamePhase } from "./GamePhase";
import { BaseGameState } from "./BaseGameState";

/**
 * State pattern — game-over state.
 *
 * Terminal loss state. It intentionally inherits the base rejection behavior
 * for movement, pause, resume, and start so terminal flow decisions stay
 * explicit in later application use cases.
 */
export class GameOverState extends BaseGameState {
  constructor() {
    super(GamePhase.GameOver);
  }
}
