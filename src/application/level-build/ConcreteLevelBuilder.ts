import { ArrowEntity } from "../../domain/board/ArrowEntity";
import { BoardGroup } from "../../domain/board/BoardGroup";
import type { BaseLevel } from "../../domain/level/BaseLevel";
import { NormalLevel } from "../../domain/level/NormalLevel";
import { TimedLevel } from "../../domain/level/TimedLevel";
import type { ArrowSpec } from "../../domain/value-objects/ArrowSpec";
import type { BuiltLevel } from "./BuiltLevel";
import type { ILevelBuilder } from "./ILevelBuilder";
import { DEFAULT_ATTEMPTS, LevelKind } from "./LevelDefinition";
import { InvalidLevelDefinitionError, LevelBuildStateError } from "./errors";

/**
 * Builder pattern — concrete level builder (untangle puzzle).
 *
 * Accumulates the parts of a level and, on `build()`, instantiates each arrow as
 * an `ArrowEntity`, registers them in a `BoardGroup` (occupancy index), and
 * constructs the concrete `BaseLevel` with its attempts budget. Structural
 * problems are surfaced as controlled `ApplicationError`s. Solvability is NOT
 * checked here — the backend guarantees it at publish time (cycle/DAG check).
 *
 * Application layer: depends only on domain classes; never imports React, Expo,
 * HTTP, or storage.
 */
export class ConcreteLevelBuilder implements ILevelBuilder {
  private id: string | undefined;
  private arrows: readonly ArrowSpec[] | undefined;
  private attempts: number | undefined;
  private kind: LevelKind = LevelKind.Normal;
  private timeLimitSeconds: number | undefined;

  reset(): this {
    this.id = undefined;
    this.arrows = undefined;
    this.attempts = undefined;
    this.kind = LevelKind.Normal;
    this.timeLimitSeconds = undefined;
    return this;
  }

  withId(id: string): this {
    this.id = id;
    return this;
  }

  withArrows(arrows: readonly ArrowSpec[]): this {
    this.arrows = arrows;
    return this;
  }

  withAttempts(attempts: number): this {
    this.attempts = attempts;
    return this;
  }

  asNormal(): this {
    this.kind = LevelKind.Normal;
    this.timeLimitSeconds = undefined;
    return this;
  }

  asTimed(limitSeconds: number): this {
    this.kind = LevelKind.Timed;
    this.timeLimitSeconds = limitSeconds;
    return this;
  }

  build(): BuiltLevel {
    const id = this.requireId();
    const arrows = this.requireArrows();

    if (arrows.length === 0) {
      throw new InvalidLevelDefinitionError(`Level ${id} must define at least one arrow.`);
    }

    const ids = new Set<string>();
    for (const arrow of arrows) {
      if (ids.has(arrow.id)) {
        throw new InvalidLevelDefinitionError(`Level ${id} has a duplicate arrow id "${arrow.id}".`);
      }
      ids.add(arrow.id);
    }

    const attempts = this.attempts ?? DEFAULT_ATTEMPTS;
    if (!Number.isInteger(attempts) || attempts <= 0) {
      throw new InvalidLevelDefinitionError(`Level ${id} requires a positive integer attempts budget.`);
    }

    const board = new BoardGroup(arrows.map((spec) => new ArrowEntity(spec)));
    return { level: this.instantiate(id, board, attempts) };
  }

  private instantiate(id: string, board: BoardGroup, attempts: number): BaseLevel {
    if (this.kind === LevelKind.Timed) {
      if (this.timeLimitSeconds === undefined || this.timeLimitSeconds <= 0) {
        throw new InvalidLevelDefinitionError(`Timed level ${id} requires a positive time limit in seconds.`);
      }
      return new TimedLevel(id, board, attempts, this.timeLimitSeconds);
    }
    return new NormalLevel(id, board, attempts);
  }

  private requireId(): string {
    if (this.id === undefined) {
      throw new LevelBuildStateError("Cannot build a level before an id is set.");
    }
    return this.id;
  }

  private requireArrows(): readonly ArrowSpec[] {
    if (this.arrows === undefined) {
      throw new LevelBuildStateError("Cannot build a level before arrows are set.");
    }
    return this.arrows;
  }
}
