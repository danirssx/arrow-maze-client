import type { Position } from "../value-objects/Position";
import { DuplicateCellError } from "./errors";
import type { IBoardComponent } from "./IBoardComponent";
import type { ICell } from "./ICell";

/**
 * Composite pattern — Composite.
 *
 * A group of board components (cells or nested groups) exposed through the same
 * `IBoardComponent` contract as its children. Queries are delegated to children
 * so callers traverse an arbitrarily nested board uniformly. Adding a component
 * whose leaf position already exists fails with `DuplicateCellError`, keeping
 * `find` deterministic.
 */
export class BoardGroup implements IBoardComponent {
  private readonly children: IBoardComponent[] = [];
  private readonly occupied = new Set<string>();

  constructor(children: readonly IBoardComponent[] = []) {
    for (const child of children) {
      this.add(child);
    }
  }

  add(child: IBoardComponent): this {
    for (const cell of child.toCells()) {
      const key = cell.position.toKey();
      if (this.occupied.has(key)) {
        throw new DuplicateCellError(`A cell already exists at ${key}.`);
      }
      this.occupied.add(key);
    }
    this.children.push(child);
    return this;
  }

  get size(): number {
    return this.children.reduce((total, child) => total + child.size, 0);
  }

  has(position: Position): boolean {
    return this.occupied.has(position.toKey());
  }

  find(position: Position): ICell | undefined {
    for (const child of this.children) {
      const found = child.find(position);
      if (found !== undefined) {
        return found;
      }
    }
    return undefined;
  }

  toCells(): readonly ICell[] {
    return this.children.flatMap((child) => child.toCells());
  }
}
