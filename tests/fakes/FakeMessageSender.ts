import type { PlumeMessage } from "@/domain/messages";
import type { IMessageSender } from "@/domain/ports/messaging";

/**
 * In-memory IMessageSender for tests. Accumulates all broadcasts so tests
 * can assert on observable state rather than on call interactions.
 */
export class FakeMessageSender implements IMessageSender {
  readonly broadcasts: { urlPattern: string; message: PlumeMessage }[] = [];

  async broadcastToTabs(urlPattern: string, message: PlumeMessage): Promise<void> {
    this.broadcasts.push({ urlPattern, message });
  }
}
