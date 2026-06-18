import { GameFacade } from "@/application/facades";
import { InvalidLevelDefinitionError, LevelKind, TutorialLevelStrategy, type LevelDefinition } from "@/application/level-build";
import {
  GameEventBridge,
  GameEventType,
  mapBoardSnapshot,
  mapGameEvent
} from "@/application/dto";
import type { GameEventDto, IGameEventListener } from "@/application/dto";
import { CellEscapedEvent, LevelFinishedEvent, MoveExecutedEvent } from "@/domain/observer";
import { DefeatReason, LevelResult, LevelStatus } from "@/domain/level";
import { ArrowSpec } from "@/domain/value-objects/ArrowSpec";
import { Difficulty } from "@/domain/value-objects/Difficulty";
import { Direction } from "@/domain/value-objects/Direction";
import { Position } from "@/domain/value-objects/Position";

class RecordingListener implements IGameEventListener {
  readonly received: GameEventDto[] = [];

  onGameEvent(event: GameEventDto): void {
    this.received.push(event);
  }

  typesOf(type: GameEventDto["type"]): GameEventDto[] {
    return this.received.filter((event) => event.type === type);
  }
}

function tutorialDefinition(): LevelDefinition {
  return {
    id: "contract-board",
    difficulty: Difficulty.Easy,
    arrows: [
      ArrowSpec.of("a", "blue", [Position.of(-1, -1), Position.of(-1, 0)], Direction.Right),
      ArrowSpec.of("b", "green", [Position.of(0, 2), Position.of(-1, 2)], Direction.Up)
    ],
    attempts: 4,
    kind: LevelKind.Normal
  };
}

describe("mapGameEvent", () => {
  it("should_map_move_executed_event_to_ui_neutral_dto", () => {
    const dto = mapGameEvent(new MoveExecutedEvent(Position.of(0, 0), Position.of(0, 1), 1));

    expect(dto).toEqual({
      type: GameEventType.MoveExecuted,
      from: { row: 0, column: 0 },
      to: { row: 0, column: 1 },
      moves: 1
    });
  });

  it("should_map_cell_escaped_event_to_ui_neutral_dto", () => {
    const dto = mapGameEvent(new CellEscapedEvent(Position.of(1, 2)));

    expect(dto).toEqual({ type: GameEventType.CellEscaped, from: { row: 1, column: 2 } });
  });

  it("should_map_level_finished_event_with_result_status_and_reason", () => {
    const won = mapGameEvent(new LevelFinishedEvent(LevelResult.won()));
    const lost = mapGameEvent(new LevelFinishedEvent(LevelResult.lost(DefeatReason.Time)));

    expect(won).toEqual({ type: GameEventType.LevelFinished, result: { status: LevelStatus.Won } });
    expect(lost).toEqual({
      type: GameEventType.LevelFinished,
      result: { status: LevelStatus.Lost, reason: DefeatReason.Time }
    });
  });
});

describe("GameEventBridge", () => {
  it("should_forward_a_ui_neutral_dto_to_the_listener", () => {
    const listener = new RecordingListener();
    const bridge = new GameEventBridge(listener);

    bridge.onGameEvent(new MoveExecutedEvent(Position.of(0, 0), Position.of(0, 1), 1));

    expect(listener.received).toEqual([
      { type: GameEventType.MoveExecuted, from: { row: 0, column: 0 }, to: { row: 0, column: 1 }, moves: 1 }
    ]);
  });
});

describe("mapBoardSnapshot", () => {
  it("should_map_an_arrow_level_definition_to_a_ui_neutral_board", () => {
    const snapshot = mapBoardSnapshot(tutorialDefinition());

    expect(snapshot).toEqual({
      levelId: "contract-board",
      attempts: 4,
      boundingBox: { minRow: -1, maxRow: 0, minColumn: -1, maxColumn: 2 },
      arrows: [
        {
          id: "a",
          color: "blue",
          direction: "RIGHT",
          path: [
            { row: -1, column: -1 },
            { row: -1, column: 0 }
          ]
        },
        {
          id: "b",
          color: "green",
          direction: "UP",
          path: [
            { row: 0, column: 2 },
            { row: -1, column: 2 }
          ]
        }
      ]
    });
  });

  it("should_reject_a_definition_without_arrows", () => {
    const definition: LevelDefinition = {
      id: "no-arrows",
      difficulty: Difficulty.Easy,
      arrows: [],
      kind: LevelKind.Normal
    };

    expect(() => mapBoardSnapshot(definition)).toThrow(InvalidLevelDefinitionError);
  });
});

describe("GameFacade observer bridge", () => {
  it("should_notify_listener_with_level_finished_dto_when_the_level_is_won", () => {
    const facade = GameFacade.createDefault();
    const listener = new RecordingListener();
    facade.addEventListener(listener);
    facade.startLevel(new TutorialLevelStrategy());

    facade.tapArrow("b");
    facade.tapArrow("a");

    const finished = listener.typesOf(GameEventType.LevelFinished);
    expect(finished).toHaveLength(1);
    expect(finished[0]).toEqual({ type: GameEventType.LevelFinished, result: { status: LevelStatus.Won } });
  });

  it("should_expose_ui_neutral_gameplay_snapshots_after_arrow_taps", () => {
    const facade = GameFacade.createDefault();
    const initial = facade.startLevel(new TutorialLevelStrategy());

    const afterFirstExtraction = facade.tapArrow("b");

    expect(initial.arrowsRemaining).toBe(2);
    expect(initial.attemptsRemaining).toBe(5);
    expect(afterFirstExtraction.arrowsRemaining).toBe(1);
    expect(afterFirstExtraction.canUndo).toBe(true);
  });

  it("should_stop_notifying_after_listener_is_removed", () => {
    const facade = GameFacade.createDefault();
    const listener = new RecordingListener();
    facade.addEventListener(listener);
    facade.startLevel(new TutorialLevelStrategy());
    facade.removeEventListener(listener);

    facade.tapArrow("b");
    facade.tapArrow("a");

    expect(listener.received).toHaveLength(0);
  });
});
