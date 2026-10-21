'use strict';
// Hình huấn luyện viên và nền sân đấu

// ---------- SPRITE HUẤN LUYỆN VIÊN ----------
const TRAINER_SPR = (() => {
  const c = document.createElement('canvas'); c.width = 24; c.height = 32; const ctxT = c.getContext('2d');
  ctxT.fillStyle = '#ffffff'; ctxT.fillRect(7, 4, 10, 7);
  ctxT.fillStyle = '#3ca45c'; ctxT.fillRect(6, 10, 12, 3);
  ctxT.fillStyle = '#3a2012'; ctxT.fillRect(5, 11, 2, 4); ctxT.fillRect(17, 11, 2, 4);
  ctxT.fillStyle = '#f8d0a0'; ctxT.fillRect(7, 11, 10, 6);
  ctxT.fillStyle = '#2a1a0e'; ctxT.fillRect(9, 13, 2, 2); ctxT.fillRect(13, 13, 2, 2);
  ctxT.fillStyle = '#d83a30'; ctxT.fillRect(6, 17, 12, 8);
  ctxT.fillStyle = '#1c1c24'; ctxT.fillRect(9, 17, 6, 8);
  ctxT.fillStyle = '#4cd060'; ctxT.fillRect(7, 17, 2, 7); ctxT.fillRect(15, 17, 2, 7);
  ctxT.fillStyle = '#f8d0a0'; ctxT.fillRect(4, 19, 2, 4); ctxT.fillRect(18, 19, 2, 4);
  ctxT.fillStyle = '#2e3a58'; ctxT.fillRect(7, 25, 4, 5); ctxT.fillRect(13, 25, 4, 5);
  ctxT.fillStyle = '#3ca45c'; ctxT.fillRect(6, 29, 5, 3); ctxT.fillRect(13, 29, 5, 3);
  return c;
})();

