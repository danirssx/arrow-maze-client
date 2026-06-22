import { ConcreteLevelBuilder } from "@/application/level-build/ConcreteLevelBuilder";
import { LevelDirector } from "@/application/level-build/LevelDirector";
import { TutorialLevelStrategy } from "@/application/level-build/TutorialLevelStrategy";
import { GameSession } from "@/application/use-cases/game/GameSession";
import { TapArrowUseCase } from "@/application/use-cases/game/TapArrowUseCase";
import { ResolveLevelOutcomeUseCase } from "@/application/use-cases/game/ResolveLevelOutcomeUseCase";
import { TimeScoringStrategy } from "@/domain/scoring/TimeScoringStrategy";

// Subject to human review — application scoring orchestration (MAZ-160 / CA-007)

describe("ResolveLevelOutcomeUseCase", () => {
  it("should_resolve_a_won_outcome_with_strategy_score_time_and_moves", () => {
    const time = { now: 1000 };
    const strategy = new TutorialLevelStrategy();
    const built = new LevelDirector(new ConcreteLevelBuilder()).construct(strategy);
    const session = new GameSession(() => time.now);
    session.start(built, strategy);

    const tap = new TapArrowUseCase();
    tap.execute(session, "b");
    time.now = 4000; // 3000 ms elapsed at victory
    tap.execute(session, "a");

    const outcome = new ResolveLevelOutcomeUseCase(new TimeScoringStrategy()).execute(session);

    expect(outcome.won).toBe(true);
    expect(outcome.status).toBe("WON");
    expect(outcome.timeSeconds).toBe(3);
    expect(outcome.movesCount).toBe(2);
    // TimeScoringStrategy: max(0, 1000 - 3*10) = 970
    expect(outcome.score).toBe(970);
  });

  it("should_resolve_a_zero_score_when_the_level_is_not_won", () => {
    const strategy = new TutorialLevelStrategy();
    const built = new LevelDirector(new ConcreteLevelBuilder()).construct(strategy);
    const session = new GameSession(() => 0);
    session.start(built, strategy);

    const outcome = new ResolveLevelOutcomeUseCase(new TimeScoringStrategy()).execute(session);

    expect(outcome.won).toBe(false);
    expect(outcome.score).toBe(0);
  });
});
