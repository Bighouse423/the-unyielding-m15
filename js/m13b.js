// ===== m13b: NEW ENEMIES + MINI-BOSSES =====
// Bastion (shield: flank, heavy, bash or parry it), Bone Cantor (raises the dead / void bolts from range), Gallows Leaper
// (crouch tell, arcing leap, landing shock), Veil Stalker (purple smoke tell, then blinks behind you).
// Mini-bosses take over the elite room on stage 3 (THE CHARNEL BUTCHER) and stage 7 (SISTER MALEDICTION): name card,
// HP + POSTURE bars, two phases; a posture break opens a finisher (10% of its health, not an execution). Spoils still drop.
(function () {
  if (!window.M13 || !M13.on) return;
  const B = M13.B = { minis: [] };
  EDEF.m13bastion = { spr: 's_m13bastion', h: 2.15, hp: 150, speed: 1.35, range: 2.2, windup: 0.8, strike: 0.24, recover: 0.9, dmg: 18, mat: 'bone', kbRes: 0.35, name: 'a Bastion of the Black Court' };
  EDEF.m13cantor = { spr: 's_m13cantor', h: 2.05, hp: 90, speed: 1.5, range: 9, windup: 1.0, strike: 0.1, recover: 1.4, dmg: 12, mat: 'bone', kbRes: 0.7, ranged: true, keep: 5.5, name: 'a Bone Cantor' };
  EDEF.m13leaper = { spr: 's_m13leaper', h: 1.6, hp: 75, speed: 2.4, range: 4.5, windup: 0.65, strike: 0.45, recover: 0.95, dmg: 16, mat: 'flesh', kbRes: 0.9, lunge: 8.5, name: 'a Gallows Leaper' };
  EDEF.m13stalker = { spr: 's_m13stalker', h: 2.05, hp: 85, speed: 1.9, range: 2.0, windup: 0.5, strike: 0.22, recover: 0.8, dmg: 15, mat: 'flesh', kbRes: 0.6, name: 'a Veil Stalker' };
  EDEF.m13butcher = { spr: 's_m13butcher', h: 2.9, hp: 820, speed: 1.75, range: 2.7, windup: 0.75, strike: 0.25, recover: 0.8, dmg: 20, mat: 'flesh', kbRes: 0.06, name: 'the Charnel Butcher', title: 'THE CHARNEL BUTCHER', sub: 'He keeps the ossuary stocked' };
  EDEF.m13abbess = { spr: 's_m13abbess', h: 2.8, hp: 900, speed: 1.6, range: 9, windup: 0.9, strike: 0.2, recover: 0.9, dmg: 13, mat: 'bone', kbRes: 0.08, name: 'Sister Malediction', title: 'SISTER MALEDICTION', sub: 'Abbess of the Necropolis' };
  for (const k of ['m13bastion', 'm13cantor', 'm13abbess']) UNDEAD.add(k);
  // spawn pools (mid / late stages only; modest weights)
  const addPool = (th, type, w) => { const T = THEMES[th]; if (T && T.pool && !T.pool.some(p => p[0] === type)) T.pool.push([type, w]); };
  for (const [th, type, w] of [['belfry', 'm13leaper', 0.9], ['arena', 'm13bastion', 0.9], ['arena', 'm13leaper', 0.7], ['necropolis', 'm13cantor', 1.0], ['necropolis', 'm13stalker', 0.8],
    ['kennels', 'm13leaper', 1.0], ['kennels', 'm13stalker', 0.8], ['cathedral', 'm13bastion', 1.0], ['cathedral', 'm13cantor', 0.8], ['throne', 'm13bastion', 1.0], ['throne', 'm13cantor', 0.8],
    ['throne', 'm13stalker', 0.9], ['abyss', 'm13bastion', 0.6], ['abyss', 'm13cantor', 0.6], ['abyss', 'm13leaper', 0.6], ['abyss', 'm13stalker', 0.8], ['m13sanct', 'm13bastion', 1.0], ['m13sanct', 'm13stalker', 0.8]]) addPool(th, type, w);
  const LORE = [
    ['m13_bastion', 'THE BASTIONS', 'The Black Court\'s shield-wall. They turn slowly and never drop the tower shield. Go round, hit hard, bash it aside, or parry and punish.'],
    ['m13_cantor', 'THE BONE CANTORS', 'They sing the dead back up. Kill the singer and the choir falls silent.'],
    ['m13_leaper', 'THE GALLOWS LEAPERS', 'Hanged men who learned to jump. Watch for the crouch, then get out from under it.'],
    ['m13_stalker', 'THE VEIL STALKERS', 'They step through the smoke and out behind you. When the purple mist rises, turn around.'],
    ['m13_butcher', 'THE CHARNEL BUTCHER', 'He stocks the ossuary one carcass at a time. When he throws the hook, do not be on the end of it.'],
    ['m13_abbess', 'SISTER MALEDICTION', 'The abbess who prayed to the Lich instead. Her curses fly in threes, then in fives.'],
  ];
  for (const l of LORE) M13.addLore(l);
  const LORE_OF = { m13bastion: 'm13_bastion', m13cantor: 'm13_cantor', m13leaper: 'm13_leaper', m13stalker: 'm13_stalker', m13butcher: 'm13_butcher', m13abbess: 'm13_abbess' };
  const isNew = e => !!LORE_OF[e.type];
  const free = (x, y) => { const c = cellAt(x, y); return c >= 0 && !isSolid(c) && Math.abs(floorAt(x, y) - P.z) < 0.6; };
  const puff = (x, y, z, n, c) => { for (let i = 0; i < n; i++) addP({ k: 'ecto', x: x + rand(-0.35, 0.35), y: y + rand(-0.35, 0.35), z: z + rand(0.1, 1.8), vx: rand(-0.4, 0.4), vy: rand(-0.4, 0.4), vz: rand(0.2, 1.2), size: 0.08, col: c || RGB(170, 80, 255), life: 0.7 }); };
  const ring = (x, y, r, dmg, col, src) => { // ground shockwave: hurts if you are on the floor inside r
    for (let i = 0; i < 22; i++) { const a = i / 22 * TAU; addP({ k: 'ember', x: x + Math.cos(a) * r * 0.8, y: y + Math.sin(a) * r * 0.8, z: floorAt(x, y) + 0.1, vx: Math.cos(a) * 2, vy: Math.sin(a) * 2, vz: 1, size: 0.06, col, life: 0.4 }); }
    dust(x, y, floorAt(x, y), 10); G.shake += 3;
    if (Math.hypot(P.x - x, P.y - y) < r && P.z - floorAt(P.x, P.y) < 0.35) return hurtPlayer(dmg, x, y, { src });
    return 'none';
  };
  B.ring = ring;
  const summon = (e, type, n) => {
    let made = 0;
    for (let i = 0; i < n * 3 && made < n; i++) {
      const a = rand(0, TAU), r = rand(1.2, 2.4), x = e.x + Math.cos(a) * r, y = e.y + Math.sin(a) * r;
      const c = cellAt(x, y); if (c < 0 || isSolid(c) || Math.abs(floorAt(x, y) - e.z) > 0.5) continue;
      const s = makeEnemy(type, x, y, { rise: true }); s.awake = true; s.summoned = true; s.m13sum = e; s.hp = s.maxhp = Math.round(EDEF[type].hp * (RUN.cfg.hp || 1) * 0.8);
      G.enemies.push(s); dust(x, y, floorAt(x, y), 8); puff(x, y, floorAt(x, y), 6, RGB(110, 255, 150)); made++;
    }
    return made;
  };
  B.summon = summon;

  // ---------- strikes ----------
  const _es = enemyStrike;
  enemyStrike = function (e) {
    if (e.type === 'm13cantor') {
      const mine = G.enemies.filter(o => o.alive && o.m13sum === e).length;
      if (mine < 3 && (e.m13n = (e.m13n || 0) + 1) % 2 === 1) { if (summon(e, 'skeleton', 2)) { SFX.play('ghost', 0.6); SFX.play('rattle', 0.7); return; } }
      const a = Math.atan2(P.y - e.y, P.x - e.x); voidBolt(e, a, 6.2, e.d.dmg); voidBolt(e, a + 0.18, 6.2, e.d.dmg * 0.7); SFX.play('ghost', 0.5); return;
    }
    return _es.apply(this, arguments);
  };

  // ---------- AI ----------
  const _ue = updateEnemy;
  updateEnemy = function (e, dt) {
    if (e.m13mini) return miniUpdate(e, dt);
    if (!isNew(e) || e.dead || e.hidden) return _ue.apply(this, arguments);
    const pst = e.state;
    if (e.type === 'm13stalker' && e.alive) {
      e.m13cd = (e.m13cd ?? rand(1.5, 3)) - dt;
      if (e.m13blink > 0) { // smoke tell: frozen in place, purple mist, then appear behind you
        e.m13blink -= dt; e.t += dt; e.flash = Math.max(0, e.flash - dt * 10);
        if (Math.random() < dt * 30) puff(e.x, e.y, e.z, 1);
        if (e.m13blink <= 0) {
          const ba = P.ang + Math.PI, cands = [[ba, 1.7], [ba + 0.6, 1.7], [ba - 0.6, 1.7], [ba + 1.3, 1.6], [ba - 1.3, 1.6]];
          for (const [a, r] of cands) { const x = P.x + Math.cos(a) * r, y = P.y + Math.sin(a) * r; if (free(x, y) && losTo(x, y, P.x, P.y)) { puff(e.x, e.y, e.z, 12); e.x = x; e.y = y; e.z = floorAt(x, y); puff(x, y, e.z, 14); break; } }
          e.state = 'windup'; e.st = 0; e.awake = true; SFX.play('ghost', 0.8); SFX.play('windup', 0.7); try { SFX.ev('m13_blink', 0.9); } catch (er) { }
        }
        return;
      }
      const dist = Math.hypot(P.x - e.x, P.y - e.y);
      if (e.awake && e.state === 'chase' && e.m13cd <= 0 && dist > 3 && dist < 11 && e.stagger <= 0 && e.downT <= 0 && losTo(e.x, e.y, P.x, P.y)) { e.m13cd = rand(3.6, 5.2); e.m13blink = 0.65; SFX.play('ghost', 0.5); return; }
    }
    if (e.type === 'm13bastion' && e.alive) { // the shield turns slowly toward you
      const want = Math.atan2(P.y - e.y, P.x - e.x); if (e.m13face === undefined) e.m13face = want;
      const rate = e.state === 'strike' || e.state === 'recover' ? 0.3 : e.state === 'windup' ? 0.9 : 1.5;
      if (e.stagger <= 0 && e.downT <= 0) e.m13face += clamp(angDiff(want, e.m13face), -rate * dt, rate * dt);
    }
    const r = _ue.apply(this, arguments);
    if (e.type === 'm13leaper' && e.alive) {
      if (e.state === 'strike') { const g = floorAt(e.x, e.y); e.z = g + Math.sin(Math.PI * clamp(e.st / e.d.strike, 0, 1)) * 1.15; e.vz = 0; }
      if (pst === 'strike' && e.state === 'recover') { const g = floorAt(e.x, e.y); e.z = g; if (!e.hitDone) ring(e.x, e.y, 1.7, 9, RGB(255, 120, 60), e); else { dust(e.x, e.y, g, 8); G.shake += 2; } SFX.play('land', 0.7); }
      if (pst !== 'windup' && e.state === 'windup') { const a = Math.atan2(P.y - e.y, P.x - e.x); e.m13tx = e.x + Math.cos(a) * 3.8; e.m13ty = e.y + Math.sin(a) * 3.8; SFX.play('screech', 0.5); }
    }
    return r;
  };
  // bastion shield: frontal hits glance off (heavy / bash / burn / from the side get through); backstabs hurt more
  const _di = rogueDmgIn;
  rogueDmgIn = function (e, dmg, o) {
    dmg = _di(e, dmg, o);
    if (e.type === 'm13bastion' && e.alive && !o.dot && e.m13face !== undefined) {
      const from = Math.atan2(P.y - e.y, P.x - e.x), off = Math.abs(angDiff(from, e.m13face));
      const down = e.stagger > 0 || e.downT > 0 || e.state === 'strike';
      if (o.src === 'bash' && !down) { e.stagger = 1.3; e.state = 'stagger'; e.st = 0; dmgNum(e.x, e.y, e.z + e.h + 0.3, 'GUARD BROKEN', '#ffd060'); }
      else if (off < 1.05 && !down && !o.heavy && o.src !== 'finisher' && o.src !== 'burn' && o.src !== 'bleed') {
        dmg *= 0.15; sparks(e.x + Math.cos(e.m13face) * 0.4, e.y + Math.sin(e.m13face) * 0.4, e.z + e.h * 0.5, 10, RGB(255, 220, 120));
        if (!e.m13bt || G.time - e.m13bt > 0.6) { e.m13bt = G.time; dmgNum(e.x, e.y, e.z + e.h + 0.3, 'SHIELDED', '#ffd060'); SFX.play('block', 0.6); }
        if (!M13.sv().seen.bastion) { M13.sv().seen.bastion = 1; toast('THE SHIELD HOLDS', 'Flank it, use a heavy strike, bash it, or parry.', '#ffd060', 3.5); }
      } else if (off > 2.1) { dmg *= 1.25; if (!e.m13bs || G.time - e.m13bs > 0.6) { e.m13bs = G.time; dmgNum(e.x, e.y, e.z + e.h + 0.3, 'FLANKED', '#ff9a40'); } }
    }
    if (e.m13mini && o.finisher) { dmg = Math.round(e.maxhp * 0.1); e.m13brk = false; }
    return dmg;
  };
  // telegraphs
  const _rv = rogueVisual;
  rogueVisual = function (e, v) {
    v = _rv(e, v); if (!v || e.dead) return v;
    const wk = e.state === 'windup' ? clamp(e.st / e.d.windup, 0, 1) : 0;
    if (e.type === 'm13bastion') { if (wk) { v.lean = -0.22 * wk; v.tint = [255, 210, 110, 0.15 + 0.3 * wk]; } else if (e.state === 'strike') v.lean = 0.4; }
    else if (e.type === 'm13cantor') { v.glow = Math.max(v.glow || 0, 0.15); if (wk) { v.tint = [110, 255, 150, 0.2 + 0.35 * wk]; v.h *= 1 + 0.05 * wk; } }
    else if (e.type === 'm13leaper') { if (wk) { v.h *= 1 - 0.18 * wk; v.w *= 1 + 0.1 * wk; v.tint = [255, 90, 50, 0.2 + 0.35 * wk]; } else if (e.state === 'strike') v.lean = 0.35; }
    else if (e.type === 'm13stalker') { if (e.m13blink > 0) { v.alpha = 0.35 + 0.5 * e.m13blink; v.tint = [180, 80, 255, 0.6]; v.wave = 0.08; v.waveF = 6; v.waveP = e.t * 8; } else if (wk) v.tint = [200, 90, 255, 0.2 + 0.35 * wk]; }
    else if (e.m13mini) {
      const A = e.m13a; if (A && A.ph === 'wind') { const k = clamp(A.t / A.dur, 0, 1); v.tint = A.k === 'hook' ? [255, 200, 90, 0.25 + 0.35 * k] : e.type === 'm13abbess' ? [190, 90, 255, 0.25 + 0.35 * k] : [255, 60, 40, 0.2 + 0.4 * k]; v.lean = -0.25 * k; }
      else if (A && A.ph === 'hit') v.lean = 0.4;
      if (e.m13brk) v.tint = [255, 230, 120, 0.3 + 0.2 * Math.sin(e.t * 20)];
      if (e.phase2) v.glow = Math.max(v.glow || 0, 0.2);
    }
    return v;
  };
  const _cs = collectSprites;
  collectSprites = function (cam) {
    const S = _cs(cam);
    try {
      if (G.state !== 'play' && G.state !== 'pause') return S;
      const t = G.time, gl = (x, y, z, w, h, al, c) => S.push({ tex: 'glow_w', x, y, z, w, h, add: true, alpha: al, lit: false, tint: [c[0], c[1], c[2], 1] });
      for (const e of G.enemies) {
        if (!e.alive || e.hidden || (!isNew(e))) continue;
        if (e.type === 'm13bastion' && e.m13face !== undefined) { const k = e.state === 'windup' ? 0.25 : 0; gl(e.x + Math.cos(e.m13face) * 0.45, e.y + Math.sin(e.m13face) * 0.45, e.z + e.h * 0.45, 0.9, 1.2, 0.12 + k + 0.04 * Math.sin(t * 4), [255, 210, 110]); }
        if (e.type === 'm13leaper' && e.state === 'windup' && e.m13tx) { const k = clamp(e.st / e.d.windup, 0, 1); gl(e.m13tx, e.m13ty, floorAt(e.m13tx, e.m13ty) - 0.12, 1.0 + 1.6 * k, 0.3 + 0.2 * k, 0.25 + 0.35 * k, [255, 90, 50]); }
        if (e.type === 'm13stalker' && e.m13blink > 0) { gl(e.x, e.y, e.z + 0.9, 1.4, 2.0, 0.35, [170, 70, 255]); gl(P.x - Math.cos(P.ang) * 1.7, P.y - Math.sin(P.ang) * 1.7, P.z - 0.1, 1.2, 0.3, 0.3, [170, 70, 255]); }
        if (e.type === 'm13cantor' && e.state === 'windup') gl(e.x, e.y, e.z + e.h * 0.85, 0.7, 0.7, 0.3 + 0.4 * clamp(e.st / e.d.windup, 0, 1), [110, 255, 150]);
        if (e.m13mini && e.m13a && e.m13a.ph === 'wind') {
          const A = e.m13a, k = clamp(A.t / A.dur, 0, 1);
          if (A.k === 'hook') for (let i = 1; i <= 6; i++) { const f = i / 7; gl(e.x + (P.x - e.x) * f, e.y + (P.y - e.y) * f, floorAt(e.x, e.y) + 0.05, 0.5, 0.22, 0.2 + 0.4 * k, [255, 200, 90]); }
          else if (A.k === 'slam' || A.k === 'hex') gl(e.x, e.y, floorAt(e.x, e.y) - 0.12, 1 + (A.r * 2 - 1) * k, 0.4, 0.25 + 0.4 * k, A.k === 'hex' ? [190, 90, 255] : [255, 70, 40]);
          else if (A.k === 'orbs') gl(e.x, e.y, e.z + e.h * 0.7, 0.8 + 0.6 * k, 0.8 + 0.6 * k, 0.35 + 0.4 * k, [190, 90, 255]);
          else if (A.k === 'cleave') gl(e.x + Math.cos(A.a) * 1.6, e.y + Math.sin(A.a) * 1.6, floorAt(e.x, e.y) - 0.12, 1.8 + 1.0 * k, 0.4, 0.2 + 0.35 * k, [255, 60, 40]);
        }
      }
    } catch (er) { M13.err = String(er && er.stack || er); }
    return S;
  };

  // ---------- mini-bosses ----------
  const MINI_ST = { 3: 'm13butcher', 7: 'm13abbess' };
  M13.MINI_ST = MINI_ST;
  const _rsp = rogueStagePost;
  rogueStagePost = function () {
    const r = _rsp.apply(this, arguments);
    try {
      B.minis = [];
      const type = MINI_ST[RUN.stage], er = LEVEL.eliteRoom;
      if (type && er && !(RUN.cfg && (RUN.cfg.abyss || RUN.cfg.m13sanct)) && !RUN.hub) {
        G.enemies = G.enemies.filter(e => !e.eliteRoom);
        const e = makeEnemy(type, er.cx, er.cy); e.eliteRoom = true; e.m13mini = true; e.noElite = true;
        e.hp = e.maxhp = Math.round(EDEF[type].hp * (RUN.cfg.hp || 1)); e.postMax = Math.round(e.maxhp * 0.3); e.post = 0; e.m13a = null; e.m13cd = 1.2;
        e.d.speed *= RUN.cfg.spd || 1; G.enemies.push(e); B.minis.push(e); G.totalEnemies = G.enemies.length;
      }
    } catch (er2) { M13.err = String(er2 && er2.stack || er2); }
    return r;
  };
  const inBox = (bx, x, y) => x >= bx[0] && x < bx[2] && y >= bx[1] && y < bx[3];
  function startAtk(e, k, dur, extra) { e.m13a = Object.assign({ k, ph: 'wind', t: 0, dur }, extra || {}); e.state = 'windup'; e.st = 0; }
  function miniUpdate(e, dt) {
    const d = e.d; e.t += dt; e.flash = Math.max(0, e.flash - dt * 10); e.hurtT -= dt;
    if (e.dead) { updateDead(e, dt); return; }
    if (RUN.on && e.alive) { dt = rogueEnemyTick(e, dt); if (dt <= 0 || !e.alive) return; }
    if (e.frozen) return;
    e.freezeT = 0; e.downT = 0;
    if (Math.abs(e.kbx) + Math.abs(e.kby) > 0.01) { moveEntity(e, e.kbx * dt * 0.4, e.kby * dt * 0.4, e.r * 0.8, 0.33, false); e.kbx *= Math.pow(0.004, dt); e.kby *= Math.pow(0.004, dt); }
    const g = groundUnder(e.x, e.y, e.r * 0.5); if (e.z > g + 0.01) { e.vz -= 12 * dt; e.z += e.vz * dt; if (e.z < g) { e.z = g; e.vz = 0; } } else { e.z = g; e.vz = 0; }
    const dx = P.x - e.x, dy = P.y - e.y, dist = Math.hypot(dx, dy), los = losTo(e.x, e.y, P.x, P.y), ang = Math.atan2(dy, dx);
    // wake: the name card when you step into its room (or it is struck)
    const er = LEVEL.eliteRoom;
    if (!e.awake && ((er && inBox(er.box, P.x, P.y)) || (dist < 7 && los))) e.awake = true;
    if (e.awake && !e.m13card) {
      e.m13card = true; G.bigText = { t1: d.title, t2: d.sub, t: 0, dur: 2.8 }; SFX.play('toll', 0.8); SFX.play('roar', 0.5); G.shake += 3;
      try { SFX.ev(e.type === 'm13butcher' ? 'm13_butcher' : 'm13_abbess', 0.9); } catch (er3) { }
      e.m13cd = 1.6;
    }
    if (e.m13brk) { e.stagger -= dt; e.state = 'stagger'; if (e.stagger <= 0) { e.m13brk = false; e.state = 'chase'; e.m13a = null; e.m13cd = 0.6; } return; }
    e.stagger = 0;
    if (e.state === 'stagger') e.state = 'chase';
    if (!e.awake) { e.state = 'idle'; return; }
    // posture recovers when left alone
    if (G.time - (e.postT || 0) > 2.2) e.post = Math.max(0, e.post - e.postMax * 0.09 * dt);
    if (!e.phase2 && e.hp < e.maxhp * 0.5) {
      e.phase2 = true; e.d.speed *= 1.25; e.d.windup *= 0.85; G.flashR = 0.3; SFX.play('roar', 0.8); G.shake += 5;
      toast(d.title, e.type === 'm13butcher' ? 'He reaches for the hook.' : 'Her prayers turn to screams.', e.type === 'm13butcher' ? '#ff8060' : '#d090ff', 2.4);
      if (e.type === 'm13abbess') summon(e, 'skeleton', 2);
    }
    e.m13cd -= dt;
    const A = e.m13a;
    if (A) {
      A.t += dt;
      if (A.ph === 'wind') {
        if (A.k !== 'hook' && A.k !== 'orbs') A.a = A.a + clamp(angDiff(ang, A.a), -1.6 * dt, 1.6 * dt);
        if (A.t >= A.dur) { A.ph = 'hit'; A.t = 0; e.state = 'strike'; doAtk(e, A, dist, ang); }
      } else if (A.ph === 'hit') {
        if (A.k === 'pull' || A.k === 'hook') { if (A.pull > 0) { A.pull -= dt; const want = 1.8; if (dist > want) { const sp = Math.min(dist - want, 14 * dt); const nx = P.x - dx / dist * sp, ny = P.y - dy / dist * sp; if (!blocked(nx, ny, P.z, PR, 0.32)) { P.x = nx; P.y = ny; } } } }
        if (A.t >= 0.25) { A.ph = 'rec'; A.t = 0; e.state = 'recover'; }
      } else if (A.t >= (A.rec || d.recover)) { e.m13a = null; e.state = 'chase'; e.m13cd = rand(0.4, 1.1) * (e.phase2 ? 0.7 : 1); }
      return;
    }
    // choose an attack
    if (e.m13cd <= 0 && los) {
      if (e.type === 'm13butcher') {
        e.m13n = (e.m13n || 0) + 1;
        if (e.phase2 && dist > 3.8 && dist < 9.5 && e.m13n % 2 === 0) { startAtk(e, 'hook', 0.85, { a: ang }); SFX.play('swing', 0.6); try { SFX.ev('m13_hook', 0.8); } catch (er4) { } return; }
        if (dist < 3.2 && e.phase2 && e.m13n % 3 === 0) { startAtk(e, 'slam', 0.9, { r: 2.7 }); SFX.play('windup', 0.8); return; }
        if (dist < d.range) { startAtk(e, 'cleave', d.windup, { a: ang }); SFX.play('windup', 0.7); return; }
      } else {
        e.m13n = (e.m13n || 0) + 1;
        if (dist < 2.6 && e.phase2 && e.m13n % 2 === 0) { startAtk(e, 'blink', 0.45); puff(e.x, e.y, e.z, 10); SFX.play('ghost', 0.7); return; }
        if (dist < 2.4) { startAtk(e, 'hex', 0.8, { r: 2.3 }); SFX.play('windup', 0.7); return; }
        if (dist < 10) { startAtk(e, 'orbs', d.windup, { a: ang, n: e.phase2 ? 5 : 3 }); SFX.play('giggle', 0.5); return; }
      }
    }
    // move
    const sp = d.speed * (e.hurtT > e.hurtMax * 0.45 ? 0.3 : 1);
    let mx = 0, my = 0;
    if (e.type === 'm13abbess') { const want = 5.2, tang = ang + Math.PI / 2 * e.side; mx = Math.cos(ang) * (dist - want) * 0.7 + Math.cos(tang) * 0.6; my = Math.sin(ang) * (dist - want) * 0.7 + Math.sin(tang) * 0.6; if (Math.random() < dt * 0.4) e.side *= -1; }
    else if (dist > d.range * 0.75) { mx = dx; my = dy; }
    const l = Math.hypot(mx, my) || 1; mx = mx / l * sp; my = my / l * sp;
    if (Math.abs(mx) + Math.abs(my) > 0.01) { moveEntity(e, mx * dt, my * dt, e.r * 0.8, 0.33, false); e.walk += Math.hypot(mx, my) * dt * 5.5; e.state = 'chase'; const lat = -mx * Math.sin(P.ang) + my * Math.cos(P.ang); if (Math.abs(lat) > 0.3) e.flip = lat < 0; }
  }
  M13.miniUpdate = miniUpdate;
  function doAtk(e, A, dist, ang) {
    const d = e.d;
    if (A.k === 'cleave') {
      SFX.play('swing', 0.9); const off = Math.abs(angDiff(ang, A.a));
      if (dist < d.range + 0.5 && off < 0.9 && Math.abs(P.z - e.z) < 1.3) { const r = hurtPlayer(d.dmg, e.x, e.y, { src: e }); if (r === 'parry') hitPost(e, e.postMax * 0.35, true); }
      sparks(e.x + Math.cos(A.a) * 1.6, e.y + Math.sin(A.a) * 1.6, e.z + 0.3, 8, RGB(255, 120, 80));
    } else if (A.k === 'slam') { SFX.play('heavy', 0.9); const r = ring(e.x, e.y, A.r, Math.round(d.dmg * 0.75), RGB(255, 90, 50), e); if (r === 'parry') hitPost(e, e.postMax * 0.3, true); G.shake += 5; }
    else if (A.k === 'hook') {
      SFX.play('whip', 0.8);
      if (losTo(e.x, e.y, P.x, P.y) && dist < 10.5) { const r = hurtPlayer(8, e.x, e.y, { src: e }); if (r === 'hit' || r === 'block') { A.pull = 0.35; A.k = 'pull'; } else if (r === 'parry') hitPost(e, e.postMax * 0.4, true); }
      addBolt(e.x, e.y, e.z + 1.6, P.x, P.y, P.z + 1.0, RGB(200, 180, 150), 2);
    } else if (A.k === 'orbs') {
      const n = A.n, sp = n > 3 ? 0.2 : 0.25; for (let i = 0; i < n; i++) voidBolt(e, ang + (i - (n - 1) / 2) * sp, 6.0, d.dmg);
      SFX.play('ghost', 0.7); try { SFX.ev('m13_hex', 0.7); } catch (er) { }
    } else if (A.k === 'hex') { SFX.play('ghost', 0.8); const r = ring(e.x, e.y, A.r, 14, RGB(190, 90, 255), e); if (r === 'parry') hitPost(e, e.postMax * 0.3, true); }
    else if (A.k === 'blink') {
      for (let i = 0; i < 14; i++) { const a = rand(0, TAU), r = rand(5, 7), x = P.x + Math.cos(a) * r, y = P.y + Math.sin(a) * r; if (free(x, y) && losTo(x, y, P.x, P.y) && (!LEVEL.eliteRoom || inBox(LEVEL.eliteRoom.box, x, y) || i > 10)) { puff(e.x, e.y, e.z, 12); e.x = x; e.y = y; e.z = floorAt(x, y); puff(x, y, e.z, 12); break; } }
      A.rec = 0.3;
    }
  }
  function hitPost(e, n, parry) {
    if (!e.alive || e.m13brk) return;
    e.post += n; e.postT = G.time;
    if (e.post >= e.postMax) { e.post = 0; e.m13brk = true; e.stagger = 2.2; e.state = 'stagger'; e.m13a = null; G.slow = 0.35; SFX.play('roar', 0.6); toast('POSTURE BROKEN', 'Finish it!', '#ffd060', 1.4); }
    else if (parry) dmgNum(e.x, e.y, e.z + e.h + 0.3, 'POSTURE', '#ffd060');
  }
  const _de = damageEnemy;
  damageEnemy = function (e, dmg, o) {
    const hp0 = e.hp, r = _de.apply(this, arguments);
    if (e.m13mini && e.alive && !o.dot) hitPost(e, Math.max(0, hp0 - e.hp) * (o.heavy ? 1.5 : 1) * 0.9);
    return r;
  };
  GAME.dbg.damageEnemy = damageEnemy;
  const _hp = hurtPlayer;
  hurtPlayer = function (dmg, sx, sy, opt) {
    const r = _hp.apply(this, arguments);
    if (r === 'parry' && opt && opt.src && opt.src.type === 'm13bastion') { const e = opt.src; e.stagger = 1.2; e.state = 'stagger'; e.st = 0; }
    return r;
  };
  // kills: lore + feats + a bonus for the mini-bosses
  const _ke = killEnemy;
  killEnemy = function (e, o) {
    const was = e.alive, r = _ke.apply(this, arguments);
    try {
      if (was && LORE_OF[e.type]) {
        const k = M13.sv().kills; k[e.type] = (k[e.type] || 0) + 1; M9.write();
        M13.lore(LORE_OF[e.type]);
        if (e.m13mini) {
          G.bigText = { t1: e.d.title, t2: 'SLAIN', t: 0, dur: 2.6 }; SFX.play('roar', 0.6); G.shake += 6;
          if (typeof shardGain === 'function') shardGain(30, e);
          M13.feat(e.type === 'm13butcher' ? 'm13_butcher' : 'm13_abbess');
          for (const s of G.enemies) if (s.alive && s.m13sum === e) damageEnemy(s, 9999, { src: 'storm' });
        }
        if (e.type === 'm13cantor') for (const s of G.enemies) if (s.alive && s.m13sum === e) { s.stagger = 1.5; s.state = 'stagger'; s.st = 0; }
      }
    } catch (er) { }
    return r;
  };
  // HP + posture bars for a mini-boss you are fighting
  if (window.M8DRAW) M8DRAW.push(function (ctx) {
    if (!RUN.on || G.state !== 'play' || (G.boss && G.boss.awake && G.boss.alive)) return false;
    const e = B.minis.find(m => m.alive && m.awake && Math.hypot(m.x - P.x, m.y - P.y) < 16); if (!e) return false;
    e.hpLag = e.hpLag === undefined ? e.hp : (e.hpLag > e.hp ? Math.max(e.hp, e.hpLag - 0.016 * e.maxhp * 0.35) : e.hp);
    text(ctx, e.d.title, W / 2, 7, e.phase2 ? '#ff9a70' : '#ffd060', 'center');
    bar(ctx, 120, 19, 240, 6, e.hp / e.maxhp, e.phase2 ? '#e0402a' : '#d0102a', '#ff8090', '#1a0410', e.hpLag / e.maxhp, '#700010');
    const pf = e.m13brk ? 1 : e.post / e.postMax;
    ctx.fillStyle = '#1a1004'; ctx.fillRect(160, 27, 160, 3); ctx.fillStyle = e.m13brk ? (Math.sin(G.time * 20) > 0 ? '#fff0a0' : '#ffb030') : '#e8b030'; ctx.fillRect(160 + 80 * (1 - pf), 27, 160 * pf, 3);
    return true;
  });
})();
