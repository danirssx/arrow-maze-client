import type { ILanguageService } from '@/application/ports/ILanguageService';
import { i18n } from './i18n';

export class I18nLanguageService implements ILanguageService {
  async changeLanguage(lang: 'en' | 'es'): Promise<void> {
    await i18n.changeLanguage(lang);
  }
}
