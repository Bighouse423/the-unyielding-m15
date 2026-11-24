'use strict';
// ===== m15c: MENU + UI POLISH =====
// - Stage cards: each stage opens from black into a gothic banner (Stage numeral, the stage's name in blackletter, who waits at the end).
// - The run summary (death or victory) is rebuilt: animated embers / motes, the cause of death, THIS RUN and BEST RUN panels with
//   rows that count up, NEW RECORD stamps, relic + boon icons. The best-run record lives in its own key (tu_m15_best): saves untouched.
// - Pause: side panels with this run's numbers and your current key bindings, drifting embers, a stage strip on top.
// - Title: fog and embers drift between the castle and the menu, a candle-flicker vignette, the odd lightning flash, the best run.
// Settings already had master/music/sfx sliders, sensitivity and key bindings (m8); untouched.
// ?m15=0 (or ?m15ui=0) -> m14 exactly.
(function () {
  const Q = location.search;
  const M15 = window.M15 = window.M15 || {};
  const ON = !/[?&]m15=0/.test(Q) && !/[?&]m15ui=0/.test(Q) && typeof drawResults === 'function' && !!window.M9;
  M15.uiOn = ON; M15.errC = null;
  if (!ON) return;
  const guard = f => function () { try { return f.apply(this, arguments); } catch (e) { M15.errC = String(e && e.stack || e); } };
  const IM = n => (Engine.imgs && Engine.imgs[n] && Engine.imgs[n].width) ? Engine.imgs[n] : null;
  const fmt = s => { s = Math.max(0, s | 0); const h = (s / 3600) | 0, m = ((s / 60) | 0) % 60, ss = s % 60; return (h ? h + ':' + String(m).padStart(2, '0') : m) + ':' + String(ss).padStart(2, '0'); };
  const ease = t => 1 - Math.pow(1 - clamp(t, 0, 1), 3);
  // ---------- best-run record (own key) ----------
  const KEY = 'tu_m15_best';
  const loadBest = () => { try { return JSON.parse(localStorage.getItem(KEY) || 'null') || null; } catch (e) { return null; } };
  const saveBest = b => { try { localStorage.setItem(KEY, JSON.stringify(b)); } catch (e) { } };
  M15.best = loadBest;
  function seedBest() {
    let b = loadBest();
    if (!b) { b = { deep: 0, kills: 0, minis: 0, fastWin: 0, runs: 0, wins: 0 }; try { b.deep = RUN.best | 0; if (typeof SAVE !== 'undefined' && SAVE.stats) { b.runs = SAVE.stats.runs | 0; b.wins = SAVE.stats.wins | 0; } } catch (e) { } }
    return b;
  }
  const relicsOf = () => (RUN.picks || []).filter(id => { const u = UPG.find(q => q.id === id); return u && u.kind === 'RELIC'; });
  const boonsOf = () => (RUN.picks || []).filter(id => { const u = UPG.find(q => q.id === id); return u && u.kind !== 'RELIC'; });
  const stageLabel = n => n > 10 ? 'ABYSS ' + (n - 10) : 'STAGE ' + n;
  // mini-bosses felled this run
  const _ke = killEnemy;
  killEnemy = function (e, o) { const was = e && e.alive, r = _ke.apply(this, arguments); try { if (was && e.m13mini && RUN.on) RUN.m15minis = (RUN.m15minis || 0) + 1; } catch (er) { } return r; };
  M9.on('runStart', () => { RUN.m15minis = 0; RUN.m15rec = null; tabs = 0; });
  // ---------- results: tabs mirror (m11d cycles summary / record / highlights) + the record update ----------
  let tabs = 0;
  const _sr = startResults;
  startResults = function () {
    tabs = 0; let b0 = null; try { b0 = seedBest(); } catch (e) { }
    const r = _sr.apply(this, arguments);
    try {
      const b = b0 || seedBest(), rec = { deep: false, kills: false, minis: false, fast: false };
      const deep = RUN.won && !(typeof abyssDepth === 'function' && abyssDepth()) ? 10 : RUN.stage | 0;
      b.runs++; if (RUN.won) b.wins++;
      if (deep > b.deep) { b.deep = deep; rec.deep = true; }
      if (RUN.kills > b.kills) { b.kills = RUN.kills; rec.kills = b.runs > 1; }
      if ((RUN.m15minis || 0) > b.minis) { b.minis = RUN.m15minis; rec.minis = b.runs > 1; }
      if (RUN.won && (!b.fastWin || RUN.time < b.fastWin)) { b.fastWin = RUN.time; rec.fast = true; }
      saveBest(b); RUN.m15rec = { b, rec, deep }; M15.fx.length = 0;
    } catch (e) { M15.errC = String(e && e.stack || e); }
    return r;
  };
  GAME.rogue.startResults = startResults;
  const _ri = resultsInput;
  resultsInput = function (rdt) { if (!RUN.winScreen && RUN.resT > 0.5 && (KP.Tab || KP.PadY)) tabs = (tabs + 1) % 3; return _ri.apply(this, arguments); };
  // ---------- 2D particles for the menus ----------
  const FX = M15.fx = [];
  function fxTick(dt, kind, box) {
    const [x0, y0, x1, y1] = box || [0, 0, W, H];
    const rate = kind === 'gold' ? 26 : kind === 'title' ? 28 : 30;
    let n = 0; for (const p of FX) if (p.k === kind) n++;
    if (n < 90 && Math.random() < dt * rate) {
      const ash = kind !== 'gold' && Math.random() < 0.35;
      FX.push({ k: kind, x: rand(x0, x1), y: kind === 'title' && !ash ? y1 + 2 : (ash ? y0 - 2 : y1 + 2), vx: rand(-6, 6), vy: ash ? rand(6, 14) : -rand(10, 26), life: rand(2.5, 5), t: 0, s: Math.random() < 0.2 ? 2 : 1, ash, ph: rand(0, 6) });
    }
    for (let i = FX.length - 1; i >= 0; i--) { const p = FX[i]; if (p.k !== kind) continue; p.t += dt; p.x += (p.vx + Math.sin(p.t * 2 + p.ph) * 6) * dt; p.y += p.vy * dt; if (p.t > p.life || p.y < y0 - 6 || p.y > y1 + 6) FX.splice(i, 1); }
  }
  function fxDraw(ctx, kind, clip) {
    ctx.save();
    if (clip) { ctx.beginPath(); for (const c of clip) ctx.rect(c[0], c[1], c[2] - c[0], c[3] - c[1]); ctx.clip(); }
    for (const p of FX) {
      if (p.k !== kind) continue; const a = Math.min(1, p.t * 2) * Math.max(0, 1 - p.t / p.life);
      ctx.globalAlpha = a * (p.ash ? 0.5 : 0.9);
      ctx.fillStyle = p.ash ? '#8a8090' : kind === 'gold' ? (p.s > 1 ? '#fff0b0' : '#ffd060') : (p.s > 1 ? '#ffd080' : (Math.sin(p.t * 9 + p.ph) > 0 ? '#ff7a30' : '#ff4a20'));
      ctx.fillRect(Math.round(p.x), Math.round(p.y), p.s, p.s);
    }
    ctx.restore();
  }
  function vignette(ctx, col, k) {
    const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.25, W / 2, H / 2, W * 0.62);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, col.replace('A', String(k)));
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  }
  function rule(ctx, x0, x1, y, col) {   // a gold rule with a diamond in the middle and studs at the ends
    ctx.fillStyle = col || '#c89030'; ctx.fillRect(x0, y, x1 - x0, 1); ctx.fillStyle = '#5a3010'; ctx.fillRect(x0, y + 1, x1 - x0, 1);
    const m = Math.round((x0 + x1) / 2); ctx.fillStyle = '#ffe080'; for (let i = 0; i < 4; i++) ctx.fillRect(m - i, y - 3 + i, 1 + 2 * i, 1); for (let i = 0; i < 3; i++) ctx.fillRect(m - 2 + i, y + 1 + i, 5 - 2 * i, 1);
    ctx.fillStyle = '#d01040'; ctx.fillRect(m, y - 1, 1, 2); ctx.fillStyle = '#ffe080'; ctx.fillRect(x0 - 2, y - 1, 3, 3); ctx.fillRect(x1 - 1, y - 1, 3, 3);
  }
  const drawImg = (ctx, im, cx, y, a) => { if (!im) return 0; ctx.save(); ctx.globalAlpha = a === undefined ? 1 : a; ctx.drawImage(im, Math.round(cx - im.width / 2), Math.round(y)); ctx.restore(); return im.height; };
  // ---------- stage cards ----------
  const BOSSN = { 1: 'vknight', 2: 'spider', 3: 'colossus', 4: 'alphawolf', 5: 'matriarch', 6: 'minotaur', 7: 'witch', 8: 'cerberax', 9: 'uknight', 10: 'lich' };
  let card = null;
  M9.on('stage', guard(() => {
    if (!RUN.on || RUN.hub || G.state === 'title') { card = null; return; }
    const n = RUN.stage | 0, ab = n > 10 || (RUN.cfg && RUN.cfg.abyss);
    const bt = !ab && BOSSN[n] && EDEF[BOSSN[n]] ? (EDEF[BOSSN[n]].title || '').toUpperCase() : '';
    const mini = (window.M14 && M14.minis && M14.minis[0] && M14.minis[0].d) ? M14.minis[0].d.title : '';
    card = { n, ab, t: 0, bt, mini, depth: ab ? n - 10 : 0, sanct: !!(RUN.cfg && RUN.cfg.m13sanct) };
    if (G.bigText && /^STAGE \d+$/.test(G.bigText.t1 || '')) G.bigText = null;
  }));
  M15.card = () => card;
  function drawCard(ctx, rdt) {
    if (!card) return false;
    if (G.state !== 'play') { if (G.state !== 'pick' && G.state !== 'altar') card = null; return false; }
    card.t += G.paused ? 0 : rdt; const t = card.t;
    if ((G.paused || (window.OPT && OPT.open)) && window.M15PAD) return false;   // m15b: the card waits behind the pause menu
    if (G.bigText && /^STAGE \d+$/.test(G.bigText.t1 || '')) G.bigText = null;   // the old plain card
    if (t > 4.2) { card = null; return false; }
    // fade in from black
    if (t < 0.75) { ctx.fillStyle = 'rgba(0,0,0,' + (1 - ease(t / 0.75)).toFixed(3) + ')'; ctx.fillRect(0, 0, W, H); }
    if (card.sanct) return true;
    const a = t < 0.35 ? 0 : t < 0.85 ? ease((t - 0.35) / 0.5) : t > 3.5 ? Math.max(0, 1 - (t - 3.5) / 0.7) : 1;
    if (a <= 0) return true;
    const cy = 130, bh = 96, slide = (1 - a) * 14;
    ctx.save(); ctx.globalAlpha = a;
    // the banner: a dark band that feathers out at the ends
    for (let i = 0; i < 24; i++) { const f = i / 24; ctx.fillStyle = 'rgba(8,0,10,' + (0.78 * f).toFixed(3) + ')'; ctx.fillRect(i * 4, cy - bh / 2, 4, bh); ctx.fillRect(W - (i + 1) * 4, cy - bh / 2, 4, bh); }
    ctx.fillStyle = 'rgba(8,0,10,0.78)'; ctx.fillRect(96, cy - bh / 2, W - 192, bh);
    const rw = Math.round(150 * ease((t - 0.35) / 0.7));
    rule(ctx, W / 2 - rw, W / 2 + rw, cy - bh / 2 + 2); rule(ctx, W / 2 - rw, W / 2 + rw, cy + bh / 2 - 3);
    const num = card.ab ? IM('t15_abyssn') : IM('t15_num_' + card.n), nm = card.ab ? IM('t15_st_abyss') : IM('t15_st_' + card.n);
    let y = cy - bh / 2 + 5 - slide * 0.5;
    if (num) y += drawImg(ctx, num, W / 2, y) - 6;
    if (nm) drawImg(ctx, nm, W / 2, y + slide * 0.3);
    else text(ctx, (curTheme().name || '').toUpperCase(), W / 2, y + 10, '#ffe080', 'center');
    const sub = card.ab ? 'DEPTH ' + card.depth + '  -  THE DARK REMEMBERS YOU' : card.bt ? card.bt + ' WAITS BELOW' : '';
    if (sub && t > 0.9) { ctx.globalAlpha = a * Math.min(1, (t - 0.9) * 3); text(ctx, sub, W / 2, cy + bh / 2 - (card.mini ? 25 : 16), '#c8a8d8', 'center'); }
    if (card.mini && t > 1.2) { ctx.globalAlpha = a * Math.min(1, (t - 1.2) * 3); text(ctx, 'AND IN THE ELITE HALL: ' + String(card.mini).split(',')[0], W / 2, cy + bh / 2 - 14, '#ffc070', 'center'); }
    ctx.restore();
    return true;
  }
  // ---------- the run summary ----------
  const ROWS_RUN = () => {
    const R = RUN.m15rec || {}, rec = R.rec || {};
    const won = RUN.won, d = typeof abyssDepth === 'function' ? abyssDepth() : 0;
    return [
      ['REACHED', won && !d ? 'THE THRONE' : stageLabel(RUN.stage | 0), rec.deep, '#e0b0ff'],
      ['TIME', fmt(RUN.time), rec.fast, '#ffffff', RUN.time],
      ['KILLS', String(RUN.kills | 0), rec.kills, '#ffb0b0', RUN.kills | 0],
      ['ELITES', String(RUN.elites | 0), false, '#ff9a60', RUN.elites | 0],
      ['MINI-BOSSES', String(RUN.m15minis | 0), rec.minis, '#ffd060', RUN.m15minis | 0],
      ['RELICS', String(relicsOf().length), false, '#ffd848', relicsOf().length],
      ['SHARDS', '+' + (RUN.banked || 0), false, '#e0a0ff', RUN.banked || 0],
    ];
  };
  const ROWS_BEST = () => {
    const b = (RUN.m15rec && RUN.m15rec.b) || seedBest();
    return [
      ['DEEPEST', b.deep >= 10 && b.wins ? (b.deep > 10 ? stageLabel(b.deep) : 'THE THRONE') : stageLabel(b.deep || 1), '#e0b0ff'],
      ['MOST KILLS', String(b.kills || 0), '#ffb0b0'],
      ['MINI-BOSSES', String(b.minis || 0), '#ffd060'],
      ['FASTEST WIN', b.fastWin ? fmt(b.fastWin) : '--', '#ffe080'],
      ['RUNS', String(b.runs || 0), '#c8b8e0'],
      ['VICTORIES', String(b.wins || 0), '#a0ffb0'],
    ];
  };
  function panel(ctx, x, y, w, h, hdr, gem) {
    goldFrame(ctx, x, y, w, h, gem);
    ctx.fillStyle = 'rgba(40,6,20,0.55)'; ctx.fillRect(x, y, w, 15);
    const im = IM(hdr); if (im) drawImg(ctx, im, x + w / 2, y - 9);
  }
  function drawSummary(ctx, rdt) {
    const won = RUN.won, d = typeof abyssDepth === 'function' ? abyssDepth() : 0, dead = !won || !RUN.retired;
    const T = RUN.resT, a = Math.min(1, T * 1.6);
    const gold = won && !d || (won && RUN.retired);
    // backdrop over the frozen frame
    ctx.fillStyle = gold ? `rgba(18,4,30,${0.86 * a})` : `rgba(30,0,6,${0.86 * a})`; ctx.fillRect(0, 0, W, H);
    const pulse = 0.5 + 0.5 * Math.sin(G.t * 1.3);
    const g = ctx.createRadialGradient(W / 2, 30, 4, W / 2, 30, 200); g.addColorStop(0, gold ? `rgba(255,200,90,${0.18 + 0.06 * pulse})` : `rgba(200,20,40,${0.2 + 0.08 * pulse})`); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    fxTick(Math.min(0.05, rdt || 0.016), gold ? 'gold' : 'ember'); fxDraw(ctx, gold ? 'gold' : 'ember');
    vignette(ctx, 'rgba(0,0,0,A)', 0.7);
    if (T < 0.25) return;
    // title
    const tim = gold ? IM('t15_victor') : (won ? IM('t15_abyss') : Engine.imgs.txt_dead);
    const ty = 4 - (1 - ease((T - 0.25) / 0.6)) * 10;
    drawImg(ctx, tim, W / 2, ty, ease((T - 0.25) / 0.5));
    // the line under it
    const th = curTheme(), where = d ? 'Abyss depth ' + d : (th && th.name ? th.name.toLowerCase().replace(/(^| )(\w)/g, (m, s, c) => s + c.toUpperCase()) : '');
    const line = gold ? (RUN.retired ? 'THE BLACK RELIQUARY IS YOURS' : 'THE LICH KING IS DUST') : ('SLAIN BY ' + String(RUN.cause || 'the dark').toUpperCase());
    ctx.save(); ctx.globalAlpha = ease((T - 0.55) / 0.4);
    text(ctx, line, W / 2, 54, gold ? '#ffe8a0' : '#ff9aa8', 'center');
    if (!gold) text(ctx, (RUN.stage > 10 ? 'IN THE ABYSS, DEPTH ' + (RUN.stage - 10) : 'ON STAGE ' + RUN.stage + ', ' + String(where).toUpperCase()), W / 2, 64, '#a08898', 'center');
    ctx.restore();
    // panels
    const py = 84, ph = 110, lx = 22, rx = 252, pw = 206;
    ctx.save(); ctx.globalAlpha = ease((T - 0.7) / 0.4);
    panel(ctx, lx, py, pw, ph, 't15_thisrun', gold ? '#ffd848' : '#d01040'); panel(ctx, rx, py, pw, ph, 't15_best', '#8040d0');
    ctx.restore();
    const R = ROWS_RUN(), B = ROWS_BEST();
    R.forEach((r, i) => {
      const t0 = 0.9 + i * 0.12; if (T < t0) return; const k = ease((T - t0) / 0.35), y = py + 20 + i * 12.5;
      ctx.save(); ctx.globalAlpha = k;
      text(ctx, r[0], lx + 8, y, '#f0c040');
      let v = r[1]; if (r[4] !== undefined && k < 1 && typeof r[4] === 'number') v = r[0] === 'TIME' ? fmt(r[4] * k) : (r[1][0] === '+' ? '+' : '') + Math.round(r[4] * k);
      text(ctx, v, lx + pw - 8, y, r[3], 'right');
      if (r[2] && T > t0 + 0.4 && (G.t * 3 | 0) % 2 === 0) text(ctx, 'NEW!', lx + pw - 14 - v.length * 8 - 8, y, '#ffe080', 'right');
      ctx.restore();
    });
    B.forEach((r, i) => {
      const t0 = 1.1 + i * 0.1; if (T < t0) return; const k = ease((T - t0) / 0.35), y = py + 20 + i * 14.5;
      ctx.save(); ctx.globalAlpha = k; text(ctx, r[0], rx + 8, y, '#c8a0f0'); text(ctx, r[1], rx + pw - 8, y, r[2], 'right'); ctx.restore();
    });
    // relics + boons
    if (T > 1.9) {
      const rel = relicsOf(), bo = boonsOf(), ids = rel.concat(bo).slice(0, 24), iw = 18, x0 = Math.round(W / 2 - (ids.length * iw) / 2), y = py + ph + 10;
      ctx.save(); ctx.globalAlpha = ease((T - 1.9) / 0.4);
      if (!ids.length) text(ctx, 'NO RELICS OR BOONS', W / 2, y + 4, '#806878', 'center');
      ids.forEach((id, i) => { const u = UPG.find(q => q.id === id); if (!u) return; const xx = x0 + i * iw; ctx.fillStyle = u.kind === 'RELIC' ? '#ffd848' : RARITY[u.r].g; ctx.fillRect(xx, y, 16, 16); ctx.fillStyle = '#12040e'; ctx.fillRect(xx + 1, y + 1, 14, 14); drawIcon(ctx, u.icon, xx + 8, y + 8, 14, 14); });
      ctx.restore();
    }
    // prompts (kept above the daily-descent tag at y 258)
    if (T > 1.2) {
      const blink = (G.t * 1.6 | 0) % 2 === 0 ? 1 : 0.65;
      ctx.save(); ctx.globalAlpha = blink;
      if (G.inputMode === 'pad') promptRow(ctx, ['{cross}', ' THE CHAPEL    ', '{circle}', ' TITLE    ', '{triangle}', ' MORE'], W / 2, 244, '#ffffff', 'center');
      else text(ctx, 'ENTER  THE CHAPEL    ESC  TITLE    TAB  MORE', W / 2, 244, '#ffffff', 'center');
      ctx.restore();
    }
  }
  const _dr = drawResults;
  drawResults = function (ctx) {
    if (!RUN.winScreen && tabs === 0 && RUN.m15rec) {
      try { drawSummary(ctx, 1 / 60); return; } catch (e) { M15.errC = String(e && e.stack || e); }
    }
    return _dr.apply(this, arguments);
  };
  // ---------- pause: side panels + embers ----------
  const KEYS = [['sword', 'SWORD'], ['off', 'OFFHAND'], ['roll', 'ROLL'], ['jump', 'JUMP'], ['shield', 'SHIELD'], ['side', 'SIDEARM'], ['swap', 'SWAP']];
  const kn = id => { if (window.M15PAD && M15PAD.btnName && G.inputMode === 'pad' && PAD.connected) return M15PAD.btnName(id); try { const a = OPT.ACTS.find(q => q[0] === id); return String(OPT.keyName(OPT.bindOf(a))).replace(/^KEY/, '').slice(0, 5); } catch (e) { return '?'; } };
  function drawPause(ctx, rdt) {
    if (!(G.paused && G.state === 'play' && !(window.OPT && OPT.open) && RUN.on && !RUN.hub) || G.pmPage === 'pad') return false;
    const fx0 = W / 2 - 132, fx1 = W / 2 + 132;
    fxTick(Math.min(0.05, rdt || 0.016), 'ember', [0, 24, W, 236]);
    fxDraw(ctx, 'ember', [[0, 24, fx0 - 2, 236], [fx1 + 2, 24, W, 236]]);
    const n = RUN.stage | 0, th = curTheme();
    // the stage strip
    ctx.save(); ctx.fillStyle = 'rgba(10,0,16,0.75)'; ctx.fillRect(W / 2 - 150, 3, 300, 13);
    text(ctx, (n > 10 ? 'ABYSS DEPTH ' + (n - 10) : 'STAGE ' + n) + '  -  ' + String(th && th.name || '').toUpperCase(), W / 2, 6, '#ffe080', 'center'); ctx.restore();
    // left: this run
    const lx = 6, pw = 98, py = 46, rowh = 13;
    const tm = (RUN.time || 0) + (G.time || 0), kills = (RUN.kills || 0) + (G.kills || 0);
    goldFrame(ctx, lx, py, pw, 118, '#d01040');
    text(ctx, 'THIS RUN', lx + pw / 2, py + 4, '#ffe080', 'center'); rule(ctx, lx + 8, lx + pw - 8, py + 15);
    [['TIME', fmt(tm)], ['KILLS', String(kills)], ['ELITES', String(RUN.elites | 0)], ['MINIS', String(RUN.m15minis | 0)], ['RELICS', String(relicsOf().length)], ['BOONS', String(boonsOf().length)], ['SHARDS', String(RUN.shardsRun | 0)]]
      .forEach(([k, v], i) => { const y = py + 22 + i * rowh; text(ctx, k, lx + 5, y, '#c8a0f0'); text(ctx, v, lx + pw - 5, y, '#ffffff', 'right'); });
    // right: keys
    const rx = W - 6 - pw;
    goldFrame(ctx, rx, py, pw, 118, '#8040d0');
    text(ctx, 'CONTROLS', rx + pw / 2, py + 4, '#ffe080', 'center'); rule(ctx, rx + 8, rx + pw - 8, py + 15);
    KEYS.forEach(([id, l], i) => { const y = py + 22 + i * rowh; text(ctx, l.slice(0, 7), rx + 5, y, '#c8a0f0'); const v = kn(id); if (v[0] === '{') psGlyph(ctx, v.slice(1, -1), rx + pw - 15, y - 1); else text(ctx, v, rx + pw - 5, y, '#ffffff', 'right'); });
    // best under the panels
    const b = seedBest(); text(ctx, 'BEST', lx + pw / 2, py + 126, '#a08898', 'center'); text(ctx, b.deep > 10 ? 'ABYSS ' + (b.deep - 10) : 'STAGE ' + (b.deep || 1), lx + pw / 2, py + 136, '#e0b0ff', 'center');
    text(ctx, 'SEED', rx + pw / 2, py + 126, '#a08898', 'center'); text(ctx, String((RUN.seed >>> 0) % 100000), rx + pw / 2, py + 136, '#c8b8e0', 'center');
    return true;
  }
  // ---------- title: fog, embers, flicker, lightning, the best run ----------
  let bolt = 0, nextBolt = 6 + Math.random() * 8;
  const fog = []; for (let i = 0; i < 7; i++) fog.push({ x: Math.random() * W, y: 150 + Math.random() * 110, w: 120 + Math.random() * 120, sp: 4 + Math.random() * 8, a: 0.05 + Math.random() * 0.05 });
  let lastT = 0;
  const _dt = drawTitle;
  drawTitle = function (ctx) {
    _dt.apply(this, arguments);   // the title paints the whole screen, so the atmosphere goes on top (kept off the menu box)
    try {
      if (window.OPT && OPT.open) return;
      const now = performance.now(), dt = lastT ? Math.min(0.05, (now - lastT) / 1000) : 0.016; lastT = now;
      const MB = [214, 138, 366, 264], outside = [[0, 0, W, MB[1]], [0, MB[3], W, H], [0, MB[1], MB[0], MB[3]], [MB[2], MB[1], W, MB[3]]];
      ctx.save(); ctx.beginPath(); for (const c of outside) ctx.rect(c[0], c[1], c[2] - c[0], c[3] - c[1]); ctx.clip();
      for (const f of fog) { f.x += f.sp * dt; if (f.x - f.w > W) f.x = -f.w; const g = ctx.createRadialGradient(f.x, f.y, 2, f.x, f.y, f.w * 0.5); g.addColorStop(0, `rgba(200,180,235,${(f.a * 1.6).toFixed(3)})`); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.fillRect(f.x - f.w / 2, f.y - f.w / 2, f.w, f.w); }
      const fl = 0.34 + 0.07 * Math.sin(now / 130) + 0.05 * Math.sin(now / 47);
      vignette(ctx, 'rgba(10,0,16,A)', fl.toFixed(3));
      ctx.restore();
      fxTick(dt, 'title', [0, 0, W, H]); fxDraw(ctx, 'title', outside);
      nextBolt -= dt; if (nextBolt <= 0) { bolt = 1; nextBolt = 10 + Math.random() * 14; }
      if (bolt > 0) { const k = bolt > 0.75 ? 1 : bolt > 0.6 ? 0.2 : bolt > 0.45 ? 0.8 : bolt; ctx.fillStyle = `rgba(200,190,255,${(0.14 * k).toFixed(3)})`; ctx.fillRect(0, 0, W, H); bolt -= dt * 2.2; }
      const b = loadBest(); if (b && b.runs) text(ctx, 'BEST  ' + (b.wins ? 'VICTORY x' + b.wins : (b.deep > 10 ? 'ABYSS ' + (b.deep - 10) : 'STAGE ' + b.deep)) + '   ' + b.kills + ' KILLS', W - 6, H - 10, '#a890c8', 'right');
    } catch (e) { M15.errC = String(e && e.stack || e); }
  };
  // ---------- overlay hook ----------
  if (window.M8DRAW) M8DRAW.push(function (ctx, rdt) {
    try { let drew = false; if (drawCard(ctx, rdt || 0.016)) drew = true; if (drawPause(ctx, rdt)) drew = true; return drew; } catch (e) { M15.errC = String(e && e.stack || e); return false; }
  });
})();
