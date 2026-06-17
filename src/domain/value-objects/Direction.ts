import { InvalidCellSpecError } from "./errors";

/**
 * Direction value object (immutable).
 *
 * A fixed set of cardinal directions an arrow cell can point to. Each direction
 * carries its movement delta on the board grid (row/col). Instances are
 * canonical (created once as static members) so reference and value equality
 * coincide.
 */
export class Direction {
  static readonly Up = new Direction("UP", -1, 0);
  static readonly Down = new Direction("DOWN", 1, 0);
  static readonly Left = new Direction("LEFT", 0, -1);
  static readonly Right = new Direction("RIGHT", 0, 1);

  private constructor(
    readonly name: string,
    readonly rowDelta: number,
    readonly colDelta: number
  ) {}

  static all(): readonly Direction[] {
    return [Direction.Up, Direction.Down, Direction.Left, Direction.Right];
  }

  static fromName(name: string): Direction {
    const match = Direction.all().find((direction) => direction.name === name);
    if (match === undefined) {
      throw new InvalidCellSpecError(`Unknown direction: ${name}.`);
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
      default:
        return Direction.Left;
    }
  }

  equals(other: Direction): boolean {
    return this.name === other.name;
  }
}
