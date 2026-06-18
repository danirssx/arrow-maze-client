export interface AppSettings {
  language: 'en' | 'es';
  muted: boolean;
}

export interface ISettingsRepository {
  load(): Promise<AppSettings>;
  save(settings: AppSettings): Promise<void>;
}
