// ===== m21art: bigger art pass (world layer only; hands / viewmodel / weapon fx are never touched) =====
//  tex   : per-stage baked wall/floor/ceiling detail (bevel from luminance, mortar cavity AO, grime blotches, wall-foot
//          damp, moss in crevices, polished-floor glints). Built once per texture per stage, cached: zero per-frame cost.
//          Seeded per STAGE (not per texture) so secret "false" walls stay pixel-identical to their real twins.
//  light : baked lightmap rebalance: ambient pulled down, static lights + colored torch pools pushed up & saturated.
//  fog   : per-stage depth fog curve (m19.5 gfx2 fog table), weapon light reads stronger (flatter falloff, brighter).
//  post  : per-stage colour grade folded into the existing 64^3 LUT (free per frame) + per-stage tinted vignette canvas.
//  edge  : ink outline on depth silhouettes (sprites, wall corners), 1 pass over PIX before putImageData.
//  motes : per-stage ambient particles around the player (dust, spores, ash, embers, fireflies, sparks).
// Governor tie (M195.govState.level): 0-1 full | 2-3 no outline, half motes | 4+ outline & motes off.
// tex/light/fog/grade/vignette cost nothing per frame so they stay on. Weapon fx are not touched by anything here.
// Kill switches: ?art=0 (all) | ?arttex=0 ?artlight=0 ?artfog=0 ?artpost=0 ?artedge=0 ?artmotes=0 ?artwl=0
(function () {
  const q = location.search || '';
  const off = /[?&]art=0(?:&|$)/.test(q);
  const flag = k => !off && !new RegExp('[?&]' + k + '=0(?:&|$)').test(q);
  const ART = window.ART = { on: !off, tex: flag('arttex'), light: flag('artlight'), fog: flag('artfog'), post: flag('artpost'),
    edge: flag('artedge'), motes: flag('artmotes'), wl: flag('artwl'), err: null, errs: [], ms: 0, texMs: 0, nTex: 0, theme: null, level: 2 };
  const fail = (w, e) => { const s = w + ': ' + String(e && e.stack || e).slice(0, 240); if (!ART.err) ART.err = s; if (ART.errs.length < 20) ART.errs.push(s); };
  if (typeof renderWorld !== 'function' || typeof postFX !== 'function') { ART.on = false; return; }
  let live = ART.on;   // runtime master (ART.set)

  // ---------- per-stage styles ----------
  // gr: grime colour, gk: grime amount, moss: colour|null, mk: moss amount, bev/cav: relief strength
  // amb/stat/torch/sat: lightmap rebalance, fog: [D0,D1,KM], vig: [r,g,b,alpha], mote: {c,n,vz,size,tw}
  // grade: sh (shadow tint), hi (highlight tint), ds (midtone de-sat), mg (magenta/violet midtone pull), con (contrast)
  // wash: chroma-compress bright magenta/violet lightmap texels (floors keep grain; warm torches untouched)
  // haze: post-hazeVivid HZ scale
  const BASE = { gr: [34, 26, 30], gk: 0.5, moss: null, mk: 0, bev: 1, cav: 1, amb: 0.66, stat: 1.25, torch: 1.6, sat: 1.3,
    fog: [2.0, 18, 0.64], vig: [22, 0, 34, 0.56], mote: { c: [255, 205, 150], n: 34, vz: 0.02, size: 0.035, tw: 1 },
    haze: 0.88, wash: 0, shld: 1.05,
    grade: { sh: [0.015, -0.01, 0.035], hi: [0.035, 0.018, -0.015], ds: 0.24, con: 0.1, mg: 0 } };
  const S = (o) => Object.assign({}, BASE, o, { grade: Object.assign({}, BASE.grade, o.grade || {}), mote: Object.assign({}, BASE.mote, o.mote || {}) });
  const STY = {
    nave: S({ gr: [40, 26, 32], gk: 0.45, mote: { c: [255, 210, 160], n: 36, vz: 0.015 } }),
    crypt: S({ gr: [18, 30, 22], gk: 0.62, moss: [58, 112, 46], mk: 0.9, fog: [1.8, 15, 0.68], vig: [0, 16, 12, 0.58],
      mote: { c: [120, 255, 150], n: 30, vz: 0.05, size: 0.03 }, grade: { sh: [-0.01, 0.025, 0.02], hi: [0.03, 0.03, -0.01] } }),
    ossuary: S({ gr: [52, 18, 18], gk: 0.6, fog: [1.8, 16, 0.66], vig: [30, 0, 8, 0.6], mote: { c: [255, 120, 90], n: 32, vz: -0.06, size: 0.03 },
      grade: { sh: [0.035, -0.015, 0.0], hi: [0.04, 0.012, -0.02] } }),
    courtyard: S({ gr: [30, 34, 22], gk: 0.5, moss: [70, 124, 48], mk: 1.1, sat: 1.1, wash: 0.35, haze: 0.78, fog: [2.2, 18, 0.64], vig: [8, 4, 30, 0.5],
      mote: { c: [210, 255, 120], n: 26, vz: 0.01, size: 0.04, tw: 2.5 }, grade: { sh: [-0.005, 0.01, 0.035], ds: 0.32, mg: 0.10, con: 0.11 } }),
    belfry: S({ gr: [46, 32, 22], gk: 0.55, sat: 1.05, torch: 1.35, wash: 0.58, shld: 0.86, haze: 0.72, fog: [1.8, 16, 0.68],
      mote: { c: [255, 220, 170], n: 40, vz: -0.012, size: 0.03 },
      grade: { sh: [0.02, 0.0, 0.02], hi: [0.05, 0.03, -0.03], ds: 0.42, mg: 0.18, con: 0.12 } }),
    arena: S({ gr: [62, 34, 18], gk: 0.55, fog: [2.2, 18, 0.62], vig: [30, 8, 0, 0.55], mote: { c: [255, 150, 60], n: 32, vz: 0.12, size: 0.03, tw: 3 },
      grade: { sh: [0.03, 0.005, -0.015], hi: [0.05, 0.02, -0.03] } }),
    necropolis: S({ gr: [16, 26, 30], gk: 0.6, moss: [44, 98, 82], mk: 0.9, fog: [1.6, 14, 0.7], vig: [0, 10, 26, 0.6],
      mote: { c: [110, 255, 220], n: 30, vz: 0.03, size: 0.03, tw: 1.6 }, grade: { sh: [-0.015, 0.02, 0.035], hi: [0.02, 0.03, 0.0] } }),
    kennels: S({ gr: [52, 20, 12], gk: 0.62, fog: [1.8, 15, 0.68], vig: [34, 4, 0, 0.6], mote: { c: [255, 130, 50], n: 34, vz: 0.14, size: 0.03, tw: 3 },
      grade: { sh: [0.035, 0.0, -0.01], hi: [0.05, 0.015, -0.03] } }),
    cathedral: S({ gr: [34, 30, 42], gk: 0.4, sat: 1.0, torch: 1.3, wash: 0.58, shld: 0.82, haze: 0.75, fog: [2.0, 17, 0.66], vig: [12, 4, 34, 0.5],
      mote: { c: [255, 225, 160], n: 40, vz: -0.01, size: 0.03 },
      grade: { sh: [0.01, 0.0, 0.035], hi: [0.05, 0.035, -0.015], ds: 0.4, mg: 0.16, con: 0.11 } }),
    throne: S({ gr: [26, 14, 40], gk: 0.45, sat: 1.0, torch: 1.25, wash: 0.58, shld: 0.78, haze: 0.7, fog: [1.8, 16, 0.7], vig: [20, 0, 40, 0.6],
      mote: { c: [200, 140, 255], n: 34, vz: 0.04, size: 0.03, tw: 2 },
      grade: { sh: [0.015, -0.01, 0.045], hi: [0.04, 0.025, -0.01], ds: 0.38, mg: 0.14, con: 0.12 } }),
    abyss: S({ gr: [20, 10, 34], gk: 0.5, fog: [1.6, 14, 0.7], vig: [14, 0, 30, 0.62], mote: { c: [190, 120, 255], n: 30, vz: 0.05 } }),
    hub: S({ gr: [36, 28, 30], gk: 0.35, amb: 0.78, torch: 1.4, fog: [2.6, 22, 0.55], mote: { c: [255, 215, 160], n: 30, vz: 0.012 } }),
  };
  function themeKey() {
    try {
      if (typeof RUN !== 'undefined' && RUN.hub) return 'hub';
      if (window.M11 && M11.L2 && M11.L2.themeKey) { const k = M11.L2.themeKey(); if (STY[k]) return k; }
      if (typeof RUN !== 'undefined' && RUN.on && RUN.cfg && STY[RUN.cfg.theme]) return RUN.cfg.theme;
    } catch (e) { }
    return 'nave';
  }
  const sty = () => STY[ART.theme || themeKey()] || STY.nave;
  const gov = () => { try { const g = window.M195 && M195.govState; return g ? g.level : 0; } catch (e) { return 0; } };

  // ---------- noise (tileable, per stage seed) ----------
  function hash(x, y, s) { let h = (x * 374761393 + y * 668265263 + s * 2147483647) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
  function vnoise(N, cells, seed) {   // N x N tileable value noise, `cells` lattice cells across
    const out = new Float32Array(N * N), cs = N / cells, sm = t => t * t * (3 - 2 * t);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const gx = x / cs, gy = y / cs, x0 = Math.floor(gx), y0 = Math.floor(gy), fx = sm(gx - x0), fy = sm(gy - y0);
      const a = hash(x0 % cells, y0 % cells, seed), b = hash((x0 + 1) % cells, y0 % cells, seed), c = hash(x0 % cells, (y0 + 1) % cells, seed), d = hash((x0 + 1) % cells, (y0 + 1) % cells, seed);
      out[y * N + x] = (a + (b - a) * fx) + ((c + (d - c) * fx) - (a + (b - a) * fx)) * fy;
    }
    return out;
  }
  const NZ = {};
  function noiseFor(theme) {
    if (NZ[theme]) return NZ[theme];
    let s = 7; for (let i = 0; i < theme.length; i++) s = (s * 31 + theme.charCodeAt(i)) | 0;
    const a = vnoise(64, 4, s), b = vnoise(64, 8, s + 1), c = vnoise(64, 16, s + 2), m = vnoise(64, 8, s + 3);
    const g = new Float32Array(4096), mo = new Float32Array(4096), dt = new Float32Array(4096);
    for (let i = 0; i < 4096; i++) { g[i] = a[i] * 0.55 + b[i] * 0.3 + c[i] * 0.15; mo[i] = m[i] * 0.6 + c[i] * 0.4; dt[i] = hash(i & 63, i >> 6, s + 9) - 0.5; }
    return (NZ[theme] = { g, mo, dt });
  }

  // ---------- material from texture name ----------
  const T = () => (typeof Engine !== 'undefined' && Engine.tex) || {};
  let nameMap = null, nameMapN = -1;
  function texName(t) {
    const TT = T(); const keys = Object.keys(TT);
    if (!nameMap || nameMapN !== keys.length) { nameMap = new Map(); for (const k of keys) { const v = TT[k]; if (v && typeof v === 'object' && v.d) nameMap.set(v, k); } nameMapN = keys.length; }
    return nameMap.get(t) || (t.m18ceil ? 'c_' + t.m18ceil : '');
  }
  const SKIP = /blood|lava|soulglass|water|ember|glass|window|rose|organ|portal|rune|fire|sky/;
  function material(name, role) {
    if (SKIP.test(name)) return null;
    if (/wood|plank|beam|pitwood|kennel|rack|shelf|door/.test(name)) return { bev: 0.75, cav: 0.8, grime: 0.8, moss: 0.3, dither: 0.8, gloss: 0 };
    if (/carpet|banner|hedge|grass|ivy|sand|soil|bog/.test(name)) return { bev: 0.4, cav: 0.5, grime: 0.55, moss: 0.2, dither: 1, gloss: 0 };
    if (/marble|mosaic|tile|obsidian|nave|altar|redmarble|statue/.test(name)) return { bev: 0.7, cav: 0.9, grime: 0.45, moss: 0.25, dither: 0.5, gloss: 1 };
    if (/grate|gate|irondoor|chain|iron|forge/.test(name)) return { bev: 1.1, cav: 1, grime: 0.7, moss: 0, dither: 0.6, gloss: 0.4 };
    if (role === 'tall') return { bev: 0.6, cav: 0.6, grime: 0.5, moss: 0.4, dither: 0.6, gloss: 0 };
    return { bev: 1, cav: 1, grime: 1, moss: 1, dither: 1, gloss: 0 };   // stone / brick / bone
  }

  // ---------- texture enhancement ----------
  function enhance(src, role, theme) {
    const name = texName(src) || '';
    const mat = material(name, role);
    const w = src.w, h = src.h, d = src.d, n = w * h;
    const out = {}; for (const k in src) if (k !== 'd') out[k] = src[k];
    out.m21 = theme; out.m21src = src;
    if (!mat || !d || d.length !== n) { out.d = d; return out; }
    const st = STY[theme] || STY.nave, nz = noiseFor(theme);
    const L = new Float32Array(n), B = new Float32Array(n), tmp = new Float32Array(n);
    for (let i = 0; i < n; i++) { const p = d[i]; L[i] = (p & 255) * 0.299 + ((p >> 8) & 255) * 0.587 + ((p >> 16) & 255) * 0.114; }
    // 5x5 box blur (wrap), separable
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { let s = 0; for (let k = -2; k <= 2; k++) s += L[y * w + ((x + k + w) % w)]; tmp[y * w + x] = s / 5; }
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { let s = 0; for (let k = -2; k <= 2; k++) s += tmp[((y + k + h) % h) * w + x]; B[y * w + x] = s / 5; }
    // stone/brick/plank segmentation: mortar = locally dark crevice; each enclosed stone gets its own tone + a chiselled edge
    const MZ = new Uint8Array(n), CMP = new Int32Array(n).fill(-1), stoneK = [];
    for (let i = 0; i < n; i++) MZ[i] = L[i] < B[i] - 7 ? 1 : 0;
    const stack = new Int32Array(n); let nc = 0;
    for (let s0 = 0; s0 < n; s0++) {
      if (MZ[s0] || CMP[s0] >= 0) continue;
      let sp = 0, sz = 0; stack[sp++] = s0; CMP[s0] = nc;
      while (sp) { const i = stack[--sp]; sz++; const x = i % w, y = (i / w) | 0;
        const nb = [y * w + ((x + 1) % w), y * w + ((x - 1 + w) % w), ((y + 1) % h) * w + x, ((y - 1 + h) % h) * w + x];
        for (let k = 0; k < 4; k++) { const j = nb[k]; if (!MZ[j] && CMP[j] < 0) { CMP[j] = nc; stack[sp++] = j; } } }
      stoneK.push(sz >= 10 && sz < n * 0.45 ? 1 + (hash(nc, 7, st.gr[0] + st.gr[2]) - 0.5) * 0.26 * mat.cav : 1); nc++;
    }
    let sumIn = 0, sumOut = 0;
    for (let i = 0; i < n; i++) sumIn += L[i];
    const o = new Uint32Array(n);
    const gk = st.gk * mat.grime, wallish = role === 'wall' || role === 'tall', ceil = role === 'ceil';
    const GR = st.gr, MO = st.moss, mk = (st.mk || 0) * mat.moss;
    for (let y = 0; y < h; y++) {
      const vy = wallish ? y / (h - 1) : 0, foot = vy * vy * vy;
      for (let x = 0; x < w; x++) {
        const i = y * w + x, p = d[i], a = p >>> 24;
        if (a === 250 || a < 200) { o[i] = p; continue; }   // emissive glass / cut-outs untouched
        let r = p & 255, g = (p >> 8) & 255, b = (p >> 16) & 255;
        const ni = ((((y * 64 / h) | 0) & 63) << 6) | (((x * 64 / w) | 0) & 63);
        const gx = L[y * w + ((x + 1) % w)] - L[y * w + ((x - 1 + w) % w)];
        const gy = L[((y + 1) % h) * w + x] - L[((y - 1 + h) % h) * w + x];
        let f = 1 - (gx + gy) * 0.0015 * st.bev * mat.bev;                 // light from top-left
        const cav = (L[i] - B[i]) / 255;
        f += cav < 0 ? cav * 2.4 * st.cav * mat.cav : cav * 0.6 * mat.cav; // deepen mortar / lift raised stone
        if (MZ[i]) f *= 1 - 0.22 * mat.cav;
        else {
          const c = CMP[i]; f *= stoneK[c];
          if (stoneK[c] !== 1) {   // chiselled edge: lit top/left rim, shadowed bottom/right rim
            const up = MZ[((y - 1 + h) % h) * w + x], lf = MZ[y * w + ((x - 1 + w) % w)], dn = MZ[((y + 1) % h) * w + x], rt = MZ[y * w + ((x + 1) % w)];
            const eb = st.bev * mat.bev; f += (up * 0.2 + lf * 0.11 - dn * 0.2 - rt * 0.1) * eb;
          }
        }
        const gn = nz.g[ni];
        let gm = Math.max(0, (gn - 0.38) / 0.36); gm = gm > 1 ? 1 : gm; gm *= gk;
        if (wallish) { gm += foot * 0.5 * mat.grime; f *= 1 - 0.2 * foot * mat.grime; }
        if (ceil) gm *= 1.2;
        f *= 1 - gm * 0.45;
        r *= f; g *= f; b *= f;
        const gmx = gm * 0.45; r += (GR[0] - r) * gmx; g += (GR[1] - g) * gmx; b += (GR[2] - b) * gmx;
        if (MO && mk > 0 && cav < -0.02) {
          const mv = nz.mo[ni]; if (mv > 0.5) {
            let m = (mv - 0.5) * 3.2 * Math.min(1, -cav * 14) * mk; if (wallish) m *= 0.6 + 0.8 * vy; if (m > 0.75) m = 0.75;
            const lk = 0.35 + L[i] / 255 * 1.1; r += (MO[0] * lk - r) * m; g += (MO[1] * lk - g) * m; b += (MO[2] * lk - b) * m;
          }
        }
        if (mat.gloss && L[i] > 120 && nz.dt[(ni * 7) & 4095] > 0.44) { const s = 26 * mat.gloss; r += s; g += s; b += s * 0.9; }
        const dd = nz.dt[ni] * 12 * mat.dither; r += dd; g += dd; b += dd;
        r = r < 0 ? 0 : r > 255 ? 255 : r; g = g < 0 ? 0 : g > 255 ? 255 : g; b = b < 0 ? 0 : b > 255 ? 255 : b;
        o[i] = ((a << 24) | ((b | 0) << 16) | ((g | 0) << 8) | (r | 0)) >>> 0;
      }
    }
    for (let i = 0; i < n; i++) { const p = o[i]; sumOut += (p & 255) * 0.299 + ((p >> 8) & 255) * 0.587 + ((p >> 16) & 255) * 0.114; }
    const gain = sumOut > 0 ? Math.min(1.25, (sumIn * (ceil ? 0.9 : 0.97)) / sumOut) : 1;
    if (gain > 1.01) for (let i = 0; i < n; i++) { const p = o[i], a = p >>> 24; if (a === 250 || a < 200) continue;
      const r = Math.min(255, (p & 255) * gain), g = Math.min(255, ((p >> 8) & 255) * gain), b = Math.min(255, ((p >> 16) & 255) * gain);
      o[i] = ((a << 24) | ((b | 0) << 16) | ((g | 0) << 8) | (r | 0)) >>> 0; }
    out.d = o; return out;
  }
  const CACHE = new WeakMap();   // src -> {role:theme: enhanced} (weak: generated per-floor textures can be collected)
  function enh(t, role, theme) {
    if (!t || !t.d) return t;
    if (t.m21) { if (t.m21 === theme) return t; t = t.m21src; }
    let c = CACHE.get(t); if (!c) { c = {}; CACHE.set(t, c); }
    const k = role + ':' + theme;
    if (!c[k]) { c[k] = enhance(t, role, theme); ART.nTex++; }
    return c[k];
  }
  const orig = t => (t && t.m21src) || t;
  let sigW = null, sigF = null, sigC = null, sigTheme = null;
  function dirty() {
    if (WALLDEFS !== sigW || FLOORTEX !== sigF || CEILTEX !== sigC || ART.theme !== sigTheme) return true;
    const want = live && ART.tex;
    for (let i = 0; i < FLOORTEX.length; i++) { const t = FLOORTEX[i]; if (t && !!t.m21 !== want) return true; }
    for (let i = 0; i < CEILTEX.length; i++) { const t = CEILTEX[i]; if (t && !!t.m21 !== want) return true; }
    for (let i = 0; i < WALLDEFS.length; i++) { const w = WALLDEFS[i]; if (w && w.base && !!w.base.m21 !== want) return true; }
    return false;
  }
  function dress() {
    const a = performance.now(), on = live && ART.tex, th = ART.theme;
    for (let i = 0; i < FLOORTEX.length; i++) if (FLOORTEX[i]) FLOORTEX[i] = on && i !== 6 ? enh(FLOORTEX[i], 'floor', th) : orig(FLOORTEX[i]);
    for (let i = 0; i < CEILTEX.length; i++) if (CEILTEX[i]) CEILTEX[i] = on ? enh(CEILTEX[i], 'ceil', th) : orig(CEILTEX[i]);
    for (let i = 0; i < WALLDEFS.length; i++) {
      const w = WALLDEFS[i]; if (!w || !w.base) continue;
      w.base = on ? enh(w.base, 'wall', th) : orig(w.base);
      if (w.tall && w.tall.t) w.tall.t = on ? enh(w.tall.t, 'tall', th) : orig(w.tall.t);
    }
    sigW = WALLDEFS; sigF = FLOORTEX; sigC = CEILTEX; sigTheme = th;
    ART.texMs = +(performance.now() - a).toFixed(1);
  }

  // ---------- lightmap rebalance ----------
  const LA = new WeakMap(), LO = new WeakMap();   // orig array -> art array, art -> orig
  let lastAmb = [0.4, 0.4, 0.4];
  function makeArt() {
    if (typeof LMr === 'undefined' || !LMr || LO.has(LMr) || LA.has(LMr)) return;
    const st = STY[themeKey()] || STY.nave, amb = lastAmb, N = LMr.length;
    const r = new Float32Array(N), g = new Float32Array(N), b = new Float32Array(N), tr = new Float32Array(N), tg = new Float32Array(N), tb = new Float32Array(N);
    const ka = st.amb, ks = st.stat, kt = st.torch, sat = st.sat;
    for (let i = 0; i < N; i++) {
      let R = LMr[i] - amb[0], G2 = LMg[i] - amb[1], B2 = LMb[i] - amb[2];
      R = R > 0 ? R * ks : R; G2 = G2 > 0 ? G2 * ks : G2; B2 = B2 > 0 ? B2 * ks : B2;
      r[i] = amb[0] * ka + R; g[i] = amb[1] * ka + G2; b[i] = amb[2] * ka + B2;
      const m = (LTr[i] + LTg[i] + LTb[i]) / 3;
      tr[i] = Math.max(0, (m + (LTr[i] - m) * sat) * kt); tg[i] = Math.max(0, (m + (LTg[i] - m) * sat) * kt); tb[i] = Math.max(0, (m + (LTb[i] - m) * sat) * kt);
      // soft shoulder: boosted pools never blow out to white (keeps texture detail in the hot spots)
      let x = r[i] + tr[i]; if (x > 1.05) { const k = (1.05 + (x - 1.05) * 0.3) / x; r[i] *= k; tr[i] *= k; }
      x = g[i] + tg[i]; if (x > 1.05) { const k = (1.05 + (x - 1.05) * 0.3) / x; g[i] *= k; tg[i] *= k; }
      x = b[i] + tb[i]; if (x > 1.05) { const k = (1.05 + (x - 1.05) * 0.3) / x; b[i] *= k; tb[i] *= k; }
      const wash = st.wash || 0;
      if (wash > 0) {
        const R = r[i] + tr[i], G3 = g[i] + tg[i], B3 = b[i] + tb[i];
        const luma = 0.299 * R + 0.587 * G3 + 0.114 * B3;
        const mag = (R + B3) * 0.5 - G3;
        if (mag > 0.05 && luma > 0.42) {
          let wk = wash * Math.min(1, (luma - 0.42) / 0.38) * Math.min(1, mag / 0.22);
          if (wk > 0.85) wk = 0.85;
          const nR = R + (luma - R) * wk, nG = G3 + (luma * 0.96 - G3) * wk * 0.4, nB = B3 + (luma - B3) * wk;
          const sR = R > 1e-6 ? nR / R : 1, sG = G3 > 1e-6 ? nG / G3 : 1, sB = B3 > 1e-6 ? nB / B3 : 1;
          r[i] *= sR; tr[i] *= sR; g[i] *= sG; tg[i] *= sG; b[i] *= sB; tb[i] *= sB;
        }
      }
      const shld = st.shld == null ? 1.05 : st.shld;
      const L2 = 0.299 * (r[i] + tr[i]) + 0.587 * (g[i] + tg[i]) + 0.114 * (b[i] + tb[i]);
      if (shld < 1.04 && L2 > shld) {
        const k = (shld + (L2 - shld) * 0.28) / L2;
        r[i] *= k; tr[i] *= k; g[i] *= k; tg[i] *= k; b[i] *= k; tb[i] *= k;
      }
    }
    const pairs = [[LMr, r], [LMg, g], [LMb, b], [LTr, tr], [LTg, tg], [LTb, tb]];
    for (const [o, a] of pairs) { LA.set(o, a); LO.set(a, o); }
  }
  function applyLM() {
    if (typeof LMr === 'undefined' || !LMr) return;
    const want = live && ART.light;
    if (want) {
      if (LO.has(LMr)) return; makeArt(); const m = x => LA.get(x) || x;
      LMr = m(LMr); LMg = m(LMg); LMb = m(LMb); LTr = m(LTr); LTg = m(LTg); LTb = m(LTb);
    } else {
      if (!LO.has(LMr)) return; const m = x => LO.get(x) || x;
      LMr = m(LMr); LMg = m(LMg); LMb = m(LMb); LTr = m(LTr); LTg = m(LTg); LTb = m(LTb);
    }
  }
  if (typeof buildLightmap === 'function') {
    const _bl = buildLightmap;
    buildLightmap = function (lights, ambient) {
      const r = _bl.apply(this, arguments);
      try { lastAmb = ambient ? [ambient[0], ambient[1], ambient[2]] : [0.4, 0.4, 0.4]; ART.theme = themeKey(); applyLM(); } catch (e) { fail('lm', e); }
      return r;
    };
  }

  // ---------- fog + weapon light (m19.5 gfx2 tables) ----------
  let fogKey = null, wlOrig = null, littOrig = null;
  function applyFog() {
    const gs = window.M195 && M195.gfxState; if (!gs || !gs.buildFog) return;
    const want = live && ART.fog, k = want ? ART.theme : 'off';
    if (k !== fogKey) { fogKey = k; const f = want ? sty().fog : [2.0, 19, 0.6]; gs.buildFog(f[0], f[1], f[2]); }
    if (gs.WL && gs.LITT) {
      if (!wlOrig) { wlOrig = {}; for (const kk in gs.WL) wlOrig[kk] = gs.WL[kk].slice(); littOrig = gs.LITT.slice(); }
      const wwant = live && ART.wl;
      if (wwant !== ART._wlOn) {
        ART._wlOn = wwant;
        for (const kk in gs.WL) { const a = gs.WL[kk], o0 = wlOrig[kk]; a[3] = wwant ? Math.min(1.45, o0[3] * 1.35) : o0[3]; }
        for (let i = 0; i < gs.LITT.length; i++) { const dd = i / 16, k2 = Math.max(0, 1 - dd / 4); gs.LITT[i] = wwant ? Math.round(256 * Math.pow(k2, 1.35)) : littOrig[i]; }
      }
    }
  }

  // ---------- grade (folded into the LUT) + vignette ----------
  let lastGrd = null, vigOrig = null, vigKey = null;
  if (typeof buildLUT === 'function') {
    const _lut = buildLUT;
    buildLUT = function (grd) {
      lastGrd = grd === undefined ? null : grd; const r = _lut.apply(this, arguments);
      try { if (live && ART.post && FX.lut) gradeLUT(FX.lut, (STY[themeKey()] || STY.nave).grade); } catch (e) { fail('lut', e); }
      return r;
    };
  }
  function gradeLUT(L, gd) {
    const SH = gd.sh, HI = gd.hi, ds = gd.ds, con = gd.con, mg = gd.mg || 0;
    for (let i = 0; i < L.length; i++) {
      const q = L[i]; let r = (q & 255) / 255, g = ((q >> 8) & 255) / 255, b = ((q >> 16) & 255) / 255;
      const l = 0.299 * r + 0.587 * g + 0.114 * b;
      const mx = r > g ? (r > b ? r : b) : (g > b ? g : b), mn = r < g ? (r < b ? r : b) : (g < b ? g : b);
      // tame the hot-magenta midtone wash (high sat, mid luma), keep darks and highlights vivid
      const sat = mx > 0 ? (mx - mn) / mx : 0, mid = 4 * l * (1 - l), dk = ds * mid * sat * sat;
      r += (l - r) * dk; g += (l - g) * dk; b += (l - b) * dk;
      if (mg) {
        const mb = Math.min(r, b) - g;
        if (mb > 0) {
          const mk = mg * mid * Math.min(1, mb * 5);
          r += (l - r) * mk; b += (l - b) * mk * 0.85; g += (l - g) * mk * 0.2;
        }
      }
      // contrast with a toe: deeper shadows, highlights kept
      r = r + (r - 0.45) * con - (1 - r) * (1 - r) * 0.02; g = g + (g - 0.45) * con - (1 - g) * (1 - g) * 0.02; b = b + (b - 0.45) * con - (1 - b) * (1 - b) * 0.02;
      const sh = (1 - l) * (1 - l), hi = l * l;
      r += SH[0] * sh + HI[0] * hi; g += SH[1] * sh + HI[1] * hi; b += SH[2] * sh + HI[2] * hi;
      L[i] = 0xff000000 | (Math.max(0, Math.min(255, b * 255)) << 16) | (Math.max(0, Math.min(255, g * 255)) << 8) | Math.max(0, Math.min(255, r * 255));
    }
  }
  function applyVig() {
    if (typeof FX === 'undefined' || !FX.vig) return;
    if (!vigOrig) vigOrig = FX.vig;
    const want = live && ART.post, k = want ? ART.theme : 'off';
    if (k === vigKey) return; vigKey = k;
    if (!want) { FX.vig = vigOrig; return; }
    const v = sty().vig, c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d');
    const gr = x.createRadialGradient(W / 2, H / 2 - 8, H * 0.28, W / 2, H / 2, W * 0.6);
    gr.addColorStop(0, `rgba(${v[0]},${v[1]},${v[2]},0)`); gr.addColorStop(0.62, `rgba(${v[0]},${v[1]},${v[2]},${(v[3] * 0.3).toFixed(3)})`);
    gr.addColorStop(1, `rgba(${v[0] >> 1},${v[1] >> 1},${v[2] >> 1},${v[3].toFixed(3)})`);
    x.fillStyle = gr; x.fillRect(0, 0, W, H);
    // top/bottom letterbox shade (ceiling gloom, floor grounding)
    const lg = x.createLinearGradient(0, 0, 0, H); lg.addColorStop(0, 'rgba(0,0,0,0.16)'); lg.addColorStop(0.22, 'rgba(0,0,0,0)'); lg.addColorStop(0.85, 'rgba(0,0,0,0)'); lg.addColorStop(1, 'rgba(0,0,0,0.12)');
    x.fillStyle = lg; x.fillRect(0, 0, W, H);
    FX.vig = c;
  }
  let gradedFor = null;
  function applyGrade() {
    const want = live && ART.post ? ART.theme : 'off';
    if (want !== gradedFor) { gradedFor = want; try { buildLUT(lastGrd); } catch (e) { fail('regrade', e); } }
  }

  // ---------- ink outline on depth silhouettes ----------
  function edgePass() {
    const N = EW * EH, Z = ZB, Pp = PIX, w = EW;
    for (let y = 1; y < EH - 1; y++) {
      let i = y * w + 1;
      for (let x = 1; x < w - 1; x++, i++) {
        const d = Z[i]; if (d > 14) continue;
        const t = d * 1.3 + 0.45;
        let far = Z[i - 1] > t || Z[i + 1] > t;
        if (!far) { const u = Z[i - w]; far = u > d * 1.6 + 1.2 && u > t; }
        if (!far) continue;
        const qv = Pp[i]; if (((qv & 255) > 200) || (((qv >> 8) & 255) > 200)) continue;   // never ink glows
        Pp[i] = 0xff000000 | (((qv >> 16) & 255) * 0.42 << 16) | (((qv >> 8) & 255) * 0.42 << 8) | ((qv & 255) * 0.42);
      }
    }
  }

  // ---------- ambient motes ----------
  const MOTES = []; for (let i = 0; i < 48; i++) MOTES.push({ x: hash(i, 1, 3) * 10 - 5, y: hash(i, 2, 3) * 10 - 5, z: hash(i, 3, 3), p: hash(i, 4, 3) * 6.28, s: 0.6 + hash(i, 5, 3) * 0.8 });
  let mlT = 0;
  function drawMotes(cam) {
    if (typeof P === 'undefined' || typeof drawParticle !== 'function' || typeof G === 'undefined') return;
    const st = sty(), m = st.mote, lvl = ART.level, n = Math.min(MOTES.length, lvl >= 2 ? m.n : m.n >> 1);
    const t = G.t || 0, dt = Math.min(0.05, Math.max(0, t - mlT)); mlT = t;
    const ceilH = 2.6;
    for (let i = 0; i < n; i++) {
      const o = MOTES[i];
      o.z += m.vz * dt * o.s; if (o.z > 1) o.z -= 1; if (o.z < 0) o.z += 1;
      o.x += Math.sin(t * 0.3 + o.p) * 0.06 * dt; o.y += Math.cos(t * 0.27 + o.p) * 0.06 * dt;
      let wx = P.x + (((o.x - P.x) % 10 + 15) % 10 - 5), wy = P.y + (((o.y - P.y) % 10 + 15) % 10 - 5);
      const ci = cellAt(wx, wy); if (ci < 0 || SOLID[ci]) continue;
      const f0 = FH[ci], c0 = Math.min(CH[ci], f0 + ceilH);
      const wz = f0 + 0.1 + o.z * (c0 - f0 - 0.2);
      const tw = 0.55 + 0.45 * Math.sin(t * (1.1 + m.tw * o.s) + o.p * 3);
      const k = tw * (0.5 + 0.5 * o.s) * 0.55;
      const col = ((m.c[2] * k) << 16) | ((m.c[1] * k) << 8) | (m.c[0] * k);
      drawParticle(cam, wx, wy, wz, m.size * o.s, col, true);
    }
  }

  // ---------- haze: a touch less additive wash (depth fog now carries the distance read) ----------
  if (typeof hazeVivid === 'function') {
    const _hv = hazeVivid;
    hazeVivid = function () { const r = _hv.apply(this, arguments); try { if (live && ART.fog && typeof HZ !== 'undefined') { const k = sty().haze || 0.88; HZ[0] *= k; HZ[1] *= k; HZ[2] *= k; } } catch (e) { fail('haze', e); } return r; };
  }
  // ---------- hooks ----------
  function tick() {
    const th = themeKey(); if (th !== ART.theme) ART.theme = th;
    const L = gov(); ART.level = L <= 1 ? 2 : L <= 3 ? 1 : 0;
    if (dirty()) dress();
    applyLM(); applyFog(); applyGrade(); applyVig();
  }
  const _rw = renderWorld;
  renderWorld = function (cam) {
    try { if (G.state !== 'title' || live) tick(); } catch (e) { fail('tick', e); }
    return _rw.apply(this, arguments);
  };
  if (typeof renderAtmos === 'function') {
    const _ra = renderAtmos;
    renderAtmos = function (cam) {
      const r = _ra.apply(this, arguments);
      try { if (live && ART.motes && ART.level > 0 && FX.on && G.state !== 'title') drawMotes(cam); } catch (e) { fail('motes', e); }
      return r;
    };
  }
  const _pf = postFX;
  postFX = function () {
    const r = _pf.apply(this, arguments);
    if (live && ART.edge && ART.level >= 2 && FX.on && G.state !== 'title') {
      const a = performance.now();
      try { edgePass(); } catch (e) { fail('edge', e); }
      ART.ms = ART.ms * 0.9 + (performance.now() - a) * 0.1;
    }
    return r;
  };
  // sprite rim a touch stronger so silhouettes separate from the textured walls
  try { if (ART.on && typeof RC !== 'undefined') { ART._rc = [RC[3], RW[3]]; RC[3] = 0.66; RW[3] = 0.52; } } catch (e) { }

  ART.set = v => {
    live = !!v && ART.on;
    try { if (typeof RC !== 'undefined' && ART._rc) { RC[3] = live ? 0.66 : ART._rc[0]; RW[3] = live ? 0.52 : ART._rc[1]; } } catch (e) { }
    try { tick(); } catch (e) { fail('set', e); }
    return live;
  };
  ART.st = () => ({ live, theme: ART.theme, level: ART.level, gov: gov(), nTex: ART.nTex, texMs: ART.texMs, ms: +ART.ms.toFixed(2), err: ART.err,
    tex: ART.tex, light: ART.light, fog: ART.fog, post: ART.post, edge: ART.edge, motes: ART.motes, wl: ART.wl,
    lmArt: typeof LMr !== 'undefined' && !!LMr && LO.has(LMr), texArt: !!(WALLDEFS[0] && WALLDEFS[0].base && WALLDEFS[0].base.m21) });
})();
