'use strict';
// Trạng thái trận đấu, lớp Fighter, ra sân, thời tiết

// ---------- TRẠNG THÁI ----------
let G = null, MODE = 'manual', SPEED = 1, joy = null;
const keys = {}, inp = { atk: 0, sk1: 0, sk2: 0, dodge: 0 }, held = { atk: false };
const press = k => { inp[k] = G ? G.clock + .001 : 0; };
const COMBAT0 = { atkCd: .5, cdS: 2, cdG: 3, cdR: 0, combo: 0, comboT: 0, swing: null, roll: null, iframe: 0, stunT: 0, slowT: 0, atkUp: 0, atkDown: 0, shield: 0, shieldT: 0, under: 0, trailT: 0, trailAcc: 0, mirrorT: 0, counterT: 0, fortT: 0, hzT: 0, pdCd: 0, dash: null, wind: null };
class Fighter {
  constructor(d, side) {
    Object.assign(this, { d, side, name: d.name, types: d.types, maxHp: d.b[0] * 5 + 300, atk: d.b[1], def: d.b[2], spd: d.b[3], item: d.item, itemUsed: false, sprite: SPR[d.id], ranged: d.basic.k === 'shot' });
    this.hp = this.dispHp = this.trailHp = this.maxHp; this.hold = 0;
    Object.assign(this, { x: 180, y: 300, vx: 0, vy: 0, kx: 0, ky: 0, status: null, stT: 0, burnT: 0, atkMod: 1, flash: 0, appear: 0, released: false, dying: -1, fainted: false, strafe: Math.random() < .5 ? 1 : -1, strafeT: 1, face: 1, bob: Math.random() * 6, leftT: 0, dealt: 0, sq: 0, sqv: 0, rot: 0, hitRot: 0, walk: 0, hop: 0, atkT: 0, atkDx: 0, atkDy: 0, faceS: 1, ghosts: [], dieDir: 1 }, COMBAT0);
  }
}
const easeOutBack = p => { const c = 1.9; return 1 + (c + 1) * Math.pow(p - 1, 3) + c * Math.pow(p - 1, 2); };
const easeOutCubic = p => 1 - Math.pow(1 - p, 3);
function animF(f, dt) {
  f.paT = (f.paT || 0) + (f.dying >= 0 ? 0 : dt); f.loopT = (f.loopT || 0) + dt * Math.max(.6, Math.min(1.7, Math.hypot(f.vx, f.vy) / 90));
  { const mv = f.dash || f.roll, sp = Math.hypot(f.vx, f.vy); let vx = 0, vy = 0;
    if (mv) { vx = mv.vx; vy = mv.vy; } else if (sp > 15) { vx = f.vx; vy = f.vy; } else if (G && foe(f) && foe(f).released) { vx = foe(f).x - f.x; vy = foe(f).y - f.y; }
    if (f.pa && f.atkDx !== undefined && f.paT < .35 && (f.atkDx || f.atkDy)) { vx = f.atkDx; vy = f.atkDy; }
    if (vx || vy) { const ang = Math.atan2(vx, vy), cur = (f.dir8 === undefined ? (f.side ? 0 : 4) : f.dir8) * Math.PI / 4; let df = Math.atan2(Math.sin(ang - cur), Math.cos(ang - cur));
      if (f.dir8 === undefined || Math.abs(df) > .5) f.dir8 = ((Math.round(ang / (Math.PI / 4)) % 8) + 8) % 8; } }
  f.sqv += (-170 * f.sq - 13 * f.sqv) * dt; f.sq += f.sqv * dt;
  const sp = Math.hypot(f.vx, f.vy);
  if (sp > 18 && !f.dash && !f.roll && f.dying < 0) {
    const w0 = f.walk; f.walk += dt * (7 + sp * .045); f.hop = Math.abs(Math.sin(f.walk)) * Math.min(1, sp / 90) * 5;
    if (Math.floor(w0 / Math.PI) !== Math.floor(f.walk / Math.PI) && !f.under) { f.sqv -= 2.2; G.parts.push({ x: f.x + rnd(-8, 8), y: f.y - 1, vx: rnd(-25, 25), vy: rnd(-12, -4), life: .35, max: .35, col: '#a8a2b0', s: 3, g: 0, drag: 3 }); }
  }
  else f.hop *= Math.pow(.0005, dt);
  const mover = f.dash || f.roll;
  const tr = Math.max(-.2, Math.min(.2, f.vx / 450)) + (mover ? Math.sign(mover.vx || 1) * .32 : 0) + f.hitRot;
  f.rot += (tr - f.rot) * Math.min(1, dt * 12); f.hitRot *= Math.pow(.004, dt);
  f.faceS += (f.face - f.faceS) * Math.min(1, dt * 16);
  if (f.atkT > 0) f.atkT = Math.max(0, f.atkT - dt / .3);
  if (mover && Math.random() < dt * 45) f.ghosts.push({ x: f.x, y: f.y, a: .55, rot: f.rot, fs: f.faceS * (f.sprite.dir || 1) });
  for (const g of f.ghosts) g.a -= dt * 2.6; f.ghosts = f.ghosts.filter(g => g.a > 0);
}
const alive = f => f && f.dying < 0 && f.released && f.appear >= 1;
const foe = f => G.sides[1 - f.side].active;
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const rnd = (a, b) => a + Math.random() * (b - a);
const isAI = f => !ctrlOf(f);

