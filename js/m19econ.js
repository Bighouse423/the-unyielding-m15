// ===== m19econ: 20-clear shop curve + shop-owned perks + a modest death-depth tithe.
// Existing unlocks and shard balances are untouched (prices and perks only). ?econ=0 restores m18 prices.
// Crossbow I stays 280, pistol 154, vials and bosses unchanged. Run-found pickup tables stay as they are.
(function () {
  if (!window.M19 || (!M19.econ && !M19.tithe)) return;
  const r5 = v => Math.max(5, Math.round(v / 5) * 5);
  const E = M19.econState = { on: !!M19.econ, tithe: !!M19.tithe, old: {}, neu: {}, perks: {}, total: 0 };

  const ARMORY = {
    chainwhip: 200, crossbow: 620, crimsonsword: 550, bloodwhip: 550, rapier: 800,
    stormsword: 1400, battleaxe: 1500, skullblade: 1700, rubysword: 2800, greatsword: 3200, firesword: 4200
  };
  const RELIC = {
    gravecoin: 25, gravedirt: 45, emberheart: 90, rimesigil: 100, stormbell: 110, fang: 120,
    repeater: 140, laurel: 180, dreadhorn: 200, headsman: 250, hood: 250, hellfang: 280,
    ironoath: 500, wraithcloak: 550, phylactery: 700, lichring: 2400, halo: 3500, lastrites: 5200
  };
  const LOAD = {
    ld_pistol: 80, ld_xbow: 380, ld_frost: 450, ld_fire: 450, ld_chain: 400,
    ld_rapier: 700, ld_crimson: 650, ld_blood: 650, ld_storm: 1100, ld_axe: 1200,
    ld_skull: 1400, ld_ruby: 2200, ld_great: 2500, ld_ember: 3800
  };
  const BLESS = { vit: [50, 280, 1100], soul: [45, 240, 900], might: [70, 350, 1400], fortune: [50, 280, 1100] };

  function idMatch(map, id) {
    if (map[id] != null) return map[id];
    for (const k of Object.keys(map)) if (id === k || id.endsWith(k) || k.endsWith(id)) return map[k];
    return null;
  }

  if (M19.econ && typeof ALTAR !== 'undefined' && ALTAR.items) {
    for (const it of ALTAR.items) {
      if (it.cost != null) E.old[it.id] = it.cost;
      if (it.costs) E.old[it.id] = it.costs.slice();
    }
    for (const it of ALTAR.items) {
      if (it.up && it.costs) {
        const b = BLESS[it.id];
        if (b) it.costs = b.slice();
        E.neu[it.id] = it.costs.slice();
        continue;
      }
      const map = it.tab === 2 ? LOAD : it.tab === 0 ? ARMORY : it.tab === 1 ? RELIC : null;
      if (!map) continue;
      const v = idMatch(map, it.id);
      if (v != null) it.cost = r5(v);
      E.neu[it.id] = it.cost;
    }
    let tot = 0;
    for (const it of ALTAR.items) {
      if (it.costs) tot += it.costs.reduce((a, b) => a + b, 0);
      else if (it.cost) tot += it.cost;
    }
    E.total = tot;
  }

  function owned(id) {
    const u = window.SAVE && SAVE.unl;
    if (!u) return false;
    if (u[id]) return true;
    const aliases = { ruby: ['rubysword', 'ld_ruby'], great: ['greatsword', 'ld_great'], fire: ['firesword', 'ld_ember'],
      storm: ['stormsword', 'ld_storm'], skull: ['skullblade', 'ld_skull'], rapier: ['rapier', 'ld_rapier'],
      axe: ['battleaxe', 'ld_axe'], lastrites: ['lastrites'], halo: ['halo'], lichring: ['lichring'] };
    const list = aliases[id] || [id];
    return list.some(k => !!u[k]);
  }
  E.owned = owned;

  // modest failed-run credit by depth (not applied on a victory / win payout)
  if (M19.tithe && typeof bankRun === 'function') {
    const _br = bankRun;
    bankRun = function () {
      try {
        const won = !!(RUN && (RUN.won || RUN.winPay || (typeof G !== 'undefined' && G.state === 'victory')));
        if (!won && RUN && RUN.on) {
          const d = Math.max(1, RUN.stage | 0);
          const bonus = 15 * d;
          RUN.shardsRun = (RUN.shardsRun || 0) + bonus;
          RUN.depthTithe = bonus;
        }
      } catch (e) { M19.err = M19.err || ('tithe ' + e); }
      return _br.apply(this, arguments);
    };
  }

  if (!M19.econ) return;

  // shop-owned perks (do not change run-found base tables, xbow 280, pistol 154, vials, or bosses)
  if (typeof playerDie === 'function') {
    const _pd = playerDie;
    playerDie = function () {
      try {
        if (RUN && RUN.on && owned('halo') && P.mods && P.mods.halo && !(G && G.haloUsed) && G.state === 'play') {
          G.haloUsed = true; P.hp = 15; P.iframes = 2.8; P.dodgeAge = 9; G.flashG = 0.9; G.slow = 0.8; G.shake += 8;
          try { SFX.play('toll'); SFX.play('parry'); } catch (e) { }
          try { toast('THE HALO SHATTERS', 'Sanctified. Not yet.', '#fff2a0', 2.2); } catch (e) { }
          if (typeof damageEnemy === 'function') for (const q of G.enemies) if (q.alive && !q.hidden && Math.hypot(q.x - P.x, q.y - P.y) < 3.6)
            damageEnemy(q, 64, { dx: q.x - P.x, dy: q.y - P.y, kb: 4.5, heavy: true, src: 'bash', col: '#fff2a0' });
          return;
        }
        if (RUN && RUN.on && owned('lastrites') && P.mods && P.mods.rites && !P.ritesUsed) {
          P.ritesUsed = true; P.hp = 45; P.iframes = 3; G.flashG = 0.8; G.slow = 0.8; G.zoom = 0.12;
          try { SFX.play('secret', 0.6); SFX.play('glint'); } catch (e) { }
          G.bigText = { img: null, t1: 'LAST RITES', t2: 'The altar remembers.', t: 0, dur: 2.2 };
          return;
        }
      } catch (e) { M19.err = M19.err || ('rites ' + e); }
      return _pd.apply(this, arguments);
    };
  }

  if (typeof damageEnemy === 'function') {
    const _de = damageEnemy;
    damageEnemy = function (e, dmg, o) {
      try {
        if (owned('lichring') && P.mods && P.mods.lichring && o && o.src === 'sword' && P.mana >= P.maxmana - 0.5)
          dmg *= 1.08; // on top of the base +20%
        if (owned('skull') && P.wpn && P.wpn.sword === 'skull' && o && o.src === 'sword')
          dmg *= 1.12;
        if (owned('ruby') && P.wpn && P.wpn.sword === 'ruby' && o && o.src === 'sword' && (o.heavy || (P.sw && P.sw.step === 2)))
          dmg *= 1.10;
      } catch (e2) { }
      const r = _de.call(this, e, dmg, o);
      try {
        if (owned('lichring') && P.mods && P.mods.lichring && e && !e.alive)
          P.mana = Math.min(P.maxmana, P.mana + 2); // +2 on top of the usual 4
      } catch (e3) { }
      return r;
    };
  }

  // fire: longer, wider burn zones when Emberbrand was bought (sprites/look untouched)
  if (typeof G !== 'undefined' || true) {
    const tick = () => {
      if (typeof updateHazards !== 'function') return;
    };
    // hook hazard spawn by wrapping a late rogueAfterHit if present
    const bumpFire = () => {
      if (!(owned('fire') && P && P.wpn && P.wpn.sword === 'fire' && G && G.hazards)) return;
      for (const hz of G.hazards) {
        if (hz && hz.kind === 'ember' && hz.srcWpn === 'fire' && !hz.m19shop) {
          hz.m19shop = 1; hz.life = (hz.life || 2.8) + 1.2; hz.r = (hz.r || 1.15) * 1.2;
        }
      }
    };
    if (typeof rogueAfterHit === 'function') {
      const _rah = rogueAfterHit;
      rogueAfterHit = function () {
        const r = _rah.apply(this, arguments);
        try { bumpFire(); } catch (e) { }
        return r;
      };
    }
  }

  // storm: a second shock hop when the sword was bought
  if (typeof rogueAfterHit === 'function') {
    const _rah2 = rogueAfterHit;
    rogueAfterHit = function (e, dmg, o) {
      const r = _rah2.apply(this, arguments);
      try {
        if (owned('storm') && o && o.src === 'sword' && P.wpn && P.wpn.sword === 'storm' && e && typeof damageEnemy === 'function') {
          let best = null, bd = 4.2;
          for (const q of G.enemies) {
            if (!q.alive || q === e || q.hidden) continue;
            const d = Math.hypot(q.x - e.x, q.y - e.y);
            if (d < bd) { bd = d; best = q; }
          }
          if (best) damageEnemy(best, Math.max(6, dmg * 0.22), { src: 'shock', dot: true, col: '#c080ff', kb: 0.2 });
        }
      } catch (err) { }
      return r;
    };
  }
  E.perks = {
    ruby: 'shop-owned Ruby: heavy rupture hits deal +10%',
    great: 'shop-owned Greatsword uses the existing parry/riposte; damage path unchanged besides ownership',
    fire: 'shop-owned Emberbrand: burn zones last +1.2s and are 20% wider (look/sprites untouched)',
    storm: 'shop-owned Storm: a second shock hop to a nearby foe',
    skull: 'shop-owned Skull Blade: +12% sword damage (run-found without the unlock is unchanged)',
    lastrites: 'shop-owned Last Rites: revive at 45 HP with 3s of invulnerability (base is 30 HP / 2s)',
    halo: 'shop-owned Halo: shatter leaves you at 15 HP, 2.8s i-frames, 64-damage burst (base 1 HP / 2s / 40)',
    lichring: 'shop-owned Ring: +2 extra mana on kill and +8% sword damage while mana is full (on top of the base perk)'
  };
})();
