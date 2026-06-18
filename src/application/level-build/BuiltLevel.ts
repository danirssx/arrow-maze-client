import type { BaseLevel } from "../../domain/level/BaseLevel";

/**
 * BuiltLevel (application product).
 *
 * The result of building a level: a ready-to-play `BaseLevel` (a `NormalLevel`
 * or `TimedLevel` with its `BoardGroup` of arrows already wired internally).
 * There is no `optimalMoves` anymore — the untangle game scores by time, and
 * solvability is guaranteed by the backend at publish time (cycle/DAG check).
 */
export type BuiltLevel = {
  readonly level: BaseLevel;
};
