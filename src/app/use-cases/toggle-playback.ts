import { coreActions, IAppCore } from "@/domain/ports/app-core";

// Flips the isPlaying flag; the store subscription drives the audio element
export const togglePlayback = (appCore: IAppCore): void => {
  const shouldPlay = !appCore.getState().isPlaying;
  appCore.dispatch(coreActions.setIsPlaying(shouldPlay));
};
