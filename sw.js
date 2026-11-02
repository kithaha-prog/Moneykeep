/* 盖章记账 离线缓存：先用缓存秒开，同时后台更新（改了文件后，下次打开生效） */
const V = 'ledger-cache-v1-10';
const CORE = ['./ledger-1-10.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(V)
      .then(c => Promise.allSettled(CORE.map(u => c.add(u))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET' || new URL(r.url).origin !== location.origin) return;
  e.respondWith(
    caches.match(r, { ignoreSearch: true }).then(hit => {
      const net = fetch(r).then(res => {
        if (res && res.ok) { const cp = res.clone(); caches.open(V).then(c => c.put(r, cp)); }
        return res;
      }).catch(() => hit || (r.mode === 'navigate' ? caches.match('./ledger-1-10.html') : Response.error()));
      return hit || net;
    })
  );
});
