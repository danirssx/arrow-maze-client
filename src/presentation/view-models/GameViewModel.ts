import type { GameFacade } from "@/application/facades/GameFacade";
import type { GameEventDto } from "@/application/dto/GameEventDto";
import { GameEventType } from "@/application/dto/GameEventDto";
import type { IGameEventListener } from "@/application/dto/IGameEventListener";
import type { LevelDefinition } from "@/application/level-build/LevelDefinition";
import type { GameSnapshotDto } from "@/application/use-cases/game/GameSnapshotDto";
import { GameOverlay, initialGameUiState } from "@/presentation/state/GameUiState";
import type { GameUiState } from "@/presentation/state/GameUiState";
import { ObservableViewModel } from "./ObservableViewModel";

/**
 * MVVM — gameplay ViewModel (arrow untangle).
 *
 * Owns the `GameUiState` the `GameScreen` renders and is the only presentation
 * object that talks to the application `GameFacade`. It is snapshot-driven: each
 * action calls the facade and reflects the returned `GameSnapshotDto`. A tap that
 * lowers `arrowsRemaining` extracted an arrow (tracked on a LIFO stack only to map
 * the extracted-arrow UI list on undo); an unchanged count was a blocked tap
 * (flagged for shake feedback). No screen ever touches a use case, repository, or
 * domain class. Result metrics (elapsed time, moves, score) are measured and
 * computed in the application layer — the ViewModel only maps snapshots to UI
 * state and never reads a clock or scores a game.
 */
export class GameViewModel extends ObservableViewModel<GameUiState> implements IGameEventListener {
  private extractionStack: string[] = [];

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
    this.extractionStack = [];
    this.setState({
      ...initialGameUiState,
      levelId,
      arrows: board.arrows,
      bounds: board.bounds,
      arrowsRemaining: snapshot.arrowsRemaining,
      attemptsRemaining: snapshot.attemptsRemaining,
      canUndo: snapshot.canUndo,
      overlay: GameViewModel.overlayFor(snapshot),
      ...(board.boardShape !== undefined ? { boardShape: board.boardShape } : {})
    });
  }

  tapArrow(arrowId: string): void {
    const previous = this.getState();
    const snapshot = this.facade.tapArrow(arrowId);
    const extracted = snapshot.arrowsRemaining < previous.arrowsRemaining;

    if (extracted) {
      this.extractionStack.push(arrowId);
    }

    const overlay = GameViewModel.overlayFor(snapshot);
    this.setState({
      ...previous,
      extractedArrowIds: extracted ? [...previous.extractedArrowIds, arrowId] : previous.extractedArrowIds,
      arrowsRemaining: snapshot.arrowsRemaining,
      attemptsRemaining: snapshot.attemptsRemaining,
      canUndo: snapshot.canUndo,
      shakeArrowId: extracted ? null : arrowId,
      overlay
    });
  }

  undo(): void {
    const previous = this.getState();
    try {
      const snapshot = this.facade.undo();
      const restored = this.extractionStack.pop();
      this.setState({
        ...previous,
        extractedArrowIds:
          restored === undefined
            ? previous.extractedArrowIds
            : previous.extractedArrowIds.filter((id) => id !== restored),
        arrowsRemaining: snapshot.arrowsRemaining,
        attemptsRemaining: snapshot.attemptsRemaining,
        canUndo: snapshot.canUndo,
        shakeArrowId: null,
        overlay: GameViewModel.overlayFor(snapshot)
      });
    } catch {
      // Nothing to undo — keep current state silently.
    }
  }

  restart(): void {
    const levelId = this.getState().levelId;
    const snapshot = this.facade.restartLevel();
    this.extractionStack = [];
    this.setState({
      ...this.getState(),
      levelId,
      extractedArrowIds: [],
      arrowsRemaining: snapshot.arrowsRemaining,
      attemptsRemaining: snapshot.attemptsRemaining,
      canUndo: snapshot.canUndo,
      shakeArrowId: null,
      overlay: GameOverlay.None
    });
  }

  /** Observer bridge listener — reacts to UI-neutral domain events. */
  onGameEvent(event: GameEventDto): void {
    if (event.type === GameEventType.LevelFinished) {
      const overlay = event.result.status === "WON" ? GameOverlay.Victory : GameOverlay.Defeat;
      this.setState({ ...this.getState(), overlay });
    }
  }

  private static overlayFor(snapshot: GameSnapshotDto): GameOverlay {
    if (snapshot.result.status === "WON") {
      return GameOverlay.Victory;
    }
    if (snapshot.result.status === "LOST") {
      return GameOverlay.Defeat;
    }
    return GameOverlay.None;
  }
}
