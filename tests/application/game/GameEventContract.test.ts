import { GameFacade, GameplayStateError } from "@/application/facades";
import {
  InvalidLevelDefinitionError,
  LevelKind,
  TutorialLevelStrategy,
  type LevelDefinition
} from "@/application/level-build";
import {
  GameEventBridge,
  GameEventType,
  mapBoardSnapshot,
  mapGameEvent
} from "@/application/dto";
import type { GameEventDto, IGameEventListener } from "@/application/dto";
import { CellEscapedEvent, LevelFinishedEvent, MoveExecutedEvent } from "@/domain/observer";
import { DefeatReason, LevelResult, LevelStatus } from "@/domain/level";
import { CellSpec } from "@/domain/value-objects/CellSpec";
import { CellType } from "@/domain/value-objects/CellType";
import { Difficulty } from "@/domain/value-objects/Difficulty";
import { Direction } from "@/domain/value-objects/Direction";
import { LevelTemplate } from "@/domain/value-objects/LevelTemplate";
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
    template: LevelTemplate.create({
      id: "contract-board",
      rows: 1,
      cols: 3,
      difficulty: Difficulty.Easy,
      cells: [
        CellSpec.of(Position.of(0, 0), CellType.Arrow, Direction.Right),
        CellSpec.of(Position.of(0, 1), CellType.Empty),
        CellSpec.of(Position.of(0, 2), CellType.Exit)
      ]
    }),
    start: Position.of(0, 0),
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
  it("should_map_a_level_definition_to_a_ui_neutral_board", () => {
    const snapshot = mapBoardSnapshot(tutorialDefinition());

    expect(snapshot.rows).toBe(1);
    expect(snapshot.cols).toBe(3);
    expect(snapshot.start).toEqual({ row: 0, column: 0 });
    expect(snapshot.exit).toEqual({ row: 0, column: 2 });
    expect(snapshot.cells).toContainEqual({ row: 0, column: 0, type: CellType.Arrow, direction: "RIGHT" });
    expect(snapshot.cells).toContainEqual({ row: 0, column: 2, type: CellType.Exit });
  });

  it("should_reject_a_definition_without_an_exit_cell", () => {
    const definition: LevelDefinition = {
      template: LevelTemplate.create({
        id: "no-exit",
        rows: 1,
        cols: 2,
        difficulty: Difficulty.Easy,
        cells: [
          CellSpec.of(Position.of(0, 0), CellType.Arrow, Direction.Right),
          CellSpec.of(Position.of(0, 1), CellType.Empty)
        ]
      }),
      start: Position.of(0, 0),
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

    facade.playTurn({ row: 0, column: 1 });
    facade.playTurn({ row: 0, column: 2 });

    const finished = listener.typesOf(GameEventType.LevelFinished);
    expect(finished).toHaveLength(1);
    expect(finished[0]).toEqual({ type: GameEventType.LevelFinished, result: { status: LevelStatus.Won } });
  });

  it("should_emit_move_and_escape_dtos_for_each_turn", () => {
    const facade = GameFacade.createDefault();
    const listener = new RecordingListener();
    facade.addEventListener(listener);
    facade.startLevel(new TutorialLevelStrategy());

    facade.playTurn({ row: 0, column: 1 });

    expect(listener.typesOf(GameEventType.MoveExecuted)).toHaveLength(1);
    expect(listener.typesOf(GameEventType.CellEscaped)).toHaveLength(1);
  });

  it("should_stop_notifying_after_listener_is_removed", () => {
    const facade = GameFacade.createDefault();
    const listener = new RecordingListener();
    facade.addEventListener(listener);
    facade.startLevel(new TutorialLevelStrategy());
    facade.removeEventListener(listener);

    facade.playTurn({ row: 0, column: 1 });

    expect(listener.received).toHaveLength(0);
  });

  it("should_expose_a_ui_neutral_board_snapshot_after_start", () => {
    const facade = GameFacade.createDefault();
    facade.startLevel(new TutorialLevelStrategy());

    const board = facade.getBoardSnapshot();

    expect(board.rows).toBe(1);
    expect(board.cols).toBe(3);
    expect(board.cells).toHaveLength(3);
    expect(board.exit).toEqual({ row: 0, column: 2 });
  });

  it("should_throw_controlled_error_when_board_snapshot_is_requested_before_start", () => {
    expect(() => GameFacade.createDefault().getBoardSnapshot()).toThrow(GameplayStateError);
  });
});
