import { Switch, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { i18n as i18nInstance } from '@/framework/i18n/i18n';
import type { AppSettings } from '@/application/ports/ISettingsRepository';

interface SettingsScreenProps {
  settings: AppSettings;
  onLanguageChange: (lang: 'en' | 'es') => void;
  onMuteChange: (muted: boolean) => void;
}

export function SettingsScreen({ settings, onLanguageChange, onMuteChange }: SettingsScreenProps) {
  const { t } = useTranslation();

  const handleLanguageToggle = () => {
    const next = settings.language === 'en' ? 'es' : 'en';
    void i18nInstance.changeLanguage(next);
    onLanguageChange(next);
  };

  return (
    <View testID="settings-screen" className="flex-1 bg-maze-parchment px-6 py-12">
      <Text className="mb-8 text-3xl font-black text-maze-ink">{t('settings.title')}</Text>

      <View className="gap-6">
        <View className="flex-row items-center justify-between rounded-2xl bg-white/70 p-4 shadow-sm">
          <Text className="text-base text-maze-ink">{t('settings.language')}</Text>
          <Text
            testID="language-value"
            accessibilityRole="button"
            onPress={handleLanguageToggle}
            className="font-semibold text-maze-ember"
          >
            {settings.language === 'en' ? t('settings.languageEn') : t('settings.languageEs')}
          </Text>
        </View>

        <View className="flex-row items-center justify-between rounded-2xl bg-white/70 p-4 shadow-sm">
          <Text className="text-base text-maze-ink">{t('settings.sound')}</Text>
          <Switch
            testID="mute-toggle"
            value={!settings.muted}
            onValueChange={(enabled) => onMuteChange(!enabled)}
            accessibilityLabel={settings.muted ? t('settings.unmute') : t('settings.mute')}
          />
        </View>
      </View>
    </View>
  );
}
