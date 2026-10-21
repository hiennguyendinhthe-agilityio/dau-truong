'use strict';
// Vòng lặp game. Nạp cuối cùng.

// ---------- VÒNG LẶP ----------
let last = performance.now();
function frame(now) {
  let dt = Math.min(.05, (now - last) / 1000); last = now;
  if (G && !G.paused) {
    if (G.slowmo > 0) { G.slowmo -= dt; dt *= .35; }
    if (G.net === 'host' && G.netWait) { G.shake = 0; } else for (let i = 0; i < (G.net ? 1 : SPEED); i++) { if (G.hitstop > 0) { G.hitstop -= dt; G.shake = Math.max(0, G.shake - dt * 10); continue; } update(dt); }
  }
  Snd.setAmbient(G && G.phase === 'fight' && !G.paused && !document.hidden && G.weather ? G.weather.type : null);
  render(now); updBtns();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);


// Lưu game vào máy để chơi không cần mạng (chỉ khi mở qua http/https)
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => { });
