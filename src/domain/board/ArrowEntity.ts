import type { ArrowSpec } from "../value-objects/ArrowSpec";
import type { Direction } from "../value-objects/Direction";
import type { Position } from "../value-objects/Position";

export type ArrowState = "active" | "extracted";

/**
 * ArrowEntity — domain entity.
 *
 * A placed arrow with identity (`id`) and the only mutable bit the game needs:
 * whether it is still on the board (`active`) or has flown off (`extracted`).
 * Its immutable shape lives in the wrapped `ArrowSpec`. Extraction is reversible
 * so the Command/undo layer can restore an arrow to its original cells.
 */
export class ArrowEntity {
  private currentState: ArrowState = "active";

  constructor(readonly spec: ArrowSpec) {}

  get id(): string {
    return this.spec.id;
  }

  get color(): string {
    return this.spec.color;
  }

  get direction(): Direction {
    return this.spec.direction;
  }

  get head(): Position {
    return this.spec.head;
  }

  get cells(): readonly Position[] {
    return this.spec.cells;
  }

  get state(): ArrowState {
    return this.currentState;
  }

  get isActive(): boolean {
    return this.currentState === "active";
  }

  extract(): void {
    this.currentState = "extracted";
  }

  restore(): void {
    this.currentState = "active";
  }
}
