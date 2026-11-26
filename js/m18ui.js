// ===== m18ui: polish — sequential popups, near-plane fade, clipped titles, readable subtitle, HUD collisions, frozen kill cap.
// ?ui=0 or ?m18=0
(function () {
  if (!window.M18 || !M18.ui) return;
  const U18 = M18.uiState = { on: true };

  // ----- sequential toasts / banners: one overlay at a time -----
  if (typeof toast === 'function') {
    const _toast = toast;
    const q = U18.toastQ = [];
    // m20g: G.time resets every stage, so a G.time stamp never went stale across a stage change (old ELITE SPOILS at the next stage start)
    const tnow = U18.tnow = () => (window.M20G && M20G.toastq) ? performance.now() / 1000 : (G.time || 0);
    toast = function (t1, t2, col, dur) {
      const cardOn = window.M15 && M15.card && M15.card();
      const busy = cardOn || (G.bigText && G.bigText.t < (G.bigText.dur || 3) - 0.15) || (G.toasts && G.toasts.length >= 1) || (window.TIPS && TIPS.cur) || (window.M20G && M20G.toastq && window.M11 && M11.BAN && (M11.BAN.cur || M11.BAN.q.length));   // m20g: one centre message at a time (toast OR weapon banner)
      if (busy) {
        if (window.HUD2 && HUD2.on) {   // m20f hud2: no duplicates in the queue, cap it, stamp it (stale ones get dropped)
          if (q.some(a => a[0] === t1 && (a[1] || '') === (t2 || ''))) return;
          q.push([t1, t2, col, dur, tnow()]); if (q.length > 8) { const k = q.findIndex(a => !(a[3] > 3.2) && !/^"/.test(a[0] || "")); q.splice(k < 0 ? 0 : k, 1); HUD2.n.dropped++; } HUD2.n.queued++; return;
        }
        q.push([t1, t2, col, dur]); return;
      }
      return _toast(t1, t2, col, dur);
    };
    const flush = () => {
      if (!q.length) return;
      if (window.M20G && M20G.toastq && window.M11 && M11.BAN && (M11.BAN.cur || M11.BAN.q.length)) return;   // m20g: wait for the weapon banner
      if (G.state !== 'play' || G.paused) return;
      if (G.bigText && G.bigText.t < (G.bigText.dur || 3) - 0.15) return;
      if (G.toasts && G.toasts.length) return;
      if (window.TIPS && TIPS.cur) return;
      if (window.HUD2 && HUD2.on && window.M15 && M15.card && M15.card()) return;   // m20f: wait for the stage card
      let a = q.shift();
      if (window.HUD2 && HUD2.on) { while (a && a[4] != null && tnow() - a[4] > 10 && !(a[3] > 3.2) && !/^"/.test(a[0] || '')) { HUD2.n.stale++; a = q.shift(); } if (!a) return; HUD2.n.popped++; }
      _toast(a[0], a[1], a[2], a[3]);
    };
    U18.flushToasts = flush;
    if (typeof frameInner === 'function') { const _fi = frameInner; frameInner = function () { try { flush(); } catch (e) {} return _fi.apply(this, arguments); }; }
  }
  // hold FIRST FIND / NEW WEAPON banners while the stage card is up
  if (window.BAN && BAN.q) {
    const tickBan = () => {
      if (G.bigText && G.bigText.t < (G.bigText.dur || 3) - 0.2 && BAN.cur) {
        // pause its timer by not incrementing — BAN itself ticks; shove it back into the queue
        try { BAN.q.unshift(BAN.cur); BAN.cur = null; } catch (e) {}
      }
    };
    U18.tickBan = tickBan;
  }


  // park live toasts while the stage card is on screen
  const _fi2 = typeof frameInner === 'function' ? frameInner : null;
  if (_fi2) frameInner = function () {
    try {
      const cardOn = window.M15 && M15.card && M15.card();
      const bigOn = window.M20G && M20G.stairfix && G.bigText && G.bigText.t < (G.bigText.dur || 3) - 0.15;   // m20g: a big banner (A STAIR OPENS...) never sits on a toast
      if ((cardOn || bigOn) && G.toasts && G.toasts.length) { if (U18.toastQ) U18.toastQ.push(...G.toasts.filter(t => !(bigOn && !cardOn && (t.dur || 3) - (t.t || 0) < 0.6)).map(t => [t.t1, t.t2, t.col, Math.max(1.2, (t.dur || 3) - (t.t || 0)), U18.tnow ? U18.tnow() : (G.time || 0)])); G.toasts.length = 0; }   // m20f: same array the flusher reads (was a new array = lost toasts)
    } catch (e) {}
    return _fi2.apply(this, arguments);
  };

  // ----- near-plane sprite clamp / fade -----
  const NEARFIX = !/[?&](nearfix|m20e)=0/.test(location.search);
  if (typeof collectSprites === 'function') {
    const _cs = collectSprites;
    collectSprites = function (cam) {
      const S = _cs.apply(this, arguments);
      try {
        for (let i = S.length - 1; i >= 0; i--) {
          const s = S[i];
          if (!s || s.add) continue;
          const dep = s.dep;
          if (dep == null) continue;
          if (s.npc && NEARFIX) continue;   // m20e: hub spirits keep their true size (they used to drop to 35% and fade up close)
          if (s.ent || (s.tex && /^s_/.test(s.tex))) {
            if (NEARFIX) { if (dep < 0.42) S.splice(i, 1); continue; }   // m20e: foes too - the M9 1.05 clamp + M12 ENTCAP already stop texel blow-up
            if (dep < 0.55) { S.splice(i, 1); continue; }
            if (dep < 1.7) {
              const k = Math.max(0.35, (dep - 0.45) / 1.25);
              s.w = (s.w || 1) * k; s.h = (s.h || 1) * k;
              s.alpha = (s.alpha == null ? 1 : s.alpha) * Math.min(1, 0.3 + k);
            }
          }
        }
      } catch (e) { M18.err = M18.err || ('ui spr ' + e); }
      return S;
    };
  }

  // ----- clipped last letters on PAUSED / CLEARED (scale-2 font overruns the glyph box) -----
  if (typeof text === 'function') {
    const _tx = text;
    text = function (ctx, str, x, y, col, align, sc) {
      if (typeof str === 'string' && sc >= 2 && /PAUSED|CLEARED|CONTROLLER|VICTORY/.test(str)) {
        // pad a space so the last glyph's right edge isn't clipped, and nudge centered titles up a hair
        return _tx.call(this, ctx, str + ' ', x, y, col, align, sc);
      }
      return _tx.apply(this, arguments);
    };
  }

  // ----- readable title subtitle ("Ruined Nave" no longer reads as "Ruine d Dave") -----
  if (typeof drawTitle === 'function') {
    const _dt = drawTitle;
    drawTitle = function (ctx) {
      const r = _dt.apply(this, arguments);
      try {
        const su = Engine.imgs && Engine.imgs.txt_sub, ti = Engine.imgs && Engine.imgs.txt_title;
        if (su && ti && G.state === 'title') {
          const x = Math.round(W / 2 - su.width / 2 + 50), y = 14 + ti.height - 4;
          ctx.fillStyle = 'rgba(8,0,14,0.96)';
          ctx.fillRect(x - 6, y - 2, su.width + 12, su.height + 6);
          if (typeof text === 'function') text(ctx, 'THE RUINED NAVE', Math.round(W / 2 + 50), y + Math.max(8, (su.height / 2) | 0), '#f0d0e8', 'center');
        }
      } catch (e) {}
      return r;
    };
  }

  // ----- shard counter vs boss name: move shards down while a boss bar is up -----
  if (typeof drawRunHUD === 'function') {
    const _dh = drawRunHUD;
    drawRunHUD = function (ctx) {
      const bossOn = !!(G.boss && G.boss.alive && G.boss.awake && !RUN.hub);
      if (bossOn) U18.bossHUD = true;
      const r = _dh.apply(this, arguments);
      U18.bossHUD = false;
      return r;
    };
  }
  // hub.js draws SAVE.shards at top-right; in-run HUD is in rogue/game. Shift by wrapping text when it is the shard readout during a boss.
  if (typeof text === 'function') {
    const _tx2 = text;
    text = function (ctx, str, x, y, col, align, sc) {
      try {
        if (U18.bossHUD && typeof str === 'string' && /SHARDS|KILLS /.test(String(str)) && align === 'right' && y < 30) {
          y += 16;
        }
      } catch (e) {}
      return _tx2.call(this, ctx, str, x, y, col, align, sc);
    };
  }

  // ----- freeze kill-count denominator after the stage's real (non-summon) roster is in -----
  function cap() {
    if (!G || !G.enemies) return;
    const n = G.enemies.filter(e => !e.summoned && !e.m18thinned && (e.alive || e.dead)).length;
    if (!G.m18cap || n > G.m18cap) G.m18cap = n;
    G.m18capFrozen = 1;
  }
  const arm = fn => typeof fn === 'function' ? function () { const r = fn.apply(this, arguments); try { setTimeout(cap, 200); setTimeout(cap, 900); } catch (e) {} return r; } : fn;
  if (typeof nextStage === 'function') nextStage = arm(nextStage);
  if (typeof leaveHubForRun === 'function') leaveHubForRun = arm(leaveHubForRun);
  if (typeof text === 'function') {
    const _tx3 = text;
    text = function (ctx, str, x, y, col, align, sc) {
      if (typeof str === 'string' && G && G.m18cap && /^KILLS /.test(str) && str.indexOf('/') >= 0) {
        str = str.replace(/KILLS (\d+)\/(\d+)/, (_, k) => 'KILLS ' + k + '/' + G.m18cap);
        str = str.replace(/(\d+)\s*\/\s*(\d+)/, (_, k) => { if (str.indexOf('KILLS') >= 0) return k + ' / ' + G.m18cap; return _; });
      }
      return _tx3.call(this, ctx, str, x, y, col, align, sc);
    };
  }
})();
