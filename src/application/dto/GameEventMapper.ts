import type { GameEvent } from "../../domain/observer";
import { GameEventType } from "../../domain/observer";
import type { Position } from "../../domain/value-objects/Position";
import type { CoordinateDto } from "./BoardSnapshotDto";
import type { GameEventDto } from "./GameEventDto";

function toCoordinate(position: Position): CoordinateDto {
  return { row: position.row, column: position.col };
}

/**
 * Maps a domain `GameEvent` to its UI-neutral `GameEventDto` — the single
 * translation point from domain event objects (which carry `Position` and
 * `LevelResult`) to plain DTOs, so presentation never reads domain internals.
 */
export function mapGameEvent(event: GameEvent): GameEventDto {
  switch (event.type) {
    case GameEventType.MoveExecuted:
      return {
        type: GameEventType.MoveExecuted,
        from: toCoordinate(event.from),
        to: toCoordinate(event.to),
        moves: event.moves
      };
    case GameEventType.CellEscaped:
      return {
        type: GameEventType.CellEscaped,
        from: toCoordinate(event.from)
      };
    case GameEventType.LevelFinished:
      return {
        type: GameEventType.LevelFinished,
        result: {
          status: event.result.status,
          ...(event.result.reason === undefined ? {} : { reason: event.result.reason })
        }
      };
  }
}
