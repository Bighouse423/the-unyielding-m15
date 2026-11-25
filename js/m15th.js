// ===== m15th (m15d): Bighouse "the unyielding" as the title / main-menu theme =====
// The file is a copy of music/suno/main_theme.mp3 (the original is never moved or edited). ?theme=0
// restores m15c: title and the Chapel stay on the Bighouse theme, victory/credits stay on the
// m13e calm Recording section (rc_calm).
// Loop (found by onset/tempo + seam search): 133.33 BPM, bar 1.800s. The first play starts at 0
// (the opening), then the main groove loops 16.401 -> 45.160 (16 bars) with a 2-beat equal-power
// crossfade. Victory/credits uses the calm opening (title_unyielding_victory). The stage card is
// left alone — a sting would sit on top of the stage song and muddy it.
(function () {
  const TH = window.M15TH = { on: false, err: null, loop: { start: 16.401, end: 45.160, xf: 0.9 } };
  if (/[?&]theme=0/.test(location.search) || typeof SFX === 'undefined') return;
  TH.on = true;
  const L = TH.loop, TRACK = 'trk:unyielding', VTRACK = 'trk:unyielding_victory';
  try {
    const _slots = SFX.musicSlots;
    SFX.musicSlots = function (boss) {
      const base = _slots.call(this, boss);
      const M = this.musicMap || (this.musicMap = {});
      M.title = 'unyielding';
      const sk = this.stageKey, victory = (typeof G !== 'undefined' && G.state === 'victory') || sk === 'victory';
      if (victory && this.buf[VTRACK]) {
        M.m15th_victory = 'unyielding_victory';
        return ['m15th_victory'].concat(base.filter(s => s !== 'm13e'));
      }
      return base;
    };

    const _mv = SFX.musVoice;
    SFX.musVoice = function (fm, t0) {
      const off = fm.off || 0;
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
        if (want !== TRACK || !this.buf[TRACK]) return _fm.call(this, boss);
        const c = this.ctx, now = c.currentTime;
        const vol = n => (this.muted || !this.musicOn ? 0 : (this.fileVol[n] ?? 0.5));
        const fadeOut = (fm, tc) => { if (!fm) return; fm.g.gain.cancelScheduledValues(now); fm.g.gain.setTargetAtTime(0, now, tc); for (const v of fm.v) setTimeout(() => { try { v.s.stop(); } catch (e) { } }, tc * 6000); };
        const XF = L.xf, body = L.end - L.start;
        if (this.fm && this.fm.name === want) {
          const fm = this.fm; fm.g.gain.setTargetAtTime(vol(want), now, 0.25);
          const cur = fm.v[fm.v.length - 1];
          const dur = (cur.off ? body : L.end - (cur.off || 0));
          if (!cur.next && now > cur.t0 + dur - XF - 1.0) {
            const t1 = cur.t0 + dur - XF; cur.next = true;
            fm.off = L.start;
            const nv = this.musVoice(fm, t1);
            fm.off = 0;
            const N = 16, cu = new Float32Array(N), cd = new Float32Array(N);
            for (let i = 0; i < N; i++) { const x = i / (N - 1); cu[i] = Math.sin(x * Math.PI / 2); cd[i] = Math.cos(x * Math.PI / 2); }
            nv.g.gain.setValueCurveAtTime(cu, t1, XF); cur.g.gain.setValueCurveAtTime(cd, t1, XF);
            setTimeout(() => { try { cur.s.stop(); } catch (e) { } fm.v = fm.v.filter(v => v !== cur); }, (t1 - now + XF + 0.5) * 1000);
          }
          return true;
        }
        if (this.fm) fadeOut(this.fm, this.xfOut ?? 0.6);
        const g = c.createGain(); g.gain.value = 0.0001; g.connect(this.musBus || this.master);
        const buf = this.buf[want], fm = { name: want, g, buf, v: [], xf: XF, off: 0 };
        const v0 = this.musVoice(fm, now + 0.05); v0.g.gain.value = 1;
        g.gain.setTargetAtTime(vol(want), now, this.xfIn ?? 0.7);
        this.fm = fm; return true;
      } catch (e) { TH.err = String(e && e.stack || e); return _fm.call(this, boss); }
    };
  } catch (e) { TH.err = String(e && e.stack || e); }
})();
