import { AudioFacade } from "@/infrastructure/audio/AudioFacade";
import { ExpoAudioAdapter } from "@/infrastructure/audio/ExpoAudioAdapter";

export function createAudioFacade(): AudioFacade {
  return AudioFacade.getInstance(new ExpoAudioAdapter());
}
