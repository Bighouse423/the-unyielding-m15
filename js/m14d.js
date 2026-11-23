'use strict';
// ===== M14d: VISUAL POLISH (overlays + assets only) =====
// - texture variety: each stage grows its own weathering (moss in the crypt, blood grime in the ossuary, soot in the forge,
//   rain-stains in the cathedral, void veins on the throne...) generated from the stage's own floor/wall textures and laid in
//   seeded patches, so no two stretches of corridor look the same.
// - more props: per-theme dressing along the walls of every room (candle-and-skull shrines, toppled saints, gibbet cages,
//   kennels, anvils, graves, cauldrons...) - billboards only, nothing that blocks a path.
// - atmosphere: light shafts in some rooms, low ground fog, and per-theme drifting motes (dust, embers, spores, ash, sparks).
// - story/UI: a foreshadowing whisper when a stage holds a mini-boss.
// ?m14=0 (or ?m14fx=0) turns all of it off.
(function () {
  const M14D = window.M14D = { on: !/[?&]m14=0/.test(location.search) && !/[?&]m14fx=0/.test(location.search) && !!(window.M13 && M13.on), err: null, props: [], fog: [], n: {} };
  if (!M14D.on) return;
  const LOOK = {   // weathering colour, strength, kind; props [tex, height, weight, z, light]
    crypt: { c: [70, 105, 55], k: 0.45, kind: 'moss', props: [['p_m14candles', 0.75, 3, 0, 1], ['bonepile', 0.5, 2], ['p_m14statue', 0.62, 2], ['p_grave', 0.66, 1], ['p_m14gibbet', 1.5, 1, 1.4]], dust: [200, 190, 170], shaft: [150, 200, 170] },
    ossuary: { c: [120, 20, 30], k: 0.6, kind: 'grime', props: [['p_m14candles', 0.75, 3, 0, 1], ['bonepile', 0.55, 3], ['p_m14gibbet', 1.5, 2, 1.4]], dust: [220, 160, 160], shaft: [255, 140, 140] },
    courtyard: { c: [72, 100, 60], k: 0.4, kind: 'moss', props: [['p_m14statue', 0.62, 3], ['p_grave', 0.66, 3], ['p_angel', 1.95, 1]], dust: [190, 200, 255], shaft: [170, 190, 255] },
    belfry: { c: [40, 30, 25], k: 0.5, kind: 'soot', props: [['p_m14gibbet', 1.5, 2, 1.6], ['p_m14candles', 0.75, 2, 0, 1], ['bonepile', 0.5, 1]], dust: [210, 190, 160], shaft: [255, 220, 170] },
    arena: { c: [110, 25, 20], k: 0.55, kind: 'grime', props: [['p_cage', 1.6, 2], ['bonepile', 0.55, 2], ['p_m14gibbet', 1.5, 1, 1.4]], dust: [230, 190, 140], shaft: [255, 190, 120] },
    necropolis: { c: [64, 96, 66], k: 0.45, kind: 'moss', props: [['p_grave', 0.66, 3], ['p_cauldron', 1.2, 1], ['p_m14statue', 0.62, 2], ['p_m14candles', 0.75, 1, 0, 1]], dust: [150, 255, 170], shaft: [140, 255, 170], spore: 1 },
    kennels: { c: [30, 20, 15], k: 0.6, kind: 'soot', props: [['p_kennel', 1.15, 2], ['p_anvil', 0.92, 2], ['p_cage', 1.6, 1], ['bonepile', 0.5, 2]], dust: [255, 150, 60], shaft: [255, 140, 70], ember: 1 },
    cathedral: { c: [70, 90, 120], k: 0.45, kind: 'stain', props: [['p_m14statue', 0.62, 3], ['p_m14candles', 0.75, 2, 0, 1], ['p_cross', 0.92, 1]], dust: [190, 200, 230], shaft: [190, 210, 255] },
    throne: { c: [110, 50, 160], k: 0.5, kind: 'vein', props: [['p_m14candles', 0.75, 3, 0, 1], ['p_m14gibbet', 1.5, 2, 1.6], ['bonepile', 0.5, 2], ['p_m14statue', 0.62, 1]], dust: [200, 150, 255], shaft: [200, 140, 255], ember: 1 },
    abyss: { c: [90, 40, 140], k: 0.55, kind: 'vein', props: [['bonepile', 0.55, 2], ['p_m14gibbet', 1.5, 2, 1.6], ['p_m14statue', 0.62, 1]], dust: [180, 120, 255], shaft: [170, 110, 255] },
  };
  // ---------- weathered texture variants (built once per texture + look) ----------
  const cache = new Map();
  function noise(seed, n, scale) { const R = mulberry(seed >>> 0); const g = []; const G = Math.ceil(n / scale) + 2; for (let i = 0; i < G * G; i++) g.push(R()); const out = new Float32Array(n * n); for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { const fx = x / scale, fy = y / scale, ix = fx | 0, iy = fy | 0, tx = fx - ix, ty = fy - iy; const sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty); const a = g[iy * G + ix], b = g[iy * G + ix + 1], c = g[(iy + 1) * G + ix], d = g[(iy + 1) * G + ix + 1]; out[y * n + x] = a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy; } return out; }
  function variant(tex, look, salt) {
    const key = (tex && tex.d && tex.d.length) + ':' + look.kind + ':' + salt + ':' + (tex.__m14id || (tex.__m14id = Math.random().toString(36).slice(2)));
    if (cache.has(key)) return cache.get(key);
    const w = tex.w, h = tex.h, src = tex.d, d = new Uint32Array(src.length);
    const N = Math.max(w, h), n1 = noise(1234 + salt * 77, N, 9), n2 = noise(999 + salt * 31, N, 4);
    let avg = 0; for (let i = 0; i < src.length; i++) { const p = src[i]; avg += (p & 255) + ((p >> 8) & 255) + ((p >> 16) & 255); } avg /= src.length * 3;
    const [cr, cg, cb] = look.c;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = y * w + x, p = src[i]; let r = p & 255, g = (p >> 8) & 255, b = (p >> 16) & 255; const a = p >>> 24;
      const lum = (r + g + b) / 3; const m = n1[(y % N) * N + (x % N)] * 0.7 + n2[(y % N) * N + (x % N)] * 0.3;
      let k = 0;
      if (look.kind === 'moss') k = clamp((m - 0.45) * 2.6, 0, 1) * (lum < avg * 0.85 ? 1 : 0.55);
      else if (look.kind === 'grime' || look.kind === 'soot') k = clamp((m - 0.4) * 2.2, 0, 1) * (look.kind === 'soot' ? 0.9 : 0.8);
      else if (look.kind === 'stain') k = clamp((m - 0.42) * 2.4, 0, 1) * (0.5 + 0.5 * Math.sin(y * 0.35 + n2[(y % N) * N + (x % N)] * 6)) * 0.8;
      else if (look.kind === 'vein') { const v = Math.abs(n1[(y % N) * N + (x % N)] - 0.5); k = v < 0.035 ? 1 : clamp((m - 0.55) * 1.5, 0, 0.4); }
      k *= look.k;
      if (look.kind === 'soot') { r = r * (1 - k * 0.6); g = g * (1 - k * 0.62); b = b * (1 - k * 0.6); }
      else if (look.kind === 'vein' && k > 0.5) { r = r + (cr * 1.6 - r) * k; g = g + (cg * 1.4 - g) * k; b = b + (cb * 1.5 - b) * k; }
      else { const sh = lum / 255; r = r + (cr * (0.6 + sh) - r) * k; g = g + (cg * (0.6 + sh) - g) * k; b = b + (cb * (0.6 + sh) - b) * k; }
      d[i] = (a << 24) | (clamp(b | 0, 0, 255) << 16) | (clamp(g | 0, 0, 255) << 8) | clamp(r | 0, 0, 255);
    }
    const out = { w, h, d, m14v: 1 }; cache.set(key, out); return out;
  }
  // ---------- per-stage dressing ----------
  function dress(theme, seed) {
    M14D.props = []; M14D.fog = [];
    if (!RUN.on || RUN.hub || (RUN.cfg && (RUN.cfg.m13sanct || RUN.cfg.n === 1)) || !LEVEL.rooms) return;
    const key = theme.variant || RUN.cfg.theme; const look = LOOK[key] || LOOK.crypt; const T = Engine.tex;
    const R = mulberry(((seed | 0) ^ 0x14d14d) >>> 0); const ri = (a, b) => a + Math.floor(R() * (b - a + 1)); const idx = (x, y) => y * MW + x;
    // 1) weathered textures: floor 0/1 and wall 0/1 get a variant, laid in patches
    const fv = {}, wv = {};
    for (const f of [0, 1]) if (FLOORTEX[f] && FLOORTEX[f].d) { FLOORTEX.push(variant(FLOORTEX[f], look, f)); fv[f] = FLOORTEX.length - 1; }
    for (const w of [0, 1]) if (WALLDEFS[w] && WALLDEFS[w].base && WALLDEFS[w].base.d) { WALLDEFS.push({ base: variant(WALLDEFS[w].base, look, 10 + w), tall: null }); wv[w] = WALLDEFS.length - 1; }
    const patches = []; const np = 10 + ri(0, 6);
    for (let k = 0; k < np; k++) patches.push([ri(2, MW - 3) + 0.5, ri(2, MH - 3) + 0.5, 1.5 + R() * 2.5]);
    let nf = 0, nw = 0;
    for (let y = 1; y < MH - 1; y++) for (let x = 1; x < MW - 1; x++) {
      const i = idx(x, y); let inP = 0; for (const [px, py, pr] of patches) { const d = Math.hypot(x + 0.5 - px, y + 0.5 - py); if (d < pr) inP = Math.max(inP, 1 - d / pr); }
      if (inP <= 0) continue; const h = ((x * 73856093) ^ (y * 19349663) ^ seed) >>> 0; if ((h % 100) / 100 > inP * 1.6) continue;
      if (!SOLID[i] && fv[FT[i]] !== undefined && FH[i] === 0) { FT[i] = fv[FT[i]]; nf++; }
      else if (SOLID[i] && wv[WT[i]] !== undefined) { WT[i] = wv[WT[i]]; nw++; }
    }
    M14D.n = { floor: nf, wall: nw };
    // 2) props along the walls of the path rooms (not the start room, not the set pieces)
    const sp = new Set((window.M14B && M14B.rooms || []).map(r => r.id));
    const tot = look.props.reduce((a, p) => a + p[2], 0); const pickP = () => { let r = R() * tot; for (const p of look.props) { r -= p[2]; if (r <= 0) return p; } return look.props[0]; };
    const taken = [];
    for (const r of LEVEL.rooms) {
      if (r.kind === 'secret' || r.style === 'start' || sp.has(r.id)) continue;
      const n = r.kind === 'elite' ? 2 : ri(1, 3);
      for (let k = 0, tries = 0; k < n && tries < 40; tries++) {
        const x = ri(r.x0, r.x1), y = ri(r.y0, r.y1), i = idx(x, y); if (SOLID[i] || Math.abs(FH[i]) > 0.05) continue;
        let wx = 0, wy = 0; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (SOLID[idx(x + dx, y + dy)]) { wx += dx; wy += dy; }
        if (!wx && !wy) continue;   // only against a wall
        let door = false; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const j = idx(x + dx, y + dy); if (!SOLID[j] && (x + dx < r.x0 || x + dx > r.x1 || y + dy < r.y0 || y + dy > r.y1)) door = true; } if (door) continue;
        const px = x + 0.5 + wx * 0.22, py = y + 0.5 + wy * 0.22; if (taken.some(t => Math.hypot(t[0] - px, t[1] - py) < 1.6)) continue;
        if ((LEVEL.props || []).some(p => Math.hypot(p.x - px, p.y - py) < 0.9)) continue;
        const p = pickP(); const tx = T[p[0]]; if (!tx) continue;
        M14D.props.push({ tex: p[0], x: px, y: py, z: (p[3] || 0) + (p[3] ? 0 : FH[i]), h: p[1], w: p[1] * tx.w / tx.h, light: p[4] }); taken.push([px, py]); k++;
        if (p[4]) LEVEL.lights.push({ x: px, y: py, r: 2.4, i: 0.55, c: [1.0, 0.68, 0.35], flicker: true });
      }
      // 3) atmosphere: a light shaft in some rooms, ground fog in others
      if (r.kind === 'path' && R() < 0.35 && LEVEL.shafts) { const sx = (r.x0 + r.x1 + 1) / 2 + (R() - 0.5) * 2, sy = (r.y0 + r.y1 + 1) / 2 + (R() - 0.5) * 2; if (!SOLID[idx(sx | 0, sy | 0)]) LEVEL.shafts.push({ x: sx, y: sy, w: 0.9 + R() * 0.6, z0: 0, z1: r.ch || 3.4, c: look.shaft, i: 0.16 + R() * 0.08, slant: (R() - 0.5) * 0.5, ph: R() * 6, m14: 1 }); }
      if (r.kind === 'path' && R() < 0.45) for (let k = 0; k < 3; k++) { const fx = r.x0 + 0.5 + R() * (r.x1 - r.x0), fy = r.y0 + 0.5 + R() * (r.y1 - r.y0); if (!SOLID[idx(fx | 0, fy | 0)]) M14D.fog.push({ x: fx, y: fy, z: FH[idx(fx | 0, fy | 0)] + 0.05, w: 2.2 + R() * 1.5, ph: R() * 6 }); }
    }
    try { buildLightmap(LEVEL.lights, theme.ambient || [0.34, 0.4, 0.36]); } catch (e) { }
    M14D.look = look; M14D.key = key;
  }
  const _bc = buildCrypt;
  buildCrypt = function (theme, seed) { const r = _bc.apply(this, arguments); try { dress(theme || {}, seed | 0); } catch (e) { M14D.err = String(e && e.stack || e); } return r; };
  const _bs = buildStage;
  buildStage = function () { M14D.props = []; M14D.fog = []; M14D.look = null; return _bs.apply(this, arguments); };

  // ---------- drawing + ambient motes ----------
  const _cs = collectSprites;
  collectSprites = function (cam) {
    const S = _cs(cam);
    try {
      if ((G.state !== 'play' && G.state !== 'pause') || !M14D.look) return S;
      const t = G.time;
      for (const p of M14D.props) {
        if (Math.abs(p.x - P.x) > 14 || Math.abs(p.y - P.y) > 14) continue;
        S.push({ tex: p.tex, x: p.x, y: p.y, z: p.z, w: p.w, h: p.h });
        if (p.light) S.push({ tex: 'glow_w', x: p.x, y: p.y, z: p.z + p.h * 0.6, w: 1.2, h: 1.0, add: true, alpha: 0.28 + 0.05 * Math.sin(t * 9 + p.x), lit: false, tint: [255, 160, 70, 1] });
      }
      for (const f of M14D.fog) {
        if (Math.abs(f.x - P.x) > 12 || Math.abs(f.y - P.y) > 12) continue;
        const c = M14D.look.dust; S.push({ tex: 'glow_w', x: f.x + Math.sin(t * 0.3 + f.ph) * 0.3, y: f.y, z: f.z, w: f.w, h: 0.55, add: true, alpha: 0.07 + 0.03 * Math.sin(t * 0.5 + f.ph), lit: false, tint: [c[0], c[1], c[2], 1] });
      }
      // drifting motes around the player
      const L = M14D.look; if (Math.random() < 0.35) { const a = Math.random() * TAU, d = 1 + Math.random() * 5, x = P.x + Math.cos(a) * d, y = P.y + Math.sin(a) * d; const c = cellAt(x, y);
        if (c >= 0 && !SOLID[c]) { if (L.ember) addP({ k: 'ember', x, y, z: FH[c] + Math.random() * 0.4, vx: 0, vy: 0, vz: 0.3 + Math.random() * 0.5, size: 0.025, col: RGB(255, 120 + (Math.random() * 80 | 0), 40), life: 2.2 });
          else addP({ k: 'mote', x, y, z: FH[c] + 0.3 + Math.random() * 2, vx: (Math.random() - 0.5) * 0.15, vy: (Math.random() - 0.5) * 0.15, vz: L.spore ? 0.12 : -0.03, size: 0.02, col: RGB(L.dust[0], L.dust[1], L.dust[2]), life: 2.5 }); } }
    } catch (e) { M14D.err = String(e && e.stack || e); }
    return S;
  };

  // ---------- UI: the mini-boss shows on the minimap once you've had a glimpse of it ----------
  const QM = (() => { const m = /[?&]mmap=(\d)/.exec(location.search); return m ? +m[1] : null; })();
  if (typeof drawRunHUD === 'function') {
    const _rh = drawRunHUD;
    drawRunHUD = function (ctx) {
      const r = _rh(ctx);
      try {
        const on = QM !== null ? QM > 0 : ((window.OPT && OPT.S) || {}).mmap !== false;
        const g = LEVEL.doors && LEVEL.doors.gate;
        if (!on || G.state !== 'play' || !LEVEL || LEVEL.kind === 'hub' || (g && g.state === 'sealed') || (G.combo >= 3 && G.comboT > 0)) return r;
        const list = ((window.M14 && M14.minis) || []).concat((window.M13 && M13.B && M13.B.minis) || []);
        const CW = 24, CHh = 16, PX = 3, bw = CW * PX, X0 = W - bw - 6, Y0 = 18, ox = Math.floor(P.x) - (CW >> 1), oy = Math.floor(P.y) - (CHh >> 1);
        const seen = new Set();
        for (const m of list) {
          if (!m || !m.alive || seen.has(m)) continue; seen.add(m);
          if (!m.m14seen && (m.awake || (Math.hypot(m.x - P.x, m.y - P.y) < 9 && losTo(P.x, P.y, m.x, m.y)))) m.m14seen = true;
          if (!m.m14seen) continue;
          const cx = Math.floor(m.x) - ox, cy = Math.floor(m.y) - oy; if (cx < 0 || cy < 0 || cx >= CW || cy >= CHh) continue;
          const x = X0 + cx * PX, y = Y0 + cy * PX, pu = 0.6 + 0.4 * Math.sin(G.t * 5);
          ctx.save(); ctx.globalAlpha = pu; ctx.fillStyle = '#ff3040'; ctx.fillRect(x - 1, y - 1, PX + 2, PX + 2); ctx.fillStyle = '#ffe0e0'; ctx.fillRect(x, y, 1, 1); ctx.fillRect(x + 2, y, 1, 1); ctx.restore();
        }
      } catch (e) { M14D.err = String(e && e.stack || e); }
      return r;
    };
  }
  // ---------- story: a whisper when a mini-boss waits on this stage ----------
  const WHISPER = { m14gargoyle: 'Stone wings scrape somewhere in the vaults above...', m13butcher: 'Somewhere ahead, a cleaver hits a block. Again. Again.', m14knell: 'A bell tolls. Then a name is spoken.', m13abbess: 'Children\'s laughter... in a place with no children.', m14penance: 'Two voices pray in the dark. One of them is weeping.', m14houndmaster: 'A whistle. Then the baying of many hounds.' };
  const _rsp = rogueStagePost;
  rogueStagePost = function () {
    const r = _rsp.apply(this, arguments);
    try {
      const m = (window.M14 && M14.minis && M14.minis[0]) || (window.M13 && M13.B && M13.B.minis && M13.B.minis[0]);
      const line = m && WHISPER[m.type]; const st = RUN.stage;
      if (line) setTimeout(() => { if (G.state === 'play' && RUN.stage === st && m.alive && !m.awake) toast('...', line, '#c8b8ff', 3.4); }, 7000);
    } catch (e) { M14D.err = String(e && e.stack || e); }
    return r;
  };
})();
