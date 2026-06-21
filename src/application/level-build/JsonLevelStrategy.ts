import { ArrowSpec } from "../../domain/value-objects/ArrowSpec";
import { Difficulty } from "../../domain/value-objects/Difficulty";
import { Direction } from "../../domain/value-objects/Direction";
import { Position } from "../../domain/value-objects/Position";
import type { BoardShapeDefinition, LevelDefinition } from "./LevelDefinition";
import { BOARD_SHAPE_MAX_CELLS, LevelKind } from "./LevelDefinition";
import type { ILevelStrategy } from "./ILevelStrategy";
import { InvalidLevelDefinitionError } from "./errors";

type JsonRecord = Record<string, unknown>;

/**
 * Strategy pattern — JSON/API level source (untangle puzzle).
 *
 * Parses a raw JSON document into a validated `LevelDefinition` of arrows. All
 * parsing and shape validation happen here; malformed input — bad JSON, missing
 * fields, unknown direction/difficulty/kind, or an invalid arrow path — is
 * surfaced as a controlled `InvalidLevelDefinitionError` rather than a raw parser
 * or domain error. It performs no I/O; the caller supplies the fetched text.
 */
export class JsonLevelStrategy implements ILevelStrategy {
  constructor(private readonly source: string) {}

  createDefinition(): LevelDefinition {
    let parsed: unknown;
    try {
      parsed = JSON.parse(this.source);
    } catch {
      throw new InvalidLevelDefinitionError("Level source is not valid JSON.");
    }

    try {
      return JsonLevelStrategy.mapDefinition(JsonLevelStrategy.asRecord(parsed, "level"));
    } catch (error) {
      if (error instanceof InvalidLevelDefinitionError) {
        throw error;
      }
      throw new InvalidLevelDefinitionError((error as Error).message);
    }
  }

  private static mapDefinition(raw: JsonRecord): LevelDefinition {
    const kind = JsonLevelStrategy.asKind(raw.kind);
    const arrows = JsonLevelStrategy.asArray(raw.arrows, "arrows").map((arrow, index) =>
      JsonLevelStrategy.mapArrow(JsonLevelStrategy.asRecord(arrow, `arrows[${index}]`))
    );

    const arrowCellKeys = new Set<string>();
    for (const arrow of arrows) {
      for (const cell of arrow.cells) {
        arrowCellKeys.add(cell.toKey());
      }
    }
    const boardShape = JsonLevelStrategy.mapBoardShape(raw.boardShape, arrowCellKeys);

    return {
      id: JsonLevelStrategy.asString(raw.id, "id"),
      difficulty: JsonLevelStrategy.asDifficulty(raw.difficulty),
      arrows,
      kind,
      ...(raw.attempts !== undefined ? { attempts: JsonLevelStrategy.asInteger(raw.attempts, "attempts") } : {}),
      ...(kind === LevelKind.Timed
        ? { timeLimitSeconds: JsonLevelStrategy.asInteger(raw.timeLimitSeconds, "timeLimitSeconds") }
        : {}),
      ...(boardShape !== undefined ? { boardShape } : {})
    };
  }

  /**
   * Parses and validates an optional `boardShape` (Option A): only `CELL_MASK`,
   * a non-empty, duplicate-free set of integer cells (max BOARD_SHAPE_MAX_CELLS)
   * that contains every arrow cell. Absent shape is valid (backward compatible).
   */
  private static mapBoardShape(
    value: unknown,
    arrowCellKeys: ReadonlySet<string>
  ): BoardShapeDefinition | undefined {
    if (value === undefined) {
      return undefined;
    }

    const record = JsonLevelStrategy.asRecord(value, "boardShape");
    const type = JsonLevelStrategy.asString(record.type, "boardShape.type");
    if (type !== "CELL_MASK") {
      throw new InvalidLevelDefinitionError(`Field "boardShape.type" must be "CELL_MASK".`);
    }

    const rawCells = JsonLevelStrategy.asArray(record.cells, "boardShape.cells");
    if (rawCells.length === 0) {
      throw new InvalidLevelDefinitionError(`Field "boardShape.cells" must be a non-empty array.`);
    }
    if (rawCells.length > BOARD_SHAPE_MAX_CELLS) {
      throw new InvalidLevelDefinitionError(
        `Field "boardShape.cells" must not exceed ${BOARD_SHAPE_MAX_CELLS} cells.`
      );
    }

    const seen = new Set<string>();
    const cells = rawCells.map((cell, index) => {
      const cellRecord = JsonLevelStrategy.asRecord(cell, `boardShape.cells[${index}]`);
      const row = JsonLevelStrategy.asInteger(cellRecord.row, "boardShape.cells.row");
      const col = JsonLevelStrategy.asInteger(cellRecord.col, "boardShape.cells.col");
      const key = `${row},${col}`;
      if (seen.has(key)) {
        throw new InvalidLevelDefinitionError(`Field "boardShape.cells" has a duplicate cell ${key}.`);
      }
      seen.add(key);
      return { row, col };
    });

    for (const arrowKey of arrowCellKeys) {
      if (!seen.has(arrowKey)) {
        throw new InvalidLevelDefinitionError(
          `An arrow cell (${arrowKey}) lies outside the boardShape mask.`
        );
      }
    }

    return { type: "CELL_MASK", cells };
  }

  private static mapArrow(raw: JsonRecord): ArrowSpec {
    const path = JsonLevelStrategy.asArray(raw.path, "arrow.path").map((cell, index) => {
      const record = JsonLevelStrategy.asRecord(cell, `arrow.path[${index}]`);
      return Position.of(
        JsonLevelStrategy.asInteger(record.row, "arrow.path.row"),
        JsonLevelStrategy.asInteger(record.col, "arrow.path.col")
      );
    });

    return ArrowSpec.of(
      JsonLevelStrategy.asString(raw.id, "arrow.id"),
      JsonLevelStrategy.asString(raw.color, "arrow.color"),
      path,
      Direction.fromName(JsonLevelStrategy.asString(raw.direction, "arrow.direction"))
    );
  }

  private static asRecord(value: unknown, field: string): JsonRecord {
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
      throw new InvalidLevelDefinitionError(`Field "${field}" must be an object.`);
    }
    return value as JsonRecord;
  }

  private static asArray(value: unknown, field: string): unknown[] {
    if (!Array.isArray(value)) {
      throw new InvalidLevelDefinitionError(`Field "${field}" must be an array.`);
    }
    return value;
  }

  private static asString(value: unknown, field: string): string {
    if (typeof value !== "string" || value.length === 0) {
      throw new InvalidLevelDefinitionError(`Field "${field}" must be a non-empty string.`);
    }
    return value;
  }

  private static asInteger(value: unknown, field: string): number {
    if (typeof value !== "number" || !Number.isInteger(value)) {
      throw new InvalidLevelDefinitionError(`Field "${field}" must be an integer.`);
    }
    return value;
  }

  private static asDifficulty(value: unknown): Difficulty {
    const difficulties = Object.values(Difficulty) as string[];
    if (typeof value !== "string" || !difficulties.includes(value)) {
      throw new InvalidLevelDefinitionError(`Field "difficulty" must be one of ${difficulties.join(", ")}.`);
    }
    return value as Difficulty;
  }

  private static asKind(value: unknown): LevelKind {
    const kinds = Object.values(LevelKind) as string[];
    if (typeof value !== "string" || !kinds.includes(value)) {
      throw new InvalidLevelDefinitionError(`Field "kind" must be one of ${kinds.join(", ")}.`);
    }
    return value as LevelKind;
  }
}
