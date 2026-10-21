'use strict';
// Hàm tiện ích màu sắc (dùng cho dữ liệu và sprite)

function hexRgb(h) { const n = parseInt(h.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
function mix(h, a) { const [r, g, b] = hexRgb(h), t = a < 0 ? 0 : 255, k = Math.abs(a); return '#' + [r, g, b].map(v => Math.round(v + (t - v) * k).toString(16).padStart(2, '0')).join(''); }
