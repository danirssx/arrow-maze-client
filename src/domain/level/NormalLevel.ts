/* eslint-disable @typescript-eslint/no-useless-constructor */
import type { BoardGraphBuilder } from "../board/BoardGraphBuilder";
import type { ICellFactory } from "../factory/ICellFactory";
import type { LevelTemplate } from "../value-objects/LevelTemplate";
import type { Position } from "../value-objects/Position";
import { BaseLevel } from "./BaseLevel";
import type { DefeatReason } from "./LevelResult";

/**
 * Template Method pattern — Concrete level.
 *
 * A standard, untimed level. It reuses the whole `BaseLevel` skeleton and only
 * specializes the defeat hook: a normal level is never lost on its own, so the
 * outcome is driven solely by reaching the exit.
 */
export class NormalLevel extends BaseLevel {
  constructor(
    template: LevelTemplate,
    start: Position,
    factory?: ICellFactory,
    graphBuilder?: BoardGraphBuilder
  ) {
    super(template, start, factory, graphBuilder);
  }

  protected evaluateDefeat(): DefeatReason | undefined {
    return undefined;
  }
}
