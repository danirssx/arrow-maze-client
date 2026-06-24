/**
 * Boundary DTO literals for the gameplay snapshot.
 *
 * Presentation imports this file, so it must own plain, serializable literal
 * unions and depend on **no** domain code. The values mirror the domain
 * `GamePhase`/`LevelStatus`/`DefeatReason` exactly (the external contract is
 * unchanged); the domain → DTO translation lives in `GameSnapshotMapper`.
 */
export const GamePhaseDto = {
  Menu: "MENU",
  Playing: "PLAYING",
  Paused: "PAUSED",
  GameOver: "GAME_OVER",
  Victory: "VICTORY"
} as const;

// eslint-disable-next-line @typescript-eslint/no-redeclare
export type GamePhaseDto = (typeof GamePhaseDto)[keyof typeof GamePhaseDto];

export const LevelStatusDto = {
  Playing: "PLAYING",
  Won: "WON",
  Lost: "LOST"
} as const;

// eslint-disable-next-line @typescript-eslint/no-redeclare
export type LevelStatusDto = (typeof LevelStatusDto)[keyof typeof LevelStatusDto];

export const DefeatReasonDto = {
  Time: "TIME",
  OutOfAttempts: "OUT_OF_ATTEMPTS"
} as const;

// eslint-disable-next-line @typescript-eslint/no-redeclare
export type DefeatReasonDto = (typeof DefeatReasonDto)[keyof typeof DefeatReasonDto];

export type GameResultDto = {
  readonly status: LevelStatusDto;
  readonly reason?: DefeatReasonDto;
};

/**
 * UI-neutral gameplay snapshot for ViewModels: the lifecycle phase, the level
 * result, how many arrows remain, how many attempts are left, whether undo is
 * available, and the plain result metrics (elapsed play time in ms and moves
 * count) scoring/progress consume. No board geometry here — the static board
 * layout is a separate presentation concern.
 */
export type GameSnapshotDto = {
  readonly phase: GamePhaseDto;
  readonly result: GameResultDto;
  readonly arrowsRemaining: number;
  readonly attemptsRemaining: number;
  readonly canUndo: boolean;
  readonly elapsedMs: number;
  readonly movesCount: number;
};
