// ===== m19.5 PWA / iPhone fullscreen helper (?pwa=0 or ?m195=0 = off).
// iPhone Safari has no element Fullscreen API (iPad does), so a tab can never go fullscreen on iPhone.
// The real path is Add to Home Screen -> standalone web app. This module:
//  - makes sure the standalone meta tags + a working apple-touch-icon exist (data-URI fallback when icons/ 404s, e.g. githack)
//  - on iPhone in a browser tab, turns every fullscreen request (first pad press, TAP TO START, OPTIONS > FULLSCREEN)
//    into a short steps card instead of a silent failure, and shows it once per session at the title
//  - in standalone mode, marks M195.pwaState.standalone so layout uses the whole screen (black-translucent bar)
(function () {
  if (!window.M195 || !M195.pwa) return;
  try {
    const ua = navigator.userAgent || '';
    const isIPhone = /iPhone|iPod/.test(ua);
    const isIPad = /iPad/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const standalone = navigator.standalone === true || !!(window.matchMedia && matchMedia('(display-mode: standalone), (display-mode: fullscreen)').matches);
    const S = M195.pwaState = { isIPhone, isIPad, standalone, cards: 0, iconFallback: false, err: [] };
    const ICON = 'data:image/png;base64,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';
    S.ICON = ICON;
    function meta(n, c) { let m = document.querySelector('meta[name="' + n + '"]'); if (!m) { m = document.createElement('meta'); m.name = n; document.head.appendChild(m); } m.content = c; }
    meta('apple-mobile-web-app-capable', 'yes'); meta('mobile-web-app-capable', 'yes');
    meta('apple-mobile-web-app-status-bar-style', 'black-translucent'); meta('apple-mobile-web-app-title', 'UNYIELDING');
    // apple-touch-icon: keep the file if it loads, otherwise use the embedded copy
    let link = document.querySelector('link[rel="apple-touch-icon"]');
    if (!link) { link = document.createElement('link'); link.rel = 'apple-touch-icon'; document.head.appendChild(link); }
    if (!/^data:/.test(link.getAttribute('href') || '')) {
      const im = new Image();
      im.onerror = () => { link.href = ICON; S.iconFallback = true; };
      im.src = link.getAttribute('href') || 'icons/apple-touch-icon.png';
    }
    if (standalone) document.documentElement.classList.add('m195-standalone');
    if (!isIPhone || standalone) return;

    // ---- iPhone in a Safari/Chrome tab ----
    const inChrome = /CriOS/.test(ua), inOther = /FxiOS|EdgiOS/.test(ua);
    let card = null, cardT = 0;
    function hide() { if (card) { card.remove(); card = null; } }
    function show(why) {
      if (card) return;
      S.cards++; S.last = why;
      const d = document.createElement('div'); d.id = 'm195pwa';
      d.style.cssText = 'position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(8,3,12,0.86);color:#ffe080;font:15px/1.45 monospace;text-align:left;z-index:10000;padding:env(safe-area-inset-top) 20px env(safe-area-inset-bottom);letter-spacing:0.05em;';
      const share = inChrome ? 'tap <b>Share</b> (box with arrow, top right)' : 'tap <b>Share</b> (box with arrow) — on iOS 26 tap <b>•••</b> first, then Share';
      d.innerHTML = '<div style="max-width:30em;border:1px solid #6a1040;padding:16px 20px;background:#120818">' +
        '<div style="text-align:center;margin-bottom:8px">IPHONE FULLSCREEN</div>' +
        '<div style="color:#d8c8ff;font-size:13px">iPhone browsers can\'t go fullscreen in a tab. Install it once:<br>' +
        '1. Open this link in <b>Safari</b>' + (inChrome || inOther ? ' (you\'re in another browser)' : '') + '<br>' +
        '2. ' + share + '<br>' +
        '3. <b>Add to Home Screen</b> → keep <b>Open as Web App</b> on → <b>Add</b><br>' +
        '4. Launch <b>UNYIELDING</b> from your home screen — no address bar, full screen</div>' +
        '<div style="color:#8070a8;font-size:11px;text-align:center;margin-top:10px">TAP OR PRESS ANY BUTTON TO PLAY IN THE TAB</div></div>';
      const go = ev => { try { ev.preventDefault(); ev.stopPropagation(); } catch (e) { } hide(); };
      d.addEventListener('touchend', go, { passive: false }); d.addEventListener('click', go);
      document.body.appendChild(d); card = d; cardT = performance.now();
      setTimeout(() => { if (card === d) hide(); }, 16000);
    }
    S.show = show; S.hide = hide;
    // any pad button closes it (after a short grace so the press that opened it doesn't close it)
    const _poll = typeof pollPad === 'function' ? pollPad : null;
    if (_poll) window.pollPad = pollPad = function () {
      const r = _poll.apply(this, arguments);
      try { if (card && performance.now() - cardT > 1200 && navigator.getGamepads && Array.from(navigator.getGamepads()).some(p => p && p.buttons && p.buttons.some(b => b && b.pressed))) hide(); } catch (e) { }
      return r;
    };
    else setInterval(() => { try { if (!card || performance.now() - cardT < 1200) return; const gp = navigator.getGamepads ? navigator.getGamepads() : []; for (const p of gp) if (p && p.buttons.some(b => b.pressed)) { hide(); break; } } catch (e) { } }, 100);
    // fullscreen requests on iPhone -> steps card (instead of a silent TypeError)
    const stub = function () { show('request'); try { if (window.OPT) { OPT.msg = 'IPHONE: ADD TO HOME SCREEN'; OPT.msgT = 3; } } catch (e) { } return Promise.resolve(); };
    const ep = Element.prototype;
    if (!ep.requestFullscreen && !ep.webkitRequestFullscreen) { ep.requestFullscreen = stub; S.stub = true; }
    // once per session at the title
    let once = false; try { once = sessionStorage.getItem('m195pwa') === '1'; } catch (e) { }
    // (if TAP TO START is up, its tap requests fullscreen -> the card shows then; otherwise show it after 3.5 s)
    if (!once) { let tries = 0; const t = setInterval(() => {
      if (++tries > 40 || S.cards) { clearInterval(t); return; }
      if (tries < 4 || document.getElementById('m19tap') || document.getElementById('m19padhint')) return;
      clearInterval(t); try { sessionStorage.setItem('m195pwa', '1'); } catch (e) { }
      if (typeof G !== 'undefined' && G.state === 'title') show('title');
    }, 1000); }
    // keep the tab un-zoomed / un-scrolled after rotations (Safari can leave a 1px scroll that shows the bar)
    const fix = () => { try { window.scrollTo(0, 0); } catch (e) { } };
    addEventListener('orientationchange', () => setTimeout(fix, 300));
    if (window.visualViewport) visualViewport.addEventListener('resize', fix);
  } catch (e) { if (M195.fail) M195.fail('pwa', e); }
})();
