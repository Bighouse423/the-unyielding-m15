// ===== m19.5 gfx2: world-only lighting overlays (?gfx2=0 or ?m195=0 = off). Runs on PIX after the post chain,
// BEFORE ctxLow.putImageData, so viewmodel / hands / weapon fx (drawn later onto ctxLow) are never touched.
//  L2 (full): depth fog with an auto-sampled stage-tinted fog colour, ceiling gloom, warm floor pool,
//             weapon-coloured dynamic light on the near world (flame sword = warm flicker, frost = cyan, void = violet ...)
//  L1 (lite): depth fog + ceiling gloom only
//  L0: off.  Level comes from the m19.5 governor (M195.gfx2Level), so it drops out first when frames run long.
(function () {
  const M = window.M195; if (!M || !M.gfx2 || typeof postFX !== 'function') return;
  try {
    const S = M.gfxState = { ms: 0, fog: [26, 14, 34], lit: 0, n: 0, err: null };
    // weapon light colours (r,g,b,strength). Swords not listed cast no light.
    const WL = { fire: [255, 128, 44, 1.0], frost: [110, 200, 255, 0.7], storm: [150, 175, 255, 0.7], void: [176, 90, 255, 0.75],
      crimson: [255, 70, 60, 0.45], ruby: [255, 70, 90, 0.45], skull: [140, 255, 150, 0.45] };
    const FOGT = new Uint16Array(512);      // depth*16 -> fog weight 0..256
    function buildFog(D0, D1, KM) { for (let i = 0; i < 512; i++) { const d = i / 16; let k = (d - D0) / (D1 - D0); k = k < 0 ? 0 : k > 1 ? 1 : k; FOGT[i] = Math.round(256 * KM * k * k * (3 - 2 * k)); } }
    buildFog(2.0, 19, 0.6); S.buildFog = buildFog;
    const LITT = new Uint16Array(64);       // depth*16 -> weapon light weight 0..256 (0..4 cells)
    for (let i = 0; i < 64; i++) { const d = i / 16; const k = Math.max(0, 1 - d / 4); LITT[i] = Math.round(256 * k * k); }
    S.WL = WL; S.LITT = LITT;   // m21art hook: expose weapon-light tables (read/tuned by js/m21art.js)
    let latK = null, rowK = null, rowKH = 0, rowKP = 1e9;
    function rows(hor) {   // per-row multiplier (0..256): ceiling gloom above the horizon
      if (!rowK || rowK.length !== EH) rowK = new Uint16Array(EH);
      if (hor === rowKH && EH === rowKP) return rowK; rowKH = hor; rowKP = EH;
      for (let y = 0; y < EH; y++) { const t = (hor - y) / EH; rowK[y] = t > 0 ? Math.round(256 * (1 - Math.min(0.32, t * 0.75))) : 256; }
      return rowK;
    }
    function sampleFog() {   // average colour of far, non-sky pixels -> darkened fog tint
      let r = 0, g = 0, b = 0, n = 0;
      const st = 7 * RK;
      for (let y = 3; y < EH; y += st) for (let x = 3; x < EW; x += st) { const i = y * EW + x, d = ZB[i]; if (d < 5 || d > 1e8) continue; const q = PIX[i]; r += q & 255; g += (q >> 8) & 255; b += (q >> 16) & 255; n++; }
      if (n < 12) return;
      r /= n; g /= n; b /= n;
      const F = S.fog, tr = 20 + r * 0.5, tg = 10 + g * 0.4, tb = 34 + b * 0.55;   // dark, a touch violet
      F[0] += (tr - F[0]) * 0.2; F[1] += (tg - F[1]) * 0.2; F[2] += (tb - F[2]) * 0.2;
    }
    function pass(L) {
      const N = EW * EH, hor = Math.round(EH / 2 + (typeof cam !== 'undefined' ? cam.pitch * RK : 0));
      if ((S.n++ & 31) === 0) sampleFog();
      const fr = S.fog[0] | 0, fg = S.fog[1] | 0, fb = S.fog[2] | 0;
      const rk = rows(hor);
      // weapon light
      let lr = 0, lg = 0, lb = 0, lon = false;
      if (L >= 2 && typeof G !== 'undefined' && (G.state === 'play' || G.state === 'altar') && typeof P !== 'undefined' && P.wpn) {
        const w = WL[P.wpn.sword];
        if (w) {
          const t = G.t || 0, fl = 0.82 + 0.12 * Math.sin(t * 17.3) + 0.06 * Math.sin(t * 41.7 + 1.3);
          const sw = P.sw ? 1.35 : 1; const k = w[3] * fl * sw * 0.8;
          lr = w[0] * k | 0; lg = w[1] * k | 0; lb = w[2] * k | 0; lon = true;
        }
      }
      S.lit = lon ? 1 : 0;
      if (!latK || latK.length !== EW) { latK = new Uint16Array(EW); for (let x = 0; x < EW; x++) { const u = x / EW; latK[x] = Math.round(256 * (0.55 + 0.45 * Math.min(1, Math.max(0, (u - 0.15) / 0.6)))); } }
      for (let y = 0, i = 0; y < EH; y++) {
        const rm = rk[y];
        for (let x = 0; x < EW; x++, i++) {
          const d = ZB[i]; if (d > 1e8) continue;   // sky: m18sky / m195sky own it
          const q = PIX[i]; let r = q & 255, g = (q >> 8) & 255, b = (q >> 16) & 255;
          if (lon && d < 4) {   // near world picks up the weapon's colour (multiplicative + a little additive)
            const lk = LITT[(d * 16) | 0] * latK[x] >> 8;
            r += ((r * lr >> 8) + (lr >> 3)) * lk >> 8; g += ((g * lg >> 8) + (lg >> 3)) * lk >> 8; b += ((b * lb >> 8) + (lb >> 3)) * lk >> 8;
            if (r > 255) r = 255; if (g > 255) g = 255; if (b > 255) b = 255;
          }
          if (rm !== 256) { r = r * rm >> 8; g = g * rm >> 8; b = b * rm >> 8; }
          const di = (d * 16) | 0; let fk = FOGT[di > 511 ? 511 : di];
          if (fk) {
            // lights / emissives punch through the fog (torches, windows, runes keep their glow)
            const mx = r > g ? (r > b ? r : b) : (g > b ? g : b);
            if (mx > 150) { const hot = (mx - 150) * 2.4; fk = hot >= 255 ? 0 : fk * (255 - hot) >> 8; } r += (fr - r) * fk >> 8; g += (fg - g) * fk >> 8; b += (fb - b) * fk >> 8; }
          PIX[i] = 0xff000000 | (b << 16) | (g << 8) | r;
        }
      }
    }
    const _pf = postFX;
    postFX = function () {
      const r = _pf.apply(this, arguments);
      const L = M.gfx2Level == null ? 2 : M.gfx2Level;
      if (L > 0 && FX.on && !S.err) {
        const a = performance.now();
        try { pass(L); } catch (e) { S.err = String(e); M.fail('gfx2', e); }
        S.ms = S.ms * 0.9 + (performance.now() - a) * 0.1;
      }
      return r;
    };
  } catch (e) { M.fail('gfx2', e); }
})();
