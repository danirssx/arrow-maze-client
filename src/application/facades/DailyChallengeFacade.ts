// Pattern: Facade — ViewModels interact only with this; never with HTTP directly
import type { DailyChallenge, IDailyChallengeRepository } from "@/application/ports/IDailyChallengeRepository";

export class DailyChallengeFacade {
  constructor(private readonly repository: IDailyChallengeRepository) {}

  async getDailyChallenge(): Promise<DailyChallenge> {
    return this.repository.getDailyChallenge();
  }
}
