import type { LevelResult } from "../level/LevelResult";
import type { Position } from "../value-objects/Position";

/**
 * GameEventType value object.
 *
 * Closed set of the domain events a level can emit. Modeled as a frozen const
 * map plus a union type so each event carries a plain serializable discriminator
 * that presentation/audio adapters can switch on without importing classes.
 */
export const GameEventType = {
  MoveExecuted: "MOVE_EXECUTED",
  CellEscaped: "CELL_ESCAPED",
  LevelFinished: "LEVEL_FINISHED"
} as const;

export type GameEventType = (typeof GameEventType)[keyof typeof GameEventType];

/**
 * Observer pattern — domain event emitted after a successful move.
 *
 * Immutable. Carries the cell the player moved from, the cell moved to, and the
 * running move count so observers can react without reaching into the level.
 */
export class MoveExecutedEvent {
  readonly type = GameEventType.MoveExecuted;

  constructor(
    readonly from: Position,
    readonly to: Position,
    readonly moves: number
  ) {}
}

/**
 * Observer pattern — domain event emitted when the player leaves (escapes) a
 * cell as part of a move. Carries the position that was left.
 */
export class CellEscapedEvent {
  readonly type = GameEventType.CellEscaped;

  constructor(readonly from: Position) {}
}

/**
 * Observer pattern — domain event emitted once the level reaches a terminal
 * outcome. Carries the `LevelResult` so observers (UI, audio) never re-evaluate
 * game rules themselves.
 */
export class LevelFinishedEvent {
  readonly type = GameEventType.LevelFinished;

  constructor(readonly result: LevelResult) {}
}

/** Discriminated union of every domain game event. */
export type GameEvent = MoveExecutedEvent | CellEscapedEvent | LevelFinishedEvent;
