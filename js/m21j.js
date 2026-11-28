// ===== m21j: chapel next-goal board + focus-loss pause on any blur (not just pointer lock).
// Kill: ?m21j=0 / ?m21=0 | ?hubgoal=0 | ?focus2=0
(function () {
  const Q = new URLSearchParams(location.search);
  const off = Q.get('m21j') === '0' || Q.get('m21') === '0';
  const on = k => !off && Q.get(k) !== '0';
  const M = window.M21J = {
    on: !off, hubgoal: on('hubgoal'), focus2: on('focus2'),
    n: { board: 0, focus: 0 }, err: [], ready: 0, focusPaused: false
  };
  function fail(tag, e) { M.err.push(tag + ': ' + (e && e.message ? e.message : e)); }
  M.st = () => ({
    on: M.on, hubgoal: M.hubgoal, focus2: M.focus2,
    n: Object.assign({}, M.n), err: M.err.slice(), focusPaused: !!M.focusPaused
  });
  if (off) { M.ready = 1; return; }

  function goalLine() {
    try {
      if (window.M21G && typeof M21G.nextGoal === 'function') {
        const s = M21G.nextGoal();
        if (s) return s;
      }
    } catch (e) { fail('goal', e); }
    return '';
  }

  function hookHub() {
    if (!M.hubgoal || typeof drawHubHUD !== 'function' || drawHubHUD._m21j) return;
    const _dh = drawHubHUD;
    drawHubHUD = function (ctx) {
      _dh.apply(this, arguments);
      try {
        if (!ctx || !M.hubgoal) return;
        const line = goalLine();
        if (!line) return;
        M.n.board++;
        const W = 480, H = 270;
        // compact plaque under the chapel title / records
        ctx.fillStyle = 'rgba(8,0,12,0.62)';
        ctx.fillRect(W / 2 - 130, 34, 260, 14);
        text(ctx, line, W / 2, 36, '#ffe080', 'center');
        const da = Math.hypot(P.x - 10.5, P.y - 4.5);
        if (da < 3.2) {
          ctx.fillStyle = 'rgba(8,0,12,0.7)';
          ctx.fillRect(W / 2 - 140, H - 70, 280, 14);
          text(ctx, line, W / 2, H - 68, '#ffe080', 'center');
        }
      } catch (e) { fail('hub', e); }
    };
    drawHubHUD._m21j = 1;
  }

  function hookAltar() {
    if (!M.hubgoal || typeof drawAltar !== 'function' || drawAltar._m21j) return;
    const _da = drawAltar;
    drawAltar = function (ctx) {
      _da.apply(this, arguments);
      try {
        if (!ctx || !M.hubgoal) return;
        const line = goalLine();
        if (!line) return;
        text(ctx, line, 240, 14, '#ffe080', 'center');
      } catch (e) { fail('al', e); }
    };
    drawAltar._m21j = 1;
  }

  function pauseForFocus() {
    if (!M.focus2) return;
    try {
      if (typeof G === 'undefined' || G.state !== 'play' || G.paused) return;
      if (window.OPT && OPT.open) return;
      if (window.RUN && RUN.hub) return;
      G.paused = true; G.pmSel = 0; G.pmPage = null;
      M.focusPaused = true;
      M.n.focus++;
      try { releaseAll(); } catch (e2) { }
    } catch (e) { fail('pause', e); }
  }
  M.pauseForFocus = pauseForFocus;

  function hookFocus() {
    if (!M.focus2 || M._focusHook) return;
    M._focusHook = 1;
    addEventListener('blur', function () { pauseForFocus(); });
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) pauseForFocus();
      else {
        try { if (window.SFX && SFX.ctx && SFX.ctx.state === 'suspended') SFX.ctx.resume(); } catch (e) { }
      }
    });
  }

  function hookPauseDraw() {
    if (!M.focus2 || typeof drawHUD !== 'function' || drawHUD._m21jF) return;
    // after the pause menu is drawn (game.js draws it inside render, after drawHUD)
    // hook render to stamp a focus note on the hud
    if (typeof render === 'function' && !render._m21jF) {
      const _r = render;
      render = function (rdt) {
        const r = _r.apply(this, arguments);
        try {
          if (G && !G.paused) M.focusPaused = false;
          if (M.focus2 && M.focusPaused && G && G.paused && G.state === 'play' && !(window.OPT && OPT.open)) {
            const s = document.getElementById('screen');
            const sx = s && s.getContext && s.getContext('2d');
            const sc = (typeof SCALE === 'number' && SCALE) || 1;
            if (sx && typeof text === 'function') {
              sx.save();
              sx.setTransform(sc, 0, 0, sc, 0, 0);
              sx.fillStyle = 'rgba(8,0,12,0.78)';
              sx.fillRect(80, 36, 320, 13);
              text(sx, 'WINDOW LOST FOCUS', 240, 38, '#ffd080', 'center');
              sx.restore();
            }
          }
        } catch (e) { fail('pd', e); }
        return r;
      };
      render._m21jF = 1;
    }
  }

  try { hookHub(); } catch (e) { fail('hh', e); }
  try { hookAltar(); } catch (e) { fail('ha', e); }
  try { hookFocus(); } catch (e) { fail('hf', e); }
  try { hookPauseDraw(); } catch (e) { fail('hp', e); }
  M.ready = 1;
  setTimeout(function () {
    try { hookHub(); hookAltar(); hookFocus(); hookPauseDraw(); M.ready = 1; } catch (e) { fail('late', e); }
  }, 0);
})();
