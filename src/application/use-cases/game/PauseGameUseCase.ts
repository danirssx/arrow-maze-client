import type { GameSnapshotDto } from "./GameSnapshotDto";
import type { GameSession } from "./GameSession";
import { mapGameSnapshot } from "./GameSnapshotMapper";

export class PauseGameUseCase {
  execute(session: GameSession): GameSnapshotDto {
    session.requireContext().pause();
    return mapGameSnapshot(session);
  }
}
