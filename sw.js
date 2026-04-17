// Service worker desativado — app usa Firebase + localStorage para persistência
// Este arquivo apenas remove caches antigos e se auto-desregistra

self.addEventListener('install', function() { self.skipWaiting(); });

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys()
      .then(function(keys) { return Promise.all(keys.map(function(k) { return caches.delete(k); })); })
      .then(function() { return self.clients.claim(); })
      .then(function() {
        // Notifica todos os clientes para desregistrar este SW
        return self.clients.matchAll().then(function(clients) {
          clients.forEach(function(c) { c.postMessage({ type: 'SW_UNREGISTER' }); });
        });
      })
  );
});

// Não intercepta nenhuma requisição — passa tudo direto
self.addEventListener('fetch', function() {});
