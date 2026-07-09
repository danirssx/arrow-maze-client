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
 * to play (level select), leaderboard, progress, and settings. Every card label
 * names its real destination (MAZ-193 — no rewards/daily/social copy for screens
 * that do not exist). It holds no game rules and calls no use cases; every action
 * is an injected callback.
 */
export function HomeScreen({
  coins = 0,
  username,
  onPlay,
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
          </View>

          <View className="gap-3">
            <InfoCard
              testID="home-card-leaderboard"
              icon="🏆"
              title={t("home.cardLeaderboardTitle")}
              subtitle={t("home.cardLeaderboardSubtitle")}
              onPress={onLeaderboard}
            />
            <InfoCard
              testID="home-card-progress"
              icon="📈"
              title={t("home.cardProgressTitle")}
              subtitle={t("home.cardProgressSubtitle")}
              onPress={onProgress}
            />
            <InfoCard
              testID="home-card-settings"
              icon="⚙️"
              title={t("home.cardSettingsTitle")}
              subtitle={t("home.cardSettingsSubtitle")}
              onPress={onSettings}
            />
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
