// ===== m18: master flags. ?m18=0 disables the whole pass. Per-feature: ?grace=0 ?runsave=0 ?perf=0 ?wpn=0 ?m18pr=0 ?diff=0 ?ui=0 ?bossmus=0 ?sky=0 ?ceil=0
(function () {
  const q = location.search || '';
  const off = /[?&]m18=0(?:&|$)/.test(q);
  const on = (key) => !off && !new RegExp('[?&]' + key + '=0(?:&|$)').test(q);
  window.M18 = {
    on: !off,
    grace: on('grace'),
    runsave: on('runsave'),
    perf: on('perf'),
    wpn: on('wpn'),
    prices: on('m18pr') && !/[?&]prices=0(?:&|$)/.test(q),
    diff: on('diff'),
    ui: on('ui'),
    bossmus: on('bossmus'),
    sky: on('sky'),
    ceil: on('ceil') && on('sky'),
    err: null,
    note: 'm18 playtest fix pass'
  };
})();
