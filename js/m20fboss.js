'use strict';
// ===== m20 wave 3: SIX NEW FLOOR BOSSES, four new floor foes, floor weapons (found -> buyable), lore pages, freed souls,
// the Wayfinder's Lantern. Bosses run on the m13/m14 mini-boss chrome (name card, HP + POSTURE bars, two phases, posture
// break -> finisher) through M14.spawnMini, with their own data-driven move sets. Weapons reuse the existing weapon views
// (hand poses/pixels locked); their identity is an effect layer.
// Kill switches: ?floorboss=0 (elite guards instead)  ?floorfoes=0 (no new foes)  ?floorbuy=0 (no shop rows)  ?lantern=0
(function () {
  if (!window.M20 || !M20.FL || !M20.floors) return;
  const FL = M20.FL;
  const ER = (k, e) => M20.fail(k, e);
  // ---------- new floor foes ----------
  if (M20.floorfoes) {
    EDEF.m20arbalest = { spr: 's_m20arbalest', h: 1.48, hp: 44, speed: 1.5, range: 10, windup: 0.95, strike: 0.1, recover: 1.3, dmg: 13, mat: 'bone', kbRes: 0.9, ranged: true, keep: 6.2, name: 'a Skeletal Arbalest' };
    EDEF.m20murder = { spr: 's_m20crow', h: 0.52, hp: 11, speed: 4.1, range: 1.0, windup: 0.3, strike: 0.3, recover: 0.75, dmg: 5, mat: 'flesh', kbRes: 1.8, fly: 1.5, name: 'the Carrion Murder' };
    EDEF.m20wight = { spr: 's_m20wight', h: 1.55, hp: 62, speed: 1.25, range: 1.45, windup: 0.62, strike: 0.2, recover: 0.7, dmg: 13, mat: 'flesh', kbRes: 0.8, name: 'a Lantern Wight' };
    EDEF.m20drowned = { spr: 's_m20drowned', h: 1.55, hp: 105, speed: 0.95, range: 1.55, windup: 0.85, strike: 0.2, recover: 0.85, dmg: 19, mat: 'flesh', kbRes: 0.5, armor: 0.8, name: 'a Drowned One' };
    if (typeof UNDEAD !== 'undefined' && UNDEAD.add) ['m20arbalest', 'm20wight', 'm20drowned'].forEach(t => UNDEAD.add(t));
  }
  // ---------- boss data ----------
  const BD = {
    m20roofer: { spr: 's_m20roofer', h: 2.9, hp: 560, speed: 1.35, range: 2.8, windup: 0.8, strike: 0.25, recover: 0.9, dmg: 14, mat: 'bone', kbRes: 0.05, col: '#c8a0ff', c: [190, 150, 255],
      name: 'the Slate King', title: 'THE SLATE KING', sub: 'He roofed the nave for fifty years. He is not coming down.', p2: 'The ridge cracks under his weight.', death: '"...mind... the... slates..."',
      moves: p2 => [['swing', 2.8], ['volley', 9, { n: p2 ? 5 : 3, sp: 7, dmg: 10, tint: [170, 150, 200] }], ['rain', 12, { n: p2 ? 7 : 4, dmg: 13, col: [190, 160, 255] }], p2 && ['ring', 3.4, { r: 3.4 }], p2 && ['summon', 30, { t: 'm20murder', n: 3, cap: 4 }]] },
    m20abbot: { spr: 's_m20abbot', h: 2.85, hp: 600, speed: 1.3, range: 2.9, windup: 0.78, strike: 0.25, recover: 0.85, dmg: 14, mat: 'bone', kbRes: 0.06, col: '#a0ff90', c: [150, 255, 120],
      name: 'the First Abbot', title: 'THE FIRST ABBOT', sub: 'He chose the first Kael. He has opinions about the rest.', p2: '"Kneel. Every one of you knelt."', death: '"...the candle... was always... yours..."',
      moves: p2 => [['swing', 2.9, { fire: true }], ['lane', 10, { fan: p2 ? 3 : 1, n: 7, col: [140, 255, 110], dmg: 13 }], ['ring', 4, { r: 3.2, delay: true }], ['summon', 30, { t: 'skeleton', n: p2 ? 3 : 2, cap: 3 }]] },
    m20huntmaster: { spr: 's_m20huntmaster', h: 2.85, hp: 760, speed: 1.75, range: 2.6, windup: 0.7, strike: 0.25, recover: 0.8, dmg: 16, mat: 'flesh', kbRes: 0.06, col: '#ff7060', c: [255, 90, 70],
      name: 'the Huntmaster', title: 'THE HUNTMASTER', sub: 'Keeper of the castle hounds. Tonight, you are the hunt.', p2: 'He sounds the horn. The pack answers.', death: '"...a clean... kill..."',
      moves: p2 => [['volley', 12, { n: p2 ? 5 : 3, sp: 11, dmg: 12, tint: [255, 120, 80] }], ['traps', 9, { n: p2 ? 4 : 3 }], ['charge', 9], ['swing', 2.6], p2 && ['summon', 30, { t: EDEF.werewolf ? 'werewolf' : 'fzombie', n: 1, cap: 1 }]] },
    m20cistern: { spr: 's_m20cistern', h: 2.95, hp: 780, speed: 1.2, range: 2.7, windup: 0.78, strike: 0.25, recover: 0.85, dmg: 16, mat: 'flesh', kbRes: 0.05, col: '#80e0ff', c: [110, 210, 255],
      name: 'the Cistern Mother', title: 'THE CISTERN MOTHER', sub: 'Every drowned thing under the courtyard calls her mother.', p2: 'The water rises to meet her.', death: '"...let me... sink..."',
      moves: p2 => [['swing', 2.7], ['submerge', 30], ['lane', 11, { fan: p2 ? 3 : 2, n: 7, col: [110, 210, 255], dmg: 14 }], ['summon', 30, { t: EDEF.m20drowned ? 'm20drowned' : 'zombie', n: p2 ? 2 : 1, cap: 2 }]] },
    m20spire: { spr: 's_m20spire', h: 3.0, hp: 900, speed: 1.5, range: 3.3, windup: 0.75, strike: 0.25, recover: 0.8, dmg: 19, mat: 'flesh', kbRes: 0.04, col: '#a0d0ff', c: [140, 200, 255],
      name: 'the Spire Warden', title: 'THE SPIRE WARDEN', sub: 'He guards the cathedral roof from the sky itself.', p2: 'The storm answers his halberd.', death: '"...the bells... ring... without me..."',
      moves: p2 => [['swing', 3.3, { wide: true }], ['rain', 14, { n: p2 ? 5 : 3, dmg: 17, col: [170, 210, 255], seq: true }], ['charge', 10], p2 && ['ring', 3.8, { r: 3.8 }]] },
    m20oathbound: { spr: 's_m20oathbound', h: 3.0, hp: 920, speed: 1.45, range: 3.0, windup: 0.72, strike: 0.25, recover: 0.8, dmg: 20, mat: 'flesh', kbRes: 0.04, col: '#c090ff', c: [190, 120, 255],
      name: 'the Oathbound Knight', title: 'THE OATHBOUND KNIGHT', sub: 'He swore to kneel here until the Baron came back.', p2: '"Rise, brothers. He is here."', death: '"...my oath... is... kept..."',
      moves: p2 => [['swing', 3.0, { combo: true }], ['lane', 9, { cross: true, n: 6, col: [190, 120, 255], dmg: 16 }], ['ring', 3.2, { r: 3.2 }], p2 && ['summon', 30, { t: 'skeleton', n: 2, cap: 2 }]] },
  };
  const BOSS = Object.keys(BD);
  for (const t of BOSS) { const d = Object.assign({}, BD[t]); delete d.moves; EDEF[t] = d; if (typeof UNDEAD !== 'undefined' && UNDEAD.add) UNDEAD.add(t); }
  const BASE = {}; BOSS.forEach(t => BASE[t] = [EDEF[t].speed, EDEF[t].windup]);
  // m20b: later files add bosses through this (same move vocabulary, same chrome)
  FL.addBoss = function (t, def) { BD[t] = def; const d = Object.assign({}, def); delete d.moves; EDEF[t] = d; if (typeof UNDEAD !== 'undefined' && UNDEAD.add) UNDEAD.add(t); if (!BOSS.includes(t)) BOSS.push(t); BASE[t] = [d.speed, d.windup]; };
  // feats + codex lore for each boss
  const FEATS = [['m20_roofer', 'SLATE CLEAN', 'Fell the Slate King on the Broken Roof.'], ['m20_abbot', 'FIRST AND LAST', 'Fell the First Abbot in the Undercroft.'], ['m20_huntmaster', 'THE HUNTED', 'Fell the Huntmaster on the Rampart Walk.'],
    ['m20_cistern', 'DRAINED', 'Fell the Cistern Mother.'], ['m20_spire', 'LIGHTNING ROD', 'Fell the Spire Warden in the storm.'], ['m20_oathbound', 'OATH KEPT', 'Fell the Oathbound Knight.']];
  try { if (window.ACH) for (const [id, n, d] of FEATS) if (!ACH.list.some(a => a.id === id)) ACH.list.push({ id, n, d }); if (window.M12 && M12.STEAM) for (const [id] of FEATS) M12.STEAM.map[id] = 'TU_' + id.toUpperCase(); } catch (e) { }
  // Lore Book boss ledger
  if (M20.BOSSES) M20.BOSSES.push(['m20roofer', 'THE SLATE KING', 1, 'Fifty years on the roof. He threw the whole ridge at me. I threw him off it.'], ['m20abbot', 'THE FIRST ABBOT', 1, 'He picked the first Kael. He was sure I was the wrong one. He was wrong.'],
    ['m20huntmaster', 'THE HUNTMASTER', 4, 'He set traps for wolves. I am not a wolf.'], ['m20cistern', 'THE CISTERN MOTHER', 4, 'She only wanted the dark water to stay still. It is still now.'],
    ['m20spire', 'THE SPIRE WARDEN', 9, 'He fought the storm every night. I let him rest in it.'], ['m20oathbound', 'THE OATHBOUND KNIGHT', 9, 'He knelt for the Baron. When I came, he stood. The oath was mine to end.']);
  // ---------- helpers ----------
  const free = (x, y) => { const c = cellAt(x, y); return c >= 0 && !isSolid(c) && Math.abs(floorAt(x, y) - P.z) < 0.8; };
  const grounded = () => P.z - floorAt(P.x, P.y) < 0.3;
  const mark = o => M14.marks.push(Object.assign({ t: 0, delay: 1, r: 1, dmg: 12, col: [255, 200, 90], k: 'pillar' }, o));
  function postAdd(e, n, parry) {
    if (!e.alive || e.m13brk) return; e.post += n; e.postT = G.time;
    if (e.post >= e.postMax) { e.post = 0; e.m13brk = true; e.stagger = 2.2; e.state = 'stagger'; e.m20a = null; G.slow = 0.35; SFX.play('roar', 0.6); toast('POSTURE BROKEN', 'Finish it!', '#ffd060', 1.4); }
    else if (parry) dmgNum(e.x, e.y, e.z + e.h + 0.3, 'POSTURE', '#ffd060');
  }
  const hit = (e, dmg, o) => { const r = hurtPlayer(dmg, e.x, e.y, Object.assign({ src: e }, o || {})); if (r === 'parry') postAdd(e, e.postMax * 0.35, true); return r; };
  const bolt = (e, a, sp, dmg, tint) => {
    const ez = e.z + e.h * 0.6, dist = Math.hypot(P.x - e.x, P.y - e.y);
    G.projectiles.push({ type: 'fireball', x: e.x + Math.cos(a) * 0.6, y: e.y + Math.sin(a) * 0.6, z: ez, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, vz: ((P.z + 1.0) - ez) / Math.max(0.5, dist) * sp, dmg, owner: e, life: 3.5,
      spr: p => ({ tex: 'glow_w', x: p.x, y: p.y, z: p.z - 0.2, w: 0.42, h: 0.42, add: true, alpha: 0.95, lit: false, tint: p.reflected ? [255, 210, 90, 1] : [tint[0], tint[1], tint[2], 1] }) });
  };
  const ring = (e, r, dmg, c) => { const res = M13.B.ring(e.x, e.y, r, dmg, RGB(c[0], c[1], c[2]), e); if (res === 'parry') postAdd(e, e.postMax * 0.3, true); G.shake += 4; };
  // ---------- spawning (called by m20fdat's FL.enter) ----------
  FL.spawnBoss = function (type, x, y, def) {
    if (!M20.floorboss || !EDEF[type] || !M14 || !M14.spawnMini) return null;
    try {
      for (const t in BASE) { EDEF[t].speed = BASE[t][0]; EDEF[t].windup = BASE[t][1]; }
      const e = M14.spawnMini(type, x, y); e.m20boss = true; e.m20a = null; e.m20cd = 1.5; e.m20n = 0; e.side = 1; e.awake = false;
      FL.boss = e; G.totalEnemies = G.enemies.length; return e;
    } catch (er) { ER('spawnBoss', er); return null; }
  };
  // floor bosses live in their own M14.minis list while you are on the floor (main-floor minis are parked)
  let parked = null;
  const _en = FL.enter;
  FL.enter = function (id) {
    if (FL.cur) return _en.apply(this, arguments);
    const save = { minis: M14.minis, marks: M14.marks.splice(0), b13: M13.B && M13.B.minis };
    M14.minis = []; if (M13.B) M13.B.minis = [];
    const ok = _en.apply(this, arguments);
    if (ok) parked = save; else { M14.minis = save.minis; if (M13.B) M13.B.minis = save.b13; }
    if (ok) try { flock(); } catch (e) { ER('flock', e); }
    return ok;
  };
  const _lv = FL.leave;
  FL.leave = function () {
    const was = FL.cur; const r = _lv.apply(this, arguments);
    if (was && parked) { M14.minis = parked.minis; M14.marks.length = 0; if (M13.B) M13.B.minis = parked.b13 || []; parked = null; M20.subs = []; }
    return r;
  };
  // the Carrion Murder flies as a flock of 3-5
  function flock() {
    if (!EDEF.m20murder) return;
    const add = [];
    for (const e of G.enemies) if (e.type === 'm20murder' && !e.m20flock) { e.m20flock = 1; const n = 2 + ((e.x * 7 + e.y * 3) | 0) % 3; for (let i = 0; i < n; i++) { const a = i * 2.1, x = e.x + Math.cos(a) * 0.7, y = e.y + Math.sin(a) * 0.7; if (!free(x, y)) continue; const c = makeEnemy('m20murder', x, y); c.m20flock = 1; c.z = e.z; add.push(c); } }
    if (add.length) { G.enemies.push(...add.slice(0, Math.max(0, 27 - G.enemies.length))); G.totalEnemies = G.enemies.length; }
  }
  // ---------- AI ----------
  function startAtk(e, k, dur, extra) { if (!e.m20log) e.m20log = {}; e.m20log[k] = (e.m20log[k] | 0) + 1; e.m20a = Object.assign({ k, ph: 'wind', t: 0, dur }, extra || {}); e.state = 'windup'; e.st = 0; }
  const _ue = updateEnemy;
  updateEnemy = function (e, dt) { if (e.m20boss) { try { return mini(e, dt); } catch (er) { ER('boss ai', er); return; } } return _ue.apply(this, arguments); };
  function wake(e) {
    const d = e.d; e.awake = true; if (e.m14card) return; e.m14card = true;
    G.bigText = { t1: d.title, t2: d.sub, t: 0, dur: 2.9 }; SFX.play('toll', 0.8); SFX.play('roar', 0.5); G.shake += 3; e.m20cd = 1.6;
    try { SFX.ev('m13_butcher', 0.7); } catch (er) { }
  }
  function mini(e, dt) {
    const d = e.d; e.t += dt; e.flash = Math.max(0, e.flash - dt * 10); e.hurtT -= dt;
    if (e.dead) { updateDead(e, dt); return; }
    if (RUN.on && e.alive) { dt = rogueEnemyTick(e, dt); if (dt <= 0 || !e.alive) return; }
    if (e.frozen) return;
    e.freezeT = 0; e.downT = 0;
    if (Math.abs(e.kbx) + Math.abs(e.kby) > 0.01) { moveEntity(e, e.kbx * dt * 0.4, e.kby * dt * 0.4, e.r * 0.8, 0.33, false); e.kbx *= Math.pow(0.004, dt); e.kby *= Math.pow(0.004, dt); }
    const g = groundUnder(e.x, e.y, e.r * 0.5);
    if (e.z > g + 0.01) { e.vz -= 14 * dt; e.z += e.vz * dt; if (e.z < g) { e.z = g; e.vz = 0; } } else { e.z = g; e.vz = 0; }
    const dx = P.x - e.x, dy = P.y - e.y, dist = Math.hypot(dx, dy), los = losTo(e.x, e.y, P.x, P.y), ang = Math.atan2(dy, dx);
    if (!e.awake && ((dist < 8.5 && los) || e.hp < e.maxhp)) wake(e);
    // submerged (Cistern Mother): untouchable until she surfaces
    if (e.m20sub) { e.m20sub.t += dt; const S = e.m20sub; if (S.t < 0.9) { S.tx = P.x; S.ty = P.y; } if (S.t >= 1.45) { e.x = S.tx; e.y = S.ty; e.m20sub = null; e.m20inv = false; ring(e, 2.2, Math.round(d.dmg * 0.9), d.c); SFX.play('heavy', 0.9); for (let i = 0; i < 18; i++) addP({ k: 'spark', x: e.x + rand(-0.6, 0.6), y: e.y + rand(-0.6, 0.6), z: floorAt(e.x, e.y), vx: rand(-1.5, 1.5), vy: rand(-1.5, 1.5), vz: rand(3, 6), size: 0.06, col: RGB(150, 220, 255), life: 0.8 }); } return; }
    if (e.m20dash) { const D = e.m20dash; D.t += dt; const sp = 11 * dt; moveEntity(e, Math.cos(D.a) * sp, Math.sin(D.a) * sp, e.r * 0.8, 0.33, false); e.walk += dt * 20;
      if (!D.hit && Math.hypot(P.x - e.x, P.y - e.y) < 1.2 && Math.abs(P.z - e.z) < 1.4) { D.hit = true; const r = hit(e, d.dmg); if (r === 'hit') { P.vx += Math.cos(D.a) * 7; P.vy += Math.sin(D.a) * 7; } }
      if (D.t > 0.65) { e.m20dash = null; e.state = 'recover'; e.m20a = { k: 'rec', ph: 'rec', t: 0, dur: 0, rec: 0.7 }; } return; }
    if (e.m13brk) { e.stagger -= dt; e.state = 'stagger'; if (e.stagger <= 0) { e.m13brk = false; e.state = 'chase'; e.m20a = null; e.m20cd = 0.6; } return; }
    e.stagger = 0; if (e.state === 'stagger') e.state = 'chase';
    if (!e.awake) { e.state = 'idle'; return; }
    if (G.time - (e.postT || 0) > 2.2) e.post = Math.max(0, e.post - e.postMax * 0.09 * dt);
    if (!e.phase2 && e.hp < e.maxhp * 0.5) { e.phase2 = true; e.d.speed *= 1.18; e.d.windup *= 0.88; G.flashR = 0.3; SFX.play('roar', 0.8); G.shake += 5; toast(d.title, d.p2, d.col, 2.6); e.m20cd = 0.3; }
    e.m20cd -= dt;
    const A = e.m20a;
    if (A) {
      A.t += dt;
      if (A.ph === 'wind') {
        if (A.track) A.a = A.a + clamp(angDiff(ang, A.a), -1.6 * dt, 1.6 * dt);
        if (A.lock !== undefined && A.t < A.dur - A.lock) { A.a = ang; A.tx = P.x; A.ty = P.y; }
        if (A.t >= A.dur) { A.ph = 'hit'; A.t = 0; e.state = 'strike'; act(e, A, dist, ang); }
      } else if (A.ph === 'hit') { if (A.t >= 0.25) { if (A.combo && !A.c2) { A.c2 = true; A.ph = 'wind'; A.t = A.dur * 0.45; e.state = 'windup'; A.track = true; } else { A.ph = 'rec'; A.t = 0; e.state = 'recover'; } } }
      else if (A.t >= (A.rec ?? d.recover)) { e.m20a = null; e.state = 'chase'; e.m20cd = rand(0.45, 1.0) * (e.phase2 ? 0.75 : 1); }
      return;
    }
    if (e.m20cd <= 0 && los) { if (choose(e, dist, ang)) return; }
    const sp = d.speed * (e.hurtT > e.hurtMax * 0.45 ? 0.3 : 1); let mx = 0, my = 0;
    const ranged = (e.type === 'm20huntmaster' || (BD[e.type] && BD[e.type].kite)) && !e.phase2;
    if (ranged && dist < 5) { const tang = ang + Math.PI / 2 * e.side; mx = -dx * 0.6 + Math.cos(tang) * 0.8; my = -dy * 0.6 + Math.sin(tang) * 0.8; if (Math.random() < dt * 0.5) e.side *= -1; }
    else if (dist > d.range * 0.75) { mx = dx; my = dy; }
    const l = Math.hypot(mx, my) || 1; mx = mx / l * sp; my = my / l * sp;
    if (Math.abs(mx) + Math.abs(my) > 0.01) { moveEntity(e, mx * dt, my * dt, e.r * 0.8, 0.33, false); e.walk += Math.hypot(mx, my) * dt * 5.5; e.state = 'chase'; const lat = -mx * Math.sin(P.ang) + my * Math.cos(P.ang); if (Math.abs(lat) > 0.3) e.flip = lat < 0; }
  }
  function choose(e, dist, ang) {
    const d = e.d, p2 = !!e.phase2, n = ++e.m20n;
    const M = BD[e.type].moves(p2).filter(Boolean);
    // rotate through the move list from a different start each time; take the first one in range
    for (let k = 0; k < M.length; k++) {
      const [mv, rng, o] = M[(n + k) % M.length]; const O = o || {};
      if (dist > rng) continue;
      if (mv === 'summon') { const have = G.enemies.filter(h => h.alive && h.m20pack === e).length; if (have >= (O.cap || 2) || n % 3) continue; startAtk(e, 'summon', 0.95, O); SFX.play('ghost', 0.7); return true; }
      if (mv === 'submerge') { if (n % 3 !== 1) continue; startAtk(e, 'submerge', 0.5, {}); SFX.play('ghost', 0.8); return true; }
      if (mv === 'swing') { if (dist > d.range) continue; startAtk(e, 'swing', d.windup, Object.assign({ a: ang, track: true }, O)); SFX.play('windup', 0.7); return true; }
      if (mv === 'ring') { if (n % 2) continue; startAtk(e, 'ring', O.delay ? 1.2 : 0.95, O); SFX.play('windup', 0.8); return true; }
      if (mv === 'lane') { startAtk(e, 'lane', 1.1, Object.assign({ a: ang, lock: 0.4 }, O)); SFX.play('stone', 0.6); SFX.play('windup', 0.6); return true; }
      if (mv === 'volley') { if (dist < 3) continue; startAtk(e, 'volley', 0.8, Object.assign({ a: ang, lock: 0.25 }, O)); SFX.play('whip', 0.5); return true; }
      if (mv === 'rain') { startAtk(e, 'rain', 0.6, O); SFX.play(e.type === 'm20spire' ? 'heavy' : 'stone', 0.6); return true; }
      if (mv === 'traps') { if (n % 3) continue; startAtk(e, 'traps', 0.6, O); SFX.play('clink', 0.9); return true; }
      if (mv === 'charge') { if (dist < 3.5 || n % 2) continue; startAtk(e, 'charge', 0.85, { a: ang, lock: 0.3 }); SFX.play('roar', 0.5); return true; }
    }
    return false;
  }
  function act(e, A, dist, ang) {
    const d = e.d, c = d.c;
    switch (A.k) {
      case 'swing': {
        SFX.play('swing', 0.9); const off = Math.abs(angDiff(ang, A.a));
        if (dist < d.range + 0.5 && off < (A.wide ? 1.3 : 0.95) && Math.abs(P.z - e.z) < 1.4) { const r = hit(e, A.c2 ? Math.round(d.dmg * 0.8) : d.dmg); if (r === 'hit' && A.fire && typeof P.burn !== 'undefined') P.burn = Math.max(P.burn || 0, 1.5); }
        sparks(e.x + Math.cos(A.a) * 1.6, e.y + Math.sin(A.a) * 1.6, e.z + 0.8, 10, RGB(c[0], c[1], c[2])); break;
      }
      case 'ring': ring(e, A.r || 3, Math.round(d.dmg * 0.85), c); SFX.play('heavy', 0.9); break;
      case 'lane': {
        SFX.play('heavy', 0.9); G.shake += 3;
        const dirs = A.cross ? [0, 1, 2, 3].map(i => A.a + i * Math.PI / 2 + (e.phase2 ? Math.PI / 4 : 0)) : Array.from({ length: A.fan || 1 }, (_, f) => A.a + (f - ((A.fan || 1) - 1) / 2) * 0.42);
        for (const a of dirs) for (let i = 1; i <= (A.n || 7); i++) { const x = e.x + Math.cos(a) * i * 1.15, y = e.y + Math.sin(a) * i * 1.15; if (!free(x, y)) break; mark({ x, y, delay: 0.12 + i * 0.1, r: 0.8, dmg: A.dmg || 13, col: A.col || c, src: e }); }
        A.rec = 0.8; break;
      }
      case 'volley': { const n = A.n || 3; for (let i = 0; i < n; i++) bolt(e, A.a + (i - (n - 1) / 2) * 0.18, A.sp || 8, A.dmg || 10, A.tint || c); SFX.play('swing', 0.7); A.rec = 0.6; break; }
      case 'rain': { const n = A.n || 4; for (let i = 0; i < n; i++) { const r = i ? rand(1.2, 2.8) : 0, a = rand(0, TAU), x = P.x + Math.cos(a) * r, y = P.y + Math.sin(a) * r; if (!free(x, y)) continue; mark({ x, y, delay: A.seq ? 0.75 + i * 0.32 : 0.9 + rand(0, 0.35), r: 1.0, dmg: A.dmg || 13, col: A.col || c, src: e }); } A.rec = 0.5; break; }
      case 'traps': { const n = A.n || 3; for (let i = 0; i < n; i++) { const a = rand(0, TAU), r = rand(1.4, 3.2), x = P.x + Math.cos(a) * r, y = P.y + Math.sin(a) * r; if (!free(x, y)) continue; mark({ x, y, delay: 0.5, r: 0.55, dmg: 12, col: [255, 160, 80], k: 'trap', life: 14, src: e }); } A.rec = 0.4; break; }
      case 'charge': e.m20dash = { a: A.a, t: 0, hit: false }; SFX.play('heavy', 0.6); e.m20a = null; break;
      case 'submerge': e.m20sub = { t: 0, tx: P.x, ty: P.y }; e.m20inv = true; e.m20a = null; SFX.play('ghost', 0.9); break;
      case 'summon': {
        const want = Math.min(A.n || 1, (A.cap || 2) - G.enemies.filter(h => h.alive && h.m20pack === e).length);
        for (let i = 0, made = 0; i < 14 && made < want && G.enemies.length < 32; i++) { const a = rand(0, TAU), r = rand(1.6, 3), x = e.x + Math.cos(a) * r, y = e.y + Math.sin(a) * r; if (!free(x, y) || !EDEF[A.t]) continue;
          const s = makeEnemy(A.t, x, y, { rise: A.t === 'skeleton' }); s.awake = true; s.summoned = true; s.m20pack = e; s.m13sum = e; s.hp = s.maxhp = Math.round(EDEF[A.t].hp * (RUN.cfg.hp || 1) * 0.7); G.enemies.push(s); dust(x, y, floorAt(x, y), 10); made++; }
        SFX.play('stone', 0.8); A.rec = 0.5; break;
      }
    }
  }
  // submerged = untouchable
  const _de = damageEnemy;
  damageEnemy = function (e, dmg, o) { if (e && e.m20inv) return; return _de.apply(this, arguments); };
  // visuals: wind-up tints + telegraphs
  const _rv = rogueVisual;
  rogueVisual = function (e, v) {
    v = _rv(e, v); if (!v || e.dead) return v;
    if (e.m20boss) {
      const A = e.m20a, c = e.d.c;
      if (A && A.ph === 'wind') { const k = clamp(A.t / A.dur, 0, 1); v.tint = [c[0], c[1], c[2], 0.1 + 0.22 * k]; v.lean = -0.25 * k; }
      else if (A && A.ph === 'hit') v.lean = 0.4;
      if (e.m20sub) { const k = e.m20sub.t; v.alpha = k < 0.4 ? 1 - k / 0.4 : 0; }
      if (e.m20dash) v.lean = 0.5;
      if (e.m13brk) v.tint = [255, 230, 120, 0.3 + 0.2 * Math.sin(e.t * 20)];
      if (e.phase2) v.glow = Math.max(v.glow || 0, 0.22);
    } else if (e.type === 'm20drowned' && !e.awake) { v.alpha = 0.35; }
    return v;
  };
  const _cs = collectSprites;
  collectSprites = function (cam) {
    const S = _cs(cam);
    try {
      if (G.state !== 'play' || !FL.cur) return S;
      const t = G.time, gl = (x, y, z, w, h, al, c) => S.push({ tex: 'glow_w', x, y, z, w, h, add: true, alpha: al, lit: false, tint: [c[0], c[1], c[2], 1] });
      const e = FL.boss;
      if (e && e.alive && e.m20a && e.m20a.ph === 'wind') {
        const A = e.m20a, k = clamp(A.t / A.dur, 0, 1), fz = floorAt(e.x, e.y) - 0.1, c = e.d.c, lock = A.lock !== undefined && A.t >= A.dur - A.lock;
        if (A.k === 'lane') { const dirs = A.cross ? [0, 1, 2, 3].map(i => A.a + i * Math.PI / 2 + (e.phase2 ? Math.PI / 4 : 0)) : Array.from({ length: A.fan || 1 }, (_, f) => A.a + (f - ((A.fan || 1) - 1) / 2) * 0.42); for (const a of dirs) for (let i = 1; i <= (A.n || 7); i++) { const x = e.x + Math.cos(a) * i * 1.15, y = e.y + Math.sin(a) * i * 1.15; if (!free(x, y)) break; if (Math.abs(x - P.x) < 0.75 && Math.abs(y - P.y) < 0.75) continue; gl(x, y, floorAt(x, y) - 0.08, 0.8 + 0.4 * k, 0.3, 0.25 + 0.45 * k, lock ? [255, 245, 200] : A.col || c); } }
        else if (A.k === 'ring') gl(e.x, e.y, fz, 1 + ((A.r || 3) * 2 - 1) * k, 0.4, 0.25 + 0.4 * k, c);
        else if (A.k === 'charge') for (let i = 1; i <= 7; i++) gl(e.x + Math.cos(A.a) * i, e.y + Math.sin(A.a) * i, fz + 0.03, 0.6, 0.26, 0.25 + 0.45 * k, lock ? [255, 255, 230] : c);
        else if (A.k === 'swing') gl(e.x + Math.cos(A.a) * 1.6, e.y + Math.sin(A.a) * 1.6, fz, 1.6 + 0.9 * k, 0.38, 0.2 + 0.35 * k, c);
        else gl(e.x, e.y, e.z + e.h * 0.6, 0.8 + 0.6 * k, 0.8 + 0.6 * k, 0.25 + 0.35 * k, c);
      }
      if (e && e.alive && e.m20sub) { const s = e.m20sub; gl(s.tx, s.ty, floorAt(s.tx, s.ty) - 0.08, 1.2 + Math.sin(t * 12) * 0.2, 0.35, 0.5, [140, 210, 255]); }
      // Lantern Wights carry light; Drowned Ones show as ripples
      let nw = 0;
      for (const w of G.enemies) {
        if (!w.alive || nw > 8) continue;
        if (w.type === 'm20wight') { nw++; gl(w.x, w.y, w.z + w.h * 0.72, 1.3, 1.3, 0.42 + 0.06 * Math.sin(t * 9 + w.x), [255, 200, 110]); }
        else if (w.type === 'm20drowned' && !w.awake) { nw++; gl(w.x, w.y, floorAt(w.x, w.y) - 0.06, 0.9 + 0.15 * Math.sin(t * 3 + w.y), 0.22, 0.3, [150, 210, 255]); }
      }
    } catch (er) { ER('boss sprites', er); }
    return S;
  };
  // death: feat + ledger + lore toast
  const _ke = killEnemy;
  killEnemy = function (e, o) {
    const was = e.alive, r = _ke.apply(this, arguments);
    try { if (was && e.m20boss) { const id = 'm20_' + e.type.slice(3); if (window.ACH) ACH.unlock(id); toast(e.d.title, e.d.death, e.d.col, 3); for (const h of G.enemies) if (h.alive && h.m20pack === e) killEnemy(h, {}); M14.marks.length = 0; e.m20inv = false; } } catch (er) { ER('boss death', er); }
    return r;
  };
  // ---------- floor treasures: weapons, the seal, lore pages, freed souls ----------
  const ITEMS = M20.FITEMS = {
    censer: { id: 'm20censer', kind: 'WEAPON', slot: 'whip', cost: 600, r: 'epic', name: 'CENSER FLAIL', icon: 'ic_m20censer', desc: 'A fire whip that swings a holy censer. Lashes ignite, and 1 in 3 leaves a green pyre that burns foes (6 every 0.5 s for 2.5 s).', where: 'THE UNDERCROFT (Stage 1, lower floor)' },
    trident: { id: 'm20trident', kind: 'WEAPON', slot: 'sword', cost: 900, r: 'epic', name: 'TIDECALLER TRIDENT', icon: 'ic_m20trident', desc: 'A rapier-quick thrust that PIERCES: each hit also strikes the next foe behind for 65%. +25% damage on flooded floors.', where: 'THE DROWNED CISTERN (Stage 4, lower floor)' },
    halberd: { id: 'm20halberd', kind: 'WEAPON', slot: 'sword', cost: 1200, r: 'legendary', name: 'STORMSPIRE HALBERD', icon: 'ic_m20halberd', desc: 'A storm blade on a pole. Heavy strikes call lightning down on the foe (22 dmg; 34 on upper floors, under the open sky).', where: 'THE STORM SPIRES (Stage 9, upper floor)' },
    seal: { id: 'm20seal', kind: 'RELIC', cost: 800, r: 'rare', name: "OATHKEEPER'S SEAL", icon: 'ic_m20seal', desc: 'Every parry heals 8 HP and gives 5 mana, and breaks 15% more posture.', where: 'THE CRYPT OF OATHS (Stage 9, lower floor)' },
  };
  M20.LANTERN = { id: 'm20lantern', cost: 1500, name: "THE WAYFINDER'S LANTERN", icon: 'ic_m20lantern', desc: 'Every run opens one more floor (4 instead of 3). Permanent.' };
  const fsv = () => FL.sv();
  const takeItem = (key) => {
    const I = ITEMS[key]; if (!I) return;
    if (key === 'censer') { P.wpn.whip = 'fire'; P.mods.m20censer = 1; }
    else if (key === 'trident') { P.wpn.sword = 'rapier'; P.mods.m20trident = 1; P.mods.m20halberd = 0; }
    else if (key === 'halberd') { P.wpn.sword = 'storm'; P.mods.m20halberd = 1; P.mods.m20trident = 0; }
    else if (key === 'seal') P.mods.m20seal = 1;
    else if (M20.takeExt && M20.takeExt[key]) M20.takeExt[key]();
    if (RUN.picks && !RUN.picks.includes(I.id)) RUN.picks.push(I.id);
  };
  M20.takeItem = takeItem;
  for (const key in ITEMS) { const I = ITEMS[key]; if (!UPG.some(u => u.id === I.id)) UPG.push({ id: I.id, kind: I.kind, r: I.r, name: I.name, icon: I.icon, desc: I.desc, ok: () => I.kind === 'RELIC' && !!SAVE.unl[I.id] && !P.mods.m20seal, take() { takeItem(key); } }); }
  // swapping to another weapon in that slot drops the floor weapon's effect
  const _tk = UPG.filter(u => u.kind === 'WEAPON' && !/^m20/.test(u.id));
  for (const u of _tk) { const t0 = u.take; u.take = function () { const r = t0.apply(this, arguments); try { if (P.wpn.whip !== 'fire') P.mods.m20censer = 0; if (P.wpn.sword !== 'rapier') P.mods.m20trident = 0; if (P.wpn.sword !== 'storm') P.mods.m20halberd = 0; if (/whip/.test(u.id)) P.mods.m20censer = 0; if (/sword|rapier|axe|blade|greatsword/.test(u.id)) { P.mods.m20trident = 0; P.mods.m20halberd = 0; } } catch (e) { } return r; }; }
  // pickups
  for (const key in ITEMS) {
    const I = ITEMS[key];
    PICK['m20bp_' + key] = { tex: I.icon, h: 0.5, gc: [255, 220, 120], f(p) {
      takeItem(key); const s = fsv(); const first = !s.bp[key]; s.bp[key] = (s.bp[key] | 0) + 1;
      G.bigText = { t1: I.name, t2: first ? 'Registered at the Altar: buy it to start runs with it.' : I.desc.split('.')[0] + '.', t: 0, dur: 3.2 }; SFX.play('secret', 0.9); try { writeSave(); } catch (e) { } return true; } };
  }
  const PAGES = M20.FLOORPAGES = [
    { id: 'f1u', title: "THE ROOFER'S PRAYER", fl: 's1u', hint: 'On the roof above Stage 1.', text: 'Lord, keep the slates on and the rain out, and if You must take somebody off this roof, take the pigeons. I have mended Your nave for fifty years. When the Lich came the sky went the wrong colour and I kept on mending. Somebody has to.' },
    { id: 'f1d', title: 'THE FIRST ABBOT', fl: 's1d', hint: 'Under the nave of Stage 1.', text: 'We chose the boy for his stubbornness, not his sword. The bloodline gives the Order one Kael in every age, and every one of them has said no to us first. This one said no twice. Good. The candle burns for whoever refuses to put it out.' },
    { id: 'f4u', title: 'THE BLOOD MOON SINGS', fl: 's4u', hint: 'On the walls above Stage 4.', text: 'The Huntmaster kept the hounds and the hounds kept the walls. Then the moon turned red and the hounds kept singing at it, and in the morning there were men in the kennels and wolves in the beds. He hunted every one. He saved the last for himself.' },
    { id: 'f4d', title: 'THE CISTERN MOTHER', fl: 's4d', hint: 'Under the fountain of Stage 4.', text: 'They threw the plague dead in the cistern because the ground was full. One woman went down to fetch her children back up. The water liked her. She is still down there, and she still counts heads, and she has never once counted right.' },
    { id: 'f9u', title: "VALCOR'S OATH II", fl: 's9u', hint: 'On the spires above Stage 9.', text: 'The Spire Warden swore to Valcor that no storm would take the cathedral roof. Four hundred years of storms, and the roof is still on. The bells rang themselves when he fell. That is the only honour the dead have left: to be rung for.' },
    { id: 'f9d', title: 'THE KNEELING DEAD', fl: 's9d', hint: 'Under the cathedral of Stage 9.', text: 'The Baron\'s knights knelt in the crypt and swore to wait for him. The water rose. They did not stand. When a Kael came down the stair at last they rose all at once, because an oath is a door, and you were the key.' },
  ];
  PICK.m20page = { tex: 'p_m9lore', h: 0.42, gc: [255, 220, 150], f(p) { const pg = PAGES.find(q => q.id === p.page); if (!pg) return true; const S = M20.npcSv ? M20.npcSv() : (SAVE.m20 = SAVE.m20 || { pg: {} }); S.pg = S.pg || {}; const first = !S.pg[pg.id]; S.pg[pg.id] = Date.now(); fsv().lore[pg.fl] = 1; G.bigText = { t1: pg.title, t2: first ? 'A new page for the Lore Book.' : 'You know this page.', t: 0, dur: 3 }; SFX.play('glint', 0.8); try { writeSave(); } catch (e) { } return true; } };
  PICK.m20soul = { tex: 'p_m10soul', h: 0.5, gc: [190, 220, 255], f(p) { const s = fsv(); const first = !s.souls[p.soul]; s.souls[p.soul] = Date.now(); if (typeof shardGain === 'function') shardGain(first ? 25 : 8, null); toast('A SOUL GOES FREE', first ? 'It thanks you on its way to the Chapel. +25 shards' : 'It is already free. +8 shards', '#c0e0ff', 2.8); SFX.play('ghost', 0.8); SFX.play('glint', 0.6); try { writeSave(); } catch (e) { } return true; } };
  // the coffer: extra treasures on clear
  for (const id of FL.order) {
    const def = FL.defs[id]; const pg = PAGES.find(q => q.fl === id); const prev = def.onClear;
    def.onClear = function (L, F, drop) {
      if (prev) try { prev.apply(this, arguments); } catch (e) { }
      if (pg) { const p = drop('m20page', -0.8, 0.6); p.page = pg.id; }
      if (def.bp && ITEMS[def.bp]) drop('m20bp_' + def.bp, 0, -0.9);
      if (def.soul) { const p = drop('m20soul', 0.8, -0.6); p.soul = def.soul; }
    };
  }
  // ---------- weapon effects (overlay-only, the view sprites are untouched) ----------
  const pyres = M20.pyres = [];
  const _oh = rogueOnHit;
  rogueOnHit = function (e, o, dmg) {
    const r = _oh.apply(this, arguments);
    try {
      if (!o || o.m20x || !P.mods) return r;
      if (o.src === 'whip' && P.mods.m20censer && Math.random() < 0.34 && pyres.length < 6) { pyres.push({ x: e.x, y: e.y, t: 0, tick: 0 }); SFX.play('fire', 0.4); }
      if (o.src === 'sword' && P.mods.m20trident) {
        let best = null, bd = 9; for (const q of G.enemies) { if (q === e || !q.alive || q.hidden) continue; const qx = q.x - e.x, qy = q.y - e.y, d = Math.hypot(qx, qy); if (d > 2.4) continue; if (Math.abs(angDiff(Math.atan2(qy, qx), P.ang)) > 0.55) continue; if (d < bd) { bd = d; best = q; } }
        if (best) { const wet = LEVEL.m20 && LEVEL.m20.water ? 1.25 : 1; damageEnemy(best, dmg * 0.65 * wet, { src: 'sword', m20x: 1, col: '#80e8ff', kb: 1 }); for (let i = 0; i < 8; i++) addP({ k: 'spark', x: best.x, y: best.y, z: best.z + 0.9, vx: rand(-1.5, 1.5), vy: rand(-1.5, 1.5), vz: rand(0, 2), size: 0.05, col: RGB(120, 230, 255), life: 0.45 }); }
      }
      if (o.src === 'sword' && o.heavy && P.mods.m20halberd && e.alive) {
        const up = LEVEL.m20 && FL.cur && FL.defs[FL.cur].which === 'up';
        damageEnemy(e, up ? 34 : 22, { src: 'magic', m20x: 1, col: '#c0e0ff', kb: 0.5 }); G.flashR = Math.max(G.flashR || 0, 0.12); SFX.play('heavy', 0.5);
        M20.bolts = M20.bolts || []; if (M20.bolts.length < 4) M20.bolts.push({ x: e.x, y: e.y, t: 0 });
      }
    } catch (er) { ER('fweapon hit', er); }
    return r;
  };
  if (window.M9 && M9.on) {
    M9.on('parry', () => { try { if (P.mods && P.mods.m20seal) { P.hp = Math.min(P.maxhp, P.hp + 8); P.mana = Math.min(P.maxmana, P.mana + 5); dmgNum(P.x + Math.cos(P.ang), P.y + Math.sin(P.ang), 1.6, '+8', '#c090ff'); const b = M14.engaged && M14.engaged(); if (b && b.postMax) postAdd(b, b.postMax * 0.15, false); } } catch (e) { } });
    M9.on('tick', dt => {
      try {
        for (let i = pyres.length - 1; i >= 0; i--) { const p = pyres[i]; p.t += dt; p.tick -= dt; if (p.t > 2.5) { pyres.splice(i, 1); continue; } if (p.tick <= 0) { p.tick = 0.5; for (const q of G.enemies) if (q.alive && !q.hidden && Math.hypot(q.x - p.x, q.y - p.y) < 1.15) damageEnemy(q, 6, { dot: true, col: '#90ff80', m20x: 1 }); } }
        if (M20.bolts) for (let i = M20.bolts.length - 1; i >= 0; i--) { M20.bolts[i].t += dt; if (M20.bolts[i].t > 0.25) M20.bolts.splice(i, 1); }
      } catch (e) { ER('fweapon tick', e); }
    });
    M9.on('sprites', X => {
      try {
        for (const p of pyres) { const k = 1 - p.t / 2.5; X.push({ tex: 'glow_w', x: p.x, y: p.y, z: floorAt(p.x, p.y) + 0.05, w: 1.6, h: 0.9 * k + 0.3, add: true, alpha: 0.55 * k + 0.15, lit: false, tint: [120, 255, 110, 1] }); }
        if (M20.bolts) for (const b of M20.bolts) X.push({ tex: 'glow_w', x: b.x, y: b.y, z: floorAt(b.x, b.y), w: 0.5, h: 6, add: true, alpha: 0.9 * (1 - b.t / 0.25), lit: false, tint: [190, 220, 255, 1] });
      } catch (e) { }
    });
  }
  // ---------- the altar: floor finds become buyable, plus the Lantern ----------
  if (M20.floorbuy) {
    const rows = [
      { tab: 2, id: 'ld_m20censer', m20: 'censer', slot: 'whip', need: 'm20censer', cost: ITEMS.censer.cost, name: 'START: CENSER FLAIL', icon: 'ic_m20censer' },
      { tab: 2, id: 'ld_m20trident', m20: 'trident', slot: 'sword', need: 'm20trident', cost: ITEMS.trident.cost, name: 'START: TIDECALLER TRIDENT', icon: 'ic_m20trident' },
      { tab: 2, id: 'ld_m20halberd', m20: 'halberd', slot: 'sword', need: 'm20halberd', cost: ITEMS.halberd.cost, name: 'START: STORMSPIRE HALBERD', icon: 'ic_m20halberd' },
      { tab: 1, id: 'm20seal', m20: 'seal', cost: ITEMS.seal.cost },
    ];
    if (M20.lantern) rows.push({ tab: 1, id: 'm20lantern', m20: 'lantern', cost: M20.LANTERN.cost });
    for (const r of rows) if (!ALTAR.items.some(i => i.id === r.id)) ALTAR.items.push(r);
    if (typeof LOCKED !== 'undefined') LOCKED.add('m20seal');
    const fl = () => { const s = fsv(); if (!s.load || typeof s.load !== 'object') s.load = {}; return s; };
    const _as = altarState;
    altarState = function (it) {
      if (!it || !it.m20) return _as.apply(this, arguments);
      const s = fl();
      if (it.m20 === 'lantern') return s.lantern ? { label: 'LIT', done: true } : { label: it.cost + '', cost: it.cost, can: SAVE.shards >= it.cost };
      if (!s.bp[it.m20]) return { label: 'FIND ON A FLOOR', locked: true };
      if (it.tab === 1) return SAVE.unl[it.id] ? { label: 'IN THE POOL', done: true } : { label: it.cost + '', cost: it.cost, can: SAVE.shards >= it.cost };
      const eq = s.load[it.slot] === it.m20;
      if (SAVE.unl[it.id]) return { label: eq ? 'EQUIPPED' : 'OWNED', done: true, equipped: eq };
      return { label: it.cost + '', cost: it.cost, can: SAVE.shards >= it.cost };
    };
    const _ai = altarInfo;
    altarInfo = function (it) {
      if (!it || !it.m20) return _ai.apply(this, arguments);
      if (it.m20 === 'lantern') return { name: M20.LANTERN.name, icon: M20.LANTERN.icon, desc: M20.LANTERN.desc, r: 'legendary' };
      const I = ITEMS[it.m20], found = fsv().bp[it.m20];
      return { name: it.tab === 2 ? it.name : I.name, icon: I.icon, desc: found ? (it.tab === 2 ? 'Begin every run wielding it. ' : '') + I.desc : 'Not yet found. It waits in ' + I.where + '.', r: I.r };
    };
    const _ab = altarBuy;
    altarBuy = function (it) {
      if (!it || !it.m20) { const r = _ab.apply(this, arguments); try { if (it && it.tab === 2 && SAVE.load[it.slot] === it.val && it.val !== 'base') { const s = fl(); if (s.load[it.slot]) { s.load[it.slot] = null; writeSave(); } } } catch (e) { } return r; }
      const st = altarState(it), s = fl();
      if (it.tab === 2 && st.done) { if (st.equipped) s.load[it.slot] = null; else { s.load[it.slot] = it.m20; SAVE.load[it.slot] = 'base'; } writeSave(); SFX.play('pickup'); return; }
      if (st.done || st.locked) { SFX.play('block', 0.4); return; }
      if (!st.can) { SFX.play('block', 0.4); ALTARUI.deny = 0.5; return; }
      SAVE.shards -= st.cost;
      if (it.m20 === 'lantern') s.lantern = 1; else { SAVE.unl[it.id] = 1; if (it.tab === 2) { s.load[it.slot] = it.m20; SAVE.load[it.slot] = 'base'; } }
      writeSave(); SFX.play('glint'); SFX.play('pickup'); ALTARUI.flash = 0.6; try { addBurst(); } catch (e) { }
    };
    const _am = applyMeta;
    applyMeta = function () {
      const r = _am.apply(this, arguments);
      try { const s = fl(); for (const slot of ['sword', 'whip']) { const k = s.load[slot]; if (k && ITEMS[k] && SAVE.unl['ld_m20' + k] && s.bp[k]) takeItem(k); } } catch (e) { ER('floor loadout', e); }
      return r;
    };
  }
  M20.fbossDbg = () => ({ bosses: BOSS.filter(t => EDEF[t]), foes: ['m20arbalest', 'm20murder', 'm20wight', 'm20drowned'].filter(t => EDEF[t]), boss: FL.boss && { type: FL.boss.type, hp: FL.boss.hp, max: FL.boss.maxhp, alive: FL.boss.alive }, minis: M14.minis.length, parked: !!parked });
})();
