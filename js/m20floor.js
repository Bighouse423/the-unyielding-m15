'use strict';
// ===== m20 FLOORS - Phase 0 framework =====
// Every stage family can own an UPPER and a LOWER floor: a separate small map with its own rooms, a tough spot and a
// reward room. Each run opens 3 of them (one per act, seeded by the run seed or the Daily key; the Wayfinder's Lantern
// adds a 4th). Entrances are a ladder (up) or a broken hole with a rope (down) placed on the main floor by a SEPARATE
// RNG, so the main floor itself is byte-identical with ?floors=0. Enter = stand still on the entrance; the main floor
// is stashed (arrays, LEVEL, enemies, pickups, lightmap, decals, minimap) and restored on the way back. A floor is
// consumed the moment you step in (Save & Quit seals it). Falls off a floor hurt 12% max HP, never kill, and drop you
// back. Kill switch: ?floors=0 (and ?floorfoes=0 for empty floors while testing).
(function () {
  if (!window.M20 || !M20.on || !M20.floors) return;
  const FL = M20.FL = { defs: {}, order: [], tpl: {}, pal: {}, cur: null, st: null, ents: [], hold: 0, near: null, v: 1, builds: [], last: null, boss: null, cleared: false };
  const NB4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  FL.register = function (id, def) { def.id = id; FL.defs[id] = def; if (!FL.order.includes(id)) FL.order.push(id); return def; };
  // ---------- save ----------
  FL.sv = function () {
    if (!window.SAVE) return { seen: {}, cleared: {}, lore: {}, bp: {}, souls: {}, lantern: 0 };
    let s = SAVE.floors; if (!s || typeof s !== 'object') s = SAVE.floors = { v: 1 };
    for (const k of ['seen', 'cleared', 'lore', 'bp', 'souls']) if (!s[k] || typeof s[k] !== 'object') s[k] = {};
    if (typeof s.lantern !== 'number') s.lantern = 0; s.v = 1; return s;
  };
  const save = () => { try { if (typeof writeSave === 'function') writeSave(); } catch (e) { M20.fail('floor save', e); } };
  // ---------- the run's plan: one floor per act (+1 with the Lantern) ----------
  const ACTS = [[1, 2, 3], [4, 5, 6], [7, 8, 9, 10]];
  const runKey = () => (RUN.m12daily ? 'daily:' + RUN.m12daily : 'run:' + (RUN.seed | 0));
  FL.lanternOn = () => !!(M20.lantern && FL.sv().lantern);
  FL.plan = function () {
    const key = runKey();
    const seed = M20.floorseed ? (+M20.floorseed | 0) : M20.fnv('floors:' + key);
    const R = M20.rng(seed), open = [];
    const ok = id => { const d = FL.defs[id]; return d && (!d.avail || d.avail()); };
    for (const act of ACTS) { const c = FL.order.filter(id => ok(id) && act.includes(FL.defs[id].stage)); if (c.length) open.push(c[Math.floor(R() * c.length)]); }
    if (FL.lanternOn()) { const rest = FL.order.filter(id => ok(id) && !open.includes(id)); if (rest.length) open.push(rest[Math.floor(R() * rest.length)]); }
    if (M20.floorall) for (const id of FL.order) if (!open.includes(id)) open.push(id);
    if (M20.floor && FL.defs[M20.floor] && !open.includes(M20.floor)) open.push(M20.floor);
    RUN.floors = { v: 1, key, seed, open, done: [], cur: null };
    return RUN.floors;
  };
  const planned = () => RUN.floors && RUN.floors.key === runKey() && Array.isArray(RUN.floors.open) ? RUN.floors : FL.plan();
  // ---------- small helpers ----------
  const inMain = () => RUN.on && !RUN.hub && !(RUN.cfg && (RUN.cfg.abyss || RUN.cfg.m13sanct)) && LEVEL && LEVEL.kind !== 'hub';
  const cellOK = (x, y, z0) => { const c = cellAt(x, y); return c >= 0 && !SOLID[c] && Math.abs(FH[c] - (z0 || 0)) < 0.05 && FH[c] > -0.5; };
  const clearAround = (x, y, r) => { for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) if (!cellOK(x + dx, y + dy, FH[cellAt(x, y)] || 0)) return false; return true; };
  function freeNear(x, y, R) { // nearest free 3x3 floor spot to (x,y) on the main floor
    for (let r = 0; r <= 8; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue; const cx = (x | 0) + dx, cy = (y | 0) + dy;
      if (cellOK(cx + 0.5, cy + 0.5, 0) && clearAround(cx + 0.5, cy + 0.5, 1)) return [cx + 0.5, cy + 0.5];
    }
    return null;
  }
  const inSecret = (x, y) => (LEVEL.secrets || []).some(s => s.box && x >= s.box[0] - 1 && x < s.box[2] + 1 && y >= s.box[1] - 1 && y < s.box[3] + 1);
  // ---------- entrances on the main floor (separate RNG: the main map is untouched) ----------
  FL.placeFor = function (def, R, taken) {
    if (def.place && def.place[RUN.stage === 1 && LEVEL.kind !== 'crypt' ? 'nave' : 'x']) { const p = def.place.nave; const f = freeNear(p[0], p[1]); if (f) return f; }
    const rooms = (LEVEL.rooms || []).filter(r => r.kind === 'path' && r.style !== 'start');
    const sx = LEVEL.start ? LEVEL.start.x : 0, sy = LEVEL.start ? LEVEL.start.y : 0;
    const er = LEVEL.eliteRoom && LEVEL.eliteRoom.box;
    const cands = [];
    const scan = (x0, y0, x1, y1) => {
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
        const px = x + 0.5, py = y + 0.5; if (!cellOK(px, py, 0) || !clearAround(px, py, 1)) continue;
        if (Math.hypot(px - sx, py - sy) < 6 || inSecret(px, py)) continue;
        if (er && px >= er[0] - 1 && px < er[2] + 1 && py >= er[1] - 1 && py < er[3] + 1) continue;
        if (LEVEL.arena && px > LEVEL.arena.x0 - 2 && px < LEVEL.arena.x1 + 2 && py > LEVEL.arena.y0 - 2 && py < LEVEL.arena.y1 + 3) continue;
        if (taken.some(t => Math.hypot(t[0] - px, t[1] - py) < 7)) continue;
        if ((LEVEL.pickups || []).some(p => Math.hypot(p.x - px, p.y - py) < 1.2)) continue;
        let wall = 0; for (const [dx, dy] of NB4) { const c = cellAt(px + dx * 2, py + dy * 2); if (c < 0 || SOLID[c]) wall++; }
        cands.push([px, py, def.which === 'up' ? wall : -wall]);
      }
    };
    if (rooms.length) for (const r of rooms) scan(r.x0, r.y0, r.x1, r.y1);
    else scan(2, 2, MW - 3, MH - 3);
    if (!cands.length) return null;
    const best = Math.max(...cands.map(c => c[2])); const top = cands.filter(c => c[2] >= best - 1);
    const c = top[Math.floor(R() * top.length)]; return [c[0], c[1]];
  };
  FL.placeEntrances = function () {
    FL.ents = [];
    if (!inMain() || FL.cur) return FL.ents;
    const plan = planned(); const taken = [];
    const ids = FL.order.filter(id => FL.defs[id].stage === RUN.stage);
    for (const id of ids) {
      const def = FL.defs[id];
      const R = M20.rng(M20.fnv((RUN.seed | 0) + ':floors:' + id + ':' + RUN.stage));
      const p = FL.placeFor(def, R, taken); if (!p) continue; taken.push(p);
      const state = plan.done.includes(id) ? 'done' : plan.open.includes(id) ? 'open' : 'sealed';
      FL.ents.push({ id, which: def.which, x: p[0], y: p[1], z: floorAt(p[0], p[1]), state });
    }
    try { FL.sv(); for (const e of FL.ents) if (e.state === 'open') FL.sv().seen[e.id] = FL.sv().seen[e.id] || 1; } catch (e) { }
    return FL.ents;
  };
  // ---------- stash / restore the main floor ----------
  function stash() {
    const lv = {}; for (const k of Object.keys(LEVEL)) lv[k] = LEVEL[k];
    const fdec = new Map(FDEC), wdec = new Map(WDEC);
    return {
      MW, MH, FH, CH, SOLID, WT, FT, CT, SKY, WALLDEFS, FLOORTEX, CEILTEX, LMr, LMg, LMb, LTr, LTg, LTb, FLK, FLKP, OPENW,
      lv, fdec, wdec, arena: Object.assign({}, ARENA), haze: HAZE.slice(),
      enemies: G.enemies, pickups: G.pickups, boss: G.boss, lich: G.lich, kills: G.kills, total: G.totalEnemies, checkpoint: G.checkpoint,
      P: { x: P.x, y: P.y, z: P.z, ang: P.ang, lastSafe: Object.assign({}, P.lastSafe) },
      exp: (window.M9E && M9E.expSwap) ? M9E.expSwap(null) : null,
    };
  }
  function restore(s) {
    MW = s.MW; MH = s.MH; FH = s.FH; CH = s.CH; SOLID = s.SOLID; WT = s.WT; FT = s.FT; CT = s.CT; SKY = s.SKY;
    WALLDEFS = s.WALLDEFS; FLOORTEX = s.FLOORTEX; CEILTEX = s.CEILTEX;
    LMr = s.LMr; LMg = s.LMg; LMb = s.LMb; LTr = s.LTr; LTg = s.LTg; LTb = s.LTb; FLK = s.FLK; FLKP = s.FLKP; OPENW = s.OPENW;
    for (const k of Object.keys(LEVEL)) delete LEVEL[k]; Object.assign(LEVEL, s.lv);
    FDEC.clear(); for (const [k, v] of s.fdec) FDEC.set(k, v); WDEC.clear(); for (const [k, v] of s.wdec) WDEC.set(k, v);
    Object.assign(ARENA, s.arena); for (let i = 0; i < 3; i++) HAZE[i] = s.haze[i];
    G.enemies = s.enemies; G.pickups = s.pickups; G.boss = s.boss; G.lich = s.lich; G.checkpoint = s.checkpoint;
    if (window.M9E && M9E.expSwap) M9E.expSwap(s.exp);
  }
  // ---------- palettes (texture sets) ----------
  // walls: 0 main 1 alt 2 deco 3 pillar 4 tall-deco 5 low/rail 6 crack 7 gate 8 sarc 9 alt2 10 statue 11 stone 12 false
  // floors: 0 main 1 alt 2 deco 3 liquid 4 landing 5 secret 6 bridge 7 void
  FL.pal.crypt = { w: ['t_crypt', 't_crypt2', 't_skulls', 't_cpillar', ['t_crypt', 't_tomb', 0.05, 2.3], 't_stone2', 't_cryptcrack', 't_gate', 't_sarc', 't_skullcol', ['t_crypt', 't_skullcol', 0, 2.6], 't_stone2', 't_cryptfalse'], f: ['f_crypt', 'f_crypt2', 'f_lid', 'f_blood', 't_stone2', 'f_marble', 'f_plank', 'f_void'], c: ['c_crypt', 'c_vault'] };
  FL.pal.roof = { w: ['k_wall', 'k_wall2', 'k_ivy', 'k_pillar', ['k_wall2', 't_window', 0.5, 2.7], 't_stone', 'k_crack', 't_gate', 't_sarc', 't_stone2', ['k_wall', 't_statue', 0, 2.9], 't_stone2', 'k_false'], f: ['f_flag', 'f_cobble', 'f_tile', 'f_blood', 'f_rubble', 'f_marble', 'f_plank', 'f_void'], c: ['c_arcade', 'c_wood'] };
  const tex = n => Engine.tex[n] || Engine.tex.t_stone2 || Engine.tex.t_crypt;
  FL.usePal = function (name) {
    const p = FL.pal[name] || FL.pal.crypt;
    const def = d => Array.isArray(d) ? { base: tex(d[0]), tall: { t: tex(d[1]), z0: d[2], z1: d[3], span: 0, x0: 0 } } : { base: tex(d), tall: null };
    WALLDEFS = p.w.map(def); FLOORTEX = p.f.map(tex); CEILTEX = p.c.map(tex);
  };
  // ---------- map toolkit for templates ----------
  const K = FL.kit = {
    alloc(w, h, sky) {
      MW = w; MH = h; const N = w * h;
      FH = new Float32Array(N); CH = new Float32Array(N); SOLID = new Uint8Array(N); WT = new Uint8Array(N); FT = new Uint8Array(N); CT = new Uint8Array(N); SKY = new Uint8Array(N);
      for (let i = 0; i < N; i++) { SOLID[i] = 1; FH[i] = 99; CH[i] = sky ? 99 : 3.2; SKY[i] = sky ? 1 : 0; }
    },
    idx: (x, y) => y * MW + x,
    inb: (x, y) => x >= 1 && y >= 1 && x < MW - 1 && y < MH - 1,
    open(x, y, fh, ch, ft, sky) { if (!K.inb(x, y)) return; const i = y * MW + x; SOLID[i] = 0; FH[i] = fh; CH[i] = sky ? 99 : ch; FT[i] = ft || 0; SKY[i] = sky ? 1 : 0; WT[i] = 0; },
    wall(x, y, fh, wt) { if (x < 0 || y < 0 || x >= MW || y >= MH) return; const i = y * MW + x; SOLID[i] = 1; FH[i] = fh; WT[i] = wt || 0; },
    isOpen: (x, y) => x >= 0 && y >= 0 && x < MW && y < MH && !SOLID[y * MW + x],
    rect(r, fh, ch, ft, sky) { for (let y = r.y0; y <= r.y1; y++) for (let x = r.x0; x <= r.x1; x++) K.open(x, y, fh, ch, ft, sky); },
    center: r => [Math.floor((r.x0 + r.x1) / 2), Math.floor((r.y0 + r.y1) / 2)],
    // free cells of a room (level floor, no props), shuffled by R
    cells(r, R, pad) { const out = []; pad = pad || 0; for (let y = r.y0 + pad; y <= r.y1 - pad; y++) for (let x = r.x0 + pad; x <= r.x1 - pad; x++) { const i = y * MW + x; if (!SOLID[i] && FH[i] > -0.5) out.push([x + 0.5, y + 0.5]); } for (let i = out.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [out[i], out[j]] = [out[j], out[i]]; } return out; },
  };
  // reachability (walk + small jumps; voids and deep water are not floor)
  FL.reach = function (sx, sy, bars) {
    const N = MW * MH, D = new Int32Array(N).fill(-1), q = new Int32Array(N); let h = 0, t = 0;
    const s0 = (sy | 0) * MW + (sx | 0); if (s0 < 0 || s0 >= N) return D; D[s0] = 0; q[t++] = s0;
    const barSet = new Set((bars || []).map(b => b[1] * MW + b[0]));
    while (h < t) {
      const i = q[h++], x = i % MW, y = (i / MW) | 0;
      for (const [dx, dy] of NB4) {
        const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= MW || ny >= MH) continue; const j = ny * MW + nx; if (D[j] >= 0) continue;
        if (SOLID[j] && !barSet.has(j)) continue; const fj = barSet.has(j) ? FH[i] : FH[j];
        if (fj < -0.9 || fj - FH[i] > 0.55) continue; if (!SKY[j] && CH[j] - fj < 1.9) continue;
        D[j] = D[i] + 1; q[t++] = j;
      }
    }
    return D;
  };
  // ---------- building a floor ----------
  FL.build = function (def, seed) {
    const tpl = FL.tpl[def.tpl]; if (!tpl) throw new Error('no template ' + def.tpl);
    const t0 = performance.now();
    let L = null, tries = 0, sd = seed >>> 0;
    const _mr = Math.random;
    try {
      for (; tries < 12; tries++, sd = (sd + 0x9E3779B9) >>> 0) {
        const R = M20.rng(sd); Math.random = R;
        FL.usePal(def.pal || 'crypt');
        L = tpl(R, def, K);
        if (L.rewRect) { // cut the reward room off completely: every open cell touching it becomes a gate until the tough spot falls
          const r = L.rewRect;
          for (let y = r.y0 - 1; y <= r.y1 + 1; y++) for (let x = r.x0 - 1; x <= r.x1 + 1; x++) {
            if (x >= r.x0 && x <= r.x1 && y >= r.y0 && y <= r.y1) continue; if (!K.inb(x, y)) continue; const i = y * MW + x;
            if (SOLID[i] || FH[i] < -1) continue; L.bars.push([x, y, FH[i]]); K.wall(x, y, L.sky ? FH[i] + 2.4 : 99, 7);
          }
        }
        if (!L.shafts || !L.shafts.length) L.shafts = [{ x: L.tough.cx, y: L.tough.cy, w: 2.2, z0: 0, z1: 5, c: [150, 110, 255], i: 0.22, slant: 0, ph: 1 }];
        const D = FL.reach(L.start.x, L.start.y, L.bars);
        const need = [L.tough && [L.tough.cx, L.tough.cy], L.reward, L.fwd, L.back].filter(Boolean);
        if (need.every(p => D[((p[1] | 0) * MW + (p[0] | 0))] >= 0)) { L.R = R; break; }
        L = null;
      }
      if (!L) throw new Error('floor ' + def.id + ' unreachable after 12 tries');
      const R = L.R;
      // spawns
      const spawns = [];
      if (M20.floorfoes) {
        const pool = def.pool || [['skeleton', 3], ['zombie', 2]], tot = pool.reduce((a, p) => a + p[1], 0);
        const wpick = () => { let r = R() * tot; for (const p of pool) { r -= p[1]; if (r <= 0) return p[0]; } return pool[0][0]; };
        const want = Math.min(26, def.n || 16), rooms = L.rooms.filter(r => r.kind === 'path');
        let k = 0;
        for (let guard = 0; guard < 200 && spawns.length < want && rooms.length; guard++) {
          const r = rooms[k++ % rooms.length]; if (!r.free) r.free = K.cells(r, R, 0);
          const c = r.free.pop(); if (!c) continue;
          if (Math.hypot(c[0] - L.start.x, c[1] - L.start.y) < 6) continue;
          spawns.push([wpick(), c[0], c[1], r.ambush && R() < 0.4 ? 'ambush' : undefined]);
        }
        for (const s of (L.spawns || [])) if (spawns.length < 27) spawns.push(s);
      }
      const lights = (L.lights || []).slice(0, 60);
      buildLightmap(lights, def.amb || L.amb || [0.32, 0.34, 0.4]);
      for (const k of Object.keys(LEVEL)) delete LEVEL[k];
      const fwd = L.fwd, st = L.start;
      Object.assign(LEVEL, {
        kind: 'crypt', m20floor: def.id, m20: L, lights, props: L.props || [], secrets: L.secrets || [], cracks: L.cracks || [],
        doors: { gate: { x: fwd[0] | 0, y: fwd[1] | 0, state: 'gone' } }, hooks: [], shafts: L.shafts || [], pickups: L.pickups || [], spawns, signs: L.signs || [],
        start: { x: st.x, y: st.y, ang: st.ang || 0 }, checkpoints: [{ x: st.x, y: st.y, ang: st.ang || 0 }, { x: st.x, y: st.y, ang: st.ang || 0 }],
        boss: { x: -50, y: -50 }, arena: { x0: -60, x1: -59, y0: -60, y1: -59 }, eliteRoom: null, rooms: L.rooms, path: L.rooms.map(r => K.center(r).map(v => v + 0.5)),
        grid: null, gatePath: [fwd[0], fwd[1]], wallH: L.sky ? 3.2 : 99, bossType: 'vknight',
      });
      OPENW = L.sky ? 3.2 : 0;
    } finally { Math.random = _mr; }
    const ms = performance.now() - t0; FL.builds.push({ id: def.id, ms: +ms.toFixed(1), tries, seed: sd }); if (FL.builds.length > 40) FL.builds.shift();
    return LEVEL;
  };
  // ---------- entering / leaving ----------
  let musF = null;
  function music(which) {
    try {
      if (!window.SFX || !SFX.ctx || !SFX.musBus || !SFX.musVol) return;
      if (!musF) { musF = SFX.ctx.createBiquadFilter(); musF.type = 'lowpass'; musF.frequency.value = 22000; musF.Q.value = 0.5; SFX.musBus.disconnect(); SFX.musBus.connect(musF); musF.connect(SFX.musVol); }
      const t = SFX.ctx.currentTime; musF.frequency.cancelScheduledValues(t);
      musF.frequency.setTargetAtTime(which === 'down' ? 900 : which === 'up' ? 5200 : 22000, t, 0.4);
    } catch (e) { M20.fail('floor music', e); }
  }
  FL.enter = function (id, opt) {
    const def = FL.defs[id]; if (!def || FL.cur) return false;
    const plan = planned();
    try {
      const ent = FL.ents.find(e => e.id === id) || { x: P.x, y: P.y };
      const s = stash(); s.ent = ent; FL.st = s;
      const seed = M20.fnv(plan.key + ':floor:' + id);
      FL.build(def, seed);
      Object.assign(ARENA, LEVEL.arena); DRIPS.length = 0; DOORANIM.length = 0;
      G.enemies = []; G.particles = []; G.projectiles = []; G.hazards = []; G.dmgNums = []; G.screenBlood = []; G.finisher = null; G.lich = null;
      const ph = G.boss; G.boss = makeEnemy('vknight', -50, -50); G.boss.alive = false; G.boss.hidden = true; G.boss.awake = false; G.boss.dead = false;
      const _mr = Math.random; Math.random = M20.rng(seed ^ 0x55aa);
      try {
        for (const sp of LEVEL.spawns) { if (!EDEF[sp[0]]) continue; const e = makeEnemy(sp[0], sp[1], sp[2], { ambush: sp[3] === 'ambush' }); e.d.speed *= (RUN.cfg && RUN.cfg.spd) || 1; e.m20f = id; G.enemies.push(e); }
        const c = RUN.cfg || {};
        for (const e of G.enemies) if (!e.d.boss && Math.random() < (c.elite || 0) * 0.8 && typeof makeElite === 'function') { const pool = Object.keys(ELITES).sort(() => Math.random() - 0.5); makeElite(e, pool.slice(0, Math.max(1, Math.min(c.eliteMods || 1, 2)))); }
      } finally { Math.random = _mr; }
      FL.cleared = false; FL.boss = null;
      if (def.onBuild) def.onBuild(LEVEL.m20, FL);
      G.totalEnemies = G.enemies.length; G.kills = 0; G.checkpoint = 0;
      G.pickups = LEVEL.pickups.map(p => ({ ...mkPickup(p.type, p.x, p.y), drop: false, amt: p.amt }));
      Object.assign(P, { x: LEVEL.start.x, y: LEVEL.start.y, z: floorAt(LEVEL.start.x, LEVEL.start.y), vz: 0, vx: 0, vy: 0, ang: LEVEL.start.ang, pitch: 0, latch: null, iframes: Math.max(P.iframes || 0, 1.2) });
      P.lastSafe = { x: P.x, y: P.y, z: P.z };
      FL.cur = id; plan.cur = id; if (!plan.done.includes(id)) plan.done.push(id); ent.state = 'done';
      const sv = FL.sv(); sv.seen[id] = 2;
      G.fade = 1; G.bigText = { t1: def.name, t2: def.sub || (def.which === 'up' ? 'Upper floor' : 'Lower floor'), t: 0, dur: 3.2 };
      SFX.play(def.which === 'up' ? 'jump' : 'land', 0.7); music(def.which);
      if (window.M9 && M9.emit) try { M9.emit('floor', { id, enter: true }); } catch (e) { }
      FL.last = { id, t: performance.now(), ms: FL.builds.length ? FL.builds[FL.builds.length - 1].ms : 0 };
      save();
      return true;
    } catch (e) {
      M20.fail('floor enter ' + id, e);
      if (FL.st) { restore(FL.st); G.boss = FL.st.boss; FL.st = null; } FL.cur = null; return false;
    }
  };
  FL.leave = function (how) {
    if (!FL.cur || !FL.st) return false;
    const id = FL.cur, def = FL.defs[id], s = FL.st;
    try {
      const fk = G.kills | 0, ft = G.totalEnemies | 0;
      restore(s); FL.st = null; FL.cur = null; if (RUN.floors) RUN.floors.cur = null;
      G.kills = s.kills + fk; G.totalEnemies = s.total + ft; G.projectiles = []; G.hazards = []; G.particles = []; G.finisher = null;
      let px = s.ent.x, py = s.ent.y, pa = s.P.ang;
      if (how === 'fwd' && FL.cleared) {
        const cps = LEVEL.checkpoints || []; const c = cps.length > 1 ? cps[cps.length - 1] : null;
        if (c && LEVEL.kind === 'crypt') { px = c.x; py = c.y; pa = c.ang; }
        else if (def.land && RUN.stage === 1) { const f = freeNear(def.land[0], def.land[1]); if (f) { px = f[0]; py = f[1]; } }
      } else { const a = s.P.ang + Math.PI; const f = [[1.3, 0], [1.3, 0.8], [1.3, -0.8], [1.6, 1.6], [1.6, -1.6]]; for (const [r, da] of f) { const x = px + Math.cos(a + da) * r, y = py + Math.sin(a + da) * r; if (cellOK(x, y, floorAt(px, py))) { px = x; py = y; break; } } }
      Object.assign(P, { x: px, y: py, z: floorAt(px, py), vz: 0, vx: 0, vy: 0, ang: pa, latch: null, iframes: Math.max(P.iframes || 0, 1.2) });
      P.lastSafe = { x: P.x, y: P.y, z: P.z };
      for (const e of G.enemies) if (e.alive && !e.d.boss && Math.hypot(e.x - P.x, e.y - P.y) < 4) { e.awake = false; }
      G.fade = 1; G.bigText = { t1: FL.cleared ? 'FLOOR CLEARED' : 'BACK TO THE STAGE', t2: def.name, t: 0, dur: 2.4 };
      music('main');
      if (window.M9 && M9.emit) try { M9.emit('floor', { id, enter: false, how, cleared: FL.cleared }); } catch (e) { }
      FL.boss = null; FL.hold = 0; FL.exitHold = 0;
      save();
      return true;
    } catch (e) { M20.fail('floor leave', e); return false; }
  };
  // the floor's tough spot is done: the barred way opens, the coffer appears
  FL.clear = function () {
    if (!FL.cur || FL.cleared) return; FL.cleared = true;
    const def = FL.defs[FL.cur], L = LEVEL.m20, sv = FL.sv();
    sv.cleared[FL.cur] = (sv.cleared[FL.cur] | 0) + 1;
    for (const b of (L.bars || [])) { const i = b[1] * MW + b[0]; SOLID[i] = 0; FH[i] = b[2] || 0; animCellSafe(b[0], b[1]); }
    const [rx, ry] = L.reward; const drop = (type, dx, dy, amt) => { const p = mkPickup(type, rx + dx, ry + dy); p.z = floorAt(rx + dx, ry + dy) + 1; p.amt = amt; G.pickups.push(p); return p; };
    drop('spoils', 0, 0);
    const amt = def.shards || (70 + Math.floor(Math.random() * 21)); drop('shards', 0.8, 0.6, amt);
    if (def.onClear) try { def.onClear(L, FL, drop); } catch (e) { M20.fail('floor onClear', e); }
    SFX.play('secret', 0.9); toast('THE WAY ON OPENS', def.clearText || 'A coffer waits beyond. Take the way forward, or go back.', '#ffd060', 3.6);
    if (window.M9 && M9.emit) try { M9.emit('floorclear', { id: FL.cur }); } catch (e) { }
    save();
  };
  function animCellSafe(x, y) { try { dust(x + 0.5, y + 0.5, floorAt(x + 0.5, y + 0.5), 12); SFX.play('stone', 0.8); } catch (e) { } }
  // ---------- per-frame: entrances, exits, falls, rot ----------
  FL.tick = function (dt) {
    if (G.state !== 'play' || G.paused) return;
    if (!FL.cur) {
      FL.near = null; if (!FL.ents.length || !inMain()) return;
      const mv = Math.hypot(P.vx || 0, P.vy || 0);
      for (const e of FL.ents) { const d = Math.hypot(P.x - e.x, P.y - e.y); if (d < 2.6 && (!FL.near || d < FL.near.d)) FL.near = { e, d }; }
      const n = FL.near;
      if (n && n.d < 0.95 && n.e.state === 'open' && Math.abs(P.z - n.e.z) < 0.4 && !(G.boss && G.boss.alive && G.boss.awake) && P.onGround !== false) {
        FL.hold = mv < 1.2 ? FL.hold + dt : Math.max(0, FL.hold - dt * 2);
        if (FL.hold >= 0.8) { FL.hold = 0; FL.enter(n.e.id); }
      } else FL.hold = Math.max(0, FL.hold - dt * 3);
      return;
    }
    const L = LEVEL.m20; if (!L) return;
    // exits: back (always) / forward (after the tough spot)
    FL.near = null;
    const exits = [{ k: 'back', x: L.back[0], y: L.back[1] }, { k: 'fwd', x: L.fwd[0], y: L.fwd[1] }];
    for (const x of exits) { const d = Math.hypot(P.x - x.x, P.y - x.y); if (d < 2.6 && (!FL.near || d < FL.near.d)) FL.near = { x, d }; }
    const n = FL.near, mv = Math.hypot(P.vx || 0, P.vy || 0);
    if (n && n.d < 0.95 && (n.x.k === 'back' || FL.cleared) && P.onGround !== false) { FL.hold = mv < 1.2 ? FL.hold + dt : Math.max(0, FL.hold - dt * 2); if (FL.hold >= 0.8) { FL.hold = 0; FL.leave(n.x.k); return; } }
    else FL.hold = Math.max(0, FL.hold - dt * 3);
    // falling off an upper floor: hurts, never kills, and drops you back where you came in
    if (P.z < -0.45 && P.vz < 0) {
      const dmg = Math.round(P.maxhp * 0.12); P.hp = Math.max(1, P.hp - dmg); P.hurtT = 0.4; G.flashR = 0.35; G.shake += 6;
      const def = FL.defs[FL.cur];
      if (def.which === 'up' && def.fallOut !== false) { FL.leave('fall'); toast('YOU FALL', 'Back down to the stage below. (-' + dmg + ' HP)', '#ff9080', 2.6); }
      else { P.x = P.lastSafe.x; P.y = P.lastSafe.y; P.z = P.lastSafe.z; P.vz = 0; P.vx = P.vy = 0; toast('YOU FALL', '-' + dmg + ' HP', '#ff9080', 2); }
      return;
    }
    // rotten planks give way under you
    if (L.rot) for (const r of L.rot) {
      if (r.gone) continue; const on = (P.x | 0) === r.x && (P.y | 0) === r.y && P.z - FH[r.y * MW + r.x] < 0.1;
      if (on) { r.t = (r.t || 0) + dt; if (r.t > 0.12 && !r.cr) { r.cr = 1; SFX.play('stone', 0.4); dust(r.x + 0.5, r.y + 0.5, FH[r.y * MW + r.x], 6); } }
      if (r.t > 0.55) { r.gone = true; const i = r.y * MW + r.x; FH[i] = -6; FT[i] = 7; dust(r.x + 0.5, r.y + 0.5, 0, 14); SFX.play('stone', 0.8); }
    }
    // the tough spot: boss down -> clear
    if (!FL.cleared && L.toughDone && L.toughDone()) FL.clear();
    // deep water drags (flooded floors)
    if (L.water && P.onGround !== false) { const c = cellAt(P.x, P.y); if (c >= 0 && FT[c] === 3 && FH[c] < -0.05) { if (FL.px !== undefined) { P.x = FL.px + (P.x - FL.px) * 0.72; P.y = FL.py + (P.y - FL.py) * 0.72; if (blocked(P.x, P.y, P.z, PR, 0.33)) { P.x = FL.px; P.y = FL.py; } } } }
    FL.px = P.x; FL.py = P.y;
  };
  // ---------- art: ladder, hole, chains (pixel-drawn canvases) ----------
  function mkTex(n, w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); x.imageSmoothingEnabled = false; draw(x, w, h); Engine.imgs[n] = c; const dd = x.getImageData(0, 0, w, h); Engine.tex[n] = { w, h, d: new Uint32Array(dd.data.buffer) }; }
  FL.mkTex = mkTex;
  function art() {
    mkTex('m20_ladder', 24, 64, (x, w, h) => {
      for (const sx of [3, 18]) { x.fillStyle = '#3a2412'; x.fillRect(sx, 0, 3, h); x.fillStyle = '#6a4424'; x.fillRect(sx, 0, 1, h); }
      for (let y = 4; y < h; y += 7) { x.fillStyle = '#2a180a'; x.fillRect(4, y + 1, 16, 2); x.fillStyle = '#7a5430'; x.fillRect(4, y, 16, 1); }
      const g = x.createLinearGradient(0, 0, 0, 22); g.addColorStop(0, 'rgba(255,230,150,0.55)'); g.addColorStop(1, 'rgba(255,230,150,0)'); x.fillStyle = g; x.fillRect(0, 0, w, 22);
    });
    mkTex('m20_hole', 48, 22, (x, w, h) => {
      x.fillStyle = '#1a1018'; x.beginPath(); x.ellipse(24, 13, 22, 8, 0, 0, 6.29); x.fill();
      x.fillStyle = '#05020a'; x.beginPath(); x.ellipse(24, 13, 17, 5.5, 0, 0, 6.29); x.fill();
      for (let i = 0; i < 14; i++) { const a = i / 14 * 6.28; x.fillStyle = i % 2 ? '#5a5060' : '#3a3240'; x.fillRect(24 + Math.cos(a) * 19 - 2, 13 + Math.sin(a) * 6.5 - 1.5, 5, 3); }
      x.fillStyle = '#8a6a3a'; x.fillRect(23, 0, 2, 13); x.fillStyle = '#c09858'; x.fillRect(23, 0, 1, 13);
      x.fillStyle = 'rgba(120,255,170,0.35)'; x.fillRect(20, 12, 8, 2);
    });
    mkTex('m20_chains', 32, 32, (x, w, h) => {
      x.strokeStyle = '#9a9aa8'; x.lineWidth = 2; for (const [a, b, c, d] of [[2, 2, 30, 30], [30, 2, 2, 30]]) { for (let i = 0; i <= 8; i++) { const t = i / 8, px = a + (c - a) * t, py = b + (d - b) * t; x.strokeRect(px - 2, py - 1.5, 4, 3); } }
      x.fillStyle = '#c8a040'; x.fillRect(12, 12, 8, 9); x.fillStyle = '#2a1a08'; x.fillRect(15, 15, 2, 3);
    });
  }
  FL.art = art;
  // ---------- sprites: entrances / exits ----------
  function entSprites(S, x, y, z, kind, state, t) {
    const dim = state === 'done' ? 0.45 : 1;
    if (kind === 'up') {
      S.push({ tex: 'm20_ladder', x, y, z, w: 0.75, h: 2.4, alpha: dim, lit: true });
      if (state === 'open') S.push({ tex: 'glow_w', x, y, z: z + 2.2, w: 1.4, h: 0.9, add: true, alpha: 0.28 + 0.1 * Math.sin(t * 3), lit: false, tint: [255, 225, 150, 1] });
    } else {
      S.push({ tex: 'm20_hole', x, y, z: z - 0.02, w: 1.5, h: 0.55, alpha: dim, lit: true });
      if (state === 'open') S.push({ tex: 'glow_w', x, y, z: z + 0.1, w: 1.3, h: 0.5, add: true, alpha: 0.22 + 0.1 * Math.sin(t * 3), lit: false, tint: [110, 255, 170, 1] });
    }
    if (state === 'sealed' || state === 'locked') S.push({ tex: 'm20_chains', x, y, z: z + (kind === 'up' ? 0.7 : 0.05), w: 0.9, h: 0.9, lit: true, tint: [255, 80, 60, 0.25] });
  }
  const _cs = collectSprites;
  collectSprites = function (cam) {
    const S = _cs(cam);
    try {
      if (!Engine.tex.m20_ladder) art();
      const t = G.time || 0;
      if (!FL.cur) { if (inMain()) for (const e of FL.ents) entSprites(S, e.x, e.y, e.z, e.which, e.state, t); }
      else if (LEVEL.m20) {
        const L = LEVEL.m20, def = FL.defs[FL.cur];
        entSprites(S, L.back[0], L.back[1], floorAt(L.back[0], L.back[1]), def.which === 'up' ? 'down' : 'up', 'open', t);
        entSprites(S, L.fwd[0], L.fwd[1], floorAt(L.fwd[0], L.fwd[1]), def.which === 'up' ? 'down' : 'up', FL.cleared ? 'open' : 'locked', t);
      }
    } catch (e) { M20.fail('floor sprites', e); }
    return S;
  };
  // ---------- HUD: prompts, floor tag, hold ring ----------
  const ROMAN = ['I', 'II', 'III', 'IV'];
  if (window.M8DRAW) M8DRAW.push(function (ctx) {
    try {
      if (!RUN.on || G.state !== 'play' || G.paused) return false;
      let drew = false;
      if (FL.cur && LEVEL.m20) { // floor tag under the minimap
        const def = FL.defs[FL.cur]; text(ctx, (def.which === 'up' ? '\u25B2 ' : '\u25BC ') + def.name, W - 6, 70, def.which === 'up' ? '#ffe0a0' : '#a0ffc8', 'right', 0.8); drew = true;
      }
      const n = FL.near; if (!n) return drew;
      let t1 = '', t2 = '', col = '#ffe0a0';
      if (!FL.cur) {
        const e = n.e, def = FL.defs[e.id]; const up = e.which === 'up';
        t1 = (up ? '\u25B2 UPPER FLOOR: ' : '\u25BC LOWER FLOOR: ') + def.name; col = up ? '#ffe0a0' : '#a0ffc8';
        t2 = e.state === 'open' ? (up ? 'Stand on the ladder to climb' : 'Stand at the edge to drop down') : e.state === 'done' ? 'Already explored this run' : 'Sealed this run. Another descent may open it.';
        if (e.state === 'sealed') col = '#c08070';
      } else {
        const def = FL.defs[FL.cur]; const back = n.x.k === 'back';
        t1 = back ? 'BACK TO THE STAGE' : 'THE WAY FORWARD'; t2 = back ? 'Stand here to return where you came in' : FL.cleared ? 'Stand here: it lets out further along the stage' : 'Locked until the ' + (def.toughName || 'guardian') + ' falls';
        col = back ? '#d0c8ff' : FL.cleared ? '#ffd060' : '#c08070';
      }
      const y = H - 74; ctx.save(); ctx.fillStyle = 'rgba(8,2,14,0.72)'; ctx.fillRect(W / 2 - 150, y - 4, 300, 26); ctx.restore();
      text(ctx, t1, W / 2, y, col, 'center', 0.9); text(ctx, t2, W / 2, y + 11, '#bdb4c8', 'center', 0.75);
      if (FL.hold > 0.02) { const k = Math.min(1, FL.hold / 0.8); ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(W / 2, H / 2, 9, -Math.PI / 2, -Math.PI / 2 + k * Math.PI * 2); ctx.stroke(); ctx.restore(); }
      return true;
    } catch (e) { M20.fail('floor hud', e); return false; }
  });
  // ---------- wiring ----------
  const _ng = newGame;
  newGame = function () {
    if (FL.cur) { FL.cur = null; FL.st = null; music('main'); }
    const r = _ng.apply(this, arguments);
    try { if (RUN.on && !RUN.hub) { planned(); FL.placeEntrances(); } else FL.ents = []; } catch (e) { M20.fail('floor entrances', e); }
    return r;
  };
  if (typeof nextStage === 'function') { const _ns = nextStage; nextStage = function () { if (FL.cur) { try { FL.leave('stage'); } catch (e) { } } return _ns.apply(this, arguments); }; }
  if (typeof newRun === 'function') { const _nr = newRun; newRun = function () { RUN.floors = null; FL.cur = null; FL.st = null; return _nr.apply(this, arguments); }; }
  if (typeof enterHub === 'function') { const _eh = enterHub; enterHub = function () { FL.cur = null; FL.st = null; FL.ents = []; music('main'); return _eh.apply(this, arguments); }; }
  // floors ride along in every run snapshot (so Save & Quit seals a floor you stepped into)
  if (typeof writeSave === 'function') {
    const _ws = writeSave;
    writeSave = function () {
      try { if (SAVE.run && RUN.on && RUN.floors && SAVE.run.run) { SAVE.run.run.floors = JSON.parse(JSON.stringify(RUN.floors)); SAVE.run.run.floors.cur = null; } FL.sv(); } catch (e) { M20.fail('floor writeSave', e); }
      return _ws.apply(this, arguments);
    };
  }
  if (window.M9 && M9.on) M9.on('tick', (dt) => { try { FL.tick(dt); } catch (e) { M20.fail('floor tick', e); } });
  else { const _fi = window.frameInner; }
  FL.dbg = () => ({ cur: FL.cur, plan: RUN.floors, ents: FL.ents.map(e => ({ id: e.id, x: +e.x.toFixed(1), y: +e.y.toFixed(1), state: e.state })), builds: FL.builds.slice(-6), cleared: FL.cleared, defs: FL.order.slice() });
})();
