import type { BuiltLevel } from "./BuiltLevel";
import type { ILevelBuilder } from "./ILevelBuilder";
import type { ILevelStrategy } from "./ILevelStrategy";
import { LevelKind } from "./LevelDefinition";
import { InvalidLevelDefinitionError } from "./errors";

/**
 * Director (Builder pattern) — level construction orchestration.
 *
 * Drives an `ILevelBuilder` through the fixed construction recipe using the
 * `LevelDefinition` produced by a level `ILevelStrategy`. The director decides
 * the ordering of builder steps; the builder owns how each part is assembled.
 */
export class LevelDirector {
  constructor(private readonly builder: ILevelBuilder) {}

  construct(strategy: ILevelStrategy): BuiltLevel {
    const definition = strategy.createDefinition();

    this.builder.reset().withId(definition.id).withArrows(definition.arrows);

    if (definition.attempts !== undefined) {
      this.builder.withAttempts(definition.attempts);
    }

    if (definition.kind === LevelKind.Timed) {
      if (definition.timeLimitSeconds === undefined) {
        throw new InvalidLevelDefinitionError(`Timed level ${definition.id} requires a time limit in seconds.`);
      }
      this.builder.asTimed(definition.timeLimitSeconds);
    } else {
      this.builder.asNormal();
    }

    return this.builder.build();
  }
}
