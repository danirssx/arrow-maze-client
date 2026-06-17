/**
 * Clock port (domain-pure time source).
 *
 * A function that returns the current time in epoch milliseconds. Levels depend
 * on this abstraction instead of reading `Date.now` directly so timed rules stay
 * deterministic under test and the domain never couples to a device clock.
 */
export type Clock = () => number;

/** Default real-time clock used when no deterministic clock is injected. */
export const systemClock: Clock = () => Date.now();
