import type { GameEventType } from "../../domain/observer";
import type { GameResultDto, PositionDto } from "../use-cases/game/GameSnapshotDto";

/**
 * UI-neutral game event DTOs (domain → presentation boundary).
 *
 * Presentation-facing mirror of the domain `GameEvent` union. Every payload is a
 * plain, serializable value (`PositionDto` as `{ row, column }`, `GameResultDto`
 * as `{ status, reason? }`), so a ViewModel can react to gameplay without
 * importing concrete domain classes (`Position`, `LevelResult`, the level
 * classes) or the `BoardGraph`.
 *
 * The discriminator reuses the domain `GameEventType` string values so the two
 * representations never drift.
 */
export { GameEventType } from "../../domain/observer";

export type MoveExecutedEventDto = {
  readonly type: typeof GameEventType.MoveExecuted;
  readonly from: PositionDto;
  readonly to: PositionDto;
  readonly moves: number;
};

export type CellEscapedEventDto = {
  readonly type: typeof GameEventType.CellEscaped;
  readonly from: PositionDto;
};

export type LevelFinishedEventDto = {
  readonly type: typeof GameEventType.LevelFinished;
  readonly result: GameResultDto;
};

/** Discriminated union of every UI-neutral game event. */
export type GameEventDto = MoveExecutedEventDto | CellEscapedEventDto | LevelFinishedEventDto;
