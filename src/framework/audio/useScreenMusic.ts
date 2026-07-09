import { useEffect, useMemo } from "react";

import type { MusicTrackKey } from "@/application/ports/IAudioPlayer";
import { createAudioFacade } from "@/framework/config/audio";

export function useScreenMusic(track: MusicTrackKey): void {
  const audio = useMemo(() => createAudioFacade(), []);

  useEffect(() => {
    void audio.startMusic(track);
    return () => {
      void audio.stopMusic(track);
    };
  }, [audio, track]);
}
