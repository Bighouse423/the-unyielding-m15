// ===== m15a: TWO NEW MINI-BOSSES =====
// SEXTON MORROW, THE GRAVEDIGGER (stage 4, the courtyard): shovel swings, flung grave-dirt, and BURIAL LINES - the earth splits in a
//   glowing line from his shovel to you and erupts mound by mound. Phase 2: three lines in a fan, and he EXHUMES the dead (two risen
//   skeletons that crumble with him).
// LADY FERRUM, THE IRON MAIDEN (stage 6, the arena): throws a red-hot SAWBLADE that flies out along a lit lane and comes BACK to her
//   hand (dodge it twice), a CHAIN that drags you in, and a whirling sweep. Phase 2: two saws, and THE MAIDEN CLOSES - a ring of
//   spikes rises around you with one gap; get out through the gap before the centre fires.
// Both run on the m13/m14 mini-boss rules (name card, HP + POSTURE bars, two phases, posture break -> finisher, spoils) through
// M14.spawnMini; m15a only adds their AI, telegraphs, music, codex + feats. The Abyss can roll them too.
// ?m15=0 (or ?m15minis=0) -> m14 exactly.
const M15_SEGS = {"st_rc_dig":["RC","s",7.75558,0.24381,352773,1.95048,0.48762,0.591],"sb_verse":["SB","l",26.95766,0.55728,1213409,2.22912,0.55728,0.856],"st_e2_turn":["E2","s",5.73628,0.24381,263722,1.95048,0.48762,0.561],"e2_war":["E2","l",15.47823,0.48762,704094,1.95048,0.48762,0.751]};
const M15_FIGHTS = { sexton: ['st_rc_dig', 'sb_verse'], ferrum: ['st_e2_turn', 'e2_war'] };
(function () {
  const Q = location.search;
  const M15 = window.M15 = window.M15 || {}; M15.v = 'm15';
  const ON = !/[?&]m15=0/.test(Q) && !/[?&]m15minis=0/.test(Q) && !!(window.M14 && M14.on && M14.spawnMini);
  M15.minisOn = ON; M15.errA = null; M15.saws = [];
  if (!ON) return;
  const B13 = M13.B;
  EDEF.m15sexton = { spr: 's_m15sexton', h: 2.8, hp: 820, speed: 1.6, range: 2.7, windup: 0.75, strike: 0.25, recover: 0.85, dmg: 17, mat: 'flesh', kbRes: 0.06,
    name: 'Sexton Morrow', title: 'SEXTON MORROW', sub: 'The Gravedigger. He has a hole for everyone.', p2: '"Up, up, my lovelies. Up out of the dirt."', death: '"...dig... it... deep..."', col: '#a8ff90' };
  EDEF.m15ferrum = { spr: 's_m15ferrum', h: 2.85, hp: 800, speed: 1.5, range: 2.8, windup: 0.75, strike: 0.25, recover: 0.85, dmg: 18, mat: 'flesh', kbRes: 0.05,
    name: 'Lady Ferrum', title: 'LADY FERRUM', sub: 'The Iron Maiden. Champion of a crowd long dead.', p2: 'The Maiden opens her arms.', death: '"The crowd... is... silent..."', col: '#ff8a50' };
  UNDEAD.add('m15sexton'); UNDEAD.add('m15ferrum');
  const TYPES = ['m15sexton', 'm15ferrum'];
  const BASE = {}; TYPES.forEach(t => BASE[t] = [EDEF[t].speed, EDEF[t].windup]);
  // ---------- codex + feats ----------
  M13.addLore(['m15_sexton', 'SEXTON MORROW', 'He kept the courtyard graves for forty years and never once let one stay shut. When the ground glows in a line toward you, step off the line. When he laughs, the dead are coming up.']);
  M13.addLore(['m15_ferrum', 'LADY FERRUM', 'The arena\'s last champion had herself sealed inside an iron maiden so she could never lose again. Her saw always comes back to her. So should you: out of its lane, and out of the ring before it closes.']);
  const FEATS = [['m15_sexton', 'SIX FEET UNDER', 'Fell Sexton Morrow, the Gravedigger.'], ['m15_ferrum', 'THUMBS DOWN', 'Fell Lady Ferrum, the Iron Maiden.']];
  if (window.ACH) for (const [id, n, d] of FEATS) if (!ACH.list.some(a => a.id === id)) ACH.list.push({ id, n, d });
  if (window.M12 && M12.STEAM) for (const [id] of FEATS) M12.STEAM.map[id] = 'TU_' + id.toUpperCase();
  // ---------- music ----------
  const FK = { m15sexton: 'sexton', m15ferrum: 'ferrum' };
  if (window.M13E) {
    Object.assign(M13E.seg, M15_SEGS); Object.assign(M13E.map.boss, M15_FIGHTS);
    const _mh = M13E.miniHook, _nh = M13E.needHook;
    M13E.miniHook = p => { const e = M14.engaged && M14.engaged(); if (e && FK[e.type]) return FK[e.type]; return _mh ? _mh(p) : null; };
    M13E.needHook = p => { const out = _nh ? _nh(p) : []; for (const e of M14.minis) { const k = FK[e.type]; if (k) out.push(...M15_FIGHTS[k]); } return out; };
  }
  // ---------- helpers ----------
  const free = (x, y) => { const c = cellAt(x, y); return c >= 0 && !isSolid(c) && Math.abs(floorAt(x, y) - P.z) < 0.6; };
  const inBox = (bx, x, y) => x >= bx[0] && x < bx[2] && y >= bx[1] && y < bx[3];
  const grounded = () => P.z - floorAt(P.x, P.y) < 0.3;
  const mark = (o) => M14.marks.push(Object.assign({ t: 0, delay: 1, r: 1, dmg: 12, col: [255, 200, 90], k: 'pillar' }, o));
  function postAdd(e, n, parry) {
    if (!e.alive || e.m13brk) return;
    e.post += n; e.postT = G.time;
    if (e.post >= e.postMax) { e.post = 0; e.m13brk = true; e.stagger = 2.2; e.state = 'stagger'; e.m15a = null; G.slow = 0.35; SFX.play('roar', 0.6); toast('POSTURE BROKEN', 'Finish it!', '#ffd060', 1.4); }
    else if (parry) dmgNum(e.x, e.y, e.z + e.h + 0.3, 'POSTURE', '#ffd060');
  }
  const hit = (e, dmg, o) => { const r = hurtPlayer(dmg, e.x, e.y, Object.assign({ src: e }, o || {})); if (r === 'parry') postAdd(e, e.postMax * 0.35, true); return r; };
  const clod = (e, a, sp, dmg) => {
    const ez = e.z + e.h * 0.55, dist = Math.hypot(P.x - e.x, P.y - e.y);
    G.projectiles.push({ type: 'fireball', x: e.x + Math.cos(a) * 0.6, y: e.y + Math.sin(a) * 0.6, z: ez, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, vz: ((P.z + 1.0) - ez) / Math.max(0.5, dist) * sp, dmg, owner: e, life: 3,
      spr: (p) => { if (Math.random() < 0.5) addP({ k: 'dust', x: p.x, y: p.y, z: p.z, vx: 0, vy: 0, vz: -0.5, size: 0.05, col: RGB(110, 85, 60), life: 0.4 }); return { tex: 'glow_w', x: p.x, y: p.y, z: p.z - 0.2, w: 0.42, h: 0.42, add: false, alpha: 0.95, lit: false, tint: p.reflected ? [255, 210, 90, 1] : [90, 70, 50, 1] }; } });
  };
  // ---------- placement ----------
  const ST = { 4: 'm15sexton', 6: 'm15ferrum' };
  const hr = (k) => { let h = ((RUN.seed | 0) * 2654435761 + RUN.stage * 40503 + k * 977 + 15) >>> 0; h ^= h >>> 15; h = Math.imul(h, 2246822519) >>> 0; h ^= h >>> 13; return (h >>> 0) / 4294967296; };
  const _rsp = rogueStagePost;
  rogueStagePost = function () {
    try { for (const t in BASE) { EDEF[t].speed = BASE[t][0]; EDEF[t].windup = BASE[t][1]; } } catch (er0) { }
    const r = _rsp.apply(this, arguments);
    try {
      M15.saws.length = 0;
      const er = LEVEL.eliteRoom; if (!er || RUN.hub || (RUN.cfg && RUN.cfg.m13sanct)) return r;
      let t = !RUN.cfg.abyss ? ST[RUN.stage] : null;
      if (RUN.cfg.abyss && !M14.minis.length && hr(3) < 0.45) t = TYPES[(hr(4) * 2) | 0];
      if (M15.force) t = M15.force;
      if (!t) return r;
      if (M15.force) { for (const m of M14.minis) m.alive = false; M14.minis.length = 0; }
      G.enemies = G.enemies.filter(e => !e.eliteRoom);
      const e = M14.spawnMini(t, er.cx, er.cy); e.m15mini = true; e.m15a = null; e.m15cd = 1.4; e.m15n = 0; e.side = 1;
      G.totalEnemies = G.enemies.length;
    } catch (er2) { M15.errA = String(er2 && er2.stack || er2); }
    return r;
  };
  M15.spawn = (t, x, y) => { const e = M14.spawnMini(t, x, y); e.m15mini = true; e.m15a = null; e.m15cd = 1.4; e.m15n = 0; e.side = 1; return e; };
  // ---------- AI ----------
  function startAtk(e, k, dur, extra) { e.m15a = Object.assign({ k, ph: 'wind', t: 0, dur }, extra || {}); e.state = 'windup'; e.st = 0; }
  const _ue = updateEnemy;
  updateEnemy = function (e, dt) { if (e.m15mini) { try { return mini(e, dt); } catch (er) { M15.errA = String(er && er.stack || er); return; } } return _ue.apply(this, arguments); };
  function wake(e) {
    const d = e.d; e.awake = true; if (e.m14card) return; e.m14card = true;
    G.bigText = { t1: d.title, t2: d.sub, t: 0, dur: 2.9 };
    SFX.play('toll', 0.8); SFX.play('roar', 0.5); G.shake += 3; e.m15cd = 1.6;
    if (e.type === 'm15sexton') SFX.play('stone', 0.8); else SFX.play('clink', 1);
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
    const er = LEVEL.eliteRoom;
    if (!e.awake && ((er && inBox(er.box, P.x, P.y)) || (dist < 7 && los) || e.hp < e.maxhp)) wake(e);
    if (e.m13brk) { e.stagger -= dt; e.state = 'stagger'; if (e.stagger <= 0) { e.m13brk = false; e.state = 'chase'; e.m15a = null; e.m15cd = 0.6; } return; }
    e.stagger = 0; if (e.state === 'stagger') e.state = 'chase';
    if (!e.awake) { e.state = 'idle'; return; }
    if (G.time - (e.postT || 0) > 2.2) e.post = Math.max(0, e.post - e.postMax * 0.09 * dt);
    if (!e.phase2 && e.hp < e.maxhp * 0.5) {
      e.phase2 = true; e.d.speed *= 1.2; e.d.windup *= 0.88; G.flashR = 0.3; SFX.play('roar', 0.8); G.shake += 5;
      toast(d.title, d.p2, d.col, 2.6);
      if (e.type === 'm15sexton') { for (let i = 0; i < 16; i++) addP({ k: 'piece', x: e.x + rand(-1, 1), y: e.y + rand(-1, 1), z: floorAt(e.x, e.y), vx: rand(-2, 2), vy: rand(-2, 2), vz: rand(2, 5), size: 0.09, col: RGB(95, 75, 55), life: 1.6, rot: 0, vr: rand(-5, 5) }); e.m15cd = 0.2; e.m15n = 2; }
      else { SFX.play('clink', 1); e.m15n = 3; }
    }
    e.m15cd -= dt;
    const A = e.m15a;
    if (A) {
      A.t += dt;
      if (A.ph === 'wind') {
        if (A.track) A.a = A.a + clamp(angDiff(ang, A.a), -1.6 * dt, 1.6 * dt);
        if (A.lock !== undefined && A.t < A.dur - A.lock) { A.a = ang; A.tx = P.x; A.ty = P.y; }   // lanes follow you, then lock
        if (A.t >= A.dur) { A.ph = 'hit'; A.t = 0; e.state = 'strike'; act(e, A, dist, ang); }
      } else if (A.ph === 'hit') {
        if (A.k === 'whirl' && A.t < 0.5) { e.walk += dt * 30; }
        if (A.t >= 0.25) { A.ph = 'rec'; A.t = 0; e.state = 'recover'; }
      } else if (A.t >= (A.rec ?? d.recover)) { e.m15a = null; e.state = 'chase'; e.m15cd = rand(0.45, 1.0) * (e.phase2 ? 0.75 : 1); }
      return;
    }
    if (e.m15cd <= 0 && los) { if (choose(e, dist, ang)) return; }
    // movement: Ferrum keeps saw range when her blade is out; Sexton walks you down
    const sp = d.speed * (e.hurtT > e.hurtMax * 0.45 ? 0.3 : 1); let mx = 0, my = 0;
    const sawOut = M15.saws.some(s => s.src === e);
    if (e.type === 'm15ferrum' && sawOut) { const want = 4.5, tang = ang + Math.PI / 2 * e.side; mx = Math.cos(ang) * (dist - want) * 0.7 + Math.cos(tang) * 0.7; my = Math.sin(ang) * (dist - want) * 0.7 + Math.sin(tang) * 0.7; if (Math.random() < dt * 0.5) e.side *= -1; }
    else if (dist > d.range * 0.75) { mx = dx; my = dy; }
    const l = Math.hypot(mx, my) || 1; mx = mx / l * sp; my = my / l * sp;
    if (Math.abs(mx) + Math.abs(my) > 0.01) { moveEntity(e, mx * dt, my * dt, e.r * 0.8, 0.33, false); e.walk += Math.hypot(mx, my) * dt * 5.5; e.state = 'chase'; const lat = -mx * Math.sin(P.ang) + my * Math.cos(P.ang); if (Math.abs(lat) > 0.3) e.flip = lat < 0; }
  }
  function choose(e, dist, ang) {
    const d = e.d, n = ++e.m15n, p2 = e.phase2;
    if (e.type === 'm15sexton') {
      const risen = G.enemies.filter(h => h.alive && h.m14pack === e).length;
      if (p2 && risen < 2 && n % 4 === 3) { startAtk(e, 'exhume', 1.0); SFX.play('ghost', 0.8); return true; }
      if (n % 3 === 0 && dist < 11) { startAtk(e, 'bury', 1.15, { a: ang, lock: 0.45, fan: p2 ? 3 : 1 }); SFX.play('stone', 0.7); SFX.play('windup', 0.6); return true; }
      if (dist > 3.4 && dist < 10 && n % 2 === 1) { startAtk(e, 'fling', 0.7, { a: ang, track: true, n: p2 ? 5 : 3 }); SFX.play('step', 1); return true; }
      if (dist < d.range) { startAtk(e, 'shovel', d.windup, { a: ang, track: true }); SFX.play('windup', 0.7); return true; }
      return false;
    }
    // Ferrum
    const sawOut = M15.saws.some(s => s.src === e);
    if (p2 && n % 5 === 4) { startAtk(e, 'maiden', 0.5); SFX.play('clink', 1); SFX.play('toll', 0.5); return true; }
    if (!sawOut && dist > 2.5 && dist < 12 && n % 2 === 0) { startAtk(e, 'saw', 1.0, { a: ang, lock: 0.35, n: p2 ? 2 : 1 }); SFX.play('whip', 0.6); return true; }
    if (dist > 3 && dist < 6.5 && n % 3 === 1) { startAtk(e, 'chain', 0.85, { a: ang, lock: 0.3 }); SFX.play('clink', 0.8); return true; }
    if (dist < 3.2) { if (n % 2 || p2) { startAtk(e, 'whirl', 0.95, { r: 2.9 }); SFX.play('windup', 0.8); return true; } startAtk(e, 'slash', d.windup, { a: ang, track: true }); SFX.play('windup', 0.7); return true; }
    return false;
  }
  function act(e, A, dist, ang) {
    const d = e.d;
    switch (A.k) {
      case 'shovel': case 'slash': {
        SFX.play('swing', 0.9); const off = Math.abs(angDiff(ang, A.a));
        if (dist < d.range + 0.5 && off < 0.95 && Math.abs(P.z - e.z) < 1.4) hit(e, d.dmg);
        if (A.k === 'shovel') dust(e.x + Math.cos(A.a) * 1.6, e.y + Math.sin(A.a) * 1.6, floorAt(e.x, e.y), 8); else sparks(e.x + Math.cos(A.a) * 1.6, e.y + Math.sin(A.a) * 1.6, e.z + 0.8, 10, RGB(255, 140, 60));
        break;
      }
      case 'fling': { const n = A.n; for (let i = 0; i < n; i++) clod(e, A.a + (i - (n - 1) / 2) * 0.2, 6.6, 11); SFX.play('swing', 0.7); dust(e.x, e.y, floorAt(e.x, e.y), 6); break; }
      case 'bury': {   // the line of mounds erupts away from him, one after another
        SFX.play('heavy', 0.9); G.shake += 3;
        const fan = A.fan || 1;
        for (let f = 0; f < fan; f++) {
          const a = A.a + (f - (fan - 1) / 2) * 0.42;
          for (let i = 1; i <= 7; i++) { const x = e.x + Math.cos(a) * i * 1.15, y = e.y + Math.sin(a) * i * 1.15; if (!free(x, y)) break; mark({ x, y, delay: 0.12 + i * 0.11, r: 0.8, dmg: 14, col: [170, 255, 120], k: 'pillar', src: e }); }
        }
        A.rec = 0.8; break;
      }
      case 'exhume': {
        const want = 2 - G.enemies.filter(h => h.alive && h.m14pack === e).length;
        for (let i = 0, made = 0; i < 14 && made < want; i++) { const a = rand(0, TAU), r = rand(1.6, 3), x = e.x + Math.cos(a) * r, y = e.y + Math.sin(a) * r; if (!free(x, y)) continue;
          const s = makeEnemy('skeleton', x, y, { rise: true }); s.awake = true; s.summoned = true; s.m14pack = e; s.m13sum = e; s.hp = s.maxhp = Math.round(EDEF.skeleton.hp * (RUN.cfg.hp || 1) * 0.7); G.enemies.push(s); dust(x, y, floorAt(x, y), 10); made++; }
        SFX.play('stone', 0.8); A.rec = 0.5; break;
      }
      case 'saw': {
        const n = A.n || 1;
        for (let i = 0; i < n; i++) { const a = A.a + (n > 1 ? (i ? 0.32 : -0.32) : 0); M15.saws.push({ src: e, x: e.x + Math.cos(a) * 0.7, y: e.y + Math.sin(a) * 0.7, z: e.z + 1.3, a, d: 0, max: 8.5, back: false, hitO: false, hitB: false, t: 0 }); }
        SFX.play('whip', 1); SFX.play('swing', 0.8); A.rec = 0.5; break;
      }
      case 'chain': {
        SFX.play('whip', 0.9); SFX.play('clink', 0.8); const off = Math.abs(angDiff(ang, A.a));
        for (let i = 1; i <= 6; i++) sparks(e.x + Math.cos(A.a) * i, e.y + Math.sin(A.a) * i, e.z + 1.1, 2, RGB(200, 190, 180));
        if (dist < 6.8 && off < 0.32 && Math.abs(P.z - e.z) < 1.4) { const r = hit(e, 12); if (r === 'hit') { P.vx -= Math.cos(A.a) * 11; P.vy -= Math.sin(A.a) * 11; toast('CHAINED', 'She drags you in!', '#ff8a50', 1); } }
        A.rec = 0.6; break;
      }
      case 'whirl': { SFX.play('heavy', 0.9); const r = B13.ring(e.x, e.y, A.r, Math.round(d.dmg * 0.85), RGB(255, 120, 60), e); if (r === 'parry') postAdd(e, e.postMax * 0.3, true); G.shake += 4; break; }
      case 'maiden': {   // ring of spikes around you with one gap, then the centre
        const cx = P.x, cy = P.y, gap = rand(0, TAU), N = 9;
        for (let i = 0; i < N; i++) { const a = gap + (i + 1) / (N + 1) * TAU; const x = cx + Math.cos(a) * 1.9, y = cy + Math.sin(a) * 1.9; if (free(x, y)) mark({ x, y, delay: 1.25, r: 0.9, dmg: 15, col: [255, 120, 60], k: 'pillar', src: e }); }
        mark({ x: cx, y: cy, delay: 1.7, r: 1.2, dmg: 17, col: [255, 60, 40], k: 'pillar', src: e });
        M15.gapT = { x: cx + Math.cos(gap) * 1.9, y: cy + Math.sin(gap) * 1.9, t: 1.7 };
        toast('THE MAIDEN CLOSES', 'Find the gap!', '#ff8a50', 1.4); A.rec = 0.9; break;
      }
    }
  }
  // ---------- sawblades ----------
  function tick(dt) {
    for (let i = M15.saws.length - 1; i >= 0; i--) {
      const s = M15.saws[i], e = s.src; s.t += dt;
      if (!e || !e.alive) { M15.saws.splice(i, 1); continue; }
      const sp = 9.5 * dt;
      if (!s.back) {
        const nx = s.x + Math.cos(s.a) * sp, ny = s.y + Math.sin(s.a) * sp; s.d += sp;
        const c = cellAt(nx, ny); if (c < 0 || isSolid(c) || s.d > s.max) { s.back = true; SFX.play('clink', 0.7); sparks(s.x, s.y, s.z, 8, RGB(255, 160, 60)); } else { s.x = nx; s.y = ny; }
      } else {
        const tx = e.x - s.x, ty = e.y - s.y, l = Math.hypot(tx, ty); if (l < 0.7) { M15.saws.splice(i, 1); continue; }
        s.x += tx / l * sp * 1.1; s.y += ty / l * sp * 1.1;
      }
      if (Math.random() < dt * 40) addP({ k: 'ember', x: s.x, y: s.y, z: s.z, vx: rand(-1, 1), vy: rand(-1, 1), vz: rand(0, 1.5), size: 0.04, col: RGB(255, 150, 60), life: 0.25 });
      const k = s.back ? 'hitB' : 'hitO';
      if (!s[k] && Math.hypot(P.x - s.x, P.y - s.y) < 0.72 && Math.abs((P.z + 1.0) - s.z) < 1.0) { s[k] = true; const r = hurtPlayer(14, s.x, s.y, { src: e }); if (r === 'parry') { postAdd(e, e.postMax * 0.3, true); s.back = true; s.hitB = true; } }
    }
    if (M15.gapT) { M15.gapT.t -= dt; if (M15.gapT.t <= 0) M15.gapT = null; }
  }
  const _fi = frameInner;
  frameInner = function (now) { const r = _fi.apply(this, arguments); try { const dt = Math.min(0.05, G.m15lt ? (now - G.m15lt) / 1000 : 0.016); G.m15lt = now; if (G.state === 'play' && RUN.on) tick(dt); } catch (er) { M15.errA = String(er && er.stack || er); } return r; };
  // ---------- visuals ----------
  const COL = { m15sexton: [170, 255, 120], m15ferrum: [255, 130, 60] };
  const _rv = rogueVisual;
  rogueVisual = function (e, v) {
    v = _rv(e, v); if (!v || e.dead || !e.m15mini) return v;
    const A = e.m15a, c = COL[e.type];
    if (A && A.ph === 'wind') { const k = clamp(A.t / A.dur, 0, 1); v.tint = [c[0], c[1], c[2], 0.1 + 0.2 * k]; v.lean = -0.25 * k; if (A.k === 'whirl') { v.wave = 0.04 * k; v.waveF = 10; v.waveP = e.t * 30; } }
    else if (A && A.ph === 'hit') { v.lean = 0.4; if (A.k === 'whirl') v.flip = Math.floor(A.t * 16) % 2 === 0; }
    if (e.m13brk) v.tint = [255, 230, 120, 0.3 + 0.2 * Math.sin(e.t * 20)];
    if (e.phase2) v.glow = Math.max(v.glow || 0, 0.22);
    return v;
  };
  const _cs = collectSprites;
  collectSprites = function (cam) {
    const S = _cs(cam);
    try {
      if (G.state !== 'play' && G.state !== 'pause') return S;
      const t = G.time, gl = (x, y, z, w, h, al, c) => S.push({ tex: 'glow_w', x, y, z, w, h, add: true, alpha: al, lit: false, tint: [c[0], c[1], c[2], 1] });
      for (const e of M14.minis) {
        if (!e.alive || !e.m15mini || !e.m15a || e.m15a.ph !== 'wind') continue;
        const A = e.m15a, k = clamp(A.t / A.dur, 0, 1), fz = floorAt(e.x, e.y) - 0.1, lock = A.lock !== undefined && A.t >= A.dur - A.lock;
        if (A.k === 'bury') { const fan = A.fan || 1; for (let f = 0; f < fan; f++) { const a = A.a + (f - (fan - 1) / 2) * 0.42; for (let i = 1; i <= 7; i++) { const x = e.x + Math.cos(a) * i * 1.15, y = e.y + Math.sin(a) * i * 1.15; if (!free(x, y)) break; gl(x, y, floorAt(x, y) - 0.08, 0.8 + 0.4 * k, 0.3, 0.28 + 0.45 * k, lock ? [230, 255, 140] : [120, 220, 90]); } } }
        else if (A.k === 'saw') { const n = A.n || 1; for (let j = 0; j < n; j++) { const a = A.a + (n > 1 ? (j ? 0.32 : -0.32) : 0); for (let i = 1; i <= 8; i++) { const x = e.x + Math.cos(a) * i, y = e.y + Math.sin(a) * i; if (!free(x, y)) break; gl(x, y, floorAt(x, y) - 0.08, 0.7, 0.3, 0.3 + 0.5 * k, lock ? [255, 240, 120] : [255, 170, 80]); } } gl(e.x, e.y, e.z + 2.2, 0.9 + 0.6 * k, 0.9 + 0.6 * k, 0.3 + 0.4 * k, [255, 140, 60]); }
        else if (A.k === 'chain') for (let i = 1; i <= 6; i++) gl(e.x + Math.cos(A.a) * i, e.y + Math.sin(A.a) * i, fz + 0.03, 0.55, 0.26, 0.3 + 0.45 * k, lock ? [255, 255, 230] : [200, 220, 255]);
        else if (A.k === 'whirl') gl(e.x, e.y, fz, 1 + (A.r * 2 - 1) * k, 0.4, 0.25 + 0.4 * k, [255, 110, 50]);
        else if (A.k === 'shovel' || A.k === 'slash') gl(e.x + Math.cos(A.a) * 1.5, e.y + Math.sin(A.a) * 1.5, fz, 1.6 + 0.9 * k, 0.38, 0.2 + 0.35 * k, COL[e.type]);
        else if (A.k === 'exhume') gl(e.x, e.y, fz, 2 + 3 * k, 0.4, 0.25 + 0.35 * k, [150, 255, 120]);
        else gl(e.x, e.y, e.z + e.h * 0.6, 0.8 + 0.6 * k, 0.8 + 0.6 * k, 0.25 + 0.35 * k, COL[e.type]);
      }
      for (const s of M15.saws) {
        const fr = Math.floor(t * 18) % 2;
        S.push({ tex: 'p_m15saw' + fr, x: s.x, y: s.y, z: s.z - 0.4, w: 0.85, h: 0.85, lit: false, flip: Math.floor(t * 36) % 2 === 0 });
        gl(s.x, s.y, s.z - 0.35, 0.95, 0.95, 0.4, [255, 120, 40]);
        gl(s.x, s.y, floorAt(s.x, s.y) - 0.1, 0.6, 0.2, 0.3, [255, 100, 40]);
      }
      if (M15.gapT) { const g = M15.gapT; gl(g.x, g.y, floorAt(g.x, g.y) - 0.08, 1.1, 0.3, 0.35 + 0.25 * Math.sin(t * 14), [140, 255, 200]); }
    } catch (er) { M15.errA = String(er && er.stack || er); }
    return S;
  };
  // ---------- death: lore + feat (m14a already does the card, shards, spoils and the gauntlet count) ----------
  const _ke = killEnemy;
  killEnemy = function (e, o) {
    const was = e.alive, r = _ke.apply(this, arguments);
    try { if (was && e.m15mini) { M13.lore(e.type === 'm15sexton' ? 'm15_sexton' : 'm15_ferrum'); M13.feat(e.type === 'm15sexton' ? 'm15_sexton' : 'm15_ferrum'); for (let i = M15.saws.length - 1; i >= 0; i--) if (M15.saws[i].src === e) M15.saws.splice(i, 1); M15.gapT = null; M9.write && M9.write(); } } catch (er) { M15.errA = String(er && er.stack || er); }
    return r;
  };
})();
