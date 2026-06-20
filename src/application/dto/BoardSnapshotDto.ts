/**
 * UI-neutral coordinate (plain, serializable). Used by board and event DTOs so
 * presentation never imports the domain `Position`.
 */
export type CoordinateDto = {
  readonly row: number;
  readonly column: number;
};

/**
 * UI-neutral arrow DTO for rendering: a stable id, a decorative color name, the
 * cardinal direction name (`UP`/`DOWN`/`LEFT`/`RIGHT`), the ordered cells it
 * occupies, and its head cell. Exposes no domain class.
 */
export type ArrowDto = {
  readonly id: string;
  readonly color: string;
  readonly direction: string;
  readonly cells: readonly CoordinateDto[];
  readonly head: CoordinateDto;
};

/** Axis-aligned bounds of the active arrows, for camera framing/scroll. */
export type BoardBoundsDto = {
  readonly minRow: number;
  readonly minCol: number;
  readonly maxRow: number;
  readonly maxCol: number;
};

/**
 * UI-neutral board snapshot (domain → presentation boundary).
 *
 * The static arrow layout a screen needs to draw the unbounded board — every
 * arrow plus the bounding box — without importing `BoardGroup`, `CollisionService`,
 * or any domain class. `bounds` is `null` only for an empty board.
 */
export type BoardSnapshotDto = {
  readonly arrows: readonly ArrowDto[];
  readonly bounds: BoardBoundsDto | null;
};
