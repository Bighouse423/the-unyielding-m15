// ===== m20m: HD lighting / present fix (t238u). Unlock-all rides along (?unlockall=1). =====
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
// Kill switches: ?m20m=0 (all; also ?m20=0) | ?hdfix=0 | ?lmap=0 | ?hdkeep=0
(function () {
  const Q = location.search, off = /[?&](m20m|m20)=0/.test(Q), fl = n => !off && !new RegExp('[?&]' + n + '=0').test(Q);
  const M = window.M20M = {
    on: !off, hdfix: fl('hdfix'), lmap: fl('lmap') && fl('hdfix'), hdkeep: fl('hdkeep'),
    n: { blit: 0, keep: 0, lmap: 0 }, err: []
  };
  const fail = (w, e) => { if (M.err.length < 12) M.err.push(w + ': ' + (e && e.message || e)); };
  M.st = () => ({ on: M.on, hdfix: M.hdfix, lmap: M.lmap, hdkeep: M.hdkeep, n: M.n, err: M.err, rk: typeof RK !== 'undefined' ? RK : 1 });
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
})();
