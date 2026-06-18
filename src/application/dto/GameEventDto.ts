import type { GameEventType } from "../../domain/observer";
import type { GameResultDto } from "../use-cases/game/GameSnapshotDto";
import type { CoordinateDto } from "./BoardSnapshotDto";

/**
 * UI-neutral game event DTOs (domain → presentation boundary).
 *
 * Presentation-facing mirror of the domain `GameEvent` union with plain,
 * serializable payloads (`CoordinateDto`, `GameResultDto`), so a ViewModel reacts
 * to gameplay without importing `Position`, `LevelResult`, or level classes. The
 * discriminator reuses the domain `GameEventType` so the two never drift.
 */
export { GameEventType } from "../../domain/observer";

export type MoveExecutedEventDto = {
  readonly type: typeof GameEventType.MoveExecuted;
  readonly from: CoordinateDto;
  readonly to: CoordinateDto;
  readonly moves: number;
};

export type CellEscapedEventDto = {
  readonly type: typeof GameEventType.CellEscaped;
  readonly from: CoordinateDto;
};

export type LevelFinishedEventDto = {
  readonly type: typeof GameEventType.LevelFinished;
  readonly result: GameResultDto;
};

/** Discriminated union of every UI-neutral game event. */
export type GameEventDto = MoveExecutedEventDto | CellEscapedEventDto | LevelFinishedEventDto;
