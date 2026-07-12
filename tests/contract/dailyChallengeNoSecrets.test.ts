import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * @s6 — the mobile side must know nothing about Gemini or secrets. Generation and
 * any keys/prompts stay 100% backend; the client only references the public
 * `/daily-challenge` endpoint.
 */
const DAILY_CHALLENGE_SOURCES = [
  "src/application/ports/IDailyChallengeRepository.ts",
  "src/application/facades/DailyChallengeFacade.ts",
  "src/infrastructure/mappers/daily-challenge/DailyChallengeDtos.ts",
  "src/infrastructure/mappers/daily-challenge/DailyChallengeMapper.ts",
  "src/infrastructure/repositories/HttpDailyChallengeRepository.ts",
  "src/presentation/view-models/DailyChallengeViewModel.ts",
  "src/presentation/screens/DailyChallengeScreen.tsx",
  "src/framework/config/dailyChallenge.ts",
  "app/daily-challenge.tsx",
];

// The wire `source: "gemini" | "fallback"` label is public and allowed; what must
// never appear on mobile is a key, prompt, or generator internal.
const FORBIDDEN = /GEMINI_API_KEY|EXPO_PUBLIC_GEMINI|apiKey|api_key|generateContent|generativelanguage|@google\/gen/i;

describe("Daily challenge — no Gemini secrets on mobile", () => {
  it.each(DAILY_CHALLENGE_SOURCES)("should_not_reference_gemini_keys_or_generators_in_%s", (relativePath) => {
    const source = readFileSync(join(process.cwd(), relativePath), "utf8");
    expect(source).not.toMatch(FORBIDDEN);
  });

  it("should_only_reference_the_public_daily_challenge_endpoint", () => {
    const repo = readFileSync(
      join(process.cwd(), "src/infrastructure/repositories/HttpDailyChallengeRepository.ts"),
      "utf8",
    );
    expect(repo).toContain("/daily-challenge");
  });
});
