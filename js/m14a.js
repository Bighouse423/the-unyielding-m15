// ===== m14a: FOUR NEW MINI-BOSSES =====
const M14_SEGS = {"st_sb_riff":["SB","s",9.00853,0.27864,409564,2.22912,0.55728,0.48],"e2_mid2":["E2","l",22.97406,0.48762,1034660,1.95048,0.48762,0.782],"st_eb_build":["EB","s",9.73034,0.30186,442420,2.41488,0.60372,0.84],"sd_climax":["SD","l",22.05095,0.4644,992927,1.8576,0.4644,0.568],"st_sd_lift":["SD","s",7.3832,0.2322,335839,1.8576,0.4644,0.588],"go_final":["GO","l",15.76571,0.48762,716772,1.95048,0.48762,0.661],"st_go_hit":["GO","s",7.77859,0.24381,353788,1.95048,0.48762,0.636],"rc_heavy4":["RC","l",15.34934,0.48762,698410,1.95048,0.48762,0.682]};
const M14_FIGHTS = {"gargoyle": ["st_sb_riff", "e2_mid2"], "knell": ["st_eb_build", "sd_climax"], "twins": ["st_sd_lift", "go_final"], "houndmaster": ["st_go_hit", "rc_heavy4"]};
// VESPERTINE THE ROOF-GARGOYLE (stage 2): claws, then climbs to the vault and DIVES on a marked spot; phase 2 double-dives + stone shards.
// BROTHER KNELL THE BELL-RINGER (stage 5): each TOLL sends a ring of sound across the floor (jump or roll through it) and warps the
//   room; phase 2 double tolls + "dirge" pillars that erupt under marked flagstones.
// THE TWIN CONFESSORS (stage 9): Brother Penance (flail sweep, charge) and Sister Vigil (holy bolts, judgement pillars, heals her
//   brother). Kill one and the other enrages.
// OLD GHAST, MASTER OF HOUNDS (Abyss pool): whistles up hellhounds, lashes a barbed chain, sets bear traps; phase 2 bull rush.
// The Abyss can also roll any of the six mini-bosses. All share the m13 rules: name card, HP + POSTURE bars, two phases, a posture
// break opens a finisher worth 10% of health, the elite room's spoils still drop.
(function () {
  const M14 = window.M14 = { on: !/[?&]m14=0/.test(location.search) && !!(window.M13 && M13.on), v: 'm14', err: null, minis: [] };
  if (!M14.on) return;
  const B13 = M13.B;
  // ---------- defs ----------
  EDEF.m14gargoyle = { spr: 's_m14gargoyle', h: 2.8, hp: 760, speed: 1.9, range: 2.6, windup: 0.7, strike: 0.25, recover: 0.8, dmg: 18, mat: 'stone', kbRes: 0.05,
    name: 'Vespertine', title: 'VESPERTINE', sub: 'She has watched this crypt for a thousand years', p2: 'The stone cracks. Something worse is underneath.', death: '"...back to the roof... at last..."', col: '#9dff70' };
  EDEF.m14knell = { spr: 's_m14knell', h: 2.75, hp: 900, speed: 1.45, range: 2.6, windup: 0.8, strike: 0.25, recover: 0.85, dmg: 17, mat: 'flesh', kbRes: 0.07,
    name: 'Brother Knell', title: 'BROTHER KNELL', sub: 'Every toll, a name. Every name, a grave.', p2: 'He rings the dirge.', death: '"The bell... falls... silent..."', col: '#ffd060' };
  EDEF.m14penance = { spr: 's_m14penance', h: 2.75, hp: 600, speed: 1.75, range: 2.7, windup: 0.75, strike: 0.25, recover: 0.8, dmg: 19, mat: 'flesh', kbRes: 0.06,
    name: 'Brother Penance', title: 'BROTHER PENANCE', sub: 'The Twin Confessors', p2: 'SISTER! I will finish your penance!', death: '"Absolve... me..."', col: '#ff7060' };
  EDEF.m14vigil = { spr: 's_m14vigil', h: 2.7, hp: 500, speed: 1.6, range: 9, windup: 0.85, strike: 0.2, recover: 0.9, dmg: 13, mat: 'flesh', kbRes: 0.08,
    name: 'Sister Vigil', title: 'SISTER VIGIL', sub: 'The Twin Confessors', p2: 'BROTHER! Then I will burn for us both.', death: '"The candle... is out..."', col: '#ffe08a' };
  EDEF.m14houndmaster = { spr: 's_m14houndmaster', h: 2.8, hp: 980, speed: 1.6, range: 3.2, windup: 0.75, strike: 0.25, recover: 0.85, dmg: 18, mat: 'flesh', kbRes: 0.06,
    name: 'Old Ghast', title: 'OLD GHAST, MASTER OF HOUNDS', sub: 'He feeds them what the Abyss leaves behind', p2: '"SIC \'EM!"', death: '"Good dogs... go... home..."', col: '#ffa050' };
  UNDEAD.add('m14houndmaster'); UNDEAD.add('m14penance'); UNDEAD.add('m14vigil');
  const TYPES = ['m14gargoyle', 'm14knell', 'm14penance', 'm14vigil', 'm14houndmaster'];
  // ---------- codex + feats ----------
  const LORE = [
    ['m14_gargoyle', 'VESPERTINE', 'Carved to keep the crypt\'s roof from the rain, she grew tired of rain and started keeping it from the living. When her shadow sharpens on the floor, move.'],
    ['m14_knell', 'BROTHER KNELL', 'The belfry\'s ringer counts the dead with his bell. Every toll rolls across the floor like a wave. Jump it, roll through it, and never stand where the flagstones glow.'],
    ['m14_twins', 'THE TWIN CONFESSORS', 'Penance takes the confession; Vigil burns the sin. Twins in life and in the Lich\'s service. She will mend him while she lives; kill her first, or be quick.'],
    ['m14_ghast', 'OLD GHAST', 'Kennel-keeper of the Abyss. He whistles and they come. Mind the iron jaws he leaves in the dust.'],
  ];
  for (const l of LORE) M13.addLore(l);
  const LORE_OF = { m14gargoyle: 'm14_gargoyle', m14knell: 'm14_knell', m14penance: 'm14_twins', m14vigil: 'm14_twins', m14houndmaster: 'm14_ghast' };
  const FEATS = [
    ['m14_gargoyle', 'GROUNDED', 'Fell Vespertine, the Roof-Gargoyle.'],
    ['m14_knell', 'FOR WHOM IT TOLLS', 'Fell Brother Knell.'],
    ['m14_twins', 'NO ABSOLUTION', 'Fell both Twin Confessors.'],
    ['m14_ghast', 'BAD DOG', 'Fell Old Ghast, Master of Hounds.'],
    ['m14_minis', 'GAUNTLET', 'Fell six different mini-bosses (across all runs).'],
  ];
  M14.FEATS = FEATS;
  if (window.ACH) for (const [id, n, d] of FEATS) if (!ACH.list.some(a => a.id === id)) ACH.list.push({ id, n, d });
  if (window.M12 && M12.STEAM) for (const [id] of FEATS) M12.STEAM.map[id] = 'TU_' + id.toUpperCase();
  const sv = () => { const s = M13.sv(); s.m14 = s.m14 || { minis: {} }; return s.m14; };
  // ---------- music: the sections + the m13e hooks ----------
  if (window.M13E) {
    Object.assign(M13E.seg, M14_SEGS); Object.assign(M13E.map.boss, M14_FIGHTS);
    const FK = { m14gargoyle: 'gargoyle', m14knell: 'knell', m14penance: 'twins', m14vigil: 'twins', m14houndmaster: 'houndmaster', m13butcher: 'butcher', m13abbess: 'abbess' };
    M13E.miniHook = p => { const e = engaged(); return e ? FK[e.type] || null : null; };
    M13E.needHook = p => { const out = []; for (const e of M14.minis) { const k = FK[e.type]; if (k && M13E.map.boss[k]) out.push(...M13E.map.boss[k]); } return out; };
  }
  // ---------- helpers ----------
  const free = (x, y) => { const c = cellAt(x, y); return c >= 0 && !isSolid(c) && Math.abs(floorAt(x, y) - P.z) < 0.6; };
  const inBox = (bx, x, y) => x >= bx[0] && x < bx[2] && y >= bx[1] && y < bx[3];
  const puff = (x, y, z, n, c) => { for (let i = 0; i < n; i++) addP({ k: 'ecto', x: x + rand(-0.4, 0.4), y: y + rand(-0.4, 0.4), z: z + rand(0.1, 1.8), vx: rand(-0.4, 0.4), vy: rand(-0.4, 0.4), vz: rand(0.2, 1.2), size: 0.08, col: c, life: 0.7 }); };
  const ring = (x, y, r, dmg, col, src) => B13.ring(x, y, r, dmg, col, src);
  const bolt = (e, a, sp, dmg, tint, ez) => {
    ez = ez ?? e.z + e.h * 0.62; const dist = Math.hypot(P.x - e.x, P.y - e.y);
    G.projectiles.push({ type: 'fireball', x: e.x + Math.cos(a) * 0.6, y: e.y + Math.sin(a) * 0.6, z: ez, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, vz: ((P.z + 1.0) - ez) / Math.max(0.5, dist) * sp, dmg, owner: e, life: 4,
      spr: (p) => { if (Math.random() < 0.5) addP({ k: 'ember', x: p.x, y: p.y, z: p.z, vx: 0, vy: 0, vz: 0.4, size: 0.05, col: RGB(tint[0], tint[1], tint[2]), life: 0.3 }); return { tex: 'glow_w', x: p.x, y: p.y, z: p.z - 0.25, w: 0.55, h: 0.55, add: true, alpha: 0.95, lit: false, tint: p.reflected ? [255, 210, 90, 1] : [tint[0], tint[1], tint[2], 1] }; } });
  };
  // ground marks that erupt after a delay (gargoyle dive point, dirge pillars, judgement, bear traps), and rolling sound rings
  const marks = M14.marks = [], waves = M14.waves = [];
  const mark = (o) => { marks.push(Object.assign({ t: 0, delay: 1, r: 1, dmg: 12, col: [255, 200, 90], k: 'pillar' }, o)); };
  function grounded() { return P.z - floorAt(P.x, P.y) < 0.3; }
  function postAdd(e, n, parry) {   // same rules as the m13 mini-bosses
    if (!e.alive || e.m13brk) return;
    e.post += n; e.postT = G.time;
    if (e.post >= e.postMax) { e.post = 0; e.m13brk = true; e.stagger = 2.2; e.state = 'stagger'; e.m14a = null; e.aloft = 0; G.slow = 0.35; SFX.play('roar', 0.6); toast('POSTURE BROKEN', 'Finish it!', '#ffd060', 1.4); }
    else if (parry) dmgNum(e.x, e.y, e.z + e.h + 0.3, 'POSTURE', '#ffd060');
  }
  const hit = (e, dmg, o) => { const r = hurtPlayer(dmg, e.x, e.y, Object.assign({ src: e }, o || {})); if (r === 'parry') postAdd(e, e.postMax * 0.35, true); return r; };
  function engaged() { return M14.minis.find(m => m.alive && m.awake && Math.hypot(m.x - P.x, m.y - P.y) < 18) || null; }
  M14.engaged = engaged;
  // ---------- placement ----------
  const ST = { 2: ['m14gargoyle'], 5: ['m14knell'], 9: ['m14penance', 'm14vigil'] };
  const ABYSS = ['m14houndmaster', 'm14houndmaster', 'm14gargoyle', 'm14knell', 'twins', 'm13butcher', 'm13abbess'];
  function spawnMini(type, x, y) {
    const e = makeEnemy(type, x, y); e.eliteRoom = true; e.m13mini = true; e.m14mini = true; e.noElite = true;
    const hpMul = (RUN.cfg.hp || 1);
    e.hp = e.maxhp = Math.round(EDEF[type].hp * hpMul); e.postMax = Math.round(e.maxhp * 0.3); e.post = 0; e.m14a = null; e.m14cd = 1.4; e.m14n = 0;
    e.d.speed *= RUN.cfg.spd || 1; G.enemies.push(e); M14.minis.push(e); return e;
  }
  M14.spawnMini = spawnMini;
  const BASE = {}; ['m13butcher','m13abbess','m14gargoyle','m14knell','m14penance','m14vigil','m14houndmaster'].forEach(t => { if (EDEF[t]) BASE[t] = [EDEF[t].speed, EDEF[t].windup]; });
  const resetDefs = () => { for (const t in BASE) { EDEF[t].speed = BASE[t][0]; EDEF[t].windup = BASE[t][1]; } };
  const _rsp = rogueStagePost;
  rogueStagePost = function () {
    try { resetDefs(); } catch (er0) { }
    const r = _rsp.apply(this, arguments);
    try {
      M14.minis = []; marks.length = 0; waves.length = 0;
      const er = LEVEL.eliteRoom; if (!er || RUN.hub || (RUN.cfg && RUN.cfg.m13sanct)) return r;
      let list = !RUN.cfg.abyss ? ST[RUN.stage] : null;
      const hr = (k) => { let h = ((RUN.seed | 0) * 2654435761 + RUN.stage * 40503 + k * 977) >>> 0; h ^= h >>> 15; h = Math.imul(h, 2246822519) >>> 0; h ^= h >>> 13; return (h >>> 0) / 4294967296; };
      if (RUN.cfg.abyss && hr(1) < 0.6) { const k = ABYSS[(hr(2) * ABYSS.length) | 0]; list = k === 'twins' ? ST[9] : [k]; }
      if (M14.force) list = M14.force === 'twins' ? ST[9] : [M14.force];
      if (!list) return r;
      G.enemies = G.enemies.filter(e => !e.eliteRoom); if (B13) B13.minis = [];
      list.forEach((t, i) => {
        const ox = list.length > 1 ? (i ? 1.2 : -1.2) : 0;
        if (t.startsWith('m13')) {   // an m13 mini-boss in the Abyss: m13's own AI runs it
          const e = makeEnemy(t, er.cx, er.cy); e.eliteRoom = true; e.m13mini = true; e.noElite = true;
          e.hp = e.maxhp = Math.round(EDEF[t].hp * (RUN.cfg.hp || 1)); e.postMax = Math.round(e.maxhp * 0.3); e.post = 0; e.m13a = null; e.m13cd = 1.2;
          G.enemies.push(e); B13.minis.push(e); M14.minis.push(e);
        } else spawnMini(t, er.cx + ox, er.cy);
      });
      const tw = M14.minis.filter(m => m.type === 'm14penance' || m.type === 'm14vigil'); if (tw.length === 2) { tw[0].twin = tw[1]; tw[1].twin = tw[0]; }
      G.totalEnemies = G.enemies.length;
    } catch (er2) { M14.err = String(er2 && er2.stack || er2); }
    return r;
  };
  // ---------- AI ----------
  function startAtk(e, k, dur, extra) { e.m14a = Object.assign({ k, ph: 'wind', t: 0, dur }, extra || {}); e.state = 'windup'; e.st = 0; }
  const _ue = updateEnemy;
  updateEnemy = function (e, dt) { if (e.m14mini) return mini(e, dt); return _ue.apply(this, arguments); };
  function wake(e) {
    const d = e.d; e.awake = true; if (e.m14card) return;
    const tw = e.twin; e.m14card = true; if (tw) { tw.m14card = true; tw.awake = true; }
    G.bigText = tw ? { t1: 'THE TWIN CONFESSORS', t2: 'Brother Penance and Sister Vigil', t: 0, dur: 3 } : { t1: d.title, t2: d.sub, t: 0, dur: 2.9 };
    SFX.play('toll', 0.8); SFX.play('roar', 0.5); G.shake += 3; e.m14cd = 1.6;
    if (e.type === 'm14gargoyle') SFX.play('stone', 0.9); if (e.type === 'm14houndmaster') SFX.play('howl', 0.9);
    try { SFX.ev(e.type === 'm14knell' ? 'm13_hex' : 'm13_butcher', 0.7); } catch (er) { }
  }
  function mini(e, dt) {
    const d = e.d; e.t += dt; e.flash = Math.max(0, e.flash - dt * 10); e.hurtT -= dt;
    if (e.dead) { updateDead(e, dt); return; }
    if (RUN.on && e.alive) { dt = rogueEnemyTick(e, dt); if (dt <= 0 || !e.alive) return; }
    if (e.frozen) return;
    e.freezeT = 0; e.downT = 0;
    if (Math.abs(e.kbx) + Math.abs(e.kby) > 0.01) { moveEntity(e, e.kbx * dt * 0.4, e.kby * dt * 0.4, e.r * 0.8, 0.33, false); e.kbx *= Math.pow(0.004, dt); e.kby *= Math.pow(0.004, dt); }
    const g = groundUnder(e.x, e.y, e.r * 0.5);
    if (e.aloft > 0) { e.z += (g + 4.2 - e.z) * Math.min(1, dt * 4); }
    else if (e.z > g + 0.01) { e.vz -= 14 * dt; e.z += e.vz * dt; if (e.z < g) { e.z = g; e.vz = 0; } } else { e.z = g; e.vz = 0; }
    const dx = P.x - e.x, dy = P.y - e.y, dist = Math.hypot(dx, dy), los = losTo(e.x, e.y, P.x, P.y), ang = Math.atan2(dy, dx);
    const er = LEVEL.eliteRoom;
    if (!e.awake && ((er && inBox(er.box, P.x, P.y)) || (dist < 7 && los) || e.hp < e.maxhp)) wake(e);
    if (e.m13brk) { e.aloft = 0; e.stagger -= dt; e.state = 'stagger'; if (e.stagger <= 0) { e.m13brk = false; e.state = 'chase'; e.m14a = null; e.m14cd = 0.6; } return; }
    e.stagger = 0; if (e.state === 'stagger') e.state = 'chase';
    if (!e.awake) { e.state = 'idle'; return; }
    if (G.time - (e.postT || 0) > 2.2) e.post = Math.max(0, e.post - e.postMax * 0.09 * dt);
    if (!e.phase2 && (e.hp < e.maxhp * 0.5 || (e.twin && !e.twin.alive))) {
      e.phase2 = true; e.d.speed *= 1.25; e.d.windup *= 0.85; G.flashR = 0.3; SFX.play('roar', 0.8); G.shake += 5;
      toast(d.title, d.p2, d.col, 2.6);
      if (e.type === 'm14houndmaster') { SFX.play('howl', 1); for (const h of G.enemies) if (h.alive && h.m14pack === e) { h.d = Object.assign({}, h.d, { speed: h.d.speed * 1.3 }); h.tint = [255, 120, 60, 0.3]; } }
      if (e.type === 'm14gargoyle') { for (let i = 0; i < 18; i++) addP({ k: 'piece', x: e.x, y: e.y, z: e.z + rand(0.5, 2.5), vx: rand(-3, 3), vy: rand(-3, 3), vz: rand(1, 4), size: 0.1, col: RGB(110, 105, 120), life: 2, rot: 0, vr: rand(-5, 5) }); }
    }
    e.m14cd -= dt;
    // Vigil mends her brother (interrupt her: hit her during the beam)
    if (e.type === 'm14vigil' && e.twin && e.twin.alive && !e.m14a && e.m14cd <= 0 && e.twin.hp < e.twin.maxhp * 0.7 && G.time - (e.healT || -99) > 9) { e.healT = G.time; startAtk(e, 'mend', 1.6); SFX.play('ghost', 0.6); return; }
    const A = e.m14a;
    if (A) {
      A.t += dt;
      if (A.ph === 'wind') {
        if (A.k === 'mend' && e.hurtT > 0 && A.t > 0.2) { e.m14a = null; e.state = 'chase'; dmgNum(e.x, e.y, e.z + e.h + 0.3, 'INTERRUPTED', '#ffd060'); postAdd(e, e.postMax * 0.25); e.m14cd = 1; return; }
        if (A.track) A.a = A.a + clamp(angDiff(ang, A.a), -1.6 * dt, 1.6 * dt);
        if (A.k === 'dive' && A.t < A.dur - 0.45) { A.tx = P.x; A.ty = P.y; }   // the shadow follows you, then locks
        if (A.k === 'rush') A.a = A.a + clamp(angDiff(ang, A.a), -0.8 * dt, 0.8 * dt);
        if (A.t >= A.dur) { A.ph = 'hit'; A.t = 0; e.state = 'strike'; act(e, A, dist, ang); }
      } else if (A.ph === 'hit') {
        if (A.k === 'rush' && A.t < 0.55) {   // bull rush along the locked line
          const sp = 11 * dt, nx = e.x + Math.cos(A.a) * sp, ny = e.y + Math.sin(A.a) * sp;
          if (!blocked(nx, ny, e.z, e.r, 0.33)) { e.x = nx; e.y = ny; dust(e.x, e.y, e.z, 2); } else A.t = 0.55;
          if (!A.done && Math.hypot(P.x - e.x, P.y - e.y) < 1.3) { A.done = true; const r = hit(e, Math.round(d.dmg * 1.2)); if (r === 'hit') { P.vx += Math.cos(A.a) * 9; P.vy += Math.sin(A.a) * 9; } }
          return;
        }
        if (A.t >= (A.k === 'rush' ? 0.6 : 0.25)) { A.ph = 'rec'; A.t = 0; e.state = 'recover'; }
      } else if (A.t >= (A.rec ?? d.recover)) { e.m14a = null; e.state = 'chase'; e.m14cd = rand(0.4, 1.0) * (e.phase2 ? 0.7 : 1); }
      return;
    }
    if (e.m14cd <= 0 && (los || e.type === 'm14knell')) { if (choose(e, dist, ang)) return; }
    // movement
    const sp = d.speed * (e.hurtT > e.hurtMax * 0.45 ? 0.3 : 1); let mx = 0, my = 0;
    if (e.type === 'm14vigil' || e.type === 'm14knell') { const want = e.type === 'm14vigil' ? 5.5 : 3.2, tang = ang + Math.PI / 2 * e.side; mx = Math.cos(ang) * (dist - want) * 0.7 + Math.cos(tang) * 0.6; my = Math.sin(ang) * (dist - want) * 0.7 + Math.sin(tang) * 0.6; if (Math.random() < dt * 0.4) e.side *= -1; }
    else if (dist > d.range * 0.75) { mx = dx; my = dy; }
    const l = Math.hypot(mx, my) || 1; mx = mx / l * sp; my = my / l * sp;
    if (Math.abs(mx) + Math.abs(my) > 0.01) { moveEntity(e, mx * dt, my * dt, e.r * 0.8, 0.33, false); e.walk += Math.hypot(mx, my) * dt * 5.5; e.state = 'chase'; const lat = -mx * Math.sin(P.ang) + my * Math.cos(P.ang); if (Math.abs(lat) > 0.3) e.flip = lat < 0; }
  }
  function choose(e, dist, ang) {
    const d = e.d, n = ++e.m14n, p2 = e.phase2;
    switch (e.type) {
      case 'm14gargoyle':
        if (n % 4 === 3 || (dist > 3 && n % 3 === 0) || dist > 6) { startAtk(e, 'dive', p2 ? 1.5 : 1.8, { tx: P.x, ty: P.y, chain: p2 ? 1 : 0 }); e.aloft = 1; SFX.play('screech', 0.8); SFX.play('stone', 0.5); return true; }
        if (p2 && n % 4 === 1 && dist < 10) { startAtk(e, 'shards', 0.7, { a: ang, track: true }); SFX.play('stone', 0.7); return true; }
        if (dist < d.range) { startAtk(e, 'claw', d.windup, { a: ang, track: true }); SFX.play('windup', 0.7); return true; }
        return false;
      case 'm14knell':
        if (dist < 2.6 && n % 2 === 0) { startAtk(e, 'smash', d.windup, { a: ang, track: true }); SFX.play('windup', 0.8); return true; }
        if (p2 && n % 3 === 0) { startAtk(e, 'dirge', 1.0); SFX.play('toll', 0.5); return true; }
        startAtk(e, 'toll', 1.0, { n: p2 ? 2 : 1 }); SFX.play('windup', 0.6); return true;
      case 'm14penance':
        if (dist > 4 && dist < 10 && n % 3 === 0) { startAtk(e, 'rush', 0.9, { a: ang }); SFX.play('roar', 0.5); return true; }
        if (dist < 3.2 && (n % 2 === 0 || p2)) { startAtk(e, 'sweep', 0.95, { r: 2.9 }); SFX.play('windup', 0.8); return true; }
        if (dist < d.range) { startAtk(e, 'flail', d.windup, { a: ang, track: true }); SFX.play('windup', 0.7); return true; }
        return false;
      case 'm14vigil':
        if (n % 3 === 0) { startAtk(e, 'judge', 0.4); SFX.play('ghost', 0.6); return true; }
        if (dist < 11) { startAtk(e, 'holy', d.windup, { a: ang, track: true, n: p2 ? 5 : 3 }); SFX.play('fire', 0.4); return true; }
        return false;
      case 'm14houndmaster': {
        const pack = G.enemies.filter(h => h.alive && h.m14pack === e).length;
        if (pack < (p2 ? 3 : 2) && n % 3 === 1) { startAtk(e, 'whistle', 0.8); SFX.play('howl', 0.7); return true; }
        if (p2 && dist > 4 && dist < 11 && n % 3 === 0) { startAtk(e, 'rush', 0.95, { a: ang }); SFX.play('roar', 0.6); return true; }
        if (n % 4 === 2) { startAtk(e, 'traps', 0.6); SFX.play('clink', 0.6); return true; }
        if (dist < 5.5) { startAtk(e, 'lash', d.windup, { a: ang, track: true }); SFX.play('whip', 0.5); return true; }
        return false;
      }
    }
    return false;
  }
  function act(e, A, dist, ang) {
    const d = e.d;
    switch (A.k) {
      case 'claw': case 'flail': case 'smash': {
        SFX.play('swing', 0.9); const off = Math.abs(angDiff(ang, A.a));
        if (dist < d.range + 0.5 && off < 0.95 && Math.abs(P.z - e.z) < 1.4) hit(e, A.k === 'smash' ? d.dmg + 3 : d.dmg);
        sparks(e.x + Math.cos(A.a) * 1.6, e.y + Math.sin(A.a) * 1.6, e.z + 0.4, 8, RGB(255, 150, 90)); break;
      }
      case 'sweep': { SFX.play('heavy', 0.9); const r = ring(e.x, e.y, A.r, Math.round(d.dmg * 0.8), RGB(255, 90, 60), e); if (r === 'parry') postAdd(e, e.postMax * 0.3, true); G.shake += 4; break; }
      case 'dive': {   // slam down on the locked mark
        e.aloft = 0; const tx = A.tx, ty = A.ty;
        if (!blocked(tx, ty, floorAt(tx, ty), e.r, 0.5)) { e.x = tx; e.y = ty; }
        e.z = floorAt(e.x, e.y) + 0.2; SFX.play('heavy', 1); SFX.play('stone', 0.8); G.shake += 7;
        const r = ring(e.x, e.y, 2.3, 22, RGB(160, 255, 120), e); if (r === 'parry') postAdd(e, e.postMax * 0.35, true);
        for (let i = 0; i < 14; i++) addP({ k: 'piece', x: e.x, y: e.y, z: e.z + 0.2, vx: rand(-4, 4), vy: rand(-4, 4), vz: rand(2, 5), size: 0.08, col: RGB(120, 115, 130), life: 1.6, rot: 0, vr: rand(-6, 6) });
        if (A.chain > 0) { A.chain--; A.ph = 'wind'; A.t = 0; A.dur = 1.2; e.aloft = 1; e.state = 'windup'; }
        else A.rec = 1.1;   // she is grounded for a while after the last dive: punish window
        break;
      }
      case 'shards': for (let i = 0; i < 3; i++) bolt(e, A.a + (i - 1) * 0.22, 7, 12, [170, 165, 190]); break;
      case 'toll': {
        SFX.play('toll', 1); G.shake += 3; M14.warp = 0.7;
        for (let i = 0; i < A.n; i++) waves.push({ x: e.x, y: e.y, r: 0.6 - i * 2.4, sp: 6, max: 11, dmg: 14, src: e, hit: false });
        A.rec = 0.6; break;
      }
      case 'dirge': {
        SFX.play('toll', 0.9); M14.warp = 0.5;
        for (let i = 0; i < 5; i++) { const a = rand(0, TAU), r = i === 0 ? 0 : rand(1.5, 4.5); const x = P.x + Math.cos(a) * r, y = P.y + Math.sin(a) * r; if (free(x, y)) mark({ x, y, delay: 1.1 + i * 0.12, r: 0.95, dmg: 15, col: [255, 210, 90], k: 'pillar', src: e }); }
        A.rec = 0.5; break;
      }
      case 'holy': { const n = A.n, sp = n > 3 ? 0.18 : 0.24; for (let i = 0; i < n; i++) bolt(e, A.a + (i - (n - 1) / 2) * sp, 6.4, d.dmg, [255, 220, 120]); SFX.play('fire', 0.6); break; }
      case 'judge': mark({ x: P.x, y: P.y, delay: 0.95, r: 1.05, dmg: 16, col: [255, 235, 150], k: 'pillar', src: e }); if (e.phase2) mark({ x: P.x + P.vx * 0.6, y: P.y + P.vy * 0.6, delay: 1.35, r: 1.05, dmg: 16, col: [255, 235, 150], k: 'pillar', src: e }); A.rec = 0.4; break;
      case 'mend': { const t = e.twin; if (t && t.alive) { const h = Math.round(t.maxhp * 0.06); t.hp = Math.min(t.maxhp, t.hp + h); dmgNum(t.x, t.y, t.z + t.h + 0.3, '+' + h, '#ffe08a'); addBolt(e.x, e.y, e.z + 2, t.x, t.y, t.z + 1.5, RGB(255, 230, 140), 2); SFX.play('heal', 0.6); } break; }
      case 'whistle': {
        const pack = G.enemies.filter(h => h.alive && h.m14pack === e).length, want = (e.phase2 ? 3 : 2) - pack;
        for (let i = 0, made = 0; i < 12 && made < want; i++) { const a = rand(0, TAU), r = rand(1.4, 2.6), x = e.x + Math.cos(a) * r, y = e.y + Math.sin(a) * r; if (!free(x, y)) continue;
          const h = makeEnemy('hellhound', x, y); h.awake = true; h.summoned = true; h.m14pack = e; h.m13sum = e; h.hp = h.maxhp = Math.round(EDEF.hellhound.hp * (RUN.cfg.hp || 1) * 0.75); G.enemies.push(h); puff(x, y, floorAt(x, y), 8, RGB(255, 140, 60)); made++; }
        A.rec = 0.4; break;
      }
      case 'lash': {
        SFX.play('whip', 0.9); const off = Math.abs(angDiff(ang, A.a));
        if (dist < 5.8 && off < 0.7 && Math.abs(P.z - e.z) < 1.4) hit(e, d.dmg);
        for (let i = 1; i <= 5; i++) sparks(e.x + Math.cos(A.a) * i * 1.1, e.y + Math.sin(A.a) * i * 1.1, e.z + 1.1, 2, RGB(255, 170, 90)); break;
      }
      case 'traps': for (let i = 0; i < 3; i++) { const a = ang + rand(-1.2, 1.2), r = rand(1.5, 4), x = e.x + Math.cos(a) * r, y = e.y + Math.sin(a) * r; if (free(x, y)) mark({ x, y, delay: 0.6, life: 14, r: 0.55, dmg: 12, col: [255, 150, 70], k: 'trap', src: e }); } A.rec = 0.4; break;
      case 'rush': A.done = false; SFX.play('heavy', 0.6); break;
    }
  }
  // marks + waves tick, and the root from a bear trap
  let rootT = 0, rootX = 0, rootY = 0;
  function tick(dt) {
    for (let i = marks.length - 1; i >= 0; i--) {
      const m = marks[i]; m.t += dt; const dd = Math.hypot(P.x - m.x, P.y - m.y);
      if (m.k === 'trap') {
        if (m.t > m.delay && dd < m.r && grounded()) { marks.splice(i, 1); SFX.play('clink', 1); SFX.play('heavy', 0.5); const r = hurtPlayer(m.dmg, m.x, m.y, { src: m.src, unblockable: true, nopd: true }); if (r === 'hit') { rootT = 0.9; rootX = P.x; rootY = P.y; toast('TRAPPED', 'Iron jaws!', '#ffa050', 1); } continue; }
        if (m.t > m.life || !(m.src && m.src.alive)) marks.splice(i, 1);
        continue;
      }
      if (m.t >= m.delay) {
        marks.splice(i, 1); SFX.play('fire', 0.6); G.shake += 2;
        for (let k = 0; k < 16; k++) addP({ k: 'ember', x: m.x + rand(-0.3, 0.3), y: m.y + rand(-0.3, 0.3), z: floorAt(m.x, m.y) + rand(0, 0.4), vx: rand(-0.5, 0.5), vy: rand(-0.5, 0.5), vz: rand(3, 6), size: 0.07, col: RGB(m.col[0], m.col[1], m.col[2]), life: 0.6 });
        if (dd < m.r && P.z - floorAt(m.x, m.y) < 1.5) hurtPlayer(m.dmg, m.x, m.y, { src: m.src, unblockable: true });
      }
    }
    for (let i = waves.length - 1; i >= 0; i--) {
      const w = waves[i]; const r0 = w.r; w.r += w.sp * dt; if (w.r > w.max || !(w.src && w.src.alive)) { waves.splice(i, 1); continue; }
      if (w.r <= 0) continue;
      const dd = Math.hypot(P.x - w.x, P.y - w.y);
      if (!w.hit && dd > r0 - 0.35 && dd < w.r + 0.35 && grounded()) { w.hit = true; const r = hurtPlayer(w.dmg, w.x, w.y, { src: w.src, unblockable: true }); if (r === 'hit') { const a = Math.atan2(P.y - w.y, P.x - w.x); P.vx += Math.cos(a) * 5; P.vy += Math.sin(a) * 5; } }
    }
    if (rootT > 0) { rootT -= dt; P.x = rootX; P.y = rootY; P.vx = 0; P.vy = 0; }
    if (M14.warp > 0) M14.warp = Math.max(0, M14.warp - dt);
  }
  const _fi = frameInner;
  frameInner = function (now) { const r = _fi.apply(this, arguments); try { const dt = Math.min(0.05, G.m14lt ? (now - G.m14lt) / 1000 : 0.016); G.m14lt = now; if (G.state === 'play' && RUN.on) tick(dt * (G.slow ? 1 : 1)); } catch (er) { M14.err = String(er && er.stack || er); } return r; };
  // ---------- damage: posture from hits; twins share the pain a little; sprite telegraphs ----------
  const _de = damageEnemy;
  damageEnemy = function (e, dmg, o) {
    if (e.m14mini && e.aloft > 0 && !(o && o.dot)) { dmgNum(e.x, e.y, e.z + 0.5, 'OUT OF REACH', '#aaa'); return; }
    return _de.apply(this, arguments);
  };
  GAME.dbg.damageEnemy = damageEnemy;
  const _rv = rogueVisual;
  rogueVisual = function (e, v) {
    v = _rv(e, v); if (!v || e.dead || !e.m14mini) return v;
    const A = e.m14a, c = { m14gargoyle: [150, 255, 110], m14knell: [255, 210, 90], m14penance: [255, 80, 60], m14vigil: [255, 230, 140], m14houndmaster: [255, 150, 70] }[e.type];
    if (A && A.ph === 'wind') { const k = clamp(A.t / A.dur, 0, 1); v.tint = [c[0], c[1], c[2], 0.2 + 0.4 * k]; v.lean = -0.25 * k; if (A.k === 'toll') { v.wave = 0.05 * k; v.waveF = 8; v.waveP = e.t * 30; } }
    else if (A && A.ph === 'hit') v.lean = 0.4;
    if (e.aloft > 0) v.alpha = 0.85;
    if (e.m13brk) v.tint = [255, 230, 120, 0.3 + 0.2 * Math.sin(e.t * 20)];
    if (e.phase2) v.glow = Math.max(v.glow || 0, 0.22);
    v.m14pull = 1;
    return v;
  };
  const _cs = collectSprites;
  collectSprites = function (cam) {
    const S = _cs(cam);
    // bell fix: the minis are ~2 tiles wide (Knell's bell, the mace, wings) but stand ~0.5 from walls, so a side wall in front of the
    // sprite's centre cut the wide parts off with a hard vertical edge. Slide the sprite toward the camera along its view ray and
    // shrink it by the same ratio: identical screen position and size, but the depth test now sees the front of the body, not its centre.
    try {
      const dx = Math.cos(cam.ang), dy = Math.sin(cam.ang);
      for (let i = 0; i < S.length; i++) {
        const v = S[i]; if (!v || !v.m14pull) continue;
        const d = (v.x - cam.x) * dx + (v.y - cam.y) * dy; const D = Math.min(v.w * 0.3, 0.6, d - 1.1);
        if (!(D > 0)) continue;
        const f = (d - D) / d;   // a copy: the visual object can be reused frame to frame, so never scale it in place
        S[i] = Object.assign({}, v, { x: cam.x + (v.x - cam.x) * f, y: cam.y + (v.y - cam.y) * f, z: cam.eye + (v.z - cam.eye) * f, w: v.w * f, h: v.h * f, m14pull: 0 });
      }
    } catch (er) { M14.err = String(er && er.stack || er); }
    try {
      if (G.state !== 'play' && G.state !== 'pause') return S;
      const t = G.time, gl = (x, y, z, w, h, al, c) => S.push({ tex: 'glow_w', x, y, z, w, h, add: true, alpha: al, lit: false, tint: [c[0], c[1], c[2], 1] });
      for (const e of M14.minis) {
        if (!e.alive || !e.m14a || e.m14a.ph !== 'wind') continue;
        const A = e.m14a, k = clamp(A.t / A.dur, 0, 1), fz = floorAt(e.x, e.y) - 0.12;
        if (A.k === 'dive') { const lock = A.t >= A.dur - 0.45; gl(A.tx, A.ty, floorAt(A.tx, A.ty) - 0.12, 1.2 + 3.2 * k, 0.45, 0.3 + 0.45 * k, lock ? [255, 70, 50] : [150, 255, 110]); }
        else if (A.k === 'toll' || A.k === 'dirge') gl(e.x, e.y, fz, 1.2 + 2.5 * k, 0.4, 0.3 + 0.4 * k, [255, 210, 90]);
        else if (A.k === 'sweep') gl(e.x, e.y, fz, 1 + (A.r * 2 - 1) * k, 0.4, 0.25 + 0.4 * k, [255, 80, 60]);
        else if (A.k === 'rush') for (let i = 1; i <= 7; i++) gl(e.x + Math.cos(A.a) * i * 0.9, e.y + Math.sin(A.a) * i * 0.9, fz + 0.05, 0.6, 0.25, 0.2 + 0.35 * k, [255, 120, 60]);
        else if (A.k === 'lash') for (let i = 1; i <= 5; i++) gl(e.x + Math.cos(A.a) * i * 1.1, e.y + Math.sin(A.a) * i * 1.1, fz + 0.05, 0.5, 0.22, 0.2 + 0.35 * k, [255, 160, 80]);
        else if (A.k === 'mend' && e.twin) gl(e.twin.x, e.twin.y, e.twin.z + 1.3, 1.4, 2.2, 0.25 + 0.2 * Math.sin(t * 10), [255, 230, 140]);
        else gl(e.x, e.y, e.z + e.h * 0.7, 0.8 + 0.6 * k, 0.8 + 0.6 * k, 0.25 + 0.35 * k, A.k === 'holy' || A.k === 'judge' ? [255, 230, 140] : [255, 140, 90]);
      }
      for (const m of marks) {
        const fz = floorAt(m.x, m.y) - 0.12;
        if (m.k === 'trap') { if (m.t > m.delay) gl(m.x, m.y, fz, 0.9, 0.25, 0.35 + 0.1 * Math.sin(t * 6), m.col); }
        else { const k = clamp(m.t / m.delay, 0, 1); gl(m.x, m.y, fz, m.r * 2 * (0.4 + 0.6 * k), 0.35, 0.25 + 0.5 * k, m.col); if (k > 0.7) gl(m.x, m.y, fz + 1, 0.4, 2.2 * (k - 0.7) / 0.3, 0.3, m.col); }
      }
      for (const w of waves) if (w.r > 0) { const n = Math.max(10, Math.round(w.r * 7)); for (let i = 0; i < n; i++) { const a = i / n * TAU; gl(w.x + Math.cos(a) * w.r, w.y + Math.sin(a) * w.r, floorAt(w.x, w.y) + 0.05, 0.55, 0.32, 0.55, [255, 210, 90]); } }
    } catch (er) { M14.err = String(er && er.stack || er); }
    return S;
  };
  // ---------- death ----------
  const _ke = killEnemy;
  killEnemy = function (e, o) {
    const was = e.alive, r = _ke.apply(this, arguments);
    try {
      if (was && e.m14mini) {
        const d = e.d, s = sv(); s.minis[e.type] = (s.minis[e.type] || 0) + 1;
        const tw = e.twin, both = !tw || !tw.alive;
        G.bigText = { t1: tw ? (both ? 'THE TWIN CONFESSORS' : d.title) : d.title, t2: both ? 'SLAIN' : 'FALLS', t: 0, dur: 2.6 };
        toast(d.title, d.death, d.col, 3); SFX.play('roar', 0.6); G.shake += 6;
        if (both && typeof shardGain === 'function') shardGain(tw ? 45 : 30, e);
        M13.lore(LORE_OF[e.type]);
        const fid = { m14gargoyle: 'm14_gargoyle', m14knell: 'm14_knell', m14houndmaster: 'm14_ghast' }[e.type] || (both ? 'm14_twins' : null); if (fid) M13.feat(fid);
        if (e.type === 'm14houndmaster' || e.type === 'm14vigil' || !tw) for (const h of G.enemies) if (h.alive && (h.m14pack === e)) damageEnemy(h, 9999, { src: 'storm' });
        if (both) { marks.length = 0; waves.length = 0; }
      }
      if (was && e.m13mini) {   // gauntlet: six different mini-bosses felled, ever
        const s = sv(); s.kinds = s.kinds || {}; s.kinds[e.type === 'm14penance' || e.type === 'm14vigil' ? 'twins' : e.type] = 1;
        if (Object.keys(s.kinds).length >= 6) M13.feat('m14_minis'); M9.write && M9.write();
      }
    } catch (er) { M14.err = String(er && er.stack || er); }
    return r;
  };
  // ---------- HUD: bars (twins get two), and the toll warp ----------
  if (window.M8DRAW) M8DRAW.push(function (ctx) {
    if (!RUN.on || G.state !== 'play') return false;
    let drew = false;
    if (M14.warp > 0 && ctx.canvas) {   // each toll ripples the room
      const k = M14.warp, cv = ctx.canvas; ctx.save(); ctx.globalAlpha = 0.5 * k;
      for (let y = 0; y < H; y += 6) { const off = Math.sin(y * 0.09 + G.time * 26) * 5 * k; ctx.drawImage(cv, 0, y, W, 6, off, y, W, 6); }
      ctx.restore(); drew = true;
    }
    if (G.boss && G.boss.awake && G.boss.alive) return drew;
    const e = engaged(); if (!e || !e.m14mini) return drew;
    const list = e.twin ? [e.type === 'm14penance' ? e : e.twin, e.type === 'm14penance' ? e.twin : e] : [e];
    const two = list.length > 1;
    list.forEach((m, i) => {
      const y = 7, bw = two ? 160 : 240, bx = two ? 72 + i * 172 : 120, cx = bx + bw / 2, pw = two ? 120 : 160;
      m.hpLag = m.hpLag === undefined ? m.hp : (m.hpLag > m.hp ? Math.max(m.hp, m.hpLag - 0.016 * m.maxhp * 0.35) : m.hp);
      text(ctx, (two ? m.d.name.toUpperCase() : m.d.title) + (m.alive ? '' : ' - SLAIN'), cx, y, m.alive ? (m.phase2 ? '#ff9a70' : '#ffd060') : '#776', 'center');
      bar(ctx, bx, y + 12, bw, 6, Math.max(0, m.hp) / m.maxhp, m.phase2 ? '#e0402a' : '#d0102a', '#ff8090', '#1a0410', Math.max(0, m.hpLag) / m.maxhp, '#700010');
      const pf = m.m13brk ? 1 : m.post / m.postMax;
      ctx.fillStyle = '#1a1004'; ctx.fillRect(cx - pw / 2, y + 20, pw, 3); ctx.fillStyle = m.m13brk ? (Math.sin(G.time * 20) > 0 ? '#fff0a0' : '#ffb030') : '#e8b030'; ctx.fillRect(cx - pw / 2 * pf, y + 20, pw * pf, 3);
    });
    return true;
  });
})();
