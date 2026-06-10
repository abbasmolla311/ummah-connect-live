// DeenConnect service worker — PWA shell + Web Push for azan alerts.
const CACHE = `deenconnect-${Date.now()}`;
const SHELL = ["/", "/manifest.webmanifest", "/azan.mp3"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  event.respondWith(fetch(req).catch(() => caches.match(req).then((r) => r || caches.match("/"))));
});

// Web push — azan alert from the server.
self.addEventListener("push", (event) => {
  let data = { title: "🕌 Azan time", body: "It is time for prayer", url: "/live", tag: "azan" };
  try {
    if (event.data) data = { ...data, ...event.data.json() };
  } catch {}

  event.waitUntil(
    (async () => {
      // Ask any open tab to play the azan sound.
      const allClients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const c of allClients) c.postMessage({ type: "PLAY_AZAN", payload: data });

      await self.registration.showNotification(data.title, {
        body: data.body,
        icon: "/icon-192.png",
        badge: "/icon-192.png",
        tag: data.tag,
        renotify: true,
        requireInteraction: true,
        vibrate: [200, 100, 200, 100, 400],
        data: { url: data.url, mosqueId: data.mosqueId },
      });
    })(),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/live";
  event.waitUntil(
    (async () => {
      const all = await clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const c of all) {
        if ("focus" in c) {
          c.postMessage({ type: "PLAY_AZAN", payload: { url } });
          return c.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(url);
    })(),
  );
});
