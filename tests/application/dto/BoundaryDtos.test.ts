import { mapGameEvent } from "@/application/dto/GameEventMapper";
import { GameEventTypeDto } from "@/application/dto/GameEventDto";
import {
  GamePhaseDto,
  LevelStatusDto,
  DefeatReasonDto
} from "@/application/use-cases/game/GameSnapshotDto";
import {
  toGamePhaseDto,
  toLevelStatusDto,
  toDefeatReasonDto
} from "@/application/use-cases/game/GameSnapshotMapper";
import { GamePhase } from "@/domain/state/GamePhase";
import { DefeatReason, LevelStatus, LevelResult } from "@/domain/level/LevelResult";
import { MoveExecutedEvent, LevelFinishedEvent } from "@/domain/observer";
import { Position } from "@/domain/value-objects/Position";

// Subject to human review — application boundary DTO mapping (MAZ-164 / CA-011)

describe("Boundary DTO mapping", () => {
  // @s3 — every domain lifecycle/result value maps to an identical DTO literal
  it("should_map_every_domain_phase_to_the_same_dto_literal", () => {
    for (const phase of Object.values(GamePhase)) {
      const dto = toGamePhaseDto(phase);
      expect(dto).toBe(phase);
      expect(Object.values(GamePhaseDto)).toContain(dto);
    }
  });

  it("should_map_every_domain_status_to_the_same_dto_literal", () => {
    for (const status of Object.values(LevelStatus)) {
      const dto = toLevelStatusDto(status);
      expect(dto).toBe(status);
      expect(Object.values(LevelStatusDto)).toContain(dto);
    }
  });

  it("should_map_every_domain_defeat_reason_to_the_same_dto_literal", () => {
    for (const reason of Object.values(DefeatReason)) {
      const dto = toDefeatReasonDto(reason);
      expect(dto).toBe(reason);
      expect(Object.values(DefeatReasonDto)).toContain(dto);
    }
  });

  // @s4 — the event mapper emits the DTO discriminator with plain coordinates
  it("should_map_a_move_event_to_a_dto_with_plain_coordinates", () => {
    const event = new MoveExecutedEvent(Position.of(0, 0), Position.of(0, 1), 1);

    const dto = mapGameEvent(event);

    expect(dto).toEqual({
      type: GameEventTypeDto.MoveExecuted,
      from: { row: 0, column: 0 },
      to: { row: 0, column: 1 },
      moves: 1
    });
  });

  // @s2 — a lost result reaches the DTO with status/reason literals
  it("should_map_a_lost_level_finished_event_to_dto_status_and_reason", () => {
    const event = new LevelFinishedEvent(LevelResult.lost(DefeatReason.OutOfAttempts));

    const dto = mapGameEvent(event);

    expect(dto).toEqual({
      type: GameEventTypeDto.LevelFinished,
      result: { status: "LOST", reason: "OUT_OF_ATTEMPTS" }
    });
  });
});
