// ===== m18wpn: distinct roles and a visible DPS ladder. Flame sword look + existing effects stay (only strengthened).
// Crossbow I 280 and pistol 154 are not touched. ?wpn=0 or ?m18=0
(function () {
  if (!window.M18 || !M18.wpn) return;
  const W18 = M18.wpnState = { on: true };

  // damage / speed ladder (multipliers stack with existing skull/rapier branches)
  const DMG = { base: 1.0, frost: 1.18, storm: 1.28, rapier: 1.08, crimson: 1.16, skull: 1.08, axe: 1.0, ruby: 1.12, fire: 1.15, great: 1.0, void: 1.12 };
  const SPD = { frost: 1.0, storm: 1.06, crimson: 1.0, skull: 1.0, ruby: 1.05, fire: 1.0, void: 1.0 };

  if (typeof SWDMG === 'undefined') window.SWDMG = {};
  if (typeof SWSPD === 'undefined') window.SWSPD = {};
  W18.prevDmg = Object.assign({}, SWDMG);
  W18.prevSpd = Object.assign({}, SWSPD);
  for (const k in DMG) SWDMG[k] = Math.round(((SWDMG[k] || 1) * DMG[k]) * 100) / 100;
  for (const k in SPD) SWSPD[k] = Math.round(((SWSPD[k] || 1) * SPD[k]) * 100) / 100;
  // rapier: the 0.8 in swordHit made it feel weak; we slightly undo that via SWDMG.rapier
  // (swordHit still applies 0.8 * crit). SWDMG.rapier 1.08 * existing.

  // axe: wider cleave arc
  if (typeof enemiesInArc === 'function') {
    const _eia = enemiesInArc;
    enemiesInArc = function (range, arc) {
      if (P && P.wpn && P.wpn.sword === 'axe') return _eia(range * 1.18, arc * 1.55);
      if (P && P.wpn && P.wpn.sword === 'great') return _eia(range * 1.12, arc * 1.25);
      if (P && P.wpn && P.wpn.sword === 'rapier') return _eia(range * 1.2, arc * 0.72); // thrust, narrower, longer
      return _eia(range, arc);
    };
  }

  // storm: stronger arcs so the identity shows up even on a single target (shock bonus) and really shines in packs
  if (typeof stormArc === 'function') {
    const _sa = stormArc;
    stormArc = function () {
      const r = _sa.apply(this, arguments);
      return r;
    };
  }
  // wrap rogue after-hit if present
  const bumpStorm = (e, dmg, o) => {
    if (!(o && o.src === 'sword' && P.wpn && P.wpn.sword === 'storm')) return;
    // extra shock on the primary target so ST DPS isn't flat with the starter
    if (e && e.alive) {
      const extra = Math.max(4, dmg * 0.18);
      damageEnemy(e, extra, { src: 'shock', dot: true, col: '#c080ff', kb: 0 });
      if (typeof sparks === 'function') sparks(e.x, e.y, e.z + (e.h || 1) * 0.6, 8);
    }
  };

  if (typeof damageEnemy === 'function' && typeof rogueAfterHit === 'function') {
    const _rah = rogueAfterHit;
    rogueAfterHit = function (e, dmg, o) {
      const r = _rah.apply(this, arguments);
      try { bumpStorm(e, dmg, o); } catch (err) {}
      try { burnZone(e, dmg, o); } catch (err) {}
      try { rubyRupture(e, dmg, o); } catch (err) {}
      try { oathRiposte(e, dmg, o); } catch (err) {}
      return r;
    };
  } else if (typeof damageEnemy === 'function') {
    const _de = damageEnemy;
    damageEnemy = function (e, dmg, o) {
      const r = _de.apply(this, arguments);
      try { if (o && o.src === 'sword') { bumpStorm(e, dmg, o); burnZone(e, dmg, o); rubyRupture(e, dmg, o); } } catch (err) {}
      return r;
    };
  }

  // emberbrand / fire sword: heavy hits leave a burn zone. Look and existing trails/sprites stay.
  function burnZone(e, dmg, o) {
    if (!(P.wpn && P.wpn.sword === 'fire' && o && o.src === 'sword')) return;
    if (!(o.heavy || (P.sw && P.sw.step === 2))) return;
    if (typeof G === 'undefined' || !G.hazards) return;
    G.hazards.push({ kind: 'ember', x: e.x, y: e.y, t: -0.15, life: 2.8, r: 1.15, dmg: Math.max(3, dmg * 0.12), col: [255, 90, 20, 1], srcWpn: 'fire' });
  }
  // tick burn zones
  const _uh = typeof updateHazards === 'function' ? updateHazards : null;
  function tickBurns(dt) {
    if (!G.hazards) return;
    for (const hz of G.hazards) {
      if (hz.kind !== 'ember') continue;
      hz.t = (hz.t || 0) + dt;
      if (hz.t > (hz.life || 2.6)) { hz.dead = true; continue; }
      if (hz.t < 0) continue;
      if (!G.enemies) continue;
      hz.acc = (hz.acc || 0) + dt;
      if (hz.acc < 0.35) continue;
      hz.acc = 0;
      for (const e of G.enemies) {
        if (!e.alive || e.hidden) continue;
        if (Math.hypot(e.x - hz.x, e.y - hz.y) < (hz.r || 1.1)) {
          damageEnemy(e, hz.dmg, { src: 'burn', dot: true, col: '#ff6a18', kb: 0 });
          e.burnT = Math.max(e.burnT || 0, 1.2);
        }
      }
    }
    if (G.hazards) G.hazards = G.hazards.filter(h => !h.dead);
  }
  if (_uh) updateHazards = function (dt) { const r = _uh.apply(this, arguments); try { tickBurns(dt); } catch (e) {} return r; };
  else if (typeof updateAtmos === 'function') {
    const _ua = updateAtmos;
    updateAtmos = function (dt) { try { tickBurns(dt); } catch (e) {} return _ua.apply(this, arguments); };
  }

  // ruby: keep rupture identity, slightly clearer burst on heavy
  function rubyRupture(e, dmg, o) {
    if (!(P.wpn && P.wpn.sword === 'ruby' && o && o.src === 'sword' && o.heavy && e && e.alive)) return;
    // a short aftershock so the price tag is felt
    if (Math.random() < 0.85) damageEnemy(e, dmg * 0.22, { src: 'rupture', dot: true, col: '#ff4060', kb: 0 });
  }

  // parry riposte window for greatsword / skull already have identities; give a brief damage buff after a parry on any sword, stronger on great.
  const _hp = typeof hurtPlayer0 === 'function' ? hurtPlayer0 : null;
  if (typeof hurtPlayer === 'function') {
    const _h = hurtPlayer;
    hurtPlayer = function (dmg, srcx, srcy, opt) {
      const r = _h.apply(this, arguments);
      try {
        if (r === 'parry') {
          P.m18riposte = (P.wpn && P.wpn.sword === 'great') ? 3.2 : 1.6;
          P.punish = Math.max(P.punish || 0, (P.wpn && P.wpn.sword === 'great') ? 2.0 : 1.2);
        }
      } catch (e) {}
      return r;
    };
  }
  function oathRiposte() {}

  // frost: slightly longer freeze already via dmg bump; no look change
  // rapier lifesteal bump (existing is 2 HP)
  if (typeof rogueAfterHit === 'function') {
    // already wrapped above; add lifesteal in a direct hook on damageEnemy path
  }
  const _de2 = damageEnemy;
  damageEnemy = function (e, dmg, o) {
    const r = _de2.apply(this, arguments);
    try {
      if (o && o.src === 'sword' && P.wpn && P.wpn.sword === 'rapier' && P.hp < P.maxhp) {
        const h = 1; // extra sip on top of the existing 2 (total 3)
        P.hp = Math.min(P.maxhp, P.hp + h);
      }
    } catch (err) {}
    return r;
  };

  // describe roles in a debug table
  W18.roles = {
    base: 'balanced starter',
    frost: 'chill, freeze, shatter',
    storm: 'chain lightning + shock',
    rapier: 'fast thrust, lifesteal, 3rd-hit crit',
    crimson: 'bleed + blood nova',
    skull: 'slow heavy, execute',
    axe: 'wide cleave',
    ruby: 'rupture burst',
    fire: 'burn + lingering burn zones',
    great: 'slow power, reflect, parry riposte',
    void: 'rift, legendary reach'
  };
  W18.dmg = Object.assign({}, SWDMG);
  W18.spd = Object.assign({}, SWSPD);
})();
