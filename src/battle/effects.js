'use strict';
// Hiệu ứng chữ nổi, hạt, tia sét

// ---------- HIỆU ỨNG ----------
function floatT(x, y, s, col, size, life = .9) { G.floats.push({ s, x, y, vy: -32, life, max: life, col, size, font: F2, pop: 0 }); }
function floatN(x, y, s, col, size) { G.floats.push({ s, x: x + rnd(-8, 8), y, vx: rnd(-30, 30), vy: -80, g: 140, life: .95, max: .95, col, size, font: F1, pop: 1 }); }
function burst(x, y, col, n, sp, grav = 0, sz = 2) { for (let i = 0; i < n; i++) { const a = Math.random() * Math.PI * 2, v = sp * rnd(.3, 1); G.parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: rnd(.25, .6), max: .6, col: Math.random() < .25 ? '#ffffff' : col, s: Math.random() < .5 ? sz : sz + 1, g: grav }); } }
function bolt(x, y) { const pts = []; let cx = x + rnd(-20, 20); for (let i = 0; i <= 8; i++) { pts.push([cx, y - 230 + i * 230 / 8]); cx += rnd(-14, 14); } pts[8] = [x, y]; G.bolts.push({ pts, life: .28, max: .28 }); }
