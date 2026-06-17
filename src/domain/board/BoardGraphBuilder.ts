import { Direction } from "../value-objects/Direction";
import { Position } from "../value-objects/Position";
import type { BoardGroup } from "./BoardGroup";
import { BoardGraph } from "./BoardGraph";
import type { ICell } from "./ICell";

/**
 * Graph Model/Pathfinding pattern — directed graph builder.
 *
 * Translates Composite board cells into a directed movement graph. Walls are
 * excluded, arrows point only in their own direction, empty cells move to any
 * navigable cardinal neighbor, and exits are terminal nodes.
 */
export class BoardGraphBuilder {
  build(board: BoardGroup, rows: number, cols: number): BoardGraph {
    const graph = new BoardGraph();
    const navigable = board.toCells().filter((cell) => !cell.isBlocking());

    for (const cell of navigable) {
      graph.addNode(cell.position);
    }

    for (const cell of navigable) {
      for (const target of this.outgoingTargets(cell, graph, rows, cols)) {
        graph.addEdge(cell.position, target);
      }
    }

    return graph;
  }

  private outgoingTargets(cell: ICell, graph: BoardGraph, rows: number, cols: number): readonly Position[] {
    if (cell.isExit()) {
      return [];
    }

    const directions = cell.direction === undefined ? Direction.all() : [cell.direction];
    return directions
      .map((direction) => this.translateWithinBounds(cell.position, direction, rows, cols))
      .filter((position): position is Position => position !== undefined && graph.hasNode(position));
  }

  private translateWithinBounds(
    position: Position,
    direction: Direction,
    rows: number,
    cols: number
  ): Position | undefined {
    const row = position.row + direction.rowDelta;
    const col = position.col + direction.colDelta;
    if (row < 0 || col < 0 || row >= rows || col >= cols) {
      return undefined;
    }
    return Position.of(row, col);
  }
}
