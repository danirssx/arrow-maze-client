import type { GameSnapshotDto } from "./GameSnapshotDto";
import type { GameSession } from "./GameSession";
import { mapGameSnapshot } from "./GameSnapshotMapper";

export class ResumeGameUseCase {
  execute(session: GameSession): GameSnapshotDto {
    session.requireContext().resume();
    return mapGameSnapshot(session);
  }
}
