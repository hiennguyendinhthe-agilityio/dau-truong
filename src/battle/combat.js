'use strict';
// Sát thương, đánh thường, chiêu, chiêu riêng, né

// ---------- CHIẾN ĐẤU ----------
function damage(t, dmg, col, size) {
  if (t.dying < 0 && t.hp - dmg > 0 && t.pa !== 'Attack' && t.pa !== 'Shoot') playAnim(t, 'Hurt');
  if (t.dying >= 0) return;
  t.hp = Math.max(0, t.hp - dmg); t.flash = .12; t.hold = .45;
  floatN(t.x, t.y - 58, String(dmg), col, size);
  if (t.hp <= 0) { ko(t); return; }
  if (t.item === 'sitrus' && !t.itemUsed && t.hp < t.maxHp / 2) { t.itemUsed = true; heal(t, Math.round(t.maxHp / 4)); floatT(t.x, t.y - 90, 'ĂN QUẢ HỒI PHỤC!', '#8cff8c', 14); }
}
function heal(f, n) { f.hp = Math.min(f.maxHp, f.hp + n); floatN(f.x, f.y - 58, '+' + n, '#7dff8a', 13); burst(f.x, f.y - 24, '#7dff8a', 6, 60, -60); }
function ko(f) {
  f.dying = 0; f.hp = 0; f.under = 0; f.dieDir = Math.random() < .5 ? -1 : 1; G.hitstop = .16; G.shake += 6; burst(f.x, f.y - 24, '#ffffff', 18, 140);
  floatT(f.x, f.y - 96, `${f.name} GỤC NGÃ!`, '#ff6a6a', 16, 1.2);
  G.teles = G.teles.filter(t => t.owner !== f); G.hazards = G.hazards.filter(h => h.owner !== f);
  Snd.faint(f.x);
  G.koBanner = { s: `${f.name} GỤC NGÃ!`, col: f.side === 0 ? '#ff5a5a' : '#ffe14a', life: 1.6, max: 1.6 };
}
function onFaint(f) {
  const S = G.sides[f.side]; S.active = null;
  if (S.team.every(x => x.fainted)) {
    if (G.phase !== 'end') {
      G.phase = 'end'; G.winner = 1 - f.side; G.endT = 0;
      Snd.stopBgm();
      if (G.winner === 0) Snd.victory(); else Snd.defeat();
    }
  }
  else G.queue.push({ side: f.side, t: .55 });
}
const atkOf = a => a.atk * a.atkMod * (a.status === 'burn' ? .8 : 1) * (a.item === 'band' ? 1.3 : 1) * (a.atkUp > 0 ? 1.3 : 1) * (a.atkDown > 0 ? .75 : 1);
// Né đúng khoảnh khắc đòn trúng (đang trong i-frame)
function perfectDodge(t) {
  if (t.pdCd > 0) return; t.pdCd = .5;
  if (t.side === 0 && !G.auto) {
    G.slowmo = .45; t.cdS = Math.max(0, t.cdS - 1); t.cdG = Math.max(0, t.cdG - .5);
    floatT(t.x, t.y - 86, 'NÉ HOÀN HẢO!', '#7ff8ff', 17, 1);
    G.rings.push({ x: t.x, y: t.y - 24, r: 6, mr: 46, life: .3, max: .3, col: '#7ff8ff' });
    Snd.perfect();
  } else { floatT(t.x, t.y - 80, 'NÉ!', '#c8f8ff', 15); Snd.dodge(t.x); }
}
function counterStrike(t, a) {
  t.counterT = 0; t.wind = null;
  const dx = a.x - t.x, dy = a.y - t.y, d = Math.hypot(dx, dy) || 1;
  burst(t.x, t.y - 24, '#ffffff', 12, 120);
  t.x = a.x - dx / d * 30; t.y = a.y - dy / d * 30; clampF(t);
  t.atkDx = dx / d; t.atkDy = dy / d; t.atkT = 1; t.face = a.x < t.x ? -1 : 1;
  floatT(t.x, t.y - 90, 'PHẢN ĐÒN!', '#ffffff', 18, 1); Snd.counter(t.x); G.hitstop = .12;
  doHit(t, a, t.d.sig, 1, { noCounter: true, melee: true, kb: 2, stun: .5 });
}
// o: { melee, kb (hệ số đẩy lùi), stun, hazard (sát thương theo nhịp từ vùng), noCounter }
function doHit(a, t, mv, mult = 1, o = {}) {
  if (G.phase !== 'fight' || !alive(t) || t.under > 0) return false;
  if (t.iframe > 0) { if (!o.hazard) perfectDodge(t); return false; }
  if (t.counterT > 0 && !o.hazard && !o.noCounter && a.dying < 0) { counterStrike(t, a); return false; }
  const e = eff(mv.t, t.types);
  if (e === 0) { if (!o.hazard) floatT(t.x, t.y - 80, 'KHÔNG TÁC DỤNG', '#c8c8c8', 14); return false; }
  const base = 22 * mv.p * atkOf(a) / t.def / 50 + 2;
  let m = e * (a.types.includes(mv.t) ? 1.5 : 1) * weatherMod(mv.t) * rnd(.88, 1) * mult * 2.2 * (a.item === 'orb' ? 1.3 : 1) * (t.fortT > 0 ? .45 : 1) * (t.mirrorT > 0 ? .5 : 1);
  const crit = !o.hazard && Math.random() < .06; if (crit) m *= 1.5;
  let dmg = Math.max(1, Math.round(base * m));
  if (t.shield > 0) {
    const ab = Math.min(t.shield, dmg); t.shield -= ab; dmg -= ab;
    floatN(t.x, t.y - 58, '-' + ab, '#bff4ff', 12); burst(t.x, t.y - 26, '#dff8ff', 6, 90); Snd.shieldHit(t.x);
    if (o.melee && a.dying < 0) a.slowT = Math.max(a.slowT, 1.5);
    if (t.shield <= 0) { t.shield = 0; t.shieldT = 0; floatT(t.x, t.y - 96, 'GIÁP VỠ!', '#bff4ff', 15); Snd.shatter(t.x); burst(t.x, t.y - 26, '#dff8ff', 18, 160); }
    if (dmg <= 0) { t.flash = .06; return true; }
  }
  if (t.item === 'sash' && !t.itemUsed && t.hp === t.maxHp && dmg >= t.hp) { dmg = t.hp - 1; t.itemUsed = true; floatT(t.x, t.y - 100, 'KHĂN TRỤ VỮNG!', '#fff0a0', 14); }
  const big = e > 1 || crit;
  damage(t, dmg, e > 1 ? '#ffe14a' : '#ffffff', o.hazard ? 12 : big ? 19 : 15);
  a.dealt += dmg;
  if (a.side === 0) { G.hc.n++; G.hc.t = 1.8; }
  if (o.hazard) { Snd.tick(t.x); t.sqv -= 2; }
  else {
    if (e > 1) floatT(t.x, t.y - 84, 'HIỆU QUẢ CAO!', '#ffe14a', 15);
    else if (e < 1) floatT(t.x, t.y - 84, 'KHÔNG HIỆU QUẢ LẮM', '#b8b8c8', 13);
    if (crit) floatT(t.x, t.y - 98, 'CHÍ MẠNG!', '#ff8a3a', 15);
    Snd.hit(t.x, e, crit, o.melee); Snd.ty(mv.t, t.x, .45);
    if (a.side === 0 && big) G.trainerCheer = .55;
    const c = TYPE_COL[mv.t]; burst(t.x, t.y - 26, c, big ? 16 : 10, big ? 170 : 120); t.sqv -= big ? 7 : 5; t.hitRot = (t.x >= a.x ? 1 : -1) * (big ? .38 : .24);
    G.hitstop = Math.max(G.hitstop, big ? .09 : .045); G.rings.push({ x: t.x, y: t.y - 26, r: 4, mr: big ? 36 : 24, life: .22, max: .22, col: '#ffffff', thin: 1 });
    G.shake += big ? 4 : 2;
  }
  if (t.fortT <= 0) { const dx = t.x - a.x, dy = t.y - a.y, d = Math.hypot(dx, dy) || 1, kb = (o.melee ? 170 : 110) * (o.kb ?? 1); t.kx += dx / d * kb; t.ky += dy / d * kb; }
  if (o.stun && t.fortT <= 0 && t.dying < 0) { t.stunT = Math.max(t.stunT, o.stun); t.swing = null; t.wind = null; floatT(t.x, t.y - 110, 'CHOÁNG!', '#ffe14a', 14); }
  if (mv.st && !t.status && t.dying < 0 && Math.random() < (mv.stc || .3)) {
    if (mv.st === 'burn' && !t.types.includes('Fire')) { t.status = 'burn'; t.stT = 6; t.burnT = 0; floatT(t.x, t.y - 110, 'BỊ BỎNG!', '#ff9a40', 14); }
    if (mv.st === 'para' && !t.types.includes('Electric')) { t.status = 'para'; t.stT = 5; floatT(t.x, t.y - 110, 'TÊ LIỆT!', '#ffe14a', 14); }
  }
  if (a.item === 'orb' && a.dying < 0 && !o.hazard) damage(a, Math.max(1, Math.round(a.maxHp / 30 * Math.min(1, mult))), '#ff9a9a', 11);
  return true;
}
function shoot(f, o, mv, off, opt = {}) {
  const sx = f.x, sy = f.y - 24, a = Math.atan2((o.y - 24) - sy, o.x - sx) + off, sp = opt.spd || 290;
  G.proj.push({ x: sx, y: sy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, owner: f, mv, life: opt.life || 1.7, col: TYPE_COL[mv.t], size: opt.size || 1, mult: opt.mult || 1, pierce: !!opt.pierce, push: opt.push || 0, k: opt.k || '' });
}
// Đánh thường: chuỗi 3 đòn, đòn 3 mạnh và đẩy lùi xa
const MELEE_M = [.45, .5, .95], SHOT_M = [.4, .4, .85];
function tryBasic(f, o) {
  if (f.atkCd <= 0) playAnim(f, f.ranged ? 'Shoot' : 'Attack');
  const mv = f.d.basic, step = f.combo; f.combo = (step + 1) % 3; f.comboT = .9;
  const dx = o.x - f.x, dy = o.y - f.y, l = Math.hypot(dx, dy) || 1, ux = dx / l, uy = dy / l;
  f.atkDx = ux; f.atkDy = uy; f.atkT = 1; f.sqv += step === 2 ? 6 : 3.5;
  f.atkCd = (step === 2 ? .62 : .3) * (1.12 - f.spd / 700) * (f.item === 'claw' ? .85 : 1) * (isAI(f) ? 1.3 : 1);
  if (mv.k === 'melee') { const p = step === 2 ? 260 : 170; f.kx += ux * p; f.ky += uy * p; f.swing = { t: .08, step, mv }; Snd.swing(f.x); }
  else { const big = step === 2; shoot(f, o, mv, 0, { mult: SHOT_M[step], size: big ? 1.7 : 1, spd: big ? 340 : 300 }); Snd.ty(mv.t, f.x, big ? 1 : .55); if (big) burst(f.x + ux * 14, f.y - 24 + uy * 14, TYPE_COL[mv.t], 8, 90); }
}
function doRoll(f, dx, dy) {
  const l = Math.hypot(dx, dy) || 1;
  f.roll = { t: .28, vx: dx / l * 340, vy: dy / l * 340 }; f.iframe = .24; f.cdR = 1.1; f.swing = null;
  Snd.dodge(f.x);
}
function castSpecial(f, o) {
  playAnim(f, ['beam', 'volley', 'quake'].includes(f.d.sp.k) ? 'Shoot' : 'Attack');
  const mv = f.d.sp; f.sqv -= 5; f.cdS = mv.cd * (f.item === 'claw' ? .85 : 1);
  floatT(f.x, f.y - 82, mv.n.toUpperCase() + '!', TYPE_COL[mv.t], 17, 1);
  burst(f.x, f.y - 24, TYPE_COL[mv.t], 10, 80);
  G.bubbles.push({ x: f.x, y: f.y - 74, s: mv.n, col: TYPE_COL[mv.t], life: 1.15, max: 1.15 });
  Snd.cast(mv.t, f.x);
  switch (mv.k) {
    case 'dash': Snd.dash(f.x); f.wind = { t: .28, cb: () => { const o2 = foe(f); if (!alive(o2)) return; const a = Math.atan2(o2.y - f.y, o2.x - f.x); f.dash = { t: .4, vx: Math.cos(a) * 560, vy: Math.sin(a) * 560, hit: false, mv }; } }; break;
    case 'volley': f.wind = { t: .2, cb: () => { const o2 = foe(f); if (!alive(o2)) return; for (const a of [-.26, 0, .26]) shoot(f, o2, mv, a); Snd.ty(mv.t, f.x, 1.2); } }; break;
    case 'beam': Snd.beamCharge(f.x); G.teles.push({ k: 'beam', owner: f, mv, ang: Math.atan2((o.y - 24) - (f.y - 24), o.x - f.x), len: 460, w: 24, t: 0, max: .6 }); f.wind = { t: .6, cb: () => { } }; break;
    case 'quake': Snd.rumble(o.x); G.teles.push({ k: 'circle', owner: f, mv, x: o.x, y: o.y, r: 54, t: 0, max: .8 }); f.wind = { t: .3, cb: () => { } }; break;
    case 'aoe': Snd.hum(f.x); G.teles.push({ k: 'ring', owner: f, mv, r: 100, t: 0, max: .45 }); f.wind = { t: .45, cb: () => { } }; break;
  }
}
// Chiêu riêng: mỗi quái thú một cơ chế độc nhất
function castSig(f, o) {
  playAnim(f, 'Attack');
  const mv = f.d.sig, col = TYPE_COL[mv.t]; f.cdG = mv.cd * (f.item === 'claw' ? .85 : 1); f.sqv -= 6;
  floatT(f.x, f.y - 82, mv.n.toUpperCase() + '!', col, 17, 1);
  G.bubbles.push({ x: f.x, y: f.y - 74, s: mv.n, col, life: 1.15, max: 1.15 });
  burst(f.x, f.y - 24, col, 14, 110);
  const dx = o.x - f.x, dy = o.y - f.y, d = Math.hypot(dx, dy) || 1;
  switch (mv.k) {
    case 'roar':
      Snd.roar(f.x); G.rings.push({ x: f.x, y: f.y - 12, r: 10, mr: 95, life: .4, max: .4, col }); G.shake += 6; f.atkUp = 5;
      floatT(f.x, f.y - 100, 'CÔNG TĂNG!', '#ff8a5a', 14);
      if (alive(o) && d < 100 && o.under <= 0 && o.iframe <= 0) { if (o.fortT <= 0) { o.kx += dx / d * 420; o.ky += dy / d * 420; } o.atkDown = 5; floatT(o.x, o.y - 96, 'CÔNG GIẢM!', '#c8a0ff', 14); }
      break;
    case 'burrow': Snd.burrow(f.x); f.under = 1.3; burst(f.x, f.y, '#a8693a', 18, 120, 200, 3); break;
    case 'trail': Snd.ty('Fire', f.x, 1.3); f.trailT = 3; break;
    case 'whirl': Snd.whirl(o.x); G.hazards.push({ k: 'whirl', x: o.x, y: o.y, r: 48, life: 3.5, max: 3.5, owner: f, mv }); break;
    case 'heal': {
      const w = G.weather && G.weather.type, r = w === 'sun' ? .45 : w ? .2 : .3;
      heal(f, Math.round(f.maxHp * r)); Snd.heal(f.x); burst(f.x, f.y - 24, '#a4e060', 20, 90, -80);
      if (f.status) { f.status = null; floatT(f.x, f.y - 96, 'HẾT TRẠNG THÁI XẤU', '#a4e060', 14); }
      f.slowT = 0; f.atkDown = 0; break;
    }
    case 'blink':
      if (!alive(o)) break; Snd.zap(f.x); burst(f.x, f.y - 24, col, 14, 140);
      G.beams.push({ x: f.x, y: f.y - 24, ang: Math.atan2(dy, dx), len: d + 34, w: 6, life: .2, max: .2, col });
      f.x = o.x + dx / d * 34; f.y = o.y + dy / d * 34; clampF(f); f.face = o.x < f.x ? -1 : 1;
      burst(f.x, f.y - 24, col, 14, 140); f.atkDx = -dx / d; f.atkDy = -dy / d; f.atkT = 1;
      doHit(f, o, mv, 1, { melee: true, stun: .7 }); break;
    case 'shield': Snd.shield(f.x); f.shield = Math.round(f.maxHp * .25); f.shieldT = 5; break;
    case 'tornado': Snd.tornado(f.x); shoot(f, o, mv, 0, { spd: 190, size: 2.2, pierce: true, push: 480, life: 2.4, k: 'tornado' }); break;
    case 'reflect': Snd.reflect(f.x); f.mirrorT = 2.2; break;
    case 'counter': Snd.counterReady(f.x); f.counterT = .9; break;
    case 'fort':
      Snd.fort(f.x); f.fortT = 4.5; G.rings.push({ x: f.x, y: f.y - 8, r: 10, mr: 70, life: .35, max: .35, col }); G.shake += 5;
      for (let i = 0; i < 6; i++) G.debris.push({ x: f.x + rnd(-50, 50), y: f.y + rnd(-25, 25), s: rnd(3, 6) | 0, life: 5, col: '#9a8a6a' });
      if (alive(o) && d < 70) doHit(f, o, mv, 1, { kb: 1.4 }); break;
    case 'meteor':
      Snd.meteorCall(f.x);
      for (let i = 0; i < 3; i++) { const a = Math.random() * Math.PI * 2, r2 = i ? rnd(25, 55) : 0; G.teles.push({ k: 'circle', fx: 'meteor', owner: f, mv, x: o.x + Math.cos(a) * r2, y: o.y + Math.sin(a) * r2 * .6, r: 40, t: -i * .3, max: .9 }); }
      break;
    case 'spikes': {
      Snd.spikes(f.x); const sp = [];
      for (let i = 0; i < 26; i++) { const a = Math.random() * Math.PI * 2, r2 = Math.sqrt(Math.random()) * 66; sp.push([Math.cos(a) * r2, Math.sin(a) * r2 * .6]); }
      G.hazards.push({ k: 'spike', x: f.x, y: f.y, r: 72, life: 5, max: 5, owner: f, mv, sp }); break;
    }
    case 'storm':
      Snd.stormCall(f.x);
      for (let i = 0; i < 3; i++) G.teles.push({ k: 'circle', fx: 'storm', owner: f, mv, x: o.x, y: o.y, r: 30, t: -i * .5, max: .55, track: o });
      break;
  }
}
function segDist(px, py, ox, oy, ang, len) { const c = Math.cos(ang), s = Math.sin(ang); let u = (px - ox) * c + (py - oy) * s; u = Math.max(0, Math.min(len, u)); return Math.hypot(px - (ox + c * u), py - (oy + s * u)); }
function threat(t, f) {
  if (t.t < 0) return null;
  if (t.k === 'circle') return Math.hypot(f.x - t.x, f.y - t.y) < t.r + 18 ? [f.x - t.x || 1, f.y - t.y] : null;
  if (t.k === 'ring') { const o = t.owner; return Math.hypot(f.x - o.x, f.y - o.y) < t.r + 18 ? [f.x - o.x || 1, f.y - o.y] : null; }
  if (t.k === 'beam') { const o = t.owner, c = Math.cos(t.ang), s = Math.sin(t.ang), px = f.x - o.x, py = f.y - o.y; const along = px * c + py * s, perp = -px * s + py * c; if (along > 0 && Math.abs(perp) < t.w / 2 + 20) { const sg = perp >= 0 ? 1 : -1; return [-s * sg, c * sg]; } }
  return null;
}
function resolveTele(t) {
  const f = t.owner; if (f.dying >= 0) return; const o = foe(f), col = TYPE_COL[t.mv.t];
  if (t.k === 'beam') { const ox = f.x, oy = f.y - 24; G.beams.push({ x: ox, y: oy, ang: t.ang, len: t.len, w: t.w, life: .35, max: .35, col }); G.shake += 5; Snd.beam(f.x); if (alive(o) && segDist(o.x, o.y - 22, ox, oy, t.ang, t.len) < t.w / 2 + 12) doHit(f, o, t.mv); }
  if (t.k === 'circle') {
    if (t.fx === 'storm') { bolt(t.x, t.y); burst(t.x, t.y - 6, '#fff6a0', 18, 150); Snd.thunder(t.x); G.shake += 5; }
    else {
      burst(t.x, t.y - 6, col, 28, 170, 240, 3); for (let i = 0; i < 6; i++)G.debris.push({ x: t.x + rnd(-t.r, t.r) * .8, y: t.y + rnd(-t.r, t.r) * .5, s: rnd(3, 5) | 0, life: 6, col: '#6e6a9c' });
      G.shake += 7; if (t.fx === 'meteor') Snd.impact(t.x); else Snd.quake(t.x);
    }
    if (alive(o) && Math.hypot(o.x - t.x, o.y - t.y) < t.r + 10) doHit(f, o, t.mv);
  }
  if (t.k === 'ring') { G.rings.push({ x: f.x, y: f.y - 12, r: 12, mr: t.r, life: .35, max: .35, col }); G.shake += 4; Snd.wave(t.mv.t, f.x); if (alive(o) && Math.hypot(o.x - f.x, o.y - f.y) < t.r + 8) doHit(f, o, t.mv); }
}
function clampF(f) { f.x = Math.max(AR.x0 + 16, Math.min(AR.x1 - 16, f.x)); f.y = Math.max(AR.y0 + 56, Math.min(AR.y1 - 6, f.y)); }
