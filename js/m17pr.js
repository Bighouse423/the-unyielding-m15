// ===== m17pr: altar prices rise with tier / rarity =====
// Better unlocks (rare / epic / legendary, later blessing ranks, stronger loadouts) cost progressively more.
// Common and early blessings stay cheap. Weapon damage, bosses, vials and ranged numbers are untouched.
// ?prices=0 keeps the m16 price table (including m9n's flat x3 on pre-m10 offerings).
(function () {
  if (typeof ALTAR === 'undefined' || !ALTAR.items) return;
  const P17 = window.M17PR = { on: !/[?&]prices=0/.test(location.search), err: null, old: {}, neu: {}, note: 'm17 tiered altar prices' };
  const r5 = v => Math.max(5, Math.round(v / 5) * 5);
  const RK = { common: 1.0, rare: 1.8, epic: 3.5, legendary: 5.5 };
  const BLESS = {
    vit: [40, 80, 160],
    soul: [35, 70, 140],
    might: [50, 100, 200],
    fortune: [40, 80, 160]
  };
  // snapshot whatever is live (m16) before we rewrite
  for (const it of ALTAR.items) {
    if (it.cost != null) P17.old[it.id] = it.cost;
    if (it.costs) P17.old[it.id] = it.costs.slice();
  }
  if (!P17.on) { P17.state = 'm16'; return; }

  function rarityOf(id) {
    if (typeof UPG === 'undefined') return 'common';
    const u = UPG.find(q => q.id === id);
    return (u && u.r) || 'common';
  }
  function baseOf(it) {
    // pre-m9n original if m9n stored it; emberbrand (added later) kept its listed cost as a high epic base
    if (window.M9N && M9N.oldPrices && M9N.oldPrices[it.id] != null) {
      const o = M9N.oldPrices[it.id];
      return Array.isArray(o) ? o : o;
    }
    if (it.costs) return it.costs.map(v => r5(v / 3));
    // unscaled late add (ld_ember): treat 180 as an already-strong epic base ~70
    if (it.id === 'ld_ember') return 70;
    return it.cost;
  }
  function scale(base, r, k) {
    const rk = RK[r] || 1;
    return r5(base * rk * (k || 1));
  }

  for (const it of ALTAR.items) {
    if (it.up && it.costs) {
      it.costs = (BLESS[it.id] || it.costs.map((v, i) => r5((BLESS.vit[i] || v) * (it.costs[0] / 30)))).slice();
      P17.neu[it.id] = it.costs.slice();
      continue;
    }
    if (it.tab === 2) {
      const r = rarityOf(it.need);
      // loadouts are a bit under the matching unlock, but still follow the rarity curve
      it.cost = scale(baseOf(it), r, 0.88);
      // Emberbrand stays the premium start
      if (it.id === 'ld_ember') it.cost = Math.max(it.cost, 250);
      P17.neu[it.id] = it.cost;
      continue;
    }
    if (it.cost != null) {
      const r = rarityOf(it.id);
      it.cost = scale(baseOf(it), r, 1);
      P17.neu[it.id] = it.cost;
    }
  }
  P17.state = 'm17';
  P17.rk = RK;
})();
