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

// ---------- NỀN SÂN ĐẤU ----------
const BG = (() => {
  const c = document.createElement('canvas'); c.width = W; c.height = H; const b = c.getContext('2d');
  const id = b.createImageData(W, H), p = id.data;
  for (let y = 0; y < H; y++)for (let x = 0; x < W; x++) {
    const i = (y * W + x) * 4; let r, g, bl;
    if (y < AR.y0 - 6) { const t = y / AR.y0; r = 24 + t * 8; g = 19 + t * 6; bl = 32 + t * 8; }
    else { const n = Math.sin(x * .045) * Math.cos(y * .038) * 7 + Math.sin((x + y) * .11) * 3 + (Math.random() - .5) * 7; r = 98 + n; g = 93 + n; bl = 106 + n; }
    p[i] = r; p[i + 1] = g; p[i + 2] = bl; p[i + 3] = 255;
  }
  b.putImageData(id, 0, 0);
  for (let k = 0; k < 26; k++) {
    let x = AR.x0 + Math.random() * (AR.x1 - AR.x0), y = AR.y0 + Math.random() * (AR.y1 - AR.y0), a = Math.random() * Math.PI * 2;
    const len = 25 + Math.random() * 70;
    for (let s = 0; s < len; s++) {
      a += (Math.random() - .5) * .7; x += Math.cos(a); y += Math.sin(a);
      if (y < AR.y0) break; b.fillStyle = '#48434f'; b.fillRect(x | 0, y | 0, 1, 1); b.fillStyle = '#86818e'; b.fillRect(x | 0, (y | 0) + 1, 1, 1);
      if (Math.random() < .05) { const a2 = a + (Math.random() < .5 ? 1 : -1) * 1.1; let x2 = x, y2 = y; for (let q = 0; q < 10; q++) { x2 += Math.cos(a2); y2 += Math.sin(a2); b.fillStyle = '#4e4955'; b.fillRect(x2 | 0, y2 | 0, 1, 1); } }
    }
  }
  for (let k = 0; k < 90; k++) { const x = AR.x0 + Math.random() * (AR.x1 - AR.x0), y = AR.y0 + Math.random() * (AR.y1 - AR.y0); b.fillStyle = Math.random() < .5 ? '#7a7584' : '#55505d'; b.fillRect(x | 0, y | 0, 2, 2); }
  for (let k = 0; k < 40; k++) { const x = AR.x0 + Math.random() * (AR.x1 - AR.x0), y = AR.y0 + Math.random() * (AR.y1 - AR.y0); b.fillStyle = '#c98a4a'; b.fillRect(x | 0, y | 0, 2, 2); }
  const wg = b.createLinearGradient(AR.x1, 0, W, 0); wg.addColorStop(0, '#2e6fa8'); wg.addColorStop(1, '#1c4a7a');
  b.fillStyle = wg; b.fillRect(AR.x1, AR.y0 - 6, W - AR.x1, H);
  b.fillStyle = '#4c4756'; b.fillRect(AR.x1 - 2, AR.y0 - 6, 2, H);
  b.fillStyle = 'rgba(0,0,0,.35)'; b.fillRect(0, AR.y0 - 7, W, 2);
  return c;
})();
