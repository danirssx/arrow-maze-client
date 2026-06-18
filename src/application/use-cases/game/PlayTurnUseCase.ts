import { MoveCommand } from "../../../domain/command/MoveCommand";
import type { Position } from "../../../domain/value-objects/Position";
import type { GameSnapshotDto } from "./GameSnapshotDto";
import type { GameSession } from "./GameSession";
import { mapGameSnapshot } from "./GameSnapshotMapper";

export class PlayTurnUseCase {
  execute(session: GameSession, destination: Position): GameSnapshotDto {
    session.requireHistory().execute(new MoveCommand(session.requireContext(), destination));
    return mapGameSnapshot(session);
  }
}
