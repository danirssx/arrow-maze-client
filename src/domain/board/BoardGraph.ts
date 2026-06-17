import type { Position } from "../value-objects/Position";
import { PositionNotInGraphError } from "./errors";

/**
 * Graph Model/Pathfinding pattern — directed board graph.
 *
 * Represents movement possibilities as a pure directed graph. Nodes are
 * navigable board positions and edges are legal moves between those positions.
 * UI, storage, and framework code must consume snapshots instead of mutating
 * this graph directly.
 */
export class BoardGraph {
  private readonly adjacency = new Map<string, { position: Position; neighbors: Position[] }>();

  addNode(position: Position): this {
    const key = position.toKey();
    if (!this.adjacency.has(key)) {
      this.adjacency.set(key, { position, neighbors: [] });
    }
    return this;
  }

  addEdge(from: Position, to: Position): this {
    const source = this.adjacency.get(from.toKey());
    const target = this.adjacency.get(to.toKey());
    if (source === undefined) {
      throw new PositionNotInGraphError(`Source position ${from.toKey()} is not part of the board graph.`);
    }
    if (target === undefined) {
      throw new PositionNotInGraphError(`Target position ${to.toKey()} is not part of the board graph.`);
    }
    if (!source.neighbors.some((neighbor) => neighbor.equals(to))) {
      source.neighbors.push(to);
    }
    return this;
  }

  hasNode(position: Position): boolean {
    return this.adjacency.has(position.toKey());
  }

  canMove(from: Position, to: Position): boolean {
    return this.neighborsOf(from).some((neighbor) => neighbor.equals(to));
  }

  neighborsOf(position: Position): readonly Position[] {
    const node = this.adjacency.get(position.toKey());
    if (node === undefined) {
      return [];
    }
    return [...node.neighbors];
  }

  nodes(): readonly Position[] {
    return [...this.adjacency.values()].map((node) => node.position);
  }

  get nodeCount(): number {
    return this.adjacency.size;
  }

  get edgeCount(): number {
    return [...this.adjacency.values()].reduce((total, node) => total + node.neighbors.length, 0);
  }
}
