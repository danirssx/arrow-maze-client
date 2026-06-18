import type { ILevelStrategy } from "../../level-build/ILevelStrategy";
import type { LevelDirector } from "../../level-build/LevelDirector";
import type { GameSnapshotDto } from "./GameSnapshotDto";
import type { GameSession } from "./GameSession";
import { mapGameSnapshot } from "./GameSnapshotMapper";

export class StartLevelUseCase {
  constructor(private readonly director: LevelDirector) {}

  execute(session: GameSession, strategy: ILevelStrategy): GameSnapshotDto {
    const built = this.director.construct(strategy);
    session.start(built, strategy);
    return mapGameSnapshot(session);
  }
}
