import type { BaseLevel } from "../level/BaseLevel";
import type { LevelResult } from "../level/LevelResult";
import type { Position } from "../value-objects/Position";
import type { GameContext } from "./GameContext";
import type { GamePhase } from "./GamePhase";

/**
 * State pattern — state interface.
 *
 * Each lifecycle state owns the behavior allowed in that phase. `GameContext`
 * delegates commands here instead of branching on phase names.
 */
export interface IGameState {
  readonly phase: GamePhase;

  start(context: GameContext, level: BaseLevel): void;
  move(context: GameContext, to: Position): LevelResult;
  pause(context: GameContext): void;
  resume(context: GameContext): void;
}
