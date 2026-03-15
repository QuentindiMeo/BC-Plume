import type { IMessageReceiver, IMessageSender, MessageHandler } from "../../domain/ports/messaging";
import { inferBrowserApi } from "../../shared/browser";
import type { PlumeMessage } from "../../shared/messages";

export const createRuntimeMessageReceiver = (): IMessageReceiver => {
  const onMessage = (handler: MessageHandler): (() => void) => {
    const browserApi = inferBrowserApi();
    // Narrow unknown → PlumeMessage at the boundary before the app layer ever sees the value
    const listener = (message: unknown) => {
      if (message !== null && typeof message === "object" && "type" in (message as object)) {
        handler(message as PlumeMessage);
      }
    };
    browserApi.runtime.onMessage.addListener(listener);
    return () => browserApi.runtime.onMessage.removeListener(listener);
  };
  return { onMessage };
};

export const createTabsMessageSender = (): IMessageSender => {
  const broadcastToTabs = async (urlPattern: string, message: PlumeMessage): Promise<void> => {
    const browser = inferBrowserApi();
    if (!browser.tabs) return;

    const tabs: { id?: number }[] = await browser.tabs.query({ url: urlPattern }).catch(() => []);
    for (const tab of tabs) {
      if (tab.id !== undefined) {
        browser.tabs.sendMessage(tab.id, message).catch(() => {});
      }
    }
  };
  return { broadcastToTabs };
};
