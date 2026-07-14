import { InvalidDirectionError } from "./errors";

/**
 * Direction value object (immutable).
 *
 * The six world axis directions an arrow head can point to. Each direction
 * carries its movement delta on the 3D board lattice (row/col/z). The four
 * planar directions keep `zDelta = 0`; `Forward`/`Back` move along the depth
 * axis with `rowDelta = colDelta = 0`. Directions are world axes fixed to the
 * board, not screen-relative: rotating the camera never changes an arrow's
 * exit axis. Instances are canonical (created once as static members) so
 * reference and value equality coincide.
 */
export class Direction {
  static readonly Up = new Direction("UP", -1, 0, 0);
  static readonly Down = new Direction("DOWN", 1, 0, 0);
  static readonly Left = new Direction("LEFT", 0, -1, 0);
  static readonly Right = new Direction("RIGHT", 0, 1, 0);
  static readonly Forward = new Direction("FORWARD", 0, 0, 1);
  static readonly Back = new Direction("BACK", 0, 0, -1);

  private constructor(
    readonly name: string,
    readonly rowDelta: number,
    readonly colDelta: number,
    readonly zDelta: number
  ) {}

  static all(): readonly Direction[] {
    return [Direction.Up, Direction.Down, Direction.Left, Direction.Right, Direction.Forward, Direction.Back];
  }

  static fromName(name: string): Direction {
    const match = Direction.all().find((direction) => direction.name === name);
    if (match === undefined) {
      throw new InvalidDirectionError(`Unknown direction: ${name}.`);
    }
    return match;
  }

  opposite(): Direction {
    switch (this) {
      case Direction.Up:
        return Direction.Down;
      case Direction.Down:
        return Direction.Up;
      case Direction.Left:
        return Direction.Right;
      case Direction.Right:
        return Direction.Left;
      case Direction.Forward:
        return Direction.Back;
      default:
        return Direction.Forward; // Direction.Back
    }
  }

  equals(other: Direction): boolean {
    return this.name === other.name;
  }
}
