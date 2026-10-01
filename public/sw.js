// RevTrack service worker.
// - Build assets and icons: cache-first.
// - /excise: network-first with an offline fallback (its HTML holds no personal data).
// - Other pages: network only, with /offline.html when offline. Private pages and API calls are never cached.
// - Push: shows reminders and opens the right screen on tap.
const CACHE = "revtrack-static-v2";
const PRECACHE = ["/offline.html", "/manifest.webmanifest", "/icons/icon-192.png", "/icons/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;

  if (req.mode === "navigate") {
    if (url.pathname === "/excise") {
      event.respondWith(
        fetch(req)
          .then((res) => {
            if (res.ok) {
              const copy = res.clone();
              caches.open(CACHE).then((c) => c.put("/excise", copy));
            }
            return res;
          })
          .catch(() => caches.match("/excise").then((hit) => hit || caches.match("/offline.html")))
      );
      return;
    }
    event.respondWith(fetch(req).catch(() => caches.match("/offline.html")));
    return;
  }

  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/")) {
    event.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
            return res;
          })
      )
    );
  }
});

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { body: event.data ? event.data.text() : "" };
  }
  event.waitUntil(
    self.registration.showNotification(data.title || "RevTrack", {
      body: data.body || "",
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      tag: data.tag,
      data: { url: data.url || "/notifications" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  let target = "/notifications";
  try {
    const u = new URL((event.notification.data && event.notification.data.url) || "/notifications", self.location.origin);
    if (u.origin === self.location.origin) target = u.pathname + u.search;
  } catch (e) {}
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const c of list) {
        if ("focus" in c) {
          if ("navigate" in c) c.navigate(target);
          return c.focus();
        }
      }
      return self.clients.openWindow(target);
    })
  );
});
