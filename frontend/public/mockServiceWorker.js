/* Mock Service Worker */
/* This is a minimal placeholder so MSW can register during development. */
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", () => self.clients.claim());
self.addEventListener("fetch", () => {});
