// ===== m21m: stage-specific atmosphere overlays (fog, motes, embers, light shafts, rain). Overlay-only.
// Kill: ?m21m=0 / ?m21=0 | ?fog=0 | ?motes=0 | ?embers=0 | ?shafts=0 | ?rain=0
// Respects Settings ATMOSPHERE (OFF/LITE/FULL) and the GFX governor (GFX.q): when atmosphere is already shed
// (q < 1 or ATMOSPHERE OFF) this module draws nothing, so ADAPTIVE cannot pay extra for it.
(function () {
  const Q = new URLSearchParams(location.search);
  const off = Q.get('m21m') === '0' || Q.get('m21') === '0';
  const on = k => !off && Q.get(k) !== '0';
  const M = window.M21M = {
    on: !off, fog: on('fog'), motes: on('motes'), embers: on('embers'), shafts: on('shafts'), rain: on('rain'),
    n: { fog: 0, motes: 0, embers: 0, shafts: 0, rain: 0 }, err: [], ready: 0, q: 0, stage: -1
  };
  function fail(tag, e) { M.err.push(tag + ': ' + (e && e.message ? e.message : e)); }
  M.st = () => ({
    on: M.on, fog: M.fog, motes: M.motes, embers: M.embers, shafts: M.shafts, rain: M.rain,
    n: Object.assign({}, M.n), err: M.err.slice(), q: M.q, stage: M.stage, theme: M.theme && M.theme.id
  });
  if (off) { M.ready = 1; return; }

  // Per-stage kit. abyss stages 11-14 share a heavy violet/ash look.
  const KIT = {
    1:  { id: 'nave',       fog: 'dust',  motes: 1, shafts: 1, col: [180, 140, 90],  sh: [255, 210, 140] },
    2:  { id: 'crypt',      fog: 'ground', motes: 1, col: [90, 50, 130] },
    3:  { id: 'ossuary',    fog: 'dust',  motes: 1, col: [170, 160, 140] },
    4:  { id: 'courtyard',  motes: 1, shafts: 1, rain: 1, col: [200, 180, 120], sh: [255, 220, 140] },
    5:  { id: 'belfry',     fog: 'dust',  motes: 1, rain: 1, col: [140, 140, 170] },
    6:  { id: 'arena',      embers: 1, motes: 1, col: [255, 120, 50] },
    7:  { id: 'necropolis', fog: 'ground', motes: 1, col: [40, 160, 100] },
    8:  { id: 'kennels',    embers: 1, fog: 'dust', col: [200, 90, 40] },
    9:  { id: 'cathedral',  motes: 1, shafts: 1, rain: 1, col: [180, 160, 220], sh: [200, 180, 255] },
    10: { id: 'throne',     motes: 1, shafts: 1, col: [160, 80, 220], sh: [180, 100, 255] },
    11: { id: 'abyss',      fog: 'heavy', embers: 1, motes: 1, col: [80, 20, 140] },
    12: { id: 'abyss',      fog: 'heavy', embers: 1, col: [100, 20, 80] },
    13: { id: 'abyss',      fog: 'heavy', motes: 1, col: [60, 30, 120] },
    14: { id: 'abyss',      fog: 'heavy', embers: 1, motes: 1, col: [90, 10, 40] }
  };

  let wisps = [], shafts = [], rains = [], origin = null, sd = 7919;
  const fr = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
  const fa = (a, b) => a + (b - a) * fr();

  function atmQ() {
    try { if (window.M9E && M9E.on && typeof M9E.on.atm === 'function') return M9E.on.atm() | 0; } catch (e) { }
    try {
      if (!window.FX || !FX.on) return 0;
      const gq = (typeof GFX !== 'undefined' && GFX.q != null) ? GFX.q : 2;
      if (gq < 1) return 0;
      const v = (window.OPT && OPT.S && OPT.S.atm !== undefined) ? (OPT.S.atm | 0) : 2;
      return Math.min(v, gq);
    } catch (e) { return 0; }
  }

  function themeOf() {
    try {
      if (typeof G === 'undefined' || G.state !== 'play' || (window.RUN && RUN.hub)) return null;
      const st = window.RUN && (RUN.stage | 0);
      return KIT[st] || null;
    } catch (e) { return null; }
  }

  function resetStage(th) {
    wisps = []; shafts = []; rains = [];
    M.stage = (window.RUN && (RUN.stage | 0)) || -1;
    M.theme = th;
    origin = (typeof P !== 'undefined') ? { x: P.x, y: P.y } : { x: 10, y: 10 };
    sd = (137 * (M.stage + 3) + ((window.RUN && RUN.seed) || 1)) | 0;
    if (sd <= 0) sd += 2147483646;
    if (M.shafts && th.shafts) placeShafts(th);
    if (M.fog && th.fog) seedFog(th, th.fog === 'heavy' ? 8 : 5);
    if (M.rain && th.rain) seedRain(th, 12);
  }

  function openAt(x, y) {
    try { return typeof isSolid === 'function' && !isSolid(cellAt(x, y)); } catch (e) { return true; }
  }
  function flz(x, y) {
    try { return typeof floorAt === 'function' ? floorAt(x, y) : 0; } catch (e) { return 0; }
  }

  function placeShafts(th) {
    const col = th.sh || th.col;
    const o = origin;
    for (let i = 0; i < 10 && shafts.length < 2; i++) {
      const a = fa(-1.1, 1.1) + (typeof P !== 'undefined' ? P.ang : 0);
      const d = fa(2.4, 6.5);
      const x = o.x + Math.cos(a) * d, y = o.y + Math.sin(a) * d;
      if (!openAt(x, y)) continue;
      shafts.push({ x, y, w: fa(0.9, 1.5), z0: flz(x, y), z1: flz(x, y) + fa(3.4, 5.2), c: col, i: fa(0.16, 0.26), slant: fa(-0.2, 0.2), ph: fa(0, 6) });
    }
  }

  function seedFog(th, n) {
    const o = origin;
    const heavy = th.fog === 'heavy';
    for (let i = 0; i < n; i++) {
      const a = fa(0, Math.PI * 2), d = fa(1.2, heavy ? 7 : 5.5);
      const x = o.x + Math.cos(a) * d, y = o.y + Math.sin(a) * d;
      if (!openAt(x, y)) continue;
      wisps.push({
        x, y, z: flz(x, y) + (th.fog === 'dust' ? fa(0.15, 0.7) : fa(0.04, 0.28)),
        rw: heavy ? fa(1.4, 2.4) : fa(0.9, 1.8), rh: heavy ? fa(0.3, 0.55) : fa(0.2, 0.4),
        vx: fa(-0.1, 0.1), vy: fa(-0.1, 0.1), t: fa(0, 2), life: fa(7, 12),
        c: th.col, a: heavy ? fa(0.42, 0.64) : fa(0.36, 0.58)
      });
    }
  }

  function seedRain(th, n) {
    const src = (typeof P !== 'undefined') ? P : origin;
    const ang = (typeof P !== 'undefined') ? P.ang : 0;
    for (let i = 0; i < n; i++) {
      const a = ang + fa(-0.55, 0.55);
      const d = fa(0.9, 4.2);
      rains.push({
        x: src.x + Math.cos(a) * d, y: src.y + Math.sin(a) * d,
        z: fa(1.8, 3.6), vz: fa(-3.4, -2.0), life: fa(0.5, 1.1), t: fa(0, 0.35)
      });
    }
  }

  function tick(dt) {
    const th = themeOf();
    M.q = atmQ();
    M.theme = th;
    if (!th || M.q <= 0) { wisps = []; shafts = []; rains = []; return; }
    const st = window.RUN && (RUN.stage | 0);
    if (st !== M.stage) resetStage(th);
    const lite = M.q < 2;
    const k = lite ? 0.45 : 1;

    if (M.fog && th.fog) {
      const cap = Math.ceil((th.fog === 'heavy' ? 10 : 6) * k);
      for (let i = wisps.length - 1; i >= 0; i--) {
        const w = wisps[i]; w.t += dt; w.x += w.vx * dt; w.y += w.vy * dt;
        if (w.t > w.life || (origin && Math.hypot(w.x - origin.x, w.y - origin.y) > 11) || !openAt(w.x, w.y)) wisps.splice(i, 1);
      }
      if (wisps.length < cap) seedFog(th, 1);
    } else wisps = [];

    if (M.shafts && th.shafts && !shafts.length) placeShafts(th);
    if (!(M.shafts && th.shafts)) shafts = [];

    if (M.motes && th.motes && typeof addP === 'function' && (!G.particles || G.particles.length < 1800)) {
      const rate = (lite ? 3 : 8) * dt;
      if (fr() < rate && typeof P !== 'undefined') {
        const a = fa(0, Math.PI * 2), d = fa(0.7, 4.2);
        const x = P.x + Math.cos(a) * d, y = P.y + Math.sin(a) * d;
        if (openAt(x, y)) {
          addP({ k: 'mote', x, y, z: flz(x, y) + fa(0.3, 2.0), vx: fa(-0.05, 0.05), vy: fa(-0.05, 0.05), vz: fa(-0.03, 0.04), size: 0.02, col: RGB(th.col[0], th.col[1], th.col[2]), life: fa(1.8, 3.6) });
          M.n.motes++;
        }
      }
    }
    if (M.embers && th.embers && typeof addP === 'function' && (!G.particles || G.particles.length < 1800)) {
      const rate = (lite ? 2 : 6) * dt;
      if (fr() < rate && typeof P !== 'undefined') {
        const a = fa(0, Math.PI * 2), d = fa(0.5, 3.2);
        const x = P.x + Math.cos(a) * d, y = P.y + Math.sin(a) * d;
        if (openAt(x, y)) {
          addP({ k: 'ember', x, y, z: flz(x, y) + fa(0.2, 1.4), vx: fa(-0.15, 0.15), vy: fa(-0.15, 0.15), vz: fa(0.3, 0.9), size: 0.024, col: RGB(255, 120 + (fr() * 80 | 0), 40), life: fa(0.6, 1.4) });
          M.n.embers++;
        }
      }
    }

    if (M.rain && th.rain) {
      const cap = Math.ceil((lite ? 5 : 14) * k);
      for (let i = rains.length - 1; i >= 0; i--) {
        const r = rains[i]; r.t += dt; r.z += r.vz * dt;
        if (r.t > r.life || r.z < flz(r.x, r.y) + 0.05) rains.splice(i, 1);
      }
      if (rains.length < cap) seedRain(th, 1);
    } else rains = [];
  }

  function draw(cam) {
    const th = themeOf();
    M.q = atmQ();
    if (!th || M.q <= 0 || !cam) return;
    if ((window.RUN && (RUN.stage | 0)) !== M.stage) resetStage(th);
    try {
      if (M.fog && th.fog && typeof drawWisp === 'function') {
        for (const w of wisps) {
          const k = Math.min(1, w.t / 1.2, (w.life - w.t) / 1.8); if (k <= 0) continue;
          drawWisp(cam, w.x, w.y, w.z, w.rw, w.rh, w.c[0], w.c[1], w.c[2], w.a * k);
          M.n.fog++;
        }
      }
      if (M.shafts && th.shafts && typeof drawShaft === 'function') {
        for (const s of shafts) { drawShaft(cam, s, (window.G && G.t) || 0); M.n.shafts++; }
      }
      if (M.rain && th.rain && typeof drawParticle === 'function') {
        const col = RGB(170, 190, 220);
        for (const r of rains) {
          for (let k = 0; k < 3; k++) drawParticle(cam, r.x, r.y, r.z + k * 0.14, 0.026, col, 1);
          M.n.rain++;
        }
      }
    } catch (e) { fail('draw', e); }
  }
  M.tick = tick; M.draw = draw; M.atmQ = atmQ;
  M.refresh = function () { const th = themeOf(); if (th) resetStage(th); };

  function hook() {
    if (typeof update === 'function' && !update._m21m) {
      const _u = update;
      update = function (dt) {
        const r = _u.apply(this, arguments);
        try { tick(typeof dt === 'number' && dt > 0 && dt < 0.2 ? dt : 0.016); } catch (e) { fail('up', e); }
        return r;
      };
      update._m21m = 1;
    }
    if (typeof renderAtmos === 'function' && !renderAtmos._m21m) {
      const _ra = renderAtmos;
      renderAtmos = function (cam) {
        const r = _ra.apply(this, arguments);
        try { draw(cam); } catch (e) { fail('ra', e); }
        return r;
      };
      renderAtmos._m21m = 1;
    }
  }
  try { hook(); } catch (e) { fail('hook', e); }
  M.ready = 1;
  setTimeout(function () { try { hook(); M.ready = 1; } catch (e) { fail('late', e); } }, 0);
})();
