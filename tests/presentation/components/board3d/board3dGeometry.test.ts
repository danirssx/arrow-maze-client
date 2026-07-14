import type { ArrowDto, BoardBoundsDto } from "@/application/dto/BoardSnapshotDto";
import {
  buildArrowTubeDescriptors,
  directionVector3,
  normalizePoint3,
  volumeSize,
} from "@/presentation/components/board3d/board3dGeometry";

// Subject to human review — presentation geometry test

const bounds: BoardBoundsDto = {
  minRow: 0,
  minCol: 0,
  maxRow: 2,
  maxCol: 3,
  minZ: 0,
  maxZ: 4,
};

const arrow: ArrowDto = {
  id: "depth",
  color: "cyan",
  direction: "FORWARD",
  cells: [
    { row: 0, column: 0, z: 0 },
    { row: 0, column: 0, z: 1 },
    { row: 0, column: 0, z: 2 },
  ],
  head: { row: 0, column: 0, z: 2 },
};

describe("board3dGeometry", () => {
  it("should_center_a_board_coordinate_inside_the_volume", () => {
    expect(normalizePoint3({ row: 1, column: 2, z: 3 }, bounds)).toEqual([0.5, 0, 1]);
  });

  it("should_default_missing_z_to_the_planar_zero_slab", () => {
    expect(normalizePoint3({ row: 0, column: 0 }, bounds)).toEqual([-1.5, 1, -2]);
  });

  it("should_resolve_six_world_axis_direction_vectors", () => {
    expect(directionVector3("UP")).toEqual([0, 1, 0]);
    expect(directionVector3("DOWN")).toEqual([0, -1, 0]);
    expect(directionVector3("LEFT")).toEqual([-1, 0, 0]);
    expect(directionVector3("RIGHT")).toEqual([1, 0, 0]);
    expect(directionVector3("FORWARD")).toEqual([0, 0, 1]);
    expect(directionVector3("BACK")).toEqual([0, 0, -1]);
  });

  it("should_describe_neon_tube_arrows_from_active_dto_cells", () => {
    const descriptors = buildArrowTubeDescriptors([arrow], bounds, ["depth"]);

    expect(descriptors).toHaveLength(0);
    expect(buildArrowTubeDescriptors([arrow], bounds, [])[0]).toMatchObject({
      id: "depth",
      color: "#3FC8FF",
      direction: [0, 0, 1],
      points: [
        [-1.5, 1, -2],
        [-1.5, 1, -1],
        [-1.5, 1, 0],
      ],
    });
  });

  it("should_measure_depth_from_optional_bounds_or_the_zero_slab", () => {
    expect(volumeSize(bounds)).toEqual({ rows: 3, columns: 4, depth: 5 });
    expect(volumeSize({ minRow: 0, minCol: 0, maxRow: 0, maxCol: 0 })).toEqual({
      rows: 1,
      columns: 1,
      depth: 1,
    });
  });
});
