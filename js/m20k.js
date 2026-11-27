// ===== m20k: approved prices, boss names, crypt stair text, chain4 (t234u) =====
// prices  : lock the four floor-weapon altar prices (Spade 300, Maul 400, Net Trident 500, Forge Hammer 600)
//           on ITEMS and every altar row, so the shop label always matches.
// names   : lock the 14 floor-boss display names (S5 upper is "the Stormwing") on EDEF, floor defs,
//           feats, and the Bell Tower lore page, with one style: title THE X, prose "the X".
// stairtxt: the crypt stair lands at (10.5, 7.5), in the aisle IN FRONT of the altar (10.5, 4.5).
//           Behind the altar is the dais (FH 0.3), which the placer skips. Lower-risk fix: change
//           the banner text, not the layout.
// chain4  : close hung/seal chains are pulled out of the perspective billboard pass and drawn last
//           as a pixel-locked, single-column overlay (quantized depth + screen snap, no UV swim).
// Kill switches: ?m20k=0 (all; also ?m20=0) | ?prices=0 | ?names=0 | ?stairtxt=0 | ?chain4=0
(function () {
  const Q = location.search, off = /[?&](m20k|m20)=0/.test(Q), fl = n => !off && !new RegExp('[?&]' + n + '=0').test(Q);
  const M = window.M20K = { on: !off, prices: fl('prices'), names: fl('names'), stair: fl('stairtxt'), chain: fl('chain4'), n: { price: 0, name: 0, stair: 0, chain: 0 }, err: [] };
  const fail = (w, e) => { if (M.err.length < 12) M.err.push(w + ': ' + (e && e.message || e)); };
  M.st = () => ({ on: M.on, prices: M.prices, names: M.names, stair: M.stair, chain: M.chain, n: M.n, err: M.err });
  if (off) return;

  const COSTS = { spade: 300, maul: 400, nettrident: 500, forgehammer: 600 };
  const BOSSES = [
    ['m20gravewarden', 'the Gravewarden', 'THE GRAVEWARDEN', 'Gravewarden'],
    ['m20broodkeeper', 'the Broodkeeper', 'THE BROODKEEPER', 'Broodkeeper'],
    ['m20osssaint', 'the Ossuary Saint', 'THE OSSUARY SAINT', 'Ossuary Saint'],
    ['m20assembler', 'the Assembler', 'THE ASSEMBLER', 'Assembler'],
    ['m20matriarch', 'the Stormwing', 'THE STORMWING', 'Stormwing'],
    ['m20horologist', 'the Horologist', 'THE HOROLOGIST', 'Horologist'],
    ['m20champion', 'the Undying Champion', 'THE UNDYING CHAMPION', 'Undying Champion'],
    ['m20lanista', 'the Lanista', 'THE LANISTA', 'Lanista'],
    ['m20debtreaper', 'the Debt Reaper', 'THE DEBT REAPER', 'Debt Reaper'],
    ['m20boghag', 'the Bog Hag', 'THE BOG HAG', 'Bog Hag'],
    ['m20ashherald', 'the Ash Herald', 'THE ASH HERALD', 'Ash Herald'],
    ['m20forgefather', 'the Forgefather', 'THE FORGEFATHER', 'Forgefather'],
    ['m20captain', 'the Captain of Night', 'THE CAPTAIN OF NIGHT', 'Captain of Night'],
    ['m20soulwright', 'the Soulwright', 'THE SOULWRIGHT', 'Soulwright']
  ];
  const STAIR_OLD = 'Behind the altar, the floor gives way to old steps.';
  const STAIR_NEW = 'The aisle before the altar gives way to old steps.';

  function applyPrices() {
    if (!M.prices) return;
    try {
      const ITEMS = window.M20 && M20.FITEMS;
      if (ITEMS) for (const k in COSTS) {
        if (ITEMS[k] && ITEMS[k].cost !== COSTS[k]) { ITEMS[k].cost = COSTS[k]; M.n.price++; }
        else if (ITEMS[k]) ITEMS[k].cost = COSTS[k];
      }
      if (typeof ALTAR !== 'undefined' && ALTAR.items) for (const it of ALTAR.items) {
        const k = it.m20; if (!k || COSTS[k] === undefined) continue;
        if (it.cost !== COSTS[k]) { it.cost = COSTS[k]; M.n.price++; } else it.cost = COSTS[k];
      }
    } catch (e) { fail('prices', e); }
  }

  function applyNames() {
    if (!M.names) return;
    try {
      for (const [type, name, title, tough] of BOSSES) {
        if (typeof EDEF !== 'undefined' && EDEF[type]) {
          if (EDEF[type].name !== name) { EDEF[type].name = name; M.n.name++; }
          if (EDEF[type].title !== title) { EDEF[type].title = title; M.n.name++; }
        }
        if (window.M20 && M20.FL && M20.FL.defs) {
          for (const id in M20.FL.defs) {
            const d = M20.FL.defs[id];
            if (d && d.boss === type && d.toughName !== tough) { d.toughName = tough; M.n.name++; }
          }
        }
      }
      if (window.M20 && M20.FLOORPAGES) {
        const pg = M20.FLOORPAGES.find(p => p.id === 'f5u');
        if (pg && /firstborn/.test(pg.text) && !/Stormwing/.test(pg.text)) {
          pg.text = pg.text.replace('Her firstborn still nests there.', 'Her firstborn, the Stormwing, still nests there.');
          M.n.name++;
        }
      }
    } catch (e) { fail('names', e); }
  }

  function fixStairBanner() {
    if (!M.stair || typeof G === 'undefined' || !G.bigText) return;
    const t = G.bigText;
    if (t && t.t1 === 'A STAIR OPENS' && t.t2 && t.t2.indexOf('Behind the altar') >= 0) {
      t.t2 = STAIR_NEW; M.n.stair++;
    }
  }

  applyPrices(); applyNames();
  // late apply in case a later wrap rebuilds altar rows
  setTimeout(() => { applyPrices(); applyNames(); }, 0);

  const HUNG = { h_chain: 1, a_chain: 1, m20i_hchain: 1, m20_chains: 1 };
  function blitChain(cam, s) {
    const t = Engine.tex && Engine.tex[s.tex]; if (!t || typeof PIX === 'undefined' || typeof ZB === 'undefined') return;
    const dx = Math.cos(cam.ang), dy = Math.sin(cam.ang);
    const rx = s.x - cam.x, ry = s.y - cam.y;
    const depth = rx * dx + ry * dy; if (depth < 0.15) return;
    const qd = Math.max(0.2, Math.round(depth * 16) / 16);
    const lat = -rx * dy + ry * dx;
    const sc = EP / qd;
    const sw = Math.max(3, (s.w * sc + 0.5) | 0);
    const sh = Math.max(4, (s.h * sc + 0.5) | 0);
    const cx = (EW / 2 + lat * sc + 0.5) | 0;
    const eye = Math.round(cam.eye * 16) / 16;
    const yTop = ((EH / 2 + cam.pitch) - (s.z + s.h - eye) * sc + 0.5) | 0;
    const x0 = Math.max(0, cx - (sw >> 1)), x1 = Math.min(EW, x0 + sw);
    const y0 = Math.max(0, yTop), y1 = Math.min(EH, yTop + sh);
    if (x1 <= x0 || y1 <= y0) return;
    const tw = t.w, th = t.h, td = t.d, u = (tw * 0.5) | 0;
    let aK = s.alpha === undefined ? 1 : s.alpha; if (aK <= 0.02) return;
    for (let r = y0; r < y1; r++) {
      const v = Math.max(0, Math.min(th - 1, ((r - yTop) * th / sh) | 0));
      const p = td[v * tw + u], a = ((p >>> 24) * aK) | 0;
      if (a < 10) continue;
      const pr = p & 255, pg = (p >> 8) & 255, pb = (p >> 16) & 255;
      for (let c = x0; c < x1; c++) {
        const idx = r * EW + c;
        if (ZB[idx] <= qd) continue;
        if (a >= 200) { PIX[idx] = 0xff000000 | (pb << 16) | (pg << 8) | pr; ZB[idx] = qd; }
        else {
          const q = PIX[idx], ia = 255 - a;
          const rr = (pr * a + (q & 255) * ia) / 255 | 0;
          const gg = (pg * a + ((q >> 8) & 255) * ia) / 255 | 0;
          const bb = (pb * a + ((q >> 16) & 255) * ia) / 255 | 0;
          PIX[idx] = 0xff000000 | (bb << 16) | (gg << 8) | rr;
        }
      }
    }
    M.n.chain++;
  }

  if (typeof drawSprites === 'function') {
    const _ds = drawSprites;
    drawSprites = function (cam, S) {
      if (!M.chain || !S || !S.length) return _ds.apply(this, arguments);
      const keep = [], ov = [];
      const dx = Math.cos(cam.ang), dy = Math.sin(cam.ang);
      for (let i = 0; i < S.length; i++) {
        const s = S[i];
        if (HUNG[s.tex]) {
          const d = s.dep !== undefined ? s.dep : (s.x - cam.x) * dx + (s.y - cam.y) * dy;
          if (d < 2.6) { ov.push(s); continue; }
        }
        keep.push(s);
      }
      const r = _ds.call(this, cam, keep);
      try { for (let i = 0; i < ov.length; i++) blitChain(cam, ov[i]); } catch (e) { fail('chain4', e); }
      return r;
    };
  }

  if (typeof frameInner === 'function') {
    const _fi = frameInner; let tick = 0;
    frameInner = function () {
      const r = _fi.apply(this, arguments);
      try {
        if (M.stair) fixStairBanner();
        if ((++tick % 30) === 0) { applyPrices(); applyNames(); }
      } catch (e) { fail('frame', e); }
      return r;
    };
  }
  M.apply = () => { applyPrices(); applyNames(); };
  M.STAIR_NEW = STAIR_NEW; M.COSTS = COSTS; M.BOSSES = BOSSES;
  M.st = () => ({ on: M.on, prices: M.prices, names: M.names, stair: M.stair, chain: M.chain, n: M.n, err: M.err });
})();
