import { ConcreteLevelBuilder } from "@/application/level-build/ConcreteLevelBuilder";
import { LevelDirector } from "@/application/level-build/LevelDirector";
import { TutorialLevelStrategy } from "@/application/level-build/TutorialLevelStrategy";
import { GameSession } from "@/application/use-cases/game/GameSession";
import { ResolveLevelOutcomeUseCase } from "@/application/use-cases/game/ResolveLevelOutcomeUseCase";
import { TapArrowUseCase } from "@/application/use-cases/game/TapArrowUseCase";
import { TimeScoringStrategy } from "@/domain/scoring/TimeScoringStrategy";

// Subject to human review — application contract regression test
// Covers @s7 of specs/gameplay-visible-timer-MAZ-220.feature: the visible gameplay
// timer must not change the already-calculated victory result contract.

function mutableClock(start: number): { now: number; clock: () => number } {
  const state = { now: start, clock: () => state.now };
  return state;
}

function wonSession(clock: () => number): GameSession {
  const strategy = new TutorialLevelStrategy();
  const built = new LevelDirector(new ConcreteLevelBuilder()).construct(strategy);
  const session = new GameSession(clock);
  session.start(built, strategy);

  const tap = new TapArrowUseCase();
  tap.execute(session, "b");
  tap.execute(session, "a");

  return session;
}

describe("LevelOutcomeDto contract", () => {
  it("should_expose_only_status_won_score_timeSeconds_and_movesCount_when_a_level_is_resolved", () => {
    const time = mutableClock(0);
    const session = wonSession(time.clock);

    const outcome = new ResolveLevelOutcomeUseCase(new TimeScoringStrategy()).execute(session);

    expect(Object.keys(outcome).sort()).toEqual(["movesCount", "score", "status", "timeSeconds", "won"]);
    expect(outcome.won).toBe(true);
    expect(outcome.movesCount).toBe(2);
  });

  it("should_keep_the_submitted_time_and_score_frozen_when_the_clock_moves_after_victory", () => {
    const time = mutableClock(1_000);
    const session = wonSession(time.clock);
    time.now = 4_000;
    const resolve = new ResolveLevelOutcomeUseCase(new TimeScoringStrategy());

    const atVictory = resolve.execute(session);
    time.now = 90_000;
    const muchLater = resolve.execute(session);

    expect(muchLater.timeSeconds).toBe(atVictory.timeSeconds);
    expect(muchLater.score).toBe(atVictory.score);
  });
});
