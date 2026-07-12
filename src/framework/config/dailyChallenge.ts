import { DailyChallengeFacade } from "@/application/facades/DailyChallengeFacade";
import type { IDailyChallengeRepository } from "@/application/ports/IDailyChallengeRepository";
import { HttpDailyChallengeRepository } from "@/infrastructure/repositories/HttpDailyChallengeRepository";
import { DailyChallengeViewModel } from "@/presentation/view-models/DailyChallengeViewModel";
import { createHttpClient } from "./httpClient";

/**
 * Composition root (framework layer) for the daily-challenge MVVM session.
 *
 * Wires the HTTP client → `HttpDailyChallengeRepository` → `DailyChallengeFacade`
 * → `DailyChallengeViewModel`, so a route just asks for a ready ViewModel. This
 * is the single place infrastructure is assembled for the daily-challenge path.
 */
export function createDailyChallengeRepository(): IDailyChallengeRepository {
  return new HttpDailyChallengeRepository(createHttpClient());
}

export function createDailyChallengeFacade(): DailyChallengeFacade {
  return new DailyChallengeFacade(createDailyChallengeRepository());
}

export function createDailyChallengeViewModel(): DailyChallengeViewModel {
  return new DailyChallengeViewModel(createDailyChallengeFacade());
}
