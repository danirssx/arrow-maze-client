import type { BoardCellDto } from "@/application/dto/BoardSnapshotDto";
import type { PositionDto } from "@/application/use-cases/game/GameSnapshotDto";

/**
 * MVVM UI state — pure presentation overlay phase.
 *
 * Closed set describing which gameplay overlay a screen should render. This is
 * UI state derived by the ViewModel from domain `GameEvent`s; it is not domain
 * state and never leaks back into the engine.
 */
export const GameOverlay = {
  None: "NONE",
  Victory: "VICTORY",
  Defeat: "DEFEAT"
} as const;

// eslint-disable-next-line @typescript-eslint/no-redeclare
export type GameOverlay = (typeof GameOverlay)[keyof typeof GameOverlay];

/**
 * MVVM UI state for the gameplay screen.
 *
 * A plain, serializable snapshot the `GameScreen` binds to. It carries only what
 * the view needs to draw the board, the HUD, and the victory/defeat overlay. It
 * holds no domain classes (`BoardGraph`, `LevelResult`, `Position`) — only DTOs.
 */
export type GameUiState = {
  readonly levelId: string | null;
  readonly rows: number;
  readonly cols: number;
  readonly cells: readonly BoardCellDto[];
  readonly start: PositionDto;
  readonly exit: PositionDto;
  readonly playerPosition: PositionDto | null;
  readonly moves: number;
  readonly optimalMoves: number;
  readonly canUndo: boolean;
  readonly overlay: GameOverlay;
  readonly invalidMoveAt: PositionDto | null;
};

const ORIGIN: PositionDto = { row: 0, column: 0 };

export const initialGameUiState: GameUiState = {
  levelId: null,
  rows: 0,
  cols: 0,
  cells: [],
  start: ORIGIN,
  exit: ORIGIN,
  playerPosition: null,
  moves: 0,
  optimalMoves: 0,
  canUndo: false,
  overlay: GameOverlay.None,
  invalidMoveAt: null
};
