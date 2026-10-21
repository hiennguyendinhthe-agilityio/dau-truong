'use strict';
// Địa hình bản đồ: vùng đặc biệt, chướng ngại, thiên thạch (bản đồ Vũ Trụ)

let MAP = MAPS[0];
function setMap(m) { MAP = m; BG = buildArena(m); }
const inZone = (z, x, y) => { const dx = (x - z.x) / z.rx, dy = (y - z.y) / z.ry; return dx * dx + dy * dy <= 1; };
const zoneAt = (x, y) => { for (const z of MAP.zones) if (inZone(z, x, y)) return z.k; return null; };
const immuneTo = (f, k) => f.types.includes('Flying') || (k === 'water' && f.types.includes('Water')) || (k === 'lava' && f.types.includes('Fire')) || (k === 'ice' && f.types.includes('Ice'));
// Ảnh hưởng tới di chuyển: spd = hệ số tốc độ, grip = độ bám (thấp = trơn trượt)
function terrainMove(f) {
  const z = f.under > 0 ? null : zoneAt(f.x, f.y);
  if (z === 'water' && !immuneTo(f, z)) return { spd: .6, grip: 1 };
  if (z === 'ice' && !immuneTo(f, z)) return { spd: 1.1, grip: .2 };
  return { spd: 1, grip: 1 };
}
// Đẩy Pokémon ra khỏi chướng ngại (gọi trong clampF)
function pushOutRocks(f) {
  for (const r of MAP.rocks) {
    const dx = f.x - r.x, dy = f.y - r.y, d = Math.hypot(dx, dy) || .01, min = r.r + 10;
    if (d < min) { f.x = r.x + dx / d * min; f.y = r.y + dy / d * min; }
  }
}
// Đạn trúng chướng ngại thì vỡ
function projBlocked(p) {
  for (const r of MAP.rocks) if (Math.hypot(p.x - r.x, p.y - (r.y - 12)) < r.r + 2) { burst(p.x, p.y, '#c8c0d0', 6, 80); return true; }
  return false;
}
function startMapWeather() {
  if (!MAP.weather) return;
  G.weather = { type: MAP.weather, t: 25, max: 25, tick: 0 };
  G.banner = { s: `${MAP.n}: ${WEATHER[MAP.weather].n}!`, col: WEATHER[MAP.weather].col, life: 1.6, max: 1.6 };
  Snd.weather(MAP.weather); Snd.setAmbient(MAP.weather);
}
function updTerrain(dt) {
  if (G.phase !== 'fight') return;
  for (const S of G.sides) {
    const f = S.active; if (!alive(f) || f.under > 0) continue;
    const z = zoneAt(f.x, f.y);
    if (z === 'lava' && !immuneTo(f, z)) {
      f.lavaT = (f.lavaT || 0) + dt;
      if (f.lavaT >= .8) {
        f.lavaT = 0; floatT(f.x, f.y - 96, 'DUNG NHAM!', '#ff7a2a', 14, .8); damage(f, Math.max(1, Math.round(f.maxHp / 28)), '#ffb070', 13);
        if (!f.status && Math.random() < .25 && f.dying < 0) { f.status = 'burn'; f.stT = 6; f.burnT = 0; floatT(f.x, f.y - 110, 'BỊ BỎNG!', '#ff9a40', 14); }
      }
      if (Math.random() < dt * 10) G.parts.push({ x: f.x + rnd(-10, 10), y: f.y - rnd(0, 8), vx: 0, vy: -50, life: .35, max: .35, col: '#ffb020', s: 2, g: 0 });
    } else f.lavaT = 0;
    if (z === 'grass' && f.types.includes('Grass')) {
      f.grassT = (f.grassT || 0) + dt;
      if (f.grassT >= 1.2) { f.grassT = 0; if (f.hp < f.maxHp) heal(f, Math.round(f.maxHp * .025)); }
    }
  }
  // Thiên thạch: cảnh báo 1.2 giây rồi rơi, trúng bất kỳ ai trong vùng
  if (MAP.meteors) {
    G.metT = (G.metT === undefined ? 4 : G.metT) - dt;
    if (G.metT <= 0) {
      G.metT = rnd(4.5, 7); const t = G.sides.map(S => S.active).filter(alive), aim = t.length && Math.random() < .6 ? t[Math.random() * t.length | 0] : null;
      G.mapMet.push({ x: aim ? aim.x + rnd(-30, 30) : rnd(AR.x0 + 40, AR.x1 - 40), y: aim ? aim.y + rnd(-20, 20) : rnd(AR.y0 + 80, AR.y1 - 40), r: 46, t: 0, max: 1.2 });
      Snd.whistle(180);
    }
    for (const m of G.mapMet) {
      m.t += dt;
      if (m.t >= m.max && !m.done) {
        m.done = true; burst(m.x, m.y - 6, '#b89aff', 30, 180, 240, 3); G.rings.push({ x: m.x, y: m.y - 6, r: 8, mr: m.r + 10, life: .3, max: .3, col: '#b89aff' }); G.shake += 7; Snd.impact(m.x);
        for (let i = 0; i < 5; i++) G.debris.push({ x: m.x + rnd(-m.r, m.r) * .7, y: m.y + rnd(-m.r, m.r) * .4, s: rnd(3, 6) | 0, life: 5, col: '#6e6a9c' });
        for (const S of G.sides) { const f = S.active; if (alive(f) && f.under <= 0 && f.iframe <= 0 && Math.hypot(f.x - m.x, (f.y - m.y) / .6) < m.r + 8) { floatT(f.x, f.y - 96, 'THIÊN THẠCH!', '#c8b0ff', 14, .8); damage(f, Math.round(f.maxHp * .08), '#ffffff', 16); } }
      }
    }
    G.mapMet = G.mapMet.filter(m => !m.done);
  }
}
// AI: tránh dung nham, thiên thạch và chướng ngại
function aiTerrain(f, v) {
  for (const z of MAP.zones) if (z.k === 'lava' && !immuneTo(f, 'lava')) {
    const dx = (f.x - z.x) / (z.rx + 30), dy = (f.y - z.y) / (z.ry + 30), d = Math.hypot(dx, dy);
    if (d < 1) { v[0] += dx / (d || .1) * 2; v[1] += dy / (d || .1) * 2; }
  }
  for (const m of G.mapMet) { const dx = f.x - m.x, dy = (f.y - m.y) / .6, d = Math.hypot(dx, dy); if (d < m.r + 25) { v[0] += dx / (d || 1) * 2.4; v[1] += dy / (d || 1) * 2.4; } }
  for (const r of MAP.rocks) { const dx = f.x - r.x, dy = f.y - r.y, d = Math.hypot(dx, dy); if (d < r.r + 22) { v[0] += -dy / (d || 1) * .9 * f.strafe + dx / (d || 1) * .6; v[1] += dx / (d || 1) * .9 * f.strafe + dy / (d || 1) * .6; } }
}
// Vẽ: hiệu ứng động trên vùng địa hình (gợn nước, dung nham sôi)
function drawTerrainFX(t) {
  for (const z of MAP.zones) {
    if (z.k === 'water') { ctx.fillStyle = 'rgba(220,240,255,.45)'; for (let i = 0; i < 6; i++) { const a = t * .6 + i * 1.7, x = z.x + Math.cos(a) * z.rx * .55, y = z.y + Math.sin(a * 1.3) * z.ry * .5; ctx.fillRect(x | 0, y | 0, 6, 1); } }
    if (z.k === 'lava') { ctx.globalAlpha = .25 + .15 * Math.sin(t * 3 + z.x); ctx.fillStyle = '#ffd040'; ellipse(z.x, z.y, z.rx * .6, z.ry * .55); ctx.fill(); ctx.globalAlpha = 1; for (let i = 0; i < 3; i++) { const ph = (t * .8 + i / 3) % 1, x = z.x + Math.sin(i * 2.3 + z.y) * z.rx * .5; ctx.fillStyle = '#ffe890'; ctx.fillRect(x | 0, (z.y - ph * 6) | 0, 2, 2); } }
  }
  if (MAP.edge === 'water') { ctx.fillStyle = 'rgba(200,230,255,.35)'; for (let y = AR.y0; y < H; y += 7) { const x = AR.x1 + 3 + Math.sin(t * 2 + y * .13) * 3; ctx.fillRect(x | 0, y, 4, 1); } }
  if (MAP.edge === 'lava') { ctx.fillStyle = 'rgba(255,220,120,.45)'; for (let y = AR.y0; y < H; y += 9) { const x = AR.x1 + 4 + Math.sin(t * 1.5 + y * .2) * 3; ctx.fillRect(x | 0, y, 3, 2); } }
  for (const m of G ? G.mapMet : []) {
    const p = m.t / m.max; ctx.globalAlpha = .2 + p * .25; ctx.fillStyle = '#ff3a3a'; ellipse(m.x, m.y, m.r, m.r * .6); ctx.fill();
    ctx.globalAlpha = .7; ctx.strokeStyle = '#c8b0ff'; ctx.lineWidth = 2; ellipse(m.x, m.y, m.r * p, m.r * .6 * p); ctx.stroke(); ctx.globalAlpha = 1;
    const my = m.y - (1 - p) * 300; ctx.fillStyle = '#c8b0ff'; ctx.beginPath(); ctx.arc(m.x + (1 - p) * 80, my - 12, 8, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(m.x + (1 - p) * 80, my - 12, 4, 0, Math.PI * 2); ctx.fill();
  }
}
// Vẽ một chướng ngại (đá hoặc cây), xếp theo chiều sâu cùng Pokémon
function drawRock(r) {
  ctx.fillStyle = 'rgba(16,10,30,.35)'; ellipse(r.x, r.y, r.r * 1.05, r.r * .4); ctx.fill();
  if (MAP.rockCol === 'tree') {
    ctx.fillStyle = '#5a3a1a'; ctx.fillRect(r.x - 3, r.y - 16, 6, 16);
    ctx.fillStyle = '#2e6a2a'; ctx.beginPath(); ctx.arc(r.x, r.y - 26, r.r + 2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#4a9a3a'; ctx.beginPath(); ctx.arc(r.x - 4, r.y - 30, r.r - 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#7ac85a'; ctx.fillRect(r.x - 8, r.y - 38, 4, 3); return;
  }
  const c = MAP.rockCol;
  ctx.fillStyle = mix(c, -.35); ctx.beginPath(); ctx.ellipse(r.x, r.y - r.r * .6, r.r, r.r * .9, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(r.x - 1, r.y - r.r * .7, r.r * .9, r.r * .78, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = mix(c, .3); ctx.beginPath(); ctx.ellipse(r.x - r.r * .3, r.y - r.r * 1.05, r.r * .4, r.r * .25, 0, 0, Math.PI * 2); ctx.fill();
}
