'use strict';
// ===== m20f MOVESETS (t213u "get the score as high as you can"). Kill switch: ?moves=0 (or ?m20f=0) =====
// Additive moves on top of the untouched 3-hit combo, base damage and prices. Hands/viewmodels are the existing art:
// every new move plays an existing swing / bash / shot animation; the extra look is world particles + a tiny HUD charge ring.
//  - CHARGED HEAVY: keep holding attack after a swing -> a charge builds (0.5 s) -> release for the weapon's special:
//      blades (base/fire/frost/storm/void/ruby/crimson) .... CRESCENT WAVE: a heavy swing that throws a travelling arc (4.5 m)
//      heavies (axe/great/skull, maul/forge hammer/spade) .. GROUND SLAM: heavy swing + a shockwave ring around you
//      reach (rapier, trident, halberd, void halberd) ...... TRIPLE THRUST: heavy swing + three lunging stabs down a line
//  - RIPOSTE LUNGE: attack during the end of a roll / right after it -> you dash forward with a piercing thrust
//  - COMBO CRUSH: land all three hits of the combo -> the third hit bursts a short ring that cracks poise
//  - QUICKDRAW (crossbow / sidearm): shoot within 0.35 s of a roll -> the shot costs no mana and MARKS the first foe hit;
//      your next blade hit on a marked foe bursts it for bonus damage
//  - SHIELD RUSH: shield-bash right out of a roll -> a charging bash that shoves harder and stuns
// Cheap by design: no new textures, a few particles (fewer on the low governor levels), no extra full-screen passes.
(function () {
  const Q = s => new RegExp('[?&]' + s + '=0').test(location.search);
  const M = window.M20F_MOVES = { on: !Q('moves') && !Q('m20f'), log: [], n: {}, err: [] };
  if (!M.on || typeof updatePlayer !== 'function' || typeof swordHit !== 'function') return;
  const cnt = k => { M.n[k] = (M.n[k] || 0) + 1; };
  const low = () => typeof GFX !== 'undefined' && GFX.q < 2;
  const pn = n => Math.max(1, Math.round(n * (low() ? 0.5 : 1)));
  const swMul = () => ((P.mods && P.mods.sword) || 1) * (P.hasEdge ? 1.4 : 1);
  const COL = { base: '#fff0c0', fire: '#ff8030', frost: '#a8ecff', storm: '#c890ff', void: '#b070ff', ruby: '#ff4060', crimson: '#ff3050', axe: '#ffd0a0', great: '#ffe0b0', skull: '#d0ffd0', rapier: '#ffe8f0' };
  function fam() {
    const w = P.wpn && P.wpn.sword, m = P.mods || {};
    if (m.voidhal && w === 'storm') return 'thrust';
    if (m.m20halberd || m.m20trident || w === 'rapier') return 'thrust';
    if (m.m20maul || m.m20forge || m.m20spade || w === 'axe' || w === 'great' || w === 'skull') return 'slam';
    return 'wave';
  }
  M.fam = fam;
  const col = () => (P.mods && P.mods.voidhal && P.wpn && P.wpn.sword === 'storm') ? '#c080ff' : (COL[P.wpn && P.wpn.sword] || '#fff0c0');
  const rgb = h => { const n = parseInt(h.slice(1), 16); return RGB((n >> 16) & 255, (n >> 8) & 255, n & 255); };
  const free = () => !G.finisher && !P.latch && !P.whip && !(P.shieldUp && P.raise > 0.4) && !P.pistol && !P.bash;
  const held = () => !!(MB[0] || K.KeyJ || (typeof PAD !== 'undefined' && PAD.r2));
  const fw = () => ({ x: Math.cos(P.ang), y: Math.sin(P.ang) });
  const alive = e => e && e.alive && !e.hidden;
  function lineHits(len, wid, fn) {
    const f = fw(); const out = [];
    for (const e of G.enemies) {
      if (!alive(e)) continue; const dx = e.x - P.x, dy = e.y - P.y; const along = dx * f.x + dy * f.y; if (along < 0 || along > len + e.r) continue;
      const side = Math.abs(dx * -f.y + dy * f.x); if (side > wid + e.r) continue;
      if (e.z > P.z + 2.0 || e.z + e.h < P.z - 0.1) continue; if (!losTo(P.x, P.y, e.x, e.y)) continue; out.push(e);
    }
    if (fn) out.forEach(fn); return out;
  }
  function ring(r, dmg, kb, c, tag) {
    let n = 0;
    for (const e of G.enemies) {
      if (!alive(e)) continue; const dx = e.x - P.x, dy = e.y - P.y, d = Math.hypot(dx, dy); if (d - e.r > r) continue;
      if (e.z > P.z + 1.6 || e.z + e.h < P.z - 0.2) continue; if (!losTo(P.x, P.y, e.x, e.y)) continue;
      damageEnemy(e, dmg, { dx: dx / (d || 1), dy: dy / (d || 1), dz: 0.25, kb, heavy: true, src: 'sword', col: c }); n++;
      if (e.d && !e.d.boss && typeof e.poise === 'number') e.poise += 60;
    }
    const k = pn(18); for (let i = 0; i < k; i++) { const a = i / k * TAU; addP({ k: 'spark', x: P.x + Math.cos(a) * 0.5, y: P.y + Math.sin(a) * 0.5, z: P.z + 0.15, vx: Math.cos(a) * r * 3.2, vy: Math.sin(a) * r * 3.2, vz: 0.4, size: 0.05, col: rgb(c), life: 0.32 }); }
    dust(P.x, P.y, P.z, pn(8)); return n;
  }
  // ---------- travelling crescent ----------
  const WAVES = M.waves = [];
  function wave() {
    const f = fw(); WAVES.push({ x: P.x + f.x * 0.5, y: P.y + f.y * 0.5, z: P.z + 1.0, dx: f.x, dy: f.y, d: 0, hit: new Set(), c: col(), dmg: 14 * swMul() });
  }
  function tickWaves(dt) {
    for (let i = WAVES.length - 1; i >= 0; i--) {
      const w = WAVES[i]; const st = 9 * dt; w.x += w.dx * st; w.y += w.dy * st; w.d += st;
      if (w.d > 4.5 || SOLID[(w.y | 0) * MW + (w.x | 0)]) { sparks(w.x, w.y, w.z, pn(8), rgb(w.c)); WAVES.splice(i, 1); continue; }
      const nx = -w.dy, ny = w.dx, k = pn(3);
      for (let j = 0; j < k; j++) { const s = (j / Math.max(1, k - 1) - 0.5) * 1.3; addP({ k: 'spark', x: w.x + nx * s, y: w.y + ny * s, z: w.z + (0.25 - Math.abs(s) * 0.3), vx: w.dx * 1.5, vy: w.dy * 1.5, vz: 0, size: 0.06, col: rgb(w.c), life: 0.16 }); }
      for (const e of G.enemies) {
        if (!alive(e) || w.hit.has(e)) continue; if (Math.hypot(e.x - w.x, e.y - w.y) > 0.75 + e.r) continue; if (e.z > w.z + 1.2 || e.z + e.h < w.z - 1.0) continue;
        w.hit.add(e); damageEnemy(e, w.dmg, { dx: w.dx, dy: w.dy, dz: 0.2, kb: 1.4, heavy: false, src: 'sword', col: w.c });
      }
    }
  }
  // ---------- triple thrust ----------
  let thrust = null;
  function tickThrust(dt) {
    if (!thrust) return; thrust.t += dt;
    while (thrust.k < 3 && thrust.t >= thrust.k * 0.09) {
      const dmg = 10 * swMul(), c = thrust.c, f = fw();
      lineHits(2.7, 0.35, e => damageEnemy(e, dmg, { dx: f.x, dy: f.y, dz: 0.1, kb: 0.9, heavy: false, src: 'sword', col: c }));
      const k = pn(6); for (let i = 0; i < k; i++) { const d = 0.6 + i * 0.35; addP({ k: 'spark', x: P.x + f.x * d, y: P.y + f.y * d, z: P.z + 1.05, vx: f.x * 6, vy: f.y * 6, vz: 0, size: 0.045, col: rgb(c), life: 0.12 }); }
      SFX.play('swing', 0.5); thrust.k++;
    }
    if (thrust.k >= 3) thrust = null;
  }
  // ---------- lunge ----------
  let lunge = null, lungeCD = 0;
  function startLunge() {
    lunge = { t: 0 }; lungeCD = 0.8; cnt('lunge'); P.sw = { step: 0, t: 0.05, done: true, m20l: 1 }; SFX.swing(2);
    const f = fw(), c = col(), dmg = 20 * swMul();
    const hits = lineHits(2.4, 0.42, e => { damageEnemy(e, dmg, { dx: f.x, dy: f.y, dz: 0.2, kb: 2.2, heavy: true, src: 'sword', col: c }); });
    if (hits.length) { dmgNum(hits[0].x, hits[0].y, hits[0].z + hits[0].h + 0.5, 'RIPOSTE', c); G.hitstop = Math.max(G.hitstop || 0, 0.06); G.shake += 3; }
    const k = pn(10); for (let i = 0; i < k; i++) { const d = 0.4 + i * 0.22; addP({ k: 'spark', x: P.x + f.x * d, y: P.y + f.y * d, z: P.z + 1.0, vx: f.x * 4, vy: f.y * 4, vz: rand(-0.3, 0.3), size: 0.05, col: rgb(c), life: 0.18 }); }
    return hits.length;
  }
  function tickLunge(dt) {
    if (lungeCD > 0) lungeCD -= dt; if (!lunge) return; lunge.t += dt;
    const f = fw(); if (lunge.t < 0.16) moveEntity(P, f.x * 8.5 * dt, f.y * 8.5 * dt, PR, 0.33, false); else lunge = null;
  }
  // ---------- charge ----------
  const CH = M.ch = { t: 0, ready: false, hold: false, flash: 0 };
  const CHARGE = 0.5;
  function release() {
    CH.ready = false; CH.t = 0; CH.flash = 0.25; cnt('charged_' + fam());
    P.sw = { step: 2, t: 0, done: false, m20c: fam() }; SFX.swing(2); SFX.play('swingH', 0.9); rumbleFx && rumbleFx('parry');
  }
  // ---------- combo crush + marks (inside the real sword hit) ----------
  let chain = 0, chainT = 0;
  const _swordHit = swordHit;
  swordHit = function (step) {
    const sw = P.sw, c = sw && sw.m20c;
    const before = new Map(); for (const e of G.enemies) if (alive(e)) before.set(e, e.hp);
    let r;
    if (c) { const S = SWING[2], d0 = S.dmg, k0 = S.kb; S.dmg = d0 * 1.35; S.kb = k0 * 1.4; try { r = _swordHit.apply(this, arguments); } finally { S.dmg = d0; S.kb = k0; } }
    else r = _swordHit.apply(this, arguments);
    try {
      let landed = false;
      for (const [e, hp] of before) if (e.hp < hp || !e.alive) {
        landed = true;
      }
      if (c) {
        G.hitstop = Math.max(G.hitstop || 0, 0.07); G.shake += 5;
        if (c === 'wave') wave(); else if (c === 'slam') { ring(2.3, 16 * swMul(), 3.2, col(), 'slam'); SFX.play('heavy', 0.8); G.shake += 4; } else thrust = { t: 0, k: 0, c: col() };
        chain = 0;
      } else if (!sw || !sw.m20l) {
        if (landed && step === chain && chainT > 0) chain++; else if (landed && step === 0) chain = 1; else chain = 0;
        chainT = 1.0;
        if (step === 2 && chain >= 3) { chain = 0; cnt('crush'); const n = ring(1.6, 10 * swMul(), 2.4, col(), 'crush'); if (n) dmgNum(P.x + Math.cos(P.ang) * 1.2, P.y + Math.sin(P.ang) * 1.2, P.z + 1.6, 'CRUSH', col()); }
      }
    } catch (e) { M.err.push('hit ' + e); }
    return r;
  };
  // marks pop on the next melee hit of any kind (a quickdraw bolt staggers, so this is often a finisher)
  const _de = damageEnemy;
  damageEnemy = function (e, dmg, o) {
    const r = _de.apply(this, arguments);
    try {
      if (e && e.m20mark && e.m20mark > G.time && o && !o.m20m && /^(sword|finisher|bash)$/.test(o.src || '')) {
        e.m20mark = 0; cnt('mark_pop'); const f = fw();
        _de(e, 12 * swMul(), { dx: f.x, dy: f.y, dz: 0.3, kb: 2, heavy: true, src: 'sword', col: '#ffe080', m20m: 1 });
        dmgNum(e.x, e.y, e.z + e.h + 0.6, 'MARKED!', '#ffe080'); sparks(e.x, e.y, e.z + e.h * 0.6, pn(14), RGB(255, 230, 120));
      }
    } catch (err) { M.err.push('mark ' + err); }
    return r;
  };
  // ---------- quickdraw ----------
  if (typeof firePistol === 'function') {
    const _fp = firePistol;
    firePistol = function () {
      const quick = P.dodgeAge < ROLL_T + 0.35 && !P.pistol && P.hasPistol && !P.latch && (M.qdCD || 0) <= 0;
      const m0 = P.mana; const r = _fp.apply(this, arguments);
      try {
        if (quick && P.pistol && P.mana < m0) {
          P.mana = m0; M.qdCD = 0.9; cnt('quickdraw');
          const hits = typeof enemiesOnRay === 'function' ? enemiesOnRay(rayMarch(30).d, 0.25) : [];
          const e = hits[0] && hits[0].e; if (e && e.alive) { e.m20mark = G.time + 4; dmgNum(e.x, e.y, e.z + e.h + 0.45, 'QUICKDRAW', '#ffe080'); }
          else dmgNum(P.x + Math.cos(P.ang) * 1.5, P.y + Math.sin(P.ang) * 1.5, P.z + 1.4, 'QUICKDRAW', '#ffe080');
        }
      } catch (e) { M.err.push('qd ' + e); }
      return r;
    };
  }
  // ---------- shield rush ----------
  if (typeof bashResolve === 'function') {
    const _br = bashResolve;
    bashResolve = function () {
      const rush = P.dodgeAge < ROLL_T + 0.3;
      const before = new Map(); if (rush) for (const e of G.enemies) if (alive(e)) before.set(e, e.hp);
      const r = _br.apply(this, arguments);
      try {
        if (rush) {
          cnt('rush'); const f = fw(); moveEntity(P, f.x * 0.6, f.y * 0.6, PR, 0.33, false);
          lineHits(1.9, 0.6, e => { damageEnemy(e, 8, { dx: f.x, dy: f.y, dz: 0.2, kb: 4.5, heavy: true, src: 'bash', col: '#e0e8ff' }); if (e.alive && !e.d.boss) { e.stagger = Math.max(e.stagger || 0, 0.7); e.state = 'stagger'; e.st = 0; e.atk = null; } });
          dmgNum(P.x + f.x * 1.3, P.y + f.y * 1.3, P.z + 1.5, 'SHIELD RUSH', '#e0e8ff'); G.shake += 4; dust(P.x, P.y, P.z, pn(6));
        }
      } catch (e) { M.err.push('rush ' + e); }
      return r;
    };
  }
  // ---------- the per-frame driver ----------
  const _up = updatePlayer;
  updatePlayer = function (dt) {
    let wantLunge = false;
    try {
      if (G.state === 'play' && (MBP[0] || KP.KeyJ) && lungeCD <= 0 && P.dodgeAge > ROLL_T * 0.55 && P.dodgeAge < ROLL_T + 0.28 && free() && !(P.shieldUp && P.raise > 0.5)) {
        wantLunge = true; MBP[0] = false; delete KP.KeyJ;   // eat the press: the lunge replaces the first combo hit
      }
    } catch (e) { M.err.push('pre ' + e); }
    const r = _up.apply(this, arguments);
    try {
      if (M.qdCD > 0) M.qdCD -= dt; if (chainT > 0) { chainT -= dt; if (chainT <= 0) chain = 0; }
      if (wantLunge && !P.sw) startLunge();
      tickLunge(dt); tickThrust(dt); tickWaves(dt); CH.flash = Math.max(0, CH.flash - dt);
      // charge: hold attack once the current swing is over
      const h = held() && G.state === 'play' && free();
      if (h && !P.sw) { CH.t += dt; if (CH.t >= CHARGE && !CH.ready) { CH.ready = true; SFX.play('glint', 0.7); cnt('charge_ready'); } }
      else if (!h) { if (CH.ready && !P.sw && free() && G.state === 'play') release(); CH.t = 0; CH.ready = false; }
      else if (P.sw && !CH.ready) CH.t = 0;
      if (CH.t > 0.12 && !P.sw) { const k = Math.min(1, CH.t / CHARGE); P.vx *= 1 - 0.35 * k * Math.min(1, dt * 20); P.vy *= 1 - 0.35 * k * Math.min(1, dt * 20); }
      if (CH.ready && Math.random() < dt * (low() ? 6 : 14)) { const f = fw(); addP({ k: 'spark', x: P.x + f.x * 0.7 + rand(-0.15, 0.15), y: P.y + f.y * 0.7 + rand(-0.15, 0.15), z: P.z + 0.9 + rand(0, 0.4), vx: 0, vy: 0, vz: rand(0.6, 1.4), size: 0.035, col: rgb(col()), life: 0.35 }); }
    } catch (e) { M.err.push('post ' + e); if (M.err.length > 20) M.err.shift(); }
    return r;
  };
  // ---------- HUD: charge ring at the crosshair (only while charging) ----------
  window.M8DRAW = window.M8DRAW || [];
  M8DRAW.push(function (ctx) {
    if (G.state !== 'play' || (CH.t < 0.12 && CH.flash <= 0)) return false;
    const k = CH.flash > 0 ? 1 : Math.min(1, CH.t / CHARGE), cx = W / 2, cy = H / 2 + 14, r = 7;
    ctx.save(); ctx.globalAlpha = CH.flash > 0 ? CH.flash * 4 : 0.85;
    ctx.strokeStyle = 'rgba(20,8,30,0.8)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.stroke();
    ctx.strokeStyle = CH.ready || CH.flash > 0 ? col() : '#c8b8e0'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + TAU * k); ctx.stroke();
    if (CH.ready) text(ctx, { wave: 'WAVE', slam: 'SLAM', thrust: 'THRUST' }[fam()], cx, cy + 10, col(), 'center');
    ctx.restore(); return true;
  });
  // ---------- onboarding: one card per save that names the new moves ----------
  try {
    const _ns = typeof stageIntro === 'function' ? stageIntro : null;
    if (_ns) stageIntro = function () {
      const r = _ns.apply(this, arguments);
      try { if (typeof SAVE !== 'undefined' && RUN.stage === 1 && !(SAVE.m20f && SAVE.m20f.movesTip)) { SAVE.m20f = SAVE.m20f || {}; SAVE.m20f.movesTip = 1; if (typeof writeSave === 'function') writeSave();
        setTimeout(() => { if (G.state === 'play') toast('NEW: HOLD ATTACK TO CHARGE', 'Release for your weapon\'s special. Attack out of a roll to LUNGE. Shoot out of a roll: QUICKDRAW.', '#ffe080', 6); }, 4200); } } catch (e) { }
      return r;
    };
  } catch (e) { }
  M.st = () => ({ fam: fam(), n: Object.assign({}, M.n), waves: WAVES.length, err: M.err.slice() });
})();
