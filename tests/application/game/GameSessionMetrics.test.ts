import { ConcreteLevelBuilder } from "@/application/level-build/ConcreteLevelBuilder";
import { LevelDirector } from "@/application/level-build/LevelDirector";
import { TutorialLevelStrategy } from "@/application/level-build/TutorialLevelStrategy";
import { GameSession } from "@/application/use-cases/game/GameSession";
import { TapArrowUseCase } from "@/application/use-cases/game/TapArrowUseCase";
import { mapGameSnapshot } from "@/application/use-cases/game/GameSnapshotMapper";

// Subject to human review — application result-metrics behavior (MAZ-160 / CA-007)

function mutableClock(start: number): { now: number; clock: () => number } {
  const state = { now: start, clock: () => state.now };
  return state;
}

function startedSession(clock: () => number): { session: GameSession; tap: TapArrowUseCase } {
  const strategy = new TutorialLevelStrategy();
  const built = new LevelDirector(new ConcreteLevelBuilder()).construct(strategy);
  const session = new GameSession(clock);
  session.start(built, strategy);
  return { session, tap: new TapArrowUseCase() };
}

describe("GameSession result metrics", () => {
  it("should_report_zero_elapsed_when_no_level_started", () => {
    const session = new GameSession(() => 5000);

    expect(session.elapsedMs()).toBe(0);
    expect(session.movesCount()).toBe(0);
  });

  it("should_measure_elapsed_from_the_injected_clock_while_playing", () => {
    const time = mutableClock(1000);
    const { session } = startedSession(time.clock);

    time.now = 1500;

    expect(session.elapsedMs()).toBe(500);
  });

  it("should_freeze_elapsed_time_at_the_moment_the_level_is_won", () => {
    const time = mutableClock(1000);
    const { session, tap } = startedSession(time.clock);

    time.now = 1200;
    tap.execute(session, "b"); // clear the blocker
    time.now = 4000;
    tap.execute(session, "a"); // empties the board -> victory frozen at 4000

    time.now = 9999; // clock keeps moving after victory

    expect(session.elapsedMs()).toBe(3000);
  });

  it("should_count_moves_from_the_recorded_extractions", () => {
    const time = mutableClock(0);
    const { session, tap } = startedSession(time.clock);

    tap.execute(session, "b");
    tap.execute(session, "a");

    expect(session.movesCount()).toBe(2);
  });

  it("should_expose_plain_elapsed_and_moves_on_the_application_snapshot", () => {
    const time = mutableClock(1000);
    const { session, tap } = startedSession(time.clock);

    tap.execute(session, "b");
    time.now = 2500;
    const snapshot = mapGameSnapshot(session);

    expect(typeof snapshot.elapsedMs).toBe("number");
    expect(typeof snapshot.movesCount).toBe("number");
    expect(snapshot.elapsedMs).toBe(1500);
    expect(snapshot.movesCount).toBe(1);
  });
});
