import type { ArrowSpec } from "../../domain/value-objects/ArrowSpec";
import type { BuiltLevel } from "./BuiltLevel";

/**
 * Builder pattern — level builder contract.
 *
 * Assembles a playable level step by step from its parts. The fluent setters
 * return `this` so a director can chain configuration; `build()` validates the
 * accumulated parts (id, arrows, attempts, kind) and produces the `BuiltLevel`.
 */
export interface ILevelBuilder {
  reset(): this;
  withId(id: string): this;
  withArrows(arrows: readonly ArrowSpec[]): this;
  withAttempts(attempts: number): this;
  asNormal(): this;
  asTimed(limitSeconds: number): this;
  build(): BuiltLevel;
}
