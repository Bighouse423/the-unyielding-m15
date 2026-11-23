'use strict';
// ===== M14c: BALANCE =====
// 1) Relic rarity: the m13 relics (and legendary relics in general) showed up on ~1 boss screen in 3 and on most elite/mini-boss
//    spoils. Now: at most one legendary RELIC and one m13 relic per screen, each kept with a probability (lower right after one was
//    offered), the swapped slot rerolled by rarity weight from the ordinary relics. Weapon tier-ups (crossbow II/III etc.) untouched.
// 2) Stages 7-10 curve: see M14C.CURVE (regular-foe damage outside the boss arena; bosses/minis/env/Abyss untouched). S7 ranged foes: +0.35s cooldown.
// 3) Sustain guarantee: one S4-S6 screen offers Heart of the Wake / Bloodletter if the run has neither (once per run, RUN.m14sus).
// ?m14=0 turns all of it off.
(function () {
  const M14C = window.M14C = { on: !/[?&]m14=0/.test(location.search) && !/[?&]m14bal=0/.test(location.search) && !!(window.M13 && M13.on), err: null, stat: { swapped: 0, seen: 0 } };
  if (!M14C.on) return;
  const NEW = (u) => u && /^m13/.test(u.id) && u.kind === 'RELIC';
  const LEG = (u) => u && u.kind === 'RELIC' && u.r === 'legendary';
  let lastBoss = 0;   // the last screen offered something special -> the next one is stingier
  const KEEP = { bossNew: 0.88, bossLeg: 0.86, after: 0.5, miniNew: 0.9, miniLeg: 0.88 };   // m14 final: only modestly below m13 (S7/S8 bot regression traced to the earlier, stingier values)
  M14C.KEEP = KEEP;
  const ok = (u) => u.ok() && (typeof isUnlocked !== 'function' || isUnlocked(u.id));
  function reroll(out, i, mini) {
    const cur = out[i]; const pool = UPG.filter(u => u.kind === 'RELIC' && !out.includes(u) && !NEW(u) && !LEG(u) && ok(u) && (!mini || u.r !== 'common'));
    if (!pool.length) return false;
    const tot = pool.reduce((a, u) => a + (RARITY[u.r] ? RARITY[u.r].w : 10), 0); let r = Math.random() * tot;
    for (const u of pool) { r -= RARITY[u.r] ? RARITY[u.r].w : 10; if (r <= 0) { out[i] = u; M14C.stat.swapped++; return true; } }
    out[i] = pool[pool.length - 1]; M14C.stat.swapped++; return true;
  }
  const _roll = rollChoices;
  rollChoices = function (mini) {
    const out = _roll.apply(this, arguments);
    try {
      if (!out || !out.length || (RUN.cfg && RUN.cfg.abyss)) return out;   // the Abyss keeps its generous loot
      let nNew = 0, nLeg = 0, special = false;
      for (let i = 0; i < out.length; i++) {
        const u = out[i]; if (!u) continue;
        if (NEW(u) || LEG(u)) {
          M14C.stat.seen++;
          const isNew = NEW(u), isLeg = LEG(u);
          let keep = mini ? (isLeg ? KEEP.miniLeg : KEEP.miniNew) : (isLeg ? KEEP.bossLeg : KEEP.bossNew);
          if (!mini && lastBoss) keep *= KEEP.after / 0.5;
          if ((isNew && nNew >= 1) || (isLeg && nLeg >= 1)) keep = 0;
          if (Math.random() < keep) { if (isNew) nNew++; if (isLeg) nLeg++; special = true; }
          else if (!reroll(out, i, mini)) { if (isNew) nNew++; if (isLeg) nLeg++; special = true; }
        }
      }
      if (!mini && !M14C.sim) lastBoss = special ? 1 : 0;
      sustain(out, mini);
    } catch (e) { M14C.err = String(e && e.stack || e); }
    return out;
  };
  // ---------- sustain guarantee: one screen on S4-S6 offers HEART OF THE WAKE or BLOODLETTER if the run has neither (once per run) ----------
  // Prefers a screen with no weapon on it (so it is not competing with a weapon); the S6 boss screen always gets it if still owed.
  const SUS = ['m13wake', 'bloodletter'];
  function sustain(out, mini) {
    if (M14C.sim || !RUN.on || RUN.m14sus || RUN.stage < 4 || RUN.stage > 6) return;
    const picks = RUN.picks || [];
    if (SUS.some(id => picks.includes(id))) { RUN.m14sus = 1; return; }
    const hasW = out.some(u => u && u.kind === 'WEAPON');
    if (out.some(u => u && SUS.includes(u.id))) { if (!hasW || mini) { RUN.m14sus = 1; M14C.stat.sus = 'natural'; } return; }
    if (hasW && !mini && RUN.stage < 6) return;
    const cand = SUS.map(id => UPG.find(u => u.id === id)).filter(u => u && ok(u));
    if (!cand.length) return;
    const u = cand[0];   // the Wake first (legendary, nova + heal), Bloodletter if the Wake is locked
    const RK = { common: 0, uncommon: 1, rare: 2, epic: 3, legendary: 4, cursed: 1 };
    let bi = -1, br = 99;
    for (let i = 0; i < out.length; i++) { const q = out[i]; if (!q || q.kind === 'WEAPON') continue; const r = RK[q.r] != null ? RK[q.r] : 1; if (r < br) { br = r; bi = i; } }
    if (bi < 0) { if (out.length < 3) bi = out.length; else return; }
    out[bi] = u; RUN.m14sus = 1; M14C.stat.sus = u.id + '@S' + RUN.stage + (mini ? 'spoils' : 'boss');
  }
  // ---------- S7: ranged foes fire a little less often (outside the boss arena; bosses / minis untouched) ----------
  const CAD = M14C.CAD = { 7: 0.35 };
  const _fi = frameInner;
  frameInner = function () {
    const r = _fi.apply(this, arguments);
    try {
      const add = CAD[RUN.stage];
      if (add && RUN.on && G.state === 'play' && !(RUN.cfg && (RUN.cfg.abyss || RUN.cfg.m13sanct)) && !(LEVEL.doors && LEVEL.doors.gate && LEVEL.doors.gate.state === 'sealed')) {
        for (const e of G.enemies) {
          if (!e.alive || !e.d || !e.d.ranged || e.d.boss || e.m14mini || e.m13mini) { if (e) e.m14cs = e.state; continue; }
          if (e.m14cs === 'recover' && e.state === 'chase') e.cd += add;
          e.m14cs = e.state;
        }
      }
    } catch (er) { M14C.err = String(er && er.stack || er); }
    return r;
  };
  M14C.resetRun = () => { lastBoss = 0; };
  // ---------- stages 9-10: the curve rises from stage 8 instead of jumping ----------
  // m13 bot (2 runs): deaths S8 7/3 -> S9 20/23 -> S10 27/11. Regular foes on 9-10 (penitents, royal guards, their bolts) hit
  // too hard for the step. Their damage is trimmed outside the boss arena; bosses, mini-bosses and the Abyss are untouched.
  const CURVE = M14C.CURVE = { 7: 0.85, 8: 0.92, 9: 0.8, 10: 0.84 };   // S7/S8 added after the m14 bot runs (S7 ranged/magic spike)
  const _hp = hurtPlayer;
  hurtPlayer = function (dmg, sx, sy, opt) {
    try {
      const f = CURVE[RUN.stage];
      if (f && RUN.on && !(RUN.cfg && (RUN.cfg.abyss || RUN.cfg.m13sanct))) {
        const src = opt && opt.src; const boss = (src && src.d && (src.d.boss || src.m13mini)) || (LEVEL.doors && LEVEL.doors.gate && LEVEL.doors.gate.state === 'sealed') || (opt && opt.env) || (window.M14 && M14.minis && M14.minis.some(m => m.alive && m.awake && Math.hypot(m.x - P.x, m.y - P.y) < 14));
        if (!boss && typeof dmg === 'number') arguments[0] = dmg * f;
      }
    } catch (e) { M14C.err = String(e && e.stack || e); }
    return _hp.apply(this, arguments);
  };
  const _nr = window.newRun; if (typeof _nr === 'function') newRun = function () { lastBoss = 0; const r = _nr.apply(this, arguments); RUN.m14sus = 0; return r; };
})();
