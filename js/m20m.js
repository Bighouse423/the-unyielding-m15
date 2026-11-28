// ===== m20m: HD lighting (t238u), unlock-all, finisher smoothness + stationary chains/locks (t239u) =====
// Cause: at RK=2 the world is rendered into a 960x540 buffer, but present always did
//   sctx.drawImage(low, -W/2, -H/2, W, H) with SCALE typically 2
// which nearest-neighbour downsampled 960→480 then upscaled back onto the 960 backing.
// That aliasing showed up as blotchy / glitchy lighting (torch walls, floor gradients)
// after switching Resolution to HD 2X. Same squeeze happened with or without m20l;
// m20l's 1:1 present only ran at RK===1, so switching to 2HD fell back to the squeeze path.
// Fix:
//   1. Present the full EW x EH buffer at SCALE/RK (1:1 when the backing is 960).
//      HUD still uses SCALE (480-space).
//   2. Bilinear-filter the lightmap at HD (and scale the wall AO dither to logical
//      pixels) so light-texel steps and 1px sparkle do not show up as glitchy spots.
//   3. Keep an explicit HD choice from being dropped to Classic by the Auto
//      quality governor (Quality Low may still drop it).
//   4. finfix    : cheaper finishers (pooled blood/gibs, no mid-burst particle splice,
//                  deferred wall splats). Look and blood count stay the same.
//   5. chainstat : hung/seal chains are world-locked vertical quads (fixed yaw, quantized
//                  world + camera, integer UV). No sway, no billboard rotation, no sub-pixel motion.
//   6. lockfix   : the gold lock on a locked door/entrance is the full m20_chains texture
//                  on a world-locked door-facing quad (not the close-range 1-column smear).
// Kill switches: ?m20m=0 (all; also ?m20=0) | ?hdfix=0 | ?lmap=0 | ?hdkeep=0 | ?finfix=0 | ?chainstat=0 | ?lockfix=0
(function () {
  const Q = location.search, off = /[?&](m20m|m20)=0/.test(Q), fl = n => !off && !new RegExp('[?&]' + n + '=0').test(Q);
  const M = window.M20M = {
    on: !off, hdfix: fl('hdfix'), lmap: fl('lmap') && fl('hdfix'), hdkeep: fl('hdkeep'),
    finfix: fl('finfix'), chainstat: fl('chainstat'), lockfix: fl('lockfix'),
    n: { blit: 0, keep: 0, lmap: 0, fin: 0, pool: 0, chain: 0, lock: 0 }, err: []
  };
  const fail = (w, e) => { if (M.err.length < 12) M.err.push(w + ': ' + (e && e.message || e)); };
  M.st = () => ({ on: M.on, hdfix: M.hdfix, lmap: M.lmap, hdkeep: M.hdkeep, finfix: M.finfix, chainstat: M.chainstat, lockfix: M.lockfix, n: M.n, err: M.err, rk: typeof RK !== 'undefined' ? RK : 1 });
  if (off) return;

  // ---------- 1:1 (or integer) present of the HD world buffer ----------
  if (M.hdfix) {
    try {
      const canv = document.getElementById('screen');
      const ctx = canv && canv.getContext('2d');
      if (!ctx) { fail('blit', 'no screen ctx'); }
      else {
        const _di = ctx.drawImage.bind(ctx);
        ctx.drawImage = function (img, a1, a2, a3, a4) {
          try {
            if (M.hdfix && typeof RK !== 'undefined' && RK > 1 && typeof EW === 'number' &&
                arguments.length === 5 && a3 === W && a4 === H) {
              const src = (typeof LOWC !== 'undefined' && LOWC) || (typeof ctxLow !== 'undefined' && ctxLow && ctxLow.canvas);
              if (src && img === src) {
                const t = ctx.getTransform();
                const k = 1 / RK;
                ctx.setTransform(t.a * k, t.b * k, t.c * k, t.d * k, t.e, t.f);
                _di(img, -EW / 2, -EH / 2, EW, EH);
                ctx.setTransform(t);
                M.n.blit++;
                return;
              }
            }
          } catch (e) { fail('blit', e); }
          if (arguments.length === 9) return _di.apply(ctx, arguments);
          if (arguments.length === 5) return _di(img, a1, a2, a3, a4);
          if (arguments.length === 3) return _di(img, a1, a2);
          return _di.apply(ctx, arguments);
        };
      }
    } catch (e) { fail('hook', e); }
  }


  // ---------- bilinear lightmap at HD (kills nearest-texel spots + 1px stripes) ----------
  if (M.lmap && typeof lightAt === 'function') {
    try {
      const _la = lightAt;
      lightAt = function (x, y, out) {
        if (!(M.lmap && typeof RK !== 'undefined' && RK > 1 && typeof LR === 'number' && LMr)) return _la(x, y, out);
        const LW = MW * LR, LH = MH * LR;
        let fx = x * LR, fy = y * LR;
        let x0 = Math.floor(fx), y0 = Math.floor(fy);
        const tx = fx - x0, ty = fy - y0;
        if (x0 < 0) x0 = 0; if (y0 < 0) y0 = 0;
        if (x0 >= LW) x0 = LW - 1; if (y0 >= LH) y0 = LH - 1;
        let x1 = x0 + 1, y1 = y0 + 1;
        if (x1 >= LW) x1 = LW - 1; if (y1 >= LH) y1 = LH - 1;
        const i00 = y0 * LW + x0, i10 = y0 * LW + x1, i01 = y1 * LW + x0, i11 = y1 * LW + x1;
        const w00 = (1 - tx) * (1 - ty), w10 = tx * (1 - ty), w01 = (1 - tx) * ty, w11 = tx * ty;
        const f00 = FLK[i00], f10 = FLK[i10], f01 = FLK[i01], f11 = FLK[i11];
        out[0] = (LMr[i00] + LTr[i00] * f00) * w00 + (LMr[i10] + LTr[i10] * f10) * w10 + (LMr[i01] + LTr[i01] * f01) * w01 + (LMr[i11] + LTr[i11] * f11) * w11;
        out[1] = (LMg[i00] + LTg[i00] * f00) * w00 + (LMg[i10] + LTg[i10] * f10) * w10 + (LMg[i01] + LTg[i01] * f01) * w01 + (LMg[i11] + LTg[i11] * f11) * w11;
        out[2] = (LMb[i00] + LTb[i00] * f00) * w00 + (LMb[i10] + LTb[i10] * f10) * w10 + (LMb[i01] + LTb[i01] * f01) * w01 + (LMb[i11] + LTb[i11] * f11) * w11;
        return out;
      };
    } catch (e) { fail('lmap', e); }
  }

  // ---------- don't let Auto governor override an explicit HD setting ----------
  if (M.hdkeep && typeof setRenderScale === 'function') {
    try {
      const _srs = setRenderScale;
      setRenderScale = function (k) {
        try {
          const S = window.OPT && OPT.S;
          if (S && S.hd === true && S.m20lqual !== 'low' && k !== 2) { k = 2; M.n.keep++; }
        } catch (e) { fail('keep', e); }
        return _srs(k);
      };
    } catch (e) { fail('srs', e); }
  }


  // ---------- finfix: pooled finishers, no mid-burst splice, deferred wall paints ----------
  if (M.finfix) {
    try {
      const POOL = [];
      for (let i = 0; i < 512; i++) POOL.push({ k: 'blood', x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, size: 0.04, col: 0, life: 0, mat: 'flesh', tex: null, rot: 0, vr: 0, w: 0.16, h: 0.16, rest: false, bleed: 0, fade: 1, sub: null, max: 0, sz: 0, _free: 1 });
      let cursor = 0;
      function inList(o) {
        const ps = G && G.particles; if (!ps) return false;
        for (let i = 0; i < ps.length; i++) if (ps[i] === o) return true;
        return false;
      }
      function grab() {
        for (let n = 0; n < 512; n++) {
          const o = POOL[(cursor++) & 511];
          if ((o._free || o.life <= 0) && !inList(o)) { o._free = 0; M.n.pool++; return o; }
        }
        return null;
      }
      function fill(o, src) {
        o.k = src.k; o.x = src.x; o.y = src.y; o.z = src.z;
        o.vx = src.vx || 0; o.vy = src.vy || 0; o.vz = src.vz || 0;
        o.size = src.size || 0.04; o.col = src.col || 0; o.life = src.life;
        o.mat = src.mat || 'flesh'; o.tex = src.tex || null; o.rot = src.rot || 0; o.vr = src.vr || 0;
        o.w = src.w || 0.16; o.h = src.h || 0.16; o.rest = !!src.rest; o.bleed = src.bleed || 0;
        o.fade = src.fade === undefined ? 1 : src.fade; o.sub = src.sub || null;
        o.max = src.max || 0; o.sz = src.sz || 0; o._free = 0;
        return o;
      }
      const _ap = addP;
      addP = function (p) {
        if (!M.finfix || !p) return _ap.apply(this, arguments);
        if (p._free === 0 && POOL.indexOf(p) >= 0) return _ap.apply(this, arguments);
        const o = grab();
        if (!o) return _ap.apply(this, arguments);
        return _ap.call(this, fill(o, p));
      };
      if (typeof spray === 'function') {
        const _spray = spray;
        spray = function (x, y, z, dx, dy, dz, n, spd, spread, mat, big) {
          if (!M.finfix) return _spray.apply(this, arguments);
          if (mat === undefined) mat = 'flesh';
          if (big === undefined) big = 1;
          const cols = (typeof MAT !== 'undefined' && (MAT[mat] || MAT.flesh)) || [0];
          for (let i = 0; i < n; i++) {
            const s = spd * rand(0.35, 1.25);
            const a = Math.atan2(dy, dx) + rand(-spread, spread);
            const hl = Math.hypot(dx, dy);
            const up = dz + rand(-spread, spread) * 0.8;
            const o = grab() || { k: 'blood', vx: 0, vy: 0, vz: 0, size: 0.04, col: 0, life: 1, mat: 'flesh', tex: null, rot: 0, vr: 0, w: 0.16, h: 0.16, rest: false, bleed: 0, fade: 1, sub: null, max: 0, sz: 0, _free: 0 };
            o.k = mat === 'ecto' ? 'ecto' : 'blood';
            o.x = x + rand(-0.05, 0.05); o.y = y + rand(-0.05, 0.05); o.z = z + rand(-0.08, 0.08);
            o.vx = Math.cos(a) * s * (hl > 0.01 ? 1 : rand(0, 1));
            o.vy = Math.sin(a) * s * (hl > 0.01 ? 1 : rand(0, 1));
            o.vz = up * s + rand(0, 2.2);
            o.size = rand(0.025, 0.07) * big; o.col = cols[(Math.random() * cols.length) | 0];
            o.life = rand(1.2, 2.4); o.mat = mat; o.tex = null; o.rest = false; o.bleed = 0; o.fade = 1; o._free = 0;
            _ap(o);
          }
        };
      }
      if (typeof gibs === 'function') {
        const _gibs = gibs;
        gibs = function (x, y, z, n, mat, power) {
          if (!M.finfix) return _gibs.apply(this, arguments);
          if (mat === undefined) mat = 'flesh';
          if (power === undefined) power = 1;
          for (let i = 0; i < n; i++) {
            const a = rand(0, TAU), s = rand(1.5, 4.5) * power;
            const tex = mat === 'stone' ? (Math.random() < 0.8 ? 'gibstone' : 'gibbone') : mat === 'bone' || (mat === 'flesh' && Math.random() < 0.2) ? 'gibbone' : mat === 'ecto' ? null : 'gib' + ((Math.random() * 4) | 0);
            const o = grab() || { k: 'gib', x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, size: 0.09, col: 0, life: 1, mat: 'flesh', tex: null, rot: 0, vr: 0, w: 0.16, h: 0.16, rest: false, bleed: 0, fade: 1, sub: null, max: 0, sz: 0, _free: 0 };
            if (!tex) {
              o.k = 'ecto'; o.x = x; o.y = y; o.z = z; o.vx = Math.cos(a) * s; o.vy = Math.sin(a) * s; o.vz = rand(1, 4);
              o.size = 0.09; o.col = (MAT.ecto && MAT.ecto[i % 5]) || 0; o.life = 1.5; o.mat = mat; o.tex = null; o.rest = false; o.bleed = 0; o.fade = 1; o._free = 0;
              _ap(o); continue;
            }
            o.k = 'gib'; o.tex = tex; o.x = x; o.y = y; o.z = z + rand(-0.2, 0.2);
            o.vx = Math.cos(a) * s; o.vy = Math.sin(a) * s; o.vz = rand(2, 6) * power;
            o.rot = rand(0, TAU); o.vr = rand(-15, 15); o.w = rand(0.13, 0.22); o.h = o.w;
            o.life = 30; o.rest = false; o.mat = mat; o.bleed = mat !== 'bone' ? 1.2 : 0; o.fade = 1; o.size = 0.09; o._free = 0;
            _ap(o);
          }
        };
      }
      // pre-warm finisher SFX so the first impact does not decode or build nodes mid-frame
      function warmSFX() {
        if (M._sfxw || !window.SFX || !SFX.ctx) return;
        M._sfxw = 1;
        try {
          const names = ['glint', 'finisher', 'heavy', 'gib'];
          const last = SFX.last || {};
          const hold = {};
          for (let i = 0; i < names.length; i++) {
            const n = names[i];
            hold[n] = last[n];
            try { SFX.play(n, 0.0001); } catch (e) {}
          }
          for (let i = 0; i < names.length; i++) last[names[i]] = hold[names[i]] || -99;
        } catch (e) { fail('sfxw', e); }
      }
      try { warmSFX(); } catch (e) {}
      if (typeof startFinisher === 'function') {
        const _sf = startFinisher;
        startFinisher = function (e) {
          try { warmSFX(); } catch (err) {}
          return _sf.apply(this, arguments);
        };
      }
      if (typeof updateParticles === 'function') {
        const _upp = updateParticles;
        updateParticles = function (dt) {
          const r = _upp.apply(this, arguments);
          try {
            if (M.finfix && G && G.particles) {
              const ps = G.particles;
              for (let i = 0; i < POOL.length; i++) {
                const o = POOL[i];
                if (!o._free && o.life <= 0) o._free = 1;
              }
            }
          } catch (e) { fail('finpool', e); }
          return r;
        };
      }
      // defer the 8 wallSplatNear calls over the next few frames so the impact frame stays light
      const wallQ = [];
      if (typeof wallSplatNear === 'function') {
        const _ws = wallSplatNear;
        wallSplatNear = function (x, y, z) {
          if (M.finfix && G.finisher) { wallQ.push(x, y, z); return; }
          return _ws.apply(this, arguments);
        };
        const _uf = updateFinisher;
        updateFinisher = function (dt) {
          const r = _uf.apply(this, arguments);
          try {
            if (M.finfix && wallQ.length) {
              const n = Math.min(wallQ.length, 9);
              for (let i = 0; i < n; i += 3) _ws(wallQ[i], wallQ[i + 1], wallQ[i + 2]);
              wallQ.splice(0, n);
              M.n.fin++;
            }
          } catch (e) { fail('wallq', e); }
          return r;
        };
      }
      if (typeof frameInner === 'function') {
        const _fi = frameInner;
        frameInner = function () {
          const r = _fi.apply(this, arguments);
          try {
            if (M.finfix && !M._pwfx && G && G.state === 'play' && typeof startFinisher === 'function' && typeof makeEnemy === 'function') {
              M._pwfx = 1;
              warmSFX();
              const n0 = G.particles.length, sb = G.screenBlood.length, px = P.x, py = P.y, ang = P.ang;
              const holdE = G.enemies.slice(), holdT = (G.toasts && G.toasts.slice()) || [];
              try {
                P.x = -80; P.y = -80;
                const e = makeEnemy('skeleton', -79, -80);
                e.awake = true; e.hp = e.maxhp = 20; e.hidden = true; e.noShards = 1;
                startFinisher(e);
                if (typeof updateFinisher === 'function') {
                  for (let i = 0; i < 24; i++) { updateFinisher(0.05); if (typeof updateParticles === 'function') updateParticles(0.05); }
                }
              } catch (e2) { fail('pwfx2', e2); }
              G.finisher = null; G.slow = 0; G.hitstop = 0; G.zoom = 0; G.shake = 0;
              P.x = px; P.y = py; P.ang = ang;
              G.enemies = holdE; if (G.toasts) G.toasts.length = 0;
              if (G.particles.length > n0) G.particles.length = n0;
              if (G.screenBlood && G.screenBlood.length > sb) G.screenBlood.length = sb;
            }
          } catch (e) { fail('pwfx', e); }
          return r;
        };
      }
    } catch (e) { fail('finfix', e); }
  }

  // ---------- chainstat + lockfix: world-locked, no-billboard chains and door locks ----------
  if ((M.chainstat || M.lockfix) && typeof drawSprites === 'function') {
    try {
      const HUNG = { h_chain: 1, a_chain: 1, m20i_hchain: 1, m20j_chain: 1 };
      const LOCK = { m20_chains: 1 };
      const QN = 16;
      const qn = v => Math.round(v * QN) / QN;
      function solidD(x, y, dx, dy) {
        for (let d = 0.2; d <= 1.4; d += 0.15) {
          const c = (typeof cellAt === 'function') ? cellAt(x + dx * d, y + dy * d) : -1;
          if (c >= 0 && typeof SOLID !== 'undefined' && SOLID[c]) return d;
        }
        return 99;
      }
      // Face the doorway opening, not the nearest side jamb (that drew the lock edge-on).
      function yawOfLock(s) {
        if (s._yaw != null) return s._yaw;
        const e = solidD(s.x, s.y, 1, 0), w = solidD(s.x, s.y, -1, 0);
        const n = solidD(s.x, s.y, 0, 1), s_ = solidD(s.x, s.y, 0, -1);
        // Face the more-open axis (the doorway), not the nearest jamb.
        const xClear = Math.min(e, w), yClear = Math.min(n, s_);
        const yaw = (xClear >= yClear) ? 0 : Math.PI / 2;
        s._yaw = yaw;
        return yaw;
      }
      function blitFlat(cam, s, isLock, yaw, zBias) {
        const tex = Engine.tex && Engine.tex[s.tex]; if (!tex || typeof PIX === 'undefined' || typeof ZB === 'undefined') return;
        const td = tex.d, tw = tex.w, th = tex.h;
        if (s._fx == null) { s._fx = qn(s.x); s._fy = qn(s.y); s._fz = qn(s.z); }
        let wx = s._fx, wy = s._fy, z0 = s._fz, z1 = z0 + (isLock ? 0.85 : 1.05);
        if (isLock) { z0 = qn(s.z - 0.45); z1 = z0 + 0.85; }
        if (isLock) {
          const e = solidD(s.x, s.y, 1, 0), w = solidD(s.x, s.y, -1, 0);
          const n = solidD(s.x, s.y, 0, 1), s_ = solidD(s.x, s.y, 0, -1);
          if (yaw === 0 || yaw === Math.PI) {
            if (e <= w) wx = qn(s.x + e - 0.05); else wx = qn(s.x - w + 0.05);
          } else {
            if (n <= s_) wy = qn(s.y + n - 0.05); else wy = qn(s.y - s_ + 0.05);
          }
        }
        const tx = -Math.sin(yaw), ty = Math.cos(yaw);
        const hw = isLock ? 0.38 : 0.08;
        const ax = wx - tx * hw, ay = wy - ty * hw, bx = wx + tx * hw, by = wy + ty * hw;
        // Snap the camera relative to the plane so sub-pixel (e.g. 6mm) strafe does not move it.
        const qcam = v => Math.round(v * 16) / 16;
        const cax = wx - qcam(wx - cam.x), cay = wy - qcam(wy - cam.y);
        const dx = Math.cos(cam.ang), dy = Math.sin(cam.ang);
        const eye = cam.eye;
        const hor = EH / 2 + cam.pitch;
        function proj(x, y) {
          const rx = x - cax, ry = y - cay;
          return { depth: rx * dx + ry * dy, lat: -rx * dy + ry * dx };
        }
        const L = proj(ax, ay), R = proj(bx, by);
        if (L.depth < 0.12 && R.depth < 0.12) return;
        const dL = Math.max(0.12, L.depth), dR = Math.max(0.12, R.depth);
        const scL = EP / dL, scR = EP / dR;
        let xa = EW / 2 + L.lat * scL, xb = EW / 2 + R.lat * scR;
        let invL = 1 / dL, invR = 1 / dR, uL = 0, uR = tw;
        if (xa > xb) {
          let t;
          t = xa; xa = xb; xb = t;
          t = invL; invL = invR; invR = t;
          t = uL; uL = uR; uR = t;
        }
        const c0 = Math.max(0, Math.ceil(xa - 0.5)), c1 = Math.min(EW, Math.floor(xb + 0.5));
        if (c1 <= c0) return;
        const span = xb - xa || 1;
        const aK = s.alpha === undefined ? 1 : s.alpha;
        if (aK <= 0.02) return;
        const uLd = uL * invL, uRd = uR * invR;
        for (let c = c0; c < c1; c++) {
          const t = (c + 0.5 - xa) / span;
          const inv = invL + (invR - invL) * t; if (inv <= 1e-6) continue;
          const depth = 1 / inv + (zBias || 0);
          if (depth < 0.12) continue;
          const u = Math.max(0, Math.min(tw - 1, ((uLd + (uRd - uLd) * t) / inv) | 0));
          const sc = EP / depth;
          const yt = hor - (z1 - eye) * sc, yb2 = hor - (z0 - eye) * sc;
          const r0 = Math.max(0, Math.ceil(Math.min(yt, yb2) - 0.5));
          const r1 = Math.min(EH, Math.floor(Math.max(yt, yb2) + 0.5));
          const rh = (r1 - r0) || 1;
          for (let r = r0; r < r1; r++) {
            const zW = eye + (hor - (r + 0.5)) / sc;
            const v = Math.max(0, Math.min(th - 1, (((z1 - zW) / (z1 - z0 || 1)) * th) | 0));
            const p = td[v * tw + u], a0 = ((p >>> 24) * aK) | 0;
            if (a0 < 10) continue;
            const idx = r * EW + c;
            if (ZB[idx] <= depth) continue;
            let pr = p & 255, pg = (p >> 8) & 255, pb = (p >> 16) & 255;
            if (!isLock) {
              const tn = s.tint;
              if (tn && tn[3]) { const tk = tn[3]; pr = pr + ((tn[0] - pr) * tk) | 0; pg = pg + ((tn[1] - pg) * tk) | 0; pb = pb + ((tn[2] - pb) * tk) | 0; }
            }
            // Opaque write: no compositing over a moving wall/ceiling (that was the leftover shimmer).
            PIX[idx] = 0xff000000 | (pb << 16) | (pg << 8) | pr;
            ZB[idx] = depth;
          }
        }
        if (isLock) M.n.lock++; else M.n.chain++;
      }
      if (typeof collectSprites === 'function') {
        const _cs = collectSprites;
        collectSprites = function (cam) {
          const S = _cs.apply(this, arguments);
          try {
            if (M.chainstat || M.lockfix) {
              for (let i = 0; i < S.length; i++) {
                const s = S[i], tn = s.tex;
                if (M.chainstat && HUNG[tn]) {
                  s.w = 0.18; s.h = 1.05; s.wave = 0; s.rot = 0;
                  if (s.alpha < 0.7) s.alpha = 0.9;
                }
                if (M.lockfix && LOCK[tn]) { s.w = 0.9; s.h = 0.9; s.wave = 0; s.rot = 0; }
              }
            }
          } catch (e) { fail('cs', e); }
          return S;
        };
      }
      const _ds = drawSprites;
      drawSprites = function (cam, S) {
        if (!(M.chainstat || M.lockfix) || !S || !S.length) return _ds.apply(this, arguments);
        const keep = [], ov = [];
        for (let i = 0; i < S.length; i++) {
          const s = S[i], tn = s.tex;
          if (M.chainstat && HUNG[tn]) { s.wave = 0; s.rot = 0; ov.push(s); continue; }
          if (M.lockfix && LOCK[tn]) { s.wave = 0; s.rot = 0; ov.push(s); continue; }
          keep.push(s);
        }
        const r = _ds.call(this, cam, keep);
        try {
          for (let i = 0; i < ov.length; i++) {
            const s = ov[i];
            if (LOCK[s.tex]) blitFlat(cam, s, true, yawOfLock(s));
            else { blitFlat(cam, s, false, 0, 0); blitFlat(cam, s, false, Math.PI / 2, 0.002); }
          }
        } catch (e) { fail('flat', e); }
        return r;
      };
    } catch (e) { fail('chainstat', e); }
  }

})();
