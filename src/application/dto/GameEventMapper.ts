import type { GameEvent } from "../../domain/observer";
import { GameEventType } from "../../domain/observer";
import type { Position } from "../../domain/value-objects/Position";
import type { CoordinateDto } from "./BoardSnapshotDto";
import { GameEventTypeDto } from "./GameEventDto";
import type { GameEventDto } from "./GameEventDto";

function toCoordinate(position: Position): CoordinateDto {
  return { row: position.row, column: position.col };
}

/**
 * Maps a domain `GameEvent` to its UI-neutral `GameEventDto` — the single
 * translation point from domain event objects (which carry `Position` and
 * `LevelResult`) to plain DTOs, re-labelling the domain `GameEventType`
 * discriminator as the boundary-owned `GameEventTypeDto`, so presentation never
 * reads domain internals.
 */
export function mapGameEvent(event: GameEvent): GameEventDto {
  switch (event.type) {
    case GameEventType.MoveExecuted:
      return {
        type: GameEventTypeDto.MoveExecuted,
        from: toCoordinate(event.from),
        to: toCoordinate(event.to),
        moves: event.moves
      };
    case GameEventType.CellEscaped:
      return {
        type: GameEventTypeDto.CellEscaped,
        from: toCoordinate(event.from)
      };
    case GameEventType.LevelFinished:
      return {
        type: GameEventTypeDto.LevelFinished,
        result: {
          status: event.result.status,
          ...(event.result.reason === undefined ? {} : { reason: event.result.reason })
        }
      };
  }
}
