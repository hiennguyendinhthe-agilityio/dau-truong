'use strict';
// Hình tạm vẽ bằng code (khi hình thật chưa tải xong)

function makeSpriteFrame(d, frame = 0) {
  const N = 32, g = new Uint8Array(N * N), [c0, c1, c2] = d.pal, ft = new Set(d.feat || []);
  const C = [null, c2, c0, mix(c0, -.3), c1, '#ffffff', '#160e1c', d.fx, mix(c1, -.22), '#7a5a3a', '#5a4028', mix(d.fx, .45), mix(c0, .28)];
  const set = (x, y, c) => { x = Math.floor(x); y = Math.floor(y); if (x >= 0 && y >= 0 && x < N && y < N) g[y * N + x] = c; };
  const ell = (cx, cy, rx, ry, c) => { for (let y = Math.floor(cy - ry); y <= cy + ry; y++)for (let x = Math.floor(cx - rx); x <= cx + rx; x++) { const dx = (x + .5 - cx) / rx, dy = (y + .5 - cy) / ry; if (dx * dx + dy * dy <= 1) { const s = dx * .55 + dy * .85; let cc = c; if (c === 2 && s > .48) cc = 3; else if (c === 2 && s < -.7) cc = 12; else if (c === 4 && s > .5) cc = 8; else if (c === 9 && s > .4) cc = 10; else if (c === 7 && s < -.5) cc = 11; set(x, y, cc); } } };
  const rect = (x, y, w, h, c) => { for (let j = 0; j < h; j++)for (let i = 0; i < w; i++)set(x + i, y + j, c); };
  const tri = (ax, ay, bx, by, qx, qy, c) => { const ar = (bx - ax) * (qy - ay) - (by - ay) * (qx - ax); if (!ar) return; for (let y = Math.floor(Math.min(ay, by, qy)); y <= Math.ceil(Math.max(ay, by, qy)); y++)for (let x = Math.floor(Math.min(ax, bx, qx)); x <= Math.ceil(Math.max(ax, bx, qx)); x++) { const px = x + .5, py = y + .5, w0 = ((bx - px) * (qy - py) - (by - py) * (qx - px)) / ar, w1 = ((qx - px) * (ay - py) - (qy - py) * (ax - px)) / ar; if (w0 >= 0 && w1 >= 0 && 1 - w0 - w1 >= 0) set(x, y, c); } };
  const line = (x0, y0, x1, y1, c) => { const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) || 1; for (let i = 0; i <= n; i++)set(Math.round(x0 + (x1 - x0) * i / n), Math.round(y0 + (y1 - y0) * i / n), c); };
  const M = x => 31 - x;
  const both = fn => { fn(x => x); fn(M); };
  const eyes = (cx, cy, sp, h = 2) => { for (const s of [-1, 1]) { const ex = Math.round(cx + s * sp) - 1; rect(ex, cy, 2, h, 6); set(ex, cy, 5); } };
  const f1 = frame === 1;

  switch (d.shape) {
    case 'quad':
      if (ft.has('tail')) { line(24, 21, 29, f1 ? 13 : 15, 2); line(25, 21, 29, f1 ? 14 : 16, 2); ell(29, f1 ? 12 : 14, 1.6, 1.6, 7); }
      if (ft.has('flametail')) { line(24, 21, 27, 17, 2); ell(27, f1 ? 10 : 12, f1 ? 3.8 : 3.2, 4.5, 7); ell(27, f1 ? 11.5 : 13.5, 1.6, 2.2, 11); }
      if (ft.has('spikes')) { tri(5, 19, 7, 11, 10, 17, 7); tri(22, 17, 25, 11, 27, 19, 7); tri(9, 14, 11, 7, 14, 13, 7); tri(18, 13, 21, 7, 23, 14, 7); }
      rect(9 + (f1 ? 1 : 0), 23, 3, 6, 3); rect(20 - (f1 ? 1 : 0), 23, 3, 6, 3);
      ell(16, 20, 10, 6.5, 2); ell(16, 23, 5, 3, 4);
      rect(11 - (f1 ? 1 : 0), 25, 3, 5, 2); rect(18 + (f1 ? 1 : 0), 25, 3, 5, 2);
      if (ft.has('mane')) ell(16, 9, 8.5, 5, 7);
      if (ft.has('ears')) both(X => { tri(X(8), 10, X(9), 2, X(14), 7, 2); tri(X(9.6), 8.5, X(10), 4.5, X(12.6), 7, 4); });
      if (ft.has('antlers')) both(X => { line(X(11), 7, X(8), 2, 9); line(X(9), 4, X(6), 3, 9); line(X(8), 2, X(9), 0, 9); });
      ell(16, 12, 7, 6, 2); ell(16, 15.5, 4, 2.6, 4); set(14, 16, 1); set(17, 16, 1);
      eyes(16, 11, 3);
      if (ft.has('horns')) both(X => { line(X(10), 8, X(6), 6, 4); line(X(10), 7, X(6), 5, 4); line(X(6), 6, X(5), 2, 4); line(X(5), 3, X(5), 1, 8); });
      if (ft.has('leaf')) { tri(16, 7, 14, 2, 20, 1, 7); line(16, 7, 18, 2, 3); }
      break;
    case 'round':
      if (ft.has('bolt')) { line(23, 22, 27, 18, 7); line(24, 22, 28, 18, 7); line(27, 18, 25, 16, 7); line(28, 18, 26, 16, 7); line(25, 16, 29, 10, 7); line(26, 16, 30, 10, 7); }
      both(X => rect(Math.min(X(10 + (f1 ? 1 : 0)), X(13 + (f1 ? 1 : 0))), 26, 4, 3, 3));
      if (ft.has('ears')) both(X => { tri(X(8), 12, X(f1 ? 5 : 6), 1, X(13), 8, 2); set(X(6), 2, 6); set(X(7), 2, 6); set(X(7), 3, 6); set(X(6), 1, 6); });
      if (ft.has('ears2')) both(X => { ell(X(8), 7, 3, 4.5, 2); ell(X(8), 7.5, 1.5, 2.5, 4); });
      ell(16, 18, 10, 9.5, 2); ell(16, 21.5, 6, 5, 4);
      eyes(16, 14, 4, 3);
      if (ft.has('cheeks')) both(X => ell(X(9), 19, f1 ? 2.2 : 1.8, 1.4, 7));
      if (ft.has('gem')) { rect(15, 9, 2, 2, 7); set(15, 9, f1 ? 5 : 11); }
      set(14, 19, 1); set(15, 20, 1); set(16, 20, 1); set(17, 19, 1);
      break;
    case 'serpent':
      both(X => tri(X(10), 7, X(2), 3, X(11), 12, 7));
      ell(16 + (f1 ? 1.5 : -1.5), 26, 12, 4.5, 2); ell(16 - (f1 ? 1.5 : -1.5), 21, 9, 4, 2);
      ell(16, 15, 4.5, 6, 2); rect(15, 13, 2, 9, 4);
      ell(16, 9, 7, 5, 2); ell(16, 11.5, 4, 2.4, 4);
      eyes(16, 7, 3);
      tri(16, 0, 13, 5, 19, 5, 7);
      break;
    case 'bird':
      tri(12, 25, 16, 31, 20, 25, 3);
      if (ft.has('flametail')) { ell(16, 29, 3, 3, 7); ell(16, 29.5, 1.5, 1.6, 11); }
      if (f1) {
        both(X => { ell(X(4.5), 13, 4.5, 8, 3); tri(X(1), 7, X(3), 18, X(7), 15, 3); });
      } else {
        both(X => { ell(X(5.5), 18, 4.5, 8, 3); tri(X(2), 21, X(3), 28, X(7), 23, 3); });
      }
      both(X => { line(X(13), 25, X(13), 29, 7); line(X(12), 29, X(14), 29, 7); });
      ell(16, 18, 8.5, 8.5, 2); ell(16, 21, 5, 5.5, 4);
      if (ft.has('crest')) { tri(14, 5, 16, -1, 18, 5, 7); tri(12, 6, 10, 1, 15, 5, 7); }
      ell(16, 9, 6.5, 5.5, 2);
      eyes(16, 7, 3);
      tri(13.5, 10, 18.5, 10, 16, 14.5, 7);
      break;
    case 'biped':
      if (ft.has('spikes')) both(X => { tri(X(2), 15, X(4), 7, X(8), 13, 7); });
      both(X => rect(Math.min(X(10 + (f1 ? 1 : -1)), X(14 + (f1 ? 1 : -1))), 23, 5, 7, 3));
      both(X => { ell(X(f1 ? 5 : 6), 18, 3.5, 5.5, 2); ell(X(f1 ? 5 : 6), 23.5, 3.2, 2.6, 4); });
      ell(16, 18, 8, 8, 2); ell(16, 20, 4.5, 4.5, 4);
      if (ft.has('rocks')) { both(X => ell(X(6), 13, 3.2, 3, 9)); ell(16, 3, 3, 2, 9);[[12, 16], [19, 22], [14, 23], [20, 15]].forEach(([x, y]) => set(x, y, 3)); }
      if (ft.has('spikes')) both(X => tri(X(9), 6, X(10), -1, X(13), 5, 7));
      ell(16, 9, 6, 5, 2);
      eyes(16, 8, 3);
      line(14, 12, 17, 12, 1);
      if (ft.has('band')) { rect(10, 5, 12, 2, 7); line(22, 5, 26, 9, 7); line(22, 6, 25, 10, 7); }
      if (ft.has('spikes')) tri(14, 5, 16, -1, 18, 5, 7);
      break;
    case 'mole':
      ell(16, 16, 8, 11, 2); ell(16, 19, 4, 5, 4);
      ell(16, 17, 3, 2, 7);
      eyes(16, 12, 3);
      ell(16, 28, 15, 5, 9); ell(5, 26, 4, 3, 9); ell(27, 26, 4, 3, 9);
      [[8, 29], [20, 30], [24, 28], [12, 30]].forEach(([x, y]) => set(x, y, 10));
      if (ft.has('claws')) both(X => { line(X(7), 24, X(f1 ? 4 : 5), 20, 4); line(X(9), 24, X(f1 ? 7 : 8), 20, 4); line(X(11), 24, X(f1 ? 10 : 11), 21, 4); });
      break;
  }
  const o = g.slice();
  for (let y = 0; y < N; y++)for (let x = 0; x < N; x++)if (!g[y * N + x]) { const nb = (x > 0 && g[y * N + x - 1]) || (x < N - 1 && g[y * N + x + 1]) || (y > 0 && g[(y - 1) * N + x]) || (y < N - 1 && g[(y + 1) * N + x]); if (nb) o[y * N + x] = 1; }
  const mk = white => { const c = document.createElement('canvas'); c.width = c.height = N; const x = c.getContext('2d'); for (let i = 0; i < N * N; i++)if (o[i]) { x.fillStyle = white ? '#ffffff' : C[o[i]]; x.fillRect(i % N, (i / N) | 0, 1, 1); } return c; };
  return { img: mk(false), white: mk(true) };
}
function makeSprite(d) {
  const f0 = makeSpriteFrame(d, 0), f1 = makeSpriteFrame(d, 1);
  return { img: f0.img, white: f0.white, frames: [f0.img, f1.img], whites: [f0.white, f1.white] };
}
const SPR = {}; R.forEach(d => SPR[d.id] = makeSprite(d));
