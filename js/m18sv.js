// ===== m18sv: mid-run save at stage transitions / Chapel, Save & Quit to Title, Continue on the title.
// Additive key SAVE.run only. ?runsave=0 or ?m18=0
(function () {
  if (!window.M18 || !M18.runsave) return;
  if (typeof SAVE === 'undefined') return;
  const S18 = M18.runsaveState = { on: true, last: 0 };

  function snapP() {
    if (typeof P === 'undefined') return null;
    const keys = ['hp','maxhp','mana','maxmana','x','y','z','ang','hasPistol','hasEdge','hasWhip'];
    const o = {};
    for (const k of keys) if (P[k] !== undefined) o[k] = P[k];
    o.wpn = P.wpn ? JSON.parse(JSON.stringify(P.wpn)) : null;
    o.mods = P.mods ? JSON.parse(JSON.stringify(P.mods)) : null;
    if (P.vials != null) o.vials = P.vials;
    if (P.ammo != null) o.ammo = P.ammo;
    return o;
  }
  function snapRun() {
    const r = {};
    const keys = ['seed','stage','hub','shardsRun','picks','kills','elites','time','secrets','bosses','banked',
      'm13sig','m13sanct','m13alt','m13eclipse','m12daily','m12mode','mode','abyss','cfgDepth'];
    for (const k of keys) if (RUN[k] !== undefined) r[k] = (RUN[k] && typeof RUN[k] === 'object') ? JSON.parse(JSON.stringify(RUN[k])) : RUN[k];
    if (RUN.cfg) r.cfg = { theme: RUN.cfg.theme, boss: RUN.cfg.boss, abyss: RUN.cfg.abyss, endless: RUN.cfg.endless, n: RUN.cfg.n, hp: RUN.cfg.hp, dmg: RUN.cfg.dmg, spd: RUN.cfg.spd };
    r.modeId = (window.M12 && M12.mode && M12.mode() && M12.mode().id) || RUN.modeId || 'baron';
    return r;
  }
  function snapshot(why) {
    try {
      if (!RUN || !RUN.on) return;
      SAVE.run = { v: 1, why: why || 'auto', t: Date.now(), hub: !!RUN.hub, stage: RUN.stage | 0, run: snapRun(), p: snapP() };
      if (typeof writeSave === 'function') writeSave();
      S18.last = Date.now(); S18.why = why;
    } catch (e) { M18.err = M18.err || ('runsave ' + e); }
  }
  function clearRun(why) {
    if (SAVE.run) { delete SAVE.run; if (typeof writeSave === 'function') writeSave(); }
    S18.cleared = why || 'clear';
  }
  function valid(s) {
    return s && s.v === 1 && s.run && (s.stage >= 1) && s.p;
  }

  function applyP(p) {
    if (!p || typeof P === 'undefined') return;
    for (const k of ['hp','maxhp','mana','maxmana','hasPistol','hasEdge','hasWhip','vials','ammo']) if (p[k] !== undefined) P[k] = p[k];
    if (p.wpn) P.wpn = JSON.parse(JSON.stringify(p.wpn));
    if (p.mods) P.mods = JSON.parse(JSON.stringify(p.mods));
    if (SAVE.run && SAVE.run.hub) return;
    // stage resume: sit at the spawn; don't teleport into a rebuilt fight mid-room
  }

  function resume() {
    const s = SAVE.run; if (!valid(s)) return false;
    try {
      const r = s.run;
      RUN.on = true;
      for (const k of Object.keys(r)) if (k !== 'cfg') RUN[k] = (r[k] && typeof r[k] === 'object') ? JSON.parse(JSON.stringify(r[k])) : r[k];
      RUN.cfg = (typeof stageCfg === 'function') ? stageCfg(RUN.stage) : RUN.cfg;
      if (r.cfg) Object.assign(RUN.cfg, r.cfg);
      if (s.hub && typeof enterHub === 'function') {
        RUN.hub = true;
        enterHub();
        applyP(s.p);
        if (s.p && s.p.hp != null) P.hp = s.p.hp;
        return true;
      }
      RUN.hub = false;
      if (typeof G !== 'undefined') { G.state = 'play'; G.paused = false; G.fade = 1; }
      if (typeof newGame === 'function') newGame();
      else if (typeof buildStage === 'function') buildStage();
      applyP(s.p);
      if (s.p && s.p.hp != null) P.hp = s.p.hp;
      snapshot('resume');
      if (typeof toast === 'function') toast('RUN RESTORED', 'Stage ' + RUN.stage, '#ffe080', 2.4);
      return true;
    } catch (e) { M18.err = M18.err || ('resume ' + e); return false; }
  }

  // auto-save at stage transitions and chapel entry
  if (typeof nextStage === 'function') { const _ns = nextStage; nextStage = function () { const r = _ns.apply(this, arguments); try { snapshot('stage'); } catch (e) {} return r; }; }
  if (typeof leaveHubForRun === 'function') { const _lh = leaveHubForRun; leaveHubForRun = function () { const r = _lh.apply(this, arguments); try { snapshot('descend'); } catch (e) {} return r; }; }
  if (typeof enterHub === 'function') { const _eh = enterHub; enterHub = function () { const r = _eh.apply(this, arguments); try { if (RUN && RUN.on) snapshot('chapel'); } catch (e) {} return r; }; }

  // death / new run / victory clear the suspended run
  if (typeof playerDie === 'function') { const _pd = playerDie; playerDie = function () { const r = _pd.apply(this, arguments); try { clearRun('death'); } catch (e) {} return r; }; }
  if (typeof newRun === 'function') { const _nr = newRun; newRun = function () { try { clearRun('new'); } catch (e) {} return _nr.apply(this, arguments); }; }
  if (typeof startWin === 'function') { const _sw = startWin; startWin = function () { try { clearRun('win'); } catch (e) {} return _sw.apply(this, arguments); }; }
  if (typeof startResults === 'function') { const _sr = startResults; startResults = function () { try { if (!SAVE.run || SAVE.run.why !== 'quit') clearRun('results'); } catch (e) {} return _sr.apply(this, arguments); }; }

  // pause item
  function saveQuit() {
    snapshot('quit');
    G.paused = false;
    if (typeof G !== 'undefined') { G.state = 'title'; G.fade = 1; }
    if (document.exitPointerLock) document.exitPointerLock();
    syncMenu();
  }
  if (typeof PM_ITEMS !== 'undefined') {
    if (!PM_ITEMS.some(i => i.id === 'savequit')) {
      const i = PM_ITEMS.findIndex(it => it.id === 'restart');
      PM_ITEMS.splice(i >= 0 ? i + 1 : 2, 0, { id: 'savequit', label: () => 'SAVE & QUIT TO TITLE' });
    }
  }
  if (typeof pmAct === 'function') {
    const _pm = pmAct;
    pmAct = function (id, dir) {
      if (id === 'savequit') { if (!dir && RUN && RUN.on) saveQuit(); return; }
      if (id === 'restart') { try { clearRun('abandon'); } catch (e) {} }
      return _pm.apply(this, arguments);
    };
  }

  function syncMenu() {
    const MENU = window.M12 && M12.MENU; if (!MENU) return;
    const has = !!valid(SAVE.run);
    const idx = MENU.findIndex(m => m.id === 'cont');
    if (has && idx < 0) {
      const p = MENU.findIndex(m => m.id === 'play');
      MENU.splice(p >= 0 ? p + 1 : 1, 0, { id: 'cont', l: 'CONTINUE' });
      if (M12.TM) { M12.TM.y0 = 146; M12.TM.rh = 11; }
    } else if (!has && idx >= 0) {
      MENU.splice(idx, 1);
      if (M12.TM) { M12.TM.y0 = 150; M12.TM.rh = 12; }
    }
  }
  if (window.M12) {
    const _act = M12.menuAct;
    M12.menuAct = function (id) {
      if (id === 'cont') { if (resume()) return true; }
      if (_act) return _act.apply(this, arguments);
    };
  }
  // keep the Continue row in sync
  const tick = () => { try { syncMenu(); } catch (e) {} };
  addEventListener('focus', tick);
  setInterval(tick, 800);
  tick();

  S18.snapshot = snapshot;
  S18.clear = clearRun;
  S18.resume = resume;
  S18.valid = valid;
})();
