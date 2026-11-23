// ===== m10a: "a little harder on the regular stages, 3 awesome crossbows that get better the further you get, a fire sword" =====
// 1) HARDER REGULAR STAGES: on top of m9n's curve, regular foes hit +12%, have +10% HP, re-engage 7% sooner, move 3% faster and bring
//    a pack-mate 6 points more often. Bosses, anything a boss summons, the Abyss and the health vials are untouched (m9n's own guards).
//    ?m10hard=0 turns this part off (used by the identity checks).
// 2) THE CROSSBOW LINE (the Gothic Crossbow is tier I, untouched - same art, same numbers, same code path):
//      II  HELLFORGE ARBALEST  - offered from stage 4: 52 dmg, pierces 4, every bolt sets foes ablaze, the bolt bursts in fire (14) where it lands
//      III THE DAWNBRINGER     - offered from stage 7: 68 dmg, pierces 6, holy smite burst (24 around each foe it pierces), x1.5 vs the dead-that-walk
//    Same 0.8 s cycle, same mana cost, same raise/kick/reload animation; new art (recoloured + rebuilt from the tier I sprite) and overlay FX.
// 3) EMBERBRAND, THE HELLFORGE BLADE: +20% damage, every sword hit sets foes ablaze, heavy strikes erupt in a fire burst (22 around the foe).
//    Found in runs from stage 2; START: EMBERBRAND loadout at the altar. Living flames along the blade are an overlay (own PRNG).
(function () {
  const M10 = window.M10 = { v: 'm10a', hardOff: /[?&]m10hard=0/.test(location.search), log: [] };
  let sd = 424242; const fr = () => (sd = (sd * 16807) % 2147483647) / 2147483647, fa = (a, b) => a + (b - a) * fr();   // visual-only PRNG
  const TAU2 = Math.PI * 2;

  // ---------- 1) difficulty ----------
  if (window.M9N && !M10.hardOff) {
    const N = M9N, d0 = N.dmgX, h0 = N.hpX, s0 = N.spdX, c0 = N.cdX, p0 = N.packP;
    N.dmgX = n => d0(n) * 1.12; N.hpX = n => h0(n) * 1.10; N.spdX = n => Math.min(1.19, s0(n) * 1.03); N.cdX = n => c0(n) * 0.93; N.packP = n => Math.min(0.58, p0(n) + 0.06);
    M10.hard = true;
  }

  // ---------- 2) crossbow tiers ----------
  const tierOf = () => (P.wpn && P.wpn.ranged === 'crossbow') ? (P.wpn.xbt || 1) : 0;
  M10.tierOf = tierOf;
  const TIERS = {
    2: { name: 'HELLFORGE ARBALEST', dmg: 52, pierce: 4, col: '#ff8a30', spark: [255, 150, 40], pal: ['#ff4a00', '#ffb040', '#fff0a0'] },
    3: { name: 'THE DAWNBRINGER', dmg: 68, pierce: 6, col: '#fff0a0', spark: [255, 240, 170], pal: ['#ffe070', '#ffffff', '#60ffb0'] },
  };
  M10.TIERS = TIERS;
  const XBW = [
    { id: 'xbow2', kind: 'WEAPON', r: 'epic', name: 'HELLFORGE ARBALEST', icon: 'ic_crossbow2', desc: 'Crossbow II. 52 dmg bolts that pierce 4 foes and set them ablaze; each bolt bursts in fire where it lands. Replaces your ranged weapon.',
      ok: () => RUN.stage >= 4 && tierOf() < 2, take() { P.hasPistol = true; P.wpn.ranged = 'crossbow'; P.wpn.xbt = 2; P.mana = P.maxmana; } },
    { id: 'xbow3', kind: 'WEAPON', r: 'legendary', name: 'THE DAWNBRINGER', icon: 'ic_crossbow3', desc: 'Crossbow III, the ultimate. 68 dmg holy bolts pierce 6 foes; a smite bursts around each one (24). x1.5 vs the undead. Replaces your ranged weapon.',
      ok: () => RUN.stage >= 7 && tierOf() < 3, take() { P.hasPistol = true; P.wpn.ranged = 'crossbow'; P.wpn.xbt = 3; P.mana = P.maxmana; } },
  ];
  UPG.push(...XBW);
  // they show up as you go deeper (tier II from stage 4, tier III from stage 7)
  const _roll = rollChoices;
  rollChoices = function (mini) {
    const out = _roll(mini); if (mini) return out;
    const want = RUN.stage >= 7 && tierOf() < 3 ? XBW[1] : RUN.stage >= 4 && tierOf() < 2 ? XBW[0] : null;
    if (want && want.ok() && !out.includes(want) && Math.random() < 0.5) { let i = out.findIndex((u, k) => u.kind === 'WEAPON' && k > 0); if (i < 0) i = out.length - 1; if (out.length < 3) out.push(want); else out[i] = want; }
    return out;
  };
  const UNDEAD = /zombie|skel|ghost|wraith|lich|bone|colossus|knight|acolyte|saint|revenant|mummy|ghoul/;
  function fireTier(T, n) {
    const cost = Math.max(2, 6 - 2 * ((P.mods && P.mods.quiver) || 0));
    if (!P.hasPistol || P.pistol || P.mana < cost || P.latch) return;
    P.mana -= cost; P.pistol = { t: 0, dur: 0.8, xb: 1, tier: n };
    SFX.ev('xbow_fire', 1, ['whip', 'swingH', 'clink']); SFX.play('whip', 0.9); SFX.play('swingH', 0.8); SFX.play('clink', 0.6); if (n === 2) SFX.play('fire', 0.7); else SFX.play('glint', 0.8);
    G.shake += n === 3 ? 4 : 3.4; P.kick += n === 3 ? 7 : 6.5; rumbleFx('whip');
    const a = aimVec(); const wall = rayMarch(30);
    const pierce = T.pierce + ((P.mods && P.mods.quiver) ? 1 : 0);
    const hits = enemiesOnRay(wall.d, 0.22).slice(0, pierce);
    const ez = eyeZ() - 0.25;
    hits.forEach((h, i) => {
      const e = h.e; const und = n === 3 && UNDEAD.test(e.type || '') ? 1.5 : 1;
      damageEnemy(e, T.dmg * und * (P.punish > 0 ? 2 : 1) * ((P.mods && P.mods.ranged) || 1) * (i ? 0.85 : 1), { dx: a.x, dy: a.y, dz: 0.15, kb: 2.8, heavy: true, src: 'pistol', col: T.col });
      if (e.alive && !e.d.boss) { e.stagger = Math.max(e.stagger, 0.6); e.state = 'stagger'; e.st = 0; e.atk = null; }
      if (n === 2 && e.alive) { if (!(e.burnT > 0)) dmgNum(e.x, e.y, e.z + e.h + 0.35, 'BURN', '#ff9a30'); e.burnT = 3; e.burnTick = e.burnTick || 0; }
      if (n === 3) smite(e.x, e.y, e.z + e.h * 0.5, e, 24, 1.4);
      spray(e.x, e.y, e.z + e.h * 0.55, a.x, a.y, 0.3, 26, 4, 0.4, e.d.mat, 1.15);
    });
    if (P.punish > 0 && hits.length) P.punish = 0;
    SFX.ev('bolt_impact', hits.length ? 0.85 : 0.65);
    if (!hits.length || hits.length < pierce) { const wx = wall.px || wall.x, wy = wall.py || wall.y; if (!hitCracked(wall.x, wall.y)) sparks(wx, wy, wall.z, 16, RGB(T.spark[0], T.spark[1], T.spark[2])); if (n === 2) fireBurst(wx - a.x * 0.3, wy - a.y * 0.3, wall.z, null, 14, 1.2); }
    addBolt(P.x + a.x * 0.6, P.y + a.y * 0.6, ez, wall.x, wall.y, wall.z, T.col, n === 3 ? 1 : 0.85); BOLTS[BOLTS.length - 1].straight = true; BOLTS[BOLTS.length - 1].dur = 0.14; BOLTS[BOLTS.length - 1].m10 = n;
    M10.flash = { t: 0, n };
  }
  function fireBurst(x, y, z, skip, dmg, R) {
    for (let i = 0; i < 26; i++) addP({ k: 'ember', x, y, z: z + 0.3, vx: rand(-3.5, 3.5), vy: rand(-3.5, 3.5), vz: rand(0.6, 3.4), size: rand(0.04, 0.08), col: [RGB(255, 240, 140), RGB(255, 140, 30), RGB(255, 60, 20)][i % 3], life: rand(0.3, 0.7) });
    addP({ k: 'impact', x, y, z: z + 0.4, life: 0.2, max: 0.2, sz: R * 1.3, col: [255, 120, 30] });
    for (const o of G.enemies) if (o !== skip && o.alive && !o.hidden && Math.hypot(o.x - x, o.y - y) < R) { damageEnemy(o, dmg, { dot: true, src: 'burn', col: '#ffb040' }); if (o.alive) o.burnT = Math.max(o.burnT || 0, 2); }
    M10.burst && M10.burst(x, y, z + 0.4, 'fire', R);
  }
  function smite(x, y, z, skip, dmg, R) {
    for (let i = 0; i < 18; i++) { const an = i / 18 * TAU2; addP({ k: 'spark', x, y, z, vx: Math.cos(an) * 4, vy: Math.sin(an) * 4, vz: rand(-0.5, 1.5), size: 0.05, col: i % 2 ? RGB(255, 240, 170) : RGB(160, 255, 210), life: 0.4 }); }
    for (const o of G.enemies) if (o !== skip && o.alive && !o.hidden && Math.hypot(o.x - x, o.y - y) < R) damageEnemy(o, dmg, { dx: o.x - x, dy: o.y - y, kb: 2, src: 'smite', col: '#fff0a0' });
    M10.burst && M10.burst(x, y, z, 'holy', R);
  }
  M10.fireBurst = fireBurst; M10.smite = smite;
  const _fc = fireCrossbow;
  fireCrossbow = function () { const n = tierOf(); if (n >= 2 && TIERS[n]) return fireTier(TIERS[n], n); return _fc.apply(this, arguments); };
  // art swap while the crossbow is drawn (tier I: nothing swapped, nothing added)
  const SW = { 2: null, 3: null };
  const alias = (to, from) => { if (!Engine.imgs[to] && Engine.imgs[from]) { Engine.imgs[to] = Engine.imgs[from]; if (Engine.tex[from]) Engine.tex[to] = Engine.tex[from]; } };
  let XBN = 0;
  const _xfx = window.xbowFX;
  if (_xfx) window.xbowFX = function (ctx, t, name, kick) { if (XBN) { name = name === 'vm_crossbow' ? 'vm_crossbow_t' + XBN : name === 'vm_crossbow_empty' ? 'vm_crossbow_empty_t' + XBN : name; } return _xfx.call(this, ctx, t, name, kick); };
  const XP = [];   // tier FX particles (screen space)
  let lastT = 0;
  const _dc = drawCrossbow;
  drawCrossbow = function (ctx, bx, by, t) {
    const n = tierOf(); if (n < 2) return _dc.apply(this, arguments);
    const I = Engine.imgs, keep = [I.vm_crossbow, I.vm_crossbow_empty, I.vm_crossbow_glow];
    for (const s of ['', '_empty']) alias('vm_crossbow' + s + '_t' + n + '_sheen', 'vm_crossbow' + s + '_sheen');
    if (!I['vm_crossbow_t' + n] || !I['vm_crossbow_t' + n].width) return _dc.apply(this, arguments);
    I.vm_crossbow = I['vm_crossbow_t' + n]; I.vm_crossbow_empty = I['vm_crossbow_empty_t' + n]; I.vm_crossbow_glow = I['vm_crossbow_glow_t' + n];
    XBN = n;
    try { _dc.apply(this, arguments); } finally { I.vm_crossbow = keep[0]; I.vm_crossbow_empty = keep[1]; I.vm_crossbow_glow = keep[2]; XBN = 0; }
    tierFX(ctx, bx, by, t, n);
  };
  function tierFX(ctx, bx, by, t, n) {
    if (typeof FX !== 'undefined' && !FX.on) return;
    const pt = P.pistol.t, raise = Math.min(1, pt / 0.06), lower = clamp((pt - 0.62) / 0.18, 0, 1), kick = Math.max(0, 1 - pt / 0.14);
    const x = Math.round(W / 2 - 128 + bx * 0.7), y = Math.round(H - 168 + by * 0.6 + (1 - raise) * 70 + lower * 150 - kick * 12 + Math.sin(pt * 40) * kick * 2);
    const now = performance.now() / 1000, dt = Math.min(0.05, Math.max(0, now - lastT)); lastT = now;
    const T = TIERS[n];
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    if (n === 3) {   // the Dawnbringer: slow sunburst behind the skull, light motes rising off the wings
      const cx = x + 116, cy = y + 128;
      for (let i = 0; i < 12; i++) { const an = t * 0.4 + i * TAU2 / 12, l = 30 + 10 * Math.sin(t * 2 + i); ctx.globalAlpha = 0.10 + 0.05 * Math.sin(t * 3 + i); ctx.fillStyle = i % 2 ? '#fff0a0' : '#ffffff';
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(an - 0.06) * l, cy + Math.sin(an - 0.06) * l * 0.8); ctx.lineTo(cx + Math.cos(an + 0.06) * l, cy + Math.sin(an + 0.06) * l * 0.8); ctx.closePath(); ctx.fill(); }
      const g = ctx.createRadialGradient(cx, cy - 20, 2, cx, cy - 20, 26); g.addColorStop(0, 'rgba(255,240,170,0.45)'); g.addColorStop(1, 'rgba(255,240,170,0)'); ctx.globalAlpha = 0.6 + 0.3 * Math.sin(t * 2.2); ctx.fillStyle = g; ctx.fillRect(cx - 30, cy - 50, 60, 60);
      if (fr() < dt * 22) { const s = fr() < 0.5 ? -1 : 1; XP.push({ x: x + 116 + s * fa(30, 75), y: y + fa(115, 150), vx: s * fa(2, 10), vy: fa(-30, -12), t: 0, life: fa(0.6, 1.2), c: fr() < 0.5 ? '#fff4c0' : '#80ffc8', sz: fr() < 0.3 ? 2 : 1 }); }
    } else {         // Hellforge: heat glow pulsing from the molten carvings, embers drifting up
      const g = ctx.createRadialGradient(x + 116, y + 130, 4, x + 116, y + 130, 70); g.addColorStop(0, 'rgba(255,90,10,0.30)'); g.addColorStop(1, 'rgba(255,60,0,0)');
      ctx.globalAlpha = 0.5 + 0.35 * Math.sin(t * 4.3) + kick * 0.5; ctx.fillStyle = g; ctx.fillRect(x + 40, y + 60, 152, 128);
      if (fr() < dt * 34) XP.push({ x: x + fa(20, 212), y: y + fa(40, 180), vx: fa(-8, 8), vy: fa(-46, -18), t: 0, life: fa(0.4, 0.9), c: fr() < 0.4 ? '#ffd060' : fr() < 0.7 ? '#ff7a20' : '#ff3a10', sz: fr() < 0.25 ? 2 : 1 });
    }
    if (kick > 0) {   // tier muzzle: fire bloom / sunflash at the bolt tip
      const mx = x + 116, my = y - 4, k = kick;
      ctx.globalAlpha = 0.85 * k; ctx.fillStyle = n === 3 ? '#fff6d0' : '#ffb040';
      ctx.beginPath(); ctx.ellipse(mx, my, 10 + 26 * (1 - k), 6 + 10 * (1 - k), 0, 0, TAU2); ctx.fill();
      ctx.globalAlpha = 0.5 * k; ctx.fillStyle = n === 3 ? '#80ffc8' : '#ff3a00'; ctx.fillRect(mx - 30 * (1 - k) - 10, my - 1, 20 + 60 * (1 - k), 3);
      if (n === 3) { ctx.fillRect(mx - 1, my - 26 - 30 * (1 - k), 3, 52 + 60 * (1 - k)); }
      if (fr() < 0.7) for (let i = 0; i < 4; i++) XP.push({ x: mx + fa(-6, 6), y: my + fa(-4, 4), vx: fa(-70, 70), vy: fa(-90, 10), t: 0, life: fa(0.2, 0.45), c: T.pal[(fr() * 3) | 0], sz: 2 });
    }
    for (let i = XP.length - 1; i >= 0; i--) { const p = XP[i]; p.t += dt; if (p.t > p.life) { XP.splice(i, 1); continue; } p.x += p.vx * dt; p.y += p.vy * dt; ctx.globalAlpha = 1 - p.t / p.life; ctx.fillStyle = p.c; ctx.fillRect(Math.round(p.x), Math.round(p.y), p.sz, p.sz); }
    if (XP.length > 160) XP.splice(0, XP.length - 160);
    ctx.restore();
  }
  // bolts in flight get the tier colour core (m9b's helix stays as it is)
  const _db = drawBolts;
  drawBolts = function (ctx, cam, rdt) {
    const ours = BOLTS.filter(b => b.m10).map(b => ({ b, t: b.t }));
    _db(ctx, cam, rdt);
    if (!ours.length || typeof project !== 'function') return;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (const { b, t } of ours) { const k = Math.min(1, t / (b.dur || 0.14)); const p0 = project(cam, b.a[0], b.a[1], b.a[2]), p1 = project(cam, b.b[0], b.b[1], b.b[2]); if (!p0 || !p1) continue;
      ctx.globalAlpha = 0.9 * (1 - k); ctx.strokeStyle = b.m10 === 3 ? '#fff6d0' : '#ffb040'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(p0.x, p0.y); ctx.lineTo(p1.x, p1.y); ctx.stroke();
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(p0.x, p0.y); ctx.lineTo(p1.x, p1.y); ctx.stroke(); }
    ctx.restore();
  };
  // HUD: the right crossbow icon
  const swapIcon = (fn) => function () { const n = tierOf(); if (n < 2 || !Engine.imgs['ic_crossbow' + n]) return fn.apply(this, arguments); const k = Engine.imgs.ic_crossbow; Engine.imgs.ic_crossbow = Engine.imgs['ic_crossbow' + n]; try { return fn.apply(this, arguments); } finally { Engine.imgs.ic_crossbow = k; } };
  drawHUD = swapIcon(drawHUD); drawRunHUD = swapIcon(drawRunHUD);

  // ---------- 3) EMBERBRAND ----------
  SWSPR.fire = ['vm_sword_fire', 'vm_sword_fire_glow']; SWTRAIL.fire = ['#ff5a10', '#ffe0a0']; SWDMG.fire = 1.2;
  UPG.push({ id: 'firesword', kind: 'WEAPON', r: 'epic', name: 'EMBERBRAND, THE HELLFORGE BLADE', icon: 'ic_firesword', desc: '+20% damage. Every hit sets foes ablaze (burn 24 over 3s). Heavy strikes erupt in a FIRE BURST (22 dmg to all around the foe).',
    ok: () => RUN.stage >= 2 && P.wpn.sword !== 'fire', take() { P.wpn.sword = 'fire'; } });
  if (typeof ALTAR !== 'undefined') { const it = { tab: 2, id: 'ld_ember', slot: 'sword', val: 'fire', need: 'firesword', cost: 180, name: 'START: EMBERBRAND', icon: 'ic_firesword' }; const at = ALTAR.items.findIndex(q => q.tab > 2); ALTAR.items.splice(at < 0 ? ALTAR.items.length : at, 0, it); }
  const _oh = rogueOnHit;
  rogueOnHit = function (e, o, dmg) {
    _oh(e, o, dmg);
    if (o.dot || o.cleave || !e || P.wpn.sword !== 'fire') return;
    if (!(o.src === 'sword' || o.src === 'finisher')) return;
    if (e.alive) { if (!(e.burnT > 0)) dmgNum(e.x, e.y, e.z + e.h + 0.35, 'BURN', '#ff9a30'); e.burnT = 3; e.burnTick = e.burnTick || 0; }
    if (o.heavy && G.t - (P.emberT || -9) > 0.3) { P.emberT = G.t; fireBurst(e.x, e.y, e.z + e.h * 0.3, e, 22, 1.6); SFX.play('fire', 0.8); G.shake += 2; }
  };
  const _rh = drawRunHUD;
  drawRunHUD = function (ctx) { _rh.apply(this, arguments); if (!RUN.on || !P.wpn || P.wpn.sword !== 'fire') return; const x = W - 22, y = 12; ctx.fillStyle = 'rgba(18,4,24,0.7)'; ctx.fillRect(x, y, 16, 16); ctx.fillStyle = '#ff7a20'; ctx.fillRect(x, y, 16, 1); ctx.fillRect(x, y + 15, 16, 1); drawIcon(ctx, 'ic_firesword', x + 8, y + 8, 14, 14); };
  // living flames along the blade (overlay; own PRNG; never on the hand - they start above the guard)
  const FLM = M10.FLM = [];
  let fT = 0;
  const _w = window.wpnFX;
  window.wpnFX = function (ctx, name, kind, X, Y, R, S, VFY_, t) {
    if (_w) _w.apply(this, arguments);
    if (kind !== 'fire' || (typeof FX !== 'undefined' && !FX.on)) return;
    const now = performance.now() / 1000, dt = Math.min(0.05, Math.max(0, now - fT)); fT = now;
    const sw = !!(P.sw || G.finisher), pose = [X, Y, R, S / VSC];
    const rate = (sw ? 320 : 170) * dt; let nE = Math.floor(rate) + (fr() < rate % 1 ? 1 : 0);
    while (nE-- > 0) { const u = fa(0.3, 1.02), p = tipOf(pose, u), w = fa(-3, 3); FLM.push({ x: p[0] + Math.cos(R) * w, y: p[1] + Math.sin(R) * w, vx: fa(-10, 10) + (sw ? fa(-40, 40) : 0), vy: fa(-70, -30), t: 0, life: fa(0.22, 0.55), s: fr() < 0.4 ? 3 : 2 }); }
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    // heat glow along the blade
    for (let i = 0; i < 6; i++) { const p = tipOf(pose, 0.38 + i * 0.12); ctx.globalAlpha = 0.16 + 0.06 * Math.sin(t * 9 + i * 1.7); ctx.fillStyle = '#ff5a00'; ctx.beginPath(); ctx.arc(p[0], p[1], 8 + 2 * Math.sin(t * 7 + i), 0, TAU2); ctx.fill(); }
    // flame tongues licking up off the blade (flicker from the clock, not from any RNG)
    for (let i = 0; i < 11; i++) {
      const u = 0.34 + i * 0.064, p = tipOf(pose, u), fl = 0.6 + 0.4 * Math.sin(t * 17 + i * 2.3) * Math.sin(t * 7.3 + i), hgt = (11 + 10 * fl) * (sw ? 1.3 : 1), wd = 2.6 + 1.2 * fl, lean = Math.sin(t * 5 + i) * 2.5;
      ctx.globalAlpha = 0.55; ctx.fillStyle = '#ff4a08';
      ctx.beginPath(); ctx.moveTo(p[0] - wd, p[1]); ctx.quadraticCurveTo(p[0] - wd * 0.6 + lean * 0.5, p[1] - hgt * 0.6, p[0] + lean, p[1] - hgt); ctx.quadraticCurveTo(p[0] + wd * 0.6 + lean * 0.5, p[1] - hgt * 0.6, p[0] + wd, p[1]); ctx.closePath(); ctx.fill();
      ctx.globalAlpha = 0.7; ctx.fillStyle = '#ffd060'; const h2 = hgt * 0.55, w2 = wd * 0.5;
      ctx.beginPath(); ctx.moveTo(p[0] - w2, p[1]); ctx.quadraticCurveTo(p[0] + lean * 0.3, p[1] - h2 * 0.7, p[0] + lean * 0.6, p[1] - h2); ctx.quadraticCurveTo(p[0] + lean * 0.3, p[1] - h2 * 0.7, p[0] + w2, p[1]); ctx.closePath(); ctx.fill();
    }
    for (let i = FLM.length - 1; i >= 0; i--) {
      const q = FLM[i]; q.t += dt; if (q.t > q.life) { FLM.splice(i, 1); continue; }
      q.x += q.vx * dt; q.y += q.vy * dt; q.vy -= 40 * dt; const k = q.t / q.life;
      ctx.globalAlpha = (1 - k) * 0.95; ctx.fillStyle = k < 0.25 ? '#fff4c0' : k < 0.5 ? '#ffb030' : k < 0.8 ? '#ff5a10' : '#b01800';
      const s = Math.max(1, Math.round(q.s * (1 - k * 0.6))); ctx.fillRect(Math.round(q.x - s / 2), Math.round(q.y - s), s, s + 1);
    }
    if (FLM.length > 220) FLM.splice(0, FLM.length - 220);
    ctx.restore();
  };
})();

