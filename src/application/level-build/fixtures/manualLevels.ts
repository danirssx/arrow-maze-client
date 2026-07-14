import { ArrowSpec } from "../../../domain/value-objects/ArrowSpec";
import type { Difficulty } from "../../../domain/value-objects/Difficulty";
import { Direction } from "../../../domain/value-objects/Direction";
import { Position } from "../../../domain/value-objects/Position";
import type { LevelDefinition } from "../LevelDefinition";
import { LevelKind } from "../LevelDefinition";
import type { ArrowRecord, LevelDraft } from "./levelsData";
import { LEVEL_DRAFTS } from "./levelsData";

export type { ArrowRecord, LevelDraft } from "./levelsData";

export type ManualLevelFixture = {
  readonly id: string;
  readonly name: string;
  readonly order: number;
  readonly difficulty: Difficulty;
  readonly arrowCount: number;
  readonly definition: LevelDefinition;
};
function mapArrow(record: ArrowRecord): ArrowSpec {
  return ArrowSpec.of(
    record.id,
    record.color,
    record.path.map((cell) => Position.of(cell.row, cell.col, cell.z ?? 0)),
    Direction.fromName(record.direction)
  );
}

function toDefinition(draft: LevelDraft): LevelDefinition {
  const timed = draft.timeLimitSeconds !== undefined;
  return {
    id: draft.id,
    difficulty: draft.difficulty,
    arrows: draft.arrows.map(mapArrow),
    kind: timed ? LevelKind.Timed : LevelKind.Normal,
    attempts: draft.attempts,
    ...(timed ? { timeLimitSeconds: draft.timeLimitSeconds } : {}),
    ...(draft.dimensions !== undefined ? { dimensions: draft.dimensions } : {})
  };
}

export const manualLevels: readonly ManualLevelFixture[] = LEVEL_DRAFTS.map((draft, index) => ({
  id: draft.id,
  name: draft.name ?? `Level ${index + 1}`,
  order: index + 1,
  difficulty: draft.difficulty,
  arrowCount: draft.arrowCount,
  definition: toDefinition(draft)
}));

export const manualLevelDefinitions: readonly LevelDefinition[] = manualLevels.map((level) => level.definition);

