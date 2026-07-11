import { DailyChallengeFacade } from "@/application/facades/DailyChallengeFacade";
import type { DailyChallenge, IDailyChallengeRepository } from "@/application/ports/IDailyChallengeRepository";
import { LevelKind } from "@/application/level-build/LevelDefinition";

// Subject to human review — application facade test

const CHALLENGE: DailyChallenge = {
  definition: {
    id: "daily-2026-07-10",
    difficulty: "EASY",
    arrows: [],
    attempts: 5,
    kind: LevelKind.Normal,
  },
  meta: { date: "2026-07-10", difficulty: "EASY", source: "gemini", fallbackUsed: false },
};

describe("DailyChallengeFacade", () => {
  it("should_return_the_challenge_from_the_repository", async () => {
    const getDailyChallenge = jest.fn(() => Promise.resolve(CHALLENGE));
    const repository = { getDailyChallenge } as unknown as IDailyChallengeRepository;
    const facade = new DailyChallengeFacade(repository);

    const result = await facade.getDailyChallenge();

    expect(getDailyChallenge).toHaveBeenCalledTimes(1);
    expect(result).toBe(CHALLENGE);
  });

  it("should_propagate_repository_failures", async () => {
    const repository = {
      getDailyChallenge: jest.fn(() => Promise.reject(new Error("unavailable"))),
    } as unknown as IDailyChallengeRepository;
    const facade = new DailyChallengeFacade(repository);

    await expect(facade.getDailyChallenge()).rejects.toThrow("unavailable");
  });
});
