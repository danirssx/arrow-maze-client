import type { Position } from "../value-objects/Position";
import type { BoardGraph } from "./BoardGraph";

/**
 * Graph Model/Pathfinding pattern — shortest-path domain service.
 *
 * Performs breadth-first search over `BoardGraph`, keeping optimal-move
 * calculation deterministic and independent from UI, repositories, or device
 * APIs.
 */
export class PathfindingService {
  existsPath(graph: BoardGraph, start: Position, exit: Position): boolean {
    return this.shortestPath(graph, start, exit) !== undefined;
  }

  calculateOptimalMoves(graph: BoardGraph, start: Position, exit: Position): number | undefined {
    const path = this.shortestPath(graph, start, exit);
    if (path === undefined) {
      return undefined;
    }
    return Math.max(path.length - 1, 0);
  }

  shortestPath(graph: BoardGraph, start: Position, exit: Position): readonly Position[] | undefined {
    if (!graph.hasNode(start) || !graph.hasNode(exit)) {
      return undefined;
    }

    const queue: Position[] = [start];
    const visited = new Set<string>([start.toKey()]);
    const previous = new Map<string, Position>();

    while (queue.length > 0) {
      const current = queue.shift();
      if (current === undefined) {
        break;
      }
      if (current.equals(exit)) {
        return this.reconstructPath(previous, start, exit);
      }

      for (const neighbor of graph.neighborsOf(current)) {
        const key = neighbor.toKey();
        if (visited.has(key)) {
          continue;
        }
        visited.add(key);
        previous.set(key, current);
        queue.push(neighbor);
      }
    }

    return undefined;
  }

  private reconstructPath(previous: Map<string, Position>, start: Position, exit: Position): readonly Position[] {
    const path: Position[] = [exit];
    let current = exit;

    while (!current.equals(start)) {
      const parent = previous.get(current.toKey());
      if (parent === undefined) {
        return [];
      }
      path.unshift(parent);
      current = parent;
    }

    return path;
  }
}
