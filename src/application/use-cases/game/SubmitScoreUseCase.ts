import type { GetCurrentSessionUseCase } from "@/application/auth/GetCurrentSessionUseCase";
import type { LeaderboardFacade } from "@/application/facades/LeaderboardFacade";
import type { SubmitScoreInput } from "@/application/ports/ILeaderboardRepository";
import { LevelResult } from "@/domain/level/LevelResult";
import type { IScoringStrategy } from "@/domain/scoring/IScoringStrategy";
import { ScoreContext } from "@/domain/scoring/ScoreContext";
import { TimeScoringStrategy } from "@/domain/scoring/TimeScoringStrategy";

/** The data a cleared level produces for a leaderboard submission. */
export type VictoryRun = {
  readonly levelId: string;
  readonly elapsedMs: number;
  readonly arrowCount: number;
};

export type SubmitScoreResult = {
  readonly submitted: boolean;
};

/** UUID v4 (client-generated id; the backend derives the user from the token). */
function randomId(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
    const random = Math.floor(Math.random() * 16);
    const value = char === "x" ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

/**
 * Application use case — submit a cleared run to the leaderboard.
 *
 * Reads the current session; if the player is authenticated it scores the run
 * with the time-based strategy and POSTs it through the `LeaderboardFacade` with
 * the access token. When there is no session it is a no-op (the leaderboard
 * write path stays inert until auth login is wired). Time/moves are clamped to
 * the backend's positive-integer requirements.
 */
export class SubmitScoreUseCase {
  constructor(
    private readonly getSession: GetCurrentSessionUseCase,
    private readonly leaderboard: LeaderboardFacade,
    private readonly scoring: IScoringStrategy = new TimeScoringStrategy()
  ) {}

  async execute(run: VictoryRun): Promise<SubmitScoreResult> {
    const session = await this.getSession.execute();
    if (session === null) {
      return { submitted: false };
    }

    const elapsedMs = Math.max(run.elapsedMs, 0);
    const score = this.scoring.score(ScoreContext.create({ result: LevelResult.won(), elapsedMs })).value;

    const input: SubmitScoreInput = {
      leaderboardId: randomId(),
      entryId: randomId(),
      levelId: run.levelId,
      usernameSnapshot: session.username,
      score,
      timeSeconds: Math.max(1, Math.round(elapsedMs / 1000)),
      movesCount: Math.max(1, run.arrowCount)
    };

    await this.leaderboard.submitScore(input, session.accessToken);
    return { submitted: true };
  }
}
