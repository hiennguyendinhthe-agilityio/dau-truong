'use strict';
// Màn hình mở đầu (splash): trời sao → quả cầu rơi, lắc 3 lần, bung sáng → logo → Pokémon diễu hành → "CHẠM ĐỂ BẮT ĐẦU".
// Chạm lúc nào cũng được: chạm sớm thì nhảy tới cảnh cuối, chạm ở cảnh cuối thì vào menu (đồng thời bật âm thanh trên iPhone).

const splash = {
  t: 0, done: false, out: -1, last: 0, el: null, cv: null, x: null,
  // Pokémon diễu hành: [số Pokédex, hướng PMD (2 = sang phải, 6 = sang trái), vị trí y, tốc độ px/giây, thời điểm xuất hiện]
  parade: [[25, 2, 560, 120, 2.6], [6, 2, 548, 105, 2.9], [150, 6, 590, 95, 3.1], [384, 6, 515, 80, 3.5], [445, 2, 600, 140, 4.4], [94, 6, 535, 110, 4.9]],
  stars: Array.from({ length: 90 }, () => [Math.random() * 360, Math.random() * 640, Math.random() * 1.6 + .4, Math.random() * 6]),
  sparks: [],
  start() {
    this.el = document.getElementById('splash'); this.cv = document.getElementById('splashC'); this.x = this.cv.getContext('2d');
    this.cv.width = W * RS; this.cv.height = H * RS;
    this.parade.forEach(([d]) => ensurePMD(d));
    this.el.addEventListener('pointerdown', e => { e.preventDefault(); this.tap(); });
    addEventListener('keydown', this.onKey = e => { if (!this.done && (e.code === 'Enter' || e.code === 'Space')) this.tap(); });
    this.last = performance.now(); requestAnimationFrame(n => this.frame(n));
  },
  tap() {
    if (this.done || this.out >= 0) return;
    Snd.init();
    if (this.t < 2.9) { this.t = 2.9; this.burstFx(); return; }   // bỏ qua phần mở đầu
    Snd.fight(); this.out = 0;
  },
  close() { if (this.done) return; this.done = true; this.el.style.display = 'none'; removeEventListener('keydown', this.onKey); Snd.init(); },
  burstFx() { for (let i = 0; i < 70; i++) { const a = Math.random() * Math.PI * 2, v = 60 + Math.random() * 260; this.sparks.push({ x: 180, y: 300, vx: Math.cos(a) * v, vy: Math.sin(a) * v, l: .6 + Math.random() * .8, c: ['#ffffff', '#ffcf3a', '#ff5a5a', '#7ff8ff'][i % 4] }); } },
  frame(now) {
    if (this.done) return;
    const dt = Math.min(.05, (now - this.last) / 1000); this.last = now;
    const pt = this.t; this.t += dt;
    if (pt < 2.1 && this.t >= 2.1) this.burstFx();
    if (this.out >= 0) { this.out += dt; if (this.out > .45) return this.close(); }
    // Lỗi vẽ ở một khung hình không được làm treo màn hình mở đầu
    try { this.draw(); } catch (err) { console.error(err); }
    requestAnimationFrame(n => this.frame(n));
  },
  draw() {
    const c = this.x, t = this.t, e = easeOutBack, cl = v => Math.max(0, Math.min(1, v));
    c.setTransform(RS, 0, 0, RS, 0, 0); c.imageSmoothingEnabled = false;
    // Nền: trời đêm, quầng sáng giữa
    const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#0a0614'); g.addColorStop(.6, '#1d1030'); g.addColorStop(1, '#2a1424');
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    const glow = cl((t - 2) / .6); if (glow > 0) { const r = c.createRadialGradient(180, 300, 10, 180, 300, 300); r.addColorStop(0, `rgba(255,190,80,${.35 * glow})`); r.addColorStop(1, 'rgba(255,190,80,0)'); c.fillStyle = r; c.fillRect(0, 0, W, H); }
    // Sao lấp lánh
    for (const [sx, sy, s, ph] of this.stars) { c.globalAlpha = cl(t / .6) * (.4 + .6 * Math.abs(Math.sin(t * 2 + ph))); c.fillStyle = '#ffffff'; c.fillRect(sx | 0, sy | 0, s, s); }
    c.globalAlpha = 1;
    // Tia sáng xoay sau logo (sau khi bung)
    if (t > 2.1) {
      c.save(); c.translate(180, 300); c.rotate(t * .25); c.globalAlpha = .16 * cl((t - 2.1) / .5);
      for (let i = 0; i < 12; i++) { c.rotate(Math.PI / 6); c.fillStyle = i % 2 ? '#ffcf3a' : '#ff8a3a'; c.beginPath(); c.moveTo(0, 0); c.lineTo(-30, -420); c.lineTo(30, -420); c.fill(); }
      c.restore(); c.globalAlpha = 1;
    }
    // Mặt đất + Pokémon diễu hành
    c.fillStyle = '#140a18'; c.fillRect(0, 505, W, H - 505); c.fillStyle = '#3a2048'; c.fillRect(0, 505, W, 2);
    for (const [dex, dir, y, sp, t0] of this.parade) {
      if (t < t0) continue; const pm = PMD[dex]; if (!pm || pm.ready !== pm.need) continue;
      const an = pm.a.Walk, k = pm.k * .8, lt = t - t0, x = dir === 2 ? -40 + lt * sp : 400 - lt * sp; if (x < -60 || x > 420) continue;
      let t60 = (lt * 60) % (an.tot * 60), i = 0; while (i < an.d.length - 1 && t60 >= an.d[i]) { t60 -= an.d[i]; i++; }
      c.fillStyle = 'rgba(0,0,0,.4)'; c.beginPath(); c.ellipse(x, y, pm.w * k * .45, 4, 0, 0, Math.PI * 2); c.fill();
      c.drawImage(an.img, an.fw * i, an.fh * dir, an.fw, an.fh, x - an.fw * k / 2, y - (an.fh / 2 + pm.foot) * k, an.fw * k, an.fh * k);
    }
    // Quả cầu: rơi (0.3–0.9s), nảy, lắc 3 lần (1.0–2.0s), bung (2.1s)
    if (t > .3 && t < 2.25) {
      let by = 300, rot = 0, sc = 1;
      if (t < .9) { const p = (t - .3) / .6; by = -30 + 330 * p * p; }
      else if (t < 1.15) { const p = (t - .9) / .25; by = 300 - Math.sin(p * Math.PI) * 40; }
      else if (t < 2) { const p = (t - 1.15) / .85, w = Math.floor(p * 3); rot = Math.sin((p * 3 - w) * Math.PI) * .45 * (w % 2 ? -1 : 1); }
      else sc = 1 + (t - 2) * 3;
      c.save(); c.translate(180, by); c.rotate(rot); c.scale(sc, sc);
      c.fillStyle = 'rgba(0,0,0,.35)'; const shR = 22 * cl(by / 300); if (shR > .5) { c.beginPath(); c.ellipse(0, 26 + 300 - by, shR, 5 * cl(by / 300) + .1, 0, 0, Math.PI * 2); c.fill(); }
      drawBallOn(c, 0, 0, 24, t > 1.9 && t < 2.1 && Math.sin(t * 60) > 0);
      c.restore();
    }
    // Chớp trắng khi bung
    if (t > 2.05 && t < 2.6) { c.fillStyle = `rgba(255,255,255,${1 - (t - 2.05) / .55})`; c.fillRect(0, 0, W, H); }
    // Hạt sáng
    for (const s of this.sparks) { s.x += s.vx / 60; s.y += s.vy / 60; s.vy += 4; s.vx *= .985; s.l -= 1 / 60; if (s.l > 0) { c.globalAlpha = cl(s.l); c.fillStyle = s.c; c.fillRect(s.x | 0, s.y | 0, 3, 3); } }
    this.sparks = this.sparks.filter(s => s.l > 0); c.globalAlpha = 1;
    // Logo
    if (t > 2.15) {
      const p = cl((t - 2.15) / .55), s1 = Math.max(.01, e(p)), bob = Math.sin(t * 2.2) * 3;
      c.save(); c.translate(180, 262 + bob); c.scale(s1, s1);
      c.font = `64px ${F2}`; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillStyle = '#6a3200'; c.fillText('ĐẤU TRƯỜNG', 3, 4); c.lineWidth = 6; c.strokeStyle = '#1a0a10'; c.strokeText('ĐẤU TRƯỜNG', 0, 0);
      const lg = c.createLinearGradient(0, -26, 0, 26); lg.addColorStop(0, '#fff3a0'); lg.addColorStop(.5, '#ffcf3a'); lg.addColorStop(1, '#ff9a1a'); c.fillStyle = lg; c.fillText('ĐẤU TRƯỜNG', 0, 0);
      c.restore();
      const p2 = cl((t - 2.45) / .45);
      if (p2 > 0) {
        c.save(); c.globalAlpha = p2; c.translate(180, 318 + (1 - e(p2)) * 40 + bob);
        c.font = `30px ${F1}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineWidth = 6; c.strokeStyle = '#1a0a10'; c.strokeText('PIXEL', 0, 0);
        c.fillStyle = '#3a3046'; c.fillText('PIXEL', 3, 3); c.fillStyle = '#ffffff'; c.fillText('PIXEL', 0, 0); c.restore();
      }
      // Vệt sáng lướt qua logo
      const sw = ((t - 2.9) % 2.6) / .6;
      if (t > 2.9 && sw < 1) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = .55; const x0 = -40 + sw * 440; const sg = c.createLinearGradient(x0 - 30, 0, x0 + 30, 0); sg.addColorStop(0, 'rgba(255,255,255,0)'); sg.addColorStop(.5, 'rgba(255,255,255,.9)'); sg.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = sg; c.fillRect(x0 - 30, 225, 60, 115); c.restore(); }
      c.globalAlpha = 1;
    }
    // Chạm để bắt đầu + thanh tải
    if (t > 2.9) {
      const ready = R.filter(d => SPR[d.id].real).length / R.length;
      c.globalAlpha = .5 + .5 * Math.abs(Math.sin(t * 3.2)); stxt(c, 'CHẠM ĐỂ BẮT ĐẦU', 180, 405, 26, '#ffffff', 'center', F2); c.globalAlpha = 1;
      c.fillStyle = '#2a2232'; c.fillRect(110, 432, 140, 4); c.fillStyle = '#ffcf3a'; c.fillRect(110, 432, 140 * ready, 4);
      stxt(c, ready < 1 ? 'ĐANG TẢI POKÉMON...' : '41 POKÉMON · 6 SÂN ĐẤU · PVP ONLINE', 180, 448, 14, '#a99fb4', 'center', F2);
      stxt(c, 'Phiên bản ' + APP_VERSION, 180, 630, 12, '#5a5068', 'center', F2);
    }
    // Mờ dần khi vào menu
    if (this.out >= 0) { c.fillStyle = `rgba(18,14,23,${cl(this.out / .45)})`; c.fillRect(0, 0, W, H); }
  }
};
// Chữ có viền vẽ lên canvas của splash (hàm txt() chung chỉ vẽ lên canvas game)
function stxt(c, s, x, y, size, col, align = 'left', font = F1, ol = '#1a1020') { c.font = `${size}px ${font}`; c.textAlign = align; c.textBaseline = 'middle'; c.lineJoin = 'round'; c.lineWidth = Math.max(2.5, size / 3.2); c.strokeStyle = ol; c.strokeText(s, x, y); c.fillStyle = col; c.fillText(s, x, y); }
// Quả cầu vẽ trên context bất kỳ (dùng cho splash)
function drawBallOn(c, x, y, r, glint) {
  c.save(); c.translate(x, y);
  c.beginPath(); c.arc(0, 0, r, Math.PI, 0); c.fillStyle = '#e8423a'; c.fill();
  c.beginPath(); c.arc(0, 0, r, 0, Math.PI); c.fillStyle = '#f4f0f4'; c.fill();
  c.fillStyle = 'rgba(255,255,255,.35)'; c.beginPath(); c.ellipse(-r * .4, -r * .55, r * .3, r * .16, -.5, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#1a1020'; c.fillRect(-r, -2.5, r * 2, 5);
  c.beginPath(); c.arc(0, 0, r * .36, 0, Math.PI * 2); c.fill();
  c.beginPath(); c.arc(0, 0, r * .22, 0, Math.PI * 2); c.fillStyle = glint ? '#ffe14a' : '#ffffff'; c.fill();
  c.beginPath(); c.arc(0, 0, r, 0, Math.PI * 2); c.strokeStyle = '#1a1020'; c.lineWidth = 2.5; c.stroke();
  c.restore();
}
splash.start();
