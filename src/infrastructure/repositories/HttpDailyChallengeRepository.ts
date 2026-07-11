// Pattern: Adapter, Repository
import type { DailyChallenge, IDailyChallengeRepository } from "@/application/ports/IDailyChallengeRepository";
import type { IHttpClient } from "@/application/ports/IHttpClient";
import { DailyChallengeMapper } from "@/infrastructure/mappers/daily-challenge/DailyChallengeMapper";
import type { DailyChallengeResponseDto } from "@/infrastructure/mappers/daily-challenge/DailyChallengeDtos";

export class HttpDailyChallengeRepository implements IDailyChallengeRepository {
  constructor(private readonly http: IHttpClient) {}

  async getDailyChallenge(): Promise<DailyChallenge> {
    const res = await this.http.get<DailyChallengeResponseDto>("/daily-challenge");
    return DailyChallengeMapper.toDailyChallenge(res.data.data.challenge);
  }
}
