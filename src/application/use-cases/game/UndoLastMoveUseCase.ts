import type { GameSnapshotDto } from "./GameSnapshotDto";
import type { GameSession } from "./GameSession";
import { mapGameSnapshot } from "./GameSnapshotMapper";

export class UndoLastMoveUseCase {
  execute(session: GameSession): GameSnapshotDto {
    session.requireHistory().undoLast();
    return mapGameSnapshot(session);
  }
}
