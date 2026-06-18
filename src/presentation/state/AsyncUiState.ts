/**
 * MVVM UI state — generic async data phase.
 *
 * The four phases a data-loading screen can be in. Screens switch between the
 * `LoadingState`, `EmptyState`, `ErrorState`, and content components from this
 * single discriminated value, so loading/empty/error handling stays uniform.
 */
export const AsyncStatus = {
  Idle: "IDLE",
  Loading: "LOADING",
  Loaded: "LOADED",
  Empty: "EMPTY",
  Error: "ERROR"
} as const;

// eslint-disable-next-line @typescript-eslint/no-redeclare
export type AsyncStatus = (typeof AsyncStatus)[keyof typeof AsyncStatus];

export type AsyncUiState<TData> = {
  readonly status: AsyncStatus;
  readonly data: TData | null;
};

export function idle<TData>(): AsyncUiState<TData> {
  return { status: AsyncStatus.Idle, data: null };
}
