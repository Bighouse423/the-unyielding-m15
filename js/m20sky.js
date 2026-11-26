// ===== m20sky: open-air courtyards on enclosed stages so the m18 skies stop being slits.
// One or two big path rooms per stage lose their roof (SKY + open ceiling); walls seen from an open cell read 3.6 tall with sky above
// (engine OPENW). Uses its own RNG stream (never Math.random), so everything else about the stage is unchanged. ?skyopen=0 / ?skyfix=0 / ?m20=0
(function () {
  if (!window.M20 || !M20.on) return;
  const S = M20.sky = { on: !!M20.skyopen, rooms: [], last: null };
  // themes that get courtyards (count) and the moonlight tint for the room
  const OPEN = { ossuary: [1, [1.0, 0.35, 0.4]], belfry: [2, [0.6, 0.6, 0.9]], arena: [2, [1.0, 0.55, 0.3]], kennels: [1, [1.0, 0.45, 0.25]], cathedral: [2, [0.55, 0.55, 1.0]], crypt: [0, null] };
  const setOW = v => { try { if (typeof OPENW !== 'undefined') OPENW = v; } catch (e) { } };
  function themeKey(th) {
    try { if (RUN && RUN.cfg && RUN.cfg.theme) return RUN.cfg.theme; } catch (e) { }
    return (th && (th.variant || th.music)) || '';
  }
  function post(th, seed) {
    S.rooms = []; S.last = null;
    if (!S.on || !LEVEL || !LEVEL.rooms || LEVEL.wallH < 10) return;   // already open-sky (courtyard / necropolis / throne / abyss)
    if (RUN && RUN.cfg && RUN.cfg.abyss) return;
    const k = themeKey(th), spec = OPEN[k]; if (!spec || !spec[0]) return;
    const R = M20.rng(M20.fnv('skyopen:' + (seed | 0) + ':' + k));
    const st = LEVEL.start, el = LEVEL.eliteRoom;
    const inR = (r, x, y) => x >= r.x0 - 0.5 && x <= r.x1 + 1.5 && y >= r.y0 - 0.5 && y <= r.y1 + 1.5;
    let cand = LEVEL.rooms.filter(r => r.kind === 'path' && !(st && inR(r, st.x, st.y)) && !(el && el.box && r.x0 >= el.box[0] && r.x1 < el.box[2] && r.y0 >= el.box[1] && r.y1 < el.box[3]));
    cand.sort((a, b) => (b.x1 - b.x0 + 1) * (b.y1 - b.y0 + 1) - (a.x1 - a.x0 + 1) * (a.y1 - a.y0 + 1));
    cand = cand.slice(0, 4);
    const n = Math.min(spec[0], cand.length);
    for (let i = 0; i < n; i++) {
      const j = Math.floor(R() * cand.length), r = cand.splice(j, 1)[0];
      let cells = 0;
      for (let y = r.y0; y <= r.y1; y++) for (let x = r.x0; x <= r.x1; x++) {
        const c = y * MW + x; if (SOLID[c]) continue;
        SKY[c] = 1; CH[c] = 99; cells++;
      }
      // door mouths: the corridor cell just outside each wall opening opens too, so the roof edge isn't a hard lip
      for (let y = r.y0 - 1; y <= r.y1 + 1; y++) for (let x = r.x0 - 1; x <= r.x1 + 1; x++) {
        if (x >= r.x0 && x <= r.x1 && y >= r.y0 && y <= r.y1) continue;
        const c = y * MW + x; if (c < 0 || c >= MW * MH || SOLID[c]) continue; SKY[c] = 1; CH[c] = 99;
      }
      const cx = (r.x0 + r.x1 + 1) / 2, cy = (r.y0 + r.y1 + 1) / 2;
      S.rooms.push({ x0: r.x0, y0: r.y0, x1: r.x1, y1: r.y1, cx, cy, cells });
      if (spec[1] && LEVEL.lights) LEVEL.lights.push({ x: cx, y: cy, r: Math.max(5, (r.x1 - r.x0 + r.y1 - r.y0) / 2 + 2), i: 0.55, c: spec[1], m20sky: 1 });
    }
    if (S.rooms.length) {
      setOW(3.2);
      try { buildLightmap(LEVEL.lights, (th && th.ambient) || [0.34, 0.4, 0.36]); } catch (e) { M20.fail('skyLM', e); }
      LEVEL.m20sky = S.rooms.map(r => [r.x0, r.y0, r.x1, r.y1]);
    }
    S.last = { theme: k, rooms: S.rooms.length };
  }
  if (typeof buildCrypt === 'function') {
    const _bc = buildCrypt;
    buildCrypt = function (theme, seed) {
      setOW(0);
      const r = _bc.apply(this, arguments);
      try { post(theme, seed); } catch (e) { M20.fail('skyopen', e); }
      return r;
    };
  }
  for (const nm of ['buildLevel', 'buildChapel']) {
    if (typeof window[nm] !== 'function') continue;
    const f = window[nm];
    window[nm] = function () { setOW(0); return f.apply(this, arguments); };
  }
  S.post = post; S.setOW = setOW;
})();
