import type { LevelTemplate } from "../../domain/value-objects/LevelTemplate";
import type { Position } from "../../domain/value-objects/Position";
import type { BuiltLevel } from "./BuiltLevel";

/**
 * Builder pattern — level builder contract.
 *
 * Assembles a playable level step by step from its parts. The fluent setters
 * return `this` so a director can chain configuration; `build()` validates the
 * accumulated parts (board, graph, solvability) and produces the `BuiltLevel`.
 */
export interface ILevelBuilder {
  reset(): this;
  useTemplate(template: LevelTemplate): this;
  startingAt(start: Position): this;
  asNormal(): this;
  asTimed(limitSeconds: number): this;
  build(): BuiltLevel;
}
