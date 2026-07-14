import type { ArrowDto, BoardBoundsDto, CoordinateDto } from "@/application/dto/BoardSnapshotDto";

/**
 * MVVM UI state — pure presentation overlay phase.
 *
 * Closed set describing which gameplay overlay a screen should render. Derived by
 * the ViewModel from gameplay snapshots; it is not domain state.
 */
export const GameOverlay = {
  None: "NONE",
  Victory: "VICTORY",
  Defeat: "DEFEAT"
} as const;

// eslint-disable-next-line @typescript-eslint/no-redeclare
export type GameOverlay = (typeof GameOverlay)[keyof typeof GameOverlay];

/**
 * MVVM UI state for the gameplay screen (arrow untangle).
 *
 * A plain, serializable snapshot the `GameScreen` binds to: the static arrow
 * layout, which arrows have been extracted, the camera bounds, the HUD counters
 * (arrows + attempts remaining), the elapsed match time the HUD timer renders,
 * undo availability, the win/defeat overlay, and the id of the last blocked tap
 * (for shake feedback). It holds no domain class.
 *
 * Derived ready-to-render fields:
 * - `attemptIndicators` — one boolean per total attempt slot (true = remaining);
 *   the view maps directly to heart glyphs without computing anything.
 * - `showVictoryOverlay` / `showDefeatOverlay` — eliminates `overlay ===` checks
 *   from the view.
 */
export type GameUiState = {
  readonly levelId: string | null;
  readonly arrows: readonly ArrowDto[];
  readonly extractedArrowIds: readonly string[];
  readonly bounds: BoardBoundsDto | null;
  readonly arrowsRemaining: number;
  readonly attemptsRemaining: number;
  /** Measured by the application session, mirrored here only for display. */
  readonly elapsedMs: number;
  readonly attemptsTotal: number;
  readonly attemptIndicators: readonly boolean[];
  readonly canUndo: boolean;
  readonly overlay: GameOverlay;
  readonly showVictoryOverlay: boolean;
  readonly showDefeatOverlay: boolean;
  readonly shakeArrowId: string | null;
  /** 2 = flat SVG board, 3 = volumetric 3-D board. Drives renderer selection in BoardRenderer. */
  readonly dimensions: 2 | 3;
  /** Option A mask cells the board renders as its dotted background (undefined = rectangular fallback). */
  readonly boardShape?: readonly CoordinateDto[];
};

export const initialGameUiState: GameUiState = {
  levelId: null,
  arrows: [],
  extractedArrowIds: [],
  bounds: null,
  arrowsRemaining: 0,
  attemptsRemaining: 0,
  elapsedMs: 0,
  attemptsTotal: 0,
  attemptIndicators: [],
  canUndo: false,
  overlay: GameOverlay.None,
  showVictoryOverlay: false,
  showDefeatOverlay: false,
  shakeArrowId: null,
  dimensions: 2
};

export function buildAttemptIndicators(remaining: number, total: number): readonly boolean[] {
  return Array.from({ length: total }, (_, i) => i < remaining);
}
