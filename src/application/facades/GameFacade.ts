import type { IObservable } from "../../domain/observer";
import { GameEventBridge } from "../dto/GameEventBridge";
import type { GameEventDto } from "../dto/GameEventDto";
import type { IGameEventListener } from "../dto/IGameEventListener";
import { mapBoardSnapshot } from "../dto/BoardSnapshotMapper";
import type { BoardSnapshotDto } from "../dto/BoardSnapshotDto";
import type { ILevelStrategy } from "../level-build/ILevelStrategy";
import type { LevelDefinition } from "../level-build/LevelDefinition";
import type { GameSnapshotDto } from "../use-cases/game/GameSnapshotDto";
import type { LevelOutcomeDto } from "../use-cases/game/LevelOutcomeDto";
import type { GameSession } from "../use-cases/game/GameSession";
import { mapGameSnapshot } from "../use-cases/game/GameSnapshotMapper";
import { GameplayStateError } from "../use-cases/game/errors";
import type { PauseGameUseCase } from "../use-cases/game/PauseGameUseCase";
import type { ResolveLevelOutcomeUseCase } from "../use-cases/game/ResolveLevelOutcomeUseCase";
import type { ResumeGameUseCase } from "../use-cases/game/ResumeGameUseCase";
import type { StartLevelUseCase } from "../use-cases/game/StartLevelUseCase";
import type { TapArrowUseCase } from "../use-cases/game/TapArrowUseCase";
import type { UndoLastMoveUseCase } from "../use-cases/game/UndoLastMoveUseCase";

export type GameFacadeDependencies = {
  session: GameSession;
  startLevel: StartLevelUseCase;
  tapArrow: TapArrowUseCase;
  undoLastMove: UndoLastMoveUseCase;
  pauseGame: PauseGameUseCase;
  resumeGame: ResumeGameUseCase;
  resolveOutcome: ResolveLevelOutcomeUseCase;
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
  private readonly resolveOutcomeUseCase: ResolveLevelOutcomeUseCase;

  private readonly eventListeners = new Set<IGameEventListener>();
  private readonly bridge = new GameEventBridge({ onGameEvent: (event) => this.dispatch(event) });
  private subject: IObservable | undefined;
  private currentDefinition: LevelDefinition | undefined;

  constructor(dependencies: GameFacadeDependencies) {
    this.session = dependencies.session;
    this.startLevelUseCase = dependencies.startLevel;
    this.tapArrowUseCase = dependencies.tapArrow;
    this.undoLastMoveUseCase = dependencies.undoLastMove;
    this.pauseGameUseCase = dependencies.pauseGame;
    this.resumeGameUseCase = dependencies.resumeGame;
    this.resolveOutcomeUseCase = dependencies.resolveOutcome;
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

  /** Already-calculated result (score/time/moves) for the victory submit. */
  getLevelOutcome(): LevelOutcomeDto {
    return this.resolveOutcomeUseCase.execute(this.session);
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
