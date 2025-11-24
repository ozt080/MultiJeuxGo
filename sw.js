const CACHE_NAME = "multijeuxgo-v1";
const ASSETS = [
  "/MultiJeuxGo/",
  "/MultiJeuxGo/index.html",
  "/MultiJeuxGo/style.css",
  "/MultiJeuxGo/manifest.json",
  "/MultiJeuxGo/icons/icon-192.png",
  "/MultiJeuxGo/icons/icon-256.png",
  "/MultiJeuxGo/icons/icon-384.png",
  "/MultiJeuxGo/icons/icon-512.png",
  "/MultiJeuxGo/morpion.html",
  "/MultiJeuxGo/quiz.html",
  "/MultiJeuxGo/foot.html",
  "/MultiJeuxGo/uno.html",
  "/MultiJeuxGo/ludo.html",
  "/MultiJeuxGo/bowling.html"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => (k !== CACHE_NAME ? caches.delete(k) : null)))
    )
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open("multi-jeuxgo-cache").then((cache) => {
      return cache.addAll([
        "/",
        "/index.html",
        "/style.css",
        "/script.js",
        "/login.html",
        "/register.html",
        "/profil.html"
      ]);
    })
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
