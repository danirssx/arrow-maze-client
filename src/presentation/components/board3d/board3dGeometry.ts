import type { ArrowDto, BoardBoundsDto, CoordinateDto } from "@/application/dto/BoardSnapshotDto";

export type Point3 = readonly [number, number, number];

export type VolumeSize = {
  readonly rows: number;
  readonly columns: number;
  readonly depth: number;
};

export type ArrowTubeDescriptor = {
  readonly id: string;
  readonly color: string;
  readonly direction: Point3;
  readonly points: readonly Point3[];
};

const COLOR_HEX: Record<string, string> = {
  blue: "#4B6BFB",
  green: "#3FD06A",
  yellow: "#FFC83D",
  pink: "#FF6FD8",
  cyan: "#3FC8FF",
  purple: "#A06BFF",
  crimson: "#C23B57",
  white: "#EEF1FF",
  orange: "#FF9F1C",
  teal: "#22C9B6"
};

export function volumeSize(bounds: BoardBoundsDto): VolumeSize {
  return {
    rows: bounds.maxRow - bounds.minRow + 1,
    columns: bounds.maxCol - bounds.minCol + 1,
    depth: (bounds.maxZ ?? 0) - (bounds.minZ ?? 0) + 1
  };
}

export function normalizePoint3(point: CoordinateDto, bounds: BoardBoundsDto): Point3 {
  const minZ = bounds.minZ ?? 0;
  const centerCol = (bounds.minCol + bounds.maxCol) / 2;
  const centerRow = (bounds.minRow + bounds.maxRow) / 2;
  const centerZ = (minZ + (bounds.maxZ ?? 0)) / 2;

  return [point.column - centerCol, centerRow - point.row, (point.z ?? 0) - centerZ];
}

export function directionVector3(direction: string): Point3 {
  switch (direction) {
    case "UP":
      return [0, 1, 0];
    case "DOWN":
      return [0, -1, 0];
    case "LEFT":
      return [-1, 0, 0];
    case "RIGHT":
      return [1, 0, 0];
    case "FORWARD":
      return [0, 0, 1];
    case "BACK":
      return [0, 0, -1];
    default:
      return [0, 1, 0];
  }
}

export function hexForArrowColor(color: string): string {
  return COLOR_HEX[color] ?? "#9DA6FB";
}

export function buildArrowTubeDescriptors(
  arrows: readonly ArrowDto[],
  bounds: BoardBoundsDto,
  extractedArrowIds: readonly string[]
): ArrowTubeDescriptor[] {
  const extracted = new Set(extractedArrowIds);
  return arrows
    .filter((arrow) => !extracted.has(arrow.id))
    .map((arrow) => ({
      id: arrow.id,
      color: hexForArrowColor(arrow.color),
      direction: directionVector3(arrow.direction),
      points: arrow.cells.map((cell) => normalizePoint3(cell, bounds))
    }));
}
