import { CellSpec } from "../../domain/value-objects/CellSpec";
import { CellType } from "../../domain/value-objects/CellType";
import { Difficulty } from "../../domain/value-objects/Difficulty";
import { Direction } from "../../domain/value-objects/Direction";
import { LevelTemplate } from "../../domain/value-objects/LevelTemplate";
import { Position } from "../../domain/value-objects/Position";
import type { LevelDefinition } from "./LevelDefinition";
import { LevelKind } from "./LevelDefinition";
import type { ILevelStrategy } from "./ILevelStrategy";

/**
 * Strategy pattern — built-in tutorial level source.
 *
 * Produces a fixed, always-solvable normal level used for onboarding, with no
 * external input. The single path (0,0) → (0,1) → (0,2) keeps the optimal route
 * trivial so the tutorial cannot fail solvability validation.
 */
export class TutorialLevelStrategy implements ILevelStrategy {
  createDefinition(): LevelDefinition {
    const template = LevelTemplate.create({
      id: "tutorial-1",
      rows: 1,
      cols: 3,
      difficulty: Difficulty.Easy,
      cells: [
        CellSpec.of(Position.of(0, 0), CellType.Arrow, Direction.Right),
        CellSpec.of(Position.of(0, 1), CellType.Empty),
        CellSpec.of(Position.of(0, 2), CellType.Exit)
      ]
    });

    return {
      template,
      start: Position.of(0, 0),
      kind: LevelKind.Normal
    };
  }
}
