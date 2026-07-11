import { useCallback, useMemo } from "react";
import { useFocusEffect } from "expo-router";

import type { MusicTrackKey } from "@/application/ports/IAudioPlayer";
import { createAudioFacade } from "@/framework/config/audio";

export function useScreenMusic(track: MusicTrackKey): void {
  const audio = useMemo(() => createAudioFacade(), []);

  useFocusEffect(
    useCallback(() => {
      void audio.startMusic(track);
      return () => {
        void audio.stopMusic(track);
      };
    }, [audio, track]),
  );
}
