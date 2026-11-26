// m20f FOES3: enemy variety. Variants (no elite rewards, own name plate): BONE ARCHER (ranged skeleton),
// BURROWER (buried zombie-kin that bursts up when you get close), BROOD (bat spawns with 2 extra bats).
// New elite modifiers join the existing pool (same elite chance/rewards): BULWARK (blocks light hits — use heavy /
// charged / hit it mid-swing), SPLITTING (bursts into 3 bats on death), SHADOWSTEP (blinks to your flank).
// Bosses untouched. Kill switch: ?foes3=0 (or ?m20f=0).
(function () {
  const Q = new URLSearchParams(location.search);
  if (Q.get('foes3') === '0' || Q.get('m20f') === '0') { window.M20F_FOES = { off: true }; return; }
  const ST = { archer: 0, burrow: 0, brood: 0, emerge: 0, blink: 0, split: 0, elite: {} };
  const stg = () => (typeof RUN !== 'undefined' && RUN.stage) || 1;
  const lowq = () => typeof GFX !== 'undefined' && GFX.q < 2;
  ELITES.bulwark = { n: 'BULWARK', c: '#d8d0b8', tint: [220, 205, 170], st: 1 };
  ELITES.splitting = { n: 'SPLITTING', c: '#ff9ad8', tint: [255, 120, 210], st: 2 };
  ELITES.shadowstep = { n: 'SHADOWSTEP', c: '#b080ff', tint: [150, 90, 255], st: 4 };
  const NEW = ['bulwark', 'splitting', 'shadowstep'];
  const okMod = m => !NEW.includes(m) || stg() >= ELITES[m].st;
  const mkE0 = makeElite;
  makeElite = function (e, mods) {
    try {
      if (e && e.d && e.d.boss) mods = mods.filter(m => !NEW.includes(m));
      const fb = Object.keys(ELITES).filter(m => !NEW.includes(m) && !mods.includes(m));
      mods = mods.map(m => okMod(m) ? m : (fb.length ? fb.splice((Math.random() * fb.length) | 0, 1)[0] : 'armored'));
      mods = mods.filter((m, i) => mods.indexOf(m) === i); if (!mods.length) mods = ['armored'];
    } catch (_) {}
    const r = mkE0(e, mods);
    for (const m of mods) {
      if (!NEW.includes(m)) continue; ST.elite[m] = (ST.elite[m] || 0) + 1;
      if (m === 'bulwark') e.d.shieldBlock = Math.max(e.d.shieldBlock || 0, 0.8);
      if (m === 'shadowstep') e.m20blinkT = 3 + Math.random() * 2;
    }
    return r;
  };
  const has = (e, m) => e.elite && e.elite.includes(m);
  // ---- variants at stage build ----
  const BUR = ['zombie', 'fzombie', 'm20ghoul', 'm20thrall'];
  const inA = e => { const A = LEVEL.arena; return !!(A && e.x > A.x0 - 1 && e.x < A.x1 + 1 && e.y > A.y0 - 1 && e.y < A.y1 + 1); };
  function conv(e, k) {
    if (k === 'archer') {
      e.m20var = 'archer'; e.plateName = 'BONE ARCHER'; e.plateCol = '#e8e0c8';
      Object.assign(e.d, { ranged: true, keep: 5.2, range: 8.5, windup: 0.75, strike: 0.1, recover: 1.7, dmg: Math.round(e.d.dmg * 0.75), shieldBlock: 0 });
      ST.archer++;
    } else if (k === 'burrow') { e.m20var = 'burrow'; e.m20bur = true; e.hidden = true; e.plateName = 'BURROWER'; e.plateCol = '#c8a070'; ST.burrow++; }
    return e;
  }
  function variants() {
    const s = stg(); const add = [];
    for (const e of G.enemies) {
      if (!e.alive || e.d.boss || inA(e) || e.elite || e.hidden || e.champ || e.saint || e.m11thief || e.summoned || e.m12dummy) continue;
      if (e.type === 'skeleton' && s >= 2 && Math.random() < Math.min(0.3, 0.16 + 0.012 * s)) {
        conv(e, 'archer');
      } else if (BUR.includes(e.type) && s >= 2 && !e.d.fly && Math.random() < 0.16) {
        conv(e, 'burrow');
      } else if (e.type === 'bat' && s >= 3 && Math.random() < 0.3) {
        e.m20var = 'brood'; e.plateName = 'BROOD'; e.plateCol = '#ff8080'; ST.brood++;
        for (let k = 0; k < 2; k++) { const a = Math.random() * 6.28; const x = e.x + Math.cos(a) * 0.6, y = e.y + Math.sin(a) * 0.6; const c = cellAt(x, y); if (c < 0 || SOLID[c]) continue; const b = makeEnemy('bat', x, y); b.hp = b.maxhp = Math.round(e.maxhp * 0.6); b.d.speed = e.d.speed; b.m20brood = true; b.summoned = true; add.push(b); }
      }
    }
    for (const b of add) G.enemies.push(b);
    G.totalEnemies = G.enemies.length;
  }
  const post0 = rogueStagePost;
  rogueStagePost = function () { const r = post0.apply(this, arguments); try { variants(); } catch (err) { console.warn('foes3', err); } return r; };
  // ---- per-frame behaviours ----
  function puff(x, y, z, col, n) { n = lowq() ? n >> 1 : n; for (let i = 0; i < n; i++) addP({ k: 'smoke', x: x + rand(-0.3, 0.3), y: y + rand(-0.3, 0.3), z: z + rand(0, 1.2), vx: rand(-0.6, 0.6), vy: rand(-0.6, 0.6), vz: rand(0.3, 1.2), size: rand(0.08, 0.16), col, life: rand(0.4, 0.8) }); }
  function freeAt(x, y, z) { const c = cellAt(x, y); if (c < 0 || SOLID[c]) return false; for (const [ox, oy] of [[0.35, 0], [-0.35, 0], [0, 0.35], [0, -0.35]]) { const k = cellAt(x + ox, y + oy); if (k < 0 || SOLID[k]) return false; } const g = typeof groundUnder === 'function' ? groundUnder(x, y, 0.2) : z; return Math.abs(g - z) < 0.6; }
  // first meeting with each new foe/modifier: one short how-to toast per save (SAVE.m20f.foeTip, additive)
  const TIP = {
    archer: ['BONE ARCHER', 'Close the gap - or parry the bolt back'], burrow: ['BURROWER', 'The ground moves. Strike as it rises'],
    brood: ['BROOD', 'Bats in a pack - sweep them'], bulwark: ['BULWARK', 'Shield up: heavy or charged hits break through'],
    splitting: ['SPLITTING', 'It bursts into bats when it dies'], shadowstep: ['SHADOWSTEP', 'It blinks to your side - keep turning'],
  };
  let tipT = 0;
  function tips(dt) {
    if ((tipT -= dt) > 0) return; tipT = 0.5;
    if (typeof SAVE === 'undefined' || G.bigText) return;
    const seen = (SAVE.m20f = SAVE.m20f || {}).foeTip = SAVE.m20f.foeTip || {};
    for (const e of G.enemies) {
      if (!e.alive || e.hidden || e.d.boss) continue;
      const ks = [e.m20var].concat(e.elite || []).filter(k => TIP[k] && !seen[k]); if (!ks.length) continue;
      if (Math.hypot(e.x - P.x, e.y - P.y) > 8 || !losTo(P.x, P.y, e.x, e.y)) continue;
      const k = ks[0]; seen[k] = 1; ST.tips = (ST.tips || 0) + 1;
      try { if (typeof writeSave === 'function') writeSave(); } catch (er) { }
      toast(TIP[k][0], TIP[k][1], (ELITES[k] && ELITES[k].c) || e.plateCol || '#ffe9a0', 3.0); return;
    }
  }
  function tick(dt) {
    if (!RUN.on || G.state !== 'play' || G.paused) return;
    try { tips(dt); } catch (er) { }
    for (const e of G.enemies) {
      if (!e.alive) continue;
      if (e.m20bur && e.hidden) {
        const d = Math.hypot(P.x - e.x, P.y - e.y);
        if (d < 3.4 && Math.abs(P.z - e.z) < 1.5 && losTo(e.x, e.y, P.x, P.y)) {
          e.hidden = false; e.m20bur = false; e.awake = true; e.riseT = 0.45; ST.emerge++;
          dust(e.x, e.y, e.z, lowq() ? 6 : 12); SFX.play('groan', 0.9); G.shake = Math.max(G.shake || 0, 2.5);
          dmgNum(e.x, e.y, e.z + 1.6, 'BURROWER!', '#e0b070');
        }
        continue;
      }
      if (has(e, 'shadowstep') && e.awake && !e.hidden && e.state !== 'windup' && e.state !== 'strike' && !(e.stagger > 0) && !e.frozen && !(e.freezeT > 0)) {
        e.m20blinkT = (e.m20blinkT || 4) - dt;
        const d = Math.hypot(P.x - e.x, P.y - e.y);
        if (e.m20blinkT <= 0 && d > 2.6 && d < 10) {
          e.m20blinkT = 5 + Math.random() * 2.5;
          const side = Math.random() < 0.5 ? 1 : -1;
          for (const off of [side * 1.9, -side * 1.9, Math.PI * 0.8]) {
            const a = P.ang + off, x = P.x + Math.cos(a) * 1.9, y = P.y + Math.sin(a) * 1.9;
            if (!freeAt(x, y, e.z)) continue;
            puff(e.x, e.y, e.z, RGB(150, 90, 255), 8); e.x = x; e.y = y; puff(x, y, e.z, RGB(150, 90, 255), 8);
            e.state = 'chase'; e.cd = Math.max(e.cd || 0, 0.55); SFX.play('ghost', 0.5); ST.blink++;
            dmgNum(x, y, e.z + e.h + 0.3, 'BLINK', '#b080ff'); break;
          }
        }
      }
    }
  }
  const up0 = updatePlayer;
  updatePlayer = function (dt) { const r = up0.apply(this, arguments); try { tick(dt); } catch (err) { console.warn('foes3', err); } return r; };
  const ok0 = rogueOnKill;
  rogueOnKill = function (e) {
    const r = ok0.apply(this, arguments);
    try {
      if (has(e, 'splitting') && !e.m20split) {
        e.m20split = true; ST.split++; let n = 0;
        for (let k = 0; k < 3; k++) { const a = k / 3 * 6.28, x = e.x + Math.cos(a) * 0.5, y = e.y + Math.sin(a) * 0.5; const c = cellAt(x, y); if (c < 0 || SOLID[c]) continue; const b = makeEnemy('bat', x, y); b.summoned = true; b.hp = b.maxhp = 10; b.awake = true; b.z = Math.max(b.z, e.z + 0.6); G.enemies.push(b); n++; }
        G.totalEnemies += n; puff(e.x, e.y, e.z, RGB(255, 120, 210), 10); SFX.play('screech', 0.8);
        dmgNum(e.x, e.y, e.z + 1.5, 'IT SPLITS!', '#ff9ad8');
      }
    } catch (err) { console.warn('foes3', err); }
    return r;
  };
  window.M20F_FOES = { st: () => JSON.parse(JSON.stringify(ST)), variants, conv };
})();
