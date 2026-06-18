import type { BaseLevel } from "../level/BaseLevel";
import type { LevelResult } from "../level/LevelResult";
import type { GameContext } from "./GameContext";
import type { GamePhase } from "./GamePhase";

/**
 * State pattern — state interface.
 *
 * Each lifecycle state owns the behavior allowed in that phase. `GameContext`
 * delegates commands here instead of branching on phase names. Gameplay is two
 * actions: extracting an arrow whose ray is clear, and registering a failed tap
 * on a blocked arrow (which consumes an attempt under the dedup rule).
 */
export interface IGameState {
  readonly phase: GamePhase;

  start(context: GameContext, level: BaseLevel): void;
  extract(context: GameContext, arrowId: string): LevelResult;
  failAttempt(context: GameContext, arrowId: string): LevelResult;
  pause(context: GameContext): void;
  resume(context: GameContext): void;
}
