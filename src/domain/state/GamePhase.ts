/**
 * State pattern — domain lifecycle phase.
 *
 * Closed set of gameplay lifecycle states. This is domain state, not MVVM UI
 * state; presentation should map it later through ViewModels.
 */
export const GamePhase = {
  Menu: "MENU",
  Playing: "PLAYING",
  Paused: "PAUSED",
  GameOver: "GAME_OVER",
  Victory: "VICTORY"
} as const;

// eslint-disable-next-line @typescript-eslint/no-redeclare
export type GamePhase = (typeof GamePhase)[keyof typeof GamePhase];
