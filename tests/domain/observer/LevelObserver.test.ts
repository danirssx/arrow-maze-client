import { ArrowEntity, BoardGroup } from "@/domain/board";
import { NormalLevel, TimedLevel } from "@/domain/level";
import { DefeatReason } from "@/domain/level/LevelResult";
import { GameEventType } from "@/domain/observer";
import type { GameEvent, IGameObserver, LevelFinishedEvent } from "@/domain/observer";
import { ArrowSpec, Direction, Position } from "@/domain/value-objects";

class RecordingObserver implements IGameObserver {
  readonly received: GameEvent[] = [];

  onGameEvent(event: GameEvent): void {
    this.received.push(event);
  }

  typesOf(type: GameEventType): GameEvent[] {
    return this.received.filter((event) => event.type === type);
  }
}

const arrow = (id: string, cells: [number, number][], direction: Direction) =>
  new ArrowEntity(ArrowSpec.of(id, "blue", cells.map(([row, col]) => Position.of(row, col)), direction));

describe("BaseLevel as Observer subject", () => {
  it("should_notify_registered_observer_with_level_result_when_level_finishes", () => {
    const level = new NormalLevel("observer-level", new BoardGroup([arrow("a", [[0, 0]], Direction.Up)]), 3);
    const observer = new RecordingObserver();
    level.register(observer);

    level.extractArrow("a");
    level.evaluate();

    const finished = observer.typesOf(GameEventType.LevelFinished);
    expect(finished).toHaveLength(1);
    expect((finished[0] as LevelFinishedEvent).result.isWon()).toBe(true);
  });

  it("should_not_notify_observer_when_it_was_removed_before_the_event", () => {
    const level = new NormalLevel("observer-level", new BoardGroup([arrow("a", [[0, 0]], Direction.Up)]), 3);
    const observer = new RecordingObserver();
    level.register(observer);
    level.unregister(observer);

    level.extractArrow("a");
    level.evaluate();

    expect(observer.received).toHaveLength(0);
  });

  it("should_emit_level_finished_only_once_when_evaluate_is_called_repeatedly", () => {
    const level = new NormalLevel("observer-level", new BoardGroup([arrow("a", [[0, 0]], Direction.Up)]), 3);
    const observer = new RecordingObserver();
    level.register(observer);

    level.extractArrow("a");
    level.evaluate();
    level.evaluate();
    level.evaluate();

    expect(observer.typesOf(GameEventType.LevelFinished)).toHaveLength(1);
  });

  it("should_notify_level_finished_with_time_defeat_when_timed_level_expires", () => {
    let now = 1_000;
    const level = new TimedLevel("observer-level", new BoardGroup([arrow("a", [[0, 0]], Direction.Up)]), 3, 10, {
      clock: () => now
    });
    const observer = new RecordingObserver();
    level.register(observer);

    now += 10_000;
    level.evaluate();

    const finished = observer.typesOf(GameEventType.LevelFinished);
    expect(finished).toHaveLength(1);
    const result = (finished[0] as LevelFinishedEvent).result;
    expect(result.isLost()).toBe(true);
    expect(result.reason).toBe(DefeatReason.Time);
  });

  it("should_notify_level_finished_with_attempt_defeat_when_attempts_are_exhausted", () => {
    const level = new NormalLevel("observer-level", new BoardGroup([arrow("a", [[0, 0]], Direction.Up)]), 1);
    const observer = new RecordingObserver();
    level.register(observer);

    level.registerFailedAttempt("a");
    level.evaluate();

    const finished = observer.typesOf(GameEventType.LevelFinished);
    expect(finished).toHaveLength(1);
    expect((finished[0] as LevelFinishedEvent).result.reason).toBe(DefeatReason.OutOfAttempts);
  });
});
