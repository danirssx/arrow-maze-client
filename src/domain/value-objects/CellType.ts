/**
 * CellType value object.
 *
 * Closed set of the kinds of cells a board can contain. Modeled as a frozen
 * const map plus a union type instead of a TS `enum` to keep the value a plain
 * serializable string and avoid enum runtime quirks.
 */
export const CellType = {
  Arrow: "ARROW",
  Wall: "WALL",
  Empty: "EMPTY",
  Exit: "EXIT"
} as const;

export type CellType = (typeof CellType)[keyof typeof CellType];