// ===== M10 soundtrack director: all five of Bighouse's songs, mixed across the run =====
// Songs (files untouched; gain-matched by loudness in audio.json): bighouse, shadowed (Shadowed Depths), echoes2 (Echoes of
// Battle II), shadowblades (Shadow Blades), echoes (Echoes of Battle).
//   title / Chapel / victory .... bighouse
//   stages 1-2 .................. coin flip each run: one gets Shadowed Depths, the other bighouse; stage 3 = stage 1's song
//   stages 4-6 .................. Echoes of Battle II (Act II theme)
//   stage 7 / 8 / 9 / 10 ........ Shadowed Depths / Echoes of Battle II / bighouse / Shadowed Depths
//   the Abyss ................... Echoes of Battle II
//   boss fights ................. alternate Shadow Blades / Echoes of Battle (random start each run); the Lich always Echoes
// Transitions: stage<->stage ~4s blend, into a boss ~1.2s hard swell, boss->stage ~4s. The same song across a stage change
// just keeps playing (no restart). Lazy songs are prefetched in the Chapel so a stage never opens on the wrong track.
// Test hooks: ?song=1|2 forces which of stages 1-2 gets Shadowed Depths, ?bsong=a|b forces Shadow Blades / Echoes.
(function () {
  if (typeof SFX === 'undefined') return;
  let seed = (Date.now() ^ 0x5bd1e995) >>> 0;
  const coin = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed >>> 31; };
  const force = (location.search.match(/[?&]song=([12])/) || [])[1];
  const bforce = (location.search.match(/[?&]bsong=([ab])/) || [])[1];
  let lastStage = 0, pick = 1, bossKey = '', bossN = 0, bstart = coin(), lastSlot = '';
  const STAGE = { 4: 'echoes2', 5: 'echoes2', 6: 'echoes2', 7: 'shadowed', 8: 'echoes2', 9: 'bighouse', 10: 'shadowed' };
  M10.MUSIC = { STAGE, abyss: 'echoes2' };
  const _slots = SFX.musicSlots;
  SFX.musicSlots = function (boss) {
    const L = _slots.call(this, boss), M = this.musicMap || (this.musicMap = {});
    const sk = this.stageKey;
    if (sk === 'hub' && this.lazyQ && this.lazyQ.length && this.ctx && !this.m10pre) { this.m10pre = 1; setTimeout(() => this.loadLazy(), 1500); }
    let slot = 'base';
    const inRun = typeof RUN !== 'undefined' && RUN.on && typeof G !== 'undefined' && G.state !== 'title';
    if (typeof RUN !== 'undefined' && !RUN.on) lastStage = 0;
    let out = L;
    if (inRun && M.m10_boss !== undefined && M.m10_stage !== undefined) {
      if (boss) {
        const bk = (RUN.stage | 0) + ':' + sk + ':' + this.bossKey;
        if (bk !== bossKey) { bossKey = bk; bossN++;
          const e = this.bossKey === 'lich' && sk !== 'abyss' ? true : bforce ? bforce === 'b' : ((bossN + bstart) & 1) === 1;
          M.m10_boss = e ? 'echoes' : 'shadowblades'; M10.bossSong = M.m10_boss; }
        out = ['m10_boss'].concat(L); slot = 'boss';
      } else if (sk === 'hub') { lastStage = 0; }
      else if (sk === 'abyss') { M.m10_stage = M10.MUSIC.abyss; out = ['m10_stage'].concat(L); slot = 'stage'; }
      else if (sk !== 'victory') {
        const st = RUN.stage | 0;
        if (st === 1 && lastStage !== 1) { pick = force ? +force : 1 + coin(); bossN = 0; bossKey = ''; bstart = coin(); M10.songPick = pick; }
        lastStage = st;
        M.m10_stage = st === 1 ? (pick === 1 ? 'shadowed' : 'bighouse') : st === 2 ? (pick === 2 ? 'shadowed' : 'bighouse') : st === 3 ? (pick === 1 ? 'shadowed' : 'bighouse') : (STAGE[st] || 'bighouse');
        M10.stageSong = M.m10_stage; out = ['m10_stage'].concat(L); slot = 'stage';
      }
    }
    // crossfade shape for the next song change
    if (slot !== lastSlot) { if (slot === 'boss') { this.xfOut = 0.35; this.xfIn = 0.3; } else { this.xfOut = 1.0; this.xfIn = 0.9; } lastSlot = slot; }
    return out;
  };
})();
