// ===== m20: master flags. ?m20=0 disables the whole pass (the build then plays exactly like m19).
// Per-feature switches (all default ON unless noted):
//   sky:    ?skyfix=0 (m18 sky bugs + 256-tall skies) ?skyopen=0 (open-air courtyards on enclosed stages)
//   fixes:  ?fix20=0 (all m18-playtest fixes) or one at a time: ?grace20=0 ?s5fix=0 ?refarm=0 ?toast20=0 ?title20=0 ?altarinfo=0 ?wpn20=0
//   floors: ?floors=0 ?floorsky=0 ?floorfoes=0 ?oath=0 ?floorbuy=0 ?floorboss=0 ?lantern=0   debug: ?floorall=1 ?floor=s1u ?floorseed=N
//   npcs:   ?npc=0 ?npcgate=0 ?lorebook=0 ?vigil=0   Appendix A extras OFF unless ?npcnew=1
(function () {
  const q = location.search || '';
  const off = /[?&]m20=0(?:&|$)/.test(q);
  const zero = k => new RegExp('[?&]' + k + '=0(?:&|$)').test(q);
  const on = k => !off && !zero(k);
  const one = k => !off && new RegExp('[?&]' + k + '=1(?:&|$)').test(q);
  const val = k => { const m = q.match(new RegExp('[?&]' + k + '=([^&]+)')); return m ? decodeURIComponent(m[1]) : null; };
  const fix = on('fix20');
  window.M20 = {
    on: !off, v: 'm20',
    skyfix: on('skyfix'), skyopen: on('skyfix') && on('skyopen'),
    fix, grace: fix && on('grace20'), s5: fix && on('s5fix'), refarm: fix && on('refarm'), toast: fix && on('toast20'),
    title: fix && on('title20'), altarinfo: fix && on('altarinfo'), wpn: fix && on('wpn20'),
    floors: on('floors'), floorsky: on('floors') && on('floorsky'), floorfoes: on('floors') && on('floorfoes'), oath: on('floors') && on('oath'),
    floorbuy: on('floors') && on('floorbuy'), floorboss: on('floors') && on('floorboss'), lantern: on('floors') && on('lantern'),
    floorall: one('floorall'), floor: off ? null : val('floor'), floorseed: off ? null : val('floorseed'),
    npc: on('npc'), npcgate: on('npc') && on('npcgate'), lorebook: on('npc') && on('lorebook'), vigil: on('npc') && on('vigil'), npcnew: on('npc') && one('npcnew'),
    err: null, errs: [], note: 'm20: floors, chapel spirits, lore book, sky + playtest fixes'
  };
  M20.fail = function (tag, e) {
    const s = tag + ': ' + ((e && (e.stack || e.message)) || e);
    if (!M20.err) M20.err = s;
    if (M20.errs.length < 30) M20.errs.push(s);
  };
  // a tiny deterministic RNG + string hash shared by the m20 modules (never touches Math.random)
  M20.fnv = function (str) { let h = 2166136261 >>> 0; str = String(str); for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return h >>> 0; };
  M20.rng = function (seed) { let a = (seed >>> 0) || 1; return function () { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
})();
