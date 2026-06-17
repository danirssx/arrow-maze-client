import type { CellType } from "../value-objects/CellType";
import type { Direction } from "../value-objects/Direction";
import type { Position } from "../value-objects/Position";
import type { ICell } from "../board/ICell";

/**
 * Decorator pattern — base decorator.
 *
 * Wraps an `ICell` and delegates the full cell contract by default, allowing
 * optional behavior to be layered without modifying concrete cell classes.
 */
export abstract class CellDecorator implements ICell {
  readonly size = 1;

  constructor(protected readonly wrapped: ICell) {}

  get position(): Position {
    return this.wrapped.position;
  }

  get type(): CellType {
    return this.wrapped.type;
  }

  get direction(): Direction | undefined {
    return this.wrapped.direction;
  }

  has(position: Position): boolean {
    return this.position.equals(position);
  }

  find(position: Position): ICell | undefined {
    return this.has(position) ? this : undefined;
  }

  toCells(): readonly ICell[] {
    return [this];
  }

  isExit(): boolean {
    return this.wrapped.isExit();
  }

  isBlocking(): boolean {
    return this.wrapped.isBlocking();
  }

  unwrap(): ICell {
    return this.wrapped;
  }
}
