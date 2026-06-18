import type { BoardGraphBuilder } from "../board/BoardGraphBuilder";
import type { ICellFactory } from "../factory/ICellFactory";
import type { LevelTemplate } from "../value-objects/LevelTemplate";
import type { Position } from "../value-objects/Position";
import { BaseLevel } from "./BaseLevel";
import type { Clock } from "./Clock";
import { systemClock } from "./Clock";
import { DefeatReason } from "./LevelResult";
import { InvalidTimeLimitError } from "./errors";

type TimedLevelOptions = {
  factory?: ICellFactory;
  graphBuilder?: BoardGraphBuilder;
  clock?: Clock;
};

/**
 * Template Method pattern — Concrete level.
 *
 * A level that must be solved before a time budget runs out. It reuses the
 * whole `BaseLevel` skeleton and specializes only the defeat hook: the level is
 * lost (by time) once the elapsed time since construction reaches the limit.
 *
 * Time is read through an injectable `Clock` so the rule stays deterministic in
 * tests and the domain never depends on a device clock.
 */
export class TimedLevel extends BaseLevel {
  private readonly limitMs: number;
  private readonly clock: Clock;
  private readonly startedAtMs: number;

  constructor(template: LevelTemplate, start: Position, limitSeconds: number, options: TimedLevelOptions = {}) {
    super(template, start, options.factory, options.graphBuilder);

    if (!Number.isFinite(limitSeconds) || limitSeconds <= 0) {
      throw new InvalidTimeLimitError(`Timed level ${template.id} requires a positive time limit in seconds.`);
    }

    this.limitMs = limitSeconds * 1000;
    this.clock = options.clock ?? systemClock;
    this.startedAtMs = this.clock();
  }

  /** Remaining time in milliseconds, clamped at zero. */
  get remainingMs(): number {
    return Math.max(this.limitMs - this.elapsedMs(), 0);
  }

  protected evaluateDefeat(): DefeatReason | undefined {
    return this.isExpired() ? DefeatReason.Time : undefined;
  }

  private isExpired(): boolean {
    return this.elapsedMs() >= this.limitMs;
  }

  private elapsedMs(): number {
    return this.clock() - this.startedAtMs;
  }
}
