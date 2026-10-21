'use strict';
// AI điều khiển Pokémon và đọc phím người chơi

// ---------- AI ----------
function ai(f, o, dt) {
  const dx = o.x - f.x, dy = o.y - f.y, d = Math.hypot(dx, dy) || 1, ux = dx / d, uy = dy / d;
  if (f.under > 0) return [ux, uy];
  const want = f.ranged ? 140 : 28; let mx = 0, my = 0;
  if (d > want + 12) { mx = ux; my = uy; } else if (d < want - 25) { mx = -ux; my = -uy; }
  f.strafeT -= dt; if (f.strafeT <= 0) { f.strafe *= -1; f.strafeT = rnd(.8, 2.2); }
  const sw = f.ranged ? .9 : (d < 70 ? .55 : .25); mx += -uy * f.strafe * sw; my += ux * f.strafe * sw;
  for (const t of G.teles) { if (t.owner === f) continue; if (t.dodge === undefined) t.dodge = Math.random() < .7; if (!t.dodge) continue; const v = threat(t, f); if (v) { const l = Math.hypot(v[0], v[1]) || 1; mx += v[0] / l * 2.4; my += v[1] / l * 2.4; } }
  for (const h of G.hazards) if (h.owner !== f && Math.hypot(f.x - h.x, (f.y - h.y) / .6) < h.r + 20) { mx += (f.x - h.x) / h.r * 1.5; my += (f.y - h.y) / h.r * 1.5; }
  { const v = [mx, my]; aiTerrain(f, v); mx = v[0]; my = v[1]; }
  if (f.x < AR.x0 + 45) mx += .8; if (f.x > AR.x1 - 45) mx -= .8; if (f.y < AR.y0 + 85) my += .8; if (f.y > AR.y1 - 30) my -= .8;
  const l = Math.hypot(mx, my); if (l > 1) { mx /= l; my /= l; }
  return [mx, my];
}
function aiSpecial(f, o, d, dt) {
  if (f.cdS > 0 || Math.random() > dt * 4) return false;
  switch (f.d.sp.k) { case 'dash': return d < 200; case 'beam': return d < 330; case 'aoe': return d < 92; case 'volley': return d < 250; default: return true; }
}
function aiSig(f, o, d, dt) {
  if (f.cdG > 0 || Math.random() > dt * 2.5) return false;
  const hp = f.hp / f.maxHp;
  switch (f.d.sig.k) {
    case 'roar': return d < 90; case 'burrow': return d < 240; case 'trail': return d < 180; case 'whirl': return d < 260;
    case 'heal': return hp < .5; case 'blink': return d > 60 && d < 280; case 'tornado': return d < 280; case 'spikes': return d < 100;
    case 'shield': return hp < .8 && (d < 110 || G.teles.some(t => t.owner === o));
    case 'reflect': return G.proj.some(p => p.owner === o) || G.teles.some(t => t.owner === o);
    case 'counter': return d < 70 && (o.swing || o.dash || !o.ranged);
    case 'fort': return hp < .65 && d < 150;
    default: return true;
  }
}
function aiDodge(f) {
  if (f.cdR > 0) return false;
  for (const t of G.teles) {
    if (t.owner === f || t.t < 0) continue;
    if (t.aiRoll === undefined) t.aiRoll = Math.random() < .45; if (!t.aiRoll) continue;
    if (t.t > t.max - .3) { const v = threat(t, f); if (v) { doRoll(f, v[0], v[1]); return true; } }
  }
  for (const p of G.proj) {
    if (p.owner.side === f.side || p.aiChk) continue;
    if (Math.hypot(p.x - f.x, p.y - (f.y - 24)) < 70) { p.aiChk = true; if (Math.random() < .3) { const s = Math.random() < .5 ? 1 : -1; doRoll(f, -p.vy * s, p.vx * s); return true; } }
  }
  return false;
}
function inputVec() {
  let mx = (keys.ArrowRight ? 1 : 0) - (keys.ArrowLeft ? 1 : 0), my = (keys.ArrowDown ? 1 : 0) - (keys.ArrowUp ? 1 : 0);
  if (joy) { const dx = joy.x - joy.ox, dy = joy.y - joy.oy, l = Math.hypot(dx, dy); if (l > 4) { mx = dx / Math.max(l, 30); my = dy / Math.max(l, 30); } }
  const l = Math.hypot(mx, my); return l > 1 ? [mx / l, my / l] : [mx, my];
}
const wants = k => inp[k] > 0 && G.clock - inp[k] < .25;
const heldAtk = () => keys.KeyQ || held.atk;
// Nguồn điều khiển của một Pokémon: người chơi trên máy này, người chơi ở máy kia (PvP), hoặc null = AI
const LOCAL_CTL = { vec: () => inputVec(), wants: k => wants(k), take: k => { inp[k] = 0; }, held: () => heldAtk() };
function ctrlOf(f) {
  if (!G) return null;
  if (G.net === 'host' && f.side !== G.me) return NET.remote;
  return f.side === G.me && !G.auto ? LOCAL_CTL : null;
}
