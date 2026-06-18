import type { DefeatReason, LevelStatus } from "../../../domain/level/LevelResult";
import type { GamePhase } from "../../../domain/state/GamePhase";

export type GameResultDto = {
  readonly status: LevelStatus;
  readonly reason?: DefeatReason;
};

/**
 * UI-neutral gameplay snapshot for ViewModels: the lifecycle phase, the level
 * result, how many arrows remain, how many attempts are left, and whether undo
 * is available. No board geometry here — the static board layout is a separate
 * presentation concern.
 */
export type GameSnapshotDto = {
  readonly phase: GamePhase;
  readonly result: GameResultDto;
  readonly arrowsRemaining: number;
  readonly attemptsRemaining: number;
  readonly canUndo: boolean;
};
