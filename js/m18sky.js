// ===== m18sky: per-stage gothic skies (cached layers, slow drift, quality-aware). ?sky=0 or ?m18=0
(function () {
  if (!window.M18 || !M18.sky) return;
  if (typeof Engine === 'undefined') return;
  const SK = M18.skyState = { on: true, key: '', frame: 0, n: 0 };
  const W = 512, H = 128;
  const buf = {}, base = {};
  const px = (r, g, b, a) => ((a === undefined ? 255 : a) << 24 | (b & 255) << 16 | (g & 255) << 8 | (r & 255)) >>> 0;

  function rec() {
    try {
      if (typeof RUN !== 'undefined' && RUN.hub) return 'hub';
      if (typeof G !== 'undefined' && G.boss && G.boss.alive && G.boss.awake) {
        if (G.boss.type === 'lich') return 'void2';
        if (G.boss.type === 'witch') return 'necro2';
        if (G.boss.type === 'alphawolf') return 'bloodmoon';
      }
      const cfg = (typeof RUN !== 'undefined' && RUN.cfg) ? RUN.cfg.theme : null;
      if (cfg === 'abyss') return 'abyss';
      if (cfg && cfg !== 'm13sanct') return cfg;
      const th = (typeof curTheme === 'function') ? curTheme() : null;
      if (!th) return cfg || 'nave';
      if ((th.name || '').indexOf('BLACK CHAPEL') >= 0 || th.variant === 'm13sanct' || cfg === 'm13sanct') return 'chapel';
      if (th.variant) return th.variant;
      if (th.sky === 'sky_moon') return 'courtyard';
      if (th.sky === 'sky_storm') return 'cathedral';
      if (th.sky === 'sky_void') return 'throne';
      if (th.sky === 'sky_necro') return 'necropolis';
      return cfg || th.variant || 'nave';
    } catch (e) { return 'nave'; }
  }

  function lerpC(a, b, t) {
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  }
  function pal(key) {
    // [top, mid, horizon] RGB
    switch (key) {
      case 'nave': return [[18, 8, 36], [50, 22, 70], [110, 50, 90]];
      case 'crypt': return [[4, 16, 18], [10, 40, 36], [20, 70, 58]];
      case 'ossuary': return [[20, 2, 8], [70, 8, 24], [140, 20, 36]];
      case 'courtyard': return [[6, 8, 28], [16, 20, 60], [40, 40, 80]];
      case 'belfry': return [[8, 8, 16], [22, 22, 36], [50, 48, 64]];
      case 'arena': return [[24, 6, 4], [80, 22, 10], [160, 50, 20]];
      case 'necropolis': case 'necro2': return [[8, 16, 20], [20, 50, 48], [40, 80, 90]];
      case 'kennels': return [[16, 4, 2], [60, 16, 6], [140, 40, 12]];
      case 'cathedral': return [[6, 6, 16], [20, 16, 40], [40, 30, 70]];
      case 'throne': case 'void2': return [[4, 0, 16], [20, 4, 40], [50, 10, 80]];
      case 'abyss': return [[0, 0, 2], [4, 0, 16], [16, 4, 36]];
      case 'chapel': case 'hub': return [[10, 6, 16], [28, 16, 32], [60, 36, 40]];
      case 'bloodmoon': return [[24, 0, 8], [80, 4, 16], [160, 16, 24]];
      default: return [[16, 8, 28], [40, 20, 56], [80, 40, 70]];
    }
  }

  function hash(i) { i |= 0; i = (i ^ 61) ^ (i >>> 16); i = (i + (i << 3)) | 0; i = i ^ (i >>> 4); i = Math.imul(i, 0x27d4eb2d); i = i ^ (i >>> 15); return (i >>> 0) / 4294967296; }

  function paintBase(key) {
    if (base[key]) return base[key];
    const d = new Uint32Array(W * H);
    const p = pal(key);
    for (let y = 0; y < H; y++) {
      const t = y / (H - 1);
      const c = t < 0.55 ? lerpC(p[0], p[1], t / 0.55) : lerpC(p[1], p[2], (t - 0.55) / 0.45);
      for (let x = 0; x < W; x++) {
        const n = (hash(x * 13 + y * 31 + key.length * 17) - 0.5) * 8;
        d[y * W + x] = px(c[0] + n, c[1] + n * 0.6, c[2] + n * 0.8);
      }
    }
    // stars (more in late / void / courtyard)
    const starN = /abyss|throne|void|courtyard|nave|chapel/.test(key) ? 140 : /necropolis|cathedral|belfry/.test(key) ? 80 : 40;
    for (let i = 0; i < starN; i++) {
      const x = (hash(i * 19 + 3) * W) | 0, y = (hash(i * 29 + 7) * (H * 0.62)) | 0;
      const br = 140 + (hash(i * 7) * 115) | 0;
      const tint = hash(i) > 0.8;
      d[y * W + x] = px(tint ? br * 0.85 : br, tint ? br * 0.7 : br, br);
      if (hash(i * 3) > 0.85 && x + 1 < W) d[y * W + x + 1] = px(br * 0.5, br * 0.5, br * 0.6);
    }
    // moon / blood moon / cracked disc
    if (/nave|courtyard|ossuary|bloodmoon|chapel|hub/.test(key)) {
      const blood = /ossuary|bloodmoon/.test(key);
      const cx = blood ? 360 : 300, cy = blood ? 44 : 36, rad = blood ? 22 : 16;
      for (let y = cy - rad - 2; y <= cy + rad + 2; y++) for (let x = cx - rad - 4; x <= cx + rad + 4; x++) {
        if (x < 0 || x >= W || y < 0 || y >= H) continue;
        const dx = x - cx, dy = (y - cy) * 1.05, dist = Math.hypot(dx, dy);
        if (dist < rad + 6) {
          const halo = Math.max(0, 1 - (dist - rad) / 6);
          if (dist > rad) {
            const c = blood ? [180, 20, 30] : [180, 160, 220];
            const o = d[y * W + x], r0 = o & 255, g0 = (o >> 8) & 255, b0 = (o >> 16) & 255;
            d[y * W + x] = px(r0 + (c[0] - r0) * halo * 0.45, g0 + (c[1] - g0) * halo * 0.45, b0 + (c[2] - b0) * halo * 0.45);
          } else {
            const shade = 0.75 + 0.25 * (dx / rad);
            d[y * W + x] = blood ? px(200 * shade, 24 * shade, 28 * shade) : px(230 * shade, 210 * shade, 200 * shade);
          }
        }
      }
    }
    // abyss cracks
    if (key === 'abyss' || key === 'void2') {
      for (let k = 0; k < 7; k++) {
        let x = (hash(k * 17 + 4) * W) | 0, y = 20 + (hash(k * 9) * 70) | 0;
        const len = 20 + (hash(k * 3) * 40) | 0;
        for (let i = 0; i < len; i++) {
          x = (x + ((hash(k * 11 + i) - 0.45) * 3) | 0 + W) % W;
          y += (hash(k * 13 + i) - 0.35) * 2;
          const yy = y | 0; if (yy < 0 || yy >= H) continue;
          d[yy * W + x] = px(160, 40, 255);
          if (yy + 1 < H) d[(yy + 1) * W + x] = px(40, 0, 80);
        }
      }
    }
    base[key] = d;
    return d;
  }

  function noise(x, y, s) {
    const xi = Math.floor(x / s), yi = Math.floor(y / s);
    const fx = (x / s) - xi, fy = (y / s) - yi;
    const a = hash(xi * 13 + yi * 57), b = hash((xi + 1) * 13 + yi * 57);
    const c = hash(xi * 13 + (yi + 1) * 57), d = hash((xi + 1) * 13 + (yi + 1) * 57);
    const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }

  function blitClouds(out, key, t, quality) {
    const src = paintBase(key);
    out.set(src);
    const fire = /kennels|arena/.test(key);
    const storm = /cathedral|belfry/.test(key);
    const auroraOn = /necropolis|necro2|throne|void2/.test(key);
    const drift = t * (storm ? 14 : fire ? 10 : 7);

    // clouds / ash
    const layers = quality < 1 ? 1 : 2;
    for (let L = 0; L < layers; L++) {
      const sp = L === 0 ? 1 : 0.45, col = fire ? [40, 12, 8] : storm ? [18, 16, 28] : [20, 14, 32];
      const a0 = fire ? 0.55 : 0.4;
      const y0 = 30 + L * 16, y1 = H - 4;
      for (let y = y0; y < y1; y++) {
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

    // aurora bands
    if (auroraOn && quality > 0) {
      for (let y = 10; y < 80; y++) {
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

    // embers / ash motes
    if ((fire || key === 'ossuary') && quality > 0) {
      const n = 28;
      for (let i = 0; i < n; i++) {
        const x = ((hash(i * 11) * W) + t * (8 + i % 5) * 3) % W | 0;
        const y = (H - 8 - ((hash(i * 5) * 50 + t * (10 + i % 7)) % 50)) | 0;
        if (y < 0 || y >= H) continue;
        out[y * W + x] = fire ? px(255, 140, 40) : px(255, 80, 60);
      }
    }

    // lightning flash
    if (storm) {
      const period = 4.2 + (key === 'cathedral' ? 0 : 1.2);
      const phase = (t % period);
      if (phase < 0.12 || (phase > 0.18 && phase < 0.26)) {
        const flash = phase < 0.12 ? 1 - phase / 0.12 : 1 - (phase - 0.18) / 0.08;
        for (let i = 0; i < W * H; i++) {
          const o = out[i], r0 = o & 255, g0 = (o >> 8) & 255, b0 = (o >> 16) & 255;
          out[i] = px(r0 + (220 - r0) * flash * 0.35, g0 + (220 - g0) * flash * 0.4, b0 + (255 - b0) * flash * 0.5);
        }
        if (quality > 0 && phase < 0.1) {
          let x = (hash((t / period) | 0 * 9) * W) | 0, y = 0;
          for (let k = 0; k < 40 && y < H - 10; k++) {
            x = (x + ((hash(((t / period) | 0) * 13 + k) - 0.5) * 8) | 0 + W) % W;
            y += 2 + (hash(k) * 3) | 0;
            if (y < H) out[y * W + x] = px(230, 240, 255);
            if (y < H && x + 1 < W) out[y * W + x + 1] = px(140, 160, 255);
          }
        }
      }
    }
  }

  function tick() {
    if (typeof G === 'undefined' || (G.state !== 'play' && G.state !== 'pause')) return;
    const key = rec();
    const q = (typeof GFX !== 'undefined' && GFX.q != null) ? GFX.q : 2;
    const slow = (typeof GFX !== 'undefined' && (GFX.hdOff || GFX.ms > 20));
    const every = q < 1 || slow ? 8 : q < 2 ? 4 : 3;
    SK.n++;
    if (SK.key === key && SK.n % every && SK.tex) {
      Engine.tex.sky = SK.tex;
      return;
    }
    SK.key = key;
    const t = (typeof G !== 'undefined' ? G.t : 0) || 0;
    const out = buf[key] || (buf[key] = new Uint32Array(W * H));
    blitClouds(out, key, t, slow ? 0 : q);
    if (!SK.tex || SK.tex.d !== out) SK.tex = { w: W, h: H, d: out };
    else SK.tex.d = out;
    Engine.tex.sky = SK.tex;
    SK.frame++;
  }

  const _render = typeof render === 'function' ? render : null;
  if (_render) render = function (rdt) { try { tick(); } catch (e) { M18.err = M18.err || ('sky ' + e); } return _render.apply(this, arguments); };
  SK.tick = tick;
  SK.rec = rec;
})();
