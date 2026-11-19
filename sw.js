/* خدمة الكاش: الشبكة أولًا للصفحات (مع navigation preload لتسريع البدء)، ولو مفيش نت يرجّع آخر نسخة محفوظة من الصفحة، ولو الصفحة عمرها ما اتحمّلت يعرض offline.html */
const CACHE = 'hakim-pages-v2';
const IMG_CACHE = 'hakim-img-v1', IMG_MAX = 220;      /* صور من نفس الدومين: كاش أولًا + تحديث في الخلفية + تنظيف تلقائي */
const ASSET_CACHE = 'hakim-assets-v1', ASSET_MAX = 140; /* ملفات الأكواد/التنسيق/الخطوط: الشبكة أولًا بمهلة قصيرة، ولو الشبكة بطيئة ينقذك الكاش */
const NET_WAIT = 1500;                                  /* ms: لو الشبكة أبطأ من كده والكاش موجود → الكاش فورًا والتحديث بيكمل في الخلفية */
const OFFLINE_URL = 'offline.html';
const KEEP = [CACHE, IMG_CACHE, ASSET_CACHE];
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then(c => c.add(OFFLINE_URL)).catch(() => {}).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    try { if (self.registration.navigationPreload) await self.registration.navigationPreload.enable(); } catch (er) {}
    const ks = await caches.keys(); await Promise.all(ks.filter(k => KEEP.indexOf(k) < 0).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});
/* مفتاح الكاش من غير بارامترات التحديث الدوري (?v= و ?t=) عشان الكاش ما يتضخّمش */
function keyOf(url) { const u = new URL(url); ['v', 't', '_'].forEach(k => u.searchParams.delete(k)); return u.toString(); }
function trim(ca, max) { return ca.keys().then(ks => { if (ks.length > max) return Promise.all(ks.slice(0, ks.length - max).map(k => ca.delete(k))); }); }
/* الشبكة أولًا بمهلة: لو الشبكة سريعة = دايمًا أحدث نسخة (من غير أي تأخير في ظهور تعديلاتك)، لو بطيئة/واقعة والكاش موجود = الكاش */
function netThenCache(e, r) {
  const key = keyOf(r.url);
  return caches.open(ASSET_CACHE).then(async ca => {
    const hit = await ca.match(key);
    const net = fetch(r).then(res => { if (res.status === 200) { ca.put(key, res.clone()).then(() => trim(ca, ASSET_MAX)).catch(() => {}); } return res; });
    e.waitUntil(net.catch(() => {}));
    if (!hit) return net;
    return Promise.race([net.catch(() => hit), new Promise(res => setTimeout(() => res(hit), NET_WAIT))]);
  });
}
/* خطوط جوجل: الخط نفسه ما بيتغيّرش → كاش أولًا؛ ملف الـCSS بتاعها → كاش + تحديث في الخلفية */
function swr(e, r, name, max) {
  return caches.open(name).then(async ca => {
    const hit = await ca.match(r);
    const net = fetch(r).then(res => { if (res.ok || res.type === 'opaque') { ca.put(r, res.clone()).then(() => trim(ca, max)).catch(() => {}); } return res; }).catch(() => hit);
    e.waitUntil(net.catch(() => {}));
    return hit || net;
  });
}
self.addEventListener('fetch', (e) => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET') return;
  if (u.hostname === 'fonts.gstatic.com' || u.hostname === 'fonts.googleapis.com') { e.respondWith(swr(e, r, ASSET_CACHE, ASSET_MAX)); return; }
  if (u.origin !== location.origin) return;
  if (r.destination === 'image') { e.respondWith(swr(e, r, IMG_CACHE, IMG_MAX)); return; }   /* صور: من الكاش فورًا، وتتحدّث في الخلفية */
  if (r.destination === 'script' || r.destination === 'style' || r.destination === 'font') { e.respondWith(netThenCache(e, r)); return; }
  if (r.mode === 'navigate') {
    e.respondWith((async () => {
      try {
        const res = (await e.preloadResponse) || await fetch(r);
        if (res.ok) { const c = res.clone(); caches.open(CACHE).then(ca => ca.put(r, c)); }
        return res;
      } catch (er) {
        return (await caches.match(r)) || (await caches.match(OFFLINE_URL)) || new Response('', { status: 504, statusText: 'offline' });
      }
    })());
    return;
  }
  e.respondWith(fetch(r).catch(() => caches.match(r).then(m => m || new Response('', { status: 504, statusText: 'offline' }))));
});
