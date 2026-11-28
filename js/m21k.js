// ===== m21k: combat SFX variation widen + short music duck on swing / hit / parry.
// Kill: ?m21k=0 / ?m21=0 | ?sfxvar=0 | ?musduck=0
// Samples already had mild +-6% rate / +-10% vol in playBuf, and only stingers ducked music.
// This widens combat one-shots to +-10% rate and adds a brief, light music dip so hits punch
// through the bed. Existing sfxMeta.duck (intros, death, clears, secrets) is left alone.
// Hands, pixels, damage, timings, and default volumes are unchanged. No new assets.
(function () {
  const Q = new URLSearchParams(location.search);
  const off = Q.get('m21k') === '0' || Q.get('m21') === '0';
  const on = k => !off && Q.get(k) !== '0';
  const M = window.M21K = {
    on: !off, sfxvar: on('sfxvar'), musduck: on('musduck'),
    n: { svar: 0, duck: 0 }, err: [], ready: 0, hooked: 0
  };
  function fail(tag, e) { M.err.push(tag + ': ' + (e && e.message ? e.message : e)); }
  M.st = () => ({
    on: M.on, sfxvar: M.sfxvar, musduck: M.musduck,
    n: Object.assign({}, M.n), err: M.err.slice(), hooked: !!M.hooked
  });
  if (off) { M.ready = 1; return; }

  const VAR = {
    swing: 1, swingH: 1, hit: 1, heavy: 1, whip: 1, block: 1, parry: 1,
    pistol: 1, fire: 1, hurt: 1, dodge: 1, windup: 1, gib: 1, glint: 1,
    swing_axe: 1, swing_great: 1, swing_void: 1
  };
  const DUCK = {
    swing: 1, swingH: 1, hit: 1, heavy: 1, parry: 1,
    whip: 1, pistol: 1, block: 1, finisher: 1
  };
  const DUCK_LVL = 0.76;
  const rnd = () => (typeof ARND === 'function' ? ARND() : Math.random());
  function baseName(name) {
    return (typeof name === 'string' && name.indexOf('m12_') === 0) ? name.slice(4) : name;
  }
  function willBuf(sfx, name) {
    if (!sfx || !sfx.buf || typeof name !== 'string') return false;
    if (sfx.buf[name]) return true;
    return !!(sfx.buf['m12_' + name] && !sfx.buf[name]);
  }

  function duckMus() {
    try {
      const sfx = window.SFX;
      if (!sfx || !sfx.musBus || !sfx.ctx) return;
      const t = sfx.ctx.currentTime;
      const mg = sfx.musBus.gain;
      mg.cancelScheduledValues(t);
      mg.setTargetAtTime(DUCK_LVL, t, 0.05);
      mg.setTargetAtTime(1, t + 0.22, 0.28);
    } catch (e) { fail('dm', e); }
  }

  function hookPlayBuf() {
    if (typeof SFX === 'undefined' || typeof SFX.playBuf !== 'function' || SFX.playBuf._m21k) return;
    const _pb = SFX.playBuf;
    SFX.playBuf = function (name, vol) {
      const meta = (this.sfxMeta && this.sfxMeta[name]) || null;
      const prevPv = this.pv;
      let ducked = false, prevDuck;
      try {
        if (M.sfxvar && VAR[baseName(name)] && !(meta && meta.fixed)) {
          this.pv = 0.90 + rnd() * 0.20;
          M.n.svar++;
        }
        if (M.musduck && DUCK[baseName(name)] && meta && !meta.duck) {
          prevDuck = meta.duck;
          meta.duck = DUCK_LVL;
          ducked = true;
          M.n.duck++;
        } else if (M.musduck && DUCK[baseName(name)] && !meta) {
          duckMus();
          M.n.duck++;
        }
        return _pb.apply(this, arguments);
      } catch (e) {
        fail('pb', e);
        return _pb.apply(this, arguments);
      } finally {
        this.pv = prevPv;
        if (ducked && meta) meta.duck = prevDuck;
      }
    };
    SFX.playBuf._m21k = 1; M.hooked = 1;
  }

  function hookPlay() {
    if (typeof SFX === 'undefined' || typeof SFX.play !== 'function' || SFX.play._m21k) return;
    const _pl = SFX.play;
    SFX.play = function (name, vol) {
      try {
        const key = baseName(name);
        const sampled = willBuf(this, name);
        // synth fallback: existing play() already varies some names; count it so the hook is live before samples decode
        if (!sampled && M.sfxvar && VAR[key]) M.n.svar++;
        if (!sampled && M.musduck && DUCK[key]) {
          duckMus();
          M.n.duck++;
        }
      } catch (e) { fail('pl', e); }
      return _pl.apply(this, arguments);
    };
    SFX.play._m21k = 1;
  }

  try { hookPlayBuf(); hookPlay(); } catch (e) { fail('hook', e); }
  M.ready = 1;
  setTimeout(function () {
    try { hookPlayBuf(); hookPlay(); M.ready = 1; } catch (e) { fail('late', e); }
  }, 0);
})();
