import { ActivityIndicator, View } from 'react-native';
import { useTranslation } from 'react-i18next';

export function LoadingState() {
  const { t } = useTranslation();
  return (
    <View testID="loading-state" accessibilityLabel={t('states.loading')} className="flex-1 items-center justify-center">
      <ActivityIndicator size="large" />
    </View>
  );
}
