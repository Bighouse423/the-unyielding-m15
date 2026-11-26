// ===== m19.5 perf: exact-output speedups, crisp integer-scaled layout, and a governor that holds 60/120fps.
// ?perf2=0 turns off the speedups + layout, ?gov=0 the governor, ?fxfix=0 lets the old governor hide weapon fx again.
// Nothing here changes gameplay, timing, hitboxes, the hands, or the weapon fx look.
(function () {
  const M = window.M195; if (!M || !M.on) return;
  const PF = M.perf = { on: M.perf2, flk: 0, bs: 0, layout: null };
  const isMobile = !!(window.M19 && M19.mob && M19.mob.isMobile) ||
    /iPad|iPhone|iPod|Android|Mobile/.test(navigator.userAgent || '') || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  M.isMobile = isMobile;

  // ---------- 1. flicker: only texels lit by a flickering light need the per-frame sine (exact same values) ----------
  if (M.perf2 && typeof updateFlicker === 'function') {
    const _uf = PF._uf = updateFlicker;
    let IDX = new Int32Array(0), nI = 0, srcR = null, srcF = null, cnt = 0;
    const rebuild = () => {
      srcR = LTr; srcF = FLK; const N = FLK.length;
      if (IDX.length < N) IDX = new Int32Array(N);
      nI = 0; for (let i = 0; i < N; i++) if (LTr[i] !== 0 || LTg[i] !== 0 || LTb[i] !== 0) IDX[nI++] = i;
      PF.flk = nI;
    };
    updateFlicker = function (t) {
      try {
        if (!FLK || !LTr) return _uf(t);
        if (srcR !== LTr || srcF !== FLK || (++cnt % 90) === 0) rebuild();
        for (let k = 0; k < nI; k++) { const i = IDX[k], p = FLKP[i]; FLK[i] = 0.82 + 0.13 * Math.sin(t * 9.1 + p) + 0.07 * Math.sin(t * 23.7 + p * 3.1); }
      } catch (e) { M.fail('flk', e); return _uf(t); }
    };
  }

  // ---------- 2. luminance probe for the holy/red tone-down (was a GPU readback of the whole frame every 12 frames) ----------
  if (M.perf2) M.lumProbe = function () {
    if (typeof PIX === 'undefined' || !PIX) return -1;
    const ew = EW, eh = EH; let s = 0, n = 0;
    for (let gy = 0; gy < 9; gy++) { const y = (((gy + 0.5) * eh / 9) | 0); for (let gx = 0; gx < 16; gx++) { const x = (((gx + 0.5) * ew / 16) | 0); const q = PIX[y * ew + x]; s += (q & 255) * 0.3 + ((q >> 8) & 255) * 0.59 + ((q >> 16) & 255) * 0.11; n++; } }
    return s / n * 1.08;   // world is graded but pre-bloom; small lift matches the old composited probe
  };

  // ---------- 3. layout: crisp integer device-pixel scale when it fills >= 86% of the screen, small backing store ----------
  // The screen canvas only ever shows 480x270 art (960x540 in HD 2X). Upscaling is done by the compositor with
  // image-rendering: pixelated, which is free on every GPU, instead of a full-screen drawImage per layer per frame.
  const insets = () => {
    try {
      let p = document.getElementById('m195inset');
      if (!p) { p = document.createElement('div'); p.id = 'm195inset'; p.style.cssText = 'position:fixed;left:0;top:0;width:0;height:0;visibility:hidden;pointer-events:none;padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)'; document.body.appendChild(p); }
      const cs = getComputedStyle(p); return { t: parseFloat(cs.paddingTop) || 0, r: parseFloat(cs.paddingRight) || 0, b: parseFloat(cs.paddingBottom) || 0, l: parseFloat(cs.paddingLeft) || 0 };
    } catch (e) { return { t: 0, r: 0, b: 0, l: 0 }; }
  };
  PF.bsWant = isMobile ? 1 : 2;   // governor may lower desktop to 1
  if (M.perf2 && typeof resize === 'function') {
    const _rz = resize;
    resize = function () {
      try {
        const vv = window.visualViewport;
        const iw = Math.round((vv && vv.width) || innerWidth || document.documentElement.clientWidth);
        const ih = Math.round((vv && vv.height) || innerHeight || document.documentElement.clientHeight);
        if (iw < 2 || ih < 2) return _rz.apply(this, arguments);
        const dpr = window.devicePixelRatio || 1, ins = insets(), land = iw >= ih;
        const wrap = document.getElementById('wrap'); if (wrap) wrap.style.padding = '0';
        // fit the full viewport; side bars (pillarbox) usually cover the notch, else shrink to clear it
        let aw = iw, ah = ih;
        if (!land) { ah = ih - ins.t - ins.b; }
        let s = Math.min(aw / W, ah / H);
        const side = Math.max(ins.l, ins.r);
        if ((iw - W * s) / 2 < side - 0.5) { aw = iw - 2 * side; s = Math.min(aw / W, ah / H); }
        let dev = s * dpr, k = Math.floor(dev + 1e-6), css = s, crisp = false;
        if (k >= 1 && k / dev >= 0.86) { css = k / dpr; crisp = true; }
        const bs = (typeof RK !== 'undefined' && RK > 1) ? 2 : Math.max(1, Math.min(PF.bsWant, k || 1));
        if (screen.width !== W * bs || screen.height !== H * bs) { screen.width = W * bs; screen.height = H * bs; }
        SCALE = bs;
        const cw = W * css, ch = H * css;
        screen.style.width = cw + 'px'; screen.style.height = ch + 'px';
        screen.style.imageRendering = 'pixelated';
        PF.bs = bs; PF.layout = { iw, ih, dpr, css: +css.toFixed(4), dev: +(css * dpr).toFixed(3), crisp, bs, ins, fill: +((cw * ch) / (iw * ih)).toFixed(3) };
        if (window.M19 && M19.mob) M19.mob.fit = { iw, ih, s: +css.toFixed(3), bs };
      } catch (e) { M.fail('resize', e); return _rz.apply(this, arguments); }
    };
    try { resize(); } catch (e) { }
    addEventListener('load', () => { try { resize(); } catch (e) { } });
  }

  // ---------- 4. weapon fx never vanish: they no longer depend on the quality governor ----------
  if (M.fxfix && typeof GFX !== 'undefined') {
    const keepQ = (name) => {
      const f = window[name]; if (typeof f !== 'function') return;
      window[name] = function () { const q = GFX.q; if (q < 2) GFX.q = 2; try { return f.apply(this, arguments); } finally { if (q < 2) GFX.q = q; } };   // fx always at full tier
    };
    keepQ('wpnFX'); keepQ('xbowFX');
  }

  // ---------- 5. governor: sheds atmosphere + backing store to hold the display's refresh rate ----------
  // Levels (0 = best): 0 full | 1 gfx2 lite | 2 backing store 1x | 3 HD 2X -> classic | 4 atmosphere lite (GFX.q 1) | 5 gfx2 off
  // Never touches weapon fx, the hands, or sim timing. The old GFX/m18 governors are parked (they dropped GFX.q to 0,
  // which is what made weapon fx disappear).
  if (M.gov && typeof GFX !== 'undefined' && typeof frame === 'function') {
    const GV = M.govState = { on: true, level: isMobile ? 1 : 0, maxLevel: 5, period: 16.67, js: 0, iv: 16.7, bad: 0, good: 0, upWait: 300, changes: [], hz: 60, cap: 1, capGood: 0 };
    let tick = 0;
    const ivs = new Float32Array(120); let ivN = 0, last = 0;
    const applyLevel = () => {
      const L = GV.level;
      M.gfx2Level = L >= 5 ? 0 : L >= 1 ? 1 : 2;
      const bsw = L >= 2 ? 1 : (isMobile ? 1 : 2);
      if (bsw !== PF.bsWant) { PF.bsWant = bsw; try { resize(); } catch (e) { } }
      const wantHdOff = L >= 3;
      if (typeof RK !== 'undefined' && wantHdOff && RK > 1 && !GFX.hdLock) GFX.hdOff = true;
      GFX.q = L >= 4 ? 1 : 2;
    };
    GV.set = (L, why) => { L = Math.max(0, Math.min(GV.maxLevel, L)); if (L === GV.level) return; GV.changes.push([+(performance.now() / 1000).toFixed(1), GV.level, L, why]); if (GV.changes.length > 40) GV.changes.shift(); GV.level = L; GV.bad = GV.good = 0; applyLevel(); };
    GV.state = () => ({ cap: GV.cap, level: GV.level, q: GFX.q, bs: PF.bs, hz: GV.hz, js: +GV.js.toFixed(2), iv: +GV.iv.toFixed(2), changes: GV.changes.slice(-8) });
    // mobile starts one notch down (m19 capped GFX.q at 1 there); everyone climbs if there is headroom
    applyLevel();
    const _fr = frame;
    frame = function (now) {
      // 120 Hz panels that can't hold 120: render every other vsync = a locked 60 instead of an uneven 80-100
      if (GV.cap === 2 && (++tick & 1)) { requestAnimationFrame(frame); return; }
      const a = performance.now();
      const r = _fr.apply(this, arguments);
      try {
        const js = performance.now() - a;
        const iv = last ? now - last : 0; last = now;
        if (document.hidden || iv <= 0 || iv > 600) return r;   // tab switch / long pause: ignore (slow devices still count: up to 600 ms)
        if (GV.cap === 1) ivs[ivN++ % 120] = iv;
        if (ivN >= 30 && (ivN % 30) === 0) {   // refresh estimate: 15th percentile interval (60, 90, 120, 144 Hz)
          const n = Math.min(ivN, 120), arr = Array.from(ivs.subarray(0, n)).sort((x, y) => x - y), p = arr[Math.floor(n * 0.15)];
          GV.period = p < 7.5 ? 6.94 : p < 9.5 ? 8.33 : p < 12.5 ? 11.1 : 16.67; GV.hz = Math.round(1000 / GV.period);
        }
        GV.js = GV.js * 0.92 + js * 0.08; GV.iv = GV.iv * 0.92 + iv * 0.08;
        if (GFX) { GFX.n = 0; if (GFX.q < 1) GFX.q = 1; GFX.ms = Math.min(GFX.ms, 12); }   // park the old governors
        const P_ = GV.period * GV.cap;
        const missing = GV.iv > P_ * 1.22 || GV.js > P_ * 0.85;
        const roomy = GV.js < P_ * 0.5 && GV.iv < P_ * 1.08;
        if (typeof G !== 'undefined' && (G.state === 'play' || G.state === 'altar')) {
          if (missing) { GV.bad++; GV.good = 0; } else { GV.bad = Math.max(0, GV.bad - 1); if (roomy) GV.good++; else GV.good = Math.max(0, GV.good - 2); }
          if (GV.cap === 1 && GV.hz >= 100 && GV.bad > 45 && GV.level >= 2) { GV.cap = 2; GV.bad = GV.good = 0; GV.capGood = 0; GV.changes.push([+(performance.now() / 1000).toFixed(1), GV.level, GV.level, 'cap 60 on ' + GV.hz + 'Hz']); }
          else if (GV.cap === 2 && GV.js < GV.period * 0.55 && GV.level === 0) { if (++GV.capGood > 900) { GV.cap = 1; GV.bad = GV.good = 0; GV.changes.push([+(performance.now() / 1000).toFixed(1), 0, 0, 'uncap']); } }
          else if (GV.bad > 45 && GV.level < GV.maxLevel) { GV.set(GV.level + 1, 'slow js ' + GV.js.toFixed(1) + ' iv ' + GV.iv.toFixed(1)); GV.upWait = Math.min(3600, GV.upWait * 1.5); }
          else if (GV.good > GV.upWait && GV.level > 0) GV.set(GV.level - 1, 'headroom');
        }
      } catch (e) { M.fail('gov', e); }
      return r;
    };
  }
})();
