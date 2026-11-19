/* حاجز مانع الإعلانات — وحدة مستقلة (مجلد adwall/). بتتحمّل تلقائيًا في كل صفحات الموقع الحالية والجديدة من urls.js،
   ومفيش أي صفحة محتاجة تعديل. بتتفعّل/تتقفل من الأدمن ← الإعدادات العامة (SITE_SETTINGS.adwall). */
(function () {
  'use strict';
  if (window.__hkAdwall) return; window.__hkAdwall = true;
  var FLAG = 'hk_adwall_t', OKK = 'hk_adwall_ok';
  var path = location.pathname;
  if (window.__HAKIM_PREVIEW || /(^|\/)(admin|maintenance|offline)(\.html)?$/.test(path)) return;
  if (/bot|crawl|spider|slurp|bing|facebookexternalhit|whatsapp|telegram|preview|lighthouse|headless|pagespeed/i.test(navigator.userAgent || '')) return;   /* محركات البحث والمعاينات ما تشوفش الحاجز */
  function sj(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } }
  function ss(k, v) { try { if (v === null) sessionStorage.removeItem(k); else sessionStorage.setItem(k, v); } catch (e) {} }
  try { var ctl = JSON.parse(localStorage.getItem('hakim_ctl') || 'null'); if (ctl && ctl.ads_off) return; } catch (e) {}   /* حساب بدون إعلانات (VIP/تكريم): مفيش داعي يقفل المانع */
  function loadOnce(file, cb) { var s = document.createElement('script'); s.src = new URL(file + '?v=' + Math.floor(Date.now() / 30000), document.baseURI).href; s.onload = s.onerror = function () { cb(); }; document.head.appendChild(s); }
  function T(k, d) { var t = window.SITE_TEXT || {}; return t[k] || d; }
  function whenSettings(cb) { var n = 0, iv = setInterval(function () { if (window.SITE_SETTINGS || ++n > 25) { clearInterval(iv); if (window.SITE_SETTINGS) cb(); else loadOnce('site-settings.js', function () { if (window.SITE_SETTINGS) cb(); }); } }, 100); }

  /* ---------- كشف المانع: عنصر طُعم (مخفي = مانع) + طلب شبكة لسكربت إعلانات (فشل = مانع) مع طلب تحكّم للتأكد إن النت شغّال ---------- */
  function detect() {
    return new Promise(function (resolve) {
      var done = false, cosmetic = false, cosmeticDone = false, net = null, bait = document.createElement('div');
      bait.className = 'adsbox ad-banner ad-placement adsbygoogle pub_300x250 textads banner-ads';
      bait.setAttribute('style', 'position:absolute;left:-9999px;top:-9999px;width:300px;height:250px;pointer-events:none');
      bait.innerHTML = '&nbsp;'; document.body.appendChild(bait);
      function finish() { if (done || net === null || !cosmeticDone) return; done = true; if (bait.parentNode) bait.parentNode.removeChild(bait); resolve(cosmetic || net); }
      setTimeout(function () { var cs = getComputedStyle(bait); cosmetic = !bait.offsetHeight || cs.display === 'none' || cs.visibility === 'hidden'; cosmeticDone = true; finish(); if (net === null) setTimeout(function () { if (net === null) { net = false; finish(); } }, 2500); }, 150);
      var control = fetch(new URL('manifest.json?c=' + Date.now(), document.baseURI).href, { cache: 'no-store' }).then(function (r) { return r.ok; }).catch(function () { return false; });
      var ad = fetch('https://static.doubleclick.net/instream/ad_status.js', { mode: 'no-cors', cache: 'no-store' }).then(function () { return false; }).catch(function () { return true; });
      Promise.all([control, ad]).then(function (r) { net = r[0] ? r[1] : false; finish(); });
    });
  }

  /* ---------- النافذة ---------- */
  function show(retry) {
    if (document.getElementById('hkWall')) return;
    var st = document.createElement('style');
    st.textContent = '#hkWall{position:fixed;inset:0;z-index:2147483000;display:grid;place-items:center;padding:16px;background:rgba(5,5,8,.94);backdrop-filter:blur(6px);font-family:inherit;direction:rtl}#hkWall .hkw{width:min(520px,100%);max-height:96vh;overflow:auto;background:#15151a;border:2px solid #e5202c;border-radius:20px;padding:22px 20px;text-align:center;color:#f2f2f5;box-shadow:0 20px 60px rgba(0,0,0,.6)}#hkWall h2{margin:0 0 8px;font-size:clamp(1.25rem,5vw,1.6rem);color:#ff3b47}#hkWall p{margin:8px 0;line-height:1.9;color:#d7d7df}#hkWall ol{text-align:right;margin:12px auto;padding-inline-start:22px;max-width:420px;color:#f2f2f5;line-height:1.9}#hkWall .hkw-btn{display:block;width:100%;margin-top:14px;padding:14px 16px;border:0;border-radius:14px;background:linear-gradient(180deg,#ff4552,#e5202c);color:#fff;font:inherit;font-weight:800;font-size:1.1rem;cursor:pointer}#hkWall .hkw-retry{margin-top:10px;padding:10px 12px;border-radius:12px;background:rgba(255,201,77,.14);border:1px solid #ffc94d;color:#ffe3a0;font-weight:700}';
    document.head.appendChild(st);
    var steps = T('adwallSteps', 'اضغط على أيقونة مانع الإعلانات في شريط المتصفح • اختار «إيقاف على هذا الموقع» (Pause / Disable on this site) • ارجع هنا واضغط «اختبر الآن»').split('•').map(function (x) { return x.trim(); }).filter(Boolean);
    var w = document.createElement('div'); w.id = 'hkWall'; w.setAttribute('role', 'dialog'); w.setAttribute('aria-modal', 'true'); w.setAttribute('aria-labelledby', 'hkWallT');
    function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
    w.innerHTML = '<div class="hkw"><div style="font-size:2.4rem;line-height:1">🛡️</div><h2 id="hkWallT">' + esc(T('adwallTitle', 'من فضلك أغلق مانع الإعلانات 🙏')) + '</h2><p>' + esc(T('adwallBody', 'الموقع مجاني وبدون اشتراكات، والإعلانات هي اللي بتغطّي تكلفة الاستضافة والسيرفرات. أوقف مانع الإعلانات على الموقع ده وبعدها اضغط زر الاختبار.')) + '</p><ol>' + steps.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ol>' + (retry ? '<div class="hkw-retry">' + esc(T('adwallRetry', 'المانع لسه شغّال 😕 — تأكد إنك أوقفته على الموقع ده بالذات، وبعدها اضغط «اختبر الآن» تاني.')) + '</div>' : '') + '<button type="button" class="hkw-btn" id="hkWallBtn">' + esc(T('adwallBtn', '✅ أغلقت المانع — اختبر الآن')) + '</button></div>';
    document.body.appendChild(w); document.documentElement.style.overflow = 'hidden';
    document.getElementById('hkWallBtn').onclick = function () { ss(FLAG, '1'); ss(OKK, null); location.reload(); };   /* الاختبار = ريفريش + إعادة الكشف: لو اتقفل يدخل عادي، لو لسه النافذة بترجع */
    try { new MutationObserver(function () { if (!document.getElementById('hkWall') && w.__alive) { w.__alive = false; document.body.appendChild(w); setTimeout(function () { w.__alive = true; }, 50); } }).observe(document.body, { childList: true }); w.__alive = true; } catch (e) {}
  }

  function run() {
    var retry = sj(FLAG) === '1';
    if (!retry && sj(OKK) === '1') return;   /* اتأكدنا قبل كده في الجلسة دي إن مفيش مانع */
    detect().then(function (blocked) {
      if (blocked) { var go = function () { show(retry); }; if (window.SITE_TEXT) go(); else loadOnce('site-text.js', go); }
      else { ss(FLAG, null); ss(OKK, '1'); }
    });
  }
  function start() { whenSettings(function () { if (window.SITE_SETTINGS && window.SITE_SETTINGS.adwall) run(); }); }
  if (document.body) start(); else document.addEventListener('DOMContentLoaded', start);
})();
