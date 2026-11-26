'use strict';
// ===== m20: THE CHAPEL SPIRITS + THE LORE BOOK + THE VIGIL =====
// Eight spirits fill the Chapel as you progress (Hades-style). Each has story beats (one per visit), reactions to your
// last run, idle barks and Remembrances (lore pages you can offer). Starred beats raise a spirit's rank, and ranks open
// existing altar rows (prices unchanged; owned rows stay owned). The Lore Book (lectern / pause / title) lists spirits,
// bosses and pages with an auto-written journal in Kael's voice. When every spirit's penultimate beat is heard and the
// Black Baron kneels in the Chapel, THE VIGIL plays and the Chapel turns to dawn.
// Kill switches: ?npc=0 (all off, altar/lectern exactly as m19)  ?npcgate=0 (no gating)  ?lorebook=0  ?vigil=0
(function () {
  if (!window.M20 || !M20.on || !M20.npc || !window.M20NPC_DATA) return;
  const D = window.M20NPC_DATA;
  const ROM = ['', 'I', 'II', 'III', 'IV'];
  // ---------- cast ----------
  const NPC = M20.NPC = {
    wick: { name: 'BROTHER WICK', title: 'The Candle-Sexton', slot: [6.9, 6.8], h: 1.25, col: '#ffd890', sfx: 'clink', glow: [255, 200, 120], hint: 'Present from the beginning.', arrive: s => true },
    auberon: { name: 'AUBERON KAEL', title: 'The First Baron', slot: [13.8, 7.6], h: 1.95, col: '#a8d8ff', sfx: 'parry', glow: [140, 200, 255], hint: 'Die once. He has been waiting for that.', arrive: s => s.runs >= 1 },
    brannoch: { name: 'BRANNOCH', title: 'Smith of the Dawn-Forge', slot: [16.3, 9.8], h: 1.85, col: '#ffb070', sfx: 'stone', glow: [255, 140, 60], hint: 'Reach Stage 3.', arrive: s => s.best >= 3 },
    cecily: { name: 'SAINT CECILY', title: 'The Bell-Saint', slot: [16.3, 14.6], h: 1.8, col: '#ffe8a0', sfx: 'toll', glow: [255, 220, 140], float: 0.25, hint: 'Fell the Gargoyle Matriarch.', arrive: s => s.ach('boss_matriarch') },
    isolde: { name: 'ISOLDE VANE', title: 'The Penitent', slot: [3.7, 14.2], h: 1.8, col: '#b0ffb8', sfx: 'ghost', glow: [120, 255, 150], hint: 'Fell Morwen the witch.', arrive: s => s.ach('boss_witch') },
    ansel: { name: 'ANSEL', title: 'The Candle-Child', slot: [12.7, 18.6], h: 1.2, col: '#b8e8ff', sfx: 'glint', glow: [150, 210, 255], hint: 'Find 3 secret rooms, or complete 6 runs.', arrive: s => s.secrets >= 3 || s.runs >= 6 || s.ach('m13_pilgrim') },
    ozmeth: { name: 'OZMETH', title: 'The Debtor', slot: [3.7, 18.6], h: 1.8, col: '#ff8070', sfx: 'roar', glow: [255, 70, 50], float: 0.35, hint: 'Fell Cerberax.', arrive: s => s.ach('boss_cerberax') },
    baron: { name: 'THE BLACK BARON', title: 'The Kneeling Knight', slot: [7.4, 9.2], h: 1.55, col: '#d0a0a0', sfx: 'block', glow: [200, 60, 60], hint: 'Something kneels under the throne.', arrive: s => s.ach('m13_baron') },
  };
  const ORDER = ['wick', 'auberon', 'brannoch', 'ansel', 'cecily', 'isolde', 'ozmeth', 'baron'];
  for (const id of ORDER) { const n = NPC[id], d = D[id]; n.id = id; n.spr = 's_m20_' + id; n.beats = d.beats; n.react = d.react; n.barks = d.barks || []; n.rem = d.rem || {}; }
  // ranks -> altar rows (section 6 of the design; prices untouched)
  M20.GATE = {
    gravecoin: ['wick', 1], gravedirt: ['wick', 1], emberheart: ['wick', 1], rimesigil: ['wick', 1], stormbell: ['wick', 1], fang: ['wick', 1], repeater: ['wick', 2], laurel: ['wick', 2],
    chainwhip: ['brannoch', 1], crossbow: ['brannoch', 1], crimsonsword: ['brannoch', 1], bloodwhip: ['brannoch', 1],
    ld_pistol: ['brannoch', 1], ld_chain: ['brannoch', 1], ld_blood: ['brannoch', 1], ld_crimson: ['brannoch', 1], ld_xbow: ['brannoch', 1], ld_frost: ['brannoch', 1], ld_fire: ['brannoch', 1],
    rapier: ['brannoch', 2], stormsword: ['brannoch', 2], battleaxe: ['brannoch', 2], skullblade: ['brannoch', 2], ld_rapier: ['brannoch', 2], ld_storm: ['brannoch', 2], ld_axe: ['brannoch', 2], ld_skull: ['brannoch', 2],
    rubysword: ['brannoch', 3], greatsword: ['brannoch', 3], ld_ruby: ['brannoch', 3], ld_great: ['brannoch', 3],
    ironoath: ['cecily', 1], halo: ['cecily', 2], lastrites: ['cecily', 3],
    wraithcloak: ['isolde', 1], phylactery: ['isolde', 1], lichring: ['isolde', 2],
    hellfang: ['ozmeth', 1], dreadhorn: ['ozmeth', 1], headsman: ['ozmeth', 1], hood: ['ozmeth', 1], ld_ember: ['ozmeth', 2],
  };
  const RANK_HINT = { 'wick:2': 'after 5 descents', 'brannoch:1': 'after you reach Stage 3', 'brannoch:2': 'after you reach Stage 6', 'brannoch:3': 'after you reach Stage 8', 'auberon:1': 'after your first death', 'auberon:2': 'after you reach Stage 6', 'auberon:3': 'after you reach Stage 8',
    'cecily:1': 'once the Matriarch falls', 'cecily:2': 'after you slay the Lich King', 'cecily:3': 'after the Hollow Saint is destroyed (or 3 Lich clears)', 'isolde:1': 'once Morwen falls', 'isolde:2': 'after you slay the Lich King', 'ozmeth:1': 'once Cerberax falls', 'ozmeth:2': 'after Stage 9 or a Lich clear' };
  // ---------- save ----------
  const sv = M20.npcSv = function () {
    let s = SAVE.m20; if (!s || typeof s !== 'object') s = SAVE.m20 = {};
    s.v = 1; for (const k of ['met', 'beats', 'rank', 'tp', 'rem', 'bk', 'pg', 'flags', 'bark']) if (!s[k] || typeof s[k] !== 'object') s[k] = {};
    if (typeof s.vis !== 'number') s.vis = 0; if (!s.last || typeof s.last !== 'object') s.last = null; return s;
  };
  const write = () => { try { if (typeof writeSave === 'function') writeSave(); } catch (e) { M20.fail('npc save', e); } };
  // ---------- derived stats ----------
  const ACHH = id => { try { return !!(window.ACH && ACH.has(id)); } catch (e) { return false; } };
  function stats() {
    const S = sv(), st = SAVE.stats || {}, b = SAVE.best || {};
    const o = { runs: st.runs | 0, wins: st.wins | 0, best: b.stage | 0, secrets: st.secrets | 0, ach: ACHH, heard: id => !!S.beats[id], met: id => !!S.met[id], vigil: !!S.flags.vigil, present: 0 };
    o.deaths = Math.max(0, o.runs - o.wins); o.present = ORDER.filter(id => S.met[id]).length; return o;
  }
  M20.stats = stats;
  // requirements: parsed from the design text, with the irregular ones mapped by hand
  const SPN = { Wick: 'W', Auberon: 'A', Brannoch: 'B', Cecily: 'C', Isolde: 'I', Ansel: 'N', Ozmeth: 'O', Baron: 'K' };
  const HAND = {
    W1: s => true, W7: s => s.present >= 4, A1: s => s.runs >= 1, A9: s => s.met('baron'), B1: s => s.best >= 3, B3: s => s.ach('boss_colossus') || s.best >= 4,
    C1: s => s.ach('boss_matriarch'), C8: s => s.ach('saint') || s.wins >= 3, I1: s => s.ach('boss_witch'), N1: s => true, N4: s => s.secrets >= 8 || s.best >= 6,
    O1: s => s.ach('boss_cerberax'), O5: s => s.best >= 9 || s.wins >= 1, K1: s => s.ach('m13_baron'),
  };
  function reqFn(b) {
    if (HAND[b.id]) return HAND[b.id];
    const t = b.req; if (/vigil/i.test(t)) return s => s.vigil;
    const conds = [];
    t.replace(/`(stats\.runs|stats\.wins|best\.stage|stats\.secrets)\s*>=\s*(\d+)`/g, (m, k, n) => { n = +n; conds.push(k === 'stats.runs' ? s => s.runs >= n : k === 'stats.wins' ? s => s.wins >= n : k === 'best.stage' ? s => s.best >= n : s => s.secrets >= n); return m; });
    t.replace(/\+\s*(?:Auberon|Isolde|Wick|Brannoch|Cecily|Ansel|Ozmeth|Baron)\s+([A-Z]\d+)/g, (m, id) => { conds.push(s => s.heard(id)); return m; });
    return s => conds.every(c => c(s));
  }
  for (const id of ORDER) for (const b of NPC[id].beats) b.ok = reqFn(b);
  // ---------- arrivals / ranks ----------
  const rankOf = id => { const S = sv(); let r = S.rank[id] | 0; for (const b of NPC[id].beats) if (b.rank && S.beats[b.id] && b.rank > r) r = b.rank; return r; };
  M20.rankOf = rankOf;
  function nextBeat(id, s) { const n = NPC[id], S = sv(); for (const b of n.beats) { if (S.beats[b.id]) continue; return b.ok(s) ? b : null; } return null; }
  M20.nextBeat = (id) => nextBeat(id, stats());
  const HUB = M20.hub = { arrival: null, talked: {}, reacted: {}, tags: [], first: false, near: null, cand: false };
  function arrivals() {
    const S = sv(), s = stats(); const out = [];
    const ready = ORDER.filter(id => !S.met[id] && NPC[id].arrive(s));
    if (!ready.length) return out;
    if (S.vis === 0) { for (const id of ready) { S.met[id] = Date.now(); out.push(id); } }   // retro: a returning save opens with everyone it has earned
    else { S.met[ready[0]] = Date.now(); out.push(ready[0]); }
    return out;
  }
  function tagsFrom(last, S) {
    const T = []; if (!last) return S.vis <= 1 ? ['FIRSTHUB'] : [];
    if (last.won) T.push('WIN'); if (last.abyss >= 1) T.push('ABYSS'); if (last.newBest) T.push('NEWBEST');
    const bossKeys = ['vknight', 'spider', 'colossus', 'alphawolf', 'm15sexton', 'matriarch', 'minotaur', 'm15ferrum', 'witch', 'cerberax', 'uknight', 'lich', 'blackbaron', 'm13butcher', 'm13abbess'];
    if (last.by && (bossKeys.includes(last.by) || /^m20(roofer|abbot|huntmaster|cistern|spire|oathbound)/.test(last.by))) T.push('BOSS');
    if (last.by === 'chasm' || /lava|spike|trap/.test(last.by || '')) T.push('HAZARD');
    T.push(last.stage <= 2 ? 'EARLY' : last.stage <= 6 ? 'MID' : 'LATE');
    if (last.shards < 40) T.push('BROKE'); if (last.shards >= 1000) T.push('RICH');
    return T;
  }
  function reactFor(id) {
    const n = NPC[id]; if (!n.react) return null;
    for (const t of HUB.tags) { for (const k in n.react) if (k.split('/').includes(t)) return n.react[k]; }
    return null;
  }
  const BYN = { chasm: 'the blood sea' };
  function fill(t) {
    const S = sv(), L = S.last || {}, st = stats();
    const by = (L.byName || BYN[L.by] || L.by || 'the dark');
    return String(t).replace(/\{runs\}/g, st.runs).replace(/\{deaths\}/g, st.deaths).replace(/\{stage\}/g, L.stage || 1).replace(/\{by\}/g, by).replace(/\{abyss\}/g, L.abyss || 1).replace(/\{shards\}/g, L.shards || 0);
  }
  // ---------- hub entry ----------
  const _eh = enterHub;
  enterHub = function () {
    const r = _eh.apply(this, arguments);
    try {
      const S = sv(); HUB.talked = {}; HUB.reacted = {}; HUB.arrival = null; HUB.vigilReady = false;
      HUB.tags = tagsFrom(S.last, S);
      const arr = arrivals(); S.vis++;
      if (arr.length) { HUB.arrival = arr[arr.length - 1]; HUB.arrT = 0; HUB.arrList = arr; }
      HUB.vigilReady = vigilReady();
      if (S.flags.dawn && M20.vigil) dawn();
      write();
    } catch (e) { M20.fail('npc enterHub', e); }
    return r;
  };
  // last run snapshot for reactions
  function snapLast(won) {
    try {
      const S = sv(), best = SAVE.best || {};
      const by = won ? '' : (G.lastHit || '');
      S.last = { stage: RUN.stage | 0, by, byName: RUN.cause || '', won: !!won, newBest: (RUN.stage | 0) >= (best.stage | 0) && !!RUN.m20newBest, shards: RUN.shardsRun | 0, secrets: RUN.secrets | 0, abyss: (RUN.cfg && RUN.cfg.abyss) | 0, daily: RUN.m12daily || '', t: Date.now() };
    } catch (e) { M20.fail('npc last', e); }
  }
  if (typeof newRun === 'function') { const _nr = newRun; newRun = function () { const b0 = (SAVE.best && SAVE.best.stage) | 0; const r = _nr.apply(this, arguments); RUN.m20best0 = b0; return r; }; }
  if (typeof startResults === 'function') { const _sr = startResults; startResults = function () { try { RUN.m20newBest = (RUN.stage | 0) > (RUN.m20best0 | 0); } catch (e) { } const r = _sr.apply(this, arguments); snapLast(false); write(); return r; }; }
  if (typeof startWin === 'function') { const _sw = startWin; startWin = function () { const r = _sw.apply(this, arguments); snapLast(true); write(); return r; }; }
  // boss ledger
  if (window.M9 && M9.on) M9.on('kill', e => { try { if (!e || !e.d) return; if (e.d.boss || e.m13mini || e.m20boss) { const b = sv().bk[e.type] = sv().bk[e.type] || { k: 0, seen: 1 }; b.k++; b.seen = 1; } } catch (er) { } });
  // ---------- gating (altar rows) ----------
  function gateOf(it) {
    if (!M20.npcgate) return null;
    if (it.tab === 3 && it.up) { const lv = (SAVE.upg && SAVE.upg[it.id]) | 0; if (lv >= 3) return null; return ['auberon', lv + 1]; }
    return M20.GATE[it.id] || null;
  }
  M20.gateOf = gateOf;
  const owned = it => (it.tab <= 2) ? !!SAVE.unl[it.id] : false;
  if (typeof altarState === 'function') {
    const _as = altarState;
    altarState = function (it) {
      const st = _as.apply(this, arguments);
      try { const g = gateOf(it); if (g && !st.done && !owned(it) && rankOf(g[0]) < g[1]) return { label: 'SEALED - ' + NPC[g[0]].name.replace(/^(BROTHER|SAINT|THE) /, '') + ' ' + ROM[g[1]], locked: true, sealed: g }; } catch (e) { M20.fail('gate', e); }
      return st;
    };
  }
  if (typeof altarInfo === 'function') {
    const _ai = altarInfo;
    altarInfo = function (it) {
      const inf = _ai.apply(this, arguments);
      try { const g = gateOf(it); if (g && inf && rankOf(g[0]) < g[1] && !owned(it)) { const n = NPC[g[0]]; const met = sv().met[g[0]]; return Object.assign({}, inf, { desc: (inf.desc || '') + '  SEALED: ' + (met ? 'speak to ' + n.name.replace(/^(BROTHER|SAINT) /, '') + ' ' + (RANK_HINT[g[0] + ':' + g[1]] || 'again') : 'a spirit who has not yet come to the Chapel keeps this') + '.' }); } } catch (e) { }
      return inf;
    };
  }
  // ---------- hub sprites, markers, push-out ----------
  const inHub = () => RUN.hub && LEVEL && LEVEL.kind === 'hub';
  function marker(id) { const s = stats(); if (nextBeat(id, s) && !HUB.talked[id]) return 'gold'; if (!HUB.reacted[id] && reactFor(id)) return 'silver'; return null; }
  M20.marker = marker;
  if (window.M9 && M9.on) M9.on('sprites', X => {
    try {
      if (!inHub()) return; const S = sv(), t = G.t || 0, dawnOn = !!S.flags.dawn;
      for (const id of ORDER) {
        if (!S.met[id]) continue; const n = NPC[id]; const tx = Engine.tex[n.spr]; if (!tx || tx.w < 2) continue;
        let a = 1; if (HUB.arrival === id && HUB.arrT < 2) a = Math.min(1, HUB.arrT / 2);
        const [x, y] = n.slot, z = floorAt(x, y) + (n.float || 0) + 0.04 * Math.sin(t * 1.6 + x);
        const w = n.h * tx.w / tx.h;
        X.push({ tex: 'glow_w', x, y, z: z + n.h * 0.1, w: w * 1.5, h: n.h * 1.15, add: true, alpha: (dawnOn ? 0.1 : 0.2) * a, lit: false, tint: dawnOn ? [255, 210, 140, 1] : [n.glow[0], n.glow[1], n.glow[2], 1] });
        X.push({ tex: n.spr, x, y, z, w, h: n.h, alpha: (dawnOn ? 1 : 0.9) * a, glow: 0.12, rim: 0.4 });
        const mk = marker(id);
        if (mk && a >= 1) X.push({ tex: 'glow_w', x, y, z: z + n.h + 0.25 + 0.05 * Math.sin(t * 4), w: 0.28, h: 0.38, add: true, alpha: 0.8, lit: false, tint: mk === 'gold' ? [255, 200, 70, 1] : [210, 220, 255, 1] });
      }
      if (HUB.vigilReady && M20.vigil) X.push({ tex: 'glow_w', x: 10.5, y: 4.4, z: 1.4 + 0.05 * Math.sin(t * 3), w: 0.6, h: 0.9, add: true, alpha: 0.85, lit: false, tint: [255, 210, 90, 1] });
    } catch (e) { M20.fail('npc sprites', e); }
  });
  function facingNear() {
    const S = sv(); let best = null;
    for (const id of ORDER) {
      if (!S.met[id]) continue; const [x, y] = NPC[id].slot; const d = Math.hypot(x - P.x, y - P.y); if (d > 1.7) continue;
      const off = Math.abs(angDiff(Math.atan2(y - P.y, x - P.x), P.ang)); if (off > 0.96) continue;
      if (!best || d < best.d) best = { id, d };
    }
    return best;
  }
  if (window.M9 && M9.on) M9.on('tick', dt => {
    try {
      if (!inHub() || G.state !== 'play') { HUB.near = null; return; }
      const S = sv(); if (HUB.arrival) { HUB.arrT += dt; if (HUB.arrT > 0.05 && !HUB.arrCard && !(window.OPT && OPT.open)) { HUB.arrCard = true; const n = NPC[HUB.arrival]; G.bigText = { t1: n.name, t2: n.title + '  -  a new spirit in the Chapel', t: 0, dur: 3.2 }; SFX.play('toll', 0.6); SFX.play('ghost', 0.5); } }
      for (const id of ORDER) { if (!S.met[id]) continue; const [x, y] = NPC[id].slot; const dx = P.x - x, dy = P.y - y, d = Math.hypot(dx, dy); if (d < 0.5 && d > 0.001) { P.x = x + dx / d * 0.5; P.y = y + dy / d * 0.5; } }
      HUB.near = facingNear();
      if (HUB.near && (KP.Tab || KP.Enter || KP.PadY) && !(window.OPT && OPT.open)) { delete KP.Tab; delete KP.Enter; delete KP.PadY; openTalk(HUB.near.id); }
      // the Vigil: walk up to the altar when the gold candle burns
      if (HUB.vigilReady && M20.vigil && Math.hypot(P.x - 10.5, P.y - 5.6) < 1.3 && !(window.OPT && OPT.open)) { HUB.vigilReady = false; openVigil(); }
    } catch (e) { M20.fail('npc tick', e); }
  });
  // altar opens when you walk to it; while the Vigil candle burns, the Vigil comes first
  if (typeof openAltar === 'function') { const _oa = openAltar; openAltar = function () { if (HUB.vigilReady && M20.vigil) { HUB.vigilReady = false; openVigil(); return; } return _oa.apply(this, arguments); }; }
  // ---------- the modal UI (talk / book / vigil) on the OPT overlay ----------
  const UI = M20.ui = { kind: null };
  function openUI(kind, from) { UI.kind = kind; UI.t = 0; OPT.open = true; OPT.page = 'm20'; OPT.from = from || 'hub'; OPT.anim = 1; try { releaseAll && releaseAll(); } catch (e) { } if (document.exitPointerLock) try { document.exitPointerLock(); } catch (e) { } }
  function closeUI() { const then = UI.then; UI.kind = null; UI.then = null; OPT.open = false; OPT.page = 'main'; for (const k in KP) delete KP[k]; MBP[0] = false; if (then) then(); }
  M20.closeUI = closeUI;
  const K_OK = () => KP.Enter || KP.Space || KP.PadOK || MBP[0], K_BACK = () => KP.Escape || KP.PadBack || KP.Backspace, K_UP = () => KP.ArrowUp || KP.KeyW, K_DN = () => KP.ArrowDown || KP.KeyS, K_L = () => KP.ArrowLeft || KP.KeyA || KP.KeyQ, K_R = () => KP.ArrowRight || KP.KeyD || KP.KeyE, K_Y = () => KP.PadY || KP.Tab || KP.KeyJ, K_X = () => KP.PadRestart || KP.KeyN;
  // ---- talk ----
  function pagesForBeat(n, b, ch) {
    const P_ = []; const nm = n.name;
    for (const l of b.lines) {
      if (l.if) { const found = ACHH('m13_pilgrim'); if (/never found/.test(l.if) ? found : !found) continue; }
      P_.push({ sp: nm, t: fill(l.t), act: l.act || '' });
    }
    if (b.reply) { P_.push({ sp: nm, t: '', choice: [b.reply.a, b.reply.b], beat: b.id }); if (ch === 0 || ch === 1) for (const t of (ch ? b.reply.rb : b.reply.ra)) P_.push({ sp: nm, t: fill(t) }); }
    return P_;
  }
  function openTalk(id, replay) {
    const n = NPC[id], S = sv(), s = stats();
    UI.npc = id; UI.pages = []; UI.p = 0; UI.sel = 0; UI.replay = !!replay; UI.beat = null; UI.rem = null; UI.after = null;
    if (replay) { const b = n.beats.find(q => q.id === replay) ; if (b) { UI.pages = pagesForBeat(n, b, S.beats[b.id] ? S.beats[b.id].ch : null); if (b.reply && S.beats[b.id] && (S.beats[b.id].ch === 0 || S.beats[b.id].ch === 1)) UI.pages = UI.pages.filter(p => !p.choice); } else if (n.rem[replay]) UI.pages = n.rem[replay].lines.map(t => ({ sp: n.name, t })); openUI('talk', UI.from || 'book'); return; }
    if (!HUB.reacted[id]) { const r = reactFor(id); if (r) { UI.pages.push({ sp: n.name, t: fill(r) }); HUB.reacted[id] = true; } }
    const b = !HUB.talked[id] ? nextBeat(id, s) : null;
    if (b) { UI.beat = b; UI.pages = UI.pages.concat(pagesForBeat(n, b, null)); }
    else {
      const want = Object.keys(n.rem).find(pid => !S.rem[id + ':' + pid] && pageHave(pid));
      if (want) UI.pages.push({ sp: n.name, t: '', offer: want, choice: ['OFFER THE PAGE: ' + pageTitle(want), 'NOT NOW'] });
      else if (!UI.pages.length) { const k = (S.bark[id] | 0) % Math.max(1, n.barks.length); S.bark[id] = (S.bark[id] | 0) + 1; UI.pages.push({ sp: n.name, t: n.barks[k] || '...' }); }
    }
    SFX.play(n.sfx, 0.35); openUI('talk', 'hub');
  }
  M20.openTalk = openTalk;
  function finishBeat() {
    const S = sv(), b = UI.beat, id = UI.npc, n = NPC[id]; if (!b || UI.replay) return;
    if (!S.beats[b.id]) S.beats[b.id] = { t: Date.now(), ch: UI.choice === undefined ? null : UI.choice };
    S.tp[id] = (S.tp[id] | 0) + 1; HUB.talked[id] = true;
    if (b.id === 'K8' && UI.choice !== undefined) S.flags.banner = UI.choice ? 'burn' : 'keep';
    if (b.rank && (S.rank[id] | 0) < b.rank) { S.rank[id] = b.rank; UI.rankUp = { n, r: b.rank }; }
    write();
  }
  function talkInput(rdt) {
    UI.t += rdt; const pg = UI.pages[UI.p]; if (!pg) { closeUI(); return; }
    const full = (pg.t || '').length, shown = UI.t * 42;
    if (pg.choice) {
      if (K_UP() || K_DN()) { UI.sel = 1 - UI.sel; SFX.play('clink', 0.25); }
      if (K_OK() && UI.t > 0.15) {
        if (pg.offer) { if (UI.sel === 0) giveRem(UI.npc, pg.offer); else { closeUI(); } return; }
        UI.choice = UI.sel; const b = UI.beat; const n = NPC[UI.npc];
        const more = (UI.sel ? b.reply.rb : b.reply.ra).map(t => ({ sp: n.name, t: fill(t) }));
        UI.pages.splice(UI.p + 1, 0, ...more); UI.p++; UI.t = 0; SFX.play('swing', 0.2);
      }
      if (K_BACK()) closeTalk();
      return;
    }
    if (K_Y() && UI.t > 0.2 && M20.lorebook) { closeTalk(); openBook('SPIRITS', 'hub', UI.npc, true); return; }
    if (K_BACK()) { if (shown < full) UI.t = full / 42 + 0.01; else closeTalk(); return; }
    if (K_OK()) {
      if (shown < full) UI.t = full / 42 + 0.01;
      else if (UI.p < UI.pages.length - 1) { UI.p++; UI.t = 0; SFX.play('swing', 0.2); }
      else closeTalk();
    }
  }
  function closeTalk() {
    // skipping still counts as hearing the beat (the journal keeps every line)
    if (UI.beat && !UI.replay) { const b = UI.beat; if (b.reply && UI.choice === undefined) UI.choice = null; finishBeat(); }
    const ru = UI.rankUp; UI.rankUp = null; UI.choice = undefined;
    closeUI();
    if (ru) { G.bigText = { t1: ru.n.name.replace(/^(BROTHER|SAINT) /, '') + ': RANK ' + ROM[ru.r], t2: rankLine(ru.n.id, ru.r), t: 0, dur: 3.2 }; SFX.play('secret', 0.7); SFX.play('toll', 0.4); }
    if (HUB.arrival === UI.npc) HUB.arrival = null;
    HUB.vigilReady = vigilReady();
    if (HUB.vigilReady && !sv().flags.vigilCall) { sv().flags.vigilCall = 1; toast('BROTHER WICK', 'It\'s time, I think. Come to the altar.', '#ffd890', 4); write(); }
  }
  function rankLine(id, r) { const L = { wick: ['', 'The common shelf opens', 'The second shelf opens', 'The whole Ledger is yours'], auberon: ['', 'Blessings of the bloodline, tier I', 'Blessings, tier II', 'Blessings, tier III'], brannoch: ['', 'The forge reopens', 'The second rack opens', 'The masterworks open', 'Full appraisal'], cecily: ['', 'The Iron Oath', 'The Shattered Halo', 'The Last Rites'], isolde: ['', 'Occult relics', 'The Lich King\'s Ring'], ozmeth: ['', 'Infernal relics', 'The Emberbrand start'], ansel: ['', 'Omens: secret rooms', 'Omens: sigils', 'Omens: the old pages'], baron: ['', '', '', '', ''] }; return (L[id] && L[id][r]) || 'Rank raised'; }
  function giveRem(id, pid) {
    const S = sv(), n = NPC[id]; S.rem[id + ':' + pid] = Date.now(); S.tp[id] = (S.tp[id] | 0) + 2; write();
    UI.pages = n.rem[pid].lines.map(t => ({ sp: n.name, t })); UI.p = 0; UI.t = 0; UI.beat = null; SFX.play('glint', 0.6);
  }
  // lore pages: existing ones (SAVE.m9.lore) and the floors' pages (SAVE.m20.pg)
  const pageHave = pid => !!((SAVE.m9 && SAVE.m9.lore && SAVE.m9.lore[pid]) || sv().pg[pid]);
  const allPages = () => (window.M9 && M9.LORE ? M9.LORE.map(l => ({ id: l[0], title: l[1], text: l[2] })) : []).concat(M20.FLOORPAGES || []);
  const pageTitle = pid => { const p = allPages().find(q => q.id === pid); return p ? p.title : pid.toUpperCase(); };
  M20.pageHave = pageHave; M20.allPages = allPages;
  // ---- drawing helpers ----
  const portrait = (ctx, id, x, y, w, h, sil) => {
    const im = Engine.imgs['s_m20_' + id]; if (!im || !im.width) return;
    const sh = Math.round(im.height * 0.46), sc = Math.min(w / im.width, h / sh), dw = im.width * sc, dh = sh * sc;
    ctx.save(); ctx.imageSmoothingEnabled = false;
    if (sil) { const c = document.createElement('canvas'); c.width = im.width; c.height = sh; const g = c.getContext('2d'); g.drawImage(im, 0, 0, im.width, sh, 0, 0, im.width, sh); g.globalCompositeOperation = 'source-in'; g.fillStyle = '#2a1838'; g.fillRect(0, 0, c.width, c.height); ctx.drawImage(c, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh); }
    else ctx.drawImage(im, 0, 0, im.width, sh, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
    ctx.restore();
  };
  const panel = (ctx, x, y, w, h) => { ctx.fillStyle = 'rgba(10,2,18,0.94)'; ctx.fillRect(x, y, w, h); ctx.strokeStyle = '#b08830'; ctx.lineWidth = 1; ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1); ctx.fillStyle = '#e0b850'; ctx.fillRect(x + 2, y + 2, w - 4, 1); ctx.fillRect(x + 2, y + h - 3, w - 4, 1); };
  const pips = (ctx, x, y, n, of, col) => { for (let i = 0; i < of; i++) { ctx.fillStyle = i < n ? col : '#3a2848'; ctx.fillRect(x + i * 6, y, 4, 5); } };
  function talkDraw(ctx) {
    const pg = UI.pages[UI.p] || { t: '' }, n = NPC[UI.npc];
    ctx.fillStyle = 'rgba(4,0,8,0.62)'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = 'rgba(4,0,8,0.85)'; ctx.fillRect(0, H - 30, W, 30);
    const bx = 22, by = H - 92, bw = W - 44, bh = 70;
    panel(ctx, bx, by, bw, bh);
    ctx.fillStyle = 'rgba(10,2,18,0.94)'; ctx.fillRect(bx, by - 86, 74, 86); ctx.strokeStyle = '#b08830'; ctx.strokeRect(bx + 0.5, by - 85.5, 73, 85);
    portrait(ctx, UI.npc, bx + 5, by - 82, 64, 78, false);
    text(ctx, n.name, bx + 82, by - 22, n.col, 'left'); text(ctx, n.title, bx + 82, by - 12, '#a89ab8', 'left', 0.75);
    const S = sv(); pips(ctx, bx + bw - 66, by - 14, Math.min(10, S.tp[UI.npc] | 0), 10, '#ffc860');
    if (pg.choice) {
      pg.choice.forEach((c, i) => { const on = i === UI.sel; if (on) { ctx.fillStyle = 'rgba(160,80,255,0.4)'; ctx.fillRect(bx + 10, by + 10 + i * 22, bw - 20, 18); } fitBlock(ctx, (on ? '> ' : '  ') + c, bx + 16, by + 15 + i * 22, bw - 32, 9, on ? '#ffe080' : '#d8c8f0', 'left'); });
    } else {
      const n2 = Math.floor(UI.t * 42), s = (pg.t || '').slice(0, n2);
      if (pg.act) text(ctx, '(' + pg.act + ')', bx + 10, by + 8, '#9a88b0', 'left', 0.75);
      fitBlock(ctx, s, bx + 10, by + (pg.act ? 20 : 12), bw - 20, 44, '#f0e0ff', 'left');
    }
    ctx.fillStyle = '#806090'; for (let i = 0; i < UI.pages.length; i++) { ctx.fillStyle = i === UI.p ? '#ffe080' : '#806090'; ctx.fillRect(bx + bw / 2 - UI.pages.length * 4 + i * 8, by + bh - 9, 5, 2); }
    if (G.inputMode === 'pad') promptRow(ctx, ['{cross}', pg.choice ? ' CHOOSE   ' : ' NEXT   ', '{circle}', ' SKIP   ', '{triangle}', ' JOURNAL'], W / 2, H - 14, '#a090b0', 'center');
    else text(ctx, (pg.choice ? 'UP/DOWN + ENTER choose' : 'ENTER next') + '    ESC skip    J journal', W / 2, H - 14, '#a090b0', 'center');
  }
  // ---------- LORE BOOK ----------
  const TABS = ['OVERVIEW', 'SPIRITS', 'BOSSES', 'PAGES'];
  const BOSSES = [
    ['vknight', 'THE VAMPIRE KNIGHT', 1, 'The first to kneel. Drank until he forgot the taste. Left the nave for me.'], ['spider', 'THE BROOD MOTHER', 2, 'Hungry. Lonely. Both are in the way.'],
    ['colossus', 'THE OSSUARY COLOSSUS', 3, 'Ten thousand who tried, wearing one will. Nine of them wore my name.'], ['alphawolf', 'THE BLOOD MOON ALPHA', 4, 'A man once. The moon turned him; I turned him back into a fur coat.'],
    ['m15sexton', 'SEXTON MORROW', 4, 'He dug the Order\'s graves, then ran out of Order and kept digging.'], ['matriarch', 'THE GARGOYLE MATRIARCH', 5, 'She sat on the bell so it couldn\'t ring. It rings now.'],
    ['minotaur', 'THE MINOTAUR', 6, 'The crowd wanted my head. The crowd was bones. I kept it.'], ['m15ferrum', 'LADY FERRUM', 6, 'Brannoch\'s first blade in a bad hand. She is gone and the blade is back on the rack.'],
    ['witch', 'MORWEN', 7, 'She wrote every name down. She promised herself she would never die. Isolde keeps the pen.'], ['cerberax', 'CERBERAX', 8, 'Once a lapdog. Chains were the only thing anyone gave him.'],
    ['uknight', 'SIR VALCOR', 9, 'He kept his oath four hundred years. I let him put it down.'], ['lich', 'THE LICH KING', 10, 'Osric. A king afraid of the plague. The crown was a cork.'],
    ['saint', 'THE HOLLOW SAINT', 0, 'He prayed until the silence answered. I let him stop.'], ['blackbaron', 'THE BLACK BARON', 11, 'The knight I was. He is kneeling in the Chapel. He is not gone. Neither am I.'],
    ['abyss5', 'THE ABYSS', 12, 'The bottle. The dark goes on.'],
  ];
  M20.BOSSES = BOSSES;
  const bossFelled = k => k === 'saint' ? ACHH('saint') : k === 'abyss5' ? ACHH('abyss5') : k === 'blackbaron' ? ACHH('m13_baron') : (ACHH('boss_' + k) || !!(sv().bk[k] && sv().bk[k].k));
  const bossSeen = k => bossFelled(k) || !!(sv().bk[k] && sv().bk[k].seen);
  function completion() {
    const S = sv(); let beats = 0, rems = 0, tb = 0, tr = 0;
    for (const id of ORDER) { tb += NPC[id].beats.length; tr += Object.keys(NPC[id].rem).length; for (const b of NPC[id].beats) if (S.beats[b.id]) beats++; for (const p in NPC[id].rem) if (S.rem[id + ':' + p]) rems++; }
    const sp = (beats + rems) / Math.max(1, tb + tr), bo = BOSSES.filter(b => bossFelled(b[0])).length / BOSSES.length;
    const pages = allPages(), pf = pages.length ? pages.filter(p => pageHave(p.id)).length / pages.length : 0;
    return { all: Math.round(100 * (sp + bo + pf) / 3), sp, bo, pf, beats, rems, tb, tr, pages: pages.length, found: pages.filter(p => pageHave(p.id)).length, bosses: BOSSES.filter(b => bossFelled(b[0])).length };
  }
  M20.completion = completion;
  function openBook(tab, from, npc, journal) {
    UI.tab = Math.max(0, TABS.indexOf(tab || 'OVERVIEW')); UI.sel = 0; UI.top = 0; UI.jr = null; UI.jsel = 0;
    if (npc) { UI.tab = 1; UI.sel = Math.max(0, ORDER.indexOf(npc)); if (journal) UI.jr = npc; }
    UI.bookFrom = from || 'hub'; openUI('book', from); SFX.play('glint', 0.5);
  }
  M20.openBook = openBook;
  function bookRows() {
    const t = TABS[UI.tab];
    if (t === 'SPIRITS') return ORDER.map(id => ({ id }));
    if (t === 'BOSSES') return BOSSES.map(b => ({ b }));
    if (t === 'PAGES') return allPages().map(p => ({ p }));
    return [];
  }
  function journalRows(id) {
    const S = sv(), n = NPC[id], out = [];
    for (const b of n.beats) { const h = S.beats[b.id]; out.push(h ? { id: b.id, t: (h.ch === 1 && b.reply && b.reply.sb) ? b.reply.sb : (h.ch === 0 && b.reply && b.reply.sa) ? b.reply.sa : b.syn, ok: true } : { id: b.id, t: '- not yet told -', ok: false }); }
    for (const p in n.rem) { const h = S.rem[id + ':' + p]; if (h) out.push({ id: p, rem: true, t: n.rem[p].syn, ok: true }); }
    return out;
  }
  function bookInput(rdt) {
    UI.t += rdt; const L = bookRows();
    if (UI.jr) {
      const J = journalRows(UI.jr);
      if (K_UP()) UI.jsel = (UI.jsel + J.length - 1) % J.length; if (K_DN()) UI.jsel = (UI.jsel + 1) % J.length;
      if (K_OK() && UI.t > 0.2) { const r = J[UI.jsel]; if (r && r.ok) { const back = { npc: UI.jr, jsel: UI.jsel, from: UI.bookFrom }; UI.from = 'book'; openTalk(UI.jr, r.id); UI.then = () => { openBook('SPIRITS', back.from, back.npc, true); UI.jsel = back.jsel; }; } }
      if (K_BACK() || K_L()) { UI.jr = null; SFX.play('clink', 0.2); }
      return;
    }
    if (K_L()) { UI.tab = (UI.tab + TABS.length - 1) % TABS.length; UI.sel = 0; UI.top = 0; SFX.play('clink', 0.25); }
    if (K_R() || K_Y()) { UI.tab = (UI.tab + 1) % TABS.length; UI.sel = 0; UI.top = 0; SFX.play('clink', 0.25); }
    if (L.length) {
      if (K_UP()) UI.sel = (UI.sel + L.length - 1) % L.length; if (K_DN()) UI.sel = (UI.sel + 1) % L.length;
      if (K_X()) { for (let k = 1; k <= L.length; k++) { const j = (UI.sel + k) % L.length, r = L[j]; if ((r.id && sv().met[r.id] && M20.nextBeat(r.id)) || (r.p && !pageHave(r.p.id))) { UI.sel = j; break; } } }
      if (K_OK() && UI.t > 0.2) { const r = L[UI.sel]; if (r.id && sv().met[r.id]) { UI.jr = r.id; UI.jsel = 0; SFX.play('glint', 0.4); } }
      if (UI.sel < UI.top) UI.top = UI.sel; if (UI.sel >= UI.top + 14) UI.top = UI.sel - 13;
    }
    if (K_BACK()) { closeUI(); if (UI.bookFrom === 'pause') G.paused = true; }
  }
  function bookDraw(ctx) {
    const PX = 20, PY = 8, PW = 440, PH = 254, C = completion();
    ctx.fillStyle = 'rgba(4,0,8,0.82)'; ctx.fillRect(0, 0, W, H); panel(ctx, PX, PY, PW, PH);
    text(ctx, 'THE BOOK OF THE UNYIELDING', PX + 10, PY + 8, '#ffe080', 'left'); text(ctx, 'CHRONICLE  ' + C.all + '%', PX + PW - 10, PY + 8, '#e0c0ff', 'right');
    TABS.forEach((t, i) => { const x = PX + 10 + i * 92, on = i === UI.tab; ctx.fillStyle = on ? 'rgba(160,80,255,0.45)' : 'rgba(60,30,90,0.4)'; ctx.fillRect(x, PY + 20, 86, 12); text(ctx, t, x + 43, PY + 22, on ? '#ffe080' : '#b8a8d0', 'center', 0.85); });
    const S = sv(), L = bookRows(), t = TABS[UI.tab], LY = PY + 40, LX = PX + 8, LW = 150, DX = PX + 166, DW = PW - 176;
    ctx.fillStyle = '#5a3a8a'; ctx.fillRect(DX - 6, LY, 1, PH - 60);
    if (t === 'OVERVIEW') {
      const cx = PX + 70, cy = LY + 10; ctx.fillStyle = '#3a2848'; ctx.fillRect(cx - 9, cy + 10, 18, 120); ctx.fillStyle = '#e8d8b0'; const hh = Math.round(120 * C.all / 100); ctx.fillRect(cx - 9, cy + 130 - hh, 18, hh);
      ctx.fillStyle = '#ffd060'; ctx.beginPath(); ctx.ellipse(cx, cy + 128 - hh - 6, 4, 8 + Math.sin(G.t * 6) * 1.5, 0, 0, 6.29); ctx.fill();
      text(ctx, C.all + '%', cx, cy + 140, '#ffe080', 'center');
      const bars = [['SPIRITS', C.sp, (C.beats + C.rems) + '/' + (C.tb + C.tr)], ['BOSSES', C.bo, C.bosses + '/' + BOSSES.length], ['PAGES', C.pf, C.found + '/' + C.pages]];
      bars.forEach(([n, f, s], i) => { const y = LY + 14 + i * 34; text(ctx, n, DX, y, '#d8c8f0', 'left'); text(ctx, s, DX + DW - 4, y, '#a898c0', 'right'); bar(ctx, DX, y + 11, DW - 4, 6, f, '#c090ff', '#ffe0ff', '#1a0a24'); });
      const unmet = ORDER.find(id => !S.met[id]); const nextPg = allPages().find(p => !pageHave(p.id));
      text(ctx, 'NEXT', DX, LY + 122, '#ffe080', 'left');
      fitBlock(ctx, unmet ? 'A spirit waits to be called: ' + (unmet === 'baron' ? NPC.baron.hint : NPC[unmet].hint) : nextPg ? 'An unread page: ' + (nextPg.hint || 'somewhere below.') : 'Every spirit has come home.', DX, LY + 134, DW - 4, 40, '#c8b8e0', 'left');
    } else {
      L.slice(UI.top, UI.top + 14).forEach((r, k) => {
        const i = UI.top + k, y = LY + k * 13, on = i === UI.sel;
        if (on) { ctx.fillStyle = 'rgba(160,80,255,0.35)'; ctx.fillRect(LX - 2, y - 2, LW, 12); }
        let label = '', col = on ? '#ffffff' : '#d8c8f0';
        if (r.id) { const met = S.met[r.id]; label = met ? NPC[r.id].name : '???'; if (!met) col = '#7a6890'; else if (M20.nextBeat(r.id)) label += ' *'; }
        else if (r.b) { const f = bossFelled(r.b[0]), se = bossSeen(r.b[0]); label = se ? r.b[1] : '???'; if (!se) col = '#7a6890'; else if (!f) col = '#c0a080'; }
        else if (r.p) { const h = pageHave(r.p.id); label = h ? r.p.title : '- unfound -'; if (!h) col = '#7a6890'; }
        fitBlock(ctx, label, LX, y, LW - 6, 9, col, 'left');
      });
      const r = L[UI.sel];
      if (r && r.id) {
        const n = NPC[r.id], met = S.met[r.id];
        ctx.fillStyle = '#140820'; ctx.fillRect(DX, LY, 64, 80); portrait(ctx, r.id, DX, LY, 64, 80, !met);
        text(ctx, met ? n.name : '???', DX + 72, LY + 2, met ? n.col : '#8070a0', 'left'); text(ctx, met ? n.title : 'Not yet come to the Chapel', DX + 72, LY + 13, '#a898c0', 'left', 0.75);
        if (met) { pips(ctx, DX + 72, LY + 26, Math.min(10, S.tp[r.id] | 0), 10, '#ffc860'); text(ctx, 'RANK ' + (ROM[rankOf(r.id)] || '-'), DX + 72, LY + 36, '#ffd890', 'left', 0.75); }
        if (UI.jr === r.id) {
          const J = journalRows(r.id); const top = Math.max(0, Math.min(UI.jsel - 3, J.length - 6));
          text(ctx, 'JOURNAL', DX, LY + 86, '#ffe080', 'left');
          J.slice(top, top + 6).forEach((j, k) => { const i = top + k, y = LY + 98 + k * 18, on = i === UI.jsel; if (on) { ctx.fillStyle = 'rgba(160,80,255,0.3)'; ctx.fillRect(DX - 2, y - 2, DW, 17); } text(ctx, j.rem ? 'R' : j.id, DX, y, j.ok ? '#c0a0ff' : '#5a4870', 'left', 0.7); fitBlock(ctx, j.t, DX + 22, y, DW - 26, 17, j.ok ? (on ? '#ffffff' : '#e0d0f0') : '#6a5880', 'left', 1, 8); });
        } else {
          const ids = Object.keys(M20.GATE).filter(k => M20.GATE[k][0] === r.id);
          fitBlock(ctx, met ? 'ARRIVED' + (ids.length ? '   OPENS: ' + ids.length + ' altar rows' + (r.id === 'auberon' ? ' + the Blessings' : '') : (r.id === 'ansel' ? '   OMENS at each stage start' : '')) : 'HOW TO MEET: ' + n.hint, DX, LY + 88, DW - 4, 20, '#c8b8e0', 'left');
          if (met) { const nb = M20.nextBeat(r.id); fitBlock(ctx, nb ? 'Something new to say. Go and talk.' : 'Nothing new yet. Keep descending.', DX, LY + 112, DW - 4, 20, nb ? '#ffd060' : '#8a7aa0', 'left'); text(ctx, G.inputMode === 'pad' ? 'CROSS: JOURNAL' : 'ENTER: JOURNAL', DX, LY + 140, '#a090b0', 'left', 0.8); }
        }
      } else if (r && r.b) {
        const [k, nm, st, note] = r.b, f = bossFelled(k), se = bossSeen(k), bk = S.bk[k];
        text(ctx, se ? nm : '???', DX, LY + 2, f ? '#ffe080' : '#a898c0', 'left');
        text(ctx, st === 0 ? 'Hidden in the dark' : st === 11 ? 'Under the throne' : st === 12 ? 'Below everything' : 'Stage ' + st, DX, LY + 14, '#a898c0', 'left', 0.75);
        if (f) { text(ctx, 'FELLED' + (bk && bk.k ? '  x' + bk.k : ''), DX, LY + 30, '#90ff90', 'left', 0.8); text(ctx, 'KAEL:', DX, LY + 46, '#ffd890', 'left', 0.8); fitBlock(ctx, '"' + note + '"', DX, LY + 58, DW - 4, 60, '#e8d8f0', 'left'); }
        else fitBlock(ctx, se ? 'Seen, not yet felled.' : 'Unknown. Descend further.', DX, LY + 34, DW - 4, 30, '#8a7aa0', 'left');
      } else if (r && r.p) {
        const h = pageHave(r.p.id); text(ctx, h ? r.p.title : '- unfound -', DX, LY + 2, h ? '#ffe080' : '#8070a0', 'left');
        fitBlock(ctx, h ? r.p.text : (r.p.hint || 'Somewhere in the descent.'), DX, LY + 18, DW - 4, 120, h ? '#e8d8f0' : '#8a7aa0', 'left');
        const who = ORDER.find(id => NPC[id].rem[r.p.id]); if (who && sv().met[who]) text(ctx, 'Ask ' + NPC[who].name.replace(/^(BROTHER|SAINT|THE) /, '') + ' about this page.', DX, LY + 150, '#ffc070', 'left', 0.75);
      }
    }
    if (G.inputMode === 'pad') promptRow(ctx, ['{dpad}', ' MOVE/TAB   ', '{cross}', ' OPEN   ', '{square}', ' NEXT NEW   ', '{circle}', ' BACK'], W / 2, PY + PH - 12, '#a090b0', 'center');
    else text(ctx, 'LEFT/RIGHT tab   UP/DOWN move   ENTER open   N next new   ESC back', W / 2, PY + PH - 12, '#a090b0', 'center', 0.8);
  }
  // ---------- THE VIGIL ----------
  const VIGIL_NEED = ['K7', 'I8', 'C7', 'O8', 'N8', 'A8', 'B8', 'W9'];
  function vigilReady() { const S = sv(); return !!(M20.vigil && !S.flags.vigil && S.met.baron && ACHH('m13_baron') && VIGIL_NEED.every(b => S.beats[b])); }
  M20.vigilReady = vigilReady;
  const VP = [
    { art: 'circle', lines: ['The eight spirits stand in a ring around the altar, all facing Kael.', '"For four hundred years the dead of the Chapel have waited for one man to get up."'] },
    { art: 'bell', lines: ['Cecily rings the Silent Bell. A single clean note.', 'The green-violet haze in the nave turns gold. "It\'s the right note."'] },
    { art: 'baron', lines: ['The Black Baron stands. Gold threads back into the black armour.', 'He holds the unburned banner out to Kael.'], choice: ['KEEP THE BANNER', 'BURN THE BANNER'] },
    { art: 'ledger', lines: ['Isolde sets the Ledger on the altar. It burns without smoke.', 'Ozmeth\'s chain drops off the cage and rings on the floor.'] },
    { art: 'candle', lines: ['The Chapel candle becomes a small, ordinary sun.', 'The spirits are no longer translucent at the edges.'] },
    { art: 'stair', lines: ['Kael looks at the iron door.', 'Under the throne, the dark goes on forever. The Unyielding does not rest.'] },
  ];
  function openVigil() { UI.vp = 0; UI.vsel = 0; UI.vchose = false; openUI('vigil', 'hub'); SFX.play('toll', 0.9); }
  M20.openVigil = openVigil;
  function vigilInput(rdt) {
    UI.t += rdt; const pn = VP[UI.vp], full = pn.lines.join(' ').length, shown = UI.t * 38;
    if (pn.choice && shown >= full && !UI.vchose) { if (K_UP() || K_DN()) UI.vsel = 1 - UI.vsel; if (K_OK()) { UI.vchose = true; sv().flags.banner = UI.vsel ? 'burn' : 'keep'; SFX.play(UI.vsel ? 'fire' : 'glint', 0.7); UI.t = full / 38 + 0.01; } return; }
    if (K_OK() || (K_BACK() && UI.t > 0.4)) {
      if (shown < full) UI.t = full / 38 + 0.01;
      else if (UI.vp < VP.length - 1) { UI.vp++; UI.t = 0; UI.vchose = false; SFX.play(UI.vp === 1 ? 'toll' : 'swing', 0.4); }
      else endVigil();
    }
  }
  function endVigil() {
    const S = sv(); S.flags.vigil = 1; S.flags.dawn = 1; if (!S.flags.banner) S.flags.banner = 'keep';
    if (!S.beats.K8) S.beats.K8 = { t: Date.now(), ch: S.flags.banner === 'burn' ? 1 : 0 };
    write(); try { if (window.ACH) ACH.unlock('m20_vigil'); } catch (e) { }
    closeUI(); dawn(); G.bigText = { t1: 'THE DAWN CHAPEL', t2: 'The candle burns steady now.', t: 0, dur: 3.6 }; SFX.play('secret', 0.9);
  }
  function dawn() { try { if (!inHub()) return; HAZE[0] = 150; HAZE[1] = 110; HAZE[2] = 70; if (typeof buildLUT === 'function') buildLUT({ sh: [0.14, 0.07, 0.0], hi: [0.16, 0.1, 0.03] }); if (LMb && LMr && dawn.lm !== LMb) { dawn.lm = LMb; for (let i = 0; i < LMb.length; i++) { LMb[i] *= 0.72; LMg[i] *= 0.95; LMr[i] = Math.min(LMr[i] * 1.08, 4); } } for (const s of (LEVEL.shafts || [])) s.c = [255, 210, 130]; } catch (e) { M20.fail('dawn', e); } }
  function vigilArt(ctx, art, t) {
    const g = ctx.createLinearGradient(0, 0, 0, 186), k = Math.min(1, t / 2.5);
    const gold = art === 'bell' || art === 'candle' || art === 'stair' || UI.vp >= 1;
    g.addColorStop(0, gold ? '#2a1408' : '#0a0418'); g.addColorStop(1, gold ? '#6a3a10' : '#241038'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, 186);
    // altar + candle
    ctx.fillStyle = '#1a0c10'; ctx.fillRect(W / 2 - 40, 120, 80, 30); ctx.fillStyle = '#3a2418'; ctx.fillRect(W / 2 - 44, 116, 88, 6);
    const cf = art === 'candle' ? 10 + 30 * k : 6; ctx.fillStyle = '#e8d8b0'; ctx.fillRect(W / 2 - 3, 98, 6, 18);
    const rg = ctx.createRadialGradient(W / 2, 92, 1, W / 2, 92, cf * 3); rg.addColorStop(0, 'rgba(255,240,170,1)'); rg.addColorStop(1, 'rgba(255,190,80,0)'); ctx.fillStyle = rg; ctx.fillRect(W / 2 - cf * 3, 92 - cf * 3, cf * 6, cf * 6);
    // the ring of spirits
    const ids = ORDER; ctx.imageSmoothingEnabled = false;
    ids.forEach((id, i) => {
      const im = Engine.imgs['s_m20_' + id]; if (!im || !im.width) return;
      const a = Math.PI * (0.08 + 0.84 * i / (ids.length - 1)), x = W / 2 - Math.cos(a) * 190, y = 150 - Math.sin(a) * 40;
      let h = 70 + Math.sin(a) * -10; if (id === 'baron' && art === 'baron') h *= 1.25;
      const w = h * im.width / im.height; ctx.globalAlpha = art === 'candle' || art === 'stair' ? 1 : 0.85; ctx.drawImage(im, x - w / 2, y - h, w, h); ctx.globalAlpha = 1;
      if (id === 'cecily' && art === 'bell') { ctx.strokeStyle = `rgba(255,230,150,${1 - (t % 1.2) / 1.2})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y - h * 0.8, 10 + (t % 1.2) * 60, 0, 6.29); ctx.stroke(); }
    });
    if (art === 'baron') { ctx.fillStyle = '#100608'; ctx.fillRect(W / 2 + 60, 40, 4, 80); ctx.fillStyle = UI.vchose && UI.vsel ? `rgba(255,120,40,${0.6 + 0.4 * Math.sin(t * 12)})` : '#1a0a0e'; ctx.fillRect(W / 2 + 64, 42, 34, 46); }
    if (art === 'ledger') { ctx.fillStyle = '#d8c890'; ctx.fillRect(W / 2 - 16, 108, 32, 8); ctx.fillStyle = `rgba(120,255,140,${0.5 + 0.3 * Math.sin(t * 8)})`; ctx.fillRect(W / 2 - 4, 96 - 6 * k, 8, 12); }
    if (art === 'stair') { ctx.fillStyle = '#05020a'; ctx.fillRect(W / 2 - 22, 40, 44, 76); ctx.fillStyle = '#ffe0a0'; ctx.fillRect(W / 2 - 22, 40, 44, 2); for (let i = 0; i < 6; i++) { ctx.fillStyle = `rgba(255,200,120,${0.12 * (6 - i) / 6})`; ctx.fillRect(W / 2 - 20 + i * 2, 50 + i * 10, 40 - i * 4, 6); } }
  }
  function vigilDraw(ctx) {
    const pn = VP[UI.vp]; ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.beginPath(); ctx.rect(20, 14, W - 40, 186); ctx.clip(); ctx.translate(0, 14); try { vigilArt(ctx, pn.art, UI.t); } catch (e) { M20.fail('vigil art', e); } ctx.restore();
    ctx.fillStyle = '#e0b850'; ctx.fillRect(20, 13, W - 40, 1); ctx.fillRect(20, 200, W - 40, 1);
    const k = Math.min(1, UI.t * 2); ctx.fillStyle = `rgba(0,0,0,${1 - k})`; ctx.fillRect(20, 14, W - 40, 186);
    let n = Math.floor(UI.t * 38), y = 208;
    for (const l of pn.lines) { const s = l.slice(0, Math.max(0, n)); n -= l.length + 1; const hh = s ? fitBlock(ctx, s, W / 2, y, W - 40, 18, '#f0e0ff', 'center') : 0; y += Math.max(11, hh + 3); }
    if (pn.choice && UI.t * 38 >= pn.lines.join(' ').length) pn.choice.forEach((c, i) => { const on = i === UI.vsel, chosen = UI.vchose && on; text(ctx, (on ? '> ' : '  ') + c + (chosen ? '  (chosen)' : ''), W / 2 - 60 + i * 0, 238 + i * 10, on ? '#ffe080' : '#a898c0', 'left', 0.85); });
    ctx.fillStyle = '#806090'; for (let i = 0; i < VP.length; i++) { ctx.fillStyle = i === UI.vp ? '#ffe080' : '#806090'; ctx.fillRect(W / 2 - VP.length * 5 + i * 10, 260, 6, 2); }
  }
  // ---------- OPT wiring ----------
  const _oi = OPT.input, _od = OPT.draw;
  OPT.input = function (rdt) {
    if (this.page !== 'm20') return _oi.apply(this, arguments);
    try { if (UI.kind === 'talk') talkInput(rdt); else if (UI.kind === 'book') bookInput(rdt); else if (UI.kind === 'vigil') vigilInput(rdt); else closeUI(); } catch (e) { M20.fail('npc ui input', e); closeUI(); }
    if (OPT.page === 'm20') { for (const k in KP) delete KP[k]; MBP[0] = false; }
  };
  OPT.draw = function (ctx) {
    if (this.page !== 'm20') return _od.apply(this, arguments);
    try { if (UI.kind === 'talk') talkDraw(ctx); else if (UI.kind === 'book') bookDraw(ctx); else if (UI.kind === 'vigil') vigilDraw(ctx); } catch (e) { M20.fail('npc ui draw', e); }
  };
  // the Dawn Chapel: a warm grade over the hub view (one fill, no per-pixel work)
  if (window.M8DRAW) M8DRAW.push(function (ctx) {
    try {
      if (!M20.vigil || !inHub() || !sv().flags.dawn || G.state !== 'play') return false;
      ctx.save(); const g = ctx.createLinearGradient(0, 0, 0, H * 0.6); g.addColorStop(0, 'rgba(255,220,150,0.12)'); g.addColorStop(1, 'rgba(255,220,150,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H * 0.6); ctx.restore();
      return true;
    } catch (e) { return false; }
  });
  // HUD: talk prompt over a spirit you face
  if (window.M8DRAW) M8DRAW.push(function (ctx) {
    try {
      if (!inHub() || G.state !== 'play' || (window.OPT && OPT.open) || !HUB.near) return false;
      const n = NPC[HUB.near.id]; const y = H - 78;
      ctx.save(); ctx.fillStyle = 'rgba(8,2,14,0.72)'; ctx.fillRect(W / 2 - 110, y - 4, 220, 24); ctx.restore();
      if (G.inputMode === 'pad') promptRow(ctx, ['{triangle}', ' TALK  -  ' + n.name], W / 2, y, n.col, 'center'); else text(ctx, 'ENTER  TALK  -  ' + n.name, W / 2, y, n.col, 'center');
      const mk = marker(HUB.near.id); text(ctx, mk === 'gold' ? 'Has something new to tell you' : mk === 'silver' ? 'Has a word about your last descent' : n.title, W / 2, y + 11, '#bdb4c8', 'center', 0.75);
      return true;
    } catch (e) { return false; }
  });
  // ---------- entry points: lectern, pause menu, title menu ----------
  if (M20.lorebook) {
    if (window.M9 && M9.openCodex) { const _oc = M9.openCodex; M9.openCodex = function (tab, from) { if (from === 'hub' && tab === 'LORE') { openBook('OVERVIEW', 'hub'); return; } return _oc.apply(this, arguments); }; }
    if (typeof PM_ITEMS !== 'undefined') { const i = PM_ITEMS.findIndex(q => q.id === 'codex'); PM_ITEMS.splice(i >= 0 ? i + 1 : PM_ITEMS.length - 1, 0, { id: 'lorebook', label: () => 'LORE BOOK  >' }); }
    if (typeof pmAct === 'function') { const _pm = pmAct; pmAct = function (id, dir) { if (id === 'lorebook') { if (!dir || dir > 0) openBook('OVERVIEW', 'pause'); return; } return _pm.apply(this, arguments); }; }
    const addTitle = () => { if (window.M12 && M12.MENU && !M12.MENU.some(m => m.id === 'lorebook')) { const i = M12.MENU.findIndex(m => m.id === 'codex'); M12.MENU.splice(i >= 0 ? i + 1 : 2, 0, { id: 'lorebook', l: 'LORE BOOK' }); const _a = M12.menuAct; M12.menuAct = function (id) { if (id === 'lorebook') { openBook('OVERVIEW', 'title'); return; } if (_a) return _a.apply(this, arguments); }; } };
    addTitle();
  }
  // ---------- Ansel's omens at stage start ----------
  const _ng = newGame;
  newGame = function () {
    const r = _ng.apply(this, arguments);
    try {
      const rk = rankOf('ansel');
      if (rk >= 1 && RUN.on && !RUN.hub && sv().met.ansel) {
        const n = (LEVEL.secrets || []).length; let msg = 'This place hides ' + n + ' secret room' + (n === 1 ? '' : 's') + '.';
        if (rk >= 2 && [3, 6, 9].includes(RUN.stage)) msg += ' A Sigil sleeps here.';
        if (rk >= 3 && M20.FL && RUN.floors) { const f = M20.FL.order.find(id => M20.FL.defs[id].stage === RUN.stage && RUN.floors.open.includes(id) && M20.FL.defs[id].lore); if (f) msg += ' The old page is on the ' + (M20.FL.defs[f].which === 'up' ? 'upper' : 'lower') + ' floor.'; }
        setTimeout(() => { try { if (G.state === 'play' && !RUN.hub) toast('ANSEL', msg, '#b8e8ff', 3.6); } catch (e) { } }, 5200);
      }
    } catch (e) { M20.fail('omen', e); }
    return r;
  };
  // ---------- feats ----------
  try { if (window.ACH && ACH.list) for (const [id, n, d] of [['m20_vigil', 'THE VIGIL', 'Keep the Vigil with the Chapel spirits.'], ['m20_warden', 'THE DAWN-WARDEN', 'Hear every story beat and every Remembrance.'], ['m20_chronicle', 'THE COMPLETE CHRONICLE', 'Fill the Lore Book to 100%.']]) if (!ACH.list.some(a => a.id === id)) ACH.list.push({ id, n, d }); } catch (e) { }
  if (window.M9 && M9.on) M9.on('tick', () => { try { if (!RUN.hub || (G.t % 2) > 0.02) return; const C = completion(); if (C.beats + C.rems >= C.tb + C.tr) ACH.unlock('m20_warden'); if (C.all >= 100) ACH.unlock('m20_chronicle'); } catch (e) { } });
  M20.npcDbg = () => ({ met: Object.keys(sv().met), beats: Object.keys(sv().beats).length, rank: sv().rank, vis: sv().vis, tags: HUB.tags, arrival: HUB.arrival, near: HUB.near, vigil: vigilReady(), comp: completion() });
})();
