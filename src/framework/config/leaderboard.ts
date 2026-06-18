import { LeaderboardFacade } from "@/application/facades/LeaderboardFacade";
import { HttpLeaderboardRepository } from "@/infrastructure/repositories/HttpLeaderboardRepository";
import { LeaderboardViewModel } from "@/presentation/view-models/LeaderboardViewModel";
import { createHttpClient } from "./httpClient";

/**
 * Composition root (framework layer) for the leaderboard MVVM session.
 *
 * Wires the HTTP client → `HttpLeaderboardRepository` → `LeaderboardFacade` →
 * `LeaderboardViewModel`, so a route just asks for a ready ViewModel. This is the
 * single place infrastructure is assembled for the leaderboard path.
 */
export function createLeaderboardViewModel(): LeaderboardViewModel {
  const repository = new HttpLeaderboardRepository(createHttpClient());
  const facade = new LeaderboardFacade(repository);
  return new LeaderboardViewModel(facade);
}
