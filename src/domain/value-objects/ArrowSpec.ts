import type { Direction } from "./Direction";
import { InvalidArrowSpecError } from "./errors";
import type { Position } from "./Position";

/**
 * ArrowSpec value object (immutable).
 *
 * Declarative shape of a single arrow in an untangle-puzzle level: a unique
 * `id`, a decorative `color`, the ordered cells it occupies from TAIL to HEAD
 * (`path`), and the cardinal `direction` its head points to. `ArrowSpec.of`
 * enforces the level-authoring invariants — orthogonally connected path, no
 * self-intersection, and a head that does not point straight back into its own
 * body — so a malformed arrow fails in a controlled way instead of corrupting
 * collision logic. The head is always the last cell of `path`.
 */
export class ArrowSpec {
  private constructor(
    readonly id: string,
    readonly color: string,
    readonly path: readonly Position[],
    readonly direction: Direction
  ) {}

  static of(id: string, color: string, path: readonly Position[], direction: Direction): ArrowSpec {
    if (id.trim().length === 0) {
      throw new InvalidArrowSpecError("An arrow requires a non-empty id.");
    }
    if (color.trim().length === 0) {
      throw new InvalidArrowSpecError(`Arrow ${id} requires a non-empty color.`);
    }
    if (path.length === 0) {
      throw new InvalidArrowSpecError(`Arrow ${id} requires at least one cell in its path.`);
    }

    const seen = new Set<string>();
    let previous: Position | undefined;
    let penultimate: Position | undefined;
    let head: Position | undefined;
    for (const cell of path) {
      const key = cell.toKey();
      if (seen.has(key)) {
        throw new InvalidArrowSpecError(`Arrow ${id} has a self-intersecting path at ${key}.`);
      }
      seen.add(key);
      if (previous !== undefined && !ArrowSpec.areOrthogonallyAdjacent(previous, cell)) {
        throw new InvalidArrowSpecError(
          `Arrow ${id} path is not orthogonally connected between ${previous.toKey()} and ${key}.`
        );
      }
      penultimate = previous;
      previous = cell;
      head = cell;
    }

    if (head !== undefined && penultimate !== undefined && head.translate(direction).equals(penultimate)) {
      throw new InvalidArrowSpecError(`Arrow ${id} head points back into its own body.`);
    }

    return new ArrowSpec(id, color, [...path], direction);
  }

  get head(): Position {
    const head = this.path[this.path.length - 1];
    if (head === undefined) {
      throw new InvalidArrowSpecError(`Arrow ${this.id} has an empty path.`);
    }
    return head;
  }

  get cells(): readonly Position[] {
    return this.path;
  }

  private static areOrthogonallyAdjacent(a: Position, b: Position): boolean {
    return Math.abs(a.row - b.row) + Math.abs(a.col - b.col) === 1;
  }
}
