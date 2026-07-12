/**
 * Wire DTOs for GET /daily-challenge (backend MAZ-218).
 *
 * Mirrors the `{ status, data: { challenge } }` envelope exactly. The daily
 * `level` is anonymous — it has no `levelId`/`status`/`version` — so these types
 * intentionally omit those catalog-only fields.
 */

export interface DailyChallengeArrowDto {
  id: string;
  color: string;
  path: { row: number; col: number }[];
  direction: "UP" | "DOWN" | "LEFT" | "RIGHT";
}

export interface DailyChallengeBoardShapeDto {
  type: string;
  cells: { row: number; col: number }[];
}

export interface DailyChallengeLevelDto {
  name: string;
  description: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  definition: {
    attempts: number;
    arrows: DailyChallengeArrowDto[];
    boardShape?: DailyChallengeBoardShapeDto;
  };
  timeLimitSeconds?: number;
}

export interface DailyChallengeValidationDto {
  solvable: boolean;
  difficultyMatched: boolean;
  fallbackUsed: boolean;
}

export interface DailyChallengeDto {
  date: string;
  seed: string;
  targetDifficulty: "EASY" | "MEDIUM" | "HARD";
  source: "gemini" | "fallback";
  generatedAt: string;
  expiresAt: string;
  validation: DailyChallengeValidationDto;
  level: DailyChallengeLevelDto;
}

export interface DailyChallengeResponseDto {
  status: "success";
  data: {
    challenge: DailyChallengeDto;
  };
}
