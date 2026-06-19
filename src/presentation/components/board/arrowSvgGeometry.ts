/**
 * Pure SVG geometry helpers for the arrow board — no React, no Reanimated.
 *
 * An arrow is a "snake" polyline through the centers of the cells it occupies.
 * To animate its extraction we build an *extended* path: the body polyline plus a
 * straight ray that leaves the head in the arrow's direction and runs off-board.
 * Sliding a body-length dash window along that extended path makes the body unspool
 * along its own curve and stream off the screen (the reference exit animation).
 *
 * Kept framework-free so it can be unit-tested in isolation.
 */

export interface Point {
  readonly x: number;
  readonly y: number;
}

export interface ArrowExtractionGeometry {
  /** `d` of the body polyline (tail → head). */
  readonly bodyPath: string;
  /** Length of the body polyline in px. */
  readonly bodyLength: number;
  /** `d` of the body polyline plus the off-board exit ray. */
  readonly totalPath: string;
  /** `bodyLength + exitLength`. */
  readonly totalLength: number;
  /** Length of the off-board exit ray in px. */
  readonly exitLength: number;
  /** Unit vector the head travels along while exiting. */
  readonly exitUnit: Point;
  /** Center of the head cell (start of the exit ray). */
  readonly headPoint: Point;
}

const RIGHT_UNIT: Point = { x: 1, y: 0 };

const DIRECTION_UNITS: Record<string, Point> = {
  UP: { x: 0, y: -1 },
  DOWN: { x: 0, y: 1 },
  LEFT: { x: -1, y: 0 },
  RIGHT: RIGHT_UNIT
};

/** Unit vector for a cardinal direction name; falls back to RIGHT when unknown. */
export function directionUnit(direction: string): Point {
  return DIRECTION_UNITS[direction] ?? RIGHT_UNIT;
}

/** Round to 3 decimals and stringify without trailing-zero noise. */
function fmt(value: number): string {
  return String(Math.round(value * 1000) / 1000);
}

/**
 * `points` for an SVG `<Polygon>` arrowhead at `center`, pointing in `direction`:
 * a tip `length` px ahead of the center and a base of `2 * halfWidth` across it.
 */
export function headTrianglePoints(
  center: Point,
  direction: string,
  length: number,
  halfWidth: number
): string {
  const dir = directionUnit(direction);
  const perp: Point = { x: -dir.y, y: dir.x };
  const tip: Point = { x: center.x + dir.x * length, y: center.y + dir.y * length };
  const baseA: Point = { x: center.x + perp.x * halfWidth, y: center.y + perp.y * halfWidth };
  const baseB: Point = { x: center.x - perp.x * halfWidth, y: center.y - perp.y * halfWidth };
  return `${fmt(tip.x)},${fmt(tip.y)} ${fmt(baseA.x)},${fmt(baseA.y)} ${fmt(baseB.x)},${fmt(baseB.y)}`;
}

/** SVG path `d` for a polyline through `points` (`M` then `L` per following point). */
export function polylinePath(points: readonly Point[]): string {
  const first = points[0];
  if (!first) return "";

  let d = `M ${fmt(first.x)} ${fmt(first.y)}`;
  for (let i = 1; i < points.length; i += 1) {
    const point = points[i];
    if (point) d += ` L ${fmt(point.x)} ${fmt(point.y)}`;
  }
  return d;
}

/** Summed segment length of a polyline through `points`. */
export function polylineLength(points: readonly Point[]): number {
  let previous = points[0];
  if (!previous) return 0;

  let total = 0;
  for (let i = 1; i < points.length; i += 1) {
    const current = points[i];
    if (!current) continue;
    total += Math.hypot(current.x - previous.x, current.y - previous.y);
    previous = current;
  }
  return total;
}

/**
 * Build the body + off-board exit-ray geometry for an arrow.
 *
 * @param points ordered cell centers, tail → head.
 * @param direction cardinal head direction.
 * @param exitClearance px the exit ray runs past the head (≥ board span so the body
 *   fully clears the clipped board from any interior cell).
 */
export function buildArrowExtraction(
  points: readonly Point[],
  direction: string,
  exitClearance: number
): ArrowExtractionGeometry {
  const bodyPath = polylinePath(points);
  const bodyLength = polylineLength(points);
  const headPoint = points[points.length - 1] ?? { x: 0, y: 0 };
  const exitUnit = directionUnit(direction);
  const exitEnd: Point = {
    x: headPoint.x + exitUnit.x * exitClearance,
    y: headPoint.y + exitUnit.y * exitClearance
  };
  const totalPath = bodyPath === "" ? "" : `${bodyPath} L ${fmt(exitEnd.x)} ${fmt(exitEnd.y)}`;

  return {
    bodyPath,
    bodyLength,
    totalPath,
    totalLength: bodyLength + exitClearance,
    exitLength: exitClearance,
    exitUnit,
    headPoint
  };
}
