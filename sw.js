/* Service worker — VMNI Urgencias. Precacheo + stale-while-revalidate:
   la app funciona sin conexión y se actualiza sola en segundo plano. */
const CACHE = "vmni-v1.0.1";
const FICHEROS = [
  "./",
  "./index.html",
  "./style.css",
  "./script.js",
  "./motor.js",
  "./sim.js",
  "./datos/reglas.json",
  "./datos/docencia.js",
  "./manifest.webmanifest",
  "./iconos/icono-192.png",
  "./iconos/icono-512.png",
  "./iconos/icono-180.png",
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FICHEROS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(claves => Promise.all(claves.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin) return;
  e.respondWith(
    caches.open(CACHE).then(async c => {
      const enCache = await c.match(e.request);
      const red = fetch(e.request)
        .then(r => { if (r && r.ok) c.put(e.request, r.clone()); return r; })
        .catch(() => enCache);
      return enCache || red;
    })
  );
});
