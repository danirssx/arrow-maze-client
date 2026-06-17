import { CellEscapedEvent, GameEventEmitter, MoveExecutedEvent } from "@/domain/observer";
import type { GameEvent, IGameObserver } from "@/domain/observer";
import { Position } from "@/domain/value-objects/Position";

class RecordingObserver implements IGameObserver {
  readonly received: GameEvent[] = [];

  onGameEvent(event: GameEvent): void {
    this.received.push(event);
  }
}

describe("GameEventEmitter", () => {
  it("should_notify_every_registered_observer_when_event_is_emitted", () => {
    const emitter = new GameEventEmitter();
    const first = new RecordingObserver();
    const second = new RecordingObserver();
    emitter.register(first);
    emitter.register(second);

    const event = new CellEscapedEvent(Position.of(0, 0));
    emitter.emit(event);

    expect(first.received).toEqual([event]);
    expect(second.received).toEqual([event]);
  });

  it("should_keep_single_subscription_when_same_observer_registers_twice", () => {
    const emitter = new GameEventEmitter();
    const observer = new RecordingObserver();

    emitter.register(observer);
    emitter.register(observer);

    expect(emitter.observerCount).toBe(1);
    emitter.emit(new MoveExecutedEvent(Position.of(0, 0), Position.of(0, 1), 1));
    expect(observer.received).toHaveLength(1);
  });

  it("should_not_notify_observer_after_it_is_unregistered", () => {
    const emitter = new GameEventEmitter();
    const observer = new RecordingObserver();
    emitter.register(observer);

    emitter.unregister(observer);
    emitter.emit(new CellEscapedEvent(Position.of(1, 1)));

    expect(observer.received).toHaveLength(0);
  });

  it("should_ignore_unregister_when_observer_was_never_registered", () => {
    const emitter = new GameEventEmitter();

    expect(() => emitter.unregister(new RecordingObserver())).not.toThrow();
    expect(emitter.observerCount).toBe(0);
  });

  it("should_complete_notification_when_an_observer_unregisters_itself_during_emit", () => {
    const emitter = new GameEventEmitter();
    const survivor = new RecordingObserver();
    const selfRemoving: IGameObserver = {
      onGameEvent: () => emitter.unregister(selfRemoving)
    };
    emitter.register(selfRemoving);
    emitter.register(survivor);

    emitter.emit(new CellEscapedEvent(Position.of(0, 0)));

    expect(survivor.received).toHaveLength(1);
    expect(emitter.observerCount).toBe(1);
  });
});
