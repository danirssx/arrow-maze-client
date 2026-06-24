/**
 * Boundary DTO literal for a level's difficulty.
 *
 * The catalog port and presentation consume this plain literal instead of the
 * domain `Difficulty` value object, so a ViewModel never imports `@/domain`. The
 * serialized values mirror the domain ones exactly (the wire/backend contract is
 * unchanged); `LevelCatalogMapper` is the single point that re-labels the wire
 * string as a `DifficultyDto`.
 */
export const DifficultyDto = {
  Easy: "EASY",
  Medium: "MEDIUM",
  Hard: "HARD"
} as const;

// eslint-disable-next-line @typescript-eslint/no-redeclare
export type DifficultyDto = (typeof DifficultyDto)[keyof typeof DifficultyDto];
