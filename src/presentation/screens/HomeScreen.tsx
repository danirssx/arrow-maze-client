import { Pressable, ScrollView, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { Brand } from "@/presentation/components/Brand";
import { CoinBadge } from "@/presentation/components/CoinBadge";
import { Header } from "@/presentation/components/Header";
import { PrimaryButton } from "@/presentation/components/PrimaryButton";
import { ScreenContainer } from "@/presentation/components/ScreenContainer";

interface HomeScreenProps {
  coins?: number;
  username?: string;
  onPlay: () => void;
  onChallenges: () => void;
  onLeaderboard: () => void;
  onProgress: () => void;
  onSettings: () => void;
  onLogout?: () => void;
}

interface InfoCardProps {
  icon: string;
  title: string;
  subtitle: string;
  onPress: () => void;
  testID: string;
}

function InfoCard({ icon, title, subtitle, onPress, testID }: InfoCardProps) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      onPress={onPress}
      className="flex-row items-center gap-4 rounded-2xl bg-background-card border border-border-soft p-4 active:opacity-80"
    >
      <View className="h-11 w-11 items-center justify-center rounded-xl bg-primary-100">
        <Text className="text-xl">{icon}</Text>
      </View>
      <View className="flex-1">
        <Text className="text-base font-bold text-text-primary">{title}</Text>
        <Text className="text-sm text-text-secondary">{subtitle}</Text>
      </View>
      <Text className="text-lg font-bold text-primary-300">›</Text>
    </Pressable>
  );
}

/**
 * MVVM view — home hub.
 *
 * Pure navigation surface: it renders the FlechaGo brand and routes the player
 * to play, challenges, leaderboard, progress, and settings. It holds no game
 * rules and calls no use cases; every action is an injected callback.
 */
export function HomeScreen({
  coins = 0,
  username,
  onPlay,
  onChallenges,
  onLeaderboard,
  onProgress,
  onSettings,
  onLogout
}: HomeScreenProps) {
  const { t } = useTranslation();

  return (
    <ScreenContainer testID="home-screen">
      <Header right={<CoinBadge amount={coins} testID="home-coins" />} />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="gap-8 pb-8">
          <View className="items-center gap-2 pt-4">
            <Brand />
            {username !== undefined ? (
              <View className="items-center gap-1">
                <Text testID="home-username" className="text-sm font-bold text-primary-700">
                  {username}
                </Text>
                {onLogout !== undefined ? (
                  <Pressable testID="home-logout" accessibilityRole="button" onPress={onLogout}>
                    <Text className="text-xs font-semibold text-text-secondary">{t("auth.logout")}</Text>
                  </Pressable>
                ) : null}
              </View>
            ) : null}
            <Text className="text-xs font-semibold uppercase tracking-[3px] text-text-secondary">
              {t("home.greeting")}
            </Text>
            <Text className="text-4xl font-black text-text-primary">{t("home.title")}</Text>
          </View>

          <View className="gap-3">
            <PrimaryButton testID="home-play" label={t("home.play")} onPress={onPlay} />
            <PrimaryButton
              testID="home-challenges"
              label={t("home.challenges")}
              variant="secondary"
              onPress={onChallenges}
            />
          </View>

          <View className="gap-3">
            <InfoCard
              testID="home-card-daily"
              icon="🏆"
              title={t("home.cardDailyTitle")}
              subtitle={t("home.cardDailySubtitle")}
              onPress={onProgress}
            />
            <InfoCard
              testID="home-card-rewards"
              icon="🎁"
              title={t("home.cardRewardsTitle")}
              subtitle={t("home.cardRewardsSubtitle")}
              onPress={onLeaderboard}
            />
            <InfoCard
              testID="home-card-follow"
              icon="➡️"
              title={t("home.cardFollowTitle")}
              subtitle={t("home.cardFollowSubtitle")}
              onPress={onPlay}
            />
          </View>

          <PrimaryButton
            testID="home-settings"
            label={t("nav.settings")}
            variant="secondary"
            onPress={onSettings}
          />
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
