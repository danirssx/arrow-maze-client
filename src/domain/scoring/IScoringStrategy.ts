import type { Score } from "../value-objects/Score";
import type { ScoreContext } from "./ScoreContext";

/**
 * Strategy pattern — scoring contract.
 *
 * An interchangeable, deterministic scoring algorithm. Implementations must be
 * pure: the same `ScoreContext` always yields the same `Score`, and a non-won
 * result must never produce a positive (invalid) high score.
 */
export interface IScoringStrategy {
  score(context: ScoreContext): Score;
}
