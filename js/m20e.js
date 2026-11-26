// ===== m20e: playtest-notes pass (t211u). Kill switch for the whole file: ?m20e=0 =====
//  - music never leaves dead air (?mus20e=0): loop seams booked 4 s ahead (a janky frame used to skip the 1 s booking window
//    and leave a hole at the seam), any dead voice is revived (interlude beds and stings were exempt from the m19.5
//    watchdog), interlude beds are loudness-matched to the song they came from, and a resident gap bed (a soft, filtered loop
//    of the Chapel cover) fades in under any silence longer than ~0.35 s and back out when the music returns.
//  - Ansel (the Candle-Child) stands beside the candelabra, not inside it (?anselfix=0).
//  Other m20e fixes live next to the code they fix: m18ceil.js (hanging chains), m20floor.js (seal chains), m20npc.js +
//  m12a.js + m18ui.js (spirits and foes keep their size up close), m20npc.js (journal shows every entry whole),
//  m16mus.js (full-length songs instead of 30-60 s excerpt loops).
(function () {
  const q = s => new RegExp('[?&]' + s + '=0').test(location.search);
  const M = window.M20E = { v: 'm20e', on: !q('m20e'), log: [], err: [] };
  if (!M.on) return;
  const L = (what, x) => { M.log.push([SFX && SFX.ctx ? +SFX.ctx.currentTime.toFixed(2) : 0, what, x || null]); if (M.log.length > 80) M.log.shift(); };
  // ---------- Ansel off the candle ----------
  M.ansel = !q('anselfix');
  try { if (M.ansel && window.M20 && M20.NPC && M20.NPC.ansel) M20.NPC.ansel.slot = [13.6, 18.9]; } catch (e) { M.err.push('ansel ' + e); }

  // ---------- music: never dead air ----------
  M.mus = !q('mus20e') && typeof SFX !== 'undefined';
  if (!M.mus) return;
  const isIx = n => !!(n && String(n).indexOf('trk:m19_ix_') === 0);
  const now = () => SFX.ctx ? SFX.ctx.currentTime : 0;
  const wantOn = () => SFX.ctx && SFX.ctx.state === 'running' && !SFX.muted && SFX.musicOn !== false;
  const boss = () => !!(SFX.mus && SFX.mus.boss);
  const A = M.a = { booked: 0, revived: 0, bedOn: 0, bedMs: 0, matched: {}, quietMs: 0 };
  const LOOK = 4.0;
  // 1) book m16 loop seams early (same equal-power seam as audio.js, just with a 4 s lookahead)
  function bookAhead() {
    const fm = SFX.fm; if (!fm || !fm.v || !fm.v.length || !fm.buf || !/^trk:m16_/.test(fm.name) || /_st$/.test(fm.name)) return;
    let want = null; try { want = SFX.musicWant(boss()); } catch (e) { } if (fm.name !== want) return;
    const X = window.M19 && M19.xf; if (X && ((X.curveUntil && now() < X.curveUntil) || X.pending)) return;
    const cur = fm.v[fm.v.length - 1], dur = fm.buf.duration, XF = fm.xf || 0.3, t = now();
    if (cur.next || t < cur.t0 + dur - XF - LOOK || t > cur.t0 + dur - XF - 0.05) return;
    const t1 = cur.t0 + dur - XF; cur.next = true;
    const nv = SFX.musVoice(fm, t1); const N = 16, cu = new Float32Array(N), cd = new Float32Array(N);
    for (let i = 0; i < N; i++) { const x = i / (N - 1); cu[i] = Math.sin(x * Math.PI / 2); cd[i] = Math.cos(x * Math.PI / 2); }
    try { nv.g.gain.setValueCurveAtTime(cu, t1, XF); cur.g.gain.setValueCurveAtTime(cd, t1, XF); } catch (e) { nv.g.gain.setValueAtTime(1, t1); M.err.push('book ' + e); }
    setTimeout(() => { try { cur.s.stop(); } catch (e) { } fm.v = fm.v.filter(v => v !== cur); }, (t1 - t + XF + 0.5) * 1000);
    A.booked++;
  }
  const _fm = SFX.fileMusic;
  SFX.fileMusic = function (b) { const r = _fm.apply(this, arguments); try { bookAhead(); } catch (e) { M.err.push('ba ' + e); } return r; };
  // 2) revive a dead track (any kind: song, sting, interlude bed)
  let deadT = 0;
  function revive() {
    const fm = SFX.fm; if (!fm || !fm.v || !fm.buf) { deadT = 0; return; }
    const t = now(), dur = fm.buf.duration;
    const live = fm.v.some(v => t >= (v.realT0 != null ? v.realT0 : v.t0) - 0.05 && t < v.t0 + dur + 0.02);
    const future = fm.v.some(v => (v.realT0 != null ? v.realT0 : v.t0) > t);
    const X = window.M19 && M19.xf;
    if (live || future) { deadT = 0; return; }
    if (!deadT) { deadT = t; return; }
    if (t - deadT < 0.5) return;
    deadT = 0; const was = fm.name;
    // resume where it was, never from the top (the user heard songs "start over")
    try { const lv = fm.v[fm.v.length - 1]; if (X && X.resume && lv && !isIx(was)) { const body = Math.max(1, dur - (fm.xf || 0)); X.resume[was] = Math.max(0, t - lv.t0) % body; } } catch (e) { }
    try { if (X) { X.holdUntil = 0; X.pending = null; X.holdName = null; X.curveUntil = 0; } try { fm.g.disconnect(); } catch (e) { } SFX.fm = null; SFX.fileMusic(boss()); A.revived++; L('revive', { was, now: SFX.fm && SFX.fm.name }); } catch (e) { M.err.push('rv ' + e); }
  }
  // 3) loudness-match interlude beds to their source song
  function rmsOf(b) { let s = 0, n = 0; const d = b.getChannelData(0), st = Math.max(1, (d.length / 6000) | 0); for (let i = 0; i < d.length; i += st) { s += d[i] * d[i]; n++; } return Math.sqrt(s / Math.max(1, n)); }
  function matchIx() {
    const X = window.M19 && M19.xf; if (!X || !X.loaded) return;
    for (const id of Object.keys(X.loaded)) {
      const name = 'trk:m19_' + id; if (A.matched[name]) continue; const b = SFX.buf[name], src = SFX.buf[X.loaded[id]]; if (!b || !src) continue;
      const ri = rmsOf(b), rs = rmsOf(src), vi = SFX.fileVol[name] || 0.5, vs = SFX.fileVol[X.loaded[id]] || 0.55;
      const k = Math.max(1, Math.min(2.5, 0.85 * rs * vs / Math.max(1e-4, ri * vi)));
      if (k > 1.05) for (let c = 0; c < b.numberOfChannels; c++) { const d = b.getChannelData(c); for (let i = 0; i < d.length; i++) { const x = d[i] * k; d[i] = x > 0.9 ? 0.9 + (x - 0.9) / (1 + (x - 0.9) * 8) : x < -0.9 ? -0.9 + (x + 0.9) / (1 - (x + 0.9) * 8) : x; } }
      A.matched[name] = +k.toFixed(2);
    }
  }
  // 4) the gap bed: a soft filtered loop of the Chapel cover under any dead air
  let an = null, abuf = null, bed = null;
  function tap() { if (an || !SFX.ctx || !SFX.musBus) return an; an = SFX.ctx.createAnalyser(); an.fftSize = 1024; SFX.musBus.connect(an); abuf = new Float32Array(1024); return an; }
  function progRms() { if (!tap()) return 1; an.getFloatTimeDomainData(abuf); let s = 0; for (let i = 0; i < abuf.length; i++) s += abuf[i] * abuf[i]; return Math.sqrt(s / abuf.length); }
  // never the song that is playing (a filtered copy of the same cover on top of its own quiet intro sounds wrong)
  function bedBuf() { const pl = SFX.fm && SFX.fm.buf; for (const k of ['trk:m16_hub', 'trk:m16_chapel', 'trk:unyielding']) { const b = SFX.buf[k]; if (b && b !== pl) return b; } return null; }
  function bedStart() {
    const b = bedBuf(); if (!b || !SFX.musVol) return false;
    const c = SFX.ctx, g = c.createGain(), lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2200; lp.Q.value = 0.5;
    const s = c.createBufferSource(); s.buffer = b; s.loop = true;
    const seg = window.M16_SEGS && M16_SEGS.hub; const body = seg && SFX.buf['trk:m16_hub'] === b ? seg[2] : b.duration - 0.5;
    s.loopStart = 0; s.loopEnd = Math.min(b.duration, body);
    const bar = seg ? seg[5] : 2; const off = (Math.floor(Math.random() * Math.max(1, (body / bar) | 0)) * bar) % Math.max(1, body - 1);
    s.connect(lp); lp.connect(g); g.connect(SFX.musVol); g.gain.value = 0.0001;
    const t = c.currentTime; g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.3, t + 0.35);
    s.start(t, off); bed = { s, g, lp, t0: t }; A.bedOn++; L('bed-in', { off: +off.toFixed(1), playing: SFX.fm && SFX.fm.name }); return true;
  }
  function bedStop(fast) {
    if (!bed) return; const b = bed, t = now(); bed = null; A.bedMs += (t - b.t0) * 1000;
    try { b.g.gain.cancelScheduledValues(t); b.g.gain.setValueAtTime(Math.max(0.0001, b.g.gain.value), t); b.g.gain.linearRampToValueAtTime(0.0001, t + (fast ? 0.3 : 1.6)); } catch (e) { }
    setTimeout(() => { try { b.s.stop(); b.g.disconnect(); } catch (e) { } }, (fast ? 0.5 : 1.9) * 1000); L('bed-out');
  }
  let quiet = 0, loud = 0, lastT = 0;
  function tick() {
    try {
      const t = performance.now(), dt = lastT ? Math.min(500, t - lastT) : 100; lastT = t;
      if (!SFX.ctx) return;
      matchIx(); bookAhead(); revive();
      if (!wantOn()) { quiet = loud = 0; if (bed) bedStop(true); return; }
      const r = progRms();
      // dead air = the program bus under -52 dB for half a second (or 250 ms with no live track at all); a song's own soft
      // passages sit well above that, so the bed only fills real holes
      const fm = SFX.fm, live = fm && fm.v && fm.v.length && fm.v.some(v => now() < v.t0 + (fm.buf ? fm.buf.duration : 999) + 0.1);
      if (r < 0.0025) { quiet += dt; loud = 0; A.quietMs += dt; } else if (r > 0.006) { loud += dt; quiet = 0; }
      if (!bed && quiet > (live ? 500 : 250)) bedStart();
      else if (bed && loud > 300) bedStop(false);
    } catch (e) { M.err.push('tick ' + e); if (M.err.length > 20) M.err.shift(); }
  }
  M.iv = setInterval(tick, 100);
  M.st = () => Object.assign({ bed: !!bed, log: M.log.slice(-12), err: M.err.slice() }, A);
})();
