// M11e - sound pass: ElevenLabs one-shots for Crossbow II/III, Emberbrand, kills, multi-kills, wards, the thief,
// blood pacts, blazing novas and wrath orbs (audio/sfx/m11_*.mp3|ogg, listed in audio.json "sfx").
// Layered on top of the existing sounds (never replaces them); music untouched. Off with ?m11=0 or ?m11sfx=0.
(function () {
  const M11 = window.M11; if (!M11 || !M11.on) return;
  const on = !/[?&]m11sfx=0/.test(location.search);
  const last = {}, GAP = { m11_kill: 0.09, m11_ember: 0.07, m11_nova: 0.12, m11_xb3: 0.06, m11_xb2: 0.06, m11_ward: 0.08 };
  M11.sfx = function (name, vol) {
    if (!on || name === 'heart' || typeof SFX === 'undefined' || !SFX.ev || !SFX.has || !SFX.has(name)) return false;   // heartbeat: audio.js already plays it under 25% HP
    const t = SFX.ctx ? SFX.ctx.currentTime : 0; if (t - (last[name] || -9) < (GAP[name] || 0.03)) return true; last[name] = t;
    return SFX.ev(name, vol == null ? 1 : vol);
  };
  const tier = () => (window.M10 && M10.tierOf ? M10.tierOf() : (P.wpn && P.wpn.xbt) || 1);
  // crossbow II / III: layered shot
  const _fc = fireCrossbow;
  fireCrossbow = function () {
    const n0 = BOLTS.length; const r = _fc.apply(this, arguments);
    try { if (BOLTS.length > n0) { const t = tier(); if (t === 2) M11.sfx('m11_xb2', 0.62); else if (t === 3) M11.sfx('m11_xb3', 0.7); } } catch (e) { }
    return r;
  };
  // fire / holy bursts (Crossbow II/III impacts, Emberbrand heavies)
  if (window.M10 && M10.burst) {
    const _b = M10.burst;
    M10.burst = function (x, y, z, kind) { const r = _b.apply(this, arguments); try { M11.sfx(kind === 'holy' ? 'm11_xb3' : 'm11_nova', kind === 'holy' ? 0.38 : 0.42); } catch (e) { } return r; };
  }
  // Emberbrand hits + kill crunch
  const _de = damageEnemy;
  damageEnemy = function (e, dmg, o) {
    const alive = e && e.alive; const r = _de.apply(this, arguments);
    try { if (alive && o && o.src === 'sword' && P.wpn && P.wpn.sword === 'fire') M11.sfx('m11_ember', o.heavy ? 0.75 : 0.5); } catch (er) { }
    return r;
  };
  const _ke = killEnemy;
  killEnemy = function (e) {
    const boss = e && e.d && e.d.boss; const r = _ke.apply(this, arguments);
    try { if (!boss) M11.sfx('m11_kill', 0.42); } catch (er) { }
    return r;
  };
})();
