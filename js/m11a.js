// ===== M11a: GAME FEEL (juice pass) =====
// Hit-stop and shake tuned per weapon, impact stars + floor shockwaves + blood mist at hits and kills, punchier damage
// numbers (pop, outline, kill/heavy styles), multi-kill banners, a directional damage indicator and a low-HP heartbeat
// edge, plus bigger Crossbow II/III and Emberbrand impacts. Everything visual is drawn into the world layer (under the
// viewmodel) or the HUD; the locked hands are never touched. Visual randomness uses its own PRNG.
// ?m11=0 switches ALL of m11 off (== m10 exactly: every m11 module returns before installing anything).
(function () {
  const M11 = window.M11 = window.M11 || {};
  M11.v = 'm11'; M11.on = !/[?&]m11=0/.test(location.search);
  if (!M11.on) return;
  let seed = 0x6d2b79f5;
  const fr = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  const fa = (a, b) => a + (b - a) * fr();
  M11.fr = fr; M11.fa = fa;
  const gq = () => (typeof GFX === 'undefined' ? 2 : GFX.q);
  const flashK = () => (window.OPT && OPT.flashK ? OPT.flashK() : 1);
  // render clock (real time; frozen by hit-stop? no: FX keep animating through hit-stop, which is what sells the impact)
  let rdt = 0, lastPN = 0; const tick = () => { const pn = performance.now(); rdt = lastPN ? Math.min(0.05, Math.max(0, (pn - lastPN) / 1000)) : 0; lastPN = pn; if (M11.freeze) rdt = 0; };
  M11.FX = []; M11.MIST = []; M11.lights = []; M11.HURT = []; M11.NUM = [];
  M11.light = (x, y, r, c, i, life) => { if (M11.lights.length < 28) M11.lights.push({ x, y, r, c, i, t: 0, life }); };
  M11.stat = { hits: 0, kills: 0, best: 0, dealt: 0, taken: 0, multi: 0, heavy: 0 };
  const fx = o => { if (M11.FX.length < 90) M11.FX.push(Object.assign({ t: 0, rot: fr() * 6.283, sd: fr() }, o)); };
  M11.fx = fx;

  // ---------- weapon identity ----------
  const SWC = { base: [225, 195, 255], frost: [170, 230, 255], storm: [185, 200, 255], crimson: [255, 70, 100], skull: [140, 255, 150], rapier: [255, 120, 170], axe: [255, 170, 120], fire: [255, 140, 40] };
  const WHC = { base: [215, 170, 255], fire: [255, 140, 40], chain: [150, 200, 255], blood: [255, 60, 110] };
  const tierNow = () => (P.pistol && P.pistol.tier) || 0;
  function colOf(o) {
    const s = o.src || '';
    if (s === 'pistol') { const t = tierNow(); return t === 3 ? [255, 232, 150] : t === 2 ? [255, 130, 40] : P.wpn && P.wpn.ranged === 'crossbow' ? [200, 225, 255] : [255, 215, 160]; }
    if (s === 'smite') return [255, 240, 170];
    if (s === 'burn') return [255, 130, 40];
    if (s === 'whip') return WHC[(P.wpn && P.wpn.whip) || 'base'] || WHC.base;
    if (s === 'finisher') return [255, 60, 70];
    return SWC[(P.wpn && P.wpn.sword) || 'base'] || SWC.base;
  }
  M11.colOf = colOf;
  // hit-stop (s) + extra shake by weapon. The pistol and Crossbow I keep their m10 feel exactly.
  function feel(o, boss) {
    const s = o.src || '', h = !!o.heavy, k = (P.wpn && P.wpn.sword) || 'base'; let hs = 0, sh = 0;
    if (s === 'sword') {
      if (k === 'axe') { hs = h ? 0.13 : 0.07; sh = h ? 3 : 1; }
      else if (k === 'fire') { hs = h ? 0.11 : 0.062; sh = h ? 2.2 : 0.7; }
      else if (k === 'rapier') { hs = h ? 0.09 : 0.046; sh = h ? 0.8 : 0; }
      else { hs = h ? 0.1 : 0.058; sh = h ? 1.3 : 0.4; }
    } else if (s === 'finisher') { hs = 0.16; sh = 2; }
    else if (s === 'bash') { hs = 0.08; sh = 1.2; }
    else if (s === 'whip') { hs = 0.055; sh = 0.3; }
    else if (s === 'smite') { hs = 0.06; sh = 0.8; }
    else if (s === 'pistol') { const t = tierNow(); if (t === 3) { hs = 0.1; sh = 2.4; } else if (t === 2) { hs = 0.09; sh = 1.6; } }
    if (boss) { hs *= 0.7; sh *= 0.7; }
    return [hs, sh];
  }

  // ---------- hits ----------
  const _de = damageEnemy;
  damageEnemy = function (e, dmg, o) {
    o = o || {}; const was = !!(e && e.alive), hp0 = e ? e.hp : 0;
    const r = _de.apply(this, arguments);
    try {
      if (!was || !e) return r;
      const dealt = Math.max(0, hp0 - Math.max(0, e.hp)); if (dealt <= 0 && e.alive) return r;
      M11.stat.dealt += dealt;
      if (o.dot) { if (!e.alive) M11.light(e.x, e.y, 2.4, [1, 0.5, 0.15], 0.5, 0.3); return r; }
      M11.stat.hits++; if (o.heavy) M11.stat.heavy++;
      const [hs, sh] = feel(o, e.d.boss);
      if (hs) G.hitstop = Math.max(G.hitstop, hs); G.shake += sh;
      const c = colOf(o), heavy = !!o.heavy || o.src === 'finisher';
      const pz = e.z + e.h * (o.hz || 0.62), px = e.x - Math.cos(P.ang) * e.r * 0.6, py = e.y - Math.sin(P.ang) * e.r * 0.6;
      const big = Math.min(1, dealt / 90);
      fx({ k: 'star', x: px, y: py, z: pz, life: heavy ? 0.17 : 0.11, sz: (heavy ? 1.35 : 0.85) * (1 + big * 0.6), col: c, n: heavy ? 6 : 4 });
      M11.light(px, py, heavy ? 2.8 : 1.9, [c[0] / 255, c[1] / 255, c[2] / 255], heavy ? 0.6 : 0.32, heavy ? 0.18 : 0.12);
      // knock-down / knockback readability: dust kick at the feet + a short motion smear
      if (heavy && !e.d.fly && !e.d.boss && e.d.mat !== 'ecto') { fx({ k: 'kick', x: e.x, y: e.y, z: e.z, life: 0.45, sz: e.r * 1.6, col: [200, 180, 190], ang: P.ang }); }
      if (o.src === 'sword' && P.wpn && P.wpn.sword === 'fire') fx({ k: 'lick', x: px, y: py, z: pz - 0.2, life: heavy ? 0.5 : 0.32, sz: heavy ? 1.2 : 0.75, col: [255, 140, 40] });
      if (o.src === 'pistol' && tierNow() >= 2) { const t3 = tierNow() === 3; fx({ k: 'ring', x: e.x, y: e.y, z: e.z, life: 0.32, sz: t3 ? 1.5 : 1.2, col: t3 ? [255, 236, 160] : [255, 120, 30] }); }
    } catch (err) { if (!M11.err) { M11.err = String(err); console.warn('m11a hit', err); } }
    return r;
  };

  // ---------- kills ----------
  const MATC = { flesh: [120, 6, 18], bone: [200, 190, 170], ecto: [80, 255, 180], stone: [150, 140, 150], ice: [170, 220, 255] };
  const MK = { n: 0, t: -9, banner: null };
  const NAMES = [null, null, 'DOUBLE KILL', 'TRIPLE KILL', 'QUAD KILL', 'CARNAGE', 'MASSACRE', 'MASSACRE', 'UNYIELDING'];
  M11.MK = MK;
  const _ke = killEnemy;
  killEnemy = function (e, o) {
    const r = _ke.apply(this, arguments);
    try {
      o = o || {}; M11.stat.kills++;
      const m = e.d.mat || 'flesh', mc = MATC[m] || MATC.flesh, c = colOf(o), boss = !!e.d.boss;
      const cx = e.x, cy = e.y, cz = e.z + e.h * 0.55, burst = e.deathType === 'burst';
      fx({ k: 'ring', x: cx, y: cy, z: e.z, life: burst ? 0.5 : 0.4, sz: (burst ? 2.0 : 1.3) * (boss ? 2 : 1), col: c });
      fx({ k: 'star', x: cx, y: cy, z: cz, life: 0.2, sz: burst ? 2.0 : 1.5, col: [255, 245, 230], n: 8 });
      if (gq() > 0 && m !== 'ecto') for (let i = 0; i < (burst ? 9 : 5); i++) M11.MIST.push({ x: cx + fa(-0.25, 0.25), y: cy + fa(-0.25, 0.25), z: cz + fa(-0.3, 0.3), vx: fa(-0.6, 0.6), vy: fa(-0.6, 0.6), vz: fa(0.1, 0.6), r: fa(0.25, 0.45) * (burst ? 1.3 : 1), t: 0, life: fa(0.6, 1.1), col: mc });
      if (m === 'ecto') for (let i = 0; i < 6; i++) M11.MIST.push({ x: cx, y: cy, z: cz, vx: fa(-0.8, 0.8), vy: fa(-0.8, 0.8), vz: fa(0.3, 1.0), r: fa(0.2, 0.4), t: 0, life: fa(0.6, 1.0), col: mc, add: 1 });
      M11.light(cx, cy, burst ? 3.6 : 2.8, [c[0] / 255, c[1] / 255, c[2] / 255], burst ? 0.85 : 0.55, 0.32);
      if (!boss) {
        G.hitstop = Math.max(G.hitstop, burst ? 0.11 : 0.08); G.shake += burst ? 2 : 1; G.zoom += burst ? 0.025 : 0.012;
        if (burst && m !== 'ecto') gibs(cx, cy, cz, 3, m, 1.25);
        // multi-kill
        if (G.time - MK.t < 1.5) MK.n++; else MK.n = 1; MK.t = G.time;
        if (MK.n >= 2) { const nm = NAMES[Math.min(MK.n, NAMES.length - 1)]; MK.banner = { txt: nm, t: 0, n: MK.n }; M11.stat.multi++; if (MK.n >= 3) G.slow = Math.max(G.slow, 0.22); if (!(M11.sfx && M11.sfx('m11_multi', 0.55 + 0.1 * Math.min(4, MK.n - 2)))) SFX.play(MK.n >= 4 ? 'finisher' : 'glint', MK.n >= 4 ? 0.5 : 0.6); }
        M11.stat.best = Math.max(M11.stat.best, MK.n);
        const d = G.dmgNums[G.dmgNums.length - 1]; if (d && d.t < 0.02 && d.num !== undefined) { d.kill = true; d.big = true; d.col = '#fff4e0'; }
      }
    } catch (err) { if (!M11.err) { M11.err = String(err); console.warn('m11a kill', err); } }
    return r;
  };

  // ---------- crossbow II/III + Emberbrand bursts (m10 calls M10.burst for every fire / holy burst) ----------
  if (window.M10) {
    const _b = M10.burst;
    M10.burst = function (x, y, z, kind, rad) {
      if (_b) _b.apply(this, arguments);
      try {
        const holy = kind === 'holy', R = rad || 1.4, fz = floorAt(x, y) < 50 ? floorAt(x, y) : z;
        if (holy) { fx({ k: 'pillar', x, y, z: fz, life: 0.45, sz: R * 0.5, col: [255, 236, 160] }); M11.light(x, y, R * 2.4, [1.0, 0.92, 0.6], 0.9, 0.4); G.shake += 1.2; }
        else { fx({ k: 'flame', x, y, z: fz, life: 0.55, sz: R * 0.55, col: [255, 130, 40] }); M11.light(x, y, R * 2.4, [1.0, 0.5, 0.15], 0.9, 0.45); G.shake += 1.0; }
        fx({ k: 'ring', x, y, z: fz, life: 0.4, sz: R * 1.25, col: holy ? [255, 240, 180] : [255, 150, 60] });
      } catch (err) { }
    };
  }
  // Crossbow II/III muzzle + wall-impact light
  const _fc = fireCrossbow;
  fireCrossbow = function () {
    const n0 = BOLTS.length; const r = _fc.apply(this, arguments);
    try {
      const t = tierNow();
      if (BOLTS.length > n0 && t >= 2) {
        const b = BOLTS[BOLTS.length - 1], c = t === 3 ? [1.0, 0.9, 0.6] : [1.0, 0.5, 0.15];
        M11.light(P.x + Math.cos(P.ang) * 0.8, P.y + Math.sin(P.ang) * 0.8, 3.0, c, 0.7, 0.16);
        M11.light(b.b[0], b.b[1], 2.2, c, 0.6, 0.25);
        fx({ k: 'star', x: b.b[0] - Math.cos(P.ang) * 0.1, y: b.b[1] - Math.sin(P.ang) * 0.1, z: b.b[2], life: 0.14, sz: 1.0, col: t === 3 ? [255, 236, 160] : [255, 130, 40], n: 6 });
      }
    } catch (err) { }
    return r;
  };

  // ---------- player damage feedback ----------
  const _hp0 = hurtPlayer0;
  hurtPlayer0 = function (dmg, sx, sy, opt) {
    const h0 = P.hp; const r = _hp0.apply(this, arguments);
    try {
      const lost = h0 - P.hp; if (lost > 0) M11.stat.taken += lost;
      if ((r === 'hit' || r === 'block') && sx !== undefined && !(opt && opt.env)) {
        const a = Math.atan2(sy - P.y, sx - P.x);
        M11.HURT.push({ a, t: 0, life: r === 'hit' ? 1.0 : 0.5, k: r === 'hit' ? Math.min(1, 0.45 + lost / 40) : 0.35, blk: r === 'block' });
        if (M11.HURT.length > 6) M11.HURT.shift();
      }
    } catch (err) { }
    return r;
  };

  // ---------- damage numbers: richer styling (same jitter rolls as m10, so gameplay RNG is unchanged) ----------
  const _dn = dmgNum;
  dmgNum = function (x, y, z, txt, col) {
    _dn.apply(this, arguments);
    const d = G.dmgNums[G.dmgNums.length - 1]; if (!d) return;
    const n = +txt; d.m11 = 1; d.vx = fa(-0.5, 0.5);
    if (!isNaN(n) && String(txt).trim() !== '') { d.num = n; d.big = col === '#ffcf40' || n >= 60; d.kill = false; }
  };

  // ---------- drawing: world-layer FX (under the viewmodel) ----------
  function P3(cam, x, y, z) { return project(cam, x, y, z); }
  function ringPts(cam, x, y, z, R) {
    const out = []; for (let i = 0; i <= 20; i++) { const a = i / 20 * 6.2832; const p = P3(cam, x + Math.cos(a) * R, y + Math.sin(a) * R, z + 0.03); if (!p) return null; out.push(p); } return out;
  }
  let LA = null, LN = null;
  function layers() { if (!LA) { const mk = () => { const c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d'); return x; }; LA = mk(); LN = mk(); } LA.clearRect(0, 0, W, H); LN.clearRect(0, 0, W, H); }
  function drawFX(out, cam) {
    const L = M11.FX; if (!L.length && !M11.MIST.length) return;
    layers(); let ctx = LA; const sel = op => { ctx = op === 'source-over' ? LN : LA; };
    LA.save(); LN.save();
    for (let i = L.length - 1; i >= 0; i--) {
      const f = L[i]; f.t += rdt; if (f.t > f.life) { L.splice(i, 1); continue; }
      const k = f.t / f.life, a = 1 - k, c = f.col, cs = `rgb(${c[0]},${c[1]},${c[2]})`;
      if (f.k === 'star') {
        const p = P3(cam, f.x, f.y, f.z); if (!p || p.d < 0.4) continue;
        let R = Math.min(70, f.sz * 0.42 * p.s) * (0.55 + 0.9 * Math.sqrt(k)); if (R < 3) R = 3;
        sel('lighter'); ctx.globalAlpha = a * flashK();
        // core
        ctx.fillStyle = '#ffffff'; const cr = Math.max(1, R * 0.16 * (1 - k)); ctx.fillRect(p.x - cr, p.y - cr, cr * 2, cr * 2);
        ctx.strokeStyle = cs; ctx.lineCap = 'round';
        const n = f.n || 4;
        for (let j = 0; j < n; j++) {
          const an = f.rot + j / n * 6.2832, len = R * (j % 2 ? 0.55 : 1);
          ctx.lineWidth = Math.max(1, (j % 2 ? 1.2 : 2.2) * (1 - k * 0.6));
          ctx.beginPath(); ctx.moveTo(p.x + Math.cos(an) * R * 0.15, p.y + Math.sin(an) * R * 0.15); ctx.lineTo(p.x + Math.cos(an) * len, p.y + Math.sin(an) * len); ctx.stroke();
        }
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1; ctx.globalAlpha = a * 0.8 * flashK();
        for (let j = 0; j < n; j += 2) { const an = f.rot + j / n * 6.2832, len = R * 0.6; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x + Math.cos(an) * len, p.y + Math.sin(an) * len); ctx.stroke(); }
      } else if (f.k === 'ring') {
        if (gq() < 1) continue;
        const R = f.sz * (0.25 + 0.75 * Math.sqrt(k)), pts = ringPts(cam, f.x, f.y, f.z, R); if (!pts) continue;
        sel('lighter'); ctx.globalAlpha = a * 0.85;
        ctx.strokeStyle = cs; ctx.lineWidth = Math.max(1, 3 * a);
        ctx.beginPath(); pts.forEach((q, j) => j ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y)); ctx.stroke();
        ctx.globalAlpha = a * 0.35; ctx.lineWidth = Math.max(1, 7 * a); ctx.stroke();
      } else if (f.k === 'kick') {
        if (gq() < 1) continue;
        // dust kicked up behind the foe as it is knocked back
        for (let j = 0; j < 7; j++) {
          const an = f.ang + Math.PI + (j - 3) * 0.35 + f.sd, dd = f.sz * (0.3 + k * 0.9) * (0.6 + (j % 3) * 0.25);
          const p = P3(cam, f.x + Math.cos(f.ang) * k * 0.6 + Math.cos(an) * dd, f.y + Math.sin(f.ang) * k * 0.6 + Math.sin(an) * dd, f.z + 0.08 + k * 0.25 * (j % 2)); if (!p || p.d < 0.5) continue;
          const r = Math.max(1.5, Math.min(14, 0.12 * p.s * (0.6 + k)));
          sel('source-over'); ctx.globalAlpha = a * 0.35; ctx.fillStyle = 'rgb(150,130,150)';
          ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, 6.2832); ctx.fill();
        }
      } else if (f.k === 'lick' || f.k === 'flame') {
        const p = P3(cam, f.x, f.y, f.z), q = P3(cam, f.x, f.y, f.z + f.sz * (f.k === 'flame' ? 2.6 : 1.4) * (0.4 + 0.6 * Math.sqrt(k))); if (!p || !q || p.d < 0.5) continue;
        const w = Math.max(3, Math.min(34, f.sz * 0.36 * p.s)), hgt = Math.min(110, p.y - q.y);
        sel('lighter');
        const tongues = f.k === 'flame' ? 5 : 3;
        for (let j = 0; j < tongues; j++) {
          const ox = (j / (tongues - 1) - 0.5) * w * 1.6 + Math.sin(f.t * 30 + j * 2.1) * w * 0.12, th = hgt * (0.55 + 0.45 * Math.abs(Math.sin(j * 1.7 + f.sd * 6 + f.t * 9)));
          const g = ctx.createLinearGradient(0, p.y, 0, p.y - th);
          g.addColorStop(0, `rgba(255,200,90,${0.55 * a})`); g.addColorStop(0.3, `rgba(255,110,20,${0.5 * a})`); g.addColorStop(1, 'rgba(140,10,0,0)');
          ctx.globalAlpha = 1; ctx.fillStyle = g; const tw = w * 0.42;
          ctx.beginPath(); ctx.moveTo(p.x + ox - tw, p.y); ctx.quadraticCurveTo(p.x + ox - tw * 0.4, p.y - th * 0.6, p.x + ox + Math.sin(f.t * 20 + j) * tw * 0.4, p.y - th); ctx.quadraticCurveTo(p.x + ox + tw * 0.4, p.y - th * 0.6, p.x + ox + tw, p.y); ctx.fill();
        }
      } else if (f.k === 'pillar') {
        const p = P3(cam, f.x, f.y, f.z), q = P3(cam, f.x, f.y, f.z + 3.4); if (!p || !q || p.d < 0.5) continue;
        const w = Math.max(3, Math.min(90, f.sz * p.s)) * (k < 0.15 ? k / 0.15 : 1 - (k - 0.15) * 0.6);
        sel('lighter');
        const g = ctx.createLinearGradient(p.x - w, 0, p.x + w, 0);
        g.addColorStop(0, 'rgba(255,220,120,0)'); g.addColorStop(0.35, `rgba(255,225,140,${0.45 * a})`); g.addColorStop(0.5, `rgba(255,255,235,${0.9 * a})`); g.addColorStop(0.65, `rgba(255,225,140,${0.45 * a})`); g.addColorStop(1, 'rgba(255,220,120,0)');
        ctx.globalAlpha = flashK(); ctx.fillStyle = g; ctx.fillRect(p.x - w, Math.min(q.y, p.y - 2), w * 2, Math.abs(p.y - q.y));
        // motes rising in the beam
        ctx.fillStyle = '#fffbe0';
        for (let j = 0; j < 8; j++) { const yy = p.y - ((j / 8 + f.t * 1.6 + f.sd) % 1) * (p.y - q.y), xx = p.x + Math.sin(j * 2.3 + f.t * 6) * w * 0.5; ctx.globalAlpha = a * 0.9; ctx.fillRect(xx | 0, yy | 0, 1, 2); }
      }
    }
    // blood / ecto mist
    if (M11.MIST.length) {
      for (let i = M11.MIST.length - 1; i >= 0; i--) {
        const m = M11.MIST[i]; m.t += rdt; if (m.t > m.life) { M11.MIST.splice(i, 1); continue; }
        m.x += m.vx * rdt; m.y += m.vy * rdt; m.z += m.vz * rdt; m.vx *= 0.96; m.vy *= 0.96;
        const p = P3(cam, m.x, m.y, m.z); if (!p || p.d < 0.6) continue;
        const k = m.t / m.life, r = Math.min(40, m.r * p.s * (0.5 + k * 0.9)), c = m.col;
        sel(m.add ? 'lighter' : 'source-over'); ctx.globalAlpha = (1 - k) * (m.add ? 0.35 : 0.42);
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r); g.addColorStop(0, `rgba(${c[0]},${c[1]},${c[2]},1)`); g.addColorStop(1, `rgba(${c[0]},${c[1]},${c[2]},0)`);
        ctx.fillStyle = g; ctx.fillRect(p.x - r, p.y - r, r * 2, r * 2);
      }
      if (M11.MIST.length > 120) M11.MIST.splice(0, M11.MIST.length - 120);
    }
    LA.restore(); LN.restore();
    out.save(); out.imageSmoothingEnabled = false; out.globalAlpha = 1;
    out.globalCompositeOperation = 'source-over'; out.drawImage(LN.canvas, 0, 0);
    out.globalCompositeOperation = 'lighter'; out.drawImage(LA.canvas, 0, 0);
    out.restore();
  }
  const _ds = drawSlashes;
  drawSlashes = function (ctx, cam, r) {
    tick();
    try { if (G.state !== 'title') drawFX(ctx, cam); } catch (err) { if (!M11.err) { M11.err = String(err); console.warn('m11a fx', err); } }
    return _ds.apply(this, arguments);
  };

  // ---------- HUD: damage numbers, multi-kill banner, damage direction, low-HP heartbeat ----------
  function drawNums(ctx, cam) {
    const barOn = !!(G.boss && G.boss.awake && (G.boss.alive || (G.boss.deathType === 'boss' && !G.boss.burst)));
    for (let i = G.dmgNums.length - 1; i >= 0; i--) {
      const d = G.dmgNums[i]; d.t += rdt; const life = d.big ? 1.05 : 0.9; if (d.t > life) { G.dmgNums.splice(i, 1); continue; }
      const rise = d.t * (d.big ? 0.75 : 0.6) - d.t * d.t * 0.25;
      const pr = project(cam, d.x + (d.vx || 0) * d.t * 0.35, d.y, d.z + rise); if (!pr) continue;
      if (barOn && pr.y < 40) pr.y = 40 + (i % 3) * 9;
      const base = d.big ? 2 : 1, pop = d.t < 0.06 ? 1.8 : d.t < 0.12 ? 1.3 : 1, sc = base * pop;
      ctx.globalAlpha = Math.min(1, (life - d.t) * 4);
      const s = d.txt, w = s.length * 8 * sc, x = Math.round(pr.x - w / 2), y = Math.round(pr.y - 4 - 4 * sc);
      ctx.save(); ctx.translate(x, y); ctx.scale(sc / base, sc / base);
      text(ctx, s, 0, 0, d.t < 0.05 ? '#ffffff' : d.col, 'left', base, d.kill ? '#b00018' : d.big ? '#3a0008' : '#1a0612');
      ctx.restore(); ctx.globalAlpha = 1;
    }
  }
  function drawBanner(ctx) {
    const b = MK.banner; if (!b) return; b.t += rdt; if (b.t > 1.25) { MK.banner = null; return; }
    const k = b.t, sc = k < 0.08 ? 3 : 2, a = k > 0.95 ? (1.25 - k) / 0.3 : 1;
    const col = b.n >= 5 ? '#ff3040' : b.n >= 4 ? '#ff8030' : b.n >= 3 ? '#ffc040' : '#ffe9a0';
    ctx.save(); ctx.globalAlpha = Math.max(0, a);
    const y = 42 + (k < 0.08 ? -2 : 0), w = b.txt.length * 8 * sc;
    ctx.fillStyle = 'rgba(20,0,16,0.4)'; ctx.fillRect(240 - w / 2 - 10, y - 4, w + 20, 8 * sc + 8);
    ctx.fillStyle = col; ctx.fillRect(240 - w / 2 - 10, y - 4, w + 20, 1); ctx.fillRect(240 - w / 2 - 10, y + 8 * sc + 3, w + 20, 1);
    text(ctx, b.txt, 240, y, col, 'center', sc, '#2a0008');
    if (b.n >= 3) text(ctx, 'x' + b.n, 240 + w / 2 + 16, y + 4, '#ffffff', 'left', 1);
    ctx.restore();
  }
  function drawHurt(ctx) {
    if (!M11.HURT.length) return;
    ctx.save(); ctx.globalCompositeOperation = 'source-over';
    for (let i = M11.HURT.length - 1; i >= 0; i--) {
      const h = M11.HURT[i]; h.t += rdt; if (h.t > h.life) { M11.HURT.splice(i, 1); continue; }
      const rel = h.a - P.ang - Math.PI / 2, a = (1 - h.t / h.life) * h.k;
      const cx = 240, cy = 128, R = 66;
      ctx.globalAlpha = a; ctx.strokeStyle = h.blk ? '#c0c0ff' : '#ff1030'; ctx.lineWidth = 4;
      ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(cx, cy, R, rel - 0.42, rel + 0.42); ctx.stroke();
      ctx.globalAlpha = a * 0.4; ctx.lineWidth = 12; ctx.beginPath(); ctx.arc(cx, cy, R + 3, rel - 0.34, rel + 0.34); ctx.stroke();
      // arrowhead
      ctx.globalAlpha = a; ctx.fillStyle = h.blk ? '#e0e0ff' : '#ff5060';
      const tx = cx + Math.cos(rel) * (R + 14), ty = cy + Math.sin(rel) * (R + 14), lx = cx + Math.cos(rel - 0.14) * (R + 3), ly = cy + Math.sin(rel - 0.14) * (R + 3), rx = cx + Math.cos(rel + 0.14) * (R + 3), ry = cy + Math.sin(rel + 0.14) * (R + 3);
      ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(lx, ly); ctx.lineTo(rx, ry); ctx.fill();
    }
    ctx.restore();
  }
  let hb = 0; const VG = M11.VG = {};
  function lowHP(ctx) {
    if (G.state !== 'play' || !P.maxhp) return;
    const f = P.hp / P.maxhp; if (f > 0.3 || P.hp <= 0) { hb = 0; return; }
    const sev = 1 - f / 0.3; hb += rdt * (1.2 + sev * 0.9);
    const ph = hb % 1, beat = Math.max(Math.exp(-ph * 14), 0.7 * Math.exp(-Math.abs(ph - 0.22) * 16));
    const a = (0.32 + 0.38 * sev) * (0.5 + 0.5 * beat);
    if (!VG.c) { const c = document.createElement('canvas'); c.width = 480; c.height = 270; const x = c.getContext('2d'); const g = x.createRadialGradient(240, 125, 70, 240, 135, 280); g.addColorStop(0, 'rgba(170,0,20,0)'); g.addColorStop(0.45, 'rgba(170,0,20,0.3)'); g.addColorStop(1, 'rgba(110,0,10,1)'); x.fillStyle = g; x.fillRect(0, 0, 480, 270); VG.c = c; }
    ctx.save(); ctx.globalAlpha = Math.min(0.8, a); ctx.drawImage(VG.c, 0, 0); ctx.restore();
    if (ph < rdt * (1.2 + sev) && SFX && SFX.play) { /* heartbeat thump */ if (M11.sfx && M11.sfx('heart', 0.5 + 0.4 * sev)) { } }
  }
  const _dh = drawHUD;
  drawHUD = function (ctx, cam, r) {
    const keep = G.dmgNums; G.dmgNums = [];   // m10 draws its numbers inline; hand it an empty list and draw ours instead
    let out; try { out = _dh.apply(this, arguments); } finally { G.dmgNums = keep; }
    try { if (G.state === 'play' || G.state === 'dead') { lowHP(ctx); drawHurt(ctx); } drawNums(ctx, cam); drawBanner(ctx); } catch (err) { if (!M11.err) { M11.err = String(err); console.warn('m11a hud', err); } }
    return out;
  };
  // reset per-run stats
  if (typeof newRun === 'function') { const _nr = newRun; newRun = function () { for (const k in M11.stat) M11.stat[k] = 0; MK.n = 0; MK.banner = null; return _nr.apply(this, arguments); }; }
  // clear transient FX on level change
  if (typeof buildLevel === 'function') { const _bl = buildLevel; buildLevel = function () { M11.FX.length = 0; M11.MIST.length = 0; M11.lights.length = 0; M11.HURT.length = 0; return _bl.apply(this, arguments); }; }
})();
