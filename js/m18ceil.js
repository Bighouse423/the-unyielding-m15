// ===== m18ceil: richer indoor ceilings (texture/overlay only; no geometry or collision).
// Open-sky stages keep the m18sky treatment. ?ceil=0 or ?sky=0 or ?m18=0 restores the originals.
(function () {
  if (!window.M18 || !M18.ceil) return;
  if (typeof Engine === 'undefined') return;
  const C = M18.ceilState = { on: true, hung: 0, key: '' };
  const px = (r, g, b, a) => ((a === undefined ? 255 : a) << 24 | (b & 255) << 16 | (g & 255) << 8 | (r & 255)) >>> 0;
  const rgba = v => [v & 255, (v >> 8) & 255, (v >> 16) & 255, (v >>> 24) & 255];
  const mix = (a, b, t) => px(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t, a[3]);
  const cache = {};
  const origD = {};

  function texName(t) {
    if (!t || !Engine.tex) return '';
    for (const k in Engine.tex) if (Engine.tex[k] === t) return k;
    return '';
  }
  function themeKey() {
    try {
      if (typeof RUN !== 'undefined' && RUN.hub) return 'hub';
      if (RUN && RUN.cfg && RUN.cfg.theme) return RUN.cfg.theme;
      const th = typeof curTheme === 'function' && curTheme();
      return (th && (th.variant || th.music)) || 'nave';
    } catch (e) { return 'nave'; }
  }
  function openSky() {
    return !!(typeof LEVEL !== 'undefined' && LEVEL && LEVEL.wallH < 10);
  }
  function gradeOf(theme) {
    switch (theme) {
      case 'nave': case 'hub': return [18, 6, 28, 0.18];
      case 'crypt': return [6, 28, 22, 0.22];
      case 'ossuary': return [40, 4, 12, 0.22];
      case 'belfry': return [36, 22, 10, 0.16];
      case 'arena': return [20, 10, 10, 0.16];
      case 'kennels': return [40, 10, 4, 0.22];
      case 'witch': return [16, 20, 36, 0.16];
      default: return [10, 8, 16, 0.12];
    }
  }

  function enhance(src, name, theme) {
    const id = name + ':' + theme + ':' + src.w + 'x' + src.h;
    if (cache[id]) return cache[id];
    const w = src.w | 0, h = src.h | 0;
    if (!w || !h || !src.d) return src;
    if (!origD[name]) origD[name] = new Uint32Array(src.d);
    const d = new Uint32Array(origD[name]);
    const kind = /vault/.test(name) ? 'vault' : /beam|wood/.test(name) ? 'beam' : /forge/.test(name) ? 'forge' : /oss/.test(name) ? 'oss' : /iron/.test(name) ? 'iron' : 'stone';
    const g = gradeOf(theme);

    // contrast + per-theme wash
    for (let i = 0; i < d.length; i++) {
      const c = rgba(d[i]);
      const l = (c[0] * 0.3 + c[1] * 0.5 + c[2] * 0.2) / 255;
      const mid = (l - 0.5) * 1.35 + 0.5;
      const t = g[3];
      c[0] = Math.max(0, Math.min(255, mid * 255 * 0.82 + c[0] * 0.18 + g[0] * t));
      c[1] = Math.max(0, Math.min(255, mid * 255 * 0.82 + c[1] * 0.18 + g[1] * t));
      c[2] = Math.max(0, Math.min(255, mid * 255 * 0.82 + c[2] * 0.18 + g[2] * t));
      d[i] = px(c[0], c[1], c[2], c[3] || 255);
    }

    function line(x0, y0, x1, y1, col, rad) {
      const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
      for (let i = 0; i <= n; i++) {
        const x = Math.round(x0 + (x1 - x0) * i / n), y = Math.round(y0 + (y1 - y0) * i / n);
        for (let dy = -rad; dy <= rad; dy++) for (let dx = -rad; dx <= rad; dx++) {
          const xx = (x + dx + w) % w, yy = (y + dy + h) % h;
          const fall = 1 - Math.hypot(dx, dy) / (rad + 0.6);
          if (fall <= 0) continue;
          const c = rgba(d[yy * w + xx]);
          d[yy * w + xx] = mix(c, col, fall * (col[3] || 0.85));
        }
      }
    }

    if (kind === 'vault') {
      // deeper ribbed cross and a stone ring — keeps the original gold X, just heavier
      const gold = [200, 160, 70, 0.7], dark = [12, 4, 18, 0.55], stone = [60, 40, 70, 0.35];
      line(0, 0, w - 1, h - 1, dark, 3); line(w - 1, 0, 0, h - 1, dark, 3);
      line(0, 0, w - 1, h - 1, gold, 1); line(w - 1, 0, 0, h - 1, gold, 1);
      const cx = (w / 2) | 0, cy = (h / 2) | 0;
      for (let a = 0; a < 40; a++) {
        const ang = a / 40 * Math.PI * 2, r = w * 0.28;
        const x = cx + Math.cos(ang) * r, y = cy + Math.sin(ang) * r;
        const x2 = cx + Math.cos(ang + 0.16) * r, y2 = cy + Math.sin(ang + 0.16) * r;
        line(x, y, x2, y2, stone, 1);
      }
    } else if (kind === 'beam') {
      const oak = [90, 55, 22, 0.75], shadow = [20, 10, 4, 0.5];
      for (let x = 4; x < w; x += 16) { line(x, 0, x, h - 1, shadow, 3); line(x, 0, x, h - 1, oak, 1); }
      for (let y = 10; y < h; y += 21) { line(0, y, w - 1, y, shadow, 2); line(0, y, w - 1, y, oak, 1); }
    } else if (kind === 'forge') {
      const glow = [255, 90, 20, 0.55], soot = [8, 2, 0, 0.4];
      for (let i = 0; i < 5; i++) {
        const x0 = (i * 13 + 3) % w, y0 = (i * 9 + 5) % h;
        line(x0, y0, (x0 + 8) % w, (y0 + 11) % h, glow, 1);
      }
      line(w / 2, 0, w / 2, h - 1, soot, 2);
    } else if (kind === 'oss') {
      const bone = [160, 130, 110, 0.35], blood = [120, 10, 20, 0.35];
      for (let y = 8; y < h; y += 16) line(0, y, w - 1, y, bone, 1);
      line(4, 4, w - 6, h - 5, blood, 1);
    } else if (kind === 'iron') {
      const rivet = [180, 160, 140, 0.7], rust = [90, 30, 16, 0.35];
      for (let y = 0; y < h; y += 16) line(0, y, w - 1, y, rust, 1);
      for (let x = 0; x < w; x += 16) line(x, 0, x, h - 1, rust, 1);
      for (let y = 8; y < h; y += 16) for (let x = 8; x < w; x += 16) {
        const c = rgba(d[y * w + x]); d[y * w + x] = mix(c, rivet, 0.7);
      }
    } else {
      // stone / crypt: mortar grid + a few cracks
      const mortar = [8, 8, 10, 0.45], crack = [4, 4, 6, 0.55];
      for (let y = 0; y < h; y += 8) line(0, y, w - 1, y, mortar, 0);
      for (let x = 0; x < w; x += 16) line(x, 0, x, h - 1, mortar, 0);
      line(6, 4, 18, 28, crack, 0);
    }

    // soft tile-center lift so torchlight falloff has something to catch (keeps tiling)
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const u = (x + 0.5) / w, v = (y + 0.5) / h;
      const lift = 0.07 * Math.sin(u * Math.PI) * Math.sin(v * Math.PI);
      if (lift <= 0.01) continue;
      const c = rgba(d[y * w + x]);
      d[y * w + x] = px(Math.min(255, c[0] + 40 * lift), Math.min(255, c[1] + 32 * lift), Math.min(255, c[2] + 24 * lift), c[3]);
    }

    const out = { w: w, h: h, d: d, m18ceil: name };
    cache[id] = out;
    return out;
  }

  function dress() {
    if (!M18.ceil || typeof CEILTEX === 'undefined' || !CEILTEX || !CEILTEX.length) return;
    if (openSky()) { C.key = 'open'; return; } // leave ceilings unused; sky module owns the view
    const theme = themeKey();
    C.key = theme;
    for (let i = 0; i < CEILTEX.length; i++) {
      const t = CEILTEX[i]; if (!t) continue;
      const name = t.m18ceil || texName(t) || ('ceil' + i);
      try { CEILTEX[i] = enhance(t.m18ceil && origD[t.m18ceil] ? { w: t.w, h: t.h, d: origD[t.m18ceil] } : t, name, theme); }
      catch (e) { M18.err = M18.err || ('ceil ' + e); }
    }
    C.n = CEILTEX.length;
  }

  const wrap = (name) => {
    const fn = typeof window[name] === 'function' ? window[name] : (typeof eval !== 'undefined' ? null : null);
    return fn;
  };
  if (typeof buildCrypt === 'function') { const _bc = buildCrypt; buildCrypt = function () { const r = _bc.apply(this, arguments); try { dress(); } catch (e) { M18.err = M18.err || ('ceilBC ' + e); } return r; }; }
  if (typeof buildLevel === 'function') { const _bl = buildLevel; buildLevel = function () { const r = _bl.apply(this, arguments); try { dress(); } catch (e) { M18.err = M18.err || ('ceilBL ' + e); } return r; }; }
  if (typeof buildChapel === 'function') { const _bh = buildChapel; buildChapel = function () { const r = _bh.apply(this, arguments); try { dress(); } catch (e) { M18.err = M18.err || ('ceilCH ' + e); } return r; }; }
  if (typeof newGame === 'function') { const _ng = newGame; newGame = function () { const r = _ng.apply(this, arguments); try { dress(); } catch (e) { M18.err = M18.err || ('ceilNG ' + e); } return r; }; }

  // hanging chains / banners — sprites only, no collision
  function hangOld(S) {
    if (openSky() || typeof LEVEL === 'undefined' || !LEVEL || typeof P === 'undefined') return;
    const MW_ = typeof MW === 'function' ? 0 : (typeof MW !== 'undefined' ? MW : 0);
    if (!MW_ || typeof CH === 'undefined') return;
    const q = (typeof GFX !== 'undefined' && GFX.q != null) ? GFX.q : 2;
    if (q < 1) return;
    const theme = C.key || themeKey();
    let n = 0, cap = q < 2 ? 10 : 18;
    const step = 5;
    const x0 = Math.max(1, (P.x | 0) - 12), x1 = Math.min(MW_ - 2, (P.x | 0) + 12);
    const y0 = Math.max(1, (P.y | 0) - 12), y1 = Math.min((typeof MH !== 'undefined' ? MH : 50) - 2, (P.y | 0) + 12);
    for (let y = y0; y <= y1 && n < cap; y += step) for (let x = x0; x <= x1 && n < cap; x += step) {
      const i = y * MW_ + x;
      if (SOLID && SOLID[i]) continue;
      if (SKY && SKY[i]) continue;
      const ch = CH[i]; if (!(ch > 2 && ch < 20)) continue;
      const hsh = (x * 73856093 ^ y * 19349663 ^ (theme.length * 17)) >>> 0;
      if (hsh % 3 !== 0) continue;
      const z = ch - 0.04;
      if (hsh % 5 === 0 && Engine.tex && (Engine.tex.t_banner || Engine.tex.l_banner)) {
        S.push({ tex: Engine.tex.t_banner ? 't_banner' : 'l_banner', x: x + 0.5, y: y + 0.5, z: z - 1.3, w: 0.55, h: 1.4, lit: true, alpha: 0.92 });
      } else {
        const tex = (Engine.tex && Engine.tex.h_chain) ? 'h_chain' : (Engine.tex && Engine.tex.a_chain) ? 'a_chain' : null;
        if (!tex) continue;
        S.push({ tex: tex, x: x + 0.5, y: y + 0.5, z: z - 0.95, w: 0.18, h: 1.05, lit: true, alpha: 0.9 });
      }
      n++;
    }
    C.hung = n;
  }
  // m20e: chains used to pop in and out as you walked: the 5-cell scan grid was anchored to the player's cell (it slid every
  // time you crossed a tile), the cap kept whichever cells came first in scan order, and the cap/visibility flipped with the
  // quality governor. Now: a world-anchored grid, the nearest N kept, a fixed cap, and a soft fade at the edge of the radius.
  // ?chainfix=0 -> old behaviour.
  const CHAINFIX = !/[?&](chainfix|m20e)=0/.test(location.search);
  function hang(S) {
    if (!CHAINFIX) return hangOld(S);
    if (openSky() || typeof LEVEL === 'undefined' || !LEVEL || typeof P === 'undefined') return;
    const MW_ = typeof MW === 'function' ? 0 : (typeof MW !== 'undefined' ? MW : 0);
    if (!MW_ || typeof CH === 'undefined') return;
    const theme = C.key || themeKey();
    const step = 5, R = 12, cap = 14, MH_ = (typeof MH !== 'undefined' ? MH : 50);
    const x0 = Math.ceil(Math.max(1, (P.x | 0) - R) / step) * step, x1 = Math.min(MW_ - 2, (P.x | 0) + R);
    const y0 = Math.ceil(Math.max(1, (P.y | 0) - R) / step) * step, y1 = Math.min(MH_ - 2, (P.y | 0) + R);
    const cand = [];
    for (let y = y0; y <= y1; y += step) for (let x = x0; x <= x1; x += step) {
      const i = y * MW_ + x;
      if (SOLID && SOLID[i]) continue;
      if (SKY && SKY[i]) continue;
      const ch = CH[i]; if (!(ch > 2 && ch < 20)) continue;
      const hsh = (x * 73856093 ^ y * 19349663 ^ (theme.length * 17)) >>> 0;
      if (hsh % 3 !== 0) continue;
      const d = Math.hypot(x + 0.5 - P.x, y + 0.5 - P.y); if (d > R) continue;
      cand.push([d, x, y, ch, hsh]);
    }
    cand.sort((a, b) => a[0] - b[0]);
    let n = 0;
    for (const [d, x, y, ch, hsh] of cand) {
      if (n >= cap) break;
      const fade = Math.max(0, Math.min(1, (R - d) / 2.5)); if (fade <= 0) continue;
      const z = ch - 0.04;
      if (hsh % 5 === 0 && Engine.tex && (Engine.tex.t_banner || Engine.tex.l_banner)) {
        S.push({ tex: Engine.tex.t_banner ? 't_banner' : 'l_banner', x: x + 0.5, y: y + 0.5, z: z - 1.3, w: 0.55, h: 1.4, lit: true, alpha: 0.92 * fade });
      } else {
        const tex = (Engine.tex && Engine.tex.h_chain) ? 'h_chain' : (Engine.tex && Engine.tex.a_chain) ? 'a_chain' : null;
        if (!tex) continue;
        const mw = (typeof EP !== 'undefined' && EP > 0) ? 2.2 * d / EP : 0;   // never thinner than ~2 screen px (thin columns shimmer)
        S.push({ tex: tex, x: x + 0.5, y: y + 0.5, z: z - 0.95, w: Math.max(0.18, mw), h: 1.05, lit: true, alpha: 0.9 * fade });
      }
      n++;
    }
    C.hung = n;
  }
  if (typeof collectSprites === 'function') {
    const _cs = collectSprites;
    collectSprites = function (cam) {
      const S = _cs.apply(this, arguments);
      try { hang(S); } catch (e) { M18.err = M18.err || ('ceilHang ' + e); }
      return S;
    };
  }

  C.dress = dress;
  C.enhance = enhance;
})();
