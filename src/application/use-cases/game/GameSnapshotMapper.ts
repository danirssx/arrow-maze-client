import type { LevelResult, LevelStatus, DefeatReason } from "../../../domain/level/LevelResult";
import type { GamePhase } from "../../../domain/state/GamePhase";
import type {
  GamePhaseDto,
  GameResultDto,
  LevelStatusDto,
  DefeatReasonDto,
  GameSnapshotDto
} from "./GameSnapshotDto";
import type { GameSession } from "./GameSession";

/**
 * Domain → snapshot DTO translation point.
 *
 * The domain lifecycle/result value objects carry the same serialized string
 * values as the boundary DTO literals, so each converter is a typed pass-through
 * that re-labels a domain union as the application-owned DTO union. Keeping the
 * conversion here means `GameSnapshotDto.ts` (which presentation imports) never
 * touches domain code.
 */
export function toGamePhaseDto(phase: GamePhase): GamePhaseDto {
  return phase;
}

export function toLevelStatusDto(status: LevelStatus): LevelStatusDto {
  return status;
}

export function toDefeatReasonDto(reason: DefeatReason): DefeatReasonDto {
  return reason;
}

function mapResult(result: LevelResult): GameResultDto {
  if (result.reason === undefined) {
    return { status: toLevelStatusDto(result.status) };
  }
  return { status: toLevelStatusDto(result.status), reason: toDefeatReasonDto(result.reason) };
}

export function mapGameSnapshot(session: GameSession): GameSnapshotDto {
  const context = session.requireContext();
  const level = context.requireLevel();
  const history = session.requireHistory();

  return {
    phase: toGamePhaseDto(context.phase),
    result: mapResult(context.result),
    arrowsRemaining: level.activeArrowCount,
    attemptsRemaining: level.attemptsRemaining,
    canUndo: history.canUndo,
    elapsedMs: session.elapsedMs(),
    movesCount: session.movesCount()
  };
}
