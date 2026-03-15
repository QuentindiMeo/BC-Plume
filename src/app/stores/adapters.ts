import type { BcPlayerPort } from "../../domain/ports/bc-player";
import type { MusicPlayerPort } from "../../domain/ports/music-player";
import type { IMessageReceiver } from "../../domain/ports/messaging";

// Populated once at the composition root (main.ts), before launchPlume() runs
let bcPlayerInstance: BcPlayerPort | null = null;
let musicPlayerInstance: MusicPlayerPort | null = null;

export const registerBcPlayer = (instance: BcPlayerPort): void => {
  bcPlayerInstance = instance;
};

export const registerMusicPlayer = (instance: MusicPlayerPort): void => {
  musicPlayerInstance = instance;
};

export const getBcPlayerInstance = (): BcPlayerPort => {
  if (!bcPlayerInstance) throw new Error("BcPlayerPort not registered — call registerBcPlayer() first.");
  return bcPlayerInstance;
};

export const getMusicPlayerInstance = (): MusicPlayerPort => {
  if (!musicPlayerInstance) throw new Error("MusicPlayerPort not registered — call registerMusicPlayer() first.");
  return musicPlayerInstance;
};

let messageReceiverInstance: IMessageReceiver | null = null;

export const registerMessageReceiver = (receiver: IMessageReceiver): void => {
  messageReceiverInstance = receiver;
};

export const getMessageReceiverInstance = (): IMessageReceiver => {
  if (!messageReceiverInstance)
    throw new Error("IMessageReceiver not registered — call registerMessageReceiver() first.");
  return messageReceiverInstance;
};
