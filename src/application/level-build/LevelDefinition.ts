/* eslint-disable @typescript-eslint/no-redeclare */
import type { ArrowSpec } from "../../domain/value-objects/ArrowSpec";
import type { Difficulty } from "../../domain/value-objects/Difficulty";

/** Default attempts budget when a level definition omits one. */
export const DEFAULT_ATTEMPTS = 5;

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
 * LevelDefinition (application DTO) — untangle puzzle.
 *
 * The source-agnostic description a level strategy produces and the builder
 * consumes: the arrows that populate the unbounded board, the attempts budget,
 * which concrete level kind to build, and the time budget for timed levels. It
 * mirrors the backend level contract (id, difficulty, arrows, attempts) plus the
 * client-only kind/time fields.
 */
export type LevelDefinition = {
  readonly id: string;
  readonly difficulty: Difficulty;
  readonly arrows: readonly ArrowSpec[];
  readonly attempts?: number;
  readonly kind: LevelKind;
  readonly timeLimitSeconds?: number;
};
