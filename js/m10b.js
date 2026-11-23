// ===== M10b: REMASTER pass (visual only) =====
// Everything here is drawn into the WORLD (PIX before postFX, or the low canvas before the viewmodel), so the locked
// hands/weapons are never touched. Own PRNG only (never Math.random / rand), so every gameplay roll is identical.
// ?rfx=0 turns the whole pass off (== m10a pixels). Scales with the GFX governor: q2 full, q1 lite, q0 off.
(function () {
  const R = window.M10R = { on: !/[?&]rfx=0/.test(location.search), A: [], SOUL: [], RING: [], lastT: -1, key: null };
  let seed = 0x2f6b9e31;
  const fr = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  const fa = (a, b) => a + (b - a) * fr();
  const gq = () => (typeof GFX === 'undefined' ? 2 : GFX.q);
  const live = () => R.on && FX.on && gq() > 0;
  const pk = (r, g, b, k) => ((Math.min(255, b * k) | 0) << 16) | ((Math.min(255, g * k) | 0) << 8) | (Math.min(255, r * k) | 0);

  // own additive dot: like drawParticle but capped at mx art-pixels and faded out near the lens (no big squares)
  function dot(cam, x, y, z, size, col, mx, k) {
    const dx = Math.cos(cam.ang), dy = Math.sin(cam.ang), rx = x - cam.x, ry = y - cam.y, depth = rx * dx + ry * dy; if (depth < 0.5) return;
    if (depth < 1.8) k *= (depth - 0.5) / 1.3; if (k <= 0.02) return;
    const sc = EP / depth, sx = EW / 2 + (-rx * dy + ry * dx) * sc, sy = EH / 2 + cam.pitch - (z - cam.eye) * sc;
    let sz = size * sc * 0.7; if (sz < RK) sz = RK; if (sz > mx * RK) sz = mx * RK; const n = Math.round(sz) || 1;
    const x0 = Math.round(sx - n / 2), y0 = Math.round(sy - n / 2);
    const cr = (col & 255) * k, cg = ((col >> 8) & 255) * k, cb = ((col >> 16) & 255) * k;
    for (let r = y0; r < y0 + n; r++) { if (r < 0 || r >= EH) continue; for (let c = x0; c < x0 + n; c++) { if (c < 0 || c >= EW) continue; const idx = r * EW + c; if (ZB[idx] <= depth) continue;
      const q = PIX[idx]; PIX[idx] = 0xff000000 | (Math.min(255, ((q >> 16) & 255) + cb) << 16) | (Math.min(255, ((q >> 8) & 255) + cg) << 8) | Math.min(255, (q & 255) + cr); } }
  }

  // ---------- 1. per-theme ambient life (drawn into PIX: z-tested, graded and bloomed like the rest of the world) ----------
  // kind: dust (drifting motes), ash (falling), ember (rising, flickering), spore (slow rise), firefly (wander + blink), sand (sideways), soul (violet, rising)
  const K = {
    dust: { col: [150, 120, 190], n: 34, sz: 0.035, vz: [-0.03, 0.05], dr: 0.12, z: [0.3, 2.4], life: [5, 9] },
    ash: { col: [120, 110, 120], n: 46, sz: 0.04, vz: [-0.45, -0.25], dr: 0.25, z: [0.2, 2.8], life: [4, 7] },
    redash: { col: [190, 40, 70], n: 38, sz: 0.04, vz: [-0.35, -0.15], dr: 0.2, z: [0.2, 2.6], life: [4, 7] },
    ember: { col: [255, 120, 30], n: 44, sz: 0.04, vz: [0.35, 0.8], dr: 0.3, z: [0.0, 2.6], life: [1.6, 3.2], flick: 1 },
    spore: { col: [70, 190, 120], n: 30, sz: 0.04, vz: [0.04, 0.14], dr: 0.1, z: [0.1, 1.6], life: [5, 9] },
    firefly: { col: [190, 255, 90], n: 22, sz: 0.05, vz: [-0.08, 0.08], dr: 0.45, z: [0.4, 1.8], life: [6, 11], blink: 1 },
    sand: { col: [200, 160, 100], n: 40, sz: 0.035, vz: [-0.05, 0.05], dr: 0.9, z: [0.05, 1.4], life: [2.5, 5], wind: 1 },
    soul: { col: [170, 90, 255], n: 36, sz: 0.045, vz: [0.12, 0.3], dr: 0.15, z: [0.0, 2.4], life: [4, 8], blink: 1 },
  };
  const THEMEK = {
    nave: ['dust'], witch: ['dust', 'spore'], blood: ['redash', 'dust'], crypt: ['spore', 'dust'], ossuary: ['redash', 'spore'],
    courtyard: ['firefly', 'dust'], belfry: ['dust', 'ash'], arena: ['sand', 'ember'], necropolis: ['firefly', 'spore'],
    kennels: ['ember', 'ash'], cathedral: ['ash', 'dust'], throne: ['soul', 'ash'], abyss: ['soul', 'spore'], hub: ['dust'],
  };
  function themeKey() {
    if (typeof SFX !== 'undefined' && SFX.stageKey === 'hub') return 'hub';
    if (typeof RUN === 'undefined' || !RUN.on || !RUN.cfg) return 'nave';
    const th = typeof curTheme === 'function' ? curTheme() : null;
    return (th && th.variant) || RUN.cfg.theme || 'nave';
  }
  function spawn(p, kd, near) {
    const a = fr() * 6.283, d = near ? fa(2.2, 8) : fa(6, 8.5);
    p.x = P.x + Math.cos(a) * d; p.y = P.y + Math.sin(a) * d;
    const fz = floorAt(p.x, p.y); p.ok = fz < 50; p.fz = fz < 50 ? fz : 0;
    p.z = p.fz + fa(kd.z[0], kd.z[1]); p.vz = fa(kd.vz[0], kd.vz[1]);
    p.vx = fa(-kd.dr, kd.dr); p.vy = fa(-kd.dr, kd.dr); if (kd.wind) { p.vx = kd.dr * 0.8; p.vy = kd.dr * 0.3; }
    p.t = 0; p.life = fa(kd.life[0], kd.life[1]); p.ph = fr() * 6.283;
  }
  function stepAmb(dt) {
    const key = themeKey();
    if (key !== R.key) { R.key = key; R.A.length = 0; const ks = THEMEK[key] || ['dust']; for (const k of ks) { const kd = K[k]; for (let i = 0; i < kd.n; i++) { const p = { k }; spawn(p, kd, true); p.t = fr() * p.life; R.A.push(p); } } }
    for (const p of R.A) {
      const kd = K[p.k]; p.t += dt;
      if (kd.blink || p.k === 'firefly') { p.vx += Math.sin(G.t * 1.3 + p.ph) * dt * 0.3; p.vy += Math.cos(G.t * 1.1 + p.ph * 1.7) * dt * 0.3; }
      p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
      if (p.t > p.life || Math.abs(p.x - P.x) > 9 || Math.abs(p.y - P.y) > 9 || p.z < p.fz - 0.05 || p.z > p.fz + 3.2 || !p.ok) spawn(p, kd, false);
    }
  }
  function drawAmb(cam) {
    const lite = gq() < 2;
    for (let i = 0; i < R.A.length; i++) {
      if (lite && (i & 1)) continue;
      const p = R.A[i], kd = K[p.k]; if (!p.ok) continue;
      let k = Math.min(1, p.t / 0.8, (p.life - p.t) / 0.8); if (k <= 0) continue;
      if (kd.blink) k *= 0.35 + 0.65 * Math.max(0, Math.sin(G.t * 2.4 + p.ph * 3));
      if (kd.flick) k *= 0.7 + 0.3 * Math.sin(G.t * 23 + p.ph * 5);
      const c = kd.col; dot(cam, p.x, p.y, p.z, kd.sz * 0.6, pk(c[0], c[1], c[2], 1), 1, k * 0.42);
    }
  }

  // ---------- 2. soul wisps rising from every kill + ground rings for fire/holy bursts ----------
  function stepFx(dt) {
    for (let i = R.SOUL.length - 1; i >= 0; i--) { const s = R.SOUL[i]; s.t += dt; if (s.t > s.life) R.SOUL.splice(i, 1); }
    for (let i = R.RING.length - 1; i >= 0; i--) { const r = R.RING[i]; r.t += dt; if (r.t > r.life) R.RING.splice(i, 1); }
  }
  function soulPos(s, t) { return [s.x + Math.sin(t * 6 + s.ph) * 0.08 * t, s.y + Math.cos(t * 5 + s.ph) * 0.08 * t, s.z + t * 1.25 + t * t * 0.3]; }
  function drawFx(cam) {
    for (const s of R.SOUL) {
      const k = Math.min(1, s.t / 0.15) * Math.max(0, 1 - s.t / s.life), c = s.col;
      for (let j = 6; j >= 0; j--) {
        const tt = Math.max(0, s.t - j * 0.045); const q = soulPos(s, tt); const f = 1 - j / 7;
        dot(cam, q[0], q[1], q[2], s.sz * (0.5 + 0.5 * f), pk(c[0], c[1], c[2], 1), j ? 1 : 2, k * f * (j ? 0.55 : 1));
      }
    }
    for (const r of R.RING) {
      const f = r.t / r.life, rad = r.r * (0.25 + 0.75 * Math.sqrt(f)), k = (1 - f) * (1 - f), c = r.col, n = gq() >= 2 ? 28 : 16;
      for (let i = 0; i < n; i++) { const a = i / n * 6.283 + r.ph; dot(cam, r.x + Math.cos(a) * rad, r.y + Math.sin(a) * rad, r.z + 0.06 + f * 0.25, 0.07, pk(c[0], c[1], c[2], 1), 2, k); }
    }
  }
  const _kill = killEnemy;
  killEnemy = function (e, o) {
    const was = e && e.alive; const r = _kill.apply(this, arguments);
    if (R.on && was && e && !e.summoned && R.SOUL.length < 40) {
      const boss = e.d && e.d.boss, th = themeKey();
      const col = boss ? [255, 220, 120] : (e.elite ? [255, 200, 90] : th === 'kennels' || th === 'arena' ? [255, 150, 70] : th === 'crypt' || th === 'necropolis' || th === 'witch' ? [110, 255, 170] : [190, 120, 255]);
      const n = boss ? 6 : 1;
      for (let i = 0; i < n; i++) R.SOUL.push({ x: e.x + (i ? fa(-0.5, 0.5) : 0), y: e.y + (i ? fa(-0.5, 0.5) : 0), z: (e.z || 0) + (e.h || 1) * 0.55, t: -i * 0.12, life: boss ? 2.2 : 1.35, ph: fr() * 6.28, col, sz: boss ? 0.09 : 0.065 });
    }
    return r;
  };
  window.M10 = window.M10 || {};
  M10.burst = function (x, y, z, kind, rad) {
    if (!R.on || R.RING.length > 24) return;
    R.RING.push({ x, y, z: floorAt(x, y) < 50 ? floorAt(x, y) : z, r: (rad || 1.4) * 1.05, t: 0, life: 0.45, ph: fr() * 6.28, col: kind === 'holy' ? [255, 235, 150] : [255, 110, 30] });
  };

  // hit sparks: a short radial spray at every hit (white-hot; orange for fire; gold for holy/crossbow)
  R.SP = [];
  const _oh = rogueOnHit;
  rogueOnHit = function (e, o, dmg) {
    const r = _oh.apply(this, arguments);
    if (R.on && e && R.SP.length < 160) {
      const src = (o && o.src) || '', fire = src === 'burn' || (typeof P !== 'undefined' && P.wpn && P.wpn.sword === 'fire' && !/bolt|pistol|xbow/.test(src));
      const col = fire ? [255, 130, 40] : /bolt|xbow|holy|smite/.test(src) ? [255, 220, 130] : [255, 235, 210];
      const n = (o && o.heavy) ? 14 : 8, z = (e.z || 0) + (e.h || 1) * 0.5;
      for (let i = 0; i < n; i++) { const a = fr() * 6.283, v = fa(0.8, 2.4); R.SP.push({ x: e.x, y: e.y, z, vx: Math.cos(a) * v, vy: Math.sin(a) * v, vz: fa(0.2, 2.2), t: 0, life: fa(0.2, 0.42), col }); }
    }
    return r;
  };
  function stepSp(dt) { for (let i = R.SP.length - 1; i >= 0; i--) { const s = R.SP[i]; s.t += dt; if (s.t > s.life) { R.SP.splice(i, 1); continue; } s.x += s.vx * dt; s.y += s.vy * dt; s.z += s.vz * dt; s.vz -= 6 * dt; } }
  function drawSp(cam) { for (const s of R.SP) { const k = 1 - s.t / s.life, c = s.col; dot(cam, s.x, s.y, s.z, 0.03, pk(c[0], c[1], c[2], 1), 1, 0.4 + 0.6 * k); } }

  // ---------- 3. contact shadows under every enemy (grounds the sprites; PIX before the sprites are drawn) ----------
  function shadows(cam) {
    const dx = Math.cos(cam.ang), dy = Math.sin(cam.ang), hor = EH / 2 + cam.pitch;
    for (const e of G.enemies) {
      if (!e.alive && !(e.dead && e.deathT < 0.5) || e.hidden) continue;
      const fz = floorAt(e.x, e.y); if (fz > 50) continue; const hgt = (e.z || 0) - fz; if (hgt > 2.6) continue;
      const rx = e.x - cam.x, ry = e.y - cam.y, depth = rx * dx + ry * dy; if (depth < 0.6 || depth > 22) continue;
      const sc = EP / depth, lat = -rx * dy + ry * dx, sx = EW / 2 + lat * sc, sy = hor - (fz - cam.eye) * sc;
      const rr = Math.max(0.22, (e.r || 0.35) * 1.25) * (1 + hgt * 0.25);
      const a = rr * sc, b = Math.max(1.2 * RK, a * Math.min(0.8, Math.max(0.12, (cam.eye - fz) / depth)));
      const str = (e.dead ? 1 - e.deathT * 2 : 1) * 0.72 * Math.max(0, 1 - hgt / 2.6);
      if (str <= 0.02 || sx + a < 0 || sx - a > EW || sy + b < 0 || sy - b > EH) continue;
      const x0 = Math.max(0, Math.floor(sx - a)), x1 = Math.min(EW - 1, Math.ceil(sx + a)), y0 = Math.max(0, Math.floor(sy - b)), y1 = Math.min(EH - 1, Math.ceil(sy + b));
      const ia = 1 / a, ib = 1 / b;
      for (let y = y0; y <= y1; y++) { const v = (y - sy) * ib, v2 = v * v; if (v2 >= 1) continue;
        for (let x = x0; x <= x1; x++) { const u = (x - sx) * ia, f = u * u + v2; if (f >= 1) continue; const idx = y * EW + x; if (ZB[idx] < depth - 0.6) continue;
          const m = 1 - str * (1 - f) * (1 - f) * 1.6 > 0.35 ? 1 - str * (1 - f) * (1 - f) * 1.6 : 0.35; const q = PIX[idx];
          PIX[idx] = 0xff000000 | (((((q >> 16) & 255) * m) | 0) << 16) | (((((q >> 8) & 255) * m) | 0) << 8) | (((q & 255) * m) | 0); } }
    }
  }
  const _ds = drawSprites;
  drawSprites = function (cam, S) { if (live() && G.enemies && G.state !== 'title') { try { shadows(cam); } catch (e) { } } return _ds.apply(this, arguments); };

  // hook the world atmosphere pass (runs right before postFX)
  const _ra = renderAtmos;
  renderAtmos = function (cam) {
    _ra.apply(this, arguments);
    if (!live() || G.state === 'title' || typeof P === 'undefined') return;
    const dt = R.lastT < 0 ? 0 : Math.max(0, Math.min(0.05, G.t - R.lastT)); R.lastT = G.t;
    stepAmb(dt); stepFx(dt); stepSp(dt); drawAmb(cam); drawFx(cam); drawSp(cam);
  };

  // ---------- 4. lens: god-ray streaks out of the bloom + fine film grain (low canvas, before slashes/bolts/viewmodel) ----------
  const GR = []; function grain() {
    for (let n = 0; n < 4; n++) { const c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d'), im = x.createImageData(W, H), d = im.data;
      for (let i = 0; i < W * H; i++) { const v = fr(); if (v < 0.5) { d[i * 4 + 3] = 0; continue; } const w = fr() < 0.5; d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = w ? 255 : 0; d[i * 4 + 3] = (fr() * (w ? 11 : 16)) | 0; }
      x.putImageData(im, 0, 0); GR.push(c); } }
  let SC = null, SX = null;
  // the hottest bloom cells (white-hot only: torch cores, windows, flashes), tinted violet-white and smeared sideways in JS on
  // the quarter-res buffer, so the whole streak pass costs ONE drawImage
  const SK = []; for (let k = -14; k <= 14; k++) SK.push(k === 0 ? 0 : Math.exp(-Math.abs(k) / 4.5) * 0.36);
  let HB = null;
  function streakSrc() {
    const w = FX.bloom.width, h = FX.bloom.height;
    if (!SC) { SC = document.createElement('canvas'); SC.width = w; SC.height = h; SX = SC.getContext('2d'); SC.im = SX.createImageData(w, h); HB = new Float32Array(w * h * 3); }
    const src = FX.bimg.data, d = SC.im.data;
    for (let i = 0, j = 0; i < src.length; i += 4, j += 3) {
      const r = src[i], g = src[i + 1], b = src[i + 2], l = Math.min(r, g, b) / 255;
      let k = l > 0.45 ? (l - 0.45) / 0.55 : 0; k *= k;
      HB[j] = (r * 0.5 + 110) * k; HB[j + 1] = (g * 0.4 + 90) * k; HB[j + 2] = (b * 0.4 + 150) * k;
    }
    for (let y = 0; y < h; y++) { const row = y * w;
      for (let x = 0; x < w; x++) { let R = 0, G2 = 0, B = 0;
        for (let k = 0; k < SK.length; k++) { const xx = x + k - 14; if (xx < 0 || xx >= w) continue; const q = (row + xx) * 3, wk = SK[k]; R += HB[q] * wk; G2 += HB[q + 1] * wk; B += HB[q + 2] * wk; }
        const o = (row + x) * 4; d[o] = R > 255 ? 255 : R; d[o + 1] = G2 > 255 ? 255 : G2; d[o + 2] = B > 255 ? 255 : B; d[o + 3] = 255; } }
    SX.putImageData(SC.im, 0, 0); return SC;
  }
  const _sl = drawSlashes;
  drawSlashes = function (ctx, cam, rdt) {
    if (live() && FX.bloom) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.imageSmoothingEnabled = true;
      // anamorphic streaks: bloom squared twice (only the hottest sources survive), tinted, smeared sideways
      const bc = streakSrc();
      ctx.globalAlpha = (gq() >= 2 ? 0.9 : 0.6) * (FX.bloomK || 1); ctx.drawImage(bc, 0, 0, W, H);
      ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
      if (gq() >= 2) { if (!GR.length) grain(); ctx.imageSmoothingEnabled = false; ctx.drawImage(GR[((G.t * 24) | 0) & 3], 0, 0, W, H); }
      ctx.restore();
    }
    return _sl.apply(this, arguments);
  };
  M10.v = 'm10b';
})();
