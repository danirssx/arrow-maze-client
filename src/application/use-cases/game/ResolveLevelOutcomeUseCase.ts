import type { IScoringStrategy } from "../../../domain/scoring/IScoringStrategy";
import { ScoreContext } from "../../../domain/scoring/ScoreContext";
import type { GameSession } from "./GameSession";
import type { LevelOutcomeDto } from "./LevelOutcomeDto";

/**
 * Resolve the already-calculated outcome of the current game.
 *
 * Runs the injected scoring strategy over a `ScoreContext` built from the session
 * result + elapsed time, so the victory submit receives plain numbers and the
 * presentation layer never calculates a score. A non-won result yields a zero
 * score (the strategy guarantees it). `timeSeconds`/`movesCount` are clamped to
 * the persistence floor the progress/leaderboard endpoints require.
 */
export class ResolveLevelOutcomeUseCase {
  constructor(private readonly scoring: IScoringStrategy) {}

  execute(session: GameSession): LevelOutcomeDto {
    const result = session.requireContext().result;
    const elapsedMs = session.elapsedMs();
    const score = this.scoring.score(ScoreContext.create({ result, elapsedMs })).value;

    return {
      status: result.status,
      won: result.isWon(),
      score,
      timeSeconds: Math.max(1, Math.floor(elapsedMs / 1000)),
      movesCount: Math.max(1, session.movesCount())
    };
  }
}
