import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

interface EmptyStateProps {
  variant?: 'default' | 'progress' | 'leaderboard';
}

export function EmptyState({ variant = 'default' }: EmptyStateProps) {
  const { t } = useTranslation();

  const message = (() => {
    if (variant === 'progress') return t('states.emptyProgress');
    if (variant === 'leaderboard') return t('states.emptyLeaderboard');
    return t('states.empty');
  })();

  return (
    <View testID="empty-state" className="flex-1 items-center justify-center px-6">
      <Text className="text-center text-base text-text-secondary">{message}</Text>
    </View>
  );
}
