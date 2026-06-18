import { ArrowSpec } from "../../domain/value-objects/ArrowSpec";
import { Difficulty } from "../../domain/value-objects/Difficulty";
import { Direction } from "../../domain/value-objects/Direction";
import { Position } from "../../domain/value-objects/Position";
import type { LevelDefinition } from "./LevelDefinition";
import { LevelKind } from "./LevelDefinition";
import type { ILevelStrategy } from "./ILevelStrategy";

/**
 * Strategy pattern — built-in tutorial level source.
 *
 * Produces a fixed, always-solvable two-arrow level used for onboarding: arrow
 * `a` (Right) is blocked by arrow `b` sitting on its forward ray, so the player
 * must remove `b` first, then `a`. No external input, no blocking cycle.
 */
export class TutorialLevelStrategy implements ILevelStrategy {
  createDefinition(): LevelDefinition {
    const a = ArrowSpec.of("a", "blue", [Position.of(0, 0), Position.of(0, 1)], Direction.Right);
    const b = ArrowSpec.of("b", "green", [Position.of(0, 2)], Direction.Up);

    return {
      id: "tutorial-1",
      difficulty: Difficulty.Easy,
      arrows: [a, b],
      kind: LevelKind.Normal
    };
  }
}
