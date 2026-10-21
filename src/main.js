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
// Tự cập nhật: có bản mới thì tải lại trang (khi đang ở menu); mỗi lần mở lại app thì kiểm tra bản mới
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  const hadSW = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).then(reg => {
    document.addEventListener('visibilitychange', () => { if (!document.hidden) reg.update().catch(() => { }); });
  }).catch(() => { });
  let reloading = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadSW || reloading) return;
    const go = () => { if (reloading) return; reloading = true; location.reload(); };
    if (!G) go(); else { G.banner = { s: 'CÓ BẢN MỚI: VỀ MENU ĐỂ CẬP NHẬT', col: '#7ff8ff', life: 3, max: 3 }; const iv = setInterval(() => { if (!G) { clearInterval(iv); go(); } }, 1000); }
  });
}
document.getElementById('appVer').textContent = 'Phiên bản ' + APP_VERSION;
