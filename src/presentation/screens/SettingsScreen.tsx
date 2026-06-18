import { Switch, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { i18n as i18nInstance } from '@/framework/i18n/i18n';
import type { AppSettings } from '@/application/ports/ISettingsRepository';
import { Header } from '@/presentation/components/Header';
import { ScreenContainer } from '@/presentation/components/ScreenContainer';

interface SettingsScreenProps {
  settings: AppSettings;
  onLanguageChange: (lang: 'en' | 'es') => void;
  onMuteChange: (muted: boolean) => void;
  onBack?: () => void;
}

/**
 * MVVM view — settings.
 *
 * Controlled presentation surface for language and mute. State and persistence
 * live in `SettingsViewModel`; this screen only renders settings and emits
 * intents through the injected callbacks.
 */
export function SettingsScreen({ settings, onLanguageChange, onMuteChange, onBack }: SettingsScreenProps) {
  const { t } = useTranslation();

  const handleLanguageToggle = () => {
    const next = settings.language === 'en' ? 'es' : 'en';
    void i18nInstance.changeLanguage(next);
    onLanguageChange(next);
  };

  return (
    <ScreenContainer testID="settings-screen">
      <Header title={t('settings.title')} onBack={onBack} />

      <View className="mt-4 gap-4">
        <View className="flex-row items-center justify-between rounded-2xl bg-background-card border border-border-soft p-4">
          <Text className="text-base text-text-primary">{t('settings.language')}</Text>
          <Text
            testID="language-value"
            accessibilityRole="button"
            onPress={handleLanguageToggle}
            className="font-semibold text-primary-700"
          >
            {settings.language === 'en' ? t('settings.languageEn') : t('settings.languageEs')}
          </Text>
        </View>

        <View className="flex-row items-center justify-between rounded-2xl bg-background-card border border-border-soft p-4">
          <Text className="text-base text-text-primary">{t('settings.sound')}</Text>
          <Switch
            testID="mute-toggle"
            value={!settings.muted}
            onValueChange={(enabled) => onMuteChange(!enabled)}
            accessibilityLabel={settings.muted ? t('settings.unmute') : t('settings.mute')}
          />
        </View>
      </View>
    </ScreenContainer>
  );
}
