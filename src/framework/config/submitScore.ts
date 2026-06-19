import { GetCurrentSessionUseCase } from "@/application/auth/GetCurrentSessionUseCase";
import { LeaderboardFacade } from "@/application/facades/LeaderboardFacade";
import { SubmitScoreUseCase } from "@/application/use-cases/game/SubmitScoreUseCase";
import { HttpLeaderboardRepository } from "@/infrastructure/repositories/HttpLeaderboardRepository";
import { AsyncStorageAdapter } from "@/infrastructure/storage/AsyncStorageAdapter";
import { SessionManager } from "@/framework/session/SessionManager";
import { createHttpClient } from "./httpClient";

/**
 * Composition root (framework) for the leaderboard write path: wires the session
 * manager (for the access token), the leaderboard facade, and time-based scoring
 * into a `SubmitScoreUseCase` the game-end trigger can call.
 */
export function createSubmitScoreUseCase(): SubmitScoreUseCase {
  const sessionManager = SessionManager.getInstance(new AsyncStorageAdapter());
  const getSession = new GetCurrentSessionUseCase(sessionManager);
  const leaderboard = new LeaderboardFacade(new HttpLeaderboardRepository(createHttpClient()));
  return new SubmitScoreUseCase(getSession, leaderboard);
}
