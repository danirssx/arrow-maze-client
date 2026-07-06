import { I18nLanguageService } from '@/framework/i18n/I18nLanguageService';
import { i18n } from '@/framework/i18n/i18n';

describe('I18nLanguageService', () => {
  it('should_change_the_active_language_to_es', async () => {
    const svc = new I18nLanguageService();
    await svc.changeLanguage('es');
    expect(i18n.language).toBe('es');
  });

  it('should_change_the_active_language_back_to_en', async () => {
    const svc = new I18nLanguageService();
    await svc.changeLanguage('en');
    expect(i18n.language).toBe('en');
  });
});
