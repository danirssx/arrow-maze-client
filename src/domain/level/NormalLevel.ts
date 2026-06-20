/* eslint-disable @typescript-eslint/no-useless-constructor */
import type { BoardGroup } from "../board/BoardGroup";
import type { CollisionService } from "../board/CollisionService";
import { BaseLevel } from "./BaseLevel";
import type { DefeatReason } from "./LevelResult";

/**
 * Template Method pattern — Concrete level.
 *
 * A standard, untimed level. It reuses the whole `BaseLevel` skeleton and adds
 * no extra defeat condition, so the outcome is driven solely by emptying the
 * board (victory) or running out of attempts (the shared base rule).
 */
export class NormalLevel extends BaseLevel {
  constructor(id: string, board: BoardGroup, attempts: number, collision?: CollisionService) {
    super(id, board, attempts, collision);
  }

  protected evaluateDefeat(): DefeatReason | undefined {
    return undefined;
  }
}
