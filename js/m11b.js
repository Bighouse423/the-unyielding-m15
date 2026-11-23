// ===== M11b: LIGHTING II (visual only, world layer) =====
//  1. Dynamic light from the action: every m11 impact / kill / fire + holy burst, burning foes, elite auras, Emberbrand in
//     hand, glowing pickups. Added to the lightmap for one frame and restored before postFX (like m9e).
//  2. Glossy floors: a screen-space planar reflection under every wall, step and sprite (strength per stage: wet crypt
//     stone and polished cathedral marble shine, sand barely does), plus contact occlusion where walls and feet meet the
//     floor. Both written into PIX before the LUT, so they are graded and bloomed like the world, never on the hands.
//  3. Per-stage cinematic grade on top of the m9e grade (deeper shadows, a touch more contrast, a stage mood tint).
//  4. Low HP drains colour from the world (not the HUD or hands).
// Own PRNG / no Math.random. ?m11=0 disables (whole m11). ?m11fx=0 disables just this file's look (for before/after).
(function () {
  const M11 = window.M11; if (!M11 || !M11.on) return;
  const L2 = M11.L2 = { on: !/[?&]m11fx=0/.test(location.search), ST: { lights: 0, cols: 0, ms: 0 } };
  const gq = () => (typeof GFX === 'undefined' ? 2 : GFX.q);
  const live = () => L2.on && FX.on && gq() > 0 && G.state !== 'title';
  // ---------- stage looks ----------
  // refl: floor gloss, ao: contact occlusion, mood: [r,g,b] shadow tint for the grade, con: extra contrast
  const LOOK = {
    nave: { refl: 0.36, ao: 0.36, mood: [0.03, -0.01, 0.06], con: 0.15, gloom: 0.55 },
    witch: { refl: 0.26, ao: 0.32, mood: [-0.01, 0.03, 0.05], con: 0.10 },
    blood: { refl: 0.30, ao: 0.34, mood: [0.06, -0.02, 0.01], con: 0.12 },
    crypt: { refl: 0.34, ao: 0.36, mood: [-0.01, 0.03, 0.03], con: 0.12 },
    ossuary: { refl: 0.30, ao: 0.36, mood: [0.05, -0.02, 0.02], con: 0.12 },
    courtyard: { refl: 0.28, ao: 0.30, mood: [-0.01, 0.0, 0.06], con: 0.10 },
    belfry: { refl: 0.24, ao: 0.34, mood: [0.02, 0.0, 0.05], con: 0.13 },
    arena: { refl: 0.12, ao: 0.32, mood: [0.06, 0.02, -0.02], con: 0.15 },
    necropolis: { refl: 0.22, ao: 0.34, mood: [-0.02, 0.04, 0.02], con: 0.12 },
    kennels: { refl: 0.26, ao: 0.38, mood: [0.06, 0.0, -0.01], con: 0.16, gloom: 0.6 },
    cathedral: { refl: 0.36, ao: 0.30, mood: [0.02, 0.0, 0.05], con: 0.10 },
    throne: { refl: 0.34, ao: 0.34, mood: [0.04, -0.02, 0.06], con: 0.12 },
    abyss: { refl: 0.30, ao: 0.36, mood: [0.03, -0.02, 0.07], con: 0.13 },
    hub: { refl: 0.26, ao: 0.30, mood: [0.02, 0.0, 0.04], con: 0.08 },
  };
  function themeKey() {
    if (typeof SFX !== 'undefined' && SFX.stageKey === 'hub') return 'hub';
    if (typeof SFX !== 'undefined' && SFX.stageKey === 'abyss') return 'abyss';
    if (typeof RUN === 'undefined' || !RUN.on || !RUN.cfg) return 'nave';
    const th = typeof curTheme === 'function' ? curTheme() : null;
    return (th && th.variant) || RUN.cfg.theme || 'nave';
  }
  const look = () => LOOK[themeKey()] || LOOK.nave;
  L2.look = look; L2.themeKey = themeKey;

  // ---------- 1. dynamic light ----------
  let SI = new Int32Array(4096), SR = new Float32Array(4096), SG = new Float32Array(4096), SB = new Float32Array(4096), nS = 0, applied = false;
  const grow = () => { const n = SI.length * 2, a = new Int32Array(n), b = new Float32Array(n), c = new Float32Array(n), d = new Float32Array(n); a.set(SI); b.set(SR); c.set(SG); d.set(SB); SI = a; SR = b; SG = c; SB = d; };
  function light(x, y, R, c, k) {
    const LW = MW * LR, LH = MH * LR;
    const x0 = Math.max(0, Math.floor((x - R) * LR)), x1 = Math.min(LW - 1, Math.ceil((x + R) * LR)), y0 = Math.max(0, Math.floor((y - R) * LR)), y1 = Math.min(LH - 1, Math.ceil((y + R) * LR));
    for (let ly = y0; ly <= y1; ly++) for (let lx = x0; lx <= x1; lx++) {
      const wx = (lx + 0.5) / LR, wy = (ly + 0.5) / LR, d = Math.hypot(wx - x, wy - y); if (d > R) continue;
      const ci = (wy | 0) * MW + (wx | 0); if (SOLID[ci] === 1) continue;
      if (d > 0.7 && !losCells(x, y, wx, wy)) continue;
      let f = 1 - d / R; f = f * f * k; const idx = ly * LW + lx;
      if (nS >= SI.length) grow(); SI[nS] = idx; SR[nS] = LMr[idx]; SG[nS] = LMg[idx]; SB[nS] = LMb[idx]; nS++;
      LMr[idx] += c[0] * f; LMg[idx] += c[1] * f; LMb[idx] += c[2] * f;
    }
    L2.ST.lights++;
  }
  function restore() { if (!applied) return; for (let j = nS - 1; j >= 0; j--) { const i = SI[j]; LMr[i] = SR[j]; LMg[i] = SG[j]; LMb[i] = SB[j]; } nS = 0; applied = false; }
  let rdt = 0, lastPN = 0;
  function applyLights() {
    restore(); L2.ST.lights = 0;
    const pn = performance.now(); rdt = lastPN ? Math.min(0.05, Math.max(0, (pn - lastPN) / 1000)) : 0; lastPN = pn; if (M11.freeze) rdt = 0;
    const T = M11.lights;
    if (!live() || !LMr || !LEVEL) { for (let i = T.length - 1; i >= 0; i--) { T[i].t += rdt; if (T[i].t > T[i].life) T.splice(i, 1); } return; }
    applied = true; const t = G.t, near = (x, y, r) => Math.abs(x - P.x) + Math.abs(y - P.y) < r;
    for (let i = T.length - 1; i >= 0; i--) { const l = T[i]; l.t += rdt; if (l.t > l.life) { T.splice(i, 1); continue; } if (!near(l.x, l.y, 18)) continue; const k = 1 - l.t / l.life; light(l.x, l.y, l.r, l.c, l.i * k * k); }
    if (gq() < 2 && L2.ST.lights > 6) return;
    let nb = 0, ne = 0;
    for (const e of G.enemies) {
      if (!e.alive || e.hidden || !near(e.x, e.y, 15)) continue;
      if (e.burnT > 0 && nb < 6) { nb++; const fl = 0.75 + 0.25 * Math.sin(t * 17 + e.x * 3) * Math.sin(t * 7.3 + e.y); light(e.x, e.y, 2.4, [1.0, 0.48, 0.12], 0.42 * fl * Math.min(1, e.burnT / 0.5)); }
      else if (e.elite && ne < 4 && typeof ELITES !== 'undefined' && ELITES[e.elite[0]]) { ne++; const tc = ELITES[e.elite[0]].tint; light(e.x, e.y, 1.9, [tc[0] / 255, tc[1] / 255, tc[2] / 255], 0.2 + 0.06 * Math.sin(t * 4 + e.x)); }
    }
    if (G.state === 'play' && P.wpn && P.wpn.sword === 'fire') { const fl = 0.8 + 0.2 * Math.sin(t * 13) * Math.sin(t * 5.1); light(P.x + Math.cos(P.ang) * 0.6, P.y + Math.sin(P.ang) * 0.6, P.sw ? 3.0 : 2.2, [1.0, 0.5, 0.15], (P.sw ? 0.32 : 0.16) * fl); }
    let np = 0;
    for (const p of G.pickups || []) { if (p.taken || np >= 5 || !near(p.x, p.y, 10)) continue; const d = typeof PICK !== 'undefined' && PICK[p.type]; if (!d || !d.gc) continue; np++; light(p.x, p.y, 1.3, [d.gc[0] / 255, d.gc[1] / 255, d.gc[2] / 255], 0.22 + 0.06 * Math.sin(t * 3 + p.x)); }
  }

  // ---------- 2. floor gloss + contact occlusion (one column pass over PIX/ZB) ----------
  let SIN = new Float32Array(1);
  function pixPass(cam) {
    const lk = look(); const q = gq(); if (q < 1) return;
    const t0 = performance.now();
    const hor = Math.round(EH / 2 + (cam ? cam.pitch : 0));
    const LEN = (q > 1 ? 46 : 28) * RK, AOF = 6 * RK, AOW = 3 * RK, RK2 = RK;
    const refl = lk.refl * 2.0, ao = lk.ao, wet = lk.refl > 0.25;
    const tt = G.t, step = q > 1 ? RK : 2 * RK;
    let cols = 0; const iLEN = 1 / LEN;
    if (wet) { if (SIN.length < EH) SIN = new Float32Array(EH); for (let yy = 0; yy < EH; yy++) SIN[yy] = Math.sin(yy * 0.9 / RK2 + tt * 2.2) * RK2; }
    const y0 = Math.max(1, hor + 1);
    for (let x = 0; x < EW; x += step) {
      let prev = ZB[(y0 - 1) * EW + x], vert = false;
      for (let y = y0; y < EH; y++) {
        const i = y * EW + x, d = ZB[i];
        const same = Math.abs(d - prev) <= prev * 2e-5;
        if (same) { vert = d < 1e8; prev = d; continue; }
        if (vert && d < prev) {
          // y-1 is the base of a vertical surface (wall / step / sprite) standing on this floor
          const base = y - 1; cols++;
          // contact occlusion: wall foot darkens a little, the floor next to it more
          for (let k = 1; k <= AOW && base - k + 1 >= 0; k++) { const j0 = (base - k + 1) * EW + x, m = 1 - ao * 0.35 * (1 - (k - 1) / AOW); for (let c = 0; c < step && x + c < EW; c++) { const j = j0 + c, q2 = PIX[j]; PIX[j] = 0xff000000 | (((((q2 >> 16) & 255) * m) | 0) << 16) | (((((q2 >> 8) & 255) * m) | 0) << 8) | (((q2 & 255) * m) | 0); } }
          let pd = d, yy = y;
          for (let k = 0; k < LEN && yy < EH; k++, yy++) {
            const j = yy * EW + x, dz = ZB[j];
            if (k > 0 && !(dz < pd) ) break;                 // left the floor (another wall/sprite starts)
            pd = dz;
            const am = k < AOF ? 1 - ao * (1 - k / AOF) * (1 - k / AOF) : 1;
            let sy = -1, f = 0, sx0 = 0;
            if (refl > 0.02) {
              sy = base - k - 1; if (sy < 0) break;
              const rip = wet ? Math.round(SIN[sy] * k * iLEN) : 0;
              sx0 = x + rip; f = refl * (1 - k / LEN);
            }
            for (let c = 0; c < step && x + c < EW; c++) {
              const jj = j + c, p0 = PIX[jj];
              let r = (p0 & 255) * am, g = ((p0 >> 8) & 255) * am, b = ((p0 >> 16) & 255) * am;
              if (sy >= 0) {
                let sx = sx0 + c; if (sx < 0) sx = 0; else if (sx >= EW) sx = EW - 1;
                const s = PIX[sy * EW + sx], sr = s & 255, sg = (s >> 8) & 255, sb = (s >> 16) & 255;
                // mostly the bright parts reflect (glass, flames, lit stone, glowing foes); darks stay dark
                if (sr > 24) r += (sr - 24) * f; if (sg > 24) g += (sg - 24) * f; if (sb > 24) b += (sb - 24) * f;
              }
              PIX[jj] = 0xff000000 | ((b > 255 ? 255 : b | 0) << 16) | ((g > 255 ? 255 : g | 0) << 8) | (r > 255 ? 255 : r | 0);
            }
          }
          y = yy - 1; prev = ZB[(yy - 1) * EW + x]; vert = false; continue;
        }
        vert = false; prev = d;
      }
    }
    L2.ST.cols = cols; L2.ST.ms = L2.ST.ms * 0.9 + (performance.now() - t0) * 0.1;
  }
  // ---------- 2b. depth gloom: distance sinks into shadow, bright things (flames, glass, glowing foes) stay lit ----------
  const GL = new Float32Array(256);
  const DK = new Int32Array(17 * 16 + 2), GLI = new Int32Array(256); let dkK = -1;
  function gloom() {
    const lk = look(), K = lk.gloom !== undefined ? lk.gloom : 0.45, D0 = 4.5, D1 = 17, N = EW * EH, inv = 1 / (D1 - D0);
    if (dkK !== K) { dkK = K; for (let j = 0; j < DK.length; j++) { const d = j / 16; let k = d <= D0 ? 0 : (d - D0) * inv; if (k > 1) k = 1; DK[j] = Math.round(k * (2 - k) * K * 256); }
      for (let l = 0; l < 256; l++) GLI[l] = Math.round(256 * (1 - (l < 140 ? 0 : Math.min(1, (l - 140) / 90)))); }
    const DKN = DK.length - 1, DKF = DK[DKN];
    for (let i = 0; i < N; i++) {
      const d = ZB[i]; if (d <= D0 || d > 1e8) continue;
      const q = PIX[i], r = q & 255, g = (q >> 8) & 255, b = (q >> 16) & 255, lum = (r * 77 + g * 150 + b * 29) >> 8;
      const di = (d * 16) | 0, m = 256 - (((di >= DKN ? DKF : DK[di]) * GLI[lum]) >> 8);
      PIX[i] = 0xff000000 | (((b * m) >> 8) << 16) | (((g * m) >> 8) << 8) | ((r * m) >> 8);
    }
  }
  // ---------- 4. low HP: the world loses its colour ----------
  function lowHP() {
    if (G.state !== 'play' || !P.maxhp) return; const f = P.hp / P.maxhp; if (f > 0.3 || P.hp <= 0) return;
    const k = Math.min(0.6, (1 - f / 0.3) * 0.6 + 0.15), N = EW * EH;
    for (let i = 0; i < N; i++) { const q = PIX[i], r = q & 255, g = (q >> 8) & 255, b = (q >> 16) & 255, l = (r * 77 + g * 150 + b * 29) >> 8;
      PIX[i] = 0xff000000 | (((b + (l * 0.9 - b) * k) | 0) << 16) | (((g + (l * 0.8 - g) * k) | 0) << 8) | ((r + (l * 1.05 - r) * k) | 0); }
  }
  // ---------- 3. grade: extra per-stage contrast + mood on the finished LUT ----------
  let gradedFor = null, lastGrd = null;
  const _lut = buildLUT;
  buildLUT = function (grd) {
    lastGrd = grd; const r = _lut.apply(this, arguments);
    try {
      gradedFor = null; if (!L2.on || !FX.lut) return r;
      const lk = look(), L = FX.lut, con = lk.con, mood = lk.mood;
      for (let i = 0; i < L.length; i++) {
        const q = L[i]; let R = (q & 255) / 255, G2 = ((q >> 8) & 255) / 255, B = ((q >> 16) & 255) / 255;
        const l = 0.299 * R + 0.587 * G2 + 0.114 * B, sh = (1 - l) * (1 - l);
        // contrast around 0.42 (keeps the bright purple/green identity, sinks the murk)
        R = 0.42 + (R - 0.42) * (1 + con); G2 = 0.42 + (G2 - 0.42) * (1 + con); B = 0.42 + (B - 0.42) * (1 + con);
        R += mood[0] * sh; G2 += mood[1] * sh; B += mood[2] * sh;
        // a touch of warm in the very top end (torch/glass highlights)
        if (l > 0.75) { const h = (l - 0.75) * 0.25; R += h; G2 += h * 0.6; }
        L[i] = 0xff000000 | ((Math.max(0, Math.min(255, B * 255)) | 0) << 16) | ((Math.max(0, Math.min(255, G2 * 255)) | 0) << 8) | (Math.max(0, Math.min(255, R * 255)) | 0);
      }
      gradedFor = themeKey();
    } catch (e) { }
    return r;
  };
  // ---------- hooks ----------
  let lastCam = null;
  const _rw = renderWorld;
  renderWorld = function (cam) { lastCam = cam; const l0 = performance.now(); try { applyLights(); L2.ST.lt = (L2.ST.lt || 0) * 0.9 + (performance.now() - l0) * 0.1; } catch (e) { restore(); if (!M11.err) { M11.err = String(e); console.warn('m11b light', e); } } return _rw.apply(this, arguments); };
  const _pf = postFX;
  postFX = function () {
    try { if (live()) { const g0 = performance.now(); if (gq() > 1) gloom(); L2.ST.g = (L2.ST.g || 0) * 0.9 + (performance.now() - g0) * 0.1; pixPass(lastCam); lowHP(); } } catch (e) { if (!M11.err) { M11.err = String(e); console.warn('m11b pix', e); } }
    const r = _pf.apply(this, arguments); restore(); return r;
  };
  L2.set = v => { L2.on = !!v; buildLUT(lastGrd); };
  L2.dbg = () => ({ ...L2.ST, theme: themeKey(), graded: gradedFor, refl: look().refl });
})();
