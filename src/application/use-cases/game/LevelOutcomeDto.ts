import type { LevelStatusDto } from "./GameSnapshotDto";

/**
 * Already-calculated, UI-neutral result of a finished game.
 *
 * The plain numbers the victory submit forwards to progress + leaderboard:
 * scoring is computed in the application layer (via `ResolveLevelOutcomeUseCase`),
 * never in presentation. `timeSeconds` and `movesCount` are clamped to the
 * persistence floor (>= 1) the backend expects. `status` is the boundary's own
 * DTO literal, not a domain value object.
 */
export type LevelOutcomeDto = {
  readonly status: LevelStatusDto;
  readonly won: boolean;
  readonly score: number;
  readonly timeSeconds: number;
  readonly movesCount: number;
};
