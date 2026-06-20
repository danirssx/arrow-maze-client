// Pattern: Adapter, Repository
import type { ILevelCatalogRepository, LevelCatalogSummary } from "@/application/ports/ILevelCatalogRepository";
import type { LevelDefinition } from "@/application/level-build/LevelDefinition";
import type { IHttpClient } from "@/application/ports/IHttpClient";
import type { LevelResponseDto, LevelsResponseDto } from "@/infrastructure/mappers/level-catalog/LevelCatalogDtos";
import { LevelCatalogMapper } from "@/infrastructure/mappers/level-catalog/LevelCatalogMapper";

export class HttpLevelCatalogRepository implements ILevelCatalogRepository {
  constructor(private readonly http: IHttpClient) {}

  async getLevels(): Promise<readonly LevelCatalogSummary[]> {
    const res = await this.http.get<LevelsResponseDto>("/levels");
    return res.data.data.levels.map((level) => LevelCatalogMapper.toSummary(level));
  }

  async getLevelDefinition(levelId: string): Promise<LevelDefinition> {
    const res = await this.http.get<LevelResponseDto>(`/levels/${levelId}`);
    return LevelCatalogMapper.toDefinition(res.data.data.level);
  }
}
