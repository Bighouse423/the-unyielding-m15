// ===== m20l: smoothness / performance pass (t235u) =====
// present : 1:1 present + CSS upscale at classic res (skips a wasteful 2x blit every frame)
// fixstep : fixed 1/60 sim step so damage, movement and timers don't depend on frame rate
// partpool: particle list never splice()s mid-frame (no hitch at the cap)
// postlite: when the governor is over budget, keep the colour LUT but skip the bloom pass
// perfgov : Auto/High/Low quality in Settings; Auto holds the current look at 60fps and only
//           sheds resolution / bloom when frame time is actually over budget. Ignores load spikes.
//           Parks the older governors (they treated a 14ms frame as a miss and never climbed).
// Kill switches: ?m20l=0 (all; also ?m20=0) | ?present=0 | ?fixstep=0 | ?partpool=0 | ?postlite=0 | ?perfgov=0
(function () {
  const Q = location.search, off = /[?&](m20l|m20)=0/.test(Q), fl = n => !off && !new RegExp('[?&]' + n + '=0').test(Q);
  const M = window.M20L = {
    on: !off, present: fl('present'), fixstep: fl('fixstep'), pool: fl('partpool'), lite: fl('postlite'), gov: fl('perfgov'),
    n: { drop: 0, climb: 0, step: 0, reuse: 0, skipBloom: 0, present: 0 },
    err: [], level: 0, qual: 'auto', js: 16, iv: 16.7, p95: 16, hitches: 0, skipBloom: false
  };
  const fail = (w, e) => { if (M.err.length < 12) M.err.push(w + ': ' + (e && e.message || e)); };
  M.st = () => ({ on: M.on, present: M.present, fixstep: M.fixstep, pool: M.pool, lite: M.lite, gov: M.gov,
    qual: M.qual, level: M.level, js: +M.js.toFixed(2), p95: +M.p95.toFixed(2), iv: +M.iv.toFixed(2),
    hitches: M.hitches, rk: (typeof RK !== 'undefined') ? RK : 1, n: M.n, err: M.err });
  if (off) return;

  const isMobile = !!(window.M19 && M19.mob && M19.mob.isMobile) ||
    /iPad|iPhone|iPod|Android|Mobile/.test(navigator.userAgent || '') ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const QLAB = ['LOW', 'AUTO', 'HIGH'];
  const qIdx = () => { const v = (window.OPT && OPT.S && OPT.S.m20lqual) || 'auto'; return v === 'high' ? 2 : v === 'low' ? 0 : 1; };
  const qName = () => QLAB[qIdx()];
  M.qual = qName().toLowerCase();

  // ---------- park older governors so they cannot fight us ----------
  function parkOld() {
    try {
      if (window.M195 && M195.govState) {
        M195.govState.maxLevel = 0;
        M195.govState.bad = 0; M195.govState.good = 0;
        const _set = M195.govState.set;
        M195.govState.set = function (L, why) { if (!M.gov) return _set && _set(L, why); };
      }
      if (typeof GFX !== 'undefined') { GFX.n = 0; if (GFX.ms > 12) GFX.ms = 12; }
    } catch (e) { fail('park', e); }
  }
  parkOld();

  // ---------- quality application ----------
  function applyLevel() {
    try {
      const qi = qIdx(); M.qual = QLAB[qi].toLowerCase();
      let L = M.level;
      if (qi === 2) L = 0;           // High: keep the current look
      if (qi === 0) L = Math.max(L, 2); // Low: at least classic
      if (typeof GFX !== 'undefined' && !GFX.hdLock) {
        // High always wants HD. Auto keeps the user's resolution (Classic by default) unless later shed.
        const wantHd = (qi === 2) || (qi === 1 && L < 2 && !(window.OPT && OPT.S && OPT.S.hd === false));
        GFX.hdOff = !wantHd;
        if (typeof setRenderScale === 'function') {
          const k = wantHd ? 2 : 1;
          if ((typeof RK === 'undefined' || RK !== k) && setRenderScale(k) && typeof resize === 'function') resize();
        }
        GFX.q = (qi === 0 || L >= 3) ? 1 : 2;
      }
      M.skipBloom = !!(M.lite && (qi === 0 || L >= 1));
      M._cap = (typeof PCAP === 'number') ? PCAP : 2600;
      if (qi === 0 || L >= 3) M._cap = 900;
      else if (L >= 2) M._cap = 1400;
    } catch (e) { fail('apply', e); }
  }

  // ---------- Settings: QUALITY Auto / High / Low ----------
  function hookOpt() {
    if (!window.OPT || OPT._m20l) return;
    OPT._m20l = 1;
    if (OPT.S && OPT.S.m20lqual === undefined) OPT.S.m20lqual = 'auto';
    const _rows = OPT.rows.bind(OPT);
    OPT.rows = function () {
      const L = _rows();
      if (this.page && this.page !== 'main') return L;
      if (L.some(r => r && r.id === 'm20lqual')) return L;
      const i = L.findIndex(r => r && r.id === 'hd');
      const row = { t: 'opt', id: 'm20lqual', l: 'QUALITY', v: () => qName() };
      if (i >= 0) L.splice(i + 1, 0, row); else L.push(row);
      return L;
    };
    const _in = OPT.input.bind(OPT);
    OPT.input = function (rdt) {
      try {
        if (OPT.open && (OPT.page === 'main' || !OPT.page)) {
          const L = OPT.rows(), r = L[OPT.sel];
          if (r && r.id === 'm20lqual') {
            const left = KP.ArrowLeft || KP.KeyA, right = KP.ArrowRight || KP.KeyD || KP.Enter || KP.Space || KP.PadOK;
            let d = left ? -1 : right ? 1 : 0;
            if (!d && MBP[0]) d = 1;
            if (d) {
              const n = (qIdx() + d + 3) % 3;
              OPT.S.m20lqual = n === 2 ? 'high' : n === 0 ? 'low' : 'auto';
              if (n === 2) M.level = 0;
              if (typeof OPT.save === 'function') OPT.save();
              applyLevel();
            }
          }
        }
      } catch (e) { fail('opt', e); }
      return _in(rdt);
    };
  }
  hookOpt();
  setTimeout(hookOpt, 0);

  // ---------- cheaper present (classic res only) ----------
  if (M.present && typeof resize === 'function') {
    const _rz = resize;
    resize = function () {
      const r = _rz.apply(this, arguments);
      try {
        if (typeof RK !== 'undefined' && RK === 1 && typeof screen !== 'undefined' && typeof W !== 'undefined') {
          if (screen.width !== W || screen.height !== H) { screen.width = W; screen.height = H; }
          SCALE = 1;
          screen.style.imageRendering = 'pixelated';
          M.n.present++;
        }
      } catch (e) { fail('present', e); }
      return r;
    };
    try { resize(); } catch (e) { }
  }

  // ---------- fixed 1/60 sim ----------
  if (M.fixstep && typeof update === 'function') {
    const _up = update; let acc = 0; const STEP = 1 / 60;
    update = function (dt) {
      if (!M.fixstep || !(dt > 0)) return _up.apply(this, arguments);
      acc += dt; if (acc > 0.25) acc = 0.25;
      let n = 0; let r;
      while (acc >= STEP && n < 5) { r = _up.call(this, STEP); acc -= STEP; n++; M.n.step++; }
      return r;
    };
  }

  // ---------- particle list: overwrite instead of splice ----------
  if (M.pool && typeof addP === 'function') {
    const _ap = addP;
    addP = function (p) {
      try {
        const arr = G.particles, cap = M._cap || 2600;
        if (arr.length >= cap) {
          let i = 0, best = 0, bestL = 99;
          for (; i < arr.length; i++) { const q = arr[i]; if (!q || q.life <= 0) { best = i; break; } if ((q.rest && q.k === 'gib') || (q.life < bestL)) { best = i; bestL = q.life; } }
          arr[best] = p; M.n.reuse++; return p;
        }
      } catch (e) { fail('pool', e); }
      return _ap.apply(this, arguments);
    };
  }

  // ---------- postFX: LUT stays, bloom can drop under pressure ----------
  if (M.lite && typeof postFX === 'function') {
    const _pf = postFX;
    postFX = function () {
      if (!M.skipBloom) return _pf.apply(this, arguments);
      try {
        if (!FX.on) return;
        const lut = FX.lut; if (!lut || typeof PIX === 'undefined') return _pf.apply(this, arguments);
        const N = EW * EH;
        for (let i = 0; i < N; i++) { const q = PIX[i]; PIX[i] = lut[((q & 0xfc) << 10) | ((q >> 4) & 0xfc0) | ((q >> 18) & 0x3f)]; }
        M.n.skipBloom++;
        return;
      } catch (e) { fail('post', e); return _pf.apply(this, arguments); }
    };
    M._hookBloom = function () {
      if (M._bloomHooked || typeof ctxLow === 'undefined' || !ctxLow || !FX) return;
      const _di = ctxLow.drawImage.bind(ctxLow);
      ctxLow.drawImage = function (img) {
        if (M.skipBloom && FX && img === FX.bloom) return;
        return _di.apply(this, arguments);
      };
      M._bloomHooked = 1;
    };
    try { M._hookBloom(); } catch (e) {}
  }

  // ---------- governor ----------
  const ivs = new Float32Array(90); let ivN = 0, jsN = 0;
  const jss = new Float32Array(90);
  let lastNow = 0, settle = 120, lastState = '', lastStage = -1, good = 0, bad = 0, drownN = 0;
  function pctl(arr, n, p) {
    const a = Array.from(arr.subarray(0, n)).sort((x, y) => x - y);
    return a[Math.min(n - 1, Math.max(0, (n * p / 100) | 0))];
  }
  function tickGov(js, now) {
    if (!M.gov) return;
    const iv = lastNow ? now - lastNow : 16.7; lastNow = now;
    if (document.hidden || iv <= 0 || iv > 600) { settle = Math.max(settle, 60); return; }
    // A single hitch after a locked-60 cadence is a load spike, not a slow device.
    // A steady 40ms+ cadence (throttled / phone) is real pressure and must be allowed to shed.
    const wasSteady = M.iv < 28;
    M.iv = M.iv * 0.85 + iv * 0.15;
    if (iv > 80 && wasSteady) { settle = Math.max(settle, 30); return; }
    try {
      const st = (typeof G !== 'undefined' && G.state) || '';
      const stage = (window.RUN && RUN.stage) || 0;
      if (st !== lastState || stage !== lastStage) { lastState = st; lastStage = stage; settle = 120; bad = good = 0; drownN = 0; }
      if (st !== 'play' && st !== 'altar') { settle = Math.max(settle, 30); return; }
      if (G.paused) return;
      if (settle > 0) {
        // Only skip the rest of settle when we have a STABLE slow cadence (4x/6x), never on a single hitch.
        if (iv > 40) drownN++; else drownN = 0;
        if (drownN >= 20) settle = 0;
        else { settle--; return; }
      }
    } catch (e) { }
    ivs[ivN % 90] = iv; jss[ivN % 90] = js; ivN++; jsN = Math.min(90, ivN);
    M.js = M.js * 0.85 + js * 0.15;
    if (jsN >= 10 && (ivN % 10) === 0) {
      M.p95 = pctl(jss, jsN, 95);
      const iv95 = pctl(ivs, jsN, 95);
      M.hitches = 0; let hard = 0;
      for (let i = 0; i < jsN; i++) { if (jss[i] > 22) M.hitches++; if (ivs[i] > 28) hard++; }
      const qi = qIdx();
      if (qi === 2) { if (M.level !== 0) { M.level = 0; applyLevel(); } return; }
      // Only shed look when we are actually missing vsync, not when js is 14ms but the panel still locks 60.
      const drowning = M.iv > 36 && iv95 > 40;
      if (!drowning && jsN < 30) return;
      const over = drowning || iv95 > 24 || hard >= 3 || M.p95 > 22;
      const roomy = hard === 0 && M.iv < 20 && iv95 < 20;
      if (over) { bad++; good = 0; } else if (roomy) { good++; bad = Math.max(0, bad - 1); } else { bad = Math.max(0, bad - 1); good = Math.max(0, good - 2); }
      const maxL = 3;
      const need = drowning ? 1 : 6;
      if (bad >= need && M.level < maxL) { M.level++; bad = good = 0; M.n.drop++; applyLevel(); }
      else if (good >= 8 && M.level > (qi === 0 ? 2 : 0)) { M.level--; bad = good = 0; M.n.climb++; applyLevel(); }
    }
  }

  if (typeof frame === 'function') {
    const _fr = frame;
    let capLast = 0;
    frame = function (now) {
      try {
        parkOld();
        const qi = qIdx();
        const cap60 = M.gov && qi !== 2; // Auto/Low lock 60; High may run with the panel
        if (cap60 && capLast && now - capLast < 14.2) { requestAnimationFrame(frame); return; }
        capLast = now;
      } catch (e) { fail('cap', e); }
      try {
        if (qIdx() === 2 && typeof setRenderScale === 'function' && typeof RK !== 'undefined' && RK !== 2) {
          if (typeof GFX !== 'undefined') GFX.hdOff = false;
          if (setRenderScale(2) && typeof resize === 'function') resize();
        }
      } catch (e) {}
      const a = performance.now();
      const r = _fr.apply(this, arguments);
      try { tickGov(performance.now() - a, now || performance.now()); } catch (e) { fail('gov', e); }
      return r;
    };
  }

  if (typeof frameInner === 'function') {
    const _fi = frameInner; let once = 0;
    frameInner = function (now) {
      if (!once) { once = 1; try { hookOpt(); applyLevel(); if (M._hookBloom) M._hookBloom(); if (M.present && typeof resize === 'function') resize(); } catch (e) { fail('boot', e); } }
      return _fi.apply(this, arguments);
    };
  }

  M.apply = applyLevel;
  applyLevel();
  M.st = () => ({ on: M.on, present: M.present, fixstep: M.fixstep, pool: M.pool, lite: M.lite, gov: M.gov,
    qual: M.qual, level: M.level, js: +M.js.toFixed(2), p95: +M.p95.toFixed(2), iv: +M.iv.toFixed(2),
    hitches: M.hitches, rk: (typeof RK !== 'undefined') ? RK : 1, n: Object.assign({}, M.n), err: M.err.slice() });
})();
