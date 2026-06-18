import type { LevelResult } from "../level/LevelResult";
import { GamePhase } from "./GamePhase";
import type { GameContext } from "./GameContext";
import { BaseGameState } from "./BaseGameState";
import { GameOverState } from "./GameOverState";
import { PausedState } from "./PausedState";
import { VictoryState } from "./VictoryState";

/**
 * State pattern — playing state.
 *
 * The only state that accepts gameplay. `extract` delegates to the active level
 * (which validates the ray), `failAttempt` records a blocked tap, and both
 * evaluate the outcome and transition to a terminal state when reached: victory
 * on an empty board, game over when attempts run out.
 */
export class PlayingState extends BaseGameState {
  constructor() {
    super(GamePhase.Playing);
  }

  override extract(context: GameContext, arrowId: string): LevelResult {
    const level = context.requireLevel();
    level.extractArrow(arrowId);
    return this.settle(context, level.evaluate());
  }

  override failAttempt(context: GameContext, arrowId: string): LevelResult {
    const level = context.requireLevel();
    level.registerFailedAttempt(arrowId);
    return this.settle(context, level.evaluate());
  }

  override pause(context: GameContext): void {
    context.transitionTo(new PausedState());
  }

  private settle(context: GameContext, result: LevelResult): LevelResult {
    context.setResult(result);
    if (result.isWon()) {
      context.transitionTo(new VictoryState());
    } else if (result.isLost()) {
      context.transitionTo(new GameOverState());
    }
    return result;
  }
}
