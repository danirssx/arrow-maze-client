import type { LevelResult } from "../../../domain/level/LevelResult";
import type { GameSnapshotDto } from "./GameSnapshotDto";
import type { GameSession } from "./GameSession";

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
    arrowsRemaining: level.activeArrowCount,
    attemptsRemaining: level.attemptsRemaining,
    canUndo: history.canUndo,
    elapsedMs: session.elapsedMs(),
    movesCount: session.movesCount()
  };
}
