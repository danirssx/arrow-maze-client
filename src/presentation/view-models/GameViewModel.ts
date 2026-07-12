import type { GameFacade } from "@/application/facades/GameFacade";
import type { SoundEffectKey } from "@/application/ports/IAudioPlayer";
import type { GameEventDto } from "@/application/dto/GameEventDto";
import { GameEventTypeDto } from "@/application/dto/GameEventDto";
import type { IGameEventListener } from "@/application/dto/IGameEventListener";
import type { LevelDefinition } from "@/application/level-build/LevelDefinition";
import { DEFAULT_ATTEMPTS } from "@/application/level-build/LevelDefinition";
import type { GameSnapshotDto } from "@/application/use-cases/game/GameSnapshotDto";
import { GameOverlay, buildAttemptIndicators, initialGameUiState } from "@/presentation/state/GameUiState";
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
 * state and never reads a clock or scores a game. The HUD timer is fed the same
 * way: `refreshElapsedTime()` copies the session-measured `elapsedMs` from the
 * snapshot, so the displayed time freezes exactly when the session freezes it.
 */
export class GameViewModel extends ObservableViewModel<GameUiState> implements IGameEventListener {
  private extractionStack: string[] = [];
  private terminalSoundPlayed = false;

  constructor(
    private readonly facade: GameFacade,
    private readonly audio?: { playEffect(sound: SoundEffectKey): Promise<void> },
  ) {
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
    const attemptsTotal = definition.attempts ?? DEFAULT_ATTEMPTS;
    this.extractionStack = [];
    this.terminalSoundPlayed = false;
    this.setState({
      ...initialGameUiState,
      levelId,
      arrows: board.arrows,
      bounds: board.bounds,
      arrowsRemaining: snapshot.arrowsRemaining,
      attemptsRemaining: snapshot.attemptsRemaining,
      elapsedMs: snapshot.elapsedMs,
      attemptsTotal,
      attemptIndicators: buildAttemptIndicators(snapshot.attemptsRemaining, attemptsTotal),
      canUndo: snapshot.canUndo,
      overlay: GameViewModel.overlayFor(snapshot),
      showVictoryOverlay: false,
      showDefeatOverlay: false,
      ...(board.boardShape !== undefined ? { boardShape: board.boardShape } : {})
    });
  }

  /**
   * Pull the session-measured elapsed time into UI state.
   *
   * Driven by the view's timer tick. It is a no-op before a level starts (no
   * snapshot exists) and publishes nothing when the value is unchanged, so a
   * finished match stops re-rendering once the session freezes its clock.
   */
  refreshElapsedTime(): void {
    const previous = this.getState();
    if (previous.levelId === null) {
      return;
    }

    const elapsedMs = this.facade.getSnapshot().elapsedMs;
    if (elapsedMs === previous.elapsedMs) {
      return;
    }

    this.setState({ ...previous, elapsedMs });
  }

  tapArrow(arrowId: string): void {
    const previous = this.getState();
    const snapshot = this.facade.tapArrow(arrowId);
    const extracted = snapshot.arrowsRemaining < previous.arrowsRemaining;

    if (extracted) {
      this.extractionStack.push(arrowId);
      void this.audio?.playEffect("move");
    }

    const overlay = GameViewModel.overlayFor(snapshot);
    this.setState({
      ...previous,
      extractedArrowIds: extracted ? [...previous.extractedArrowIds, arrowId] : previous.extractedArrowIds,
      arrowsRemaining: snapshot.arrowsRemaining,
      attemptsRemaining: snapshot.attemptsRemaining,
      elapsedMs: snapshot.elapsedMs,
      attemptIndicators: buildAttemptIndicators(snapshot.attemptsRemaining, previous.attemptsTotal),
      canUndo: snapshot.canUndo,
      shakeArrowId: extracted ? null : arrowId,
      overlay,
      showVictoryOverlay: overlay === GameOverlay.Victory,
      showDefeatOverlay: overlay === GameOverlay.Defeat,
    });
  }

  undo(): void {
    const previous = this.getState();
    try {
      const snapshot = this.facade.undo();
      const restored = this.extractionStack.pop();
      if (restored !== undefined) {
        void this.audio?.playEffect("undo");
      }
      this.setState({
        ...previous,
        extractedArrowIds:
          restored === undefined
            ? previous.extractedArrowIds
            : previous.extractedArrowIds.filter((id) => id !== restored),
        arrowsRemaining: snapshot.arrowsRemaining,
        attemptsRemaining: snapshot.attemptsRemaining,
        elapsedMs: snapshot.elapsedMs,
        attemptIndicators: buildAttemptIndicators(snapshot.attemptsRemaining, previous.attemptsTotal),
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
    const { attemptsTotal } = this.getState();
    this.extractionStack = [];
    this.terminalSoundPlayed = false;
    this.setState({
      ...this.getState(),
      levelId,
      extractedArrowIds: [],
      arrowsRemaining: snapshot.arrowsRemaining,
      attemptsRemaining: snapshot.attemptsRemaining,
      elapsedMs: snapshot.elapsedMs,
      attemptIndicators: buildAttemptIndicators(snapshot.attemptsRemaining, attemptsTotal),
      canUndo: snapshot.canUndo,
      shakeArrowId: null,
      overlay: GameOverlay.None,
      showVictoryOverlay: false,
      showDefeatOverlay: false,
    });
  }

  /** Observer bridge listener — reacts to UI-neutral domain events. */
  onGameEvent(event: GameEventDto): void {
    if (event.type === GameEventTypeDto.LevelFinished) {
      const overlay = event.result.status === "WON" ? GameOverlay.Victory : GameOverlay.Defeat;
      this.playTerminalEffectOnce(overlay);
      this.setState({
        ...this.getState(),
        overlay,
        showVictoryOverlay: overlay === GameOverlay.Victory,
        showDefeatOverlay: overlay === GameOverlay.Defeat,
      });
      this.refreshElapsedTime();
    }
  }

  private playTerminalEffectOnce(overlay: GameOverlay): void {
    if (this.terminalSoundPlayed) return;
    if (overlay === GameOverlay.Victory) {
      this.terminalSoundPlayed = true;
      void this.audio?.playEffect("victory");
      return;
    }
    if (overlay === GameOverlay.Defeat) {
      this.terminalSoundPlayed = true;
      void this.audio?.playEffect("defeat");
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
