// m12g: (1) SAVE SLOTS - three progression slots. The live m11 keys (tu_save / tu_best / tu_m12_hist) always hold the
// ACTIVE slot, so an existing m11 save simply is slot 1 and the game code is untouched; other slots park in tu_m12_s<N>.
// Switching reloads the page so every module reads the new slot from scratch. Settings / pad / tips stay global.
// (2) ACHIEVEMENTS - the 30 Feats mapped 1:1 to platform achievement API names, pushed through a Steamworks-ready
// bridge (window.M12DESKTOP.steam, provided by the Electron wrapper when a Steam client lib is present; a no-op otherwise).
// (3) Pad / Deck prompts on the m12 screens. ?m12=0 never runs this.
(function () {
  if (!window.M12 || !M12.on) return;
  const G9 = M12.G = { slots: false, sel: 0, confirm: -1, msg: '', msgT: 0 };
  const LIVE = ['tu_save', 'tu_best', 'tu_m12_hist'], NS = 3;
  const ls = { get: k => { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) { } }, del: k => { try { localStorage.removeItem(k); } catch (e) { } } };
  const active = () => Math.min(NS, Math.max(1, +(ls.get('tu_m12_slot') || 1) | 0));
  M12.slot = active;
  const pack = () => { const o = {}; for (const k of LIVE) { const v = ls.get(k); if (v != null) o[k] = v; } return o; };
  const unpack = o => { for (const k of LIVE) { if (o && o[k] != null) ls.set(k, o[k]); else ls.del(k); } };
  const parked = n => { try { return JSON.parse(ls.get('tu_m12_s' + n) || 'null'); } catch (e) { return null; } };
  function summary(n) {
    let s = null;
    if (n === active()) s = window.SAVE; else { const p = parked(n); try { s = p && p.tu_save ? JSON.parse(p.tu_save) : null; } catch (e) { s = null; } }
    if (!s || !s.stats || !(s.stats.runs > 0 || s.shards > 0)) return null;
    const ach = s.m9 && s.m9.ach ? Object.keys(s.m9.ach).length : 0;
    return { runs: s.stats.runs | 0, wins: s.stats.wins | 0, best: (s.best && s.best.stage) | 0, shards: s.shards | 0, ach };
  }
  M12.slotSummary = summary;
  M12.switchSlot = function (n) {
    const cur = active(); if (n === cur) return false;
    try { if (typeof writeSave === 'function') writeSave(); } catch (e) { }
    ls.set('tu_m12_s' + cur, JSON.stringify(pack()));
    unpack(parked(n) || {}); ls.del('tu_m12_s' + n); ls.set('tu_m12_slot', String(n));
    if (ls.get('tu_m12_slot') !== String(n)) return false;      // storage unavailable - don't reload into a mess
    if (!M12.G.noReload) location.reload(); return true;
  };
  M12.eraseSlot = function (n) {
    if (n === active()) { unpack({}); if (!M12.G.noReload) location.reload(); }
    else ls.del('tu_m12_s' + n);
  };

  // ---------- 2) achievements -> platform bridge ----------
  const STEAM = M12.STEAM = { map: {}, sent: {}, log: [] };
  for (const a of (window.ACH ? ACH.list : [])) STEAM.map[a.id] = 'TU_' + a.id.toUpperCase();
  STEAM.push = function (id) {
    const api = STEAM.map[id]; if (!api || STEAM.sent[api]) return;
    STEAM.sent[api] = 1; STEAM.log.push(api);
    try { const b = window.M12DESKTOP && M12DESKTOP.steam; if (b && b.activate) b.activate(api); } catch (e) { }
  };
  if (window.M9 && M9.on) M9.on('ach', id => STEAM.push(id));
  // re-sync everything already earned (Steam ignores repeats) - covers feats earned in the browser build before the wrapper
  setTimeout(() => { try { for (const a of ACH.list) if (ACH.has(a.id)) STEAM.push(a.id); } catch (e) { } }, 1500);

  // ---------- 1) slot screen ----------
  if (M12.MENU && !M12.MENU.some(m => m.id === 'slot')) { const i = M12.MENU.findIndex(m => m.id === 'sets'); M12.MENU.splice(i >= 0 ? i : 1, 0, { id: 'slot', l: 'SAVE SLOT' }); }
  const pad = () => G.inputMode === 'pad';
  const _fi = frameInner;
  frameInner = function (now) {
    try {
      if (G9.msgT > 0) G9.msgT -= 1 / 60;
      if (G9.slots && G.state === 'title' && !(window.OPT && OPT.open)) {
        if (KP.ArrowUp || KP.KeyW) { G9.sel = (G9.sel + NS - 1) % NS; G9.confirm = -1; }
        if (KP.ArrowDown || KP.KeyS) { G9.sel = (G9.sel + 1) % NS; G9.confirm = -1; }
        if (KP.Escape || KP.PadBack || KP.Backspace) { G9.slots = false; G9.confirm = -1; }
        else if (KP.KeyX || KP.Delete || KP.PadX || KP.PadY) {
          if (!summary(G9.sel + 1)) { G9.msg = 'SLOT ' + (G9.sel + 1) + ' IS ALREADY EMPTY'; G9.msgT = 2; }
          else if (G9.confirm === G9.sel) { M12.eraseSlot(G9.sel + 1); G9.confirm = -1; G9.msg = 'SLOT ' + (G9.sel + 1) + ' ERASED'; G9.msgT = 2; }
          else { G9.confirm = G9.sel; }
        } else if (KP.Enter || KP.Space || KP.PadOK || KP.PadStart || MBP[0]) {
          if (G9.sel + 1 === active()) G9.slots = false;
          else if (!M12.switchSlot(G9.sel + 1)) { G9.msg = 'COULD NOT SWITCH (STORAGE BLOCKED)'; G9.msgT = 2.5; }
        }
        for (const k of ['Enter', 'Space', 'PadOK', 'PadStart', 'Escape', 'PadBack', 'PadX', 'PadY', 'KeyX', 'Delete', 'ArrowUp', 'ArrowDown', 'KeyW', 'KeyS', 'Backspace', 'ArrowLeft', 'ArrowRight', 'KeyA', 'KeyD']) delete KP[k]; MBP[0] = false;
        if (M12.TM) M12.TM.hide = true;
      } else if (G9.slots && G.state !== 'title') G9.slots = false;
      else if (M12.TM && M12.TM.hide && !G9.slots && !(M12.F && M12.F.hist)) M12.TM.hide = false;
    } catch (e) { M12.err = String(e); }
    return _fi.apply(this, arguments);
  };
  if (window.M8DRAW) M8DRAW.push(function (ctx) {
    if (!(G9.slots && G.state === 'title')) return false;
    ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = 'rgba(8,2,14,0.95)'; ctx.fillRect(70, 30, 340, 206); ctx.fillStyle = '#e0b850'; ctx.fillRect(70, 30, 340, 1); ctx.fillRect(70, 235, 340, 1);
    text(ctx, 'SAVE SLOTS', W / 2, 38, '#ffe080', 'center');
    const a = active();
    for (let i = 0; i < NS; i++) {
      const y = 60 + i * 50, on = i === G9.sel, s = summary(i + 1);
      ctx.fillStyle = on ? 'rgba(240,192,64,0.16)' : 'rgba(255,255,255,0.04)'; ctx.fillRect(84, y - 4, 312, 42);
      if (on) { ctx.fillStyle = '#f0c040'; ctx.fillRect(84, y - 4, 2, 42); }
      text(ctx, 'SLOT ' + (i + 1) + (i + 1 === a ? '  (ACTIVE)' : ''), 94, y, on ? '#ffe080' : '#d8c8f0');
      if (G9.confirm === i) text(ctx, (pad() ? 'PRESS Y AGAIN' : 'PRESS X AGAIN') + ' TO ERASE', 94, y + 14, '#ff7060');
      else if (s) { text(ctx, 'RUNS ' + s.runs + '   BEST ' + (s.wins ? 'VICTORY x' + s.wins : 'STAGE ' + s.best), 94, y + 14, '#c0b0d0'); text(ctx, 'SHARDS ' + s.shards + '   FEATS ' + s.ach + '/' + ((window.ACH && ACH.list.length) || 30), 94, y + 25, '#a090b0'); }
      else text(ctx, 'EMPTY - a fresh descent', 94, y + 14, '#807090');
    }
    if (G9.msgT > 0) text(ctx, G9.msg, W / 2, 210, '#ff9a80', 'center');
    if (pad()) promptRow(ctx, ['{cross}', ' LOAD    ', '{triangle}', ' ERASE    ', '{circle}', ' BACK'], W / 2, 222, '#a090b0', 'center');
    else text(ctx, 'ENTER load     X erase     ESC back', W / 2, 222, '#a090b0', 'center');
    return true;
  });
  const _act = M12.menuAct;
  M12.menuAct = function (id) { if (id === 'slot') { G9.slots = true; G9.sel = active() - 1; G9.confirm = -1; if (M12.TM) M12.TM.hide = true; return; } if (_act) _act(id); };
  // menu label shows the active slot
  const lab = M12.MENU && M12.MENU.find(m => m.id === 'slot'); if (lab) lab.l = 'SAVE SLOT ' + active();
  if (M12.TM) { M12.TM.rh = 10; M12.TM.y0 = 150; }
  M12.vg = 'm12g';
})();
