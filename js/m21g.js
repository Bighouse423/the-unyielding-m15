// ===== m21g: death card (cause, shards, next goal), stage-clear stats strip,
// one-key instant retry (R / Triangle), finisher count, next-goal on results.
// Kill: ?m21g=0 / ?m21=0 | ?deathui=0 | ?clearcard=0 | ?retry=0 | ?nextgoal=0 | ?fincnt=0
(function () {
  const Q = new URLSearchParams(location.search);
  const off = Q.get('m21g') === '0' || Q.get('m21') === '0';
  const on = k => !off && Q.get(k) !== '0';
  const M = window.M21G = {
    on: !off, deathui: on('deathui'), clearcard: on('clearcard'), retry: on('retry'),
    nextgoal: on('nextgoal'), fincnt: on('fincnt'),
    n: { dead: 0, clear: 0, retry: 0, fin: 0, goal: 0 }, err: [], ready: 0
  };
  function fail(tag, e) { M.err.push(tag + ': ' + (e && e.message ? e.message : e)); }
  M.st = () => ({
    on: M.on, deathui: M.deathui, clearcard: M.clearcard, retry: M.retry,
    nextgoal: M.nextgoal, fincnt: M.fincnt,
    n: Object.assign({}, M.n), err: M.err.slice()
  });
  if (off) { M.ready = 1; M.drawDead = null; return; }

  // cheapest unowned altar offering (display only; prices untouched)
  const GOALS = [
    { id: 'gravecoin', name: 'GRAVE COIN', cost: 20 },
    { id: 'emberheart', name: 'EMBER HEART', cost: 35 },
    { id: 'rimesigil', name: 'RIME SIGIL', cost: 35 },
    { id: 'stormbell', name: 'STORM BELL', cost: 40 },
    { id: 'fang', name: 'FANG', cost: 40 },
    { id: 'chainwhip', name: 'CHAIN WHIP', cost: 50 },
    { id: 'ironoath', name: 'IRON OATH', cost: 45 },
    { id: 'wraithcloak', name: 'WRAITH CLOAK', cost: 45 },
    { id: 'stormsword', name: 'STORM SWORD', cost: 60 },
    { id: 'rapier', name: 'VAMPIRE RAPIER', cost: 60 },
    { id: 'crossbow', name: 'GOTHIC CROSSBOW', cost: 70 }
  ];
  function nextGoal() {
    if (!M.nextgoal) return '';
    try {
      const unl = (window.SAVE && SAVE.unl) || {};
      const shards = ((window.SAVE && SAVE.shards) || 0) + ((typeof RUN !== 'undefined' && (RUN.banked || RUN.shardsRun)) || 0);
      let best = null;
      for (let i = 0; i < GOALS.length; i++) {
        if (unl[GOALS[i].id]) continue;
        if (!best || GOALS[i].cost < best.cost) best = GOALS[i];
      }
      M.n.goal++;
      if (!best) return 'EVERY OFFERING IS YOURS';
      return 'NEXT  ' + best.name + '  ' + shards + ' / ' + best.cost;
    } catch (e) { fail('goal', e); return ''; }
  }
  M.nextGoal = nextGoal;

  function fmtTime(t) {
    t = t | 0; return ((t / 60) | 0) + ':' + String(t % 60).padStart(2, '0');
  }
  function secretsNow() {
    try {
      const all = (LEVEL && LEVEL.secrets) || [];
      return { n: all.filter(s => s && s.found).length, t: all.length };
    } catch (e) { return { n: 0, t: 0 }; }
  }

  M.drawDead = function (ctx) {
    try {
      const a = Math.min(0.9, (G.deadT || 0) * 0.95);
      ctx.fillStyle = 'rgba(16,0,4,' + a.toFixed(3) + ')';
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      try { if (G.toasts) G.toasts.length = 0; if (window.TIPS) { TIPS.q = []; TIPS.cur = null; } } catch (e2) {}
      if (!M.deathui || (G.deadT || 0) < 0.45) return;
      M.n.dead++;
      const W = ctx.canvas.width, H = ctx.canvas.height;
      const im = Engine.imgs && Engine.imgs.txt_dead;
      if (im) ctx.drawImage(im, Math.round(W / 2 - im.width / 2), 28);
      const cause = (typeof RUN !== 'undefined' && RUN.cause) || 'the dark';
      text(ctx, 'SLAIN BY  ' + String(cause).toUpperCase(), W / 2, 92, '#ff8090', 'center');
      const shards = (RUN && (RUN.banked || RUN.shardsRun)) || 0;
      const st = RUN && RUN.stage || 1;
      const kills = (RUN && RUN.kills || 0) + (G.kills || 0);
      const fins = (RUN && RUN.finishers) || 0;
      let y = 112;
      text(ctx, 'STAGE ' + st + '    KILLS ' + kills + (M.fincnt ? '    FINISHERS ' + fins : ''), W / 2, y, '#e8d0f0', 'center'); y += 14;
      text(ctx, 'SHARDS  +' + shards, W / 2, y, '#e0a0ff', 'center'); y += 16;
      const ng = nextGoal();
      if (ng) { text(ctx, ng, W / 2, y, '#ffe080', 'center'); y += 16; }
      if ((G.t * 2 | 0) % 2 === 0) {
        if (G.inputMode === 'pad') {
          const row = M.retry ? ['{cross}', ' CONTINUE    ', '{triangle}', ' RETRY'] : ['{cross}', ' CONTINUE'];
          if (typeof promptRow === 'function') promptRow(ctx, row, W / 2, H - 22, '#ffffff', 'center');
          else text(ctx, 'CROSS CONTINUE', W / 2, H - 22, '#ffffff', 'center');
        } else {
          text(ctx, M.retry ? 'ENTER  CONTINUE     R  RETRY NOW' : 'ENTER  CONTINUE', W / 2, H - 22, '#ffffff', 'center');
        }
      }
    } catch (e) { fail('draw', e); }
  };

  function wantRetry() {
    if (!M.retry) return false;
    try {
      if (KP.KeyR || KP.PadRestart) return true;
      if (typeof padBind === 'function' && typeof PAD !== 'undefined' && PAD && PAD.just) {
        // triangle / Y default 3; fall back to button 3
      }
      if (typeof PAD !== 'undefined' && PAD && (PAD.just && (PAD.just.has ? PAD.just.has(3) : PAD.just[3]))) return true;
      if (typeof PBP !== 'undefined' && PBP && PBP[3]) return true;
    } catch (e) { }
    return !!(KP.KeyR);
  }

  function doRetry() {
    try {
      M.n.retry++;
      if (typeof newRun === 'function') newRun();
      else if (typeof newGame === 'function') { newGame(); G.state = 'play'; G.fade = 1; }
    } catch (e) { fail('retry', e); }
  }

  // stage snapshot when the boon / clear screen opens
  function snapClear() {
    if (M._cleared) return M._cleared;
    const sec = secretsNow();
    M._cleared = {
      stage: (RUN && RUN.stage) || 1,
      time: (G && G.time) || 0,
      kills: (G && G.kills) || 0,
      total: (G && G.totalEnemies) || 0,
      secrets: sec.n, secretsT: sec.t,
      fins: (RUN && RUN.finishersStage) || 0
    };
    return M._cleared;
  }

  function hookPick() {
    if (!M.clearcard || typeof drawPick !== 'function' || drawPick._m21g) return;
    const _dp = drawPick;
    drawPick = function (ctx) {
      _dp.apply(this, arguments);
      try {
        if (!M.clearcard || !ctx) return;
        const c = snapClear();
        M.n.clear++;
        const W = ctx.canvas.width;
        const line = 'TIME ' + fmtTime(c.time) + '    KILLS ' + c.kills + (c.total ? '/' + c.total : '') +
          (c.secretsT ? '    SECRETS ' + c.secrets + '/' + c.secretsT : '') +
          (M.fincnt ? '    FINISHERS ' + c.fins : '');
        text(ctx, line, W / 2, 246, '#d8c0f0', 'center');
      } catch (e) { fail('pick', e); }
    };
    drawPick._m21g = 1;
  }

  function hookResults() {
    if (typeof drawResults !== 'function' || drawResults._m21g) return;
    const _dr = drawResults;
    drawResults = function (ctx) {
      _dr.apply(this, arguments);
      try {
        if (!ctx || (RUN && RUN.resT) < 0.35) return;
        const W = ctx.canvas.width, H = ctx.canvas.height;
        // sit between the relic row (~204) and the m15c prompts (y=244)
        if (M.nextgoal) {
          const ng = nextGoal();
          if (ng) text(ctx, ng, W / 2, 226, '#ffe080', 'center');
        }
        if (M.retry && RUN.resT > 1.2) text(ctx, 'R  RETRY NOW', W / 2, 256, '#ffd0a0', 'center');
      } catch (e) { fail('res', e); }
    };
    drawResults._m21g = 1;
    if (typeof resultsInput === 'function' && !resultsInput._m21g) {
      const _ri = resultsInput;
      resultsInput = function (rdt) {
        try {
          if (M.retry && RUN && RUN.resT > 0.5 && (KP.KeyR || KP.PadRestart)) { doRetry(); return; }
        } catch (e) { fail('ri', e); }
        return _ri.apply(this, arguments);
      };
      resultsInput._m21g = 1;
    }
  }

  function hookFin() {
    if (!M.fincnt || typeof startFinisher !== 'function' || startFinisher._m21g) return;
    const _sf = startFinisher;
    startFinisher = function (e) {
      const r = _sf.apply(this, arguments);
      try {
        // skip the off-map prewarm dummy (m20m parks the foe at x=-79)
        if (RUN && RUN.on && e && e.x > -40 && !e.noShards) {
          RUN.finishers = (RUN.finishers || 0) + 1;
          RUN.finishersStage = (RUN.finishersStage || 0) + 1;
          M.n.fin++;
        }
      } catch (e2) { fail('fin', e2); }
      return r;
    };
    startFinisher._m21g = 1;
  }

  function hookStage() {
    if (typeof startPick === 'function' && !startPick._m21g) {
      const _sp = startPick;
      startPick = function () {
        try { M._cleared = null; snapClear(); } catch (e) { fail('sp', e); }
        const r = _sp.apply(this, arguments);
        try { if (RUN) RUN.finishersStage = 0; } catch (e2) { }
        return r;
      };
      startPick._m21g = 1;
    }
    if (typeof nextStage === 'function' && !nextStage._m21gC) {
      const _ns = nextStage;
      nextStage = function () {
        const r = _ns.apply(this, arguments);
        try { if (RUN) RUN.finishersStage = 0; M._cleared = null; } catch (e) { }
        return r;
      };
      nextStage._m21gC = 1;
    }
  }

  function hookDeadRetry() {
    if (!M.retry || typeof frameInner !== 'function' || frameInner._m21gR) return;
    const _fi = frameInner;
    frameInner = function (now) {
      const r = _fi.apply(this, arguments);
      try {
        if (M.retry && G && G.state === 'dead' && RUN && RUN.on && G.deadT > 0.5) {
          if (KP.KeyR || KP.PadRestart) doRetry();
        }
      } catch (e) { fail('dr', e); }
      return r;
    };
    frameInner._m21gR = 1;
  }

  function hookHUD() {
    if (typeof drawHUD === 'function' && !drawHUD._m21g) {
      const _dh = drawHUD;
      drawHUD = function () {
        try {
          if (M.deathui && G && G.state === 'dead' && RUN && RUN.on) return;
        } catch (e) {}
        return _dh.apply(this, arguments);
      };
      drawHUD._m21g = 1;
    }
  }

  try { hookPick(); } catch (e) { fail('hp', e); }
  try { hookResults(); } catch (e) { fail('hr', e); }
  try { hookFin(); } catch (e) { fail('hf', e); }
  try { hookStage(); } catch (e) { fail('hs', e); }
  try { hookDeadRetry(); } catch (e) { fail('hd', e); }
  try { hookHUD(); } catch (e) { fail('hh', e); }
  M.ready = 1;
  setTimeout(function () {
    try { hookPick(); hookResults(); hookFin(); hookStage(); hookDeadRetry(); hookHUD(); M.ready = 1; } catch (e) { fail('late', e); }
  }, 0);
})();
