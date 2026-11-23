// ===== M11d: UI polish - weapon unlock banner, Codex ARMORY, run highlights page, kill-confirm on the HUD =====
(function () {
  const M11 = window.M11; if (!M11 || !M11.on || typeof M9 === 'undefined') return;
  const S = () => (typeof SAVE !== 'undefined' && SAVE.m9) || null;
  const RC = { common: '#e0d8ec', rare: '#60d0ff', epic: '#d878ff', legendary: '#ffd848' };
  // ---------- armory data ----------
  const FLAVOR = {
    crossbow: 'Tier I. The old gothic crossbow. Heavy bolts, a slow crank, and nothing in the castle it cannot stop.',
    xbow2: 'Tier II. Forged in the kennels of the Hellhound and quenched in its blood. Every bolt arrives on fire.',
    xbow3: 'Tier III. The last weapon of the Order of the Dawn. Its bolts carry morning into places that never see it.',
    firesword: 'A blade the Hellforge refused to cool. It burns what it cuts, and on a full swing the wound erupts.',
    battleaxe: 'Kael took it off a headsman. It sunders armour and cleaves everything in front of you.',
    voidreaver: 'It does not reflect light. Some say it remembers every throat it has opened.',
    frostsword: 'Cold enough to stop a heart mid-beat. Freeze a foe, then shatter it.',
    stormsword: 'Purple lightning lives in the fuller and jumps to the next foe.',
    rapier: 'Fast, cruel and precise. The third thrust always finds the vein.',
    firewhip: 'Lash it and the air catches. Burning foes take more from every blow.',
    chainwhip: 'Iron links, iron spikes. It drags the small ones to you.',
    bloodwhip: 'It drinks a little from everything it touches, and shares.',
  };
  const STARTERS = [
    { id: 'm11_long', name: "KAEL'S LONGSWORD", icon: 'vm_sword2', r: 'common', desc: 'Your sword. Three-step combo, a heavy third strike, and finishers on staggered foes.', fl: 'Blessed in the Chapel the night the castle fell. It has not been clean since.' },
    { id: 'm11_pistol', name: 'THE CONSECRATED SIDEARM', icon: 'p_pistol', r: 'common', desc: 'Starter sidearm. Quick consecrated shots; the left hand drops to fire.', fl: 'A priest\'s pistol, blessed shot by shot. The first step to a real crossbow.' },
  ];
  function weapons() { return STARTERS.concat(UPG.filter(u => u.kind === 'WEAPON').map(u => ({ id: u.id, name: u.name, icon: u.icon, r: u.r, desc: u.desc, fl: FLAVOR[u.id] || '' }))); }
  const known = id => { if (/^m11_/.test(id)) return true; const s = S(); return !!(s && s.m11arm && s.m11arm[id]); };
  function learn(id) { const s = S(); if (!s) return false; s.m11arm = s.m11arm || {}; if (s.m11arm[id]) return false; s.m11arm[id] = 1; try { M9.write && M9.write(); } catch (e) { } return true; }
  M11.armory = { weapons, known, learn };
  // what the run currently owns -> learnt
  function sweep() { if (!RUN.on) return; for (const id of RUN.picks || []) { const u = UPG.find(q => q.id === id); if (u && u.kind === 'WEAPON') learn(id); } if (P.wpn) { if (P.wpn.sword === 'fire') learn('firesword'); if (P.wpn.ranged === 'crossbow') { learn('crossbow'); if ((P.wpn.xbt || 1) >= 2) learn('xbow2'); if ((P.wpn.xbt || 1) >= 3) learn('xbow3'); } if (P.wpn.sword === 'axe') learn('battleaxe'); } }
  M9.on('stage', () => { try { sweep(); } catch (e) { } });
  M9.armoryRows = () => weapons().map(w => ({ w }));
  M9.armoryDraw = function (ctx, L, drawRows, o) {
    const { cx, CY, PX, PW, VIS, RH } = o;
    const nK = L.filter(r => known(r.w.id)).length;
    text(ctx, nK + ' / ' + L.length + ' FOUND', PX + PW - 14, o.PY + 7, '#80ffb0', 'right');
    drawRows(ctx, L, cx, 176, (r, x, y, sel) => { const k = known(r.w.id); ctx.fillStyle = k ? RC[r.w.r] || '#fff' : '#3a2048'; ctx.fillRect(x, y + 1, 3, 7); fitBlock(ctx, k ? r.w.name : '- undiscovered -', x + 7, y, 160, 9, k ? (sel ? '#ffffff' : '#e8e0f0') : '#806890', 'left'); });
    const r = L[o.sel]; const bx = cx + 190, bw = PX + PW - 12 - bx;
    ctx.fillStyle = 'rgba(232,216,176,0.06)'; ctx.fillRect(bx, CY - 2, bw, VIS * RH);
    if (!r) return; const w = r.w, k = known(w.id);
    if (!k) { fitBlock(ctx, 'Find it on a run - boon picks, the altar, or deeper stages.', bx + bw / 2, CY + 50, bw - 16, 40, '#806890', 'center', 1, 11); return; }
    const im = Engine.imgs[w.icon];
    if (im) { ctx.save(); ctx.imageSmoothingEnabled = false; const s = Math.min(3, 48 / Math.max(im.width, im.height)); const iw = im.width * s, ih = im.height * s;
      const g = ctx.createRadialGradient(bx + bw / 2, CY + 26, 2, bx + bw / 2, CY + 26, 34); g.addColorStop(0, 'rgba(255,220,140,0.25)'); g.addColorStop(1, 'rgba(255,220,140,0)'); ctx.fillStyle = g; ctx.fillRect(bx + bw / 2 - 36, CY - 8, 72, 68);
      ctx.drawImage(im, Math.round(bx + bw / 2 - iw / 2), Math.round(CY + 26 - ih / 2), Math.round(iw), Math.round(ih)); ctx.restore(); }
    fitBlock(ctx, w.name, bx + bw / 2, CY + 58, bw - 10, 9, RC[w.r] || '#ffe080', 'center');
    text(ctx, (w.r || 'common').toUpperCase(), bx + bw / 2, CY + 70, '#a090b0', 'center');
    fitBlock(ctx, w.desc || '', bx + bw / 2, CY + 84, bw - 14, 40, '#e8e0f0', 'center', 1, 10);
    if (w.fl) fitBlock(ctx, w.fl, bx + bw / 2, CY + 132, bw - 14, 44, '#d8c0a0', 'center', 1, 10);
  };
  // ---------- weapon unlock banner ----------
  const BAN = M11.BAN = { q: [], cur: null };
  const _ch = choose;
  choose = function (i) {
    const u = RUN.choices && RUN.choices[i], was = !!RUN.picked; const r = _ch.apply(this, arguments);
    try { if (u && !was && RUN.picked && u.kind === 'WEAPON') { const nu = learn(u.id); BAN.q.push({ name: u.name, icon: u.icon, r: u.r, sub: u.id === 'xbow2' ? 'CROSSBOW II' : u.id === 'xbow3' ? 'CROSSBOW III - THE ULTIMATE' : u.id === 'crossbow' ? 'CROSSBOW I' : 'NEW WEAPON', first: nu, t: 0 }); } } catch (e) { }
    return r;
  };
  function drawBanner(ctx, rdt) {
    if (!BAN.cur && BAN.q.length && G.state === 'play' && !G.bigText && !(window.OPT && OPT.open)) { BAN.cur = BAN.q.shift(); SFX.ev && SFX.ev('pickup_weapon', 0.8); }
    const b = BAN.cur; if (!b) return; if (G.state !== 'play') return; b.t += rdt; const D = 3.2; if (b.t > D) { BAN.cur = null; return; }
    const ina = Math.min(1, b.t / 0.18), out = b.t > D - 0.4 ? (D - b.t) / 0.4 : 1, a = Math.min(ina, out);
    const col = RC[b.r] || '#ffe080', y = 84, w = 260, x = (W - w) / 2, h = 44;
    ctx.save(); ctx.globalAlpha = a;
    const sl = (1 - ina) * 30;
    ctx.fillStyle = 'rgba(12,0,20,0.82)'; ctx.fillRect(x - sl, y, w + sl * 2, h);
    ctx.fillStyle = col; ctx.fillRect(x - sl, y, w + sl * 2, 1); ctx.fillRect(x - sl, y + h - 1, w + sl * 2, 1);
    // sheen sweep
    const sx = x + ((b.t * 1.2) % 1.4 - 0.2) * w; const g = ctx.createLinearGradient(sx - 30, 0, sx + 30, 0); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, 'rgba(255,240,200,0.18)'); g.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = g; ctx.fillRect(x, y + 1, w, h - 2);
    const im = Engine.imgs[b.icon]; if (im) { ctx.imageSmoothingEnabled = false; const s = Math.min(2, 36 / Math.max(im.width, im.height)); ctx.drawImage(im, Math.round(x + 24 - im.width * s / 2), Math.round(y + h / 2 - im.height * s / 2), Math.round(im.width * s), Math.round(im.height * s)); }
    text(ctx, b.sub + (b.first ? '  - FIRST FIND' : ''), x + 50, y + 8, '#a898c0');
    fitBlock(ctx, b.name, x + 50, y + 22, w - 58, 9, col, 'left');
    ctx.restore();
  }
  const _dh = drawHUD;
  drawHUD = function (ctx, cam, rdt) { const r = _dh.apply(this, arguments); try { drawBanner(ctx, rdt || 0.016); } catch (e) { } return r; };
  // ---------- run highlights (third results page) ----------
  const LOG = M11.LOG = [];
  M9.on('runStart', () => { LOG.length = 0; });
  M9.on('stage', () => { if (!RUN.on) return; const last = LOG[LOG.length - 1]; if (last && last.stage === RUN.stage) return; if (last) close(last); LOG.push({ stage: RUN.stage | 0, t0: RUN.time, k0: RUN.kills, sh0: RUN.shardsRun || 0, theme: (typeof curTheme === 'function' && curTheme() && curTheme().name) || '' }); });
  function close(l) { if (l.t1 === undefined) { l.t1 = RUN.time; l.k1 = RUN.kills; l.sh1 = RUN.shardsRun || 0; } }
  let hp = 0, tabs = 0;
  M9.on('runStart', () => { hp = 0; tabs = 0; });
  const _ri = resultsInput;
  resultsInput = function (rdt) {
    if (!RUN.winScreen && RUN.resT > 0.5 && (KP.Tab || KP.PadY)) { tabs = (tabs + 1) % 3; if (tabs === 0) { delete KP.Tab; delete KP.PadY; SFX.play('swing', 0.25); } }
    return _ri.apply(this, arguments);
  };
  const _sr = startResults;
  startResults = function () { tabs = 0; const r = _sr.apply(this, arguments); try { const l = LOG[LOG.length - 1]; if (l) close(l); } catch (e) { } return r; };
  const fmt = s => { s = s | 0; return ((s / 60) | 0) + ':' + String(s % 60).padStart(2, '0'); };
  function wpnName() { if (!P.wpn) return '-'; const sw = P.wpn.sword || 'base'; const n = { base: 'LONGSWORD', fire: 'EMBERBRAND', axe: 'BATTLE AXE', frost: 'FROST SWORD', storm: 'STORM SWORD', rapier: 'RAPIER', crimson: 'CRIMSON SWORD', skull: 'SKULL BLADE', ruby: 'RUBY SWORD', great: 'GREATSWORD', void: 'VOID REAVER' }[sw] || String(sw).toUpperCase(); const xb = P.wpn.ranged === 'crossbow' ? ['', 'CROSSBOW I', 'HELLFORGE ARBALEST', 'THE DAWNBRINGER'][P.wpn.xbt || 1] : 'SIDEARM'; return n + ' + ' + xb; }
  function drawHighlights(ctx) {
    ctx.fillStyle = RUN.won ? 'rgba(20,0,32,0.94)' : 'rgba(40,0,8,0.92)'; ctx.fillRect(0, 0, W, H);
    goldFrame(ctx, 40, 6, W - 80, H - 30, RUN.won ? '#ffd848' : '#d04060');
    text(ctx, 'RUN HIGHLIGHTS', W / 2 + 1, 13, '#2a0638', 'center', 2); text(ctx, 'RUN HIGHLIGHTS', W / 2, 12, '#ffe080', 'center', 2);
    const s = M11.stat, rows = [
      ['ARMS', wpnName(), '#ffffff'], ['BEST MULTI-KILL', s.best >= 2 ? s.best + ' FOES' : '-', '#ffc040'], ['HEAVY HITS', String(s.heavy), '#ffd060'],
      ['WARDS BROKEN', String(s.wards), '#80e8ff'], ['THIEVES CAUGHT', s.thief + (s.thiefLost ? '   (' + s.thiefLost + ' got away)' : ''), '#ffd860'],
      ['BLOOD PACTS', String(s.pacts), '#ff6070'], ['WRATH ORBS', String(s.wraths), '#ff8090'], ['SOULS FOUND', String(RUN.m10souls || 0), '#d8c0ff'],
    ];
    let y = 36; for (const [k, v, c] of rows) { text(ctx, k, 196, y, '#f0c040', 'right'); fitBlock(ctx, v, 206, y, W - 260, 9, c, 'left'); y += 11; }
    // per-stage strip: kills (bar) + time
    const L = LOG.filter(l => l.t1 !== undefined || l === LOG[LOG.length - 1]).slice(-11); if (!L.length) return;
    const x0 = 62, x1 = W - 62, top = y + 10, bh = 52, n = L.length, bw = Math.min(30, Math.floor((x1 - x0) / n) - 4);
    const kills = L.map(l => (l.k1 !== undefined ? l.k1 : RUN.kills) - l.k0), mx = Math.max(1, ...kills);
    text(ctx, 'KILLS PER STAGE', x0, top - 2, '#a898c0');
    L.forEach((l, i) => {
      const k = kills[i], hh = Math.round(bh * k / mx), xx = x0 + i * ((x1 - x0) / n) + 2, yb = top + 20 + bh;
      const g = ctx.createLinearGradient(0, yb - hh, 0, yb); g.addColorStop(0, '#ff6080'); g.addColorStop(1, '#801030'); ctx.fillStyle = g; ctx.fillRect(xx, yb - hh, bw, hh);
      ctx.fillStyle = '#ffd0d8'; ctx.fillRect(xx, yb - hh, bw, 1);
      text(ctx, String(k), xx + bw / 2, yb - hh - 9, '#ffffff', 'center');
      text(ctx, l.stage > 10 ? 'A' + (l.stage - 10) : String(l.stage), xx + bw / 2, yb + 3, '#f0c040', 'center');
      const tt = (l.t1 !== undefined ? l.t1 : RUN.time) - l.t0; fitBlock(ctx, fmt(tt), xx + bw / 2, yb + 13, bw + 4, 9, '#a898c0', 'center');
    });
  }
  const _dr = drawResults;
  drawResults = function (ctx) {
    if (!RUN.winScreen && tabs === 2 && RUN.resT >= 0.3) {
      drawHighlights(ctx);
      if (G.inputMode === 'pad') promptRow(ctx, ['{triangle}', ' SUMMARY    ', '{cross}', ' THE CHAPEL'], W / 2, H - 16, '#ffffff', 'center');
      else text(ctx, 'TAB - SUMMARY     ENTER - THE CHAPEL', W / 2, H - 16, '#ffffff', 'center');
      return;
    }
    const r = _dr.apply(this, arguments);
    if (!RUN.winScreen && tabs === 1 && RUN.resT >= 0.3) { ctx.fillStyle = 'rgba(40,0,8,0.9)'; ctx.fillRect(W / 2 - 150, H - 18, 300, 12); text(ctx, 'TAB - HIGHLIGHTS     ENTER - THE CHAPEL', W / 2, H - 16, '#ffffff', 'center'); }
    return r;
  };
})();
