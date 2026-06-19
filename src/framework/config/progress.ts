import { ProgressFacade } from "@/application/facades/ProgressFacade";
import { HttpProgressRepository } from "@/infrastructure/repositories/HttpProgressRepository";
import { LocalProgressRepository } from "@/infrastructure/repositories/LocalProgressRepository";
import { AsyncStorageAdapter } from "@/infrastructure/storage/AsyncStorageAdapter";
import { ProgressViewModel } from "@/presentation/view-models/ProgressViewModel";
import { createHttpClient } from "./httpClient";

export function createProgressFacade(): ProgressFacade {
  const storage = new AsyncStorageAdapter();
  return new ProgressFacade(
    new LocalProgressRepository(storage),
    new HttpProgressRepository(createHttpClient()),
  );
}

export function createProgressViewModel(): ProgressViewModel {
  return new ProgressViewModel(createProgressFacade());
}
