/**
 * Pure presentation formatter — elapsed match time as `mm:ss`.
 *
 * Framework-free so it can be unit-tested without a renderer. Minutes are never
 * wrapped at 59 (a long match reads `61:07`) because the game has no hour
 * boundary and a wrapped timer would misreport the elapsed time. Partial seconds
 * are truncated, and any value that is negative or not finite renders `00:00`.
 */
export function formatElapsedTime(elapsedMs: number): string {
  const safeMs = Number.isFinite(elapsedMs) ? Math.max(0, elapsedMs) : 0;
  const totalSeconds = Math.floor(safeMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${pad(minutes)}:${pad(seconds)}`;
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}
