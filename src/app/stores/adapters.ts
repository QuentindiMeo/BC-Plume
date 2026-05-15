import type { BcPlayerPort } from "@/domain/ports/bc-player";
import type { IMessageReceiver } from "@/domain/ports/messaging";
import type { MusicPlayerPort } from "@/domain/ports/music-player";
import type { TrackAudioPort } from "@/domain/ports/track-audio";
import type { AudioVisualizerPort } from "@/domain/ports/visualizer";
import { AdapterNotRegisteredError } from "@/shared/errors";

// Populated once at the composition root (main.ts), before launchPlume() runs
let bcPlayerInstance: BcPlayerPort | null = null;
let musicPlayerInstance: MusicPlayerPort | null = null;
let messageReceiverInstance: IMessageReceiver | null = null;
let trackAudioInstance: TrackAudioPort | null = null;
let visualizerInstance: AudioVisualizerPort | null = null;

export const registerBcPlayer = (instance: BcPlayerPort): void => {
  bcPlayerInstance = instance;
};

export const registerMusicPlayer = (instance: MusicPlayerPort): void => {
  musicPlayerInstance = instance;
};

export const registerMessageReceiver = (receiver: IMessageReceiver): void => {
  messageReceiverInstance = receiver;
};

export const registerTrackAudio = (instance: TrackAudioPort): void => {
  trackAudioInstance = instance;
};

export const registerVisualizer = (instance: AudioVisualizerPort): void => {
  visualizerInstance = instance;
};

export const getBcPlayerInstance = (): BcPlayerPort => {
  if (!bcPlayerInstance) throw new AdapterNotRegisteredError("BcPlayerPort", registerBcPlayer.name);
  return bcPlayerInstance;
};

export const getMusicPlayerInstance = (): MusicPlayerPort => {
  if (!musicPlayerInstance) throw new AdapterNotRegisteredError("MusicPlayerPort", registerMusicPlayer.name);
  return musicPlayerInstance;
};

export const getMessageReceiverInstance = (): IMessageReceiver => {
  if (!messageReceiverInstance) throw new AdapterNotRegisteredError("IMessageReceiver", registerMessageReceiver.name);
  return messageReceiverInstance;
};

export const getTrackAudioInstance = (): TrackAudioPort => {
  if (!trackAudioInstance) throw new AdapterNotRegisteredError("TrackAudioPort", registerTrackAudio.name);
  return trackAudioInstance;
};

export const getVisualizerInstance = (): AudioVisualizerPort => {
  if (!visualizerInstance) throw new AdapterNotRegisteredError("AudioVisualizerPort", registerVisualizer.name);
  return visualizerInstance;
};
