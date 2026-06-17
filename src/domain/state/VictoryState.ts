import { GamePhase } from "./GamePhase";
import { BaseGameState } from "./BaseGameState";

/**
 * State pattern — victory state.
 *
 * Terminal win state. The context reaches this state only after the active
 * level evaluates to `LevelResult.won()`.
 */
export class VictoryState extends BaseGameState {
  constructor() {
    super(GamePhase.Victory);
  }
}
