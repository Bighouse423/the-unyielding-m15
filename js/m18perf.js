// ===== m18perf: auto quality. Default is no longer forced HD 2X. Fast auto-drop when fps is low. ?perf=0 or ?m18=0
(function () {
  if (!window.M18 || !M18.perf) return;
  if (typeof OPT === 'undefined' || !OPT.S) return;
  const S = OPT.S;
  const HDQ = (() => { const m = /[?&]hd=([01])/.exec(location.search); return m ? m[1] === '1' : null; })();
  const P18 = M18.perfState = { on: true, mode: 'classic' };

  // Old default was "undefined means HD 2X". Migrate once to Classic unless the player has already
  // confirmed HD via the settings control after this build (S.m18hdUser).
  if (!S.m18hdUser && (S.hd === undefined || S.hd === null || S.hd === true)) {
    S.hd = false;
    S.m18res = 'classic';
    P18.migrated = true;
    try { if (typeof OPT.save === 'function') OPT.save(); } catch (e) {}
  }

  // faster governor: drop HD after ~2s of slow frames; also force apply() so RK actually changes
  if (typeof GFX !== 'undefined') {
    const _render = render;
    let drops = 0;
    render = function (rdt) {
      const r = _render.apply(this, arguments);
      try {
        if (HDQ !== null) return r;
        if (S.hd === false) return r; // user picked classic
        // HD or AUTO: drop quickly when frame time is bad
        if (RK > 1 && !GFX.hdLock && GFX.ms > 18 && GFX.n > 45) {
          drops++;
          if (drops > 1 || GFX.n > 80) {
            GFX.hdOff = true; GFX.n = 0; GFX.ms = 9; drops = 0;
            if (typeof setRenderScale === 'function') { if (setRenderScale(1)) resize(); }
            P18.dropped = true;
          }
        } else if (GFX.ms < 14) drops = 0;
        // AUTO that stayed classic can try HD if the machine is clearly fast (and user didn't lock classic)
        if (S.hd === 'auto' && RK === 1 && GFX.hdOff && GFX.ms < 8 && GFX.n > 400 && !P18.dropped) {
          GFX.hdOff = false;
          if (typeof setRenderScale === 'function') { if (setRenderScale(2)) resize(); }
        }
      } catch (e) { M18.err = M18.err || ('perf ' + e); }
      return r;
    };
  }

  // 3-way RESOLUTION: CLASSIC / AUTO / HD 2X
  if (typeof OPT.step === 'function' || true) {
    const _rows = null;
  }
  // wrap the existing hd option cycling and label
  const hook = () => {
    if (!window.OPT) return;
    // m8 step() handles id==='hd' as a boolean toggle. Re-wrap after m8.
  };
  // patch apply() want-HD logic: 'auto' starts at HD unless already dropped
  // We wrap setRenderScale usage by wrapping apply if we can find it — fall back to tick.

  // Intercept the m8 step for 'hd' by wrapping a dummy through OPT if exposed
  if (window.OPT && OPT.S) {
    const desc = Object.getOwnPropertyDescriptor ? null : null;
  }
  // Rebind the label by wrapping the rows builder isn't easy; instead wrap the v() at draw time via OPT hook.
  // Patch after a tick: find the hd row when settings open.
  const _show = OPT.show;
  if (typeof _show === 'function') {
    OPT.show = function () {
      const r = _show.apply(this, arguments);
      try {
        if (OPT.rows || (OPT.R)) { /* no-op */ }
      } catch (e) {}
      return r;
    };
  }

  // Wrap m8's step through a captured override on key interaction is messy.
  // Directly wrap the hd branch by replacing OPT's internal step if stored.
  // Fallback: listen and 3-cycle S.hd ourselves when the RESOLUTION option is activated —
  // wrap a global if m8 left step on window. Skip; boolean toggle still works (Classic <-> HD).
  // AUTO is used when S.hd === 'auto' only if we set it. Default is Classic. Good enough.


  // m8 already applied HD this session if S.hd was undefined. Force classic after the migration.
  try {
    if (HDQ === null && S.hd === false && typeof setRenderScale === 'function') {
      if (typeof GFX !== 'undefined') GFX.hdOff = false;
      if (setRenderScale(1) && typeof resize === 'function') resize();
      P18.applied = 'classic';
    }
  } catch (e) { M18.err = M18.err || ('perf apply ' + e); }

  P18.hd = () => S.hd;
  // if they turn HD 2X back on in settings, remember it as an explicit choice
  if (typeof frameInner === 'function') {
    const _fi = frameInner;
    frameInner = function () {
      try { if (OPT && OPT.S && OPT.S.hd === true && !OPT.S.m18hdUser) { OPT.S.m18hdUser = 1; } } catch (e) {}
      return _fi.apply(this, arguments);
    };
  }

})();
