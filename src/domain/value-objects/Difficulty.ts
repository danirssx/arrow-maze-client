/**
 * Difficulty value object.
 *
 * Closed set of level difficulties. Modeled as a frozen const map plus a union
 * type so the value stays a plain serializable string shared with the backend
 * level catalog.
 */
export const Difficulty = {
  Easy: "EASY",
  Medium: "MEDIUM",
  Hard: "HARD"
} as const;

export type Difficulty = (typeof Difficulty)[keyof typeof Difficulty];
