import type { ILevelCatalogRepository } from "@/application/ports/ILevelCatalogRepository";
import { HttpLevelCatalogRepository } from "@/infrastructure/repositories/HttpLevelCatalogRepository";
import { LevelSelectViewModel } from "@/presentation/view-models/LevelSelectViewModel";
import { createHttpClient } from "./httpClient";

export function createLevelCatalogRepository(): ILevelCatalogRepository {
  return new HttpLevelCatalogRepository(createHttpClient());
}

export function createLevelSelectViewModel(): LevelSelectViewModel {
  return new LevelSelectViewModel(createLevelCatalogRepository());
}
