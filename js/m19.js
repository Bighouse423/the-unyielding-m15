// ===== m19: music fades, 20-run economy, mobile fullscreen (controller only).
// ?m19=0 disables the whole pass. Per-feature: ?mxfade=0 ?econ=0 ?mobile=0 ?rndsecret=0
// ?prices=0 still restores the pre-m17/m18 price table and skips m19 prices.
(function () {
  const q = location.search || '';
  const off = /[?&]m19=0(?:&|$)/.test(q);
  const on = (key) => !off && !new RegExp('[?&]' + key + '=0(?:&|$)').test(q);
  window.M19 = {
    on: !off,
    mxfade: on('mxfade'),
    econ: on('econ') && !/[?&]prices=0(?:&|$)/.test(q),
    tithe: on('econ'), // death-depth credit even if prices=0, unless econ/m19 off
    mobile: on('mobile'),
    rndsecret: on('rndsecret'),
    err: null,
    note: 'm19 fades + 20-run shop + mobile + random secrets'
  };
})();
