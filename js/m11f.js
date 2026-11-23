// M11f - input buffer through hit-stop. The frame loop skips update() while G.hitstop > 0 and then clears this
// frame's presses, so a click / block / dodge pressed during a freeze was lost. m11 has more and longer hit-stops,
// so presses made while frozen are held (up to 0.25 s) and handed to the first real update. Off with ?m11=0.
(function () {
  const M11 = window.M11; if (!M11 || !M11.on) return;
  let ran = false, bufK = {}, bufM = [false, false, false], age = 0;
  const _up = update;
  update = function (dt) {
    ran = true;
    if (age > 0) { for (const k in bufK) if (!KP[k]) KP[k] = true; for (let i = 0; i < 3; i++) if (bufM[i]) MBP[i] = true; bufK = {}; bufM = [false, false, false]; age = 0; }
    return _up.apply(this, arguments);
  };
  const _r = render;
  render = function (rdt) {
    try {
      if (G.state === 'play' && !G.paused && !ran) {
        let any = false;
        for (const k in KP) if (KP[k] && k !== 'Escape' && k !== 'PadStart') { bufK[k] = true; any = true; }
        for (let i = 0; i < 3; i++) if (MBP[i]) { bufM[i] = true; any = true; }
        if (any && age === 0) age = 1e-6;
      }
      if (age > 0) { age += rdt || 0.016; if (age > 0.25 || G.state !== 'play') { bufK = {}; bufM = [false, false, false]; age = 0; } }
    } catch (e) { }
    ran = false;
    return _r.apply(this, arguments);
  };
})();
