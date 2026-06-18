import type { IObservable } from "../../domain/observer";
import { Position } from "../../domain/value-objects/Position";
import type { BoardSnapshotDto } from "../dto/BoardSnapshotDto";
import { mapBoardSnapshot } from "../dto/BoardSnapshotMapper";
import { GameEventBridge } from "../dto/GameEventBridge";
import type { IGameEventListener } from "../dto/IGameEventListener";
import type { GameEventDto } from "../dto/GameEventDto";
import { ConcreteLevelBuilder } from "../level-build/ConcreteLevelBuilder";
import type { ILevelStrategy } from "../level-build/ILevelStrategy";
import type { LevelDefinition } from "../level-build/LevelDefinition";
import { LevelDirector } from "../level-build/LevelDirector";
import type { GameSnapshotDto, PositionDto } from "../use-cases/game/GameSnapshotDto";
import { GameSession } from "../use-cases/game/GameSession";
import { mapGameSnapshot } from "../use-cases/game/GameSnapshotMapper";
import { PauseGameUseCase } from "../use-cases/game/PauseGameUseCase";
import { PlayTurnUseCase } from "../use-cases/game/PlayTurnUseCase";
import { ResumeGameUseCase } from "../use-cases/game/ResumeGameUseCase";
import { StartLevelUseCase } from "../use-cases/game/StartLevelUseCase";
import { UndoLastMoveUseCase } from "../use-cases/game/UndoLastMoveUseCase";
import { GameplayStateError } from "../use-cases/game/errors";

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
 *
 * Observer bridge / MVVM boundary: presentation subscribes with an
 * `IGameEventListener` and receives UI-neutral `GameEventDto`s plus
 * `BoardSnapshotDto`/`GameSnapshotDto`, so a ViewModel never touches `BoardGraph`
 * or concrete domain classes. The facade owns a single `GameEventBridge` that it
 * (re)registers on each new level and fans out to all listeners.
 */
export class GameFacade {
  private readonly session: GameSession;
  private readonly startLevelUseCase: StartLevelUseCase;
  private readonly playTurnUseCase: PlayTurnUseCase;
  private readonly undoLastMoveUseCase: UndoLastMoveUseCase;
  private readonly pauseGameUseCase: PauseGameUseCase;
  private readonly resumeGameUseCase: ResumeGameUseCase;

  private readonly eventListeners = new Set<IGameEventListener>();
  private readonly bridge = new GameEventBridge({ onGameEvent: (event) => this.dispatch(event) });
  private subject: IObservable | undefined;
  private currentDefinition: LevelDefinition | undefined;

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

  /** Observer bridge: subscribe a presentation listener to UI-neutral game events. */
  addEventListener(listener: IGameEventListener): void {
    this.eventListeners.add(listener);
  }

  /** Observer bridge: remove a previously subscribed presentation listener. */
  removeEventListener(listener: IGameEventListener): void {
    this.eventListeners.delete(listener);
  }

  /** UI-neutral static board layout for rendering; requires an active level. */
  getBoardSnapshot(): BoardSnapshotDto {
    if (this.currentDefinition === undefined) {
      throw new GameplayStateError("Cannot read the board snapshot before a level is started.");
    }
    return mapBoardSnapshot(this.currentDefinition);
  }

  startLevel(strategy: ILevelStrategy): GameSnapshotDto {
    const definition = strategy.createDefinition();
    const snapshot = this.startLevelUseCase.execute(this.session, { createDefinition: () => definition });
    this.currentDefinition = definition;
    this.attachBridgeToCurrentLevel();
    return snapshot;
  }

  restartLevel(): GameSnapshotDto {
    const snapshot = this.startLevelUseCase.execute(this.session, this.session.requireStrategy());
    this.attachBridgeToCurrentLevel();
    return snapshot;
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

  private dispatch(event: GameEventDto): void {
    for (const listener of [...this.eventListeners]) {
      listener.onGameEvent(event);
    }
  }

  private attachBridgeToCurrentLevel(): void {
    const level = this.session.requireContext().level;
    if (this.subject !== undefined) {
      this.subject.unregister(this.bridge);
    }
    if (level !== undefined) {
      level.register(this.bridge);
      this.subject = level;
    }
  }
}
