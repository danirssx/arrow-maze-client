import type { GameFacade } from "@/application/facades/GameFacade";
import type { IGameEventListener } from "@/application/dto/IGameEventListener";
import type { GameEventDto } from "@/application/dto/GameEventDto";
import { GameEventType } from "@/application/dto/GameEventDto";
import type { LevelDefinition } from "@/application/level-build/LevelDefinition";
import type { GameSnapshotDto, PositionDto } from "@/application/use-cases/game/GameSnapshotDto";
import { GameOverlay, initialGameUiState } from "@/presentation/state/GameUiState";
import type { GameUiState } from "@/presentation/state/GameUiState";
import { ObservableViewModel } from "./ObservableViewModel";

/**
 * MVVM — gameplay ViewModel.
 *
 * Owns the `GameUiState` the `GameScreen` renders and is the only presentation
 * object that talks to the application `GameFacade`. It subscribes to the
 * Observer bridge as an `IGameEventListener`, so when the domain emits
 * `LevelFinished` the ViewModel flips the UI overlay to victory/defeat — no
 * screen ever touches a use case, repository, or domain class.
 */
export class GameViewModel extends ObservableViewModel<GameUiState> implements IGameEventListener {
  constructor(private readonly facade: GameFacade) {
    super(initialGameUiState);
  }

  /** Subscribe to the facade event bridge. Call once when the screen mounts. */
  attach(): void {
    this.facade.addEventListener(this);
  }

  /** Unsubscribe from the facade event bridge. Call when the screen unmounts. */
  dispose(): void {
    this.facade.removeEventListener(this);
  }

  startLevel(levelId: string, definition: LevelDefinition): void {
    const snapshot = this.facade.startLevel({ createDefinition: () => definition });
    const board = this.facade.getBoardSnapshot();
    this.setState({
      ...initialGameUiState,
      levelId,
      rows: board.rows,
      cols: board.cols,
      cells: board.cells,
      start: board.start,
      exit: board.exit,
      playerPosition: snapshot.position,
      moves: snapshot.moves,
      optimalMoves: snapshot.optimalMoves,
      canUndo: snapshot.canUndo,
      overlay: GameOverlay.None
    });
  }

  playTurn(destination: PositionDto): void {
    try {
      const snapshot = this.facade.playTurn(destination);
      this.applySnapshot(snapshot, null);
    } catch {
      this.setState({ ...this.getState(), invalidMoveAt: destination });
    }
  }

  undo(): void {
    try {
      const snapshot = this.facade.undoMove();
      this.applySnapshot(snapshot, null);
    } catch {
      // Nothing to undo — keep current state silently.
    }
  }

  restart(): void {
    const levelId = this.getState().levelId;
    const snapshot = this.facade.restartLevel();
    this.setState({
      ...this.getState(),
      levelId,
      playerPosition: snapshot.position,
      moves: snapshot.moves,
      optimalMoves: snapshot.optimalMoves,
      canUndo: snapshot.canUndo,
      overlay: GameOverlay.None,
      invalidMoveAt: null
    });
  }

  /** Observer bridge listener — reacts to UI-neutral domain events. */
  onGameEvent(event: GameEventDto): void {
    if (event.type === GameEventType.LevelFinished) {
      const overlay =
        event.result.status === "WON" ? GameOverlay.Victory : GameOverlay.Defeat;
      this.setState({ ...this.getState(), overlay, invalidMoveAt: null });
    }
  }

  private applySnapshot(snapshot: GameSnapshotDto, invalidMoveAt: PositionDto | null): void {
    this.setState({
      ...this.getState(),
      playerPosition: snapshot.position,
      moves: snapshot.moves,
      optimalMoves: snapshot.optimalMoves,
      canUndo: snapshot.canUndo,
      invalidMoveAt
    });
  }
}
