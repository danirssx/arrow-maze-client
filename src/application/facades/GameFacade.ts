import { Position } from "../../domain/value-objects/Position";
import { ConcreteLevelBuilder } from "../level-build/ConcreteLevelBuilder";
import type { ILevelStrategy } from "../level-build/ILevelStrategy";
import { LevelDirector } from "../level-build/LevelDirector";
import type { GameSnapshotDto, PositionDto } from "../use-cases/game/GameSnapshotDto";
import { GameSession } from "../use-cases/game/GameSession";
import { mapGameSnapshot } from "../use-cases/game/GameSnapshotMapper";
import { PauseGameUseCase } from "../use-cases/game/PauseGameUseCase";
import { PlayTurnUseCase } from "../use-cases/game/PlayTurnUseCase";
import { ResumeGameUseCase } from "../use-cases/game/ResumeGameUseCase";
import { StartLevelUseCase } from "../use-cases/game/StartLevelUseCase";
import { UndoLastMoveUseCase } from "../use-cases/game/UndoLastMoveUseCase";

type GameFacadeDependencies = {
  session?: GameSession;
  startLevel?: StartLevelUseCase;
  playTurn?: PlayTurnUseCase;
  undoLastMove?: UndoLastMoveUseCase;
  pauseGame?: PauseGameUseCase;
  resumeGame?: ResumeGameUseCase;
};

/**
 * Facade pattern — gameplay application boundary.
 *
 * Provides a compact API for future ViewModels while hiding use-case wiring,
 * `GameContext`, command history, and level construction details. It does not
 * import React, navigation, storage, HTTP, or framework code.
 */
export class GameFacade {
  private readonly session: GameSession;
  private readonly startLevelUseCase: StartLevelUseCase;
  private readonly playTurnUseCase: PlayTurnUseCase;
  private readonly undoLastMoveUseCase: UndoLastMoveUseCase;
  private readonly pauseGameUseCase: PauseGameUseCase;
  private readonly resumeGameUseCase: ResumeGameUseCase;

  constructor(dependencies: GameFacadeDependencies = {}) {
    this.session = dependencies.session ?? new GameSession();
    this.startLevelUseCase =
      dependencies.startLevel ?? new StartLevelUseCase(new LevelDirector(new ConcreteLevelBuilder()));
    this.playTurnUseCase = dependencies.playTurn ?? new PlayTurnUseCase();
    this.undoLastMoveUseCase = dependencies.undoLastMove ?? new UndoLastMoveUseCase();
    this.pauseGameUseCase = dependencies.pauseGame ?? new PauseGameUseCase();
    this.resumeGameUseCase = dependencies.resumeGame ?? new ResumeGameUseCase();
  }

  static createDefault(): GameFacade {
    return new GameFacade();
  }

  startLevel(strategy: ILevelStrategy): GameSnapshotDto {
    return this.startLevelUseCase.execute(this.session, strategy);
  }

  restartLevel(): GameSnapshotDto {
    return this.startLevelUseCase.execute(this.session, this.session.requireStrategy());
  }

  playTurn(destination: PositionDto): GameSnapshotDto {
    return this.playTurnUseCase.execute(this.session, Position.of(destination.row, destination.column));
  }

  undoMove(): GameSnapshotDto {
    return this.undoLastMoveUseCase.execute(this.session);
  }

  pauseGame(): GameSnapshotDto {
    return this.pauseGameUseCase.execute(this.session);
  }

  resumeGame(): GameSnapshotDto {
    return this.resumeGameUseCase.execute(this.session);
  }

  getSnapshot(): GameSnapshotDto {
    return mapGameSnapshot(this.session);
  }
}
