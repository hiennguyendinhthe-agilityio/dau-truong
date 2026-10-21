'use strict';
// Cập nhật mỗi khung hình: di chuyển, đạn, thời tiết, đột tử

function updF(f, dt) {
  animF(f, dt); f.bob += dt * 6; f.flash = Math.max(0, f.flash - dt);
  if (f.dying >= 0) { f.dying += dt; if (f.dying >= .9 && !f.fainted) { f.fainted = true; onFaint(f); } return; }
  if (!f.released) return;
  if (f.appear < 1) { f.appear = Math.min(1, f.appear + dt / .3); if (f.appear >= 1) onEnter(f); return; }
  const fight = G.phase === 'fight', para = f.status === 'para', rate = para ? .6 : 1;
  // Bộ đếm thời gian
  f.atkCd -= dt * rate; f.cdS -= dt * rate; f.cdG -= dt * rate; f.cdR -= dt;
  for (const k of ['iframe', 'stunT', 'slowT', 'atkUp', 'atkDown', 'mirrorT', 'counterT', 'fortT', 'hzT', 'pdCd']) if (f[k] > 0) f[k] -= dt;
  if (f.shieldT > 0) { f.shieldT -= dt; if (f.shieldT <= 0) f.shield = 0; }
  if (f.comboT > 0) { f.comboT -= dt; if (f.comboT <= 0) f.combo = 0; }
  if (f.status) {
    f.stT -= dt;
    if (f.status === 'burn' && fight) { f.burnT += dt; if (f.burnT >= 1) { f.burnT -= 1; damage(f, Math.max(1, Math.round(f.maxHp / 32)), '#ffb070', 12); if (f.dying >= 0) return; } }
    if (f.stT <= 0) { f.status = null; f.burnT = 0; }
  }
  if (f.item === 'lefto' && fight) { f.leftT += dt; if (f.leftT >= 2.5) { f.leftT = 0; if (f.hp < f.maxHp) heal(f, Math.round(f.maxHp / 20)); } }
  // Hạt hiệu ứng trạng thái (sinh trong update, không sinh trong render)
  if (!f.under) {
    if (f.status === 'burn' && Math.random() < dt * 18) G.parts.push({ x: f.x + rnd(-12, 12), y: f.y - rnd(6, 40), vx: 0, vy: -40, life: .3, max: .3, col: '#ff8a3a', s: 3, g: 0 });
    if (para && Math.random() < dt * 6) G.parts.push({ x: f.x + rnd(-14, 14), y: f.y - rnd(10, 44), vx: 0, vy: -20, life: .2, max: .2, col: '#ffe14a', s: 2, g: 0 });
    if (f.wind && Math.random() < dt * 30) G.parts.push({ x: f.x + rnd(-24, 24), y: f.y - rnd(0, 50), vx: 0, vy: -60, life: .35, max: .35, col: TYPE_COL[f.d.sp.t], s: 3, g: 0, drag: 1 });
    if (f.slowT > 0 && Math.random() < dt * 10) G.parts.push({ x: f.x + rnd(-14, 14), y: f.y - rnd(0, 30), vx: 0, vy: 20, life: .4, max: .4, col: '#bfe8ff', s: 2, g: 0 });
    if (f.atkUp > 0 && Math.random() < dt * 8) G.parts.push({ x: f.x + rnd(-14, 14), y: f.y - rnd(10, 40), vx: 0, vy: -50, life: .4, max: .4, col: '#ff7a5a', s: 2, g: 0 });
  }
  const damp = Math.pow(.002, dt); f.kx *= damp; f.ky *= damp;
  const o = foe(f), ok = alive(o) && fight, manual = f.side === 0 && !G.auto;
  if (ok) f.face = o.x < f.x ? -1 : 1;
  // Lăn né
  if (f.roll) {
    f.x += f.roll.vx * dt; f.y += f.roll.vy * dt; f.roll.t -= dt; f.vx = f.roll.vx * .3; f.vy = f.roll.vy * .3;
    if (Math.random() < dt * 30) G.parts.push({ x: f.x + rnd(-8, 8), y: f.y - 2, vx: rnd(-20, 20), vy: rnd(-15, -5), life: .3, max: .3, col: '#a8a2b0', s: 3, g: 0, drag: 3 });
    if (f.roll.t <= 0) f.roll = null; clampF(f); return;
  }
  // Lao tới (chiêu dash)
  if (f.dash) {
    f.x += f.dash.vx * dt; f.y += f.dash.vy * dt; f.dash.t -= dt;
    G.parts.push({ x: f.x + rnd(-8, 8), y: f.y - rnd(8, 40), vx: -f.dash.vx * .1, vy: -f.dash.vy * .1, life: .25, max: .25, col: TYPE_COL[f.dash.mv.t], s: 3, g: 0 });
    if (ok && !f.dash.hit && dist(f, o) < 36) { f.dash.hit = true; if (doHit(f, o, f.dash.mv, 1, { melee: true, kb: 1.6 })) f.dash.t = Math.min(f.dash.t, .05); }
    if (f.dash && f.dash.t <= 0) f.dash = null; clampF(f); return;
  }
  // Độn thổ: di chuyển nhanh dưới đất rồi trồi lên
  if (f.under > 0) {
    let mx = 0, my = 0; if (manual) [mx, my] = inputVec(); else if (ok) [mx, my] = ai(f, o, dt);
    const sp = (70 + f.spd * .9) * 1.5, k = Math.min(1, dt * 10);
    f.vx += (mx * sp - f.vx) * k; f.vy += (my * sp - f.vy) * k; f.x += f.vx * dt; f.y += f.vy * dt; clampF(f);
    if (Math.random() < dt * 25) G.parts.push({ x: f.x + rnd(-10, 10), y: f.y - 2, vx: rnd(-40, 40), vy: rnd(-60, -20), life: .4, max: .4, col: Math.random() < .5 ? '#a8693a' : '#7a5a3a', s: 3, g: 200 });
    f.under -= dt;
    if (f.under <= 0) {
      f.under = 0; burst(f.x, f.y - 10, '#a8693a', 24, 160, 260, 3); G.rings.push({ x: f.x, y: f.y - 6, r: 8, mr: 60, life: .3, max: .3, col: TYPE_COL.Ground }); G.shake += 6; Snd.emerge(f.x);
      if (ok && dist(f, o) < 62) doHit(f, o, f.d.sig, 1, { kb: 1.5 });
    }
    return;
  }
  // Choáng
  if (f.stunT > 0) {
    f.vx *= damp; f.vy *= damp; f.x += f.kx * dt; f.y += f.ky * dt; clampF(f);
    if (Math.random() < dt * 8) G.parts.push({ x: f.x + rnd(-10, 10), y: f.y - 60, vx: rnd(-20, 20), vy: -10, life: .3, max: .3, col: '#ffe14a', s: 2, g: 0 });
    return;
  }
  if (f.wind) { f.wind.t -= dt; if (f.wind.t <= 0) { const cb = f.wind.cb; f.wind = null; cb(); } }
  if (f.swing) {
    f.swing.t -= dt;
    if (f.swing.t <= 0) {
      const s = f.swing; f.swing = null;
      if (ok && dist(f, o) < 56) { burst((f.x + o.x) / 2, (f.y + o.y) / 2 - 24, '#ffffff', s.step === 2 ? 10 : 5, 100); doHit(f, o, s.mv, MELEE_M[s.step], { melee: true, kb: s.step === 2 ? 2 : .8 }); if (s.step === 2) G.shake += 3; }
      else Snd.whiff(f.x);
    }
  }
  // Trail lửa
  if (f.trailT > 0) {
    f.trailT -= dt; f.trailAcc += dt;
    if (f.trailAcc > .07) { f.trailAcc = 0; G.hazards.push({ k: 'fire', x: f.x + rnd(-3, 3), y: f.y + rnd(-2, 2), r: 13, life: 2.6, max: 2.6, owner: f, mv: f.d.sig }); }
  }
  // Di chuyển
  let mx = 0, my = 0;
  if (manual && fight) [mx, my] = inputVec(); else if (ok) [mx, my] = ai(f, o, dt);
  const sp = (70 + f.spd * .9) * (para ? .55 : 1) * (f.slowT > 0 ? .55 : 1) * (f.wind ? .25 : 1) * (f.trailT > 0 ? 1.3 : 1) * (f.counterT > 0 ? .15 : 1) * (f.fortT > 0 ? .6 : 1) * (f.swing ? .4 : 1);
  const k = Math.min(1, dt * 10);
  f.vx += (mx * sp - f.vx) * k; f.vy += (my * sp - f.vy) * k;
  f.x += (f.vx + f.kx) * dt; f.y += (f.vy + f.ky) * dt; clampF(f);
  if (!fight) return;
  // Hành động
  const free = !f.wind && !f.swing && f.counterT <= 0;
  if (manual) {
    if (wants('dodge') && f.cdR <= 0 && !f.wind) {
      inp.dodge = 0; let [rx, ry] = inputVec();
      if (!rx && !ry) { if (ok) { rx = f.x - o.x; ry = f.y - o.y; } else rx = -f.face; }
      doRoll(f, rx, ry); return;
    }
    if (!ok || !free) return;
    if (wants('sk2') && f.cdG <= 0) { inp.sk2 = 0; castSig(f, o); }
    else if (wants('sk1') && f.cdS <= 0) { inp.sk1 = 0; castSpecial(f, o); }
    else if ((wants('atk') || heldAtk()) && f.atkCd <= 0) { inp.atk = 0; tryBasic(f, o); }
  } else {
    if (!ok) return;
    if (aiDodge(f)) return;
    if (!free) return;
    const d = dist(f, o);
    if (aiSig(f, o, d, dt)) castSig(f, o);
    else if (aiSpecial(f, o, d, dt)) castSpecial(f, o);
    else if (f.atkCd <= 0 && (f.ranged ? d < 300 : d < 50)) tryBasic(f, o);
  }
}
function separate() {
  const a = G.sides[0].active, b = G.sides[1].active; if (!alive(a) || !alive(b) || a.dash || b.dash || a.under || b.under) return;
  const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1;
  if (d < 26) { const p = (26 - d) / 2; a.x -= dx / d * p; a.y -= dy / d * p; b.x += dx / d * p; b.y += dy / d * p; clampF(a); clampF(b); }
}
function updHazards(dt) {
  for (const h of G.hazards) {
    h.life -= dt;
    if (h.k === 'fire' && Math.random() < dt * 5) G.parts.push({ x: h.x + rnd(-8, 8), y: h.y - rnd(0, 6), vx: 0, vy: -45, life: .35, max: .35, col: Math.random() < .5 ? '#ffb020' : '#ff6a1a', s: 2, g: 0 });
    if (h.k === 'whirl' && Math.random() < dt * 20) { const a = Math.random() * Math.PI * 2; G.parts.push({ x: h.x + Math.cos(a) * h.r, y: h.y + Math.sin(a) * h.r * .6, vx: -Math.sin(a) * 60 - Math.cos(a) * 30, vy: Math.cos(a) * 36 - Math.sin(a) * 18, life: .5, max: .5, col: '#9fe0ff', s: 2, g: 0, drag: 1 }); }
    const o = foe(h.owner);
    if (!alive(o) || o.under > 0 || G.phase !== 'fight') continue;
    const dx = o.x - h.x, dy = o.y - h.y;
    if (Math.hypot(dx, dy / .6) < h.r + 8) {
      if (h.k === 'whirl') { o.slowT = Math.max(o.slowT, .25); if (o.fortT <= 0 && !o.roll) { o.x -= dx * dt * 1.3; o.y -= dy * dt * 1.3; } }
      if (h.k === 'spike') o.slowT = Math.max(o.slowT, .25);
      if (o.hzT <= 0) { o.hzT = h.k === 'fire' ? .45 : .6; doHit(h.owner, o, h.mv, 1, { hazard: true, kb: .1 }); }
    }
  }
  G.hazards = G.hazards.filter(h => h.life > 0); if (G.hazards.length > 90) G.hazards.splice(0, G.hazards.length - 90);
}
function updWeather(dt) {
  const w = G.weather;
  if (w) {
    w.t -= dt;
    if (G.phase === 'fight') {
      w.tick += dt; if (w.tick >= 1) {
        w.tick -= 1; const info = WEATHER[w.type];
        if (info.immune) for (const S of G.sides) { const f = S.active; if (alive(f) && f.under <= 0 && !f.types.some(t => info.immune.includes(t))) { floatT(f.x, f.y - 96, info.n + '!', info.col, 15, .8); damage(f, Math.max(1, Math.round(f.maxHp / 24)), '#ffffff', 15); } }
      }
    }
    if (w.t <= 0) { G.banner = { s: `${WEATHER[w.type].n} ĐÃ TAN`, col: '#dddddd', life: 1.2, max: 1.2 }; G.weather = null; }
  }
  const ty = G.weather && G.weather.type;
  const spawn = (rate, fn) => { G.wt += rate * dt; while (G.wt >= 1) { G.wt -= 1; fn(); } };
  if (ty === 'sand') { spawn(220, () => { if (Math.random() < .035) G.wp.push({ k: 'rock', x: rnd(AR.x0 + 10, AR.x1 - 10), y: rnd(AR.y0 + 20, AR.y1 - 10), h: rnd(160, 260), vz: 0, s: rnd(5, 10) | 0 }); else G.wp.push({ k: 'dot', x: rnd(0, W + 120), y: rnd(AR.y0 - 60, H), vx: rnd(-330, -240), vy: rnd(80, 130), life: 1.4, col: ['#e8c98a', '#d8b070', '#f4e0b0'][Math.random() * 3 | 0], s: Math.random() < .3 ? 2 : 1 }); }); }
  else if (ty === 'rain') spawn(110, () => G.wp.push({ k: 'rain', x: rnd(0, W + 60), y: rnd(AR.y0 - 80, H - 100), vx: -70, vy: 560, life: .7 }));
  else if (ty === 'hail') spawn(45, () => { G.wp.push({ k: 'dot', x: rnd(0, W + 60), y: rnd(AR.y0 - 60, H - 80), vx: -50, vy: 300, life: 1.2, col: '#f0fcff', s: 2 }); if (Math.random() < .15) Snd.T({ f: rnd(3000, 5000), w: 'triangle', dur: .03, v: .02, x: rnd(0, W) }); });
  else if (ty === 'sun') spawn(8, () => G.wp.push({ k: 'dot', x: rnd(AR.x0, AR.x1), y: rnd(AR.y0, AR.y1), vx: 0, vy: -14, life: 1.2, col: '#fff2a0', s: 2 }));
  for (const p of G.wp) {
    if (p.k === 'rock') { p.vz += 600 * dt; p.h -= p.vz * dt; if (p.h <= 0) { p.dead = true; G.debris.push({ x: p.x, y: p.y, s: p.s, life: 14, col: Math.random() < .5 ? '#6e6a9c' : '#5c5888' }); burst(p.x, p.y, '#c8b088', 4, 40); } }
    else { p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt; if (p.life <= 0) p.dead = true; }
  }
  G.wp = G.wp.filter(p => !p.dead); if (G.wp.length > 500) G.wp.splice(0, G.wp.length - 500);
  for (const d of G.debris) d.life -= dt * (ty === 'sand' ? .5 : 2);
  G.debris = G.debris.filter(d => d.life > 0); if (G.debris.length > 70) G.debris.splice(0, G.debris.length - 70);
}
function updProj(dt) {
  for (const p of G.proj) {
    p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt;
    if (p.k === 'tornado') { if (Math.random() < .6) { const a = Math.random() * Math.PI * 2; G.parts.push({ x: p.x + Math.cos(a) * 14, y: p.y + Math.sin(a) * 18, vx: -Math.sin(a) * 90, vy: Math.cos(a) * 40, life: .3, max: .3, col: '#e8e0ff', s: 2, g: 0 }); } }
    else G.parts.push({ x: p.x, y: p.y, vx: rnd(-20, 20) - p.vx * .08, vy: rnd(-20, 20) - p.vy * .08, life: .3, max: .3, col: p.col, s: 3 + p.size, g: 0 });
    const t = foe(p.owner);
    if (alive(t) && t.under <= 0 && !(p.pierce && p.hit) && Math.hypot(p.x - t.x, p.y - (t.y - 24)) < 12 + 5 * p.size) {
      if (t.mirrorT > 0 && !p.reflected) {
        const sp = Math.hypot(p.vx, p.vy) * 1.15, src = p.owner, a = Math.atan2((src.y - 24) - p.y, src.x - p.x);
        p.vx = Math.cos(a) * sp; p.vy = Math.sin(a) * sp; p.owner = t; p.reflected = true; p.life = 1.7;
        burst(p.x, p.y, '#ff9ad0', 10, 120); floatT(t.x, t.y - 90, 'PHẢN XẠ!', '#ff9ad0', 15); Snd.ping(t.x);
      }
      else if (t.iframe > 0) { if (!p.dodged) { p.dodged = true; perfectDodge(t); } }
      else { doHit(p.owner, t, p.mv, p.mult, { kb: p.push ? p.push / 110 : 1 }); if (p.pierce) p.hit = true; else p.life = 0; burst(p.x, p.y, p.col, 6, 90); }
    }
    if (p.x < AR.x0 || p.x > AR.x1 || p.y < AR.y0 || p.y > AR.y1) p.life = 0;
  }
  G.proj = G.proj.filter(p => p.life > 0);
}
function update(dt) {
  G.pt += dt; G.clock += dt; G.shake = Math.max(0, Math.min(10, G.shake) - dt * 28);
  if (G.fightBanner > 0) G.fightBanner -= dt;
  if (G.koBanner) { G.koBanner.life -= dt; if (G.koBanner.life <= 0) G.koBanner = null; }
  if (G.trainerCheer > 0) G.trainerCheer -= dt;
  if (G.hc.t > 0) { G.hc.t -= dt; if (G.hc.t <= 0) G.hc.n = 0; }
  for (const b of G.bubbles) { b.y -= 14 * dt; b.life -= dt; }
  G.bubbles = G.bubbles.filter(b => b.life > 0);
  if (G.phase === 'intro') {
    if (G.pt > 1.8) { G.phase = 'fight'; G.fightBanner = 1.35; Snd.fight(); Snd.startBgm(); sendOut(0); sendOut(1); }
  }
  else {
    if (G.phase === 'fight') G.time += dt; else G.endT += dt;
    if (G.phase === 'fight' && alive(G.sides[0].active) && alive(G.sides[1].active)) {
      G.matchT = (G.matchT || 0) + dt;
      if (G.matchT > 45) {
        if (!G.sdOn) { G.sdOn = true; G.banner = { s: 'ĐỘT TỬ! CẢ HAI MẤT MÁU DẦN', col: '#ff6a5a', life: 1.6, max: 1.6 }; }
        G.sdT = (G.sdT || 0) + dt;
        if (G.sdT >= 1) { G.sdT -= 1; for (const S of G.sides) { const f = S.active; if (alive(f)) damage(f, Math.max(1, Math.round(f.maxHp * Math.min(.12, .03 + (G.matchT - 45) * .003))), '#ff9a9a', 13); } }
      }
    } else G.sdOn = false;
    for (const S of G.sides) if (S.active) updF(S.active, dt);
    for (const q of G.queue) q.t -= dt;
    G.queue = G.queue.filter(q => { if (q.t <= 0) { sendOut(q.side); return false; } return true; });
    updWeather(dt); updHazards(dt); updProj(dt);
    for (const t of G.teles) {
      t.t += dt;
      if (t.t < 0) { if (t.track && alive(t.track)) { t.x = t.track.x; t.y = t.track.y; } continue; }
      if (t.fx === 'meteor' && !t.whistled) { t.whistled = true; Snd.whistle(t.x); }
      if (t.t >= t.max) { t.done = true; resolveTele(t); }
    }
    G.teles = G.teles.filter(t => !t.done);
    separate();
    // Nhạc gay cấn hơn khi còn 1 quái thú hoặc máu thấp; nhịp tim cảnh báo
    const pa = G.sides[0].active;
    Snd.music.level = (G.sides.some(S => S.team.filter(m => !m.fainted).length <= 1) || (pa && pa.hp < pa.maxHp * .3)) ? 2 : 1;
    if (G.phase === 'fight' && !G.auto && alive(pa) && pa.hp < pa.maxHp * .25) { G.hbT -= dt; if (G.hbT <= 0) { G.hbT = .9; Snd.heartbeat(); } }
  }
  for (const b of G.balls) {
    b.t += dt;
    if (b.t >= b.max) { b.done = true; b.f.released = true; Snd.ballOpen(b.tx); burst(b.tx, b.ty, '#ffffff', 16, 120); burst(b.tx, b.ty, b.col, 8, 90); }
  }
  G.balls = G.balls.filter(b => !b.done);
  for (const p of G.parts) { const dr = Math.pow(.5, dt * (p.drag || 2.2)); p.vx *= dr; p.vy *= dr; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += p.g * dt; p.life -= dt; }
  G.parts = G.parts.filter(p => p.life > 0); if (G.parts.length > 900) G.parts.splice(0, G.parts.length - 900);
  for (const f of G.floats) { f.x += (f.vx || 0) * dt; f.y += f.vy * dt; if (f.g) { f.vy += f.g * dt; f.vx *= Math.pow(.2, dt); } else f.vy *= Math.pow(.15, dt); f.life -= dt; }
  G.floats = G.floats.filter(f => f.life > 0);
  for (const b of G.beams) b.life -= dt; G.beams = G.beams.filter(b => b.life > 0);
  for (const b of G.bolts) b.life -= dt; G.bolts = G.bolts.filter(b => b.life > 0);
  for (const r of G.rings) { r.life -= dt; r.r = r.mr * (1 - r.life / r.max); } G.rings = G.rings.filter(r => r.life > 0);
  if (G.banner) { G.banner.life -= dt; if (G.banner.life <= 0) G.banner = null; }
  for (const S of G.sides) {
    const f = S.shown; if (!f) continue; f.dispHp += (f.hp - f.dispHp) * Math.min(1, dt * 14);
    if (f.hold > 0) f.hold -= dt; else f.trailHp += (f.dispHp - f.trailHp) * Math.min(1, dt * 3); if (f.trailHp < f.dispHp) f.trailHp = f.dispHp;
  }
}
