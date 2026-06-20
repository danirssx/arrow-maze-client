import type { IObservable } from "../../domain/observer";
import { GameEventBridge } from "../dto/GameEventBridge";
import type { GameEventDto } from "../dto/GameEventDto";
import type { IGameEventListener } from "../dto/IGameEventListener";
import { mapBoardSnapshot } from "../dto/BoardSnapshotMapper";
import type { BoardSnapshotDto } from "../dto/BoardSnapshotDto";
import { ConcreteLevelBuilder } from "../level-build/ConcreteLevelBuilder";
import type { ILevelStrategy } from "../level-build/ILevelStrategy";
import type { LevelDefinition } from "../level-build/LevelDefinition";
import { LevelDirector } from "../level-build/LevelDirector";
import type { GameSnapshotDto } from "../use-cases/game/GameSnapshotDto";
import { GameSession } from "../use-cases/game/GameSession";
import { mapGameSnapshot } from "../use-cases/game/GameSnapshotMapper";
import { GameplayStateError } from "../use-cases/game/errors";
import { PauseGameUseCase } from "../use-cases/game/PauseGameUseCase";
import { ResumeGameUseCase } from "../use-cases/game/ResumeGameUseCase";
import { StartLevelUseCase } from "../use-cases/game/StartLevelUseCase";
import { TapArrowUseCase } from "../use-cases/game/TapArrowUseCase";
import { UndoLastMoveUseCase } from "../use-cases/game/UndoLastMoveUseCase";

type GameFacadeDependencies = {
  session?: GameSession;
  startLevel?: StartLevelUseCase;
  tapArrow?: TapArrowUseCase;
  undoLastMove?: UndoLastMoveUseCase;
  pauseGame?: PauseGameUseCase;
  resumeGame?: ResumeGameUseCase;
};

/**
 * Facade pattern — gameplay application boundary.
 *
 * Compact API for ViewModels that hides use-case wiring, `GameContext`, command
 * history, and level construction. It owns one `GameEventBridge` re-registered on
 * each level and fans domain events out to presentation listeners as UI-neutral
 * `GameEventDto`s. The static arrow layout for rendering is exposed via
 * `getBoardSnapshot()`. No React, navigation, storage, or HTTP imports.
 */
export class GameFacade {
  private readonly session: GameSession;
  private readonly startLevelUseCase: StartLevelUseCase;
  private readonly tapArrowUseCase: TapArrowUseCase;
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
    this.tapArrowUseCase = dependencies.tapArrow ?? new TapArrowUseCase();
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

  startLevel(strategy: ILevelStrategy): GameSnapshotDto {
    const definition = strategy.createDefinition();
    const snapshot = this.startLevelUseCase.execute(this.session, { createDefinition: () => definition });
    this.currentDefinition = definition;
    this.attachBridgeToCurrentLevel();
    return snapshot;
  }

  /** UI-neutral static arrow layout for rendering; requires an active level. */
  getBoardSnapshot(): BoardSnapshotDto {
    if (this.currentDefinition === undefined) {
      throw new GameplayStateError("Cannot read the board snapshot before a level is started.");
    }
    return mapBoardSnapshot(this.currentDefinition);
  }

  restartLevel(): GameSnapshotDto {
    const snapshot = this.startLevelUseCase.execute(this.session, this.session.requireStrategy());
    this.attachBridgeToCurrentLevel();
    return snapshot;
  }

  tapArrow(arrowId: string): GameSnapshotDto {
    return this.tapArrowUseCase.execute(this.session, arrowId);
  }

  undo(): GameSnapshotDto {
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
