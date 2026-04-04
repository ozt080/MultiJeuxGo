self.addEventListener('install', (e) => { console.log('Service Worker installe !'); }); self.addEventListener('fetch', (e) => { e.respondWith(fetch(e.request)); });
