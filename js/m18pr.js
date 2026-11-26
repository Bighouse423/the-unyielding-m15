// ===== m18pr: retune altar prices to the new power curve. Shop total aims for ~2-3 full clears.
// Respects ?prices=0 and ?m18pr=0 / ?m18=0. Does not touch weapon damage numbers, vials, or bosses.
(function () {
  if (!window.M18 || !M18.prices) return;
  if (typeof ALTAR === 'undefined' || !ALTAR.items) return;
  const r5 = v => Math.max(5, Math.round(v / 5) * 5);
  const P18 = M18.priceState = { on: true, old: {}, neu: {} };

  // snapshot post-m17 prices, then rewrite a tighter ladder
  for (const it of ALTAR.items) {
    if (it.cost != null) P18.old[it.id] = it.cost;
    if (it.costs) P18.old[it.id] = it.costs.slice();
  }

  // power-ranked armory (id -> price). Follows the m18 weapon ladder.
  const ARMORY = {
    chainwhip: 150,
    crimsonsword: 185,
    bloodwhip: 185,
    stormsword: 230,      // was underpriced for a pack-clearer; now a mid-epic
    rapier: 200,
    battleaxe: 210,
    skullblade: 220,
    rubysword: 260,       // top ST / rupture
    crossbow: 240,
    greatsword: 270,
    firesword: 250        // if present as an unlock; emberbrand stays premium
  };
  const RELIC = {
    gravecoin: 20,
    gravedirt: 35,
    emberheart: 60,
    rimesigil: 65,
    stormbell: 70,
    fang: 70,
    repeater: 70,
    hood: 70,
    dreadhorn: 70,
    laurel: 70,
    hellfang: 70,
    ironoath: 80,
    wraithcloak: 80,
    phylactery: 85,
    lichring: 200,
    lastrites: 300,
    halo: 230
  };
  // loadouts: a bit under the unlock, emberbrand premium
  const LOAD = {
    ld_pistol: 50,
    ld_xbow: 120,
    ld_frost: 130,
    ld_fire: 130,
    ld_storm: 160,
    ld_rapier: 145,
    ld_chain: 145,
    ld_crimson: 145,
    ld_blood: 145,
    ld_skull: 160,
    ld_axe: 155,
    ld_ruby: 180,
    ld_great: 185,
    ld_ember: 240
  };
  const BLESS = { vit: [35, 70, 140], soul: [30, 60, 120], might: [45, 90, 180], fortune: [35, 70, 140] };

  function idMatch(map, id) {
    if (map[id] != null) return map[id];
    for (const k of Object.keys(map)) if (id === k || id.endsWith(k) || k.endsWith(id)) return map[k];
    return null;
  }

  for (const it of ALTAR.items) {
    if (it.up && it.costs) {
      const b = BLESS[it.id];
      if (b) it.costs = b.slice();
      P18.neu[it.id] = it.costs.slice();
      continue;
    }
    if (it.tab === 2) {
      const v = idMatch(LOAD, it.id);
      if (v != null) it.cost = r5(v);
      P18.neu[it.id] = it.cost;
      continue;
    }
    if (it.tab === 0) {
      const v = idMatch(ARMORY, it.id);
      if (v != null) it.cost = r5(v);
      P18.neu[it.id] = it.cost;
      continue;
    }
    if (it.tab === 1) {
      const v = idMatch(RELIC, it.id);
      if (v != null) it.cost = r5(v);
      P18.neu[it.id] = it.cost;
      continue;
    }
  }
  let tot = 0;
  for (const it of ALTAR.items) {
    if (it.costs) tot += it.costs.reduce((a, b) => a + b, 0);
    else if (it.cost) tot += it.cost;
  }
  P18.total = tot;
  P18.state = 'm18';
})();
