// m21a: Steam-ready foundations — save hardening, feat hook, crash log,
// focus-loss pause, display/FPS settings, first-run photosensitivity notice.
// Kill switches: ?m21a=0  or  ?m21=0
// Does not change balance, hands, bosses, vials, prices, or weapon art.
(function () {
  const M = window.M21A = { on: false, err: [], feats: [], log: [], recovered: window.__TU_RECOVERED || 0 };
  if (/[?&]m21a=0(?:&|$)/.test(location.search) || /[?&]m21=0(?:&|$)/.test(location.search)) return;
  M.on = true;
  const fail = (w, e) => { try { M.err.push(w + ': ' + (e && (e.message || e))); } catch (x) { } };

  function desk() { try { return window.M12DESKTOP || null; } catch (e) { return null; } }

  // ---------- crash log (cooperates with existing showErr) ----------
  function rec(kind, msg, stack) {
    const line = { t: Date.now(), kind, msg: String(msg || '').slice(0, 400), stack: String(stack || '').slice(0, 1200) };
    M.log.push(line);
    if (M.log.length > 60) M.log.shift();
    try { localStorage.setItem('tu_crashlog', JSON.stringify(M.log)); } catch (e) { }
    try {
      const c = desk() && desk().cloud;
      if (c && c.write) c.write('tu_crash.log', M.log.map(x => new Date(x.t).toISOString() + ' [' + x.kind + '] ' + x.msg).join('\n'));
    } catch (e) { }
  }
  try {
    const prev = localStorage.getItem('tu_crashlog');
    if (prev) { const a = JSON.parse(prev); if (Array.isArray(a)) M.log = a.slice(-60); }
  } catch (e) { }
  addEventListener('error', e => { try { rec('error', e.message, (e.filename || '') + ':' + e.lineno + '\n' + (e.error && e.error.stack || '')); } catch (x) { } });
  addEventListener('unhandledrejection', e => { try { const r = e.reason; rec('reject', r && (r.message || r), r && r.stack); } catch (x) { } });
  if (typeof showErr === 'function' && !showErr._m21a) {
    const _s = showErr;
    showErr = function (err) { try { rec('frame', err && (err.message || err), err && err.stack); } catch (e) { } return _s.apply(this, arguments); };
    showErr._m21a = 1;
  }

  // ---------- save hardening ----------
  function rotateBak(ls, cur) {
    if (!cur) return;
    try { if (ls.getItem('tu_save.bak1') === cur) return; } catch (e) { }
    try {
      const b1 = ls.getItem('tu_save.bak1');
      const b2 = ls.getItem('tu_save.bak2');
      if (b2) ls.setItem('tu_save.bak3', b2);
      if (b1) ls.setItem('tu_save.bak2', b1);
      ls.setItem('tu_save.bak1', cur);
    } catch (e) { fail('bak', e); }
  }
  function hookSave() {
    if (typeof writeSave !== 'function' || writeSave._m21a) return;
    const _w = writeSave;
    writeSave = function () {
      try { if (typeof SAVE !== 'undefined' && SAVE && (SAVE.v == null || SAVE.v < 2)) SAVE.v = 2; } catch (e) { }
      const r = _w.apply(this, arguments);
      try {
        const ls = localStorage;
        const cur = ls.getItem('tu_save');
        if (cur) {
          rotateBak(ls, cur);
          ls.setItem('tu_save.meta', JSON.stringify({ v: 2, build: (typeof BUILD !== 'undefined' ? BUILD : 'm21a'), t: Date.now() }));
        }
        try { dispatchEvent(new CustomEvent('tu-save-write', { detail: { key: 'tu_save', t: Date.now() } })); } catch (e) { }
        const c = desk() && desk().cloud;
        if (c && c.write && cur) c.write('tu_save.json', cur);
      } catch (e) { fail('write', e); }
      return r;
    };
    writeSave._m21a = 1;
    try {
      const cur = localStorage.getItem('tu_save');
      if (cur && !localStorage.getItem('tu_save.bak1')) rotateBak(localStorage, cur);
    } catch (e) { }
    if (typeof loadSave === 'function' && !loadSave._m21a) {
      const _l = loadSave;
      loadSave = function () {
        try {
          const raw = localStorage.getItem('tu_save');
          if (raw) JSON.parse(raw);
        } catch (e) {
          for (let i = 1; i <= 3; i++) {
            try {
              const b = localStorage.getItem('tu_save.bak' + i);
              if (!b) continue;
              JSON.parse(b);
              localStorage.setItem('tu_save', b);
              M.recovered = i;
              rec('recover', 'loadSave restored bak' + i);
              break;
            } catch (e2) { }
          }
        }
        return _l.apply(this, arguments);
      };
      loadSave._m21a = 1;
    }
  }

  // ---------- feat / achievement hook ----------
  function apiName(id) {
    try { if (window.M12 && M12.STEAM && M12.STEAM.map && M12.STEAM.map[id]) return M12.STEAM.map[id]; } catch (e) { }
    return 'TU_' + String(id).toUpperCase();
  }
  function fireFeat(id, why) {
    const ev = { id, api: apiName(id), t: Date.now(), why: why || 'unlock' };
    M.lastFeat = ev;
    M.feats.push(id);
    try { dispatchEvent(new CustomEvent('tu-feat', { detail: ev })); } catch (e) { fail('feat-ev', e); }
    try { const d = desk(); if (d && d.steam && d.steam.activate) d.steam.activate(ev.api); } catch (e) { fail('feat-desk', e); }
  }
  function hookAch() {
    if (!window.ACH || !ACH.unlock || ACH._m21a) return;
    ACH._m21a = 1;
    const _u = ACH.unlock;
    ACH.unlock = function (id) {
      const r = _u.apply(this, arguments);
      if (r) fireFeat(id, 'unlock');
      return r;
    };
    try {
      if (window.M12 && M12.STEAM && ACH.list) {
        for (const a of ACH.list) if (a && a.id && !M12.STEAM.map[a.id]) M12.STEAM.map[a.id] = 'TU_' + a.id.toUpperCase();
      }
    } catch (e) { fail('feat-map', e); }
    // one-shot resync of already-earned feats for the wrapper (Steam ignores repeats)
    const resync = () => {
      try {
        if (M._synced) return;
        M._synced = 1;
        const got = (SAVE && SAVE.m9 && SAVE.m9.ach) || {};
        if (ACH.list) for (const a of ACH.list) if (a && a.id && got[a.id]) fireFeat(a.id, 'resync');
      } catch (e) { fail('feat-sync', e); }
    };
    setTimeout(resync, 1600);
  }

  // ---------- focus-loss pause (blur already pauses when the pointer is locked) ----------
  addEventListener('visibilitychange', () => {
    if (!M.on) return;
    if (document.hidden) {
      try {
        if (typeof G !== 'undefined' && G.state === 'play' && !G.paused && window.RUN && RUN.on && !RUN.hub) {
          G.paused = true; G.pmSel = 0; G.pmPage = null; M.focusPaused = true;
        }
      } catch (e) { fail('focus', e); }
    } else {
      try { if (window.SFX && SFX.ctx && SFX.ctx.state === 'suspended') SFX.ctx.resume(); } catch (e) { }
    }
  });

  // ---------- display mode / vsync / FPS cap ----------
  const DISP = ['windowed', 'borderless', 'fullscreen'];
  const CAPS = [0, 30, 45, 60];
  function defOpt(S) {
    if (!S) return;
    if (S.m21disp == null) S.m21disp = 'windowed';
    if (S.m21fps == null) S.m21fps = 0;
    if (S.m21vsync == null) S.m21vsync = true;
    if (S.m21photoack == null) S.m21photoack = false;
  }
  function applyDisplay(mode) {
    const d = desk();
    try {
      if (d && d.setMode) { d.setMode(mode); return true; }
      if (d && d.fullscreen) { d.fullscreen(mode !== 'windowed'); return true; }
    } catch (e) { fail('desk-disp', e); }
    try {
      if (mode === 'windowed') { if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen(); }
      else {
        const p = document.documentElement.requestFullscreen && document.documentElement.requestFullscreen();
        if (p && p.catch) p.catch(() => { if (window.OPT) { OPT.msg = 'FULLSCREEN NEEDS A KEY OR CLICK'; OPT.msgT = 2; } });
      }
    } catch (e) { fail('disp', e); }
    return false;
  }
  function applyVsync(on) {
    try { const d = desk(); if (d && d.setVsync) d.setVsync(!!on); } catch (e) { fail('vsync', e); }
  }
  function hookOpt() {
    if (!window.OPT || OPT._m21a) return;
    OPT._m21a = 1;
    defOpt(OPT.S);
    const _rows = OPT.rows.bind(OPT);
    OPT.rows = function () {
      const L = _rows();
      if (this.page && this.page !== 'main') return L;
      if (L.some(r => r && r.id === 'm21disp')) return L;
      const S = OPT.S || {};
      const fi = L.findIndex(r => r && r.id === 'full');
      const rows = [
        { t: 'opt', id: 'm21disp', l: 'DISPLAY MODE', v: () => ({ fullscreen: 'FULLSCREEN', borderless: 'BORDERLESS', windowed: 'WINDOWED' })[S.m21disp || 'windowed'] },
        { t: 'opt', id: 'm21fps', l: 'FRAME CAP', v: () => !S.m21fps ? 'UNLIMITED' : (S.m21fps + ' FPS') },
        { t: 'opt', id: 'm21vsync', l: 'VSYNC', v: () => S.m21vsync === false ? (desk() && desk().setVsync ? 'OFF' : 'OFF (BROWSER)') : 'ON' },
        { t: 'btn', id: 'm21deck', l: 'APPLY STEAM DECK PRESET' },
      ];
      if (fi >= 0) L.splice(fi, 1, ...rows);
      else {
        const help = L.findIndex(r => r && r.t === 'hdr' && /HELP/i.test(r.l || ''));
        if (help >= 0) L.splice(help, 0, { t: 'hdr', l: 'DISPLAY' }, ...rows);
        else L.push({ t: 'hdr', l: 'DISPLAY' }, ...rows);
      }
      return L;
    };
    const _in = OPT.input.bind(OPT);
    OPT.input = function (rdt) {
      try {
        if (OPT.open && (OPT.page === 'main' || !OPT.page)) {
          const L = OPT.rows(), r = L[OPT.sel];
          if (r && (r.id === 'm21disp' || r.id === 'm21fps' || r.id === 'm21vsync' || r.id === 'm21deck')) {
            const left = KP.ArrowLeft || KP.KeyA, right = KP.ArrowRight || KP.KeyD || KP.Enter || KP.Space || KP.PadOK;
            let d = left ? -1 : right ? 1 : 0;
            if (!d && MBP[0]) d = 1;
            if (r.id === 'm21deck') {
              if (!d && (KP.Enter || KP.Space || KP.PadOK || MBP[0])) { applyDeck(); if (KP) { delete KP.Enter; delete KP.Space; delete KP.PadOK; } MBP[0] = false; }
            } else if (d) {
              stepM21(r.id, d);
              if (KP) { delete KP.ArrowLeft; delete KP.KeyA; delete KP.ArrowRight; delete KP.KeyD; delete KP.Enter; delete KP.Space; delete KP.PadOK; }
              MBP[0] = false;
            }
          }
        }
      } catch (e) { fail('opt', e); }
      return _in(rdt);
    };
  }
  function stepM21(id, dir) {
    const S = OPT.S;
    if (id === 'm21disp') {
      let i = DISP.indexOf(S.m21disp || 'windowed'); if (i < 0) i = 0;
      S.m21disp = DISP[(i + (dir < 0 ? DISP.length - 1 : 1)) % DISP.length];
      applyDisplay(S.m21disp);
    } else if (id === 'm21fps') {
      let i = CAPS.indexOf(+S.m21fps || 0); if (i < 0) i = 0;
      S.m21fps = CAPS[(i + (dir < 0 ? CAPS.length - 1 : 1)) % CAPS.length];
    } else if (id === 'm21vsync') {
      S.m21vsync = S.m21vsync === false;
      applyVsync(S.m21vsync !== false);
    }
    if (typeof OPT.save === 'function') OPT.save();
  }
  function applyDeck() {
    try {
      const S = OPT.S || {};
      S.hd = false;
      S.m20lqual = 'auto';
      S.m21fps = 30;
      S.m21vsync = true;
      S.m21deckApplied = 1;
      if (typeof GFX !== 'undefined') { GFX.hdOff = false; GFX.n = 0; }
      if (window.M20L && M20L.apply) M20L.apply();
      if (typeof OPT.save === 'function') OPT.save();
      OPT.msg = 'STEAM DECK PRESET APPLIED'; OPT.msgT = 2;
      M.deckApplied = 1;
    } catch (e) { fail('deck', e); }
  }

  // FPS cap (sits on top of m20l's Auto/Low 60 cap)
  if (typeof frame === 'function' && !frame._m21a) {
    const _fr = frame;
    let capLast = 0;
    frame = function (now) {
      try {
        const cap = (window.OPT && OPT.S && +OPT.S.m21fps) || 0;
        if (cap > 0 && capLast && (now - capLast) < (1000 / cap) - 1.2) { requestAnimationFrame(frame); return; }
        capLast = now || performance.now();
      } catch (e) { }
      return _fr.apply(this, arguments);
    };
    frame._m21a = 1;
  }

  // ---------- pause: Quit to Desktop when the wrapper is present ----------
  function hookPause() {
    if (typeof pmAct !== 'function' || pmAct._m21a) return;
    pmAct._m21a = 1;
    const _pm = pmAct;
    pmAct = function (id, dir) {
      if (id === 'quit') {
        if (!dir) {
          try { const d = desk(); if (d && d.quit) d.quit(); else { OPT && (OPT.msg = 'DESKTOP QUIT ONLY IN THE APP', OPT.msgT = 2); } } catch (e) { fail('quit', e); }
        }
        return;
      }
      return _pm.apply(this, arguments);
    };
    try {
      if (Array.isArray(PM_ITEMS) && desk() && desk().quit && !PM_ITEMS.some(x => x && x.id === 'quit')) {
        PM_ITEMS.push({ id: 'quit', label: () => 'QUIT TO DESKTOP' });
      }
    } catch (e) { fail('pm', e); }
  }

  // ---------- first-run photosensitivity notice ----------
  function ackPhoto() {
    M.photo = false;
    try {
      const el = document.getElementById('m21photo');
      if (el && el.parentNode) el.parentNode.removeChild(el);
    } catch (e) { }
    try {
      if (window.OPT && OPT.S) { OPT.S.m21photoack = true; if (typeof OPT.save === 'function') OPT.save(); }
    } catch (e) { }
  }
  M.ackPhoto = ackPhoto;
  function showPhoto() {
    if (M.photo || document.getElementById('m21photo')) return;
    if (/[?&]m21photo=0(?:&|$)/.test(location.search)) { ackPhoto(); return; }
    if (window.OPT && OPT.S && OPT.S.m21photoack) return;
    M.photo = true;
    const el = document.createElement('div');
    el.id = 'm21photo';
    el.style.cssText = 'position:fixed;inset:0;z-index:40;background:rgba(8,0,12,.88);display:flex;align-items:center;justify-content:center;font-family:Georgia,Times,serif;color:#f0e6d8;cursor:pointer';
    el.innerHTML = '<div style="max-width:540px;padding:28px 32px;border:1px solid #6a1040;background:#140610;box-shadow:0 0 48px #4a0828;">'
      + '<div style="letter-spacing:.2em;color:#d4a017;font-size:11px;margin-bottom:10px;">THE UNYIELDING</div>'
      + '<div style="font-size:22px;margin-bottom:14px;">Photosensitivity Notice</div>'
      + '<p style="line-height:1.55;font-size:14px;margin:0 0 12px;">This game uses flashing lights, sudden camera cuts, blood, and screen shake. If you are sensitive to these, open Settings and lower Screen Flashes, Screen Shake, and Blood Amount before you start a run.</p>'
      + '<p style="margin:0;font-size:13px;color:#c8b8a0;">Press Enter or click to continue.</p></div>';
    const go = ev => { if (ev) ev.preventDefault(); ackPhoto(); };
    el.addEventListener('click', go);
    const kd = ev => { if (ev.code === 'Enter' || ev.code === 'Space' || ev.code === 'Escape') { go(ev); removeEventListener('keydown', kd, true); } };
    addEventListener('keydown', kd, true);
    document.body.appendChild(el);
  }
  M.showPhoto = showPhoto;

  // ---------- boot ----------
  function boot() {
    try { hookSave(); } catch (e) { fail('save', e); }
    try { hookAch(); } catch (e) { fail('ach', e); }
    try { hookOpt(); } catch (e) { fail('opt', e); }
    try { hookPause(); } catch (e) { fail('pause', e); }
    try {
      const deckUA = /SteamDeck|SteamOS/i.test(navigator.userAgent || '');
      M.deck = !!deckUA;
      if (deckUA && window.OPT && OPT.S && !OPT.S.m21deckApplied) applyDeck();
    } catch (e) { fail('deck-auto', e); }
    try {
      if (window.OPT && OPT.S && !OPT.S.m21photoack) setTimeout(showPhoto, 400);
    } catch (e) { fail('photo', e); }
  }
  boot();
  setTimeout(boot, 0);
  setTimeout(boot, 800);

  M.st = () => ({
    on: M.on, save: !!(typeof writeSave === 'function' && writeSave._m21a),
    ach: !!(window.ACH && ACH._m21a), crash: true,
    focus: true, disp: true, recovered: M.recovered || 0,
    feats: (window.ACH && ACH.list && ACH.list.length) || 0,
    featMapped: (window.M12 && M12.STEAM && M12.STEAM.map && Object.keys(M12.STEAM.map).length) || 0,
    photo: !!M.photo, photoAck: !!(window.OPT && OPT.S && OPT.S.m21photoack),
    fps: window.OPT && OPT.S && OPT.S.m21fps, dispMode: window.OPT && OPT.S && OPT.S.m21disp,
    vsync: window.OPT && OPT.S && OPT.S.m21vsync !== false, deck: !!M.deck,
    err: M.err.slice(), logN: M.log.length
  });
})();
