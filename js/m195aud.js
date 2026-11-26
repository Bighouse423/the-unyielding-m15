// ===== m19.5 audio fix: music never silently dies. ?audiofix=0 restores m19 behaviour.
//  1. Offset voices (m19 resume-from-bar) now keep the loop seam on time: a voice that starts `off` seconds into the
//     buffer is booked as if it began `off` seconds earlier, and later loop passes start at the top of the file.
//     (m19 scheduled the next pass at t0+duration, so every pass left a gap of off-XF seconds of silence.)
//  2. iOS/Safari: resume the AudioContext on visibility/focus/pageshow and on every input; if iOS keeps it
//     interrupted, a small TAP TO RESUME SOUND chip appears (iOS only unlocks audio from a touch).
//  3. Watchdog (2 Hz): restores a stuck music-bus duck, a track gain left near zero outside a fade, a track with no
//     live voice, or no track at all while one is wanted. Every intervention is logged in M195.aud.log.
(function () {
  const M = window.M195; if (!M || !M.on || !M.audiofix) return;
  if (typeof SFX === 'undefined') return;
  const A = M.aud = { on: true, log: [], fixes: 0, resumes: 0, chip: false, lastDuck: -99, err: [] };
  const ctxT = () => (SFX.ctx ? SFX.ctx.currentTime : 0);
  const note = (what, extra) => { A.fixes++; const r = { t: +ctxT().toFixed(2), what, extra: extra || null, playing: SFX.fm ? SFX.fm.name : null }; A.log.push(r); if (A.log.length > 60) A.log.shift(); };
  const isIx = n => !!(n && String(n).indexOf('trk:m19_ix_') === 0);

  // ---------- 1. offset voices keep the loop seam on time ----------
  const _mv = SFX.musVoice;
  SFX.musVoice = function (fm, t0) {
    const v = _mv.apply(this, arguments);
    try {
      const off = (v && v.off) || 0;
      if (off > 0) {
        v.realT0 = t0; v.t0 = t0 - off; v.off = 0; v.m195 = off;   // book position from the buffer start
        // only the theme module sets fm.off for its own seam voices and puts it back to 0 itself;
        // m19xf leaves fm.off set forever, which made every later pass restart mid-file
        if (fm && fm.off) fm.off = 0;
      }
    } catch (e) { A.err.push('mv ' + e); }
    return v;
  };

  // ---------- 2. keep the context running (iOS interruptions, tab switches, lock screen) ----------
  const isiOS = /iPad|iPhone|iPod/.test(navigator.userAgent || '') || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  let chip = null, badSince = 0;
  function tryResume(why) {
    const c = SFX.ctx; if (!c || c.state === 'running' || c.state === 'closed') return;
    if (SFX.muted === true && !SFX.musicOn) return;
    try { const p = c.resume(); A.resumes++; if (p && p.then) p.then(() => { if (c.state === 'running') { hideChip(); note('resume', why); } }).catch(() => { }); } catch (e) { }
  }
  function showChip() {
    if (chip || !document.body) return;
    chip = document.createElement('div'); chip.id = 'm195sound';
    chip.style.cssText = 'position:fixed;left:50%;top:max(10px,env(safe-area-inset-top));transform:translateX(-50%);z-index:9998;background:rgba(20,6,30,.88);color:#ffe080;border:1px solid #a070ff;border-radius:18px;padding:8px 16px;font:13px monospace;letter-spacing:.08em;pointer-events:auto';
    chip.textContent = 'TAP TO RESUME SOUND';
    const go = e => { try { e.preventDefault(); } catch (x) { } tryResume('chip'); setTimeout(() => { if (SFX.ctx && SFX.ctx.state === 'running') hideChip(); }, 200); };
    chip.addEventListener('touchend', go, { passive: false }); chip.addEventListener('click', go);
    document.body.appendChild(chip); A.chip = true;
  }
  function hideChip() { if (chip) { chip.remove(); chip = null; } }
  const kick = why => () => tryResume(why);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) { tryResume('visible'); setTimeout(kick('visible+'), 300); } });
  addEventListener('pageshow', kick('pageshow')); addEventListener('focus', kick('focus'));
  for (const ev of ['touchend', 'pointerdown', 'keydown', 'mousedown']) addEventListener(ev, kick(ev), { passive: true, capture: true });
  addEventListener('gamepadconnected', kick('pad'));
  if (typeof pollPad === 'function') {
    const _pp = pollPad; let lastPress = 0;
    pollPad = function () {
      try {
        if (SFX.ctx && SFX.ctx.state !== 'running' && performance.now() - lastPress > 400) {
          const list = navigator.getGamepads ? navigator.getGamepads() : [];
          for (const g of list) if (g && g.buttons && g.buttons.some(b => b && b.pressed)) { lastPress = performance.now(); tryResume('padbtn'); break; }
        }
      } catch (e) { }
      return _pp.apply(this, arguments);
    };
  }
  // duck bookkeeping so the watchdog knows when a low music bus is intentional
  if (typeof SFX.playBuf === 'function') {
    const _pb = SFX.playBuf;
    SFX.playBuf = function (name) { try { const m = SFX.sfxMeta && SFX.sfxMeta[name]; if (m && m.duck) A.lastDuck = ctxT(); } catch (e) { } return _pb.apply(this, arguments); };
  }

  // ---------- 3. watchdog ----------
  const st = { noVoice: 0, lowGain: 0, noTrack: 0, busLow: 0 };
  function tick() {
    try {
      const c = SFX.ctx; if (!c) return;
      if (c.state !== 'running') {
        if (!document.hidden) {
          tryResume('watch');
          if (!badSince) badSince = performance.now();
          if (isiOS && performance.now() - badSince > 1500 && window.G && G.state !== 'loading') showChip();
        }
        return;
      }
      badSince = 0; hideChip();
      const now = c.currentTime, X = window.M19 && M19.xf;
      const wantOn = !SFX.muted && SFX.musicOn !== false;
      const inCurve = X && ((X.curveUntil && now < X.curveUntil + 0.3) || (X.holdUntil && now < X.holdUntil) || X.pending);
      // a) music bus stuck ducked
      if (SFX.musBus && SFX.musBus.gain.value < 0.9 && now - A.lastDuck > 4.5) {
        if (++st.busLow >= 2) { const g = SFX.musBus.gain; g.cancelScheduledValues(now); g.setValueAtTime(g.value, now); g.setTargetAtTime(1, now, 0.25); note('bus-unduck', +g.value.toFixed(3)); st.busLow = 0; }
      } else st.busLow = 0;
      const fm = SFX.fm;
      let want = null; try { want = SFX.musicWant(!!(SFX.mus && SFX.mus.boss)); } catch (e) { }
      // b) a track is wanted and loaded but nothing is playing
      if (wantOn && want && SFX.buf && SFX.buf[want] && !fm && !inCurve) {
        if (++st.noTrack >= 6) { st.noTrack = 0; try { SFX.fileMusic(!!(SFX.mus && SFX.mus.boss)); note('restart-track', want); } catch (e) { A.err.push('rt ' + e); } }
      } else st.noTrack = 0;
      if (!fm || !fm.buf || !fm.v) return;
      // c) the current track has no live voice (seam missed, voice stopped early)
      const dur = fm.buf.duration;
      const live = fm.v.some(v => now >= (v.realT0 != null ? v.realT0 : v.t0) - 0.05 && now < v.t0 + dur + 0.02);
      const future = fm.v.some(v => (v.realT0 != null ? v.realT0 : v.t0) > now);
      if (wantOn && !live && !future && !isIx(fm.name) && !/_st$/.test(fm.name || '') && fm.name === want) {
        if (++st.noVoice >= 2) {
          st.noVoice = 0;
          const bar = (window.M16_SEGS && M16_SEGS[(fm.name || '').replace(/^trk:(m16_)?/, '')] || [])[5] || 2;
          const last = fm.v[fm.v.length - 1]; let pos = last ? (now - last.t0) % Math.max(1, dur - (fm.xf || 0)) : 0; pos = Math.floor(pos / bar) * bar; if (!(pos > 0.02 && pos < dur - 1)) pos = 0;
          fm.off = pos; const nv = SFX.musVoice(fm, now + 0.03); fm.off = 0;
          try { nv.g.gain.setValueAtTime(0.0001, now + 0.03); nv.g.gain.linearRampToValueAtTime(1, now + 0.6); } catch (e) { nv.g.gain.value = 1; }
          note('revive-voice', { pos: +pos.toFixed(2) });
        }
      } else st.noVoice = 0;
      // d) track gain parked near zero outside any fade while it is the wanted track
      const gv = fm.g.gain.value, vol = SFX.fileVol && SFX.fileVol[fm.name] != null ? SFX.fileVol[fm.name] : 0.5;
      if (wantOn && fm.name === want && !inCurve && vol > 0.02 && gv < vol * 0.15) {
        if (++st.lowGain >= 4) { st.lowGain = 0; const g = fm.g.gain; try { g.cancelScheduledValues(now); g.setValueAtTime(Math.max(0.0001, gv), now); g.linearRampToValueAtTime(vol, now + 0.8); } catch (e) { } note('regain', { from: +gv.toFixed(4), to: vol }); }
      } else st.lowGain = 0;
    } catch (e) { A.err.push(String(e)); if (A.err.length > 20) A.err.shift(); }
  }
  A.iv = setInterval(tick, 500);
  A.tick = tick; A.tryResume = tryResume;
})();
