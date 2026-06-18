import type { DefeatReason, LevelStatus } from "../../../domain/level/LevelResult";
import type { GamePhase } from "../../../domain/state/GamePhase";

export type PositionDto = {
  readonly row: number;
  readonly column: number;
};

export type GameResultDto = {
  readonly status: LevelStatus;
  readonly reason?: DefeatReason;
};

export type GameSnapshotDto = {
  readonly phase: GamePhase;
  readonly result: GameResultDto;
  readonly position: PositionDto;
  readonly moves: number;
  readonly canUndo: boolean;
  readonly optimalMoves: number;
};
