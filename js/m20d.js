'use strict';
// ===== m20d: ABYSS ARMS - THE VOID CROSSBOW + THE VOID HALBERD =====
// Abyss-only legendary loot on the same path as THE VOID REAVER (abyss:true, ok() needs RUN.won, weighted in by m7 rollChoices).
// Art: the approved crossbow / storm-halberd viewmodels and hands are reused untouched; the void look is additive overlays,
// world particles, rift decals and a violet bolt streak. Not sold at the altar. Saves: only the Codex "found" flag (m11arm) + run mods.
// Kill switch ?voidarms=0 (nothing registered). Debug: M20.voidArms.give('xbow'|'hal') puts one in your hands.
(function () {
  const M20 = window.M20 || (window.M20 = {});
  if (/[?&]voidarms=0/.test(location.search) || typeof UPG === 'undefined' || typeof rollChoices !== 'function' || typeof m7Rift !== 'function') { M20.voidarms = false; return; }
  M20.voidarms = true;
  const errs = []; const ER = (w, e) => { if (errs.length < 20) errs.push(w + ': ' + ((e && e.message) || e)); };
  const VC = RGB(190, 90, 255), VG = RGB(110, 255, 200);
  const hasXB = () => !!(P.mods && P.mods.voidxb && P.wpn && P.wpn.ranged === 'crossbow');
  const hasHal = () => !!(P.mods && P.mods.voidhal && P.wpn && P.wpn.sword === 'storm');
  const SWORDMODS = ['m20halberd', 'm20trident', 'm20spade', 'm20maul', 'm20forge'];

  // ---------- the two weapons ----------
  const XBV = { id: 'xbowvoid', kind: 'WEAPON', r: 'legendary', name: 'THE VOID CROSSBOW', icon: 'ic_xbowvoid', abyss: true,
    desc: 'ABYSS-FORGED. Bolts brand each foe for +14 VOID dmg and tear a VOID RIFT where they stop (30 dmg).',
    ok: () => !!RUN.won && !P.mods.voidxb,
    take() { P.hasPistol = true; P.wpn.ranged = 'crossbow'; P.mods.voidxb = 1; P.mana = P.maxmana; } };
  const HAL = { id: 'voidhalberd', kind: 'WEAPON', r: 'legendary', name: 'THE VOID HALBERD', icon: 'ic_voidhalberd', abyss: true,
    desc: 'ABYSS-FORGED. +30% damage. Heavy strikes REAP all in front (32 dmg) and drag them in. Kills heal 2.',
    ok: () => !!RUN.won && !(P.mods.voidhal && P.wpn.sword === 'storm'),
    take() { P.wpn.sword = 'storm'; P.mods.voidhal = 1; for (const k of SWORDMODS) P.mods[k] = 0; } };
  // any other sword-slot weapon replaces the halberd's void (ranged upgrades keep the void crossbow: still a crossbow)
  const swordSlot = u => u && u.kind === 'WEAPON' && !/whip/.test(u.id) && !(u.id === 'crossbow' || /^xbow/.test(u.id)) && (!u.slot || u.slot === 'sword');
  for (const u of UPG) {
    if (!swordSlot(u) || !u.take) continue;
    const t0 = u.take; u.take = function () { const r = t0.apply(this, arguments); try { if (P.mods) P.mods.voidhal = 0; } catch (e) { } return r; };
  }
  if (M20.takeItem) { const _ti = M20.takeItem; M20.takeItem = function (key) { const r = _ti.apply(this, arguments); try { const I = M20.FITEMS && M20.FITEMS[key]; if (I && I.slot === 'sword' && P.mods) P.mods.voidhal = 0; } catch (e) { ER('takeItem', e); } return r; }; }
  const at = UPG.findIndex(u => u.id === 'voidreaver'); UPG.splice(at < 0 ? UPG.length : at + 1, 0, XBV, HAL);

  // ---------- damage ----------
  const _dmgIn = rogueDmgIn;
  rogueDmgIn = function (e, dmg, o) {
    dmg = _dmgIn(e, dmg, o);
    try { if (o && !o.dot && (o.src === 'sword' || o.src === 'finisher') && hasHal()) dmg *= 1.3; } catch (er) { ER('dmgIn', er); }
    return dmg;
  };
  let reapT = -9;
  const _onHit = rogueOnHit;
  rogueOnHit = function (e, o, dmg) {
    _onHit(e, o, dmg);
    try {
      if (!o || o.dot || o.va || !hasHal() || o.src !== 'sword' || !o.heavy || G.t - reapT < 0.35) return;
      reapT = G.t; G.shake += 3; SFX.play('swingH', 0.7); SFX.play('ghost', 0.35);
      for (const q of G.enemies) {
        if (!q.alive || q.hidden) continue;
        const dx = q.x - P.x, dy = q.y - P.y, d = Math.hypot(dx, dy); if (d > 3.2 || d < 0.05) continue;
        if (Math.abs(angDiff(Math.atan2(dy, dx), P.ang)) > 0.9) continue;
        damageEnemy(q, 32, { dx: -dx, dy: -dy, kb: q.d && q.d.boss ? 0 : 2.2, src: 'bash', va: 1, col: '#c890ff' });
        for (let i = 0; i < 6; i++) addP({ k: 'ecto', x: q.x, y: q.y, z: q.z + q.h * 0.55, vx: -dx / d * rand(2, 4) + rand(-1, 1), vy: -dy / d * rand(2, 4) + rand(-1, 1), vz: rand(0, 1.5), size: 0.06, col: i % 3 ? VC : VG, life: 0.4 });
      }
      // the crescent itself: a violet arc of motes swept across the cone
      for (let i = 0; i < 26; i++) { const a = P.ang - 0.9 + 1.8 * (i / 25), r = rand(1.6, 2.6); addP({ k: 'ecto', x: P.x + Math.cos(a) * r, y: P.y + Math.sin(a) * r, z: P.z + rand(0.6, 1.1), vx: Math.cos(a + 1.57) * 3, vy: Math.sin(a + 1.57) * 3, vz: 0, size: 0.07, col: i % 4 ? VC : VG, life: 0.32 }); }
    } catch (er) { ER('reap', er); }
  };
  const _onKill = rogueOnKill;
  rogueOnKill = function (e) { _onKill(e); try { if (hasHal()) P.hp = Math.min(P.maxhp, P.hp + 2); } catch (er) { ER('kill', er); } };

  // ---------- the void crossbow shot ----------
  let riftT = -9;
  const _fc = fireCrossbow;
  fireCrossbow = function () {
    if (!hasXB()) return _fc.apply(this, arguments);
    const before = P.pistol; let wall = null, hits = [];
    try { wall = rayMarch(30); hits = enemiesOnRay(wall.d, 0.2).slice(0, 4).map(h => h.e); } catch (er) { ER('aim', er); }
    const nb = typeof BOLTS !== 'undefined' ? BOLTS.length : 0;
    const r = _fc.apply(this, arguments);
    try {
      if (!P.pistol || P.pistol === before || !wall) return r;
      const a = aimVec();
      for (const e of hits) if (e.alive) { damageEnemy(e, 14, { src: 'magic', dot: true, va: 1, col: '#c890ff', kb: 0 }); for (let i = 0; i < 5; i++) addP({ k: 'ecto', x: e.x, y: e.y, z: e.z + e.h * 0.6, vx: rand(-2, 2), vy: rand(-2, 2), vz: rand(0, 2), size: 0.06, col: VC, life: 0.4 }); }
      const end = hits.length ? hits[hits.length - 1] : null, ex = end ? end.x : wall.x - a.x * 0.3, ey = end ? end.y : wall.y - a.y * 0.3;
      if (G.t - riftT > 0.3) { riftT = G.t; m7Rift(ex, ey, 0.3, 30, 1.5, null, true); }
      if (typeof BOLTS !== 'undefined') for (let i = nb; i < BOLTS.length; i++) { BOLTS[i].col = '#b060ff'; BOLTS[i].va = 1; }
      const L = Math.min(wall.d, 14); for (let s = 0.8; s < L; s += 0.9) addP({ k: 'ecto', x: P.x + a.x * s, y: P.y + a.y * s, z: eyeZ() - 0.25 + a.z * s, vx: rand(-0.3, 0.3), vy: rand(-0.3, 0.3), vz: rand(-0.2, 0.4), size: 0.045, col: Math.random() < 0.25 ? VG : VC, life: rand(0.3, 0.55) });
    } catch (er) { ER('fire', er); }
    return r;
  };

  // ---------- viewmodel overlays (additive, drawn on top; hand / sprite pixels untouched) ----------
  const _sb = stormBlade;
  stormBlade = function (ctx, X, Y, R, S, t) {
    _sb.apply(this, arguments);
    if (!hasHal()) return;
    try {
      const amt = P.sw ? 1 : 0.55, pose = [X, Y, R, S / VSC];
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      // a void-green edge glint that crawls up the head of the polearm + a violet core along the upper blade
      const g = (t * 0.7) % 1, p = tipOf(pose, 0.35 + g * 0.62);
      ctx.globalAlpha = 0.75 * Math.sin(g * Math.PI) * amt; ctx.fillStyle = '#a0ffd0'; ctx.fillRect(Math.round(p[0]) - 3, Math.round(p[1]), 7, 1); ctx.fillRect(Math.round(p[0]), Math.round(p[1]) - 3, 1, 7);
      const a = tipOf(pose, 0.38), b = tipOf(pose, 0.97);
      for (const [w, c, al] of [[6, '#6020c0', 0.16], [2, '#c070ff', 0.28]]) { ctx.globalAlpha = al * amt; ctx.strokeStyle = c; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); }
      ctx.restore();
      if (Math.random() < 0.4 * amt && VMP.length < 140) { const q = tipOf(pose, rand(0.4, 0.98)); VMP.push({ x: q[0] + rand(-3, 3), y: q[1] + rand(-3, 3), vx: rand(-8, 8), vy: rand(6, 18), life: rand(0.3, 0.6), t: 0, c: Math.random() < 0.3 ? '#90ffd0' : '#b070ff' }); }
    } catch (er) { ER('blade', er); }
  };
  const _dc = drawCrossbow;
  drawCrossbow = function (ctx, bx, by, t) {
    _dc.apply(this, arguments);
    if (!hasXB() || !P.pistol) return;
    try {
      const pt = P.pistol.t, raise = Math.min(1, pt / 0.06), lower = clamp((pt - 0.62) / 0.18, 0, 1), kick = Math.max(0, 1 - pt / 0.14);
      const x = Math.round(W / 2 - 128 + bx * 0.7), y = Math.round(H - 168 + by * 0.6 + (1 - raise) * 70 + lower * 150 - kick * 12);
      const cx = x + 116, cy = y + 30, pulse = 0.5 + 0.5 * Math.sin(G.t * 6);
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const gr = ctx.createRadialGradient(cx, cy, 2, cx, cy, 46); gr.addColorStop(0, 'rgba(200,120,255,' + (0.32 + 0.18 * kick) + ')'); gr.addColorStop(0.5, 'rgba(120,40,220,' + (0.12 + 0.06 * pulse) + ')'); gr.addColorStop(1, 'rgba(60,0,120,0)');
      ctx.fillStyle = gr; ctx.fillRect(cx - 46, cy - 46, 92, 92);
      if (kick > 0) { ctx.globalAlpha = kick; ctx.fillStyle = '#a0ffd0'; ctx.fillRect(cx - 1, y - 10, 3, 40); }
      ctx.restore();
      if (Math.random() < 0.5 && VMP.length < 140) { const side = Math.random() < 0.5 ? -1 : 1; VMP.push({ x: cx + side * rand(70, 96), y: y + rand(78, 104), vx: rand(-6, 6), vy: rand(-22, -6), life: rand(0.3, 0.6), t: 0, c: Math.random() < 0.3 ? '#90ffd0' : '#b070ff' }); }
    } catch (er) { ER('xbview', er); }
  };
  // run HUD: the owned-weapon chips show the void icons
  if (typeof drawRunHUD === 'function' && typeof drawIcon === 'function') {
    let inHud = false; const _di = drawIcon;
    drawIcon = function (ctx, name, cx, cy, mw, mh) { if (inHud) { if (name === 'ic_stormsword' && hasHal()) name = 'ic_voidhalberd'; else if (name === 'ic_crossbow' && hasXB()) name = 'ic_xbowvoid'; } return _di.call(this, ctx, name, cx, cy, mw, mh); };
    const _hud = drawRunHUD; drawRunHUD = function (ctx) { inHud = true; try { return _hud.apply(this, arguments); } finally { inHud = false; } };
  }
  // Codex armory flavour (rows come from UPG automatically; m11d keeps its flavour table private)
  const FLV = { xbowvoid: 'Strung with something that was never a sinew. The bolt arrives a moment before it is loosed.', voidhalberd: 'The storm in its blade went quiet in the Abyss. What answers now is older, and hungrier.' };
  if (typeof M9 !== 'undefined' && M9.armoryRows) { const _ar = M9.armoryRows; M9.armoryRows = function () { return _ar.apply(this, arguments).map(r => (r && r.w && FLV[r.w.id] && !r.w.fl) ? { w: Object.assign({}, r.w, { fl: FLV[r.w.id] }) } : r); }; }
  if (M20.POWER) { M20.POWER.xbowvoid = ['RANGED - VOID RIFTS', 'III']; M20.POWER.voidhalberd = ['LEGENDARY - REAP', 'III']; }

  M20.voidArms = {
    ids: ['xbowvoid', 'voidhalberd'], errs,
    give(k) { const u = k === 'xbow' ? XBV : HAL; u.take(); if (RUN.picks && !RUN.picks.includes(u.id)) RUN.picks.push(u.id); return u.id; },
    st: () => ({ on: true, xb: hasXB(), hal: hasHal(), errs: errs.slice(0, 5) }),
  };
})();