// opts: { me: đội của máy này (0/1), net: 'host' | 'guest' | undefined, names: [tên đội 0, tên đội 1] }
function newBattle(pt, et, opts = {}) {
  pt.concat(et).forEach(d => ensurePMD(d.dex));
  G = {
    mapMet: [],
    me: opts.me || 0, net: opts.net, sides: [{ name: (opts.names || [])[0] || 'BẠN', team: pt.map(d => new Fighter(d, 0)), active: null, shown: null, col: (opts.me || 0) === 0 ? '#4aa8ff' : '#ff5a5a' }, { name: (opts.names || [])[1] || 'ĐỐI THỦ', team: et.map(d => new Fighter(d, 1)), active: null, shown: null, col: (opts.me || 0) === 1 ? '#4aa8ff' : '#ff5a5a' }],
    weather: null, proj: [], parts: [], floats: [], teles: [], beams: [], rings: [], balls: [], debris: [], wp: [], queue: [], hazards: [], bolts: [],
    bubbles: [], fightBanner: 0, koBanner: null, trainerCheer: 0, hc: { n: 0, t: 0 }, slowmo: 0, clock: 0, hbT: 0,
    hitstop: 0, time: 0, phase: 'intro', pt: 0, shake: 0, auto: MODE === 'auto', paused: false, winner: -1, banner: null, endT: 0, wt: 0
  };
  for (const k in inp) inp[k] = 0;
  G.sides.forEach(S => S.shown = S.team[0]);
  syncCtrl();
}
function sendOut(i) {
  const S = G.sides[i], f = S.team.find(x => !x.fainted); if (!f) return;
  S.active = f; S.shown = f;
  G.matchT = 0; G.sdT = 0;
  Object.assign(f, COMBAT0, { x: 180, y: i === 0 ? 515 : 228, appear: 0, released: false, vx: 0, vy: 0, kx: 0, ky: 0, cdS: rnd(1.5, 2.5), cdG: rnd(2.5, 4) });
  G.balls.push({ f, t: 0, max: .55, sx: i === 0 ? 24 : 336, sy: i === 0 ? 632 : 112, tx: f.x, ty: f.y - 24, col: S.col });
  Snd.ballThrow(f.x);
  floatT(180, i === 0 ? 445 : 300, i === 0 ? `TIẾN LÊN, ${f.name}!` : `ĐỐI THỦ TUNG RA ${f.name}!`, '#ffffff', 17, 1.3);
}
function onEnter(f) {
  const o = foe(f);
  if (['sand', 'rain', 'sun', 'hail'].includes(f.d.ab)) setWeather(f.d.ab, f);
  if (f.d.ab === 'intim' && o && o.released) { o.atkMod *= .8; floatT(o.x, o.y - 84, 'BỊ ĐE DỌA! CÔNG GIẢM', '#ff9a9a', 14); }
}
function setWeather(type, f) {
  const dur = f.item === WEATHER[type].item ? 32 : 20;
  if (G.weather && G.weather.type === type) G.weather.t = Math.max(G.weather.t, dur);
  else G.weather = { type, t: dur, max: dur, tick: 0 };
  G.banner = { s: `${f.name} GỌI ${WEATHER[type].n}!`, col: WEATHER[type].col, life: 1.6, max: 1.6 };
  Snd.weather(type);
}
const weatherMod = t => { const w = G.weather && G.weather.type; if (w === 'sun') return t === 'Fire' ? 1.5 : t === 'Water' ? .5 : 1; if (w === 'rain') return t === 'Water' ? 1.5 : t === 'Fire' ? .5 : 1; return 1; };
