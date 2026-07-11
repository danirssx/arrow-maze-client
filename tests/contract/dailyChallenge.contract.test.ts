/**
 * Contract test: validate the client daily-challenge DTOs against the backend
 * GET /daily-challenge response shape (MAZ-218). The daily level is anonymous —
 * it carries no levelId/status/version — so the client must map it without those.
 */
import type { DailyChallengeResponseDto } from "@/infrastructure/mappers/daily-challenge/DailyChallengeDtos";

const FIXTURE: DailyChallengeResponseDto = {
  status: "success",
  data: {
    challenge: {
      date: "2026-07-10",
      seed: "daily-2026-07-10",
      targetDifficulty: "MEDIUM",
      source: "gemini",
      generatedAt: "2026-07-10T04:00:00.000Z",
      expiresAt: "2026-07-11T00:00:00.000Z",
      validation: { solvable: true, difficultyMatched: true, fallbackUsed: false },
      level: {
        name: "Daily Challenge 2026-07-10",
        description: "A validated daily Arrow Untangle puzzle.",
        difficulty: "MEDIUM",
        definition: {
          attempts: 5,
          arrows: [
            { id: "arrow-0", color: "#4B6BFB", path: [{ row: 0, col: 0 }], direction: "RIGHT" },
          ],
        },
      },
    },
  },
};

describe("Daily challenge contract — GET /daily-challenge", () => {
  it("should_wrap_the_challenge_under_data_challenge", () => {
    expect(FIXTURE.status).toBe("success");
    expect(FIXTURE.data.challenge.seed).toBe("daily-2026-07-10");
  });

  it("should_expose_utc_date_difficulty_and_source_metadata", () => {
    const challenge = FIXTURE.data.challenge;
    expect(challenge.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(["EASY", "MEDIUM", "HARD"]).toContain(challenge.targetDifficulty);
    expect(["gemini", "fallback"]).toContain(challenge.source);
    expect(typeof challenge.validation.fallbackUsed).toBe("boolean");
  });

  it("should_carry_an_anonymous_playable_level_without_a_level_id", () => {
    const level = FIXTURE.data.challenge.level;
    expect("levelId" in level).toBe(false);
    expect(Number.isInteger(level.definition.attempts)).toBe(true);
    const arrow = level.definition.arrows[0];
    expect(arrow).toBeDefined();
    if (!arrow) return;
    expect(typeof arrow.id).toBe("string");
    expect(Array.isArray(arrow.path)).toBe(true);
    expect(["UP", "DOWN", "LEFT", "RIGHT"]).toContain(arrow.direction);
  });
});
