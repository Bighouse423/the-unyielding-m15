'use strict';
// ===== m20 FLOORS - Phase 1 slice: stages 1, 4, 9 (upper + lower each) =====
(function () {
  if (!window.M20 || !M20.FL) return;
  const FL = M20.FL;
  const pools = {
    s1u: [['skeleton', 3], ['bat', 2.2], ['ghost', 1], ['m20arbalest', 1.6], ['m20murder', 1.2]],
    s1d: [['zombie', 3], ['skeleton', 2], ['fzombie', 1.2], ['spiderling', 2], ['m20wight', 1.1]],
    s4u: [['werewolf', 1.2], ['fzombie', 2], ['skeleton', 2], ['m20arbalest', 1.6], ['m20murder', 1.4]],
    s4d: [['zombie', 2], ['azombie', 1.6], ['m20drowned', 3], ['spiderling', 1.2]],
    s9u: [['skeleton', 2], ['azombie', 1.4], ['m13bastion', 1], ['m20arbalest', 1.8], ['m20murder', 1.5], ['imp', 1]],
    s9d: [['azombie', 2], ['ghost', 1.6], ['m13cantor', 0.9], ['m20drowned', 2.4], ['m20wight', 1.4]],
  };
  const pool = id => pools[id].filter(p => typeof EDEF !== 'undefined' && EDEF[p[0]]);
  FL.register('s1u', { stage: 1, which: 'up', name: 'THE BROKEN ROOF', sub: 'Above the Ruined Nave', tpl: 'rooftop', pal: 'roof', n: 15, opts: { rot: true, amb: [0.42, 0.36, 0.56] },
    boss: 'm20roofer', toughName: 'Slate King', lore: 'roofer', soul: 's1u', snames: ['The Roofer\'s Loft', 'The Bellrope Nook', 'The Pigeon Chapel'], place: { nave: [23, 36] }, land: [17.5, 10.4], get pool() { return pool('s1u'); } });
  FL.register('s1d', { stage: 1, which: 'down', name: 'THE UNDERCROFT', sub: 'Beneath the Ruined Nave', tpl: 'warren', pal: 'crypt', n: 17, opts: { green: true, amb: [0.34, 0.36, 0.32] },
    boss: 'm20abbot', toughName: 'First Abbot', lore: 'abbot', bp: 'censer', snames: ['The Abbot\'s Larder', 'The Bone Well', 'The Sealed Cell'], place: { nave: [30, 26] }, land: [17.5, 10.4], get pool() { return pool('s1d'); } });
  FL.register('s4u', { stage: 4, which: 'up', name: 'THE RAMPART WALK', sub: 'Above the Moonlit Courtyard', tpl: 'rampart', pal: 'roof', n: 18, opts: { amb: [0.46, 0.3, 0.34], lc: [1.0, 0.25, 0.2] },
    boss: 'm20huntmaster', toughName: 'Huntmaster', lore: 'bloodmoon', soul: 's4u', snames: ['The Watch Post', 'The Kennel Loft'], get pool() { return pool('s4u'); } });
  FL.register('s4d', { stage: 4, which: 'down', name: 'THE DROWNED CISTERN', sub: 'Beneath the Moonlit Courtyard', tpl: 'flooded', pal: 'crypt', n: 16, opts: { amb: [0.32, 0.38, 0.46], lc: [0.35, 0.65, 1.0] },
    boss: 'm20cistern', toughName: 'Cistern Mother', lore: 'cistern', bp: 'trident', snames: ['The Sluice Room'], get pool() { return pool('s4d'); } });
  FL.register('s9u', { stage: 9, which: 'up', name: 'THE STORM SPIRES', sub: 'Above the Cathedral', tpl: 'rooftop', pal: 'roof', n: 19, opts: { catwalk: true, amb: [0.36, 0.4, 0.6], green: false },
    boss: 'm20spire', toughName: 'Spire Warden', lore: 'oath2', bp: 'halberd', snames: ['The Lightning Loft', 'The Gargoyle Perch'], get pool() { return pool('s9u'); } });
  FL.register('s9d', { stage: 9, which: 'down', name: 'THE CRYPT OF OATHS', sub: 'Beneath the Cathedral', tpl: 'flooded', pal: 'crypt', n: 18, opts: { amb: [0.36, 0.32, 0.44], lc: [0.75, 0.5, 1.0], secrets: 2 },
    boss: 'm20oathbound', toughName: 'Oathbound Knight', lore: 'oaths', soul: 's9d', bp: 'seal', snames: ['The Oath Vault', 'The Penitent\'s Cell'], get pool() { return pool('s9d'); } });
  // generic tough spot: the floor boss (m20fboss.js) or, if bosses are switched off, an elite guard
  const _build = FL.build;
  FL.build = function (def, seed) {
    const r = _build.apply(this, arguments);
    const L = LEVEL.m20; if (!L) return r;
    L.toughDone = () => { if (FL.boss) return !FL.boss.alive; const g = G.enemies.filter(e => e.m20tough); return g.length > 0 && g.every(e => !e.alive); };
    return r;
  };
  const _en = FL.enter;
  FL.enter = function (id) {
    const ok = _en.apply(this, arguments); if (!ok) return ok;
    try {
      const def = FL.defs[id], L = LEVEL.m20, t = L.tough;
      if (M20.floorboss && FL.spawnBoss && def.boss && FL.spawnBoss(def.boss, t.cx, t.cy, def)) { /* boss up */ }
      else {
        const types = (def.pool || []).map(p => p[0]).filter(k => EDEF[k] && !EDEF[k].boss) ; const n = 4;
        for (let k = 0; k < n; k++) { const a = k / n * 6.28, x = t.cx + Math.cos(a) * 2, y = t.cy + Math.sin(a) * 2; const e = makeEnemy(types[k % types.length] || 'skeleton', x, y); e.m20tough = true; e.forceElite = true; if (typeof makeElite === 'function') makeElite(e, [Object.keys(ELITES)[k % Object.keys(ELITES).length]]); G.enemies.push(e); }
        G.totalEnemies = G.enemies.length;
      }
    } catch (e) { M20.fail('floor tough', e); }
    return ok;
  };
})();
