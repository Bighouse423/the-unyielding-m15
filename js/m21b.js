// ===== m21b: bake hung chains into unique wall defs, finisher stage-load prewarm,
// isolated-ledge nudge (jump-gap arenas left alone), early music preload for s9-s11,
// close-up candelabra/glass LOD, wayfinding/oath contrast, settings scrim.
// Kill: ?m21b=0 / ?m21=0 (all) | ?chainbake=0 | ?finwarm=0 | ?ledgefix=0 | ?muspre=0
//       | ?proplod=0 | ?navfix=0 | ?setscrim=0
(function () {
  const Q = new URLSearchParams(location.search);
  const off = Q.get('m21b') === '0' || Q.get('m21') === '0';
  const on = k => !off && Q.get(k) !== '0';
  const M = window.M21B = {
    on: !off, chainbake: on('chainbake'), finwarm: on('finwarm'), ledgefix: on('ledgefix'),
    muspre: on('muspre'), proplod: on('proplod'), navfix: on('navfix'), setscrim: on('setscrim'),
    floormip: on('floormip') && on('hubfloor'), altarpack: on('altarpack'),
    bridge: on('bridge'), featsmap: on('featsmap'),
    n: { baked: 0, pulled: 0, nudged: 0, warmed: 0, glass: 0, lod: 0, touched: 0, feats: 0, rp: 0, flush: 0 },
    err: [], ready: 0
  };
  function fail(tag, e) { M.err.push(tag + ': ' + (e && e.message ? e.message : e)); }
  M.st = () => ({
    on: M.on, chainbake: M.chainbake, finwarm: M.finwarm, ledgefix: M.ledgefix, muspre: M.muspre,
    proplod: M.proplod, navfix: M.navfix, setscrim: M.setscrim, floormip: M.floormip, altarpack: M.altarpack,
    bridge: M.bridge, featsmap: M.featsmap, n: Object.assign({}, M.n), err: M.err.slice(),
    bakeTok: M._bakeTok || '', glass: (M._glass && M._glass.size) || 0, desk: !!(window.TU_DESKTOP || window.M12DESKTOP || window.tuBridge)
  });
  if (off) { M.ready = 1; return; }

  const CHAIN_TEX = { h_chain: 1, a_chain: 1, m20i_hchain: 1, m20j_chain: 1 };
  const PROP_TEX = { candelabra: 1, t_banner: 1, l_banner: 1, brazier: 1 };
  const GLASS_RE = /window|rose|glass|stain|chapelw|t_win/i;

  function themeKey() {
    try {
      if (window.M18 && M18.ceilState && M18.ceilState.key) return M18.ceilState.key;
      if (typeof RUN !== 'undefined' && RUN.hub) return 'hub';
      if (RUN && RUN.cfg && RUN.cfg.theme) return RUN.cfg.theme;
      const th = typeof curTheme === 'function' && curTheme();
      return (th && (th.variant || th.music)) || 'nave';
    } catch (e) { return 'nave'; }
  }
  function stageToken() {
    try {
      const fl = (window.M20 && M20.FL && M20.FL.cur) || (RUN && RUN.floor) || '';
      return [RUN && RUN.seed, RUN && RUN.stage, fl, LEVEL && (LEVEL.kind || LEVEL.theme || ''), MW, MH].join('|');
    } catch (e) { return ''; }
  }

  // ---------- 1. CHAIN BAKE: stamp hung-chain cells onto a unique cloned wall def, drop the sprite ----------
  function chainTex() {
    const T = Engine.tex || {};
    return T.a_chain || T.h_chain || T.m20j_chain || T.m20i_hchain || null;
  }

  // scrub the off-map dummy the finisher prewarm leaves at (-79,-80) (and any mana it dropped)
  function scrubDummy() {
    try {
      if (typeof G === 'undefined' || !G) return;
      const off = o => o && o.x < -60 && o.y < -60;
      if (G.enemies && G.enemies.some(off)) G.enemies = G.enemies.filter(e => !off(e));
      if (G.pickups && G.pickups.some(off)) G.pickups = G.pickups.filter(p => !off(p));
      if (G.particles && G.particles.some(off)) G.particles = G.particles.filter(p => !off(p));
    } catch (e) { fail('scrub', e); }
  }

  function bakeChains() {
    if (!M.chainbake || typeof MW === 'undefined' || typeof SOLID === 'undefined' || !SOLID || !WALLDEFS) return;
    const tok = stageToken(); if (!tok || tok === M._bakeTok) return;
    M._bakeTok = tok; M.n.baked = 0; M.n.pulled = 0;
    const theme = String(themeKey()), step = 5, MH_ = MH, MW_ = MW;
    const tex = chainTex(); if (!tex) return;
    M._bakedCells = M._bakedCells || new Set();
    M._bakedCells.clear();
    try {
      for (let y = step; y <= MH_ - 2; y += step) for (let x = step; x <= MW_ - 2; x += step) {
        const i = y * MW_ + x;
        if (SOLID[i] || (typeof SKY !== 'undefined' && SKY && SKY[i])) continue;
        const ch = CH[i]; if (!(ch > 2 && ch < 20)) continue;
        const hsh = (x * 73856093 ^ y * 19349663 ^ (theme.length * 17)) >>> 0;
        if (hsh % 3 !== 0) continue;
        if (hsh % 5 === 0) continue; // banner hang — leave the sprite
        let bare = -1, any = -1, bd = 99, ad = 99;
        for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) {
          if (!dx && !dy) continue;
          const nx = x + dx, ny = y + dy;
          if (nx < 1 || ny < 1 || nx >= MW_ - 1 || ny >= MH_ - 1) continue;
          const ni = ny * MW_ + nx;
          if (!SOLID[ni] || !(FH[ni] > 2)) continue;
          const d = Math.hypot(dx, dy);
          if (d < ad) { ad = d; any = ni; }
          const def = WALLDEFS[WT[ni]];
          if (def && !def.tall && d < bd) { bd = d; bare = ni; }
        }
        const ni = bare >= 0 ? bare : -1;
        if (ni < 0) { M.n.pulled++; continue; }
        const old = WALLDEFS[WT[ni]] || WALLDEFS[0];
        const z1 = Math.max(1.2, Math.min(CH[ni] || 3.8, ch) - 0.02);
        const z0 = Math.max(0.2, z1 - 2.2);
        WALLDEFS.push({ base: old.base, tall: { t: tex, z0: z0, z1: z1, span: 0, x0: 0 } });
        WT[ni] = WALLDEFS.length - 1;
        M._bakedCells.add(ni);
        M.n.baked++;
      }
    } catch (e) { fail('bake', e); }
  }
  function stripHung(S) {
    if (!M.chainbake || !S || !S.length) return S;
    let w = 0;
    for (let i = 0; i < S.length; i++) {
      const s = S[i], tn = s && (s.tex || '');
      if (tn && CHAIN_TEX[tn] && !s.lock && !s.doorLock) continue;
      S[w++] = s;
    }
    if (w < S.length) S.length = w;
    return S;
  }

  // ---------- 2. FINISHER PREWARM on every stage load + pre-touch gib/blood tex ----------
  function touchGibs() {
    try {
      const T = (Engine && Engine.tex) || {}, I = (Engine && Engine.imgs) || {};
      const c = document.createElement('canvas'); c.width = 8; c.height = 8;
      const x = c.getContext('2d'); let n = 0;
      const keys = new Set();
      for (const k of Object.keys(T)) if (/gib|blood|splat|spray|chunk|flesh|bone|imp|ecto/i.test(k)) keys.add(k);
      for (const k of Object.keys(I)) if (/gib|blood|splat|spray|chunk|flesh|bone/i.test(k)) keys.add(k);
      for (const k of keys) {
        const t = T[k] || I[k]; if (!t) continue;
        if (t.d && t.d.length) { let s = 0; for (let i = 0, L = t.d.length; i < L; i += 48) s += t.d[i]; n++; }
        try { if (t.img) x.drawImage(t.img, 0, 0, 8, 8); else if (t.cv) x.drawImage(t.cv, 0, 0, 8, 8); } catch (e2) { }
      }
      M.n.touched = n;
    } catch (e) { fail('touch', e); }
  }
  function armPrewarm() {
    if (!M.finwarm) return;
    try { if (window.M20M) M20M._pwfx = 0; } catch (e) { }
    touchGibs();
    M.n.warmed++;
  }

  // ---------- 3. LEDGE: nudge truly isolated non-flying foes; leave jump-gap arenas ----------
  function isFly(e) {
    const d = e && e.d; if (!d) return false;
    if (d.fly || d.phase || d.hover) return true;
    const k = d.kind || e.kind || e.type || '';
    return k === 'bat' || k === 'imp' || k === 'ghost' || k === 'wraith' || k === 'gargoyle';
  }
  function tallSolid(i) {
    return !!(SOLID[i] && FH[i] > 1.2);
  }
  function walkable(i) {
    if (i < 0 || i >= SOLID.length) return false;
    if (SOLID[i] !== 1) return true;
    try {
      if (LEVEL && LEVEL.doors) {
        const x = i % MW, y = (i / MW) | 0;
        const ds = LEVEL.doors;
        const list = Array.isArray(ds) ? ds : (ds.gate ? [ds.gate].concat(ds.list || ds.all || []) : Object.values(ds));
        for (const d of list) { if (d && (d.x | 0) === x && (d.y | 0) === y) return true; }
      }
    } catch (e) { }
    return false;
  }
  function bfsReach() {
    const N = MW * MH, dist = new Int16Array(N); dist.fill(-1);
    const sx = Math.max(0, Math.min(MW - 1, P.x | 0)), sy = Math.max(0, Math.min(MH - 1, P.y | 0));
    let s = sy * MW + sx;
    if (!walkable(s)) {
      let found = -1;
      for (let r = 1; r <= 3 && found < 0; r++) for (let dy = -r; dy <= r && found < 0; dy++) for (let dx = -r; dx <= r; dx++) {
        const x = sx + dx, y = sy + dy; if (x < 0 || y < 0 || x >= MW || y >= MH) continue;
        const i = y * MW + x; if (walkable(i)) found = i;
      }
      if (found < 0) return dist; s = found;
    }
    const q = [s]; dist[s] = 0;
    const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    for (let h = 0; h < q.length; h++) {
      const c = q[h], x = c % MW, y = (c / MW) | 0, d0 = dist[c];
      for (const [dx, dy] of dirs) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= MW || ny >= MH) continue;
        const ni = ny * MW + nx;
        if (walkable(ni) && dist[ni] < 0) { dist[ni] = d0 + 1; q.push(ni); continue; }
        // jump-gap: 1 or 2 cells of non-tall (pit/rail), land on walkable of similar height
        for (const hop of [2, 3]) {
          const hx = x + dx * hop, hy = y + dy * hop;
          if (hx < 0 || hy < 0 || hx >= MW || hy >= MH) continue;
          const hi = hy * MW + hx; if (!walkable(hi) || dist[hi] >= 0) continue;
          let blocked = false;
          for (let k = 1; k < hop; k++) {
            const mi = (y + dy * k) * MW + (x + dx * k);
            if (tallSolid(mi)) { blocked = true; break; }
          }
          if (blocked) continue;
          if (Math.abs((FH[hi] || 0) - (FH[c] || 0)) > 0.85) continue;
          dist[hi] = d0 + hop; q.push(hi);
        }
      }
    }
    return dist;
  }
  function nudgeLedge() {
    if (!M.ledgefix || typeof G === 'undefined' || !G.enemies || typeof P === 'undefined' || !SOLID) return;
    const tok = stageToken(); if (!tok || tok === M._ledgeTok) return;
    M._ledgeTok = tok;
    try {
      const dist = bfsReach();
      const foes = G.enemies;
      for (const e of foes) {
        if (!e || !e.alive || e.hidden || e.noNudge) continue;
        if (e.d && (e.d.boss || e.boss)) continue;
        if (isFly(e)) continue;
        const cx = e.x | 0, cy = e.y | 0;
        if (cx < 0 || cy < 0 || cx >= MW || cy >= MH) continue;
        const ci = cy * MW + cx;
        if (dist[ci] >= 0) continue;
        // isolated: nearest reachable walkable tile, not on the player, similar-or-lower height
        let best = -1, bd = 1e9;
        const eh = FH[ci] || 0;
        for (let i = 0; i < dist.length; i++) {
          if (dist[i] < 0 || !walkable(i)) continue;
          const x = i % MW, y = (i / MW) | 0;
          if (Math.hypot(x + 0.5 - P.x, y + 0.5 - P.y) < 1.6) continue;
          if ((FH[i] || 0) - eh > 0.85) continue;
          const d = Math.hypot(x + 0.5 - e.x, y + 0.5 - e.y);
          if (d < bd) { bd = d; best = i; }
        }
        if (best < 0 || bd > 18) continue;
        e.x = (best % MW) + 0.5; e.y = ((best / MW) | 0) + 0.5;
        if (typeof FH !== 'undefined') e.z = FH[best] || 0;
        M.n.nudged++;
      }
    } catch (e) { fail('ledge', e); }
  }

  // ---------- 4. MUSIC PRELOAD: start the dest / next long track as soon as the stage begins ----------
  function pairFor(st) {
    try {
      const map = window.M16 && M16.map && M16.map.stage;
      if (!map) return null;
      if (st >= 11) return map.abyss;
      return map[String(st)] || null;
    } catch (e) { return null; }
  }
  function warmStage(st) {
    if (!M.muspre || !window.M16 || typeof M16.warm !== 'function') return;
    try {
      const pair = pairFor(st); if (pair && pair[0]) M16.warm(pair[0]);
      // also start the next long sting-prone track two rooms early
      if (st >= 7 && st < 11) { const nx = pairFor(Math.max(st + 1, 9)); if (nx && nx[0]) M16.warm(nx[0]); }
      if (st >= 9) { const nx = pairFor(10); if (nx && nx[0]) M16.warm(nx[0]); }
      if (st >= 10) { const ab = pairFor(11); if (ab && ab[0]) M16.warm(ab[0]); }
    } catch (e) { fail('mus', e); }
  }

  // ---------- 5. CLOSE-UP PROP LOD (candelabra / banners) + stained-glass mip ----------
  function blurTex(tex) {
    if (!tex || !tex.d || !tex.w) return tex;
    if (tex._m21mip) return tex._m21mip;
    const w = tex.w | 0, h = tex.h | 0, d = tex.d, out = new Uint32Array(w * h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      let r = 0, g = 0, b = 0, a = 0, n = 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const xx = (x + dx + w) % w, yy = (y + dy + h) % h, p = d[yy * w + xx];
        r += p & 255; g += (p >> 8) & 255; b += (p >> 16) & 255; a += p >>> 24; n++;
      }
      out[y * w + x] = ((a / n) << 24) | ((b / n) << 16) | ((g / n) << 8) | (r / n);
    }
    return (tex._m21mip = { w: w, h: h, d: out });
  }
  function texNameOf(t) {
    if (!t || !Engine.tex) return '';
    for (const k in Engine.tex) if (Engine.tex[k] === t) return k;
    return '';
  }
  function glassTick() {
    if (!M.proplod || typeof P === 'undefined' || !WALLDEFS || !SOLID) return;
    const tok = stageToken();
    if (tok !== M._glassTok) { M._glassTok = tok; M._glass = new Map(); }
    try {
      const px = P.x | 0, py = P.y | 0;
      const seen = new Set();
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
        const x = px + dx, y = py + dy;
        if (x < 0 || y < 0 || x >= MW || y >= MH) continue;
        const ni = y * MW + x; if (!SOLID[ni]) continue;
        if (M._bakedCells && M._bakedCells.has(ni)) continue;
        const def = WALLDEFS[WT[ni]]; if (!def) continue;
        const nmT = def.tall && def.tall.t ? (texNameOf(def.tall.t) || def.tall.t._nm || '') : '';
        const nmB = texNameOf(def.base) || (def.base && def.base._nm) || '';
        const isGlass = GLASS_RE.test(nmT) || GLASS_RE.test(nmB);
        const isDoor = /irondoor|t_gate|t_door|iron_door/.test(nmB) || /irondoor|t_gate|t_door/.test(nmT);
        if (!isGlass && !isDoor) continue;
        const d = Math.hypot(x + 0.5 - P.x, y + 0.5 - P.y);
        seen.add(ni);
        const lim = isDoor ? 2.1 : 1.45;
        if (d < lim) {
          let rec = M._glass.get(ni);
          if (!rec) {
            const b0 = def.base || (def.tall && def.tall.t); const b = isDoor ? blurTex(blurTex(blurTex(b0))) : blurTex(b0);
            const close = { base: b, tall: def.tall ? { t: blurTex(def.tall.t), z0: def.tall.z0, z1: def.tall.z1, span: def.tall.span || 0, x0: def.tall.x0 || 0, rep: def.tall.rep } : null };
            WALLDEFS.push(close);
            rec = { orig: WT[ni], close: WALLDEFS.length - 1 };
            M._glass.set(ni, rec);
            M.n.glass++;
          }
          if (WT[ni] !== rec.close) WT[ni] = rec.close;
        }
      }
      // restore cells we've left
      M._glass.forEach((rec, ni) => {
        if (!seen.has(ni) && WT[ni] === rec.close) WT[ni] = rec.orig;
      });
    } catch (e) { fail('glass', e); }
  }

  // ---------- 6. SETTINGS SCRIM (hide the title-wall "9" bleeding through 0.82 dim) ----------
  if (M.setscrim && typeof OPT !== 'undefined' && OPT && typeof OPT.draw === 'function') {
    try {
      const _od = OPT.draw;
      OPT.draw = function (ctx) {
        if (ctx && ctx.fillRect) {
          const orig = ctx.fillRect;
          let first = true;
          ctx.fillRect = function (x, y, w, h) {
            if (first && x === 0 && y === 0) {
              first = false;
              const prev = ctx.fillStyle;
              ctx.fillStyle = 'rgba(8,0,16,1)';
              orig.call(ctx, x, y, w, h);
              ctx.fillStyle = prev;
              ctx.fillRect = orig;
              return;
            }
            return orig.apply(ctx, arguments);
          };
          try { return _od.apply(this, arguments); }
          finally { ctx.fillRect = orig; }
        }
        return _od.apply(this, arguments);
      };
    } catch (e) { fail('scrim', e); }
  }

  // ---------- hooks ----------
  if (typeof collectSprites === 'function') {
    const _cs = collectSprites;
    collectSprites = function (cam) {
      const S = _cs.apply(this, arguments);
      try {
        bakeChains();
        stripHung(S);
        nudgeLedge();
        scrubDummy();
        if (RUN && RUN.hub) softenHubFloor();
        if (M.proplod && S) {
          for (let i = 0; i < S.length; i++) {
            const s = S[i]; if (!s || !s.tex) continue;
            if (PROP_TEX[s.tex] || (typeof s.tex === 'string' && /candelabra|banner/.test(s.tex))) {
              s._m21lod = 1; M.n.lod++;
            }
          }
        }
      } catch (e) { fail('cs', e); }
      return S;
    };
  }
  if (M.proplod && typeof drawSprite === 'function') {
    const _dsp = drawSprite;
    drawSprite = function (cam, s) {
      if (s && s._m21lod) {
        const hold = s.ent, ht = s.tex;
        s.ent = 1; // reuse the arm's-length size clamp so close props do not go blocky
        try {
          const d = Math.hypot((s.x || 0) - (cam && cam.x || 0), (s.y || 0) - (cam && cam.y || 0));
          if (d < 1.5 && Engine.tex && Engine.tex[s.tex]) {
            const mip = blurTex(Engine.tex[s.tex]);
            const mk = s.tex + '_m21mip';
            if (!Engine.tex[mk]) Engine.tex[mk] = mip;
            s.tex = mk;
          }
        } catch (e) { }
        try { return _dsp.apply(this, arguments); }
        finally { s.ent = hold; s.tex = ht; }
      }
      return _dsp.apply(this, arguments);
    };
  }
  if (typeof render === 'function') {
    const _r = render;
    render = function (rdt) {
      try { if (M.proplod) glassTick(); } catch (e) { fail('rt', e); }
      return _r.apply(this, arguments);
    };
  }
  function wrapStage(fn, name) {
    if (typeof fn !== 'function') return fn;
    return function () {
      try {
        if (M.muspre) {
          const dest = name === 'nextStage' ? (RUN && (RUN.stage | 0) + 1) : (RUN && (RUN.stage | 0));
          if (dest) warmStage(dest);
        }
      } catch (e) { fail('pre-' + name, e); }
      const r = fn.apply(this, arguments);
      try {
        M._bakeTok = ''; M._ledgeTok = '';
        armPrewarm();
        if (M.muspre) warmStage((RUN && (RUN.stage | 0)) || 1);
        try { setPresence(); flushSave(name); } catch (e2) { }
      } catch (e) { fail('post-' + name, e); }
      return r;
    };
  }
  if (typeof nextStage === 'function') nextStage = wrapStage(nextStage, 'nextStage');
  if (typeof newGame === 'function') newGame = wrapStage(newGame, 'newGame');

  // floor swaps (upper/lower) should rebake and recheck ledges
  try {
    if (window.M20 && M20.FL && typeof M20.FL.go === 'function') {
      const _go = M20.FL.go;
      M20.FL.go = function () {
        const r = _go.apply(this, arguments);
        try { M._bakeTok = ''; M._ledgeTok = ''; armPrewarm(); } catch (e) { }
        return r;
      };
    }
  } catch (e) { fail('flgo', e); }


  // ---------- 7. FLOOR MIP: kill grazing-angle rainbow moire (hub marble sides, and any floor past ~2 units) ----------

  function chromaSoft(tex) {
    if (!tex || !tex.d || tex._m21soft) return tex;
    const w = tex.w || 64, h = tex.h || 64, d = tex.d, o = new Uint32Array(d.length);
    const lum = p => (p & 255) * 0.299 + ((p >> 8) & 255) * 0.587 + ((p >> 16) & 255) * 0.114;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      let r = 0, g = 0, b = 0, n = 0;
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
        const xx = (x + dx + w) % w, yy = (y + dy + h) % h, p = d[yy * w + xx];
        r += p & 255; g += (p >> 8) & 255; b += (p >> 16) & 255; n++;
      }
      r /= n; g /= n; b /= n;
      const p0 = d[y * w + x], L = lum(p0), Lb = 0.299 * r + 0.587 * g + 0.114 * b;
      const k = Lb > 0.001 ? L / Lb : 1;
      let rr = r * k, gg = g * k, bb = b * k;
      // pull chroma halfway toward the blur so veins stay, rainbow sparkle dies
      rr = (p0 & 255) * 0.35 + rr * 0.65;
      gg = ((p0 >> 8) & 255) * 0.35 + gg * 0.65;
      bb = ((p0 >> 16) & 255) * 0.35 + bb * 0.65;
      rr = rr < 0 ? 0 : rr > 255 ? 255 : rr; gg = gg < 0 ? 0 : gg > 255 ? 255 : gg; bb = bb < 0 ? 0 : bb > 255 ? 255 : bb;
      o[y * w + x] = (p0 & 0xff000000) | ((bb | 0) << 16) | ((gg | 0) << 8) | (rr | 0);
    }
    const out = { w: w, h: h, d: o, _m21soft: 1 };
    return out;
  }
  function softenHubFloor() {
    if (!M.floormip || typeof RUN === 'undefined' || !RUN.hub || !FLOORTEX || !FLOORTEX[0]) return;
    if (FLOORTEX[0]._m21soft || FLOORTEX._m21hub) return;
    try {
      FLOORTEX[0] = chromaSoft(FLOORTEX[0]);
      FLOORTEX._m21hub = 1;
      M.n.hubfloor = 1;
    } catch (e) { fail('hubfloor', e); }
  }
  function boxMip(src, w, h, scale) {
    const sw = Math.max(1, (w / scale) | 0), sh = Math.max(1, (h / scale) | 0);
    const o = new Uint32Array(sw * sh);
    for (let y = 0; y < sh; y++) for (let x = 0; x < sw; x++) {
      let r = 0, g = 0, b = 0, a = 0, n = 0;
      for (let dy = 0; dy < scale; dy++) for (let dx = 0; dx < scale; dx++) {
        const xx = Math.min(w - 1, x * scale + dx), yy = Math.min(h - 1, y * scale + dy);
        const p = src[yy * w + xx];
        r += p & 255; g += (p >> 8) & 255; b += (p >> 16) & 255; a += p >>> 24; n++;
      }
      o[y * sw + x] = ((a / n) << 24) | ((b / n) << 16) | ((g / n) << 8) | (r / n);
    }
    return { w: sw, h: sh, d: o };
  }
  function ensureMips(ft) {
    if (!ft || !ft.d || ft._m21m1) return ft;
    const w = ft.w || 64, h = ft.h || 64;
    if (ft.d.length < w * h) return ft;
    try {
      ft._m21m1 = boxMip(ft.d, w, h, 2);
      ft._m21m2 = boxMip(ft.d, w, h, 4);
    } catch (e) { fail('mip', e); }
    return ft;
  }
  M.floorPix = function (ft, fx, fy, dist) {
    if (!M.floormip || !ft || dist < 1.15) return null;
    ensureMips(ft);
    const mip = dist > 2.8 ? ft._m21m2 : ft._m21m1; if (!mip) return null;
    const s = mip.w;
    let x = (fx * s) | 0, y = (fy * s) | 0;
    if (x < 0) x = 0; if (y < 0) y = 0; if (x >= s) x = s - 1; if (y >= s) y = s - 1;
    return mip.d[y * s + x];
  };

  // ---------- 8. FEAT MAP: m20_vigil / m20_warden / m20_chronicle were added after m12g.js ran ----------
  function remapFeats() {
    if (!M.featsmap) return;
    try {
      if (!window.M12 || !M12.STEAM || !M12.STEAM.map || !window.ACH || !ACH.list) return;
      for (const a of ACH.list) if (a && a.id) M12.STEAM.map[a.id] = M12.STEAM.map[a.id] || ('TU_' + a.id.toUpperCase());
      M.n.feats = Object.keys(M12.STEAM.map).length;
    } catch (e) { fail('feats', e); }
  }
  remapFeats();
  setTimeout(remapFeats, 0);
  setTimeout(remapFeats, 1500);

  // ---------- 9. DESKTOP BRIDGE: richPresence, openStore, save.flush (no-op in the browser) ----------
  function bridge() {
    if (!M.bridge) return null;
    return window.M12DESKTOP || window.tuBridge || null;
  }
  function setPresence() {
    const D = bridge(); if (!D || !D.steam || typeof D.steam.richPresence !== 'function') return;
    try {
      let status = 'In the Chapel';
      if (typeof G === 'undefined') return;
      if (G.state === 'title') status = 'On the title screen';
      else if (G.state === 'altar') status = 'At the Altar of Shards';
      else if (G.state === 'dead' || G.state === 'results') status = 'After a descent';
      else if (window.RUN && RUN.on && !RUN.hub) {
        const th = (typeof curTheme === 'function' && curTheme()) || {};
        const nm = th.name || th.title || '';
        status = 'Stage ' + (RUN.stage | 0) + (nm ? ': ' + nm : '');
      }
      if (status !== M._rp) {
        M._rp = status;
        D.steam.richPresence('status', status);
        M.n.rp++;
      }
    } catch (e) { fail('rp', e); }
  }
  function flushSave(why) {
    const D = bridge(); if (!D || !D.save || typeof D.save.flush !== 'function') return;
    try { D.save.flush(); M.n.flush++; } catch (e) { fail('flush', e); }
  }
  if (typeof writeSave === 'function') {
    const _ws = writeSave;
    writeSave = function () {
      const r = _ws.apply(this, arguments);
      try { flushSave('write'); } catch (e) { }
      return r;
    };
  }
  if (typeof enterHub === 'function') {
    const _eh = enterHub;
    enterHub = function () {
      const r = _eh.apply(this, arguments);
      try { setPresence(); flushSave('hub'); } catch (e) { }
      return r;
    };
  }
  // presence tick after our existing nextStage/newGame wraps: hook render lightly
  if (typeof render === 'function') {
    const _r2 = render;
    // render may already be wrapped above; this adds presence at a low rate
    render = function (rdt) {
      const r = _r2.apply(this, arguments);
      try {
        if (M.bridge && (M._rpT = (M._rpT || 0) + (rdt || 0.016)) > 1.2) { M._rpT = 0; setPresence(); }
      } catch (e) { }
      return r;
    };
  }
  // title WISHLIST / STEAM PAGE, only when the wrapper actually exposes openStore
  try {
    const D0 = bridge();
    if (D0 && typeof D0.openStore === 'function' && window.M12 && M12.MENU && !M12.MENU.some(m => m.id === 'steamstore')) {
      const i = M12.MENU.findIndex(m => m.id === 'quit' || m.id === 'settings' || m.id === 'opts');
      M12.MENU.splice(i >= 0 ? i : M12.MENU.length, 0, { id: 'steamstore', l: window.TU_DEMO ? 'WISHLIST ON STEAM' : 'VIEW ON STEAM' });
      const _a = M12.menuAct;
      M12.menuAct = function (id) {
        if (id === 'steamstore') { try { const D = bridge(); if (D && D.openStore) D.openStore(); } catch (e) { fail('store', e); } return; }
        if (_a) return _a.apply(this, arguments);
      };
    }
  } catch (e) { fail('store-menu', e); }
  try { setPresence(); } catch (e) { }

  M.ready = 1;
})();
