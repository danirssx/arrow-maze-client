import type { GameResultDto } from "../use-cases/game/GameSnapshotDto";
import type { CoordinateDto } from "./BoardSnapshotDto";

/**
 * UI-neutral game event DTOs (domain → presentation boundary).
 *
 * Presentation-facing mirror of the domain `GameEvent` union with plain,
 * serializable payloads (`CoordinateDto`, `GameResultDto`), so a ViewModel reacts
 * to gameplay without importing `Position`, `LevelResult`, or level classes.
 *
 * The discriminator is the boundary's **own** `GameEventTypeDto` literal — this
 * file imports no domain code. Its string values mirror the domain `GameEventType`
 * exactly; `GameEventMapper` is the single point that translates one to the other.
 */
export const GameEventTypeDto = {
  MoveExecuted: "MOVE_EXECUTED",
  CellEscaped: "CELL_ESCAPED",
  LevelFinished: "LEVEL_FINISHED"
} as const;

// eslint-disable-next-line @typescript-eslint/no-redeclare
export type GameEventTypeDto = (typeof GameEventTypeDto)[keyof typeof GameEventTypeDto];

export type MoveExecutedEventDto = {
  readonly type: typeof GameEventTypeDto.MoveExecuted;
  readonly from: CoordinateDto;
  readonly to: CoordinateDto;
  readonly moves: number;
};

export type CellEscapedEventDto = {
  readonly type: typeof GameEventTypeDto.CellEscaped;
  readonly from: CoordinateDto;
};

export type LevelFinishedEventDto = {
  readonly type: typeof GameEventTypeDto.LevelFinished;
  readonly result: GameResultDto;
};

/** Discriminated union of every UI-neutral game event. */
export type GameEventDto = MoveExecutedEventDto | CellEscapedEventDto | LevelFinishedEventDto;
