import { useEffect, useMemo } from "react";
import { useRouter } from "expo-router";

import { useAuthSession } from "@/framework/auth/AuthGate";
import { createSettingsViewModel } from "@/framework/config/settings";
import { safeBack } from "@/framework/navigation/safeBack";
import { SettingsScreen } from "@/presentation/screens/SettingsScreen";
import { useViewModelState } from "@/presentation/hooks/useViewModelState";

export default function SettingsRoute() {
  const router = useRouter();
  const { session, clearSession } = useAuthSession();
  const viewModel = useMemo(() => createSettingsViewModel(), []);

  const settings = useViewModelState(viewModel);

  useEffect(() => {
    void viewModel.load();
  }, [viewModel]);

  const handleLogout = () => {
    void clearSession();
  };

  return (
    <SettingsScreen
      settings={settings}
      {...(session !== null ? { username: session.username } : {})}
      onLanguageChange={(language) => void viewModel.setLanguage(language)}
      onMuteChange={(muted) => void viewModel.setMuted(muted)}
      onBack={() => safeBack(router, "/")}
      onLogout={handleLogout}
    />
  );
}
