import { Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { AppErrorCode } from '@/infrastructure/http/HttpError';

interface ErrorStateProps {
  code?: AppErrorCode;
  onRetry?: () => void;
}

export function ErrorState({ code, onRetry }: ErrorStateProps) {
  const { t } = useTranslation();

  const message = (() => {
    if (code === 'NETWORK_ERROR') return t('errors.network');
    if (code === 'NOT_FOUND') return t('errors.notFound');
    if (code === 'UNAUTHORIZED') return t('errors.unauthorized');
    return t('errors.generic');
  })();

  return (
    <View testID="error-state" className="flex-1 items-center justify-center gap-4 px-6">
      <Text className="text-center text-base text-maze-slate">{message}</Text>
      {onRetry !== undefined ? (
        <Pressable
          accessibilityRole="button"
          onPress={onRetry}
          className="rounded-full bg-maze-ember px-5 py-3 active:opacity-80"
        >
          <Text className="font-bold text-white">{t('errors.retry')}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
