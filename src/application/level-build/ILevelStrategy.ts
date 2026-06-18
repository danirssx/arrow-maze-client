import type { LevelDefinition } from "./LevelDefinition";

/**
 * Strategy pattern — level source strategy contract.
 *
 * Produces a `LevelDefinition` from some source (JSON/API payload, a built-in
 * tutorial, etc.). Strategies own parsing and structural validation; the
 * director and builder stay agnostic to where a level came from.
 */
export interface ILevelStrategy {
  createDefinition(): LevelDefinition;
}
