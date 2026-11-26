// ===== m20fix: the m18 playtest report fixes (t197u: "do all the recommendations").
// grace until first input (S1 idle no longer bleeds out; tips wait for calm) · S3-S6 spike smoothing · Save & Quit re-farm closed ·
// toasts clear the boss bar · title glitches · altar power line + fresh descriptions · Skull / Axe / Frost identity.
// Each piece: ?grace20=0 ?s5fix=0 ?refarm=0 ?toast20=0 ?title20=0 ?altarinfo=0 ?wpn20=0 (all: ?fix20=0, everything m20: ?m20=0)
(function () {
  if (!window.M20 || !M20.on || !M20.fix) return;
  const F = M20.fixState = { grace: null, hurtT: -99, thinned: 0 };
  const stageN = () => (typeof RUN !== 'undefined' && RUN.on && !RUN.hub) ? (RUN.stage | 0) : 0;
  const abyss = () => !!(RUN && RUN.cfg && RUN.cfg.abyss);
  const isBossSrc = s => !!(s && (s.d && (s.d.boss || s.d.mini) || s.mini || s.m13mini || s.m14mini));

  // ---------------- 1. grace until first input ----------------
  if (M20.grace) {
    const GS = F.grace = { wait: false, release: 0, sx: 0, sy: 0, t0: 0, st: 0 };
    const arm = () => {
      if (!RUN || !RUN.on || RUN.hub || typeof P === 'undefined') return;
      GS.wait = true; GS.release = 0; GS.sx = P.x; GS.sy = P.y; GS.t0 = G.t || 0; GS.st = RUN.stage | 0; GS.ang = P.ang;
    };
    GS.arm = arm;
    const _ng = newGame;
    newGame = function () { const r = _ng.apply(this, arguments); try { arm(); } catch (e) { M20.fail('graceArm', e); } return r; };
    const inputSeen = () => {
      if (Math.hypot(P.x - GS.sx, P.y - GS.sy) > 0.45) return true;
      if (P.sw || P.whip || P.pistol || P.bash || P.shieldUp || P.dodgeT > 0) return true;
      return false;
    };
    const R = () => GS.st === 1 ? 15 : 10;
    const hold = () => GS.wait || (G.t || 0) < GS.release;
    const _ue = updateEnemy;
    updateEnemy = function (e, dt) {
      const r = _ue.apply(this, arguments);
      try {
        if ((GS.wait || GS.release) && e && e.alive && !(e.d && e.d.boss) && !e.summoned && !isBossSrc(e) && hold()) {
          if (Math.hypot(e.x - P.x, e.y - P.y) < R()) { e.awake = false; e.state = 'idle'; e.cd = Math.max(e.cd || 0, 0.5); }
        }
      } catch (err) { M20.fail('graceUE', err); }
      return r;
    };
    const _fi = typeof frameInner === 'function' ? frameInner : null;
    if (_fi) frameInner = function () {
      try {
        // opening the pause menu means someone is at the controls: end the idle grace (pad players who pause before moving)
        if (GS.wait && typeof G !== 'undefined' && G.paused) { GS.wait = false; GS.release = (G.t || 0) + 1.6; }
        if (GS.wait && typeof G !== 'undefined' && G.state === 'play' && !G.paused && RUN && RUN.on && !RUN.hub) {
          if (inputSeen() || (G.t || 0) - GS.t0 > 90) { GS.wait = false; GS.release = (G.t || 0) + (GS.st === 1 ? 3.0 : 1.6); }
          else P.iframes = Math.max(P.iframes || 0, 0.25);
        }
      } catch (e) { M20.fail('graceFI', e); }
      return _fi.apply(this, arguments);
    };
    // the first fight of S1 is gentler for 20 s after you start moving
    if (typeof rogueEnemyDmg === 'function') {
      const _red = rogueEnemyDmg;
      rogueEnemyDmg = function (dmg, opt) {
        let d = _red.apply(this, arguments);
        try { if (GS.st === 1 && stageN() === 1 && GS.release && (G.t || 0) < GS.release + 20 && !isBossSrc(opt && opt.src)) d = Math.max(1, Math.round(d * 0.65)); } catch (e) { }
        return d;
      };
    }
  }
  // tips wait for calm: no tip while hurt in the last 5 s, while an aware foe is within 16, or before the first input
  if (typeof hurtPlayer === 'function') {
    const _hp = hurtPlayer;
    hurtPlayer = function (dmg) { const r = _hp.apply(this, arguments); try { if (r === 'hit') F.hurtT = G.t || 0; } catch (e) { } return r; };
  }
  function busy() {
    if (typeof G === 'undefined' || G.state !== 'play' || !RUN || RUN.hub || !G.enemies) return false;
    if (F.grace && F.grace.wait) return true;
    if ((G.t || 0) - F.hurtT < 5) return true;
    for (const e of G.enemies) if (e.alive && e.awake && !e.hidden && !(e.d && e.d.boss) && Math.hypot(e.x - P.x, e.y - P.y) < 16) return true;
    return false;
  }
  F.busy = busy;
  if (M20.grace && window.M8DRAW && window.TIPS) {
    M8DRAW.unshift(function () {
      try {
        const T = TIPS; if (!busy()) return false;
        if (T.q.length) { T._held = (T._held || []).concat(T.q.filter(id => id !== 'altar')); T.q = T.q.filter(id => id === 'altar'); }
        if (T.cur && !T.cur.out && T.t < 2.5 && T.cur.id !== 'altar' && (G.t || 0) - F.hurtT < 1.5) { (T._held = T._held || []).unshift(T.cur.id); if (T.seen) T.seen[T.cur.id] = 0; T.cur = null; }
      } catch (e) { M20.fail('tips', e); }
      return false;
    });
  }

  // ---------------- 2. S3-S6 spike smoothing (S5 was the 10-death wall) ----------------
  if (M20.s5 && typeof rogueEnemyDmg === 'function') {
    const K = { 3: 0.95, 4: 0.92, 5: 0.82, 6: 0.93 };
    const _red = rogueEnemyDmg;
    rogueEnemyDmg = function (dmg, opt) {
      let d = _red.apply(this, arguments);
      try { const n = stageN(); if (K[n] && !abyss() && !(opt && opt.env) && !isBossSrc(opt && opt.src)) d = Math.max(1, Math.round(d * K[n])); } catch (e) { }
      return d;
    };
    const thin = () => {
      try {
        if (stageN() !== 5 || abyss() || !G.enemies) return;
        const foes = G.enemies.filter(e => e.alive && !e.summoned && !(e.d && e.d.boss) && !isBossSrc(e) && !e.eliteRoom && !e.forceElite);
        const cap = 36; if (foes.length <= cap) return;
        foes.sort((a, b) => Math.hypot(b.x - P.x, b.y - P.y) - Math.hypot(a.x - P.x, a.y - P.y));
        let drop = foes.length - cap;
        for (const e of foes) { if (drop <= 0) break; if (e.awake || Math.hypot(e.x - P.x, e.y - P.y) < 14) continue; e.alive = false; e.hidden = true; e.dead = true; e.deathType = 'gone'; e.m20thinned = 1; drop--; }
        G.totalEnemies = G.enemies.filter(e => !e.m20thinned && !e.m18thinned).length; F.thinned++;
      } catch (e) { M20.fail('thin5', e); }
    };
    const _ng = newGame;
    newGame = function () { const r = _ng.apply(this, arguments); setTimeout(thin, 120); return r; };
  }

  // ---------------- 3. Save & Quit re-farm: a quit mid-stage resumes from the stage-START snapshot ----------------
  if (M20.refarm && typeof writeSave === 'function') {
    const _ws = writeSave;
    writeSave = function () {
      try {
        const s = SAVE.run;
        if (s && s.v === 1 && !s.hub && (s.why === 'stage' || s.why === 'descend' || s.why === 'resume')) F.stageStart = JSON.parse(JSON.stringify(s));
        if (s && s.v === 1 && s.why === 'chapel') F.stageStart = null;
        if (s && s.v === 1 && s.why === 'quit' && !s.hub && !s.m20) {
          const st = F.stageStart;
          if (st && st.stage === s.stage && st.run && s.run && st.run.seed === s.run.seed) {
            const keepFloors = s.run.floors || (RUN && RUN.floors ? JSON.parse(JSON.stringify(RUN.floors)) : null);
            s.run = JSON.parse(JSON.stringify(st.run)); s.p = JSON.parse(JSON.stringify(st.p));
            if (keepFloors) s.run.floors = keepFloors;   // floors you entered stay sealed (no re-farm there either)
            s.m20 = 'stagestart';
          } else s.m20 = 'nosnap';
        }
      } catch (e) { M20.fail('refarm', e); }
      return _ws.apply(this, arguments);
    };
  }

  // ---------------- 4. toasts clear the boss bar ----------------
  if (M20.toast) {
    M20.toastY = function () {
      try {
        const b = G.boss; if (b && b.awake && b.alive && RUN && !RUN.hub) return 46;
        if (G.enemies && G.enemies.some(e => e.alive && e.awake && (e.m20boss || e.mini || e.m13mini) && e.barOn)) return 46;
      } catch (e) { }
      return 36;
    };
  }

  // ---------------- 5. title glitches ----------------
  if (M20.title && typeof drawTitle === 'function') {
    const _dt = drawTitle;
    drawTitle = function (ctx) {
      const r = _dt.apply(this, arguments);
      try {
        if (window.OPT && OPT.open) return r;
        const su = Engine.imgs && Engine.imgs.txt_sub, ti = Engine.imgs && Engine.imgs.txt_title;
        if (su && ti && G.state === 'title') {
          const x = Math.round(W / 2 - su.width / 2 + 50), y = 14 + ti.height - 4;
          // a solid plate (the old blackletter bled through the 0.96 box) with a gold hairline
          ctx.fillStyle = '#08000e'; ctx.fillRect(x - 10, y - 5, su.width + 20, su.height + 12);
          ctx.fillStyle = 'rgba(240,192,64,0.75)'; ctx.fillRect(x - 10, y - 5, su.width + 20, 1); ctx.fillRect(x - 10, y + su.height + 6, su.width + 20, 1);
          text(ctx, 'THE RUINED NAVE', Math.round(W / 2 + 50), y + Math.max(8, (su.height / 2) | 0), '#f0d0e8', 'center');
        }
        // readable "press a button" hint: dark plate + gold
        if (typeof PAD !== 'undefined' && !PAD.connected && navigator.getGamepads && G.state === 'title') {
          const s = 'CONTROLLER? PRESS ANY BUTTON', w = s.length * 8 + 10;
          ctx.fillStyle = 'rgba(8,0,14,0.92)'; ctx.fillRect(W - w - 2, 1, w, 12);
          ctx.fillStyle = 'rgba(240,192,64,0.8)'; ctx.fillRect(W - w - 2, 12, w, 1);
          const a = 0.75 + 0.25 * Math.sin((G.t || 0) * 2.4);
          ctx.save(); ctx.globalAlpha = a; text(ctx, s, W - 6, 3, '#ffe080', 'right'); ctx.restore();
        }
      } catch (e) { M20.fail('title', e); }
      return r;
    };
  }

  // ---------------- 6. altar: power line + fresh descriptions ----------------
  // ST / PACK = the dummy DPS from reports/m18/playtest (m20 values for the reworked Skull / Axe / Frost)
  const POWER = {
    base: ['STARTER', 'I', 45, 153], frostsword: ['CONTROL - FREEZE & SHATTER', 'I', 78, 226], stormsword: ['CROWD - CHAIN LIGHTNING', 'II', 88, 417],
    rapier: ['DUELIST - LIFESTEAL', 'II', 67, 198], crimsonsword: ['BLEED - BLOOD NOVA', 'I', 69, 245], skullblade: ['EXECUTIONER', 'II', 76, 254],
    battleaxe: ['CLEAVER - SUNDER', 'II', 74, 276], greatsword: ['VANGUARD - REFLECT', 'III', 81, 197], rubysword: ['RUPTURE', 'III', 102, 321],
    firesword: ['BURN ZONES', 'III', 94, 322], voidreaver: ['LEGENDARY - RIFTS', 'III', 96, 298],
    chainwhip: ['WHIP - REACH & BLEED', 'I'], bloodwhip: ['WHIP - LIFESTEAL', 'I'], firewhip: ['WHIP - BURN', 'I'],
    crossbow: ['RANGED - PIERCE 3', 'I'], xbow2: ['RANGED - HEAVY BOLTS', 'II'], xbow3: ['RANGED - LEGENDARY', 'III'], sidearm: ['RANGED - HOLY SIDEARM', 'I'],
  };
  M20.POWER = POWER;
  const DESC = {
    stormsword: 'Every hit SHOCKS the target and arcs lightning to 2 nearby foes. Heavy strikes arc to 4 and stun. The best sword in a crowd.',
    skullblade: 'Heavy, 15% slower. Heavy strikes EXECUTE foes under 30% HP (they drop shards). Bosses take extra posture damage.',
    battleaxe: 'Heavy, 25% slower. SUNDERS armor. Wide cleave: every swing hits everything in front of you. Heavy strikes CLEAVE harder.',
    frostsword: 'Hits CHILL (slow 40%). 3 chills FREEZE a foe solid. FROSTBITE: hits on chilled or frozen foes deal +22% cold damage. Heavy strike on a frozen foe SHATTERS it.',
  };
  if (M20.wpn || M20.altarinfo) {
    try { for (const id in DESC) { const u = UPG.find(q => q.id === id); if (u) { u.m19desc = u.desc; u.desc = DESC[id]; } } } catch (e) { M20.fail('desc', e); }
  }
  M20.powerLine = function (it) {
    if (!it) return '';
    const id = it.tab === 2 ? it.need : it.id, p = POWER[id]; if (!p) return '';
    let s = p[0] + '   TIER ' + p[1];
    if (p[2]) s += '   DPS ' + p[2] + '   PACK ' + p[3];
    return s;
  };
  if (M20.altarinfo && typeof drawAltar === 'function') {
    const _da = drawAltar;
    drawAltar = function (ctx) {
      const r = _da.apply(this, arguments);
      try {
        if (window.M20 && M20.altarLineOff) return r;
        const L = altarList(), it = L[ALTARUI.sel]; const s = M20.powerLine(it);
        if (s) { const fx = 22, fy = 6; ctx.fillStyle = 'rgba(20,4,30,0.85)'; ctx.fillRect(fx + 10, fy + 175, Math.min(372, s.length * 8 + 8), 11); text(ctx, s, fx + 14, fy + 177, '#ffd860', 'left'); }
      } catch (e) { M20.fail('altarline', e); }
      return r;
    };
  }

  // ---------------- 7. Skull / Axe / Frost identity ----------------
  if (M20.wpn) {
    try {
      if (typeof SWDMG !== 'undefined') { F.prevDmg = { skull: SWDMG.skull, axe: SWDMG.axe }; SWDMG.skull = Math.round((SWDMG.skull || 1) * 1.35 * 100) / 100; SWDMG.axe = Math.round((SWDMG.axe || 1) * 1.28 * 100) / 100; }
    } catch (e) { M20.fail('swdmg', e); }
    const _de = damageEnemy;
    damageEnemy = function (e, dmg, o) {
      const r = _de.apply(this, arguments);
      try {
        if (o && o.src === 'sword' && P.wpn && P.wpn.sword === 'frost' && e && e.alive && (e.chillT > 0 || e.iceT > 0) && dmg > 0) {
          const extra = Math.max(2, dmg * 0.22);
          _de.call(this, e, extra, { src: 'frost', dot: true, col: '#a0e8ff', kb: 0 });
          F.frostbite = (F.frostbite || 0) + extra;
          if (typeof addP === 'function' && typeof RGB === 'function') for (let i = 0; i < 6; i++) addP({ k: 'spark', x: e.x + rand(-0.3, 0.3), y: e.y + rand(-0.3, 0.3), z: (e.z || 0) + (e.h || 1) * rand(0.3, 1), vx: rand(-0.6, 0.6), vy: rand(-0.6, 0.6), vz: rand(0.4, 1.2), size: 0.04, col: RGB(190, 240, 255), life: 0.45 });
        }
      } catch (err) { M20.fail('frostbite', err); }
      return r;
    };
  }
})();
