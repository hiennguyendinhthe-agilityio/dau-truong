'use strict';
// Kích thước khung hình, font, canvas, vùng sân đấu

const W = 360, H = 640, RS = 2;
const F1 = '"Press Start 2P", monospace', F2 = '"VT323", monospace';
const cv = document.getElementById('c'), ctx = cv.getContext('2d');
cv.width = W * RS; cv.height = H * RS;
const AR = { x0: 14, x1: 344, y0: 118, y1: 614 };
