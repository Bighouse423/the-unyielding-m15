// ===== m19xf: equal-power, tempo-aware crossfades and short interludes between songs.
// Slices beds from already-shipped copies (audio/m16, title theme). Originals are never touched.
// ?mxfade=0 / ?m19=0 leaves m18 fileMusic alone.
(function () {
  if (!window.M19 || !M19.mxfade) return;
  if (typeof SFX === 'undefined') return;

  const X = M19.xf = {
    on: true, log: [], resume: {}, holdUntil: 0, holdName: null, pending: null,
    last: null, reason: '', err: [], loaded: {}, armedLoop: null
  };
  const now = () => (SFX.ctx ? SFX.ctx.currentTime : 0);
  const L = (rec) => { X.log.push(rec); if (X.log.length > 80) X.log.shift(); X.last = rec; };
  const bare = (n) => (n || '').replace(/^trk:(m16_)?/, '');
  const isIx = (n) => !!(n && n.indexOf('trk:m19_ix_') === 0);
  const STINGS = { boss_st: 1, lich_st: 1, mini_st: 1 };
  const BARS = { unyielding: 1.8, unyielding_victory: 1.8, bighouse: 1.8 };
  function barOf(name) {
    const k = bare(name);
    if (window.M16_SEGS && M16_SEGS[k]) return M16_SEGS[k][5];
    return BARS[k] || 2.0;
  }
  function beatOf(name) {
    const k = bare(name);
    if (window.M16_SEGS && M16_SEGS[k]) return M16_SEGS[k][6];
    return barOf(name) / 4;
  }
  function volOf(name) {
    if (SFX.muted || !SFX.musicOn) return 0;
    return SFX.fileVol[name] ?? 0.55;
  }

  // bar-aligned quiet/pad windows on the shipped copy buffers (seconds into the trimmed m16/theme buffer)
  const IX = {
    ix_hub:    { src: ['trk:m16_hub', 'trk:bighouse'],               t0: 4.971, dur: 9.942, vol: 0.50 },
    ix_chapel: { src: ['trk:m16_chapel'],                           t0: 14.266, dur: 9.511, vol: 0.50 },
    ix_early:  { src: ['trk:m16_s13'],                              t0: 19.706, dur: 8.957, vol: 0.48 },
    ix_mid:    { src: ['trk:m16_s46'],                              t0: 9.458,  dur: 9.458, vol: 0.48 },
    ix_late:   { src: ['trk:m16_s9'],                               t0: 17.109, dur: 9.505, vol: 0.48 },
    ix_throne: { src: ['trk:m16_s10'],                              t0: 2.342,  dur: 9.369, vol: 0.48 },
    ix_abyss:  { src: ['trk:m16_abyss'],                            t0: 22.353, dur: 8.941, vol: 0.50 },
    ix_death:  { src: ['trk:m16_results'],                          t0: 0.000,  dur: 7.604, vol: 0.52 },
    ix_theme:  { src: ['trk:unyielding', 'trk:unyielding_victory'], t0: 3.600,  dur: 9.000, vol: 0.48 }
  };

  function typ(from, to) {
    const F = bare(from), T = bare(to);
    if (!T) return 'stop';
    if (STINGS[T]) return 'sting';
    if (STINGS[F] && !STINGS[T]) {
      if (T === 'unyielding_victory') return 'victory';
      if (T === 'unyielding') return 'title';
      if (T === 'results') return 'results';
      return 'fight';
    }
    const fam = (s) => s.replace(/c$/, '');
    if (F && T && F !== T && fam(F) === fam(T) && !STINGS[F] && !STINGS[T]) return /c$/.test(T) ? 'combat' : 'explore';
    if (T === 'unyielding_victory') return 'victory';
    if (T === 'unyielding') return 'title';
    if (T === 'results') return 'results';
    if (T === 'hub' || T === 'bighouse') return 'hub';
    if (T === 'chapel') return 'chapel';
    if (T === 'abyss' || T === 'abyssc') return 'abyss';
    return 'scene';
  }
  function xfDur(t) {
    return ({
      combat: 2.4, explore: 2.8, sting: 2.6, fight: 2.0,
      hub: 3.2, chapel: 3.2, results: 3.2, abyss: 3.4,
      scene: 3.2, title: 3.4, victory: 3.6, stop: 1.2
    })[t] || 3.0;
  }
  function usesIx(t) {
    return t === 'hub' || t === 'chapel' || t === 'results' || t === 'abyss' || t === 'scene' || t === 'title';
  }
  function ixNameFor(t, to) {
    const T = bare(to);
    if (t === 'hub' || t === 'title') return 'ix_hub';
    if (t === 'chapel') return 'ix_chapel';
    if (t === 'results') return 'ix_death';
    if (t === 'abyss') return 'ix_abyss';
    if (T === 's10' || T === 's10c') return 'ix_throne';
    if (T === 's9' || T === 's9c') return 'ix_late';
    if (T === 's78' || T === 's78c') return 'ix_late';
    if (T === 's46' || T === 's46c') return 'ix_mid';
    if (T === 's13' || T === 's13c') return 'ix_early';
    if (t === 'scene') return 'ix_theme';
    return 'ix_theme';
  }

  function slice(src, t0, dur) {
    const c = SFX.ctx, sr = src.sampleRate;
    let i0 = Math.max(0, Math.round(t0 * sr));
    let n = Math.round(dur * sr);
    if (i0 + n > src.length) n = Math.max(1, src.length - i0);
    if (n < sr) return null;
    const out = c.createBuffer(src.numberOfChannels, n, sr);
    const fade = Math.min(Math.round(0.22 * sr), (n / 4) | 0);
    let peak = 1e-9, acc = 0;
    for (let ch = 0; ch < src.numberOfChannels; ch++) {
      const a = src.getChannelData(ch), b = out.getChannelData(ch);
      for (let i = 0; i < n; i++) {
        let s = a[i0 + i] || 0;
        if (i < fade) s *= i / fade;
        if (i > n - fade) s *= (n - i) / fade;
        b[i] = s; acc += s * s; if (Math.abs(s) > peak) peak = Math.abs(s);
      }
    }
    const rms = Math.sqrt(acc / (n * src.numberOfChannels));
    const want = 0.12, g = Math.max(0.4, Math.min(1.6, want / Math.max(rms, 1e-4)));
    for (let ch = 0; ch < out.numberOfChannels; ch++) {
      const b = out.getChannelData(ch);
      for (let i = 0; i < n; i++) b[i] = Math.max(-0.95, Math.min(0.95, b[i] * g));
    }
    // short two-tap tail so the bed feels like a reverb swell, not a hard loop
    const d1 = Math.round(0.18 * sr), d2 = Math.round(0.38 * sr);
    for (let ch = 0; ch < out.numberOfChannels; ch++) {
      const b = out.getChannelData(ch), tmp = new Float32Array(b);
      for (let i = 0; i < n; i++) {
        let s = tmp[i];
        if (i >= d1) s += tmp[i - d1] * 0.18;
        if (i >= d2) s += tmp[i - d2] * 0.10;
        b[i] = s;
      }
    }
    return out;
  }
  function ixBuf(id) {
    const name = 'trk:m19_' + id;
    if (SFX.buf[name]) return SFX.buf[name];
    const spec = IX[id]; if (!spec) return null;
    for (const s of spec.src) {
      if (SFX.buf[s] && SFX.buf[s].duration > spec.t0 + 2) {
        const b = slice(SFX.buf[s], spec.t0, spec.dur);
        if (b) { SFX.buf[name] = b; SFX.fileVol[name] = spec.vol; SFX.fileXF[name] = 0.3; X.loaded[id] = s; return b; }
      }
    }
    return null;
  }
  function preload() {
    Object.keys(IX).forEach(ixBuf);
  }
  // keep trying as m16/theme buffers arrive
  let preT = 0;
  const preIv = setInterval(() => { preload(); if (++preT > 40) clearInterval(preIv); }, 400);

  function eqCurves(n, a0, a1, up) {
    const c = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const x = n === 1 ? 1 : i / (n - 1);
      const e = up ? Math.sin(x * Math.PI / 2) : Math.cos(x * Math.PI / 2);
      c[i] = a0 + (a1 - a0) * e;
    }
    c[n - 1] = a1;
    return c;
  }
  function attachLP(fm) {
    if (!fm || fm.lp || !SFX.ctx) return fm && fm.lp;
    try {
      const lp = SFX.ctx.createBiquadFilter();
      lp.type = 'lowpass'; lp.frequency.value = 14000; lp.Q.value = 0.6;
      try { fm.g.disconnect(); } catch (e) { }
      fm.g.connect(lp);
      lp.connect(SFX.musBus || SFX.master);
      fm.lp = lp;
      return lp;
    } catch (e) { X.err.push('lp ' + e); return null; }
  }
  function fadeOut(fm, t0, dur, fromVol) {
    if (!fm) return;
    const v0 = fromVol != null ? fromVol : (fm.g.gain.value || 0.5);
    try { fm.g.gain.cancelScheduledValues(t0); } catch (e) { }
    try { fm.g.gain.setValueAtTime(Math.max(0.0001, v0), t0); } catch (e) { }
    try { fm.g.gain.setValueCurveAtTime(eqCurves(32, Math.max(0.0001, v0), 0.0001, false), t0, dur); } catch (e) {
      try { fm.g.gain.setTargetAtTime(0, t0, dur / 3); } catch (e2) { }
    }
    const lp = attachLP(fm);
    if (lp) {
      try {
        lp.frequency.cancelScheduledValues(t0);
        lp.frequency.setValueAtTime(12000, t0);
        lp.frequency.exponentialRampToValueAtTime(400, t0 + Math.max(0.05, dur * 0.9));
      } catch (e) { }
    }
    const old = fm;
    setTimeout(() => {
      try { old.v.forEach(v => v.s.stop()); } catch (e) { }
      try { if (old.lp) old.lp.disconnect(); old.g.disconnect(); } catch (e) { }
    }, (dur + 0.5) * 1000);
  }
  function startTrack(name, buf, t0, dur, vol, off) {
    const c = SFX.ctx;
    const g = c.createGain(); g.gain.value = 0.0001; g.connect(SFX.musBus || SFX.master);
    const fm = { name, g, buf, v: [], xf: Math.min(SFX.fileXF[name] ?? 2.0, buf.duration / 4), off: off || 0 };
    const v0 = SFX.musVoice(fm, t0);
    try { v0.g.gain.setValueAtTime(1, t0); } catch (e) { v0.g.gain.value = 1; }
    try { g.gain.setValueAtTime(0.0001, t0); g.gain.setValueCurveAtTime(eqCurves(32, 0.0001, Math.max(0.0001, vol), true), t0, dur); }
    catch (e) { try { g.gain.setTargetAtTime(vol, t0, dur / 3); } catch (e2) { } }
    return fm;
  }
  function remember(fm) {
    if (!fm || !fm.v || !fm.v.length || isIx(fm.name)) return;
    const v = fm.v[fm.v.length - 1];
    X.resume[fm.name] = (now() - v.t0) + (v.off || fm.off || 0);
  }
  function resumeOff(name, fromFm, destBuf) {
    const bar = barOf(name);
    const body = Math.max(bar, (destBuf.duration - (SFX.fileXF[name] || 0.3)) || destBuf.duration);
    let off = 0;
    const kind = fromFm ? typ(fromFm.name, name) : '';
    if (fromFm && fromFm.v && fromFm.v.length && (kind === 'combat' || kind === 'explore')) {
      const v = fromFm.v[fromFm.v.length - 1];
      const pos = (now() - v.t0) + (v.off || fromFm.off || 0);
      off = (Math.round(pos / bar) * bar) % body;
    } else if (X.resume[name] != null) {
      off = X.resume[name] % body;
      off = Math.floor(off / bar) * bar;
    }
    if (off < 0.02 || off > body - 0.35) off = 0;
    return off;
  }
  function waitBar(fromFm, grid) {
    if (!fromFm || !fromFm.v || !fromFm.v.length || !grid) return 0;
    const v = fromFm.v[fromFm.v.length - 1];
    const pos = ((now() - v.t0) % grid + grid) % grid;
    const rem = grid - pos;
    if (rem < 0.06 || pos < 0.03) return 0;
    return rem;
  }

  function curveClear(fm) {
    if (!fm || !fm.g) return;
    const t = now();
    try { const v = Math.max(0.0001, fm.g.gain.value); fm.g.gain.cancelScheduledValues(t); fm.g.gain.setValueAtTime(v, t); } catch (e) { }
  }

  function analyserRms() {
    try {
      if (!X._an) { X._an = SFX.ctx.createAnalyser(); X._an.fftSize = 2048; (SFX.musBus || SFX.master).connect(X._an); }
      const a = new Float32Array(2048); X._an.getFloatTimeDomainData(a);
      let s = 0; for (let i = 0; i < a.length; i++) s += a[i] * a[i];
      return Math.sqrt(s / a.length);
    } catch (e) { return 0; }
  }
  function watch(rec, dur, outG, inG) {
    rec.peak = 0; rec.min = 9; rec.overlap = 0; rec.silent = 0; rec.samples = 0;
    const tEnd = Date.now() + (dur + 0.4) * 1000;
    const iv = setInterval(() => {
      const rms = analyserRms();
      rec.peak = Math.max(rec.peak, rms);
      rec.min = Math.min(rec.min, rms);
      rec.samples++;
      if (rms < 0.0008) rec.silent++;
      let go = 0, gi = 0;
      try { go = outG && outG.gain ? outG.gain.value : 0; } catch (e) { }
      try { gi = inG && inG.gain ? inG.gain.value : 0; } catch (e) { }
      if (go > 0.04 && gi > 0.04) rec.overlap += 0.05;
      if (Date.now() > tEnd) {
        clearInterval(iv);
        rec.peak = +rec.peak.toFixed(4);
        rec.min = +rec.min.toFixed(4);
        rec.overlap = +rec.overlap.toFixed(2);
        rec.silentMs = rec.silent * 50;
      }
    }, 50);
  }

  function goTo(name, typ_, fromFm, delay, useIx) {
    const buf = SFX.buf[name]; if (!buf) return false;
    const c = SFX.ctx, t0 = now() + Math.max(0.02, delay || 0);
    const dur = xfDur(typ_);
    const vol = volOf(name);
    const off = resumeOff(name, fromFm, buf);
    remember(fromFm);
    fadeOut(fromFm, t0, dur, fromFm && fromFm.g && fromFm.g.gain.value);
    const fm = startTrack(name, buf, t0, dur, vol, off);
    SFX.fm = fm;
    const rec = { t: +t0.toFixed(2), typ: typ_, from: fromFm && fromFm.name, to: name, xf: dur, off: +off.toFixed(3), ix: null, reason: X.reason || typ_ };
    watch(rec, dur, fromFm && fromFm.g, fm.g);
    L(rec);
    X.holdUntil = t0 + dur * 0.55;
    X.curveUntil = t0 + dur + 0.08;
    X.holdName = name;
    X.reason = '';
    return true;
  }
  function goIxThen(dest, typ_, fromFm) {
    const id = ixNameFor(typ_, dest);
    const ib = ixBuf(id);
    if (!ib) return goTo(dest, typ_, fromFm, 0, false);
    const dur = xfDur(typ_);
    const t0 = now() + 0.02;
    const ixName = 'trk:m19_' + id;
    remember(fromFm);
    fadeOut(fromFm, t0, dur, fromFm && fromFm.g && fromFm.g.gain.value);
    const vol = (IX[id] && IX[id].vol) || 0.5;
    const ifm = startTrack(ixName, ib, t0, Math.min(1.6, dur), vol, 0);
    SFX.fm = ifm;
    const rec = { t: +t0.toFixed(2), typ: typ_, from: fromFm && fromFm.name, to: dest, xf: dur, off: 0, ix: id, ixDur: +ib.duration.toFixed(2), reason: X.reason || typ_ };
    watch(rec, dur + ib.duration, fromFm && fromFm.g, ifm.g);
    L(rec);
    // hold until the bed is near its end, then xfade into the destination
    const bed = Math.max(4, ib.duration - dur);
    X.holdUntil = t0 + bed;
    X.curveUntil = t0 + dur + 0.08;
    X.holdName = dest;
    X.pending = dest;
    X.reason = '';
    const wait = Math.max(0.2, bed - 0.05);
    setTimeout(() => {
      try {
        // cancelled by a *different* urgent track
        if (!X.pending) return;
        // re-query musicWant so a remap (m13e / m16) that landed mid-bed is honored
        let next = X.pending;
        try {
          const w = SFX.musicWant(!!(SFX.mus && SFX.mus.boss));
          if (w && SFX.buf[w]) next = w;
        } catch (e) { }
        if (!SFX.buf[next]) { X.pending = null; return; }
        const stillIx = SFX.fm && isIx(SFX.fm.name);
        goTo(next, typ(SFX.fm && SFX.fm.name, next), stillIx ? SFX.fm : SFX.fm, 0, false);
        X.pending = null;
      } catch (e) { M19.err = M19.err || String(e); X.err.push(String(e)); }
    }, wait * 1000);
    return true;
  }

  function loopForCurrentSting() {
    if (!window.M16_MAP || !M16_MAP.boss) return null;
    let p = null;
    try { p = M16.where && M16.where().place; } catch (e) { }
    const key = p === 'chapel' ? 'baron' : p;
    const pair = (key != null && M16_MAP.boss[key]) || M16_MAP.boss[SFX.bossKey];
    return pair && pair[1] ? 'trk:m16_' + pair[1] : null;
  }
  function maybeLandLoop() {
    const fm = SFX.fm; if (!fm || !fm.v || !fm.v.length) return;
    const k = bare(fm.name); if (!STINGS[k] || !window.M16_SEGS || !M16_SEGS[k]) return;
    if (X.armedLoop) return;
    const v = fm.v[fm.v.length - 1];
    const body = M16_SEGS[k][2];
    const remain = v.t0 + body - now();
    if (remain > 2.15 || remain < -0.5) return;
    const loop = loopForCurrentSting();
    if (!loop || !SFX.buf[loop]) return;
    X.armedLoop = loop;
    const grid = M16_SEGS[k][5];
    const delay = waitBar(fm, grid);
    goTo(loop, 'fight', fm, delay, false);
  }

  const urgent = (want) => {
    const t = typ(SFX.fm && SFX.fm.name, want);
    return t === 'sting' || t === 'fight' || t === 'results' || t === 'title' || t === 'victory';
  };

  // honor start offsets even if the theme module is off
  const _mv = SFX.musVoice;
  SFX.musVoice = function (fm, t0) {
    const off = fm && fm.off || 0;
    if (!off) return _mv.call(this, fm, t0);
    const c = this.ctx, s = c.createBufferSource(); s.buffer = fm.buf;
    const g = c.createGain(); g.gain.value = 0;
    s.connect(g); g.connect(fm.g); s.start(t0, off);
    const v = { s, g, t0, next: false, off }; fm.v.push(v); return v;
  };

  const _fm = SFX.fileMusic;
  SFX.fileMusic = function (boss) {
    try {
      const want = this.musicWant(boss);
      const fm = this.fm;
      // same track (including title groove loop) — leave existing seam logic alone,
      // but never call through mid-curve (setTargetAtTime cannot overlap a value curve).
      if (fm && want && fm.name === want) {
        if (X.curveUntil && now() < X.curveUntil) return true;
        curveClear(fm);
        try { return _fm.call(this, boss); } catch (e) { X.err.push('same ' + e); return true; }
      }
      if (!want) {
        if (fm) fadeOut(fm, now(), 1.0, fm.g && fm.g.gain.value);
        this.fm = null; X.pending = null; X.holdName = null; return false;
      }
      if (!this.buf[want]) {
        try { return _fm.call(this, boss); } catch (e) { X.err.push('miss ' + e); return false; }
      }

      // sting is mid-bed: land the loop early (2s equal-power, downbeat)
      maybeLandLoop();
      if (X.armedLoop && want === X.armedLoop && fm && fm.name === want) { X.armedLoop = null; return true; }

      // hold: don't interrupt an in-flight interlude/xfade unless a *different* urgent track arrives
      if (X.pending && want === X.pending) return true;
      if (X.holdUntil && now() < X.holdUntil && !(urgent(want) && want !== X.holdName)) {
        // remember a remapped (or later) destination so the bed lands on the current want
        if (want && !isIx(want)) { X.pending = want; X.holdName = want; }
        return true;
      }
      if (X.pending && want !== X.pending && !urgent(want) && isIx(fm && fm.name)) return true;
      if (urgent(want) && X.pending && want !== X.pending) X.pending = null;

      // cold start (tests often null fm): gentle fade-in of the destination, no interlude
      if (!fm) {
        const t = typ(null, want);
        return goTo(want, t, null, 0, false);
      }

      const t = typ(fm.name, want);
      const ixOk = usesIx(t) && !!ixBuf(ixNameFor(t, want));
      // only bed an interlude when something is already playing (real switch, not a test reset)
      if (ixOk && !isIx(fm.name)) return goIxThen(want, t, fm);
      const delay = (t === 'sting' || t === 'fight' || t === 'combat' || t === 'explore') ? waitBar(fm, t === 'sting' ? beatOf(fm.name) : barOf(fm.name)) : 0;
      return goTo(want, t, fm, delay, false);
    } catch (e) {
      M19.err = M19.err || String(e && e.stack || e);
      X.err.push(String(e && e.stack || e));
      try { curveClear(this.fm); } catch (e2) { }
      return true;
    }
  };

  // scene tags so the log knows why a switch happened
  function tag(name, reason) {
    if (typeof window[name] !== 'function') return;
    const _f = window[name];
    window[name] = function () { if (M19.mxfade) X.reason = reason; return _f.apply(this, arguments); };
  }
  tag('nextStage', 'stage');
  tag('enterHub', 'hub');
  tag('leaveHubForRun', 'hub-leave');
  if (typeof startResults === 'function') tag('startResults', 'results');

  X.typ = typ; X.ixBuf = ixBuf; X.preload = preload;
  X.where = () => ({ on: X.on, last: X.last, n: X.log.length, loaded: Object.keys(X.loaded), pending: X.pending, err: X.err.slice(), hold: X.holdName });
})();
