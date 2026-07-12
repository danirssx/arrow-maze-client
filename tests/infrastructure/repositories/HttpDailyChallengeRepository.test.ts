import type { IHttpClient, HttpResponse } from "@/application/ports/IHttpClient";
import { HttpDailyChallengeRepository } from "@/infrastructure/repositories/HttpDailyChallengeRepository";
import type { DailyChallengeResponseDto } from "@/infrastructure/mappers/daily-challenge/DailyChallengeDtos";
import { LevelKind } from "@/application/level-build/LevelDefinition";

class FakeHttpClient implements IHttpClient {
  getResponse: unknown = null;
  lastGetUrl: string | null = null;

  async get<T>(url: string): Promise<HttpResponse<T>> {
    this.lastGetUrl = url;
    return { data: this.getResponse as T, status: 200 };
  }
  async post<T>(): Promise<HttpResponse<T>> { return { data: null as T, status: 200 }; }
  async put<T>(): Promise<HttpResponse<T>> { return { data: null as T, status: 200 }; }
  async delete<T>(): Promise<HttpResponse<T>> { return { data: null as T, status: 200 }; }
}

const NORMAL_RESPONSE: DailyChallengeResponseDto = {
  status: "success",
  data: {
    challenge: {
      date: "2026-07-10",
      seed: "daily-2026-07-10",
      targetDifficulty: "EASY",
      source: "gemini",
      generatedAt: "2026-07-10T04:00:00.000Z",
      expiresAt: "2026-07-11T00:00:00.000Z",
      validation: { solvable: true, difficultyMatched: true, fallbackUsed: false },
      level: {
        name: "Daily Challenge 2026-07-10",
        description: "A validated daily Arrow Untangle puzzle.",
        difficulty: "EASY",
        definition: {
          attempts: 5,
          arrows: [
            { id: "arrow-0", color: "#4B6BFB", path: [{ row: 0, col: 0 }, { row: 0, col: 1 }], direction: "RIGHT" },
          ],
        },
      },
    },
  },
};

const TIMED_SHAPED_RESPONSE: DailyChallengeResponseDto = {
  status: "success",
  data: {
    challenge: {
      date: "2026-07-11",
      seed: "daily-2026-07-11",
      targetDifficulty: "HARD",
      source: "fallback",
      generatedAt: "2026-07-11T04:00:00.000Z",
      expiresAt: "2026-07-12T00:00:00.000Z",
      validation: { solvable: true, difficultyMatched: true, fallbackUsed: true },
      level: {
        name: "Daily Challenge 2026-07-11",
        description: "shaped timed",
        difficulty: "HARD",
        definition: {
          attempts: 6,
          arrows: [
            { id: "a", color: "blue", path: [{ row: 0, col: 0 }], direction: "UP" },
          ],
          boardShape: { type: "CELL_MASK", cells: [{ row: 0, col: 0 }, { row: 1, col: 0 }] },
        },
        timeLimitSeconds: 90,
      },
    },
  },
};

describe("HttpDailyChallengeRepository", () => {
  it("should_request_the_daily_challenge_endpoint", async () => {
    const http = new FakeHttpClient();
    http.getResponse = NORMAL_RESPONSE;
    const repo = new HttpDailyChallengeRepository(http);

    await repo.getDailyChallenge();

    expect(http.lastGetUrl).toBe("/daily-challenge");
  });

  it("should_map_the_challenge_to_a_playable_definition_with_the_seed_as_id", async () => {
    const http = new FakeHttpClient();
    http.getResponse = NORMAL_RESPONSE;
    const repo = new HttpDailyChallengeRepository(http);

    const { definition, meta } = await repo.getDailyChallenge();

    expect(definition.id).toBe("daily-2026-07-10");
    expect(definition.difficulty).toBe("EASY");
    expect(definition.attempts).toBe(5);
    expect(definition.arrows).toHaveLength(1);
    expect(definition.kind).toBe(LevelKind.Normal);
    expect(definition.boardShape).toBeUndefined();
    expect(definition.timeLimitSeconds).toBeUndefined();
    expect(meta).toEqual({
      date: "2026-07-10",
      difficulty: "EASY",
      source: "gemini",
      fallbackUsed: false,
    });
  });

  it("should_carry_board_shape_time_limit_and_fallback_when_present", async () => {
    const http = new FakeHttpClient();
    http.getResponse = TIMED_SHAPED_RESPONSE;
    const repo = new HttpDailyChallengeRepository(http);

    const { definition, meta } = await repo.getDailyChallenge();

    expect(definition.kind).toBe(LevelKind.Timed);
    expect(definition.timeLimitSeconds).toBe(90);
    expect(definition.boardShape?.type).toBe("CELL_MASK");
    expect(definition.boardShape?.cells).toHaveLength(2);
    expect(meta.source).toBe("fallback");
    expect(meta.fallbackUsed).toBe(true);
  });

  it("should_never_produce_a_uuid_id_for_the_daily_level", async () => {
    const http = new FakeHttpClient();
    http.getResponse = NORMAL_RESPONSE;
    const repo = new HttpDailyChallengeRepository(http);

    const { definition } = await repo.getDailyChallenge();

    // A v4 UUID is what the leaderboard/progress guard requires; the daily seed
    // must not look like one, so daily play never submits a score.
    expect(definition.id).not.toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
  });
});
