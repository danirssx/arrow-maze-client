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
 * (arrows + attempts remaining), undo availability, the win/defeat overlay, and
 * the id of the last blocked tap (for shake feedback). It holds no domain class.
 */
export type GameUiState = {
  readonly levelId: string | null;
  readonly arrows: readonly ArrowDto[];
  readonly extractedArrowIds: readonly string[];
  readonly bounds: BoardBoundsDto | null;
  readonly arrowsRemaining: number;
  readonly attemptsRemaining: number;
  readonly canUndo: boolean;
  readonly overlay: GameOverlay;
  readonly shakeArrowId: string | null;
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
  canUndo: false,
  overlay: GameOverlay.None,
  shakeArrowId: null
};
