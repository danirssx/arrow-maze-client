import type { AppSettings, ISettingsRepository } from '@/application/ports/ISettingsRepository';

export class LoadSettingsUseCase {
  constructor(private readonly repo: ISettingsRepository) {}

  async execute(): Promise<AppSettings> {
    return this.repo.load();
  }
}
