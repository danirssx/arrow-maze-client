import { NormalLevel, TimedLevel } from "@/domain/level";
import { GameEventType } from "@/domain/observer";
import type {
  CellEscapedEvent,
  GameEvent,
  IGameObserver,
  LevelFinishedEvent,
  MoveExecutedEvent
} from "@/domain/observer";
import { CellSpec } from "@/domain/value-objects/CellSpec";
import { CellType } from "@/domain/value-objects/CellType";
import { Difficulty } from "@/domain/value-objects/Difficulty";
import { Direction } from "@/domain/value-objects/Direction";
import { LevelTemplate } from "@/domain/value-objects/LevelTemplate";
import { Position } from "@/domain/value-objects/Position";

class RecordingObserver implements IGameObserver {
  readonly received: GameEvent[] = [];

  onGameEvent(event: GameEvent): void {
    this.received.push(event);
  }

  typesOf(type: GameEventType): GameEvent[] {
    return this.received.filter((event) => event.type === type);
  }
}

/**
 * Solvable 2x3 board:
 *   (0,0) Arrow Right -> (0,1) Empty -> (0,2) Empty -> (1,2) Exit
 */
function buildSolvableTemplate(): LevelTemplate {
  return LevelTemplate.create({
    id: "level-observer",
    rows: 2,
    cols: 3,
    difficulty: Difficulty.Easy,
    cells: [
      CellSpec.of(Position.of(0, 0), CellType.Arrow, Direction.Right),
      CellSpec.of(Position.of(0, 1), CellType.Empty),
      CellSpec.of(Position.of(0, 2), CellType.Empty),
      CellSpec.of(Position.of(1, 1), CellType.Wall),
      CellSpec.of(Position.of(1, 2), CellType.Exit)
    ]
  });
}

describe("BaseLevel as Observer subject", () => {
  it("should_notify_registered_observer_with_level_result_when_level_finishes", () => {
    const level = new NormalLevel(buildSolvableTemplate(), Position.of(0, 0));
    const observer = new RecordingObserver();
    level.register(observer);

    level.move(Position.of(0, 1));
    level.move(Position.of(0, 2));
    level.move(Position.of(1, 2));
    level.evaluate();

    const finished = observer.typesOf(GameEventType.LevelFinished);
    expect(finished).toHaveLength(1);
    expect((finished[0] as LevelFinishedEvent).result.isWon()).toBe(true);
  });

  it("should_not_notify_observer_when_it_was_removed_before_the_event", () => {
    const level = new NormalLevel(buildSolvableTemplate(), Position.of(0, 0));
    const observer = new RecordingObserver();
    level.register(observer);
    level.unregister(observer);

    level.move(Position.of(0, 1));
    level.evaluate();

    expect(observer.received).toHaveLength(0);
  });

  it("should_emit_cell_escaped_and_move_executed_when_a_move_succeeds", () => {
    const level = new NormalLevel(buildSolvableTemplate(), Position.of(0, 0));
    const observer = new RecordingObserver();
    level.register(observer);

    level.move(Position.of(0, 1));

    expect(observer.received).toHaveLength(2);
    const escaped = observer.received[0] as CellEscapedEvent;
    const moved = observer.received[1] as MoveExecutedEvent;
    expect(escaped.type).toBe(GameEventType.CellEscaped);
    expect(escaped.from.equals(Position.of(0, 0))).toBe(true);
    expect(moved.type).toBe(GameEventType.MoveExecuted);
    expect(moved.from.equals(Position.of(0, 0))).toBe(true);
    expect(moved.to.equals(Position.of(0, 1))).toBe(true);
    expect(moved.moves).toBe(1);
  });

  it("should_emit_level_finished_only_once_when_evaluate_is_called_repeatedly", () => {
    const level = new NormalLevel(buildSolvableTemplate(), Position.of(0, 0));
    const observer = new RecordingObserver();
    level.register(observer);

    level.move(Position.of(0, 1));
    level.move(Position.of(0, 2));
    level.move(Position.of(1, 2));
    level.evaluate();
    level.evaluate();
    level.evaluate();

    expect(observer.typesOf(GameEventType.LevelFinished)).toHaveLength(1);
  });

  it("should_notify_level_finished_with_time_defeat_when_timed_level_expires", () => {
    let now = 1_000;
    const level = new TimedLevel(buildSolvableTemplate(), Position.of(0, 0), 10, { clock: () => now });
    const observer = new RecordingObserver();
    level.register(observer);

    now += 10_000;
    level.evaluate();

    const finished = observer.typesOf(GameEventType.LevelFinished);
    expect(finished).toHaveLength(1);
    expect((finished[0] as LevelFinishedEvent).result.isLost()).toBe(true);
  });

  it("should_not_emit_level_finished_while_level_is_still_playing", () => {
    const level = new NormalLevel(buildSolvableTemplate(), Position.of(0, 0));
    const observer = new RecordingObserver();
    level.register(observer);

    level.move(Position.of(0, 1));
    level.evaluate();

    expect(observer.typesOf(GameEventType.LevelFinished)).toHaveLength(0);
  });
});
