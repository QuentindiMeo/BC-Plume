import { TabsMessageSender } from "../infra/adapters/messaging";
import type { IMessageSender } from "../domain/ports/messaging";

export const messageSender: IMessageSender = new TabsMessageSender();
