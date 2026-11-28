// ===== m21f: s4 close glass, close-up candelabra/brazier/sconce clamp,
// hold the previous full music bed instead of a 9s ix stub while the next
// track decodes, flatter chapel iron-door close-up, FOV "DEFAULT" label.
// Kill: ?m21f=0 / ?m21=0 (all) | ?s4glass=0 | ?proplod2=0 | ?ixhold=0 | ?doorflat=0 | ?fovlbl=0
(function () {
  const Q = new URLSearchParams(location.search);
  const off = Q.get('m21f') === '0' || Q.get('m21') === '0';
  const on = k => !off && Q.get(k) !== '0';
  const M = window.M21F = {
    on: !off, s4glass: on('s4glass'), proplod2: on('proplod2'), ixhold: on('ixhold'),
    doorflat: on('doorflat'), fovlbl: on('fovlbl'),
    n: { glass: 0, door: 0, prop: 0, ixhold: 0, fov: 0, retry: 0 },
    err: [], ready: 0, _ixWant: null
  };
  function fail(tag, e) { M.err.push(tag + ': ' + (e && e.message ? e.message : e)); }
  M.st = () => ({
    on: M.on, s4glass: M.s4glass, proplod2: M.proplod2, ixhold: M.ixhold,
    doorflat: M.doorflat, fovlbl: M.fovlbl,
    n: Object.assign({}, M.n), err: M.err.slice(), ixWant: M._ixWant
  });
  if (off) { M.ready = 1; return; }

  const GLASS_RE = /window|rose|glass|stain|chapelw|t_win/i;
  const DOOR_RE = /irondoor|t_gate|t_door|iron_door/i;
  const PROP_RE = /candelabra|sconce|brazier|^flame\d|^gflame\d/;
  const GLOW_RE = /^glow_/;

  function texNameOf(t) {
    if (!t) return '';
    if (t._nm) return t._nm;
    const pools = [Engine && Engine.tex, Engine && Engine.imgs];
    for (let p = 0; p < pools.length; p++) {
      const T = pools[p]; if (!T) continue;
      for (const k in T) {
        if (!T[k]) continue;
        if (T[k] === t || (t.d && T[k].d === t.d)) { t._nm = k; return k; }
      }
    }
    return t._nm || '';
  }
  function isEmissive(tex) {
    if (!tex || !tex.d) return false;
    if (tex._em != null) return tex._em;
    const d = tex.d, n = Math.min(d.length, 4096);
    let c = 0;
    for (let i = 0; i < n; i += 7) if ((d[i] >>> 24) === 250) c++;
    return (tex._em = c > 8);
  }
  function blurTex(tex, times) {
    times = times || 1;
    if (!tex || !tex.d || !tex.w) return tex;
    const key = '_m21f_b' + times;
    if (tex[key]) return tex[key];
    let cur = tex;
    for (let p = 0; p < times; p++) {
      const w = cur.w | 0, h = cur.h | 0, d = cur.d, out = new Uint32Array(w * h);
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        let r = 0, g = 0, b = 0, a = 0, n = 0;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          const xx = (x + dx + w) % w, yy = (y + dy + h) % h, pix = d[yy * w + xx];
          r += pix & 255; g += (pix >> 8) & 255; b += (pix >> 16) & 255; a += pix >>> 24; n++;
        }
        // mute stained-glass emissive so close-ups don't blow out
        let aa = (a / n) | 0; if (aa === 250) aa = 220;
        r = (r / n) | 0; g = (g / n) | 0; b = (b / n) | 0;
        out[y * w + x] = (aa << 24) | (b << 16) | (g << 8) | r;
      }
      cur = { w: w, h: h, d: out };
    }
    return (tex[key] = cur);
  }
  function darkenTex(tex, k) {
    if (!tex || !tex.d) return tex;
    const key = '_m21f_d' + Math.round(k * 100);
    if (tex[key]) return tex[key];
    const w = tex.w | 0, h = tex.h | 0, d = tex.d, out = new Uint32Array(w * h);
    for (let i = 0; i < d.length; i++) {
      const p = d[i], r = ((p & 255) * k) | 0, g = ((((p >> 8) & 255) * k) | 0), b = ((((p >> 16) & 255) * k) | 0);
      out[i] = (p & 0xff000000) | (b << 16) | (g << 8) | r;
    }
    return (tex[key] = { w: w, h: h, d: out });
  }
  function ironPlate() {
    if (M._iron) return M._iron;
    const w = 64, h = 64, d = new Uint32Array(w * h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const n = ((x * 13 + y * 7) ^ (x * y)) & 7;
      let r = 28 + n, g = 22 + (n >> 1), b = 26 + n;
      // rivets on a 16px grid, frame
      const rx = x % 16, ry = y % 16;
      if (rx === 2 && ry === 2) { r = 70; g = 66; b = 72; }
      if (x < 2 || y < 2 || x > 61 || y > 61) { r = 18; g = 16; b = 20; }
      // very soft mid bar so it still reads as a door, not a chevron/arrow
      if (y > 28 && y < 36 && x > 10 && x < 54) { r = (r * 0.75) | 0; g = (g * 0.75) | 0; b = (b * 0.75) | 0; }
      d[y * w + x] = 0xff000000 | (b << 16) | (g << 8) | r;
    }
    return (M._iron = { w: w, h: h, d: d, _nm: 'm21f_iron' });
  }

  function stageToken() {
    try {
      const fl = (window.M20 && M20.FL && M20.FL.cur) || (RUN && RUN.floor) || '';
      return [RUN && RUN.seed, RUN && RUN.stage, fl, RUN && RUN.hub, MW, MH].join('|');
    } catch (e) { return ''; }
  }

  function wallTick() {
    if ((!M.s4glass && !M.doorflat) || typeof P === 'undefined' || !WALLDEFS || !SOLID) return;
    const tok = stageToken();
    if (tok !== M._tok) { M._tok = tok; M._swap = new Map(); }
    try {
      const px = P.x | 0, py = P.y | 0;
      const seen = new Set();
      for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) {
        const x = px + dx, y = py + dy;
        if (x < 0 || y < 0 || x >= MW || y >= MH) continue;
        const ni = y * MW + x; if (!SOLID[ni]) continue;
        const def = WALLDEFS[WT[ni]]; if (!def) continue;
        const nmT = def.tall && def.tall.t ? (texNameOf(def.tall.t) || '') : '';
        const nmB = texNameOf(def.base) || '';
        const glass = M.s4glass && (GLASS_RE.test(nmT) || GLASS_RE.test(nmB) || isEmissive(def.tall && def.tall.t) || isEmissive(def.base));
        const door = M.doorflat && (DOOR_RE.test(nmB) || DOOR_RE.test(nmT));
        if (!glass && !door) continue;
        const d = Math.hypot(x + 0.5 - P.x, y + 0.5 - P.y);
        const lim = door ? 3.2 : 3.5;
        if (d >= lim) continue;
        seen.add(ni);
        let rec = M._swap.get(ni);
        if (!rec) {
          const src = def.base || (def.tall && def.tall.t);
          function tallOf(t, srcDef) {
            return t ? { t: t, z0: srcDef.tall.z0, z1: srcDef.tall.z1, span: srcDef.tall.span || 0, x0: srcDef.tall.x0 || 0, rep: srcDef.tall.rep } : null;
          }
          function push(defx) { WALLDEFS.push(defx); return WALLDEFS.length - 1; }
          rec = { orig: WT[ni], door: !!door };
          if (door) {
            rec.soft = push({ base: darkenTex(blurTex(src, 5), 0.72), tall: null });
            rec.flat = push({ base: ironPlate(), tall: null });
            M.n.door++;
          } else {
            const midB = blurTex(def.base || src, 1), midT = def.tall && def.tall.t ? blurTex(def.tall.t, 1) : null;
            const nearB = blurTex(def.base || src, 3), nearT = def.tall && def.tall.t ? blurTex(def.tall.t, 3) : null;
            rec.mid = push({ base: midB, tall: tallOf(midT, def) });
            rec.near = push({ base: nearB, tall: tallOf(nearT, def) });
            M.n.glass++;
          }
          M._swap.set(ni, rec);
        }
        let use = rec.orig;
        if (rec.door) use = (d < 1.55) ? rec.flat : rec.soft;
        else use = (d < 1.85) ? rec.near : rec.mid;
        if (WT[ni] !== use) WT[ni] = use;
      }
      M._swap.forEach((rec, ni) => {
        const ids = [rec.close, rec.soft, rec.flat, rec.mid, rec.near];
        if (!seen.has(ni) && ids.indexOf(WT[ni]) >= 0) WT[ni] = rec.orig;
      });
    } catch (e) { fail('wall', e); }
  }

  function clampProps(S, cam) {
    if (!M.proplod2 || !S) return;
    const cx = (cam && cam.x) || P.x, cy = (cam && cam.y) || P.y;
    for (let i = 0; i < S.length; i++) {
      const s = S[i]; if (!s || s.ent) continue;
      const tex = String(s.tex || '');
      const d = Math.hypot((s.x || 0) - cx, (s.y || 0) - cy);
      const isProp = PROP_RE.test(tex);
      const isGlow = GLOW_RE.test(tex) && (s.w >= 0.7 || s.h >= 0.7);
      const isFlame = /flame/.test(tex);
      if (!isProp && !isGlow) continue;
      if (d >= 2.8) continue;
      const k = Math.max(0.18, Math.min(1, (d * d) / (2.7 * 2.7)));
      s.w = (s.w || 0.5) * k;
      s.h = (s.h || 0.8) * k;
      const capH = d * (isFlame ? 0.16 : 0.28);
      const capW = d * (isFlame ? 0.12 : 0.22);
      if (s.h > capH) s.h = capH;
      if (s.w > capW) s.w = capW;
      if (s.alpha != null && isGlow) s.alpha *= Math.max(0.2, k * 0.85);
      M.n.prop++;
    }
  }

  // ----- hooks -----
  try {
    if (typeof collectSprites === 'function') {
      const _cs = collectSprites;
      collectSprites = function (cam) {
        const S = _cs.apply(this, arguments);
        try { clampProps(S, cam); } catch (e) { fail('cs', e); }
        return S;
      };
    }
  } catch (e) { fail('cs-h', e); }

  try {
    if (typeof render === 'function') {
      const _r = render;
      render = function (rdt) {
        try { wallTick(); } catch (e) { fail('rt', e); }
        return _r.apply(this, arguments);
      };
    }
  } catch (e) { fail('r-h', e); }

  // FOV label: "77 DEFAULT" reads as "?? DEFAULT" in the pixel font at 1x. Use DEFAULT.
  function hookFov() {
    if (!M.fovlbl || !window.OPT || OPT._m21fFov) return;
    OPT._m21fFov = 1;
    const _rows = OPT.rows.bind(OPT);
    OPT.rows = function () {
      const L = _rows();
      for (let i = 0; i < L.length; i++) {
        const r = L[i];
        if (r && r.id === 'fov' && r.v && !r._m21f) {
          const ov = r.v.bind(r);
          r.v = function () {
            const t = ov();
            if (t === '77 DEFAULT') { M.n.fov++; return 'DEFAULT'; }
            return t;
          };
          r._m21f = 1;
        }
      }
      return L;
    };
  }

  function isIxName(n) { return !!(n && String(n).indexOf('trk:m19_ix_') === 0); }
  function hookIx() {
    if (!M.ixhold || typeof SFX === 'undefined' || !SFX || SFX._m21fIx) return;
    if (typeof SFX.fileMusic !== 'function') return;
    SFX._m21fIx = 1;
    const _fm = SFX.fileMusic;
    SFX.fileMusic = function (boss) {
      try {
        const want = this.musicWant && this.musicWant(boss);
        const fm = this.fm;
        const full = fm && fm.buf && fm.buf.duration > 20 && !isIxName(fm.name);
        if (full) M._lastFull = fm.name;
        // A stage change can briefly report no want and fade the bed out; keep the
        // full bed instead of letting a 9s ix stub start once want lands mid-decode.
        if (!want && full && window.G && G.state === 'play') {
          M.n.ixhold++;
          return true;
        }
        if (want && !this.buf[want] && full) {
          M._ixWant = want;
          M.n.ixhold++;
          try {
            if (window.M16 && typeof M16.warm === 'function') {
              const n = String(want).replace(/^trk:/, '').replace(/^m16_/, '');
              M16.warm(n);
            }
          } catch (e) { fail('warm', e); }
          return true;
        }
        if (want && this.buf[want] && M._ixWant === want) M._ixWant = null;
      } catch (e) { fail('ix', e); }
      return _fm.apply(this, arguments);
    };
    if (!M._ixIv) {
      M._ixIv = setInterval(function () {
        try {
          if (M._ixWant && SFX && SFX.buf && SFX.buf[M._ixWant]) {
            M.n.retry++;
            const w = M._ixWant; M._ixWant = null;
            SFX.fileMusic(!!(SFX.mus && SFX.mus.boss));
          }
        } catch (e) { fail('ix-r', e); }
      }, 200);
    }
  }

  try { hookFov(); } catch (e) { fail('fov-h', e); }
  try { hookIx(); } catch (e) { fail('ix-h', e); }
  M.ready = 1;
  setTimeout(function () {
    try { hookFov(); hookIx(); M.ready = 1; } catch (e) { fail('late', e); }
  }, 0);
})();
