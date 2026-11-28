// ===== m20l unlock-all TEST variant (t237u) =====
// ?unlockall=1  -> own localStorage NS tub_m20l_all: (never touches tub_m20l: or a bare tu_save)
// Seeds a complete-unlock save so every altar row, feat, lore page, floor, NPC and cosmetic is available.
// Blessings stay at 0 (balance/difficulty unchanged). Daily Descent stays off.
// Title gains START AT STAGE (1-10 + Abyss 1-5). Auto-opens every floor entrance in a run (like ?floorall=1).
// Kill switch: omit the flag, or ?unlockall=0.
(function () {
  const Q = location.search;
  const on = /[?&]unlockall=1/.test(Q) && !/[?&]unlockall=0/.test(Q);
  const NS = 'tub_m20l_all:';
  const M = window.M20LALL = { on: on, ns: on ? NS : null, seeded: 0, warp: 1, shards: 0, err: [] };
  const fail = (w, e) => { if (M.err.length < 12) M.err.push(w + ': ' + (e && e.message || e)); };
  if (!on) return;

  // ---------- storage namespace: must run BEFORE hub.js loadSave ----------
  // Public buddy builds already ran m20ipub, which picks tub_m20l_all: when this flag is set.
  // On the Mac there is no m20ipub, so we wrap here. Never prefix twice.
  try {
    if (!(window.M20IPUB && M20IPUB.ns === NS)) {
      const ls = window.localStorage;
      if (ls) {
        const P = Storage.prototype, g = P.getItem, s = P.setItem, r = P.removeItem;
        P.getItem = function (k) { return g.call(this, this === ls ? NS + k : k); };
        P.setItem = function (k, v) { return s.call(this, this === ls ? NS + k : k, v); };
        P.removeItem = function (k) { return r.call(this, this === ls ? NS + k : k); };
        window.M20IPUB = window.M20IPUB || { ns: NS };
        if (!window.M20IPUB.ns) window.M20IPUB.ns = NS;
      }
    }
    M.ns = (window.M20IPUB && M20IPUB.ns) || NS;
  } catch (e) { fail('ns', e); }

  const g = (n) => { try { return (typeof window[n] !== 'undefined' && window[n]) || new Function('return typeof '+n+'!=="undefined"? '+n+':null')(); } catch (e) { return null; } };
  function seed() {
    if (!window.SAVE) return false;
    try {
      const S = SAVE;
      const Altar = g('ALTAR'), Upg = g('UPG'), Items = g('ITEMS');
      S.unl = S.unl || {};
      S.upg = S.upg || { vit: 0, soul: 0, might: 0, fortune: 0 };
      S.load = S.load || { sword: 'base', whip: 'base', ranged: 'none' };
      S.best = S.best || { stage: 0, kills: 0, time: 0 };
      S.stats = S.stats || { runs: 0, kills: 0, elites: 0, bosses: 0, secrets: 0, shards: 0 };
      S.m9 = S.m9 || {};
      S.m9.ach = S.m9.ach || {};
      S.m9.lore = S.m9.lore || {};
      S.m9.trials = S.m9.trials || {};
      S.m9.m11arm = S.m9.m11arm || {};
      S.m20 = S.m20 || {};
      for (const k of ['met', 'beats', 'rank', 'tp', 'rem', 'bk', 'pg', 'flags', 'bark']) {
        if (!S.m20[k] || typeof S.m20[k] !== 'object') S.m20[k] = {};
      }

      // altar / pool / loadout ids (do not raise blessing tiers)
      const mark = id => { if (id) S.unl[id] = 1; };
      if (Altar && Altar.items) {
        for (const it of Altar.items) {
          if (it.up) continue;
          mark(it.id); mark(it.need);
        }
      }
      if (Upg) for (const u of Upg) mark(u.id);
      if (Items) for (const k of Object.keys(Items)) { const I = Items[k]; if (I && I.id) mark(I.id); }
      if (window.M20 && M20.FITEMS) for (const k of Object.keys(M20.FITEMS)) { const I = M20.FITEMS[k]; if (I && I.id) mark(I.id); }
      if (window.M20 && M20.LANTERN) mark(M20.LANTERN.id);

      // feats / achievements
      if (window.ACH && ACH.list) {
        const now = Date.now();
        for (const a of ACH.list) if (a && a.id && !S.m9.ach[a.id]) S.m9.ach[a.id] = now;
      }

      // lore (chapel pages + floor pages)
      if (window.M9 && M9.LORE) for (const L of M9.LORE) if (L && L[0]) S.m9.lore[L[0]] = 1;
      if (window.M20 && M20.FLOORPAGES) for (const p of M20.FLOORPAGES) if (p && p.id) { S.m9.lore[p.id] = 1; S.m20.pg[p.id] = 1; }

      // story flags (skip intro so testing starts at the menus; end / saint / abyss record)
      S.m9.introSeen = true;
      S.m9.endSeen = true;
      S.m9.saint = Math.max(S.m9.saint | 0, 1);
      S.m9.abyssBest = Math.max(S.m9.abyssBest | 0, 5);
      S.m9.fin = Math.max(S.m9.fin | 0, 25);
      S.m9.parries = Math.max(S.m9.parries | 0, 50);
      S.m9.bestCombo = Math.max(S.m9.bestCombo | 0, 30);

      // progress records (does not change in-run difficulty; used for NPC arrival / codex)
      S.best.stage = Math.max(S.best.stage | 0, 10);
      S.best.kills = Math.max(S.best.kills | 0, 500);
      S.best.time = Math.max(S.best.time | 0, 1);
      if (!S.best.win) S.best.win = 600;
      S.stats.runs = Math.max(S.stats.runs | 0, 12);
      S.stats.kills = Math.max(S.stats.kills | 0, 500);
      S.stats.elites = Math.max(S.stats.elites | 0, 25);
      S.stats.secrets = Math.max(S.stats.secrets | 0, 10);
      S.stats.bosses = Math.max(S.stats.bosses | 0, 14);
      S.stats.wins = Math.max(S.stats.wins | 0, 3);
      S.stats.shards = Math.max(S.stats.shards | 0, 1);

      // plenty of shards so remaining shop/lantern rows can still be bought if a flag was missed
      if ((S.shards | 0) < 9999) S.shards = 9999;
      M.shards = S.shards;

      // floors: lantern on, every floor seen/cleared, every blueprint + soul + page found
      try {
        const fl = (window.M20 && M20.FL && M20.FL.sv) ? M20.FL.sv() : (S.floors = S.floors || { v: 1, seen: {}, cleared: {}, lore: {}, bp: {}, souls: {}, lantern: 0 });
        fl.lantern = 1;
        const ids = (M20.FL && M20.FL.order) || [];
        for (const id of ids) { fl.seen[id] = 1; fl.cleared[id] = 1; }
        const bpKeys = [];
        if (window.M20 && M20.FITEMS) for (const k of Object.keys(M20.FITEMS)) bpKeys.push(k);
        if (window.ITEMS) for (const k of Object.keys(ITEMS)) if (!bpKeys.includes(k)) bpKeys.push(k);
        for (const k of ['censer', 'trident', 'halberd', 'seal', 'spade', 'maul', 'nettrident', 'forgehammer']) if (!bpKeys.includes(k)) bpKeys.push(k);
        for (const k of bpKeys) fl.bp[k] = Math.max(fl.bp[k] | 0, 1);
        if (window.M20 && M20.FLOORPAGES) for (const p of M20.FLOORPAGES) if (p && p.id) fl.lore[p.id] = 1;
        // six freed souls — mark any known ids plus a generous range
        const soulIds = new Set(Object.keys(fl.souls || {}));
        if (window.M20 && M20.SOULS) for (const k of Object.keys(M20.SOULS)) soulIds.add(k);
        ['s1', 's2', 's3', 's4', 's5', 's6', 's1u', 's1d', 's4u', 's4d', 's9u', 's9d'].forEach(k => soulIds.add(k));
        for (const k of soulIds) fl.souls[k] = fl.souls[k] || Date.now();
      } catch (e) { fail('floors', e); }

      // every floor entrance opens in a run (same as ?floorall=1)
      try { if (window.M20) M20.floorall = true; } catch (e) { fail('floorall', e); }

      // NPCs present, ranks maxed, beats heard, remembrances offered, boss journal filled
      try {
        if (window.M20 && M20.NPC) {
          const N = M20.NPC;
          for (const id of Object.keys(N)) {
            const n = N[id];
            S.m20.met[id] = 1;
            let maxR = 0;
            if (n.beats) for (const b of n.beats) {
              if (b && b.id) S.m20.beats[b.id] = 1;
              if (b && b.rank > maxR) maxR = b.rank;
            }
            S.m20.rank[id] = Math.max(S.m20.rank[id] | 0, maxR || 3);
            if (n.rem) for (const pid of Object.keys(n.rem)) S.m20.rem[id + ':' + pid] = 1;
          }
        }
        S.m20.vis = Math.max(S.m20.vis | 0, 12);
        S.m20.goldtrim = 1;
        S.m20.bcrypt = S.m20.bcrypt || Date.now();
        S.m20.flags = S.m20.flags || {};
        S.m20.flags.vigil = 1;
        S.m20.flags.dawn = 1;
        const bosses = ['vknight', 'spider', 'colossus', 'alphawolf', 'matriarch', 'minotaur', 'witch', 'cerberax', 'uknight', 'lich', 'saint', 'blackbaron', 'm15sexton', 'm15ferrum', 'abyss5'];
        if (window.M20 && M20.BOSSES) for (const b of M20.BOSSES) if (b && b[0]) bosses.push(b[0]);
        if (window.M20 && M20.FL && M20.FL.defs) {
          for (const id of Object.keys(M20.FL.defs)) {
            const d = M20.FL.defs[id];
            if (d && d.boss) bosses.push(d.boss);
          }
        }
        for (const k of bosses) {
          S.m20.bk[k] = Object.assign({ seen: 1, k: 1 }, S.m20.bk[k] || {});
        }
      } catch (e) { fail('npc', e); }

      // codex "found" flags for weapons / build relics
      try {
        const arm = S.m9.m11arm;
        if (window.M11 && M11.ARM) for (const r of M11.ARM) if (r && r.id) arm[r.id] = 1;
        if (window.M13 && M13.RELICS) for (const r of M13.RELICS) if (r && r.id) arm[r.id] = 1;
        if (window.UPG) for (const u of UPG) if (u && u.id) arm[u.id] = 1;
      } catch (e) { fail('arm', e); }

      const ws = g('writeSave'); if (typeof ws === 'function') ws();
      M.seeded = 1;
      return true;
    } catch (e) { fail('seed', e); return false; }
  }

  function stamp(ctx) {
    try {
      if (!ctx || typeof text !== 'function') return;
      // inset so the gold title-trim corners cannot cover the words
      const x = 18, y = 14, label = 'TEST BUILD: ALL UNLOCKED';
      if (ctx.fillRect) { ctx.save(); ctx.globalAlpha = 0.82; ctx.fillStyle = '#14081c'; ctx.fillRect(x - 4, y - 3, 172, 11); ctx.restore(); }
      text(ctx, label, x, y, '#80ffb0', 'left');
    } catch (e) { }
  }

  function hookDraw() {
    try {
      if (typeof drawTitle === 'function' && !drawTitle._m20lall) {
        const _dt = drawTitle;
        drawTitle = function (ctx) { const r = _dt.apply(this, arguments); stamp(ctx); return r; };
        drawTitle._m20lall = 1;
      }
      if (typeof drawHUD === 'function' && !drawHUD._m20lall) {
        const _dh = drawHUD;
        drawHUD = function (ctx, cam, rdt) { const r = _dh.apply(this, arguments); stamp(ctx); return r; };
        drawHUD._m20lall = 1;
      }
    } catch (e) { fail('draw', e); }
  }

  function hookWarp() {
    try {
      if (!window.M12 || !M12.MENU || M12.MENU.some(m => m && m.id === 'warp')) return;
      const i = M12.MENU.findIndex(m => m && m.id === 'play');
      M12.MENU.splice(i >= 0 ? i + 1 : 1, 0, { id: 'warp', l: 'START AT STAGE 1' });
      const lab = () => {
        const n = M.warp | 0;
        return n <= 10 ? ('START AT STAGE ' + n) : ('START AT ABYSS ' + (n - 10));
      };
      const sync = () => { const r = M12.MENU.find(m => m && m.id === 'warp'); if (r) r.l = lab(); };
      const _act = M12.menuAct;
      M12.menuAct = function (id) {
        if (id === 'warp') { startWarp(M.warp | 0); return true; }
        if (_act) return _act.apply(this, arguments);
      };
      if (typeof frameInner === 'function' && !frameInner._m20lallW) {
        const _fi = frameInner;
        frameInner = function (now) {
          try {
            if (typeof G !== 'undefined' && G.state === 'title' && !(window.OPT && OPT.open) && M12.MENU && M12.TM) {
              const row = M12.MENU[M12.TM.sel];
              if (row && row.id === 'warp' && (KP.ArrowLeft || KP.ArrowRight || KP.KeyA || KP.KeyD)) {
                const d = (KP.ArrowLeft || KP.KeyA) ? -1 : 1;
                M.warp = ((M.warp - 1 + d + 15) % 15) + 1;
                sync();
                try { SFX.play('clink', 0.3); } catch (e) { }
                for (const k of ['ArrowLeft', 'ArrowRight', 'KeyA', 'KeyD']) delete KP[k];
              }
            }
            sync();
          } catch (e) { }
          return _fi.apply(this, arguments);
        };
        frameInner._m20lallW = 1;
      }
      sync();
    } catch (e) { fail('warp', e); }
  }

  function startWarp(n) {
    try {
      if (typeof SFX !== 'undefined' && SFX.init) SFX.init();
      n = Math.max(1, Math.min(15, n | 0));
      if (typeof newRun === 'function') newRun();
      if (n > 1) {
        RUN.stage = n - 1;
        if (n > 10) RUN.won = true;
        if (typeof nextStage === 'function') nextStage();
      }
    } catch (e) { fail('start', e); }
  }

  M.seed = seed;
  M.startWarp = startWarp;
  M.st = () => ({
    on: M.on, ns: M.ns, seeded: M.seeded, warp: M.warp, shards: window.SAVE ? SAVE.shards : M.shards,
    unl: window.SAVE ? Object.keys(SAVE.unl || {}).length : 0,
    ach: window.SAVE && SAVE.m9 ? Object.keys(SAVE.m9.ach || {}).length : 0,
    lore: window.SAVE && SAVE.m9 ? Object.keys(SAVE.m9.lore || {}).length : 0,
    best: window.SAVE && SAVE.best ? SAVE.best.stage : 0,
    intro: !!(window.SAVE && SAVE.m9 && SAVE.m9.introSeen),
    lantern: !!(window.SAVE && SAVE.floors && SAVE.floors.lantern),
    goldtrim: !!(window.SAVE && SAVE.m20 && SAVE.m20.goldtrim),
    met: window.SAVE && SAVE.m20 ? Object.keys(SAVE.m20.met || {}).length : 0,
    floorall: !!(window.M20 && M20.floorall),
    upg: window.SAVE ? SAVE.upg : null,
    err: M.err.slice()
  });

  function boot() {
    seed();
    hookDraw();
    hookWarp();
    // late modules may add altar rows / feats / pages after the first pass
    setTimeout(() => { seed(); hookDraw(); hookWarp(); }, 0);
    setTimeout(() => { seed(); hookDraw(); hookWarp(); }, 250);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else setTimeout(boot, 0);
})();
