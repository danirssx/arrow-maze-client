import type { BaseLevel } from "../../domain/level/BaseLevel";

/**
 * BuiltLevel (application product).
 *
 * The result of building a level: a ready-to-play `BaseLevel` (a `NormalLevel`
 * or `TimedLevel` with its `BoardGraph` already wired internally) together with
 * the `optimalMoves` computed by `PathfindingService` during solvability
 * validation, so callers (scoring, UI hints) do not recompute it.
 */
export type BuiltLevel = {
  readonly level: BaseLevel;
  readonly optimalMoves: number;
};
