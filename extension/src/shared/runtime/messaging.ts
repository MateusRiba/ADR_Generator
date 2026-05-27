import type { RuntimeMessage } from "../types/messages";

export async function sendMessage<T extends RuntimeMessage>(
  msg: T
): Promise<RuntimeMessage> {
  const response = await chrome.runtime.sendMessage(msg);
  if (!isRuntimeMessage(response)) {
    throw new Error(
      `Resposta inválida do listener para ${msg.type}: ${JSON.stringify(response)}`
    );
  }
  return response;
}

export type MessageHandler = (
  msg: RuntimeMessage,
  sender: chrome.runtime.MessageSender
) => Promise<RuntimeMessage | void> | RuntimeMessage | void;

export function onMessage(handler: MessageHandler): void {
  chrome.runtime.onMessage.addListener((raw, sender, sendResponse) => {
    if (!isRuntimeMessage(raw)) return false;
    const result = handler(raw, sender);
    if (result instanceof Promise) {
      result
        .then((response) => sendResponse(response))
        .catch((err) => {
          console.error("[messaging] handler rejeitou", err);
          sendResponse(undefined);
        });
      return true;
    }
    sendResponse(result);
    return false;
  });
}

function isRuntimeMessage(value: unknown): value is RuntimeMessage {
  return (
    typeof value === "object" &&
    value !== null &&
    "type" in value &&
    typeof (value as { type: unknown }).type === "string"
  );
}
