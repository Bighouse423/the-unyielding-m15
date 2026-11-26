// ===== m19.5 sky: the m18 sky rebuilt a few rows per frame instead of all at once every 3rd frame (that spike was
// a steady judder). Same pixels as m18 (same time sample per rebuild), shown one rebuild later (~50 ms).
// gfx2 (?sky2=0 / ?gfx2=0 off) adds a distant per-stage silhouette band (spires / dead trees / ridges) with lit
// windows, a soft moon glow and silver cloud rims near the moon. ?perf2=0 restores the m18 tick.
// m20 merge note: this file only talks to m18sky through M18.skyState hooks (tickHook, paintBase, rec).
(function () {
  const M = window.M195; if (!M || !M.on) return;
  const SK = window.M18 && M18.skyState; if (!SK || !SK.paintBase) return;
  if (!M.perf2) return;
  const W = 512, H = SK.H || 128, OY = SK.OY || 0;   // m20: the fixed m18 sky is 256 tall (zenith rows on top)
  const px = (r, g, b, a) => ((a === undefined ? 255 : a) << 24 | (b & 255) << 16 | (g & 255) << 8 | (r & 255)) >>> 0;
  function hash(i) { i |= 0; i = (i ^ 61) ^ (i >>> 16); i = (i + (i << 3)) | 0; i = i ^ (i >>> 4); i = Math.imul(i, 0x27d4eb2d); i = i ^ (i >>> 15); return (i >>> 0) / 4294967296; }
  function noise(x, y, s) {
    const xi = Math.floor(x / s), yi = Math.floor(y / s);
    const fx = (x / s) - xi, fy = (y / s) - yi;
    const a = hash(xi * 13 + yi * 57), b = hash((xi + 1) * 13 + yi * 57);
    const c = hash(xi * 13 + (yi + 1) * 57), d = hash((xi + 1) * 13 + (yi + 1) * 57);
    const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }
  // ---- m18 blitClouds, restricted to rows [y0, y1). Op order per pixel is unchanged, so output is identical.
  function blitRows(out, key, t, quality, y0r, y1r) {
    if (SK.blitRows) {   // m20 merge: use m18sky's own (fixed) row-range blit so clamps / zenith / ribbon aurora carry over
      SK.blitRows(out, key, t, quality, y0r, y1r);
      if (M.sky2 && (M.gfx2Level == null || M.gfx2Level >= 1)) { try { extras(out, key, t, y0r, y1r); } catch (e) { M.fail('sky2', e); } }
      return;
    }
    const src = SK.paintBase(key);
    out.set(src.subarray(y0r * W, y1r * W), y0r * W);
    const fire = /kennels|arena/.test(key);
    const storm = /cathedral|belfry/.test(key);
    const auroraOn = /necropolis|necro2|throne|void2/.test(key);
    const drift = t * (storm ? 14 : fire ? 10 : 7);
    const layers = quality < 1 ? 1 : 2;
    for (let L = 0; L < layers; L++) {
      const sp = L === 0 ? 1 : 0.45, col = fire ? [40, 12, 8] : storm ? [18, 16, 28] : [20, 14, 32];
      const a0 = fire ? 0.55 : 0.4;
      const y0 = 30 + L * 16, y1 = H - 4;
      for (let y = Math.max(y0, y0r); y < Math.min(y1, y1r); y++) {
        for (let x = 0; x < W; x++) {
          const u = (x + drift * sp + L * 80) % W;
          const n = noise(u, y * 1.6 + L * 40, 18 - L * 4);
          const dens = n - 0.5 - (y - y0) / (y1 - y0) * 0.15;
          if (dens <= 0) continue;
          const a = Math.min(0.75, dens * a0 * 2);
          const i = y * W + x, o = out[i], r0 = o & 255, g0 = (o >> 8) & 255, b0 = (o >> 16) & 255;
          out[i] = px(r0 + (col[0] - r0) * a, g0 + (col[1] - g0) * a, b0 + (col[2] - b0) * a);
        }
      }
    }
    if (auroraOn && quality > 0) {
      for (let y = Math.max(10, y0r); y < Math.min(80, y1r); y++) {
        for (let x = 0; x < W; x++) {
          const w = 0.5 + 0.5 * Math.sin((x / W) * 6 + t * 0.3 + y * 0.04);
          const band = Math.sin((x / 40) + t * 0.4 + y * 0.08) * Math.exp(-Math.pow((y - 36) / 28, 2));
          const a = Math.max(0, band * w * 0.45);
          if (a < 0.04) continue;
          const i = y * W + x, o = out[i], r0 = o & 255, g0 = (o >> 8) & 255, b0 = (o >> 16) & 255;
          const c = key === 'throne' || key === 'void2' ? [90, 20, 180] : [30, 200, 140];
          out[i] = px(r0 + (c[0] - r0) * a, g0 + (c[1] - g0) * a, b0 + (c[2] - b0) * a);
        }
      }
    }
    if ((fire || key === 'ossuary') && quality > 0) {
      for (let i = 0; i < 28; i++) {
        const x = ((hash(i * 11) * W) + t * (8 + i % 5) * 3) % W | 0;
        const y = (H - 8 - ((hash(i * 5) * 50 + t * (10 + i % 7)) % 50)) | 0;
        if (y < 0 || y >= H || y < y0r || y >= y1r) continue;
        out[y * W + x] = fire ? px(255, 140, 40) : px(255, 80, 60);
      }
    }
    if (storm) {
      const period = 4.2 + (key === 'cathedral' ? 0 : 1.2);
      const phase = (t % period);
      if (phase < 0.12 || (phase > 0.18 && phase < 0.26)) {
        const flash = phase < 0.12 ? 1 - phase / 0.12 : 1 - (phase - 0.18) / 0.08;
        for (let i = y0r * W; i < y1r * W; i++) {
          const o = out[i], r0 = o & 255, g0 = (o >> 8) & 255, b0 = (o >> 16) & 255;
          out[i] = px(r0 + (220 - r0) * flash * 0.35, g0 + (220 - g0) * flash * 0.4, b0 + (255 - b0) * flash * 0.5);
        }
        if (quality > 0 && phase < 0.1) {
          let x = (hash((t / period) | 0 * 9) * W) | 0, y = 0;
          for (let k = 0; k < 40 && y < H - 10; k++) {
            x = (x + ((hash(((t / period) | 0) * 13 + k) - 0.5) * 8) | 0 + W) % W;
            y += 2 + (hash(k) * 3) | 0;
            if (y >= y0r && y < y1r) {
              if (y < H) out[y * W + x] = px(230, 240, 255);
              if (y < H && x + 1 < W) out[y * W + x + 1] = px(140, 160, 255);
            }
          }
        }
      }
    }
    if (M.sky2 && (M.gfx2Level == null || M.gfx2Level >= 1)) { try { extras(out, key, t, y0r, y1r); } catch (e) { M.fail('sky2', e); } }
  }

  // ---- gfx2: distant silhouettes + moon glow + silver rims (rows near the horizon are the bottom of the texture)
  const SIL = {};
  function silFor(key) {
    if (SIL[key]) return SIL[key];
    const hgt = new Int16Array(W), win = [];
    const kind = /nave|cathedral|belfry|chapel|hub|throne|void2/.test(key) ? 'spires' : /courtyard|necropolis|necro2|crypt|ossuary|bloodmoon/.test(key) ? 'trees' : key === 'abyss' ? 'none' : 'ridge';
    const seed = key.length * 131 + key.charCodeAt(0) * 7;
    for (let x = 0; x < W; x++) {   // rolling ridge base, tiles seamlessly across the 512 wrap
      const a = x / W * Math.PI * 2;
      hgt[x] = Math.round(7 + 3 * Math.sin(a * 2 + seed) + 2 * Math.sin(a * 5 + seed * 0.3) + 1.5 * Math.sin(a * 11 + seed * 0.7));
    }
    if (kind === 'spires') {
      for (let k = 0; k < 9; k++) {
        const cx = (hash(seed + k * 17) * W) | 0, w = 6 + (hash(seed + k * 5) * 10) | 0, top = 16 + (hash(seed + k * 3) * 16) | 0;
        for (let dx = -w; dx <= w; dx++) { const x = (cx + dx + W) % W; const roof = top - Math.abs(dx) * (top > 26 ? 0.4 : 0.15); hgt[x] = Math.max(hgt[x], Math.round(Math.max(10, roof * (Math.abs(dx) < w * 0.7 ? 1 : 0.75)))); }
        const sp = (cx + W) % W; for (let dy = 0; dy < 12; dy++) hgt[sp] = Math.max(hgt[sp], top + 11 - ((dy / 3) | 0));   // needle spire
        for (let j = 0; j < 3; j++) win.push([(cx + ((hash(seed + k * 29 + j) - 0.5) * w * 1.2) | 0 + W) % W, 6 + (hash(seed + k * 31 + j) * (top - 12)) | 0, hash(seed + k + j * 7)]);
      }
    } else if (kind === 'trees') {
      for (let k = 0; k < 26; k++) {
        const cx = (hash(seed + k * 23) * W) | 0, h = 10 + (hash(seed + k * 9) * 14) | 0;
        for (let dy = 0; dy < h; dy++) { const x = cx % W; hgt[x] = Math.max(hgt[x], dy); if (dy > h * 0.45 && hash(seed + k * 3 + dy) > 0.55) { const br = 1 + (hash(dy + k) * 4) | 0, dir = hash(dy * 3 + k) > 0.5 ? 1 : -1; for (let b = 1; b <= br; b++) { const bx = (x + dir * b + W) % W; hgt[bx] = Math.max(hgt[bx], dy + (b >> 1)); } } }
      }
      for (let k = 0; k < 14; k++) { const cx = (hash(seed + k * 41) * W) | 0; for (let dx = -1; dx <= 1; dx++) { const x = (cx + dx + W) % W; hgt[x] = Math.max(hgt[x], hgt[x] + (dx === 0 ? 4 : 2)); } }   // grave crosses / stones
    } else if (kind === 'ridge') {
      for (let x = 0; x < W; x++) { const a = x / W * Math.PI * 2; hgt[x] = Math.round(hgt[x] + 6 + 5 * Math.abs(Math.sin(a * 3 + seed))); }
    }
    if (kind === 'none') hgt.fill(0);
    return (SIL[key] = { hgt, win, kind });
  }
  const pal = k => (/arena|kennels/.test(k) ? [255, 120, 40] : /ossuary|bloodmoon/.test(k) ? [255, 60, 70] : /necro|crypt/.test(k) ? [80, 255, 170] : /throne|void|abyss/.test(k) ? [170, 90, 255] : [255, 190, 110]);
  function extras(out, key, t, y0r, y1r) {
    const S = silFor(key); if (S.kind === 'none') return;
    const lc = pal(key), base = H - 1;   // texture bottom row = horizon side
    // moon glow + silver rims: soft wide glow around the m18 moon disc
    if (/nave|courtyard|ossuary|bloodmoon|chapel|hub/.test(key)) {
      const blood = /ossuary|bloodmoon/.test(key), cx = blood ? 360 : 300, cy = (blood ? 44 : 36) + OY, R = blood ? 70 : 58;
      const gc = blood ? [150, 20, 30] : [120, 110, 170];
      for (let y = Math.max(y0r, cy - R); y < Math.min(y1r, cy + R); y++) for (let x = cx - R; x < cx + R; x++) {
        const dx = x - cx, dy = (y - cy) * 1.1, d = Math.sqrt(dx * dx + dy * dy); if (d > R || d < (blood ? 24 : 18)) continue;
        const k = Math.pow(1 - d / R, 2.2) * 0.22, i = y * W + ((x + W) % W), o = out[i], r0 = o & 255, g0 = (o >> 8) & 255, b0 = (o >> 16) & 255;
        const lum = (r0 + g0 + b0) / 3, rim = lum < 40 ? 1.6 : 1;   // darker cloud pixels catch a silver edge
        out[i] = px(Math.min(255, r0 + (gc[0] - r0 * 0.3) * k * rim), Math.min(255, g0 + (gc[1] - g0 * 0.3) * k * rim), Math.min(255, b0 + (gc[2] - b0 * 0.3) * k * rim));
      }
    }
    // horizon haze + silhouette band
    for (let y = Math.max(y0r, base - 44); y < y1r; y++) {
      const hy = base - y;   // height above the horizon row
      for (let x = 0; x < W; x++) {
        const i = y * W + x, o = out[i]; let r0 = o & 255, g0 = (o >> 8) & 255, b0 = (o >> 16) & 255;
        const hz = Math.max(0, 1 - hy / 44) * 0.18; r0 += (lc[0] * 0.35 - r0) * hz; g0 += (lc[1] * 0.25 - g0) * hz; b0 += (lc[2] * 0.3 - b0) * hz;   // warm horizon haze
        if (hy < S.hgt[x]) {   // silhouette: near-black, cool top edge, faint fog toward the base
          const edge = hy >= S.hgt[x] - 1, fog = Math.max(0, 1 - hy / 10) * 0.25;
          const k = edge ? 0.55 : 0.22; r0 = r0 * k + 4 + fog * lc[0] * 0.2; g0 = g0 * k + 3 + fog * lc[1] * 0.15; b0 = b0 * k + 8 + fog * lc[2] * 0.2;
        }
        out[i] = px(Math.min(255, r0), Math.min(255, g0), Math.min(255, b0));
      }
    }
    for (const w of S.win) {   // lit windows, slow candle flicker
      const y = base - w[1]; if (y < y0r || y >= y1r || w[1] >= S.hgt[w[0]]) continue;
      const fl = 0.7 + 0.3 * Math.sin(t * (1.3 + w[2]) + w[2] * 9);
      out[y * W + w[0]] = px(lc[0] * fl, lc[1] * fl, lc[2] * fl * 0.8);
    }
  }

  // ---- amortized tick: one rebuild spread over `every` frames, double buffered per stage key
  const BUF = {}, TEX = {};
  let job = null;
  const SKST = M.skyState = { on: true, rebuilds: 0, rowsLast: 0, key: '', blitRows: (o, k, t, q, a, b) => blitRows(o, k, t, q, a, b) };
  const mk = key => { if (!BUF[key]) { BUF[key] = [new Uint32Array(W * H), new Uint32Array(W * H)]; TEX[key] = [{ w: W, h: H, d: BUF[key][0] }, { w: W, h: H, d: BUF[key][1] }]; BUF[key].front = 0; } return BUF[key]; };
  function params() {
    const q = (typeof GFX !== 'undefined' && GFX.q != null) ? GFX.q : 2;
    const slow = (typeof GFX !== 'undefined' && (GFX.hdOff || GFX.ms > 20));
    return { q: slow ? 0 : q, every: q < 1 || slow ? 8 : q < 2 ? 4 : 3 };
  }
  SK.tickHook = function () {
    if (typeof G === 'undefined' || (G.state !== 'play' && G.state !== 'pause')) return;
    if (!M.perf2) { SK.tick(); return; }   // sky2 extras ride on the amortized path only
    const key = SK.rec(), b = mk(key), t = (G.t || 0);
    const pr = params();
    if (!job || job.key !== key) {
      if (SKST.key !== key) {   // new stage/boss sky: build the first frame at once, like m18
        blitRows(b[b.front], key, t, pr.q, 0, H); SKST.key = key; SK.key = key;
      }
      job = { key, t, q: pr.q, y: 0, every: pr.every, dst: 1 - b.front };
    }
    const rows = Math.ceil(H / job.every), y1 = Math.min(H, job.y + rows);
    blitRows(b[job.dst], key, job.t, job.q, job.y, y1); SKST.rowsLast = y1 - job.y; job.y = y1;
    if (job.y >= H) { b.front = job.dst; job = null; SKST.rebuilds++; SK.frame++; }
    SK.tex = TEX[key][b.front]; Engine.tex.sky = SK.tex; SK.n++;
  };
})();
