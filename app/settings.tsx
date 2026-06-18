import { useEffect, useMemo } from "react";
import { useRouter } from "expo-router";

import { AudioFacade } from "@/infrastructure/audio/AudioFacade";
import { ExpoAudioAdapter } from "@/infrastructure/audio/ExpoAudioAdapter";
import { AsyncStorageAdapter } from "@/infrastructure/storage/AsyncStorageAdapter";
import { SettingsRepository } from "@/infrastructure/storage/SettingsRepository";
import { SettingsScreen } from "@/presentation/screens/SettingsScreen";
import { useViewModelState } from "@/presentation/hooks/useViewModelState";
import { SettingsViewModel } from "@/presentation/view-models/SettingsViewModel";

export default function SettingsRoute() {
  const router = useRouter();
  const viewModel = useMemo(() => {
    const repository = new SettingsRepository(new AsyncStorageAdapter());
    const audio = AudioFacade.getInstance(new ExpoAudioAdapter());
    return new SettingsViewModel(repository, audio);
  }, []);

  const settings = useViewModelState(viewModel);

  useEffect(() => {
    void viewModel.load();
  }, [viewModel]);

  return (
    <SettingsScreen
      settings={settings}
      onLanguageChange={(language) => void viewModel.setLanguage(language)}
      onMuteChange={(muted) => void viewModel.setMuted(muted)}
      onBack={() => router.back()}
    />
  );
}
