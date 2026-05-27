import { onMessage } from "../shared/runtime/messaging";

chrome.runtime.onInstalled.addListener((details) => {
  console.log("[SW] installed", { reason: details.reason, at: new Date().toISOString() });
});

chrome.runtime.onStartup.addListener(() => {
  console.log("[SW] startup at", new Date().toISOString());
});

onMessage((msg) => {
  switch (msg.type) {
    case "PING": {
      console.log("[SW] PING received");
      return { type: "PONG", receivedAt: new Date().toISOString() };
    }
    case "PONG":
      return;
  }
});

console.log("[SW] booted at", new Date().toISOString());