// ---------- NỀN SÂN ĐẤU (vẽ một lần cho mỗi bản đồ) ----------
function buildArena(m) {
  const c = document.createElement('canvas'); c.width = W; c.height = H; const b = c.getContext('2d');
  const id = b.createImageData(W, H), p = id.data, [g0, g1, g2] = m.ground;
  for (let y = 0; y < H; y++)for (let x = 0; x < W; x++) {
    const i = (y * W + x) * 4; let r, g, bl;
    if (y < AR.y0 - 6) { const t = y / AR.y0; r = 24 + t * 8; g = 19 + t * 6; bl = 32 + t * 8; }
    else { const n = (Math.sin(x * .045) * Math.cos(y * .038) * 7 + Math.sin((x + y) * .11) * 3) * m.noise / 7 + (Math.random() - .5) * m.noise; r = g0 + n; g = g1 + n; bl = g2 + n; }
    p[i] = r; p[i + 1] = g; p[i + 2] = bl; p[i + 3] = 255;
  }
  b.putImageData(id, 0, 0);
  const rx = () => AR.x0 + Math.random() * (AR.x1 - AR.x0), ry = () => AR.y0 + Math.random() * (AR.y1 - AR.y0);
  const px = (col, x, y, s = 1) => { b.fillStyle = col; b.fillRect(x | 0, y | 0, s, s); };
  // Vết nứt (hang đá, núi lửa)
  if (m.deco === 'cracks' || m.deco === 'embers') {
    const dark = m.deco === 'cracks' ? '#48434f' : '#2a1c1c', lite = m.deco === 'cracks' ? '#86818e' : '#ff7a2a';
    for (let k = 0; k < 26; k++) {
      let x = rx(), y = ry(), a = Math.random() * Math.PI * 2; const len = 25 + Math.random() * 70;
      for (let s = 0; s < len; s++) { a += (Math.random() - .5) * .7; x += Math.cos(a); y += Math.sin(a); if (y < AR.y0) break; px(dark, x, y); px(lite, x, y + 1); }
    }
    for (let k = 0; k < 90; k++) px(Math.random() < .5 ? '#7a7584' : '#55505d', rx(), ry(), 2);
    for (let k = 0; k < 40; k++) px(m.deco === 'cracks' ? '#c98a4a' : '#ffb03a', rx(), ry(), 2);
  }
  if (m.deco === 'flowers') {
    for (let k = 0; k < 260; k++) { const x = rx(), y = ry(); px('#5a9a44', x, y); px('#5a9a44', x + 2, y - 1); px('#76b85a', x + 1, y - 2); }
    for (let k = 0; k < 50; k++) { const x = rx(), y = ry(), c = ['#ffffff', '#ffe14a', '#ff8ab0', '#b08aff'][k % 4]; px(c, x, y, 2); px('#ffe890', x + .5, y + .5); }
  }
  if (m.deco === 'shells') {
    for (let k = 0; k < 200; k++) px(Math.random() < .5 ? '#c8ac78' : '#ead6a8', rx(), ry(), 1);
    for (let k = 0; k < 24; k++) { const x = rx(), y = ry(); px('#fff0e0', x, y, 3); px('#f0b8a0', x + 1, y + 1); }
  }
  if (m.deco === 'sparkle') { for (let k = 0; k < 220; k++) px(Math.random() < .5 ? '#ffffff' : '#c4d4e8', rx(), ry(), 1); for (let k = 0; k < 40; k++) px('#a8c8e8', rx(), ry(), 2); }
  if (m.deco === 'stars') {
    for (let k = 0; k < 5; k++) { const cx = rx(), cy = ry(), rr2 = 40 + Math.random() * 60, col = k % 2 ? 'rgba(120,60,200,.10)' : 'rgba(40,120,200,.10)'; for (let q = 0; q < 6; q++) { b.fillStyle = col; b.beginPath(); b.arc(cx + (Math.random() - .5) * 40, cy + (Math.random() - .5) * 40, rr2 * (1 - q * .12), 0, Math.PI * 2); b.fill(); } }
    for (let k = 0; k < 260; k++) px(Math.random() < .2 ? '#ffe8a0' : '#ffffff', rx(), ry(), Math.random() < .1 ? 2 : 1);
  }
  // Vùng địa hình
  const ZC = { water: ['#3f7fd0', '#6aa8f0', '#2a5a9a'], lava: ['#e8521a', '#ffb02a', '#5a1a0e'], grass: ['#3e7a2e', '#58a040', '#2a5a20'], ice: ['#bfe6f4', '#ffffff', '#8cc4dc'] };
  for (const z of m.zones) {
    const [base, hi, rim] = ZC[z.k];
    for (let y = Math.floor(z.y - z.ry - 2); y <= z.y + z.ry + 2; y++)for (let x = Math.floor(z.x - z.rx - 2); x <= z.x + z.rx + 2; x++) {
      if (x < AR.x0 || x > AR.x1 || y < AR.y0) continue;
      const d = Math.hypot((x - z.x) / z.rx, (y - z.y) / z.ry);
      if (d <= 1) { const n = Math.random(); px(d > .9 ? rim : n < .08 ? hi : base, x, y); }
    }
    if (z.k === 'grass') for (let k = 0; k < z.rx * z.ry / 18; k++) { const a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random()) * .85, x = z.x + Math.cos(a) * z.rx * r, y = z.y + Math.sin(a) * z.ry * r; px('#2a5a20', x, y); px('#74c058', x, y - 2); px('#74c058', x - 1, y - 1); px('#74c058', x + 1, y - 1); }
    if (z.k === 'ice') for (let k = 0; k < 12; k++) { const x = z.x + (Math.random() - .5) * z.rx * 1.4, y = z.y + (Math.random() - .5) * z.ry * 1.2; for (let q = 0; q < 8; q++) px('#ffffff', x + q, y - q * .4); }
  }
  // Mép sân bên phải
  const EDGE = { water: ['#2e6fa8', '#1c4a7a'], lava: ['#e8521a', '#7a1a0a'], hedge: ['#2e6a2a', '#1e4a1a'], ice: ['#cfeaf6', '#8cc4dc'], void: ['#0a0818', '#000000'] }[m.edge];
  const wg = b.createLinearGradient(AR.x1, 0, W, 0); wg.addColorStop(0, EDGE[0]); wg.addColorStop(1, EDGE[1]);
  b.fillStyle = wg; b.fillRect(AR.x1, AR.y0 - 6, W - AR.x1, H);
  b.fillStyle = 'rgba(0,0,0,.35)'; b.fillRect(AR.x1 - 2, AR.y0 - 6, 2, H);
  b.fillStyle = 'rgba(0,0,0,.35)'; b.fillRect(0, AR.y0 - 7, W, 2);
  return c;
}
let BG = buildArena(MAPS[0]);
