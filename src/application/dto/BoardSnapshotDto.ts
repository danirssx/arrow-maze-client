import type { PositionDto } from "../use-cases/game/GameSnapshotDto";

/**
 * UI-neutral arrow DTO.
 *
 * Plain, serializable description of one Arrow Untangle piece for rendering.
 * It exposes no domain entity instance and is safe for presentation/ViewModels.
 */
export type BoardArrowDto = {
  readonly id: string;
  readonly color: string;
  readonly path: readonly PositionDto[];
  readonly direction: string;
};

export type BoardBoundingBoxDto = {
  readonly minRow: number;
  readonly maxRow: number;
  readonly minColumn: number;
  readonly maxColumn: number;
};

/**
 * UI-neutral board snapshot (domain → presentation boundary).
 *
 * The full static arrow layout a screen needs to draw the unbounded canvas:
 * arrows, derived bounds, and attempts budget. There is no player/start/exit.
 */
export type BoardSnapshotDto = {
  readonly levelId: string;
  readonly arrows: readonly BoardArrowDto[];
  readonly boundingBox: BoardBoundingBoxDto;
  readonly attempts: number;
};
