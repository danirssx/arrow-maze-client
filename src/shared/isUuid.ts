const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * True only for a canonical v4 UUID string. Used to guard the leaderboard and
 * progress network calls: the backend requires a v4 UUID `levelId` and returns
 * 422 otherwise, so a slug fallback id must never reach those requests.
 */
export function isUuid(value: string): boolean {
  return UUID_V4.test(value);
}
