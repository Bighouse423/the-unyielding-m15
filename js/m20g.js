// ===== m20g: polish pass on m20f (score push; perf deferred by the user's call).
// Kill switches: ?m20g=0 (all), ?toastq=0 (one centre message at a time + stale/stage-carry toasts dropped),
// ?bossmus3=0 (m20f boss rotation), ?stairfix=0 (first-hub "A STAIR OPENS" waits for a clear screen; big banners park toasts),
// ?musq=0 (next stage song warms when the boss fight starts + short stage bridge), ?titlelean=0 (title/victory songs leave memory in a run).
(function () {
  const Q = location.search, off = k => new RegExp('[?&](' + k + '|m20g)=0').test(Q);
  const M = window.M20G = { on: !off('m20g'), toastq: !off('toastq'), bossmus3: !off('bossmus3'), stairfix: !off('stairfix'), musq: !off('musq'), titlelean: !off('titlelean'), n: { purged: 0, tRel: 0, tLoad: 0, shortBed: 0 }, err: [] };
  if (!M.on) { for (const k of ['toastq', 'bossmus3', 'stairfix', 'musq', 'titlelean']) M[k] = false; return; }
  const ER = (w, e) => { if (M.err.length < 20) M.err.push(w + ': ' + String(e && e.message || e)); };

  // ----- 1. toasts: a stage change drops the last stage's short status toasts still in the queue -----
  try {
    if (M.toastq && window.M9 && M9.on) M9.on('stage', () => {
      try {
        const q = window.M18 && M18.uiState && M18.uiState.toastQ; if (!q) return;
        for (let i = q.length - 1; i >= 0; i--) { const a = q[i]; if (!(a[3] > 3.2) && !/^"/.test(a[0] || '')) { q.splice(i, 1); M.n.purged++; } }
      } catch (e) { ER('purge', e); }
    });
    // entering the hub drops the run's queued status toasts too (the Abyss "DEPTH n ... WAITS" card was popping up in the Chapel)
    if (M.toastq && typeof enterHub === 'function') { const _eh = enterHub; enterHub = function () { try { const q = window.M18 && M18.uiState && M18.uiState.toastQ; if (q) for (let i = q.length - 1; i >= 0; i--) if (!/^"/.test(q[i][0] || '')) { q.splice(i, 1); M.n.purged++; } } catch (e) { ER('hubpurge', e); } return _eh.apply(this, arguments); }; }
  } catch (e) { ER('toastq', e); }

  // ----- 2. boss rotation: no two bosses in a row share a song, and no song comes back within 3 stages.
  // Boss-only songs (no normal-run stage song): bob = the user's Echoes of Battle original, mini = Shadow Theme cover,
  // boss = Shadow Blades cover, abyss = Corrupt cover (a stage song only down in the Abyss), bsb = the user's Shadow Blades original.
  // m20f had Shadow Blades (cover or original) on bosses 1, 5 and 6.
  try {
    if (M.bossmus3 && window.M16 && M16.boss2 && typeof M16_MAP !== 'undefined' && M16_MAP.boss) {
      const R = { 1: 'bob', 2: 'mini', 3: 'boss', 4: 'abyss', 5: 'mini', 6: 'bob', 7: 'bsb', 8: 'abyss', 9: 'bob', abyss: 'boss' };
      M.prevBoss = JSON.parse(JSON.stringify(M16_MAP.boss));
      for (const [k, loop] of Object.entries(R)) { const cur = M16_MAP.boss[k]; if (cur) M16_MAP.boss[k] = [cur[0] === 'mini_st' && loop !== 'mini' ? 'boss_st' : (loop === 'mini' ? 'mini_st' : cur[0]), loop]; }
      M.rot = R;
    }
  } catch (e) { ER('bossmus3', e); }

  // ----- 5. title / victory songs: decoded only when they can play (title screen; victory from stage 10 on) -----
  try {
    if (M.titlelean && typeof SFX !== 'undefined' && window.M15TH && M15TH.on) {
      const TR = 'trk:unyielding', VT = 'trk:unyielding_victory';
      const META = { [TR]: { vol: 0.62, xf: 0.9, b64: 'unyielding', files: ['title_unyielding.m4a', 'title_unyielding.mp3'] }, [VT]: { vol: 0.70, xf: 1.8, b64: 'victory', files: ['title_unyielding_victory.m4a', 'title_unyielding_victory.mp3'] } };
      const busy = {};
      const bytes = n => { const m = META[n], A = window.M15TH_AUDIO; if (A && A[m.b64]) { const bin = atob(A[m.b64]), u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return Promise.resolve(u.buffer); }
        const tryF = k => fetch('audio/' + m.files[k]).then(r => { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); }).catch(e => { if (k + 1 < m.files.length) return tryF(k + 1); throw e; }); return tryF(0); };
      const load = n => { if (SFX.buf[n] || busy[n] || !SFX.ctx) return; busy[n] = 1;
        bytes(n).then(ab => new Promise((ok, no) => SFX.ctx.decodeAudioData(ab, ok, no))).then(b => { busy[n] = 0; if (!want(n)) return; SFX.buf[n] = b; SFX.fileVol[n] = META[n].vol; SFX.fileXF[n] = META[n].xf; M.n.tLoad++;
          if (n === TR && typeof G !== 'undefined' && G.state === 'title') try { SFX.fileMusic(false); } catch (e) { } }).catch(e => { busy[n] = 0; ER('tload', e); }); };
      const inRun = () => typeof G !== 'undefined' && typeof RUN !== 'undefined' && RUN.on && G.state !== 'title';
      const want = n => { if (typeof G === 'undefined') return true; if (!inRun()) return true;   // title / menus: keep both
        if (n === VT) return (RUN.stage | 0) >= 10 || SFX.stageKey === 'victory' || G.state === 'victory'; return false; };
      let seen = false;
      const tick = () => {
        try {
          if (!SFX.ctx) return;
          if (SFX.buf[TR]) seen = true; if (!seen) return;   // m15th's first decode still in flight
          const playing = SFX.fm && SFX.fm.name;
          for (const n of [TR, VT]) {
            if (want(n)) { load(n); continue; }
            if (SFX.buf[n] && playing !== n) {
              if (n === TR) try { const X = window.M19 && M19.xf; if (X && X.ixBuf) X.ixBuf('ix_theme'); } catch (e) { }   // keep the 9 s bridge slice
              delete SFX.buf[n]; M.n.tRel++;
            }
          }
        } catch (e) { ER('ttick', e); }
      };
      M.titleTick = tick; setInterval(tick, 1000);
    }
  } catch (e) { ER('titlelean', e); }
})();
