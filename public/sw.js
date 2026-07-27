// 账簿 Ledger — 离线缓存 Service Worker（运行时 cache-first）
const CACHE = 'ledger-v1';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  // 仅缓存同源请求；放行字体等跨域资源
  if (url.origin !== self.location.origin) return;

  event.respondWith((async () => {
    const cached = await caches.match(req, { ignoreSearch: false });
    if (cached) return cached;

    try {
      const res = await fetch(req);
      if (res && res.status === 200 && res.type === 'basic') {
        const cache = await caches.open(CACHE);
        cache.put(req, res.clone());
      }
      return res;
    } catch {
      // 离线兜底：导航请求返回缓存的入口
      if (req.mode === 'navigate') {
        const cache = await caches.open(CACHE);
        const fallback =
          (await cache.match('./index.html')) ||
          (await cache.match('index.html')) ||
          (await cache.match(req));
        if (fallback) return fallback;
      }
      return new Response('当前离线且无缓存内容', {
        status: 503,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });
    }
  })());
});
