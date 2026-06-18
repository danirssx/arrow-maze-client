/* eslint-disable @typescript-eslint/no-redeclare */
import type { LevelTemplate } from "../../domain/value-objects/LevelTemplate";
import type { Position } from "../../domain/value-objects/Position";

/**
 * LevelKind value object.
 *
 * Closed set of the concrete level types the director can build. Modeled as a
 * frozen const map plus a union type so the value is a plain serializable string
 * shared with JSON/API level sources.
 */
export const LevelKind = {
  Normal: "NORMAL",
  Timed: "TIMED"
} as const;

export type LevelKind = (typeof LevelKind)[keyof typeof LevelKind];

/**
 * LevelDefinition (application DTO).
 *
 * The source-agnostic description a level strategy produces and the builder
 * consumes: the validated domain `LevelTemplate`, the player's start position,
 * which concrete level kind to build, and the time budget for timed levels.
 */
export type LevelDefinition = {
  readonly template: LevelTemplate;
  readonly start: Position;
  readonly kind: LevelKind;
  readonly timeLimitSeconds?: number;
};
