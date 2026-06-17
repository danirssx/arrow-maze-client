import type { LevelResult } from "../level/LevelResult";
import type { Position } from "../value-objects/Position";
import { GamePhase } from "./GamePhase";
import type { GameContext } from "./GameContext";
import { BaseGameState } from "./BaseGameState";
import { GameOverState } from "./GameOverState";
import { PausedState } from "./PausedState";
import { VictoryState } from "./VictoryState";

/**
 * State pattern — playing state.
 *
 * The only state that accepts movement. It delegates movement rules to the
 * active `BaseLevel`, evaluates the resulting level outcome, and transitions to
 * terminal states when necessary.
 */
export class PlayingState extends BaseGameState {
  constructor() {
    super(GamePhase.Playing);
  }

  override move(context: GameContext, to: Position): LevelResult {
    const level = context.requireLevel();
    level.move(to);

    const result = level.evaluate();
    context.setResult(result);

    if (result.isWon()) {
      context.transitionTo(new VictoryState());
    } else if (result.isLost()) {
      context.transitionTo(new GameOverState());
    }

    return result;
  }

  override pause(context: GameContext): void {
    context.transitionTo(new PausedState());
  }
}
