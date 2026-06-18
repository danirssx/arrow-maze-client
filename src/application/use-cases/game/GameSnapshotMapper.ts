import type { LevelResult } from "../../../domain/level/LevelResult";
import type { Position } from "../../../domain/value-objects/Position";
import type { GameSnapshotDto, PositionDto } from "./GameSnapshotDto";
import type { GameSession } from "./GameSession";

function mapPosition(position: Position): PositionDto {
  return {
    row: position.row,
    column: position.col
  };
}

function mapResult(result: LevelResult): GameSnapshotDto["result"] {
  if (result.reason === undefined) {
    return { status: result.status };
  }
  return { status: result.status, reason: result.reason };
}

export function mapGameSnapshot(session: GameSession): GameSnapshotDto {
  const context = session.requireContext();
  const level = context.requireLevel();
  const history = session.requireHistory();

  return {
    phase: context.phase,
    result: mapResult(context.result),
    position: mapPosition(level.position),
    moves: level.moves,
    canUndo: history.canUndo,
    optimalMoves: session.requireOptimalMoves()
  };
}
