export interface ILanguageService {
  changeLanguage(lang: 'en' | 'es'): Promise<void>;
}
