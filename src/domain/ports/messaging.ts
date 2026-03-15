import type { PlumeMessage } from "../../shared/messages";

export type MessageHandler = (message: PlumeMessage) => void;

/**
 * Port for subscribing to incoming runtime messages in the content-script context.
 * Returns an unsubscribe function — call it during cleanup to avoid memory leaks.
 */
export interface IMessageReceiver {
  onMessage(handler: MessageHandler): () => void;
}

/** Port for broadcasting a typed message to all tabs matching a URL pattern. */
export interface IMessageSender {
  broadcastToTabs(urlPattern: string, message: PlumeMessage): Promise<void>;
}
