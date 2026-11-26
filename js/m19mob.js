// ===== m19mob: fullscreen on iPhone/iPad, controller only (no touch controls).
// ?mobile=0 leaves desktop page behaviour. Audio may need one "TAP TO START" on iOS.
(function () {
  if (!window.M19 || !M19.mobile) return;
  const ua = navigator.userAgent || '';
  const isiOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isMobile = isiOS || /Android|Mobile/.test(ua) || (navigator.maxTouchPoints > 1 && Math.min(screen.width, screen.height) < 1100);
  const standalone = window.navigator.standalone === true || (window.matchMedia && window.matchMedia('(display-mode: standalone), (display-mode: fullscreen)').matches);
  const M = M19.mob = { on: true, isiOS, isMobile, standalone, audio: false, fs: false, prompt: null, err: [] };

  // --- layout: fill the safe area, keep 480x270 aspect (letterbox / pillarbox) ---
  if (typeof resize === 'function') {
    const _rz = resize;
    resize = function () {
      try {
        const wrap = document.getElementById('wrap');
        const vv = window.visualViewport;
        let iw = (wrap && wrap.clientWidth) || (vv && vv.width) || innerWidth;
        let ih = (wrap && wrap.clientHeight) || (vv && vv.height) || innerHeight;
        if (iw < 2 || ih < 2) return _rz.apply(this, arguments);
        const s = Math.min(iw / W, ih / H);
        let bs = Math.max(1, Math.floor(s));
        if (typeof RK !== 'undefined' && RK > 1 && !isMobile) {
          bs = Math.max(2, Math.floor(s * (window.devicePixelRatio || 1) + 1e-4)); bs -= bs & 1;
        }
        // mobile GPUs: cap backing store so we stay near 60fps
        if (isMobile) bs = Math.min(bs, (window.devicePixelRatio > 2 ? 3 : 2));
        screen.width = W * bs; screen.height = H * bs; SCALE = bs;
        screen.style.width = Math.floor(W * s) + 'px';
        screen.style.height = Math.floor(H * s) + 'px';
        M.fit = { iw: iw | 0, ih: ih | 0, s: +s.toFixed(3), bs };
        return;
      } catch (e) { M.err.push('resize ' + e); return _rz.apply(this, arguments); }
    };
  }
  addEventListener('orientationchange', () => setTimeout(() => { try { resize(); } catch (e) { } }, 80));
  if (window.visualViewport) visualViewport.addEventListener('resize', () => { try { resize(); } catch (e) { } });

  // --- no scroll / zoom / bounce ---
  const eat = e => { e.preventDefault(); };
  document.addEventListener('gesturestart', eat, { passive: false });
  document.addEventListener('gesturechange', eat, { passive: false });
  document.addEventListener('gestureend', eat, { passive: false });
  document.addEventListener('touchmove', e => {
    if (e.touches && e.touches.length > 1) e.preventDefault();
    else if (!M._tapOk) e.preventDefault();
  }, { passive: false });
  addEventListener('wheel', e => { if (e.ctrlKey) e.preventDefault(); }, { passive: false });
  try { document.documentElement.style.touchAction = 'none'; document.body.style.overscrollBehavior = 'none'; } catch (e) { }

  // --- auto quality on mobile GPUs ---
  if (isMobile) {
    try {
      if (typeof S !== 'undefined') { S.hd = false; S.m18res = S.m18res || 'classic'; }
      if (typeof setRenderScale === 'function') setRenderScale(1);
      if (typeof GFX !== 'undefined') { GFX.q = Math.min(GFX.q == null ? 1 : GFX.q, 1); GFX.hdOff = true; }
    } catch (e) { M.err.push('qual ' + e); }
  }

  function unlockAudio() {
    try {
      if (typeof SFX !== 'undefined' && SFX.init) SFX.init();
      if (SFX && SFX.ctx && SFX.ctx.resume) SFX.ctx.resume();
      M.audio = !!(SFX && SFX.ctx && SFX.ctx.state !== 'suspended');
    } catch (e) { M.err.push('aud ' + e); }
    return M.audio;
  }
  function goFullscreen() {
    if (!isMobile) return false;
    const el = document.documentElement;
    const fn = el.requestFullscreen || el.webkitRequestFullscreen || el.webkitRequestFullScreen;
    if (!fn) return false;
    try {
      const p = fn.call(el);
      if (p && p.then) p.then(() => { M.fs = true; try { resize(); } catch (e) { } }).catch(() => { M.fs = false; });
      else M.fs = true;
      return true;
    } catch (e) { M.fs = false; return false; }
  }

  // --- overlays: controller prompt + optional one-tap audio unlock ---
  function cssOverlay() {
    const d = document.createElement('div');
    d.style.cssText = 'position:fixed;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;background:rgba(8,3,12,0.82);color:#ffe080;font:16px/1.4 monospace;text-align:center;z-index:9999;padding:env(safe-area-inset-top) 24px env(safe-area-inset-bottom);letter-spacing:0.08em;';
    return d;
  }
  function showConnect() {
    if (M.prompt || !isMobile) return;
    const d = cssOverlay();
    d.id = 'm19padhint';
    d.innerHTML = '<div style="max-width:28em">CONTROLLER ONLY<br><span style="color:#c0a0ff;font-size:13px;display:block;margin-top:10px">PRESS ANY BUTTON ON YOUR CONTROLLER</span><span style="color:#8070a8;font-size:11px;display:block;margin-top:14px">MFi, Xbox, or PlayStation. Add to Home Screen for true fullscreen on iOS.</span></div>';
    document.body.appendChild(d);
    M.prompt = d;
  }
  function hideConnect() {
    if (M.prompt && M.prompt.id === 'm19padhint') { M.prompt.remove(); M.prompt = null; }
  }
  function showTapToStart() {
    if (M.tap || !isMobile) return;
    const d = cssOverlay();
    d.id = 'm19tap';
    d.innerHTML = '<div style="max-width:26em">TAP TO START<br><span style="color:#c0a0ff;font-size:13px;display:block;margin-top:10px">iOS needs one tap to unlock audio. After that, use your controller.</span></div>';
    const go = ev => {
      ev.preventDefault(); ev.stopPropagation();
      M._tapOk = true;
      unlockAudio();
      goFullscreen();
      d.remove(); M.tap = null; M._tapOk = false;
      if (isMobile && !(typeof PAD !== 'undefined' && PAD.connected)) showConnect();
    };
    d.addEventListener('touchend', go, { once: true, passive: false });
    d.addEventListener('click', go, { once: true });
    document.body.appendChild(d);
    M.tap = d;
  }

  // first controller press: unlock audio, request fullscreen, hide hint
  let armed = false;
  function onPadPress() {
    if (!isMobile) return;
    if (armed && M.audio) return;
    armed = true;
    const ok = unlockAudio();
    goFullscreen();
    hideConnect();
    if (!ok) showTapToStart();
  }
  addEventListener('gamepadconnected', e => {
    try { onPadPress(); if (typeof toast === 'function') toast('CONTROLLER CONNECTED', 'Ready. Use the controller — no touch.', '#80c8ff', 3); } catch (err) { }
  });

  const _pp = typeof pollPad === 'function' ? pollPad : null;
  if (_pp) {
    pollPad = function (rdt) {
      try {
        const list = navigator.getGamepads ? navigator.getGamepads() : [];
        for (const g of list) if (g && g.buttons) {
          for (const b of g.buttons) if (b && (b.pressed || b.value > 0.5)) { onPadPress(); break; }
        }
      } catch (e) { }
      return _pp.apply(this, arguments);
    };
  }

  // iOS: show the audio tap first (gamepad presses often don't count as a user gesture)
  function bootHint() {
    if (!isMobile) return;
    try { resize(); } catch (e) { }
    if (isiOS && !M.audio) showTapToStart();
    else showConnect();
  }
  if (document.readyState === 'complete' || document.readyState === 'interactive') setTimeout(bootHint, 50);
  else addEventListener('DOMContentLoaded', () => setTimeout(bootHint, 50));
  addEventListener('load', () => { try { resize(); } catch (e) { } });
})();
