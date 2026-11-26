// ===== m19.5 hotfix: smooth 60fps+ everywhere, weapon fx that never vanish, music that never dies,
// iPhone home-screen fullscreen, and a lighting/graphics boost (overlays + lighting only, hands locked).
// ?m195=0 disables the whole pass. Per-feature: ?perf2=0 ?gov=0 ?fxfix=0 ?audiofix=0 ?gfx2=0 ?pwa=0 ?sky2=0
(function () {
  const q = location.search || '';
  const off = /[?&]m195=0(?:&|$)/.test(q);
  const on = (key) => !off && !new RegExp('[?&]' + key + '=0(?:&|$)').test(q);
  window.M195 = {
    on: !off,
    perf2: on('perf2'),     // exact-output speedups (flicker, text cache, streaks, lum probe, backing store)
    gov: on('gov'),         // frame-time governor that sheds atmosphere/backing store, never weapon fx
    fxfix: on('fxfix'),     // weapon fx are exempt from the GFX governor
    audiofix: on('audiofix'),
    gfx2: on('gfx2'),
    sky2: on('sky2') && on('gfx2'),
    pwa: on('pwa'),
    err: null, errs: [],
    note: 'm19.5 perf + fx + audio + pwa + gfx2'
  };
  M195.fail = (where, e) => { const s = where + ': ' + String(e && e.stack || e).slice(0, 300); if (!M195.err) M195.err = s; if (M195.errs.length < 20) M195.errs.push(s); };
})();
