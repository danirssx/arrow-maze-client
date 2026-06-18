import {
  ArrowCell,
  BoardGraph,
  BoardGraphBuilder,
  BoardGroup,
  EmptyCell,
  ExitCell,
  PathfindingService,
  PositionNotInGraphError,
  WallCell
} from "@/domain/board";
import { Direction } from "@/domain/value-objects/Direction";
import { Position } from "@/domain/value-objects/Position";

function buildSolvableBoard(): BoardGroup {
  return new BoardGroup([
    new ArrowCell(Position.of(0, 0), Direction.Right),
    new EmptyCell(Position.of(0, 1)),
    new WallCell(Position.of(1, 1)),
    new EmptyCell(Position.of(0, 2)),
    new ExitCell(Position.of(1, 2))
  ]);
}

describe("BoardGraphBuilder", () => {
  it("should_create_nodes_only_for_navigable_cells_when_board_contains_walls", () => {
    const graph = new BoardGraphBuilder().build(buildSolvableBoard(), 2, 3);

    expect(graph.nodeCount).toBe(4);
    expect(graph.hasNode(Position.of(1, 1))).toBe(false);
  });

  it("should_create_directed_edge_when_arrow_points_to_navigable_neighbor", () => {
    const graph = new BoardGraphBuilder().build(buildSolvableBoard(), 2, 3);

    expect(graph.canMove(Position.of(0, 0), Position.of(0, 1))).toBe(true);
    expect(graph.canMove(Position.of(0, 0), Position.of(1, 0))).toBe(false);
  });

  it("should_not_create_edge_when_target_is_wall_or_outside_board", () => {
    const board = new BoardGroup([
      new ArrowCell(Position.of(0, 0), Direction.Left),
      new EmptyCell(Position.of(0, 1)),
      new ArrowCell(Position.of(1, 0), Direction.Right),
      new WallCell(Position.of(1, 1))
    ]);

    const graph = new BoardGraphBuilder().build(board, 2, 2);

    expect(graph.canMove(Position.of(0, 0), Position.of(0, 1))).toBe(false);
    expect(graph.canMove(Position.of(1, 0), Position.of(1, 1))).toBe(false);
  });

  it("should_create_cardinal_edges_when_empty_cell_has_navigable_neighbors", () => {
    const graph = new BoardGraphBuilder().build(buildSolvableBoard(), 2, 3);

    expect(graph.canMove(Position.of(0, 1), Position.of(0, 0))).toBe(true);
    expect(graph.canMove(Position.of(0, 1), Position.of(0, 2))).toBe(true);
    expect(graph.canMove(Position.of(0, 1), Position.of(1, 1))).toBe(false);
  });

  it("should_keep_exit_terminal_when_exit_has_neighbors", () => {
    const graph = new BoardGraphBuilder().build(buildSolvableBoard(), 2, 3);

    expect(graph.neighborsOf(Position.of(1, 2))).toEqual([]);
  });
});

describe("BoardGraph", () => {
  it("should_fail_in_controlled_way_when_edge_uses_unknown_node", () => {
    const graph = new BoardGraph().addNode(Position.of(0, 0));

    expect(() => graph.addEdge(Position.of(0, 0), Position.of(0, 1))).toThrow(PositionNotInGraphError);
  });

  it("should_fail_in_controlled_way_when_edge_starts_from_unknown_node", () => {
    const graph = new BoardGraph().addNode(Position.of(0, 1));

    expect(() => graph.addEdge(Position.of(0, 0), Position.of(0, 1))).toThrow(PositionNotInGraphError);
  });

  it("should_ignore_duplicate_nodes_and_edges_when_graph_is_built_incrementally", () => {
    const graph = new BoardGraph()
      .addNode(Position.of(0, 0))
      .addNode(Position.of(0, 0))
      .addNode(Position.of(0, 1))
      .addEdge(Position.of(0, 0), Position.of(0, 1))
      .addEdge(Position.of(0, 0), Position.of(0, 1));

    expect(graph.nodeCount).toBe(2);
    expect(graph.edgeCount).toBe(1);
  });

  it("should_return_defensive_neighbor_copy_when_neighbors_are_requested", () => {
    const graph = new BoardGraph()
      .addNode(Position.of(0, 0))
      .addNode(Position.of(0, 1))
      .addNode(Position.of(0, 2))
      .addEdge(Position.of(0, 0), Position.of(0, 1));
    const neighbors = graph.neighborsOf(Position.of(0, 0)) as Position[];

    neighbors.push(Position.of(0, 2));

    expect(graph.canMove(Position.of(0, 0), Position.of(0, 2))).toBe(false);
    expect(graph.edgeCount).toBe(1);
  });

  it("should_return_empty_neighbors_when_position_is_not_part_of_graph", () => {
    const graph = new BoardGraph().addNode(Position.of(0, 0));

    expect(graph.neighborsOf(Position.of(1, 1))).toEqual([]);
  });
});

describe("PathfindingService", () => {
  it("should_return_true_and_optimal_moves_when_start_can_reach_exit", () => {
    const graph = new BoardGraphBuilder().build(buildSolvableBoard(), 2, 3);
    const service = new PathfindingService();

    expect(service.existsPath(graph, Position.of(0, 0), Position.of(1, 2))).toBe(true);
    expect(service.calculateOptimalMoves(graph, Position.of(0, 0), Position.of(1, 2))).toBe(3);
  });

  it("should_return_undefined_when_exit_is_unreachable_from_start", () => {
    const board = new BoardGroup([
      new ArrowCell(Position.of(0, 0), Direction.Right),
      new WallCell(Position.of(0, 1)),
      new ExitCell(Position.of(1, 1))
    ]);
    const graph = new BoardGraphBuilder().build(board, 2, 2);
    const service = new PathfindingService();

    expect(service.existsPath(graph, Position.of(0, 0), Position.of(1, 1))).toBe(false);
    expect(service.calculateOptimalMoves(graph, Position.of(0, 0), Position.of(1, 1))).toBeUndefined();
  });

  it("should_return_zero_optimal_moves_when_start_is_already_exit", () => {
    const graph = new BoardGraph().addNode(Position.of(0, 0));
    const service = new PathfindingService();

    expect(service.existsPath(graph, Position.of(0, 0), Position.of(0, 0))).toBe(true);
    expect(service.shortestPath(graph, Position.of(0, 0), Position.of(0, 0))).toEqual([Position.of(0, 0)]);
    expect(service.calculateOptimalMoves(graph, Position.of(0, 0), Position.of(0, 0))).toBe(0);
  });

  it("should_return_undefined_when_start_or_exit_is_missing_from_graph", () => {
    const graph = new BoardGraph().addNode(Position.of(0, 0));
    const service = new PathfindingService();

    expect(service.shortestPath(graph, Position.of(9, 9), Position.of(0, 0))).toBeUndefined();
    expect(service.shortestPath(graph, Position.of(0, 0), Position.of(9, 9))).toBeUndefined();
  });
});
