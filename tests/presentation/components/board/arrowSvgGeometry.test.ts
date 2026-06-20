import {
  buildArrowExtraction,
  directionUnit,
  headTrianglePoints,
  polylineLength,
  polylinePath
} from "@/presentation/components/board/arrowSvgGeometry";

// Subject to human review — presentation geometry helper test

describe("directionUnit", () => {
  it("should_return_cardinal_unit_vectors_when_given_known_directions", () => {
    expect(directionUnit("UP")).toEqual({ x: 0, y: -1 });
    expect(directionUnit("DOWN")).toEqual({ x: 0, y: 1 });
    expect(directionUnit("LEFT")).toEqual({ x: -1, y: 0 });
    expect(directionUnit("RIGHT")).toEqual({ x: 1, y: 0 });
  });

  it("should_fall_back_to_right_when_direction_is_unknown", () => {
    expect(directionUnit("DIAGONAL")).toEqual({ x: 1, y: 0 });
  });
});

describe("polylinePath", () => {
  it("should_build_move_then_line_commands_when_given_multiple_points", () => {
    const points = [
      { x: 0, y: 0 },
      { x: 0, y: 30 },
      { x: 30, y: 30 }
    ];

    expect(polylinePath(points)).toBe("M 0 0 L 0 30 L 30 30");
  });

  it("should_emit_only_a_move_command_when_given_a_single_point", () => {
    expect(polylinePath([{ x: 17, y: 51 }])).toBe("M 17 51");
  });

  it("should_return_an_empty_string_when_given_no_points", () => {
    expect(polylinePath([])).toBe("");
  });
});

describe("polylineLength", () => {
  it("should_sum_segment_distances_when_given_an_l_shaped_path", () => {
    const points = [
      { x: 0, y: 0 },
      { x: 0, y: 30 },
      { x: 40, y: 30 }
    ];

    expect(polylineLength(points)).toBe(70);
  });

  it("should_return_zero_when_given_fewer_than_two_points", () => {
    expect(polylineLength([{ x: 5, y: 5 }])).toBe(0);
    expect(polylineLength([])).toBe(0);
  });
});

describe("buildArrowExtraction", () => {
  const lShapedBody = [
    { x: 0, y: 0 },
    { x: 0, y: 30 },
    { x: 30, y: 30 }
  ];

  it("should_extend_a_straight_exit_ray_from_the_head_in_the_arrow_direction", () => {
    const geometry = buildArrowExtraction(lShapedBody, "RIGHT", 100);

    // head is the last body point (30,30); RIGHT ray ends 100px to the right.
    expect(geometry.headPoint).toEqual({ x: 30, y: 30 });
    expect(geometry.exitUnit).toEqual({ x: 1, y: 0 });
    expect(geometry.totalPath).toBe("M 0 0 L 0 30 L 30 30 L 130 30");
  });

  it("should_make_total_length_the_body_length_plus_the_exit_clearance", () => {
    const geometry = buildArrowExtraction(lShapedBody, "UP", 100);

    expect(geometry.bodyLength).toBe(60);
    expect(geometry.exitLength).toBe(100);
    expect(geometry.totalLength).toBe(160);
  });

  it("should_keep_the_body_path_as_the_undecorated_polyline", () => {
    const geometry = buildArrowExtraction(lShapedBody, "DOWN", 100);

    expect(geometry.bodyPath).toBe("M 0 0 L 0 30 L 30 30");
    // DOWN ray drops 100px below the head (30,30) → (30,130).
    expect(geometry.totalPath).toBe("M 0 0 L 0 30 L 30 30 L 30 130");
  });
});

describe("headTrianglePoints", () => {
  it("should_point_the_tip_ahead_and_spread_the_base_across_the_center", () => {
    // RIGHT: tip 10px right of center, base 6px above/below it.
    expect(headTrianglePoints({ x: 30, y: 30 }, "RIGHT", 10, 6)).toBe("40,30 30,36 30,24");
  });

  it("should_orient_the_tip_along_the_direction_when_pointing_up", () => {
    // UP: tip 10px above center, base 6px left/right of it.
    expect(headTrianglePoints({ x: 30, y: 30 }, "UP", 10, 6)).toBe("30,20 36,30 24,30");
  });
});
