// ===== m21v: fresh-eyes grade against the Grok concept art.
// LUT / haze only, applied in postFX before the viewmodel, so hands and weapon pixels stay locked.
// Nave walls lean cooler like concept2/21 (grey-purple stone, gold torch light stays).
// Blood Arena drops the neon magenta midtones toward the dark blood-stone of concept2/25.
// Chapel / ossuary / cathedral / kennels get a lighter version of the same magenta tame.
// Kill: ?m21v=0 / ?m21=0 | ?grade=0
(function () {
  const Q = new URLSearchParams(location.search);
  const off = Q.get('m21v') === '0' || Q.get('m21') === '0';
  const on = k => !off && Q.get(k) !== '0';
  const M = window.M21V = {
    on: !off, grade: on('grade'),
    n: { lut: 0, theme: 0 }, err: [], ready: 0, theme: null
  };
  function fail(tag, e) { M.err.push(tag + ': ' + (e && e.message ? e.message : e)); }
  M.st = () => ({ on: M.on, grade: M.grade, theme: M.theme, hooked: M.hooked(), n: Object.assign({}, M.n), err: M.err.slice() });
  M.hooked = function () { return !!(typeof buildLUT === 'function' && buildLUT._m21v); };
  if (off) { M.ready = 1; return; }

  // Extra grade on top of m21art. Numbers are small on purpose.
  const TWEAK = {
    nave:      { mg: 0.06, ds: 0.08, sh: [-0.012, 0.000, 0.022], hi: [0.010, 0.006, -0.010], coolOrange: 0.20 },
    hub:       { mg: 0.14, ds: 0.10, sh: [0.000, -0.006, 0.018], hi: [0.018, 0.014, -0.006] },
    arena:     { mg: 0.28, ds: 0.34, sh: [0.032, -0.018, -0.024], hi: [0.018, 0.000, -0.020], dark: 0.06 },
    ossuary:   { mg: 0.10, ds: 0.08, sh: [0.012, -0.010, -0.010] },
    cathedral: { mg: 0.06, ds: 0.05, sh: [-0.006, 0.000, 0.016], hi: [0.010, 0.012, 0.010] },
    kennels:   { mg: 0.10, ds: 0.08, sh: [0.018, -0.010, -0.014] }
  };

  function themeKey() {
    try {
      if (typeof RUN !== 'undefined' && RUN.hub) return 'hub';
      if (window.ART && ART.theme) return ART.theme;
      if (window.M11 && M11.L2 && M11.L2.themeKey) return M11.L2.themeKey();
      if (typeof RUN !== 'undefined' && RUN.cfg && RUN.cfg.theme) return RUN.cfg.theme;
    } catch (e) { }
    return 'nave';
  }

  function extraGrade(L, tw) {
    if (!L || !tw) return;
    const SH = tw.sh || [0, 0, 0], HI = tw.hi || [0, 0, 0];
    const ds = tw.ds || 0, mg = tw.mg || 0, cool = tw.coolOrange || 0, dark = tw.dark || 0;
    for (let i = 0; i < L.length; i++) {
      const q = L[i];
      let r = (q & 255) / 255, g = ((q >> 8) & 255) / 255, b = ((q >> 16) & 255) / 255;
      const l = 0.299 * r + 0.587 * g + 0.114 * b;
      const mx = r > g ? (r > b ? r : b) : (g > b ? g : b);
      const mn = r < g ? (r < b ? r : b) : (g < b ? g : b);
      const sat = mx > 0 ? (mx - mn) / mx : 0;
      const mid = 4 * l * (1 - l);
      if (ds) {
        const k = ds * mid * sat * sat;
        r += (l - r) * k; g += (l - g) * k; b += (l - b) * k;
      }
      if (mg) {
        const mb = Math.min(r, b) - g;
        if (mb > 0) {
          const mk = mg * mid * Math.min(1, mb * 5);
          r += (l - r) * mk; b += (l - b) * mk * 0.85; g += (l - g) * mk * 0.15;
        }
      }
      // concept 21: grey-purple stone, not orange brick. Torch highlights (high luma) stay warm.
      if (cool && r > g + 0.04 && r > b + 0.04 && l < 0.72) {
        const k = cool * mid * Math.min(1, (r - Math.max(g, b)) * 4);
        r -= k * 0.55; b += k * 0.18; g += k * 0.04;
      }
      if (dark) {
        const k = dark * (1 - l);
        r -= k * 0.55; g -= k * 0.55; b -= k * 0.45;
      }
      const sh = (1 - l) * (1 - l), hi = l * l;
      r += SH[0] * sh + HI[0] * hi;
      g += SH[1] * sh + HI[1] * hi;
      b += SH[2] * sh + HI[2] * hi;
      L[i] = 0xff000000 |
        (Math.max(0, Math.min(255, b * 255)) << 16) |
        (Math.max(0, Math.min(255, g * 255)) << 8) |
        Math.max(0, Math.min(255, r * 255));
    }
  }

  let lastKey = null, lastGrd = undefined, grading = false;

  function applyNow() {
    if (!M.grade || typeof FX === 'undefined' || !FX.lut) return;
    const k = themeKey();
    M.theme = k;
    extraGrade(FX.lut, TWEAK[k]);
    M.n.lut++;
  }

  function restyle() {
    if (grading) return;
    const k = themeKey();
    if (k === lastKey) return;
    lastKey = k;
    M.theme = k;
    M.n.theme++;
    grading = true;
    try { if (typeof buildLUT === 'function') buildLUT(lastGrd); }
    catch (e) { fail('regrade', e); }
    finally { grading = false; }
  }

  function keepFlags(dst, src) {
    try { for (const k of Object.keys(src)) if (k.charAt(0) === '_') dst[k] = src[k]; } catch (e) { }
  }
  function hook() {
    if (typeof buildLUT === 'function' && !buildLUT._m21v) {
      const _lut = buildLUT;
      buildLUT = function (grd) {
        lastGrd = arguments.length ? grd : undefined;
        const r = _lut.apply(this, arguments);
        try { if (!grading) lastKey = themeKey(); applyNow(); }
        catch (e) { fail('lut', e); }
        return r;
      };
      keepFlags(buildLUT, _lut);
      buildLUT._m21v = 1;
    }
    if (typeof applyTheme === 'function' && !applyTheme._m21v) {
      const _ap = applyTheme;
      applyTheme = function () {
        const r = _ap.apply(this, arguments);
        try { lastKey = null; restyle(); } catch (e) { fail('theme', e); }
        return r;
      };
      keepFlags(applyTheme, _ap);
      applyTheme._m21v = 1;
    }
    if (typeof render === 'function' && !render._m21v) {
      const _r = render;
      render = function () {
        try { restyle(); } catch (e) { }
        return _r.apply(this, arguments);
      };
      keepFlags(render, _r);
      render._m21v = 1;
    }
  }

  try { hook(); } catch (e) { fail('hook', e); }
  M.ready = 1;
  [0, 800, 2000].forEach(function (t) {
    setTimeout(function () { try { hook(); M.ready = 1; } catch (e) { fail('late', e); } }, t);
  });
})();
