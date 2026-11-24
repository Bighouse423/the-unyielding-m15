// ===== m15nt (m15c): training removed =====
// The m12e training corridor (title entry TRAINING, the "FIRST DESCENT?" prompt on the first NEW RUN, and the in-run
// lesson overlay with its "SELECT skip training" line) is hidden from the player. m12e.js is left in place; this module
// only switches it off, so ?notrain=0 restores m15b behaviour exactly. Saves: the m12tut flag is neither read nor written;
// training never wrote run saves, so any save loads into normal play.
(function () {
  const NT = window.M15NT = { on: false, err: null, removed: 0, blocked: 0 };
  if (/[?&]notrain=0/.test(location.search)) return;
  const M12 = window.M12; if (!M12 || !M12.on) return;
  NT.on = true;
  try {
    // 1) title menu: drop the TRAINING entry (menu actions are by id, so indexes just shift; clamp the focus)
    if (M12.MENU) for (let i = M12.MENU.length - 1; i >= 0; i--) if (M12.MENU[i].id === 'tut') { M12.MENU.splice(i, 1); NT.removed++; }
    if (M12.TM && M12.MENU) M12.TM.sel = Math.max(0, Math.min(M12.TM.sel | 0, M12.MENU.length - 1));
    const T = M12.T;
    // 2) NEW RUN: never raise the first-run training prompt
    if (typeof M12.onPlay === 'function') {
      const prev = M12.onPlay;
      M12.onPlay = function () {
        const was = !!(T && T.prompt); const r = prev.apply(this, arguments);
        if (T && !was && T.prompt) { T.prompt = false; NT.blocked++; return false; }
        return r;
      };
    }
    // 3) no way in: menu action and direct start are no-ops
    if (typeof M12.menuAct === 'function') { const pa = M12.menuAct; M12.menuAct = function (id) { if (id === 'tut') { NT.blocked++; return; } return pa.apply(this, arguments); }; }
    NT.startTraining = M12.startTraining;
    M12.startTraining = function () { NT.blocked++; };
    // 4) safety: if anything left a prompt or a lesson flagged, clear it and carry on with normal play
    const _fi = frameInner;
    frameInner = function (now) {
      try {
        if (T && T.prompt) { T.prompt = false; NT.blocked++; }
        if (T && T.on) { T.on = false; T.done = false; if (T.dummy) { T.dummy.alive = false; T.dummy = null; } NT.blocked++; }
      } catch (e) { NT.err = String(e && e.stack || e); }
      return _fi.apply(this, arguments);
    };
  } catch (e) { NT.err = String(e && e.stack || e); }
})();
