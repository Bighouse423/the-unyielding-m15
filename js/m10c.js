// ===== M10c: a deeper story =====
// Longer prologue and epilogue, plus a chapter card the first time each stage theme is reached (once per save, listed in
// Codex > STORY). Scenes stay skipped under automation unless ?scenes=1 (same rule as m9). ?ch=N previews chapter N's card.
(function () {
  if (typeof M9 === 'undefined' || !M9.SCENES) return;
  const S = () => SAVE.m9;
  const SC = M9.SCENES;
  // ----- the prologue: 3 panels -> 7 -----
  SC.intro = [
    SC.intro[0],
    { art: 'm10_reliq', lines: ['Inside the Reliquary: the last sunrise, folded small as a coin.', 'Without it, the dead forget that they are dead.'] },
    SC.intro[1],
    { art: 'm10_banner', lines: ['Kael rode for the Lich once. First knight of the Black Court.', 'Then he burned his own banner on the cathedral steps.'] },
    { art: 'm10_pyre', lines: ['The Lich has been killing him ever since.', 'It keeps not taking.'] },
    SC.intro[2],
    { art: 'm10_stair', lines: ['The Chapel holds the last lit candle in the world.', 'Below it, the way down. Every death, back to the candle.'] },
  ];
  // ----- the epilogue: 3 panels -> 6 -----
  SC.ending = [
    SC.ending[0],
    { art: 'm10_lichfall', lines: ['"You were mine, Kael." The voice is dust now, and fading.', '"I was nobody\'s," says the Baron. "Not even death\'s."'] },
    SC.ending[1],
    { art: 'm10_candles', lines: ['In the Chapel, ten candles light themselves: one for', 'every lieutenant who will not be getting up again.'] },
    { art: 'm10_shadow', lines: ['The pilgrims step outside and see their own shadows.', 'Some of them weep. Some of them, finally, lie down.'] },
    SC.ending[2],
  ];
  // ----- chapter cards, keyed by stage theme -----
  const CH = {
    nave: ['The bells still ring for mass. No living hand pulls the ropes.', 'The Vampire Knight keeps the nave. He was the first to kneel.'],
    witch: ['Green fire in the sconces. Every saint\'s face scratched away.', 'Someone in this hall has been praying to the wrong thing.'],
    blood: ['The moon came through the windows and never left.', 'The Vampire Knight is drunk on it. Drunk men swing wide.'],
    crypt: ['The monks buried their own down here. Then the plague.', 'Something with too many legs has been moving the bones.'],
    ossuary: ['Ten thousand skulls in the walls, all facing the door.', 'They are not decorations. They are an audience.'],
    courtyard: ['Hedges, statues, and a fountain that runs red.', 'The Alpha hunts here. He remembers being a man. No regrets.'],
    belfry: ['The great bell waits to ring the day the Lich falls.', 'The gargoyles roost on it. Their Matriarch wants it silent.'],
    arena: ['The dead fill the seats and knock their jaws. It sounds like rain.', 'The Minotaur has never fought a man who would not stay down.'],
    necropolis: ['Mausoleums row on row, every door open, bog-light for lanterns.', 'Morwen keeps the ledger. Beside your name: not for sale.'],
    kennels: ['The forges never cool. The chains are as thick as a man.', 'Cerberax was a queen\'s lapdog. The queen died. He kept eating.'],
    cathedral: ['Glass on the floor, storm in the rafters, the faithful kneeling.', 'Sir Valcor guards the throne until the last king dies. He waits.'],
    throne: ['No more lieutenants. No more doors. Only the stair, and the cold.', 'He has been waiting at the top since you burned the banner.'],
  };
  const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
  const keyOf = th => th ? (th.variant || Object.keys(THEMES).find(k => THEMES[k] === th) || 'nave') : 'nave';
  function chapterScene(stage, th) {
    const k = keyOf(th), L = CH[k] || CH.nave;
    return [{ art: 'm10_chapter', ch: stage, th: k, title: 'CHAPTER ' + ROMAN[stage] + '  -  ' + ((th && th.name) || ''), boss: th && th.boss, haze: (th && th.haze) || [150, 80, 170], lines: L }];
  }
  M10.chapters = CH;
  const auto = () => navigator.webdriver && !/[?&]scenes=1/.test(location.search);
  M9.on('stage', () => {
    if (!RUN.on || RUN.hub || !(RUN.stage >= 1 && RUN.stage <= 10)) return;
    const th = curTheme(), k = keyOf(th); S().m10ch = S().m10ch || {};
    if (S().m10ch[k] || auto()) return;
    const st = RUN.stage;
    setTimeout(() => {
      if (G.state !== 'play' || OPT.open || RUN.stage !== st) return;
      S().m10ch[k] = st; M9.write();
      SC['m10ch_' + k] = chapterScene(st, th); M9.openScene('m10ch_' + k);
    }, 900);
  });
  // codex STORY rows: one per chapter seen (m9.js reads M9.storyRows when it exists)
  M9.storyRows = function () {
    const seen = S().m10ch || {}, out = [];
    for (const k of Object.keys(seen).sort((a, b) => seen[a] - seen[b])) {
      const th = THEMES[k] || Object.values(THEMES).find(t => t.variant === k); if (!th) continue;
      SC['m10ch_' + k] = chapterScene(seen[k], th);
      out.push({ s: 'm10ch_' + k, n: 'CHAPTER ' + ROMAN[seen[k]] + ': ' + th.name, ok: true });
    }
    return out;
  };
  // preview: ?ch=N opens chapter N's card for the current run (screenshots)
  const pv = (location.search.match(/[?&]ch=(\d+)/) || [])[1];
  if (pv) M10.previewChapter = () => { const th = curTheme(); SC.m10ch_pv = chapterScene(+pv, th); M9.openScene('m10ch_pv'); };

  // ----- panel art (drawn over m9's panel area: x 20..460, y 14..200, origin shifted 14 down) -----
  const TAU2 = Math.PI * 2;
  const grad = (ctx, a, b) => { const g = ctx.createLinearGradient(0, 0, 0, 186); g.addColorStop(0, a); g.addColorStop(1, b); ctx.fillStyle = g; ctx.fillRect(0, 0, W, 186); };
  const motes = (ctx, t, n, col, up) => { for (let i = 0; i < n; i++) { const y = up ? 186 - ((t * (14 + i % 6 * 5) + i * 31) % 186) : (t * (10 + i % 5 * 4) + i * 29) % 186, x = (i * 53 + Math.sin(t * 0.8 + i) * 6) % W; ctx.fillStyle = col(i); ctx.fillRect(Math.round(x), Math.round(y), 1, i % 4 ? 1 : 2); } };
  const ART = {
    m10_reliq(ctx, t) {
      grad(ctx, '#06000c', '#1c0628');
      const cx = W / 2, cy = 100, o = Math.min(1, t / 2.5);
      ctx.fillStyle = `rgba(255,220,140,${0.12 + 0.1 * o})`; ctx.beginPath(); ctx.arc(cx, cy - 6, 58 + Math.sin(t * 2) * 3, 0, TAU2); ctx.fill();
      for (let i = 0; i < 16; i++) { ctx.save(); ctx.translate(cx, cy - 10); ctx.rotate(i / 16 * TAU2 + t * 0.15); ctx.fillStyle = `rgba(255,230,160,${0.1 * o})`; ctx.fillRect(-1, -110, 2, 70); ctx.restore(); }
      ctx.fillStyle = '#1a0a10'; ctx.fillRect(cx - 40, cy + 6, 80, 40); ctx.fillStyle = '#3a1a20'; ctx.fillRect(cx - 38, cy + 8, 76, 4);
      ctx.fillStyle = '#e0b850'; for (const [x, y, w, h] of [[-40, 6, 80, 2], [-40, 44, 80, 2], [-40, 6, 2, 40], [38, 6, 2, 40], [-4, 14, 8, 10]]) ctx.fillRect(cx + x, cy + y, w, h);
      ctx.save(); ctx.translate(cx, cy + 6); ctx.rotate(-0.9 * o); ctx.fillStyle = '#2a1018'; ctx.fillRect(-40, -10, 80, 10); ctx.fillStyle = '#e0b850'; ctx.fillRect(-40, -10, 80, 2); ctx.restore();
      ctx.fillStyle = '#fff4c0'; ctx.beginPath(); ctx.arc(cx, cy - 2 - 10 * o, 6 + 2 * o, 0, TAU2); ctx.fill();
      motes(ctx, t, 26, i => i % 3 ? 'rgba(255,220,150,0.7)' : 'rgba(255,255,220,0.9)', true);
    },
    m10_banner(ctx, t) {
      grad(ctx, '#140008', '#3a0a18');
      ctx.fillStyle = '#0a0006'; ctx.fillRect(0, 150, W, 40); for (let i = 0; i < 6; i++) ctx.fillRect(60 + i * 64, 20, 22, 140);
      ctx.fillStyle = '#05000a'; ctx.fillRect(238, 30, 3, 130);
      const b = Math.min(1, t / 3);
      for (let y = 0; y < 70; y += 2) { if (y / 70 < b * 0.9 && (y * 7 + Math.floor(t * 9)) % 5) continue; const w = 40 - Math.abs(Math.sin(y * 0.3 + t * 3)) * 3; ctx.fillStyle = y % 6 ? '#2a1438' : '#40205a'; ctx.fillRect(241, 34 + y, w, 2); }
      ctx.fillStyle = '#90ffb0'; if (b < 0.5) { ctx.fillRect(256, 52, 8, 8); ctx.fillStyle = '#05000a'; ctx.fillRect(258, 54, 4, 4); }
      for (let i = 0; i < 40; i++) { const k = (t * 1.3 + i * 0.37) % 1.6, x = 250 + Math.sin(i * 2.1 + t * 2) * 20 * k, y = 34 + 70 * (1 - b) + 70 * b - k * 60 - (i % 7) * 4; if (y < 0) continue; ctx.fillStyle = i % 3 ? '#ff7a20' : '#ffd060'; ctx.fillRect(Math.round(x), Math.round(y), 2, 2 + (i % 2)); }
      ctx.fillStyle = `rgba(255,120,40,${0.15 + 0.05 * Math.sin(t * 9)})`; ctx.beginPath(); ctx.arc(260, 34 + 70 * b, 36, 0, TAU2); ctx.fill();
      const k = Engine.imgs.s_kael; if (k) { ctx.globalAlpha = 0.95; ctx.filter = 'brightness(0.18)'; const sc = 130 / k.height; ctx.drawImage(k, 120, 186 - 130, Math.round(k.width * sc), 130); ctx.filter = 'none'; ctx.globalAlpha = 1; }
    },
    m10_pyre(ctx, t) {
      grad(ctx, '#08000c', '#200818');
      for (let i = 0; i < 3; i++) { const x = 120 + i * 120, on = (t * 0.9) % 3 > i; ctx.fillStyle = '#2a1424'; ctx.fillRect(x - 14, 150, 28, 8); ctx.fillStyle = '#4a2a3a'; ctx.fillRect(x - 3, 110, 6, 40); ctx.fillRect(x - 12, 120, 24, 5);
        if (on) { ctx.fillStyle = 'rgba(144,255,176,0.25)'; ctx.beginPath(); ctx.arc(x, 128, 22 + Math.sin(t * 4 + i) * 2, 0, TAU2); ctx.fill(); ctx.fillStyle = '#90ffb0'; ctx.fillRect(x - 1, 98 - (t * 30 % 20), 2, 6); } }
      ctx.fillStyle = '#d8c8f0'; ctx.font = 'bold 1px monospace';
      for (let i = 0; i < 3; i++) { const x = 120 + i * 120, a = Math.max(0, Math.min(1, (t * 0.9) % 3 - i)); ctx.globalAlpha = a; ctx.fillStyle = '#ffe080'; ctx.fillRect(x - 10, 166, 20, 2); ctx.globalAlpha = 1; }
      const k = Engine.imgs.s_kael; if (k && t > 2.4) { const a = Math.min(1, (t - 2.4) / 0.8); ctx.globalAlpha = a; const sc = 120 / k.height; ctx.drawImage(k, Math.round(W / 2 - k.width * sc / 2), 186 - 120 + (1 - a) * 20, Math.round(k.width * sc), 120); ctx.globalAlpha = 1; }
      motes(ctx, t, 20, i => i % 2 ? 'rgba(144,255,176,0.6)' : 'rgba(200,170,255,0.5)', true);
    },
    m10_stair(ctx, t) {
      grad(ctx, '#0a0414', '#000000');
      ctx.fillStyle = 'rgba(255,200,120,0.18)'; ctx.beginPath(); ctx.arc(W / 2, 26, 30 + Math.sin(t * 5) * 2, 0, TAU2); ctx.fill();
      ctx.fillStyle = '#f0e0c0'; ctx.fillRect(W / 2 - 2, 22, 4, 12); ctx.fillStyle = '#ffd060'; ctx.fillRect(W / 2 - 1, 16 + Math.sin(t * 9), 2, 5);
      for (let i = 0; i < 12; i++) { const y = 46 + i * 12, w = 200 - i * 14, sh = 70 - i * 6; ctx.fillStyle = `rgb(${sh},${sh * 0.6 | 0},${sh + 20})`; ctx.fillRect(W / 2 - w / 2, y, w, 4); ctx.fillStyle = `rgb(${sh * 0.4 | 0},${sh * 0.2 | 0},${sh * 0.5 | 0})`; ctx.fillRect(W / 2 - w / 2, y + 4, w, 8); }
      const k = Engine.imgs.s_kael; if (k) { const p = (t * 0.12) % 1, s = 60 * (1 - p * 0.6), y = 60 + p * 90; ctx.globalAlpha = 1 - p; ctx.filter = 'brightness(0.3)'; ctx.drawImage(k, Math.round(W / 2 - k.width * s / k.height / 2), Math.round(y - s), Math.round(k.width * s / k.height), Math.round(s)); ctx.filter = 'none'; ctx.globalAlpha = 1; }
    },
    m10_lichfall(ctx, t) {
      grad(ctx, '#06000a', '#1a0626');
      const l = Engine.imgs.s_lich; const a = Math.max(0, 1 - t / 7);
      if (l) { const h = 150, w = l.width * h / l.height; ctx.globalAlpha = a; ctx.drawImage(l, Math.round(W / 2 - w / 2), 186 - h + t * 4, Math.round(w), h); ctx.globalAlpha = 1; }
      for (let i = 0; i < 90; i++) { const k = Math.min(1, t / 6), sx = W / 2 + ((i * 37) % 80 - 40), sy = 60 + (i * 53) % 110; const x = sx + Math.sin(i) * 60 * k + t * 10 * k, y = sy - k * 40 * ((i % 5) / 5); ctx.fillStyle = i % 3 ? `rgba(200,180,230,${0.8 * k})` : `rgba(144,255,176,${0.7 * k})`; ctx.fillRect(Math.round(x), Math.round(y), 1, 1); }
    },
    m10_candles(ctx, t) {
      grad(ctx, '#0c0612', '#2a1420');
      ctx.fillStyle = '#1a0c10'; ctx.fillRect(40, 140, 400, 10); ctx.fillStyle = '#3a2018'; ctx.fillRect(40, 140, 400, 2);
      for (let i = 0; i < 10; i++) { const x = 64 + i * 39, lit = t * 3 > i, hgt = 22 + (i % 3) * 6;
        ctx.fillStyle = '#e8dcc0'; ctx.fillRect(x - 3, 140 - hgt, 6, hgt); ctx.fillStyle = '#c8b898'; ctx.fillRect(x + 1, 140 - hgt, 2, hgt);
        if (lit) { const f = Math.sin(t * 11 + i * 2) * 1; ctx.fillStyle = 'rgba(255,200,110,0.22)'; ctx.beginPath(); ctx.arc(x, 140 - hgt - 6, 16, 0, TAU2); ctx.fill(); ctx.fillStyle = '#ffd060'; ctx.fillRect(x - 2, 140 - hgt - 9 + f, 4, 7); ctx.fillStyle = '#fff4d0'; ctx.fillRect(x - 1, 140 - hgt - 6 + f, 2, 3); } }
      motes(ctx, t, 18, () => 'rgba(255,220,160,0.5)', true);
    },
    m10_shadow(ctx, t) {
      const k = Math.min(1, t / 2.5); grad(ctx, `rgb(${120 + 100 * k | 0},${70 + 80 * k | 0},${90 + 30 * k | 0})`, '#ffd890');
      ctx.fillStyle = '#ffe9a8'; ctx.beginPath(); ctx.arc(70, 150, 30, 0, TAU2); ctx.fill();
      ctx.fillStyle = '#5a3830'; ctx.fillRect(0, 150, W, 40);
      for (let i = 0; i < 6; i++) { const x = 140 + i * 50, h = 30 + (i % 3) * 5; ctx.fillStyle = '#2a1820'; ctx.fillRect(x, 150 - h, 8, h); ctx.fillRect(x - 2, 150 - h - 6, 12, 7);
        ctx.fillStyle = `rgba(30,10,20,${0.5 * k})`; ctx.beginPath(); ctx.moveTo(x, 150); ctx.lineTo(x + 8, 150); ctx.lineTo(x + 8 + 60 * k, 186); ctx.lineTo(x + 40 * k, 186); ctx.fill(); }
    },
    m10_chapter(ctx, t, pn) {
      const hz = pn.haze, dk = c => Math.round(c * 0.12), md = c => Math.round(c * 0.45);
      grad(ctx, `rgb(${dk(hz[0])},${dk(hz[1])},${dk(hz[2])})`, `rgb(${md(hz[0])},${md(hz[1])},${md(hz[2])})`);
      // boss silhouette, rising out of the haze, with ember eyes
      const ed = typeof EDEF !== 'undefined' && pn.boss && EDEF[pn.boss], im = Engine.imgs[(ed && ed.spr) || ('s_' + pn.boss)];
      ctx.fillStyle = `rgba(${hz[0]},${hz[1]},${hz[2]},0.22)`; ctx.beginPath(); ctx.arc(W / 2, 120, 80 + Math.sin(t * 1.5) * 4, 0, TAU2); ctx.fill();
      if (im) { const h = 168, w = im.width * h / im.height, a = Math.min(1, t / 1.6); ctx.globalAlpha = a; ctx.filter = 'brightness(0.12)'; ctx.drawImage(im, Math.round(W / 2 - w / 2), Math.round(186 - h + (1 - a) * 16), Math.round(w), h); ctx.filter = 'none'; ctx.globalAlpha = 1; }
      ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(0, 0, W, 28);
      text(ctx, pn.title || '', W / 2, 9, '#ffe080', 'center');
      motes(ctx, t, 30, i => i % 3 ? `rgba(${hz[0] + 60},${hz[1] + 60},${hz[2] + 60},0.55)` : 'rgba(255,240,220,0.7)', pn.th !== 'cathedral');
      ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(0, 160, W, 26);
    },
  };
  M10.storyArt = ART;
  // draw our panels over m9's (its private ART table has no entry for these, so its panel area is left black)
  const _sd = M9.sceneDraw;
  M9.sceneDraw = function (ctx) {
    _sd.apply(this, arguments);
    const UI = M9.ui, pn = UI.scene && UI.scene[UI.p]; if (!pn || !ART[pn.art]) return;
    ctx.save(); ctx.beginPath(); ctx.rect(20, 14, W - 40, 186); ctx.clip(); ctx.translate(0, 14); try { ART[pn.art](ctx, UI.t, pn); } catch (e) { } ctx.restore();
    ctx.fillStyle = '#e0b850'; ctx.fillRect(20, 13, W - 40, 1); ctx.fillRect(20, 200, W - 40, 1);
    const k = Math.min(1, UI.t * 2); ctx.fillStyle = `rgba(0,0,0,${1 - k})`; ctx.fillRect(20, 14, W - 40, 186);
  };
  M10.v = 'm10c';
})();
