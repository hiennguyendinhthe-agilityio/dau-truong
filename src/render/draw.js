'use strict';
// Vẽ sân đấu, Pokémon, hiệu ứng, thanh máu

// ---------- VẼ ----------
function rr(x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
function txt(s, x, y, size, col, align = 'left', font = F1, ol = '#1a1020') { ctx.font = `${size}px ${font}`; ctx.textAlign = align; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round'; ctx.lineWidth = Math.max(2.5, size / 3.2); ctx.strokeStyle = ol; ctx.strokeText(s, x, y); ctx.fillStyle = col; ctx.fillText(s, x, y); }
function badge(x, y, s, bg, fg, right) { ctx.font = `13px ${F2}`; const w = Math.ceil(ctx.measureText(s).width) + 8, bx = right ? x - w : x; rr(bx, y, w, 12, 3); ctx.fillStyle = bg; ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,.5)'; ctx.lineWidth = 1; ctx.stroke(); ctx.fillStyle = fg; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(s, bx + w / 2, y + 6.5); return w + 3; }
function rockBlob(x, y, s, col) { x = Math.round(x - s / 2); y = Math.round(y - s / 2); const h = Math.max(1, s >> 2); ctx.fillStyle = '#2a2440'; ctx.fillRect(x + h - 1, y - 1, s - 2 * h + 2, s + 2); ctx.fillRect(x - 1, y + h - 1, s + 2, s - 2 * h + 2); ctx.fillStyle = col; ctx.fillRect(x + h, y, s - 2 * h, s); ctx.fillRect(x, y + h, s, s - 2 * h); ctx.fillStyle = '#a8a6d8'; ctx.fillRect(x + h, y + 1, Math.max(1, s - 2 * h - 1), Math.max(1, h)); ctx.fillStyle = 'rgba(20,16,40,.35)'; ctx.fillRect(x + h, y + s - h, s - 2 * h, h); }
function ellipse(x, y, rx, ry) { ctx.beginPath(); ctx.ellipse(x, y, Math.max(.1, rx), Math.max(.1, ry), 0, 0, Math.PI * 2); }
function drawBall(x, y, r, col, rot, gray) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot || 0);
  ctx.beginPath(); ctx.arc(0, 0, r, Math.PI, 0); ctx.fillStyle = gray ? '#5a5462' : col; ctx.fill();
  ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI); ctx.fillStyle = gray ? '#8a8492' : '#f4f0f4'; ctx.fill();
  ctx.fillStyle = '#1a1020'; ctx.fillRect(-r, -1, r * 2, 2);
  ctx.beginPath(); ctx.arc(0, 0, r * .36, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.arc(0, 0, r * .2, 0, Math.PI * 2); ctx.fillStyle = '#fff'; ctx.fill();
  ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.strokeStyle = '#1a1020'; ctx.lineWidth = 1.2; ctx.stroke();
  ctx.restore();
}
function drawHud(i) {
  const S = G.sides[i], f = S.shown; if (!f) return; const L = i === 0;
  const px = L ? 6 : W - 42, py = 8;
  rr(px, py, 36, 36, 5); ctx.fillStyle = '#2a2232'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = TYPE_COL[f.types[0]]; ctx.stroke();
  ctx.save(); rr(px + 2, py + 2, 32, 32, 4); ctx.clip(); if ((f.sprite.dir || 1) < 0 ? L : !L) { ctx.translate(px * 2 + 36, 0); ctx.scale(-1, 1); } { const im = f.sprite.img, n = im.width; ctx.drawImage(im, n * .125, 0, n * .75, n * .69, px + 2, py + 3, 32, 30); } ctx.restore();
  const nx = L ? 48 : W - 48;
  txt(f.name, nx, 15, 10, '#ffffff', L ? 'left' : 'right');
  let bx = nx; const tags = f.types.map(t => [TYPE_VI[t], TYPE_COL[t], TYPE_FG(t)]);
  if (f.item && !(f.itemUsed && (f.item === 'sash' || f.item === 'sitrus'))) tags.push([ITEMS[f.item], '#f3d36b', '#2a1a00']);
  for (const [s, bg, fg] of tags) { const w = badge(bx, 24, s, bg, fg, !L); bx += L ? w : -w; }
  const bw = 128, by = 41, bxx = L ? 48 : W - 48 - bw;
  rr(bxx - 1, by - 1, bw + 2, 14, 3); ctx.fillStyle = '#1a1020'; ctx.fill();
  ctx.fillStyle = '#3a3046'; ctx.fillRect(bxx + 1, by + 1, bw - 2, 10);
  const pr = Math.max(0, f.dispHp / f.maxHp), tr = Math.max(0, f.trailHp / f.maxHp);
  const tw = (bw - 2) * tr, pw = (bw - 2) * pr;
  ctx.fillStyle = '#ffffff'; L ? ctx.fillRect(bxx + 1, by + 1, tw, 10) : ctx.fillRect(bxx + bw - 1 - tw, by + 1, tw, 10);
  ctx.fillStyle = pr > .5 ? '#4cd060' : pr > .2 ? '#f6c624' : '#ec4a3a'; L ? ctx.fillRect(bxx + 1, by + 1, pw, 10) : ctx.fillRect(bxx + bw - 1 - pw, by + 1, pw, 10);
  ctx.fillStyle = 'rgba(255,255,255,.25)'; L ? ctx.fillRect(bxx + 1, by + 1, pw, 3) : ctx.fillRect(bxx + bw - 1 - pw, by + 1, pw, 3);
  if (f.shield > 0) { const sw = (bw - 2) * Math.min(1, f.shield / f.maxHp); ctx.fillStyle = 'rgba(190,244,255,.85)'; L ? ctx.fillRect(bxx + 1, by + 8, sw, 3) : ctx.fillRect(bxx + bw - 1 - sw, by + 8, sw, 3); }
  txt(String(f.hp <= 0 && f.dispHp < 1 ? 0 : Math.ceil(f.dispHp)), L ? bxx + 4 : bxx + bw - 4, by + 6.5, 8, '#ffffff', L ? 'left' : 'right');
  S.team.forEach((m, k) => { const x = L ? 13 + k * 15 : W - 13 - k * 15, y = 64; if (m === S.active || (m === S.shown && !m.fainted)) { ctx.beginPath(); ctx.arc(x, y, 7.5, 0, Math.PI * 2); ctx.strokeStyle = '#ffcf3a'; ctx.lineWidth = 2; ctx.stroke(); } drawBall(x, y, 5.5, S.col, 0, m.fainted); });
  const bs = [];
  if (f.status) bs.push(f.status === 'burn' ? ['BỎNG', '#ff8a3a'] : ['TÊ LIỆT', '#f7d02c']);
  if (f.stunT > 0) bs.push(['CHOÁNG', '#ffe14a']); if (f.slowT > 0) bs.push(['CHẬM', '#9fd8ff']);
  if (f.atkUp > 0) bs.push(['CÔNG+', '#ff8a5a']); if (f.atkDown > 0) bs.push(['CÔNG-', '#c8a0ff']);
  if (f.shield > 0) bs.push(['GIÁP', '#bff4ff']); if (f.fortT > 0) bs.push(['PHÁO ĐÀI', '#cfc2a0']);
  if (f.mirrorT > 0) bs.push(['GƯƠNG', '#ff9ad0']); if (f.counterT > 0) bs.push(['THỦ THẾ', '#ffffff']);
  let x2 = L ? 6 : W - 6; for (const [s, c] of bs.slice(0, 3)) { const w = badge(x2, 74, s, c, '#1a1020', !L); x2 += L ? w : -w; }
}
function drawHazard(h, t) {
  const a = Math.max(0, Math.min(1, h.life / .5, (h.max - h.life) / .2));
  if (h.k === 'fire') {
    ctx.globalAlpha = .5 * a; ctx.fillStyle = '#ff5a10'; ellipse(h.x, h.y, h.r, h.r * .55); ctx.fill();
    ctx.globalAlpha = .7 * a; ctx.fillStyle = '#ffd23a'; ellipse(h.x, h.y, h.r * .45, h.r * .25); ctx.fill();
    ctx.fillStyle = '#ffe890'; for (let i = 0; i < 2; i++) ctx.fillRect(h.x + Math.sin(t * 9 + i * 2 + h.x) * h.r * .5, h.y - 3 - ((t * 30 + i * 7 + h.y) % 9), 2, 3);
  }
  if (h.k === 'whirl') {
    ctx.globalAlpha = .22 * a; ctx.fillStyle = '#3f7fd8'; ellipse(h.x, h.y, h.r, h.r * .6); ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = '#9fe0ff';
    for (let i = 0; i < 3; i++) { const r2 = h.r * (1 - i * .28), s = t * (4 + i) + i * 2; ctx.globalAlpha = (.6 - i * .12) * a; ctx.beginPath(); ctx.ellipse(h.x, h.y, r2, r2 * .6, 0, s, s + Math.PI * 1.3); ctx.stroke(); }
  }
  if (h.k === 'spike') {
    ctx.globalAlpha = .22 * a; ctx.fillStyle = TYPE_COL[h.mv.t]; ellipse(h.x, h.y, h.r, h.r * .6); ctx.fill();
    ctx.globalAlpha = a;
    for (const [sx, sy] of h.sp) { const x = h.x + sx, y = h.y + sy; ctx.fillStyle = '#1a260c'; ctx.beginPath(); ctx.moveTo(x - 3, y + 1); ctx.lineTo(x, y - 6); ctx.lineTo(x + 3, y + 1); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#d8f0a0'; ctx.beginPath(); ctx.moveTo(x - 2, y); ctx.lineTo(x, y - 5); ctx.lineTo(x + 1, y); ctx.closePath(); ctx.fill(); }
  }
  ctx.globalAlpha = 1;
}
function drawF(f, t) {
  if (!f.released || f.fainted) return;
  const S = 64 * (f.d.sc || 1);
  // Đang độn thổ: chỉ vẽ ụ đất di chuyển
  if (f.under > 0) {
    ctx.fillStyle = '#5a4028'; ellipse(f.x, f.y, 16, 6); ctx.fill(); ctx.fillStyle = '#7a5a3a'; ellipse(f.x, f.y - 2, 12, 4); ctx.fill();
    ctx.fillStyle = '#a8693a'; for (let i = 0; i < 4; i++) ctx.fillRect(f.x - 10 + i * 6, f.y - 4 - Math.abs(Math.sin(t * 12 + i)) * 3, 3, 2);
    ctx.globalAlpha = .55; ctx.strokeStyle = G.sides[f.side].col; ctx.lineWidth = 1.5; ellipse(f.x, f.y, S * .36, S * .12); ctx.stroke(); ctx.globalAlpha = 1;
    return;
  }
  let a = 1, sc = 1, oy = 0, rot = f.rot, wf = 0;
  if (f.appear < 1) { sc = Math.max(.05, easeOutBack(f.appear)); wf = 1 - f.appear; }
  if (f.dying >= 0) { const p = Math.min(1, f.dying / .9), q = Math.min(1, p * 1.7); rot = f.dieDir * easeOutCubic(q) * 1.5; oy = -Math.sin(q * Math.PI) * 16; a = p < .55 ? 1 : 1 - (p - .55) / .45; wf = p < .15 ? 1 - p / .15 : 0; }
  if (f.iframe > 0) a *= .5;
  let ax = 0, ay = 0; if (f.atkT > 0) { const p = 1 - f.atkT, o = p < .25 ? -p / .25 * 5 : p < .45 ? -5 + (p - .25) / .2 * 19 : 14 * (1 - easeOutCubic((p - .45) / .55)); ax = f.atkDx * o; ay = f.atkDy * o; }
  const br = f.dying < 0 ? Math.sin(f.bob * .75) * .035 : 0;
  const sy = (1 + f.sq + br) * sc, sx = (1 - f.sq * .55 - br * .5) * sc;
  const px = f.x + ax, py = f.y + ay;
  const sp = Math.hypot(f.vx, f.vy);
  const frameIdx = f.dying >= 0 ? 0 : (sp > 15 ? Math.floor(f.walk / 1.4) % 2 : Math.floor(f.bob * 0.7) % 2);
  const pm = pmdOf(f);
  if (pm) { drawPMD(f, t, pm, { a, sc, oy, rot, wf, px, py, S }); return; }
  const curImg = f.sprite.frames[frameIdx], curWhite = f.sprite.whites[frameIdx];
  for (const g of f.ghosts) { ctx.save(); ctx.globalAlpha = g.a * .5; ctx.translate(g.x, g.y); ctx.rotate(g.rot); ctx.scale(g.fs, 1); ctx.globalCompositeOperation = 'lighter'; ctx.drawImage(curImg, -S / 2, -S + 2, S, S); ctx.restore(); }
  const sh = Math.max(.5, 1 - f.hop / 25 - Math.max(0, -oy) / 40);
  ctx.globalAlpha = .35 * a; ctx.fillStyle = '#16101e'; ellipse(px, f.y, S * .32 * sh * sc, S * .1 * sh * sc); ctx.fill();
  ctx.globalAlpha = .55 * a; ctx.strokeStyle = G.sides[f.side].col; ctx.lineWidth = 1.5; ellipse(f.x, f.y, S * .36, S * .12); ctx.stroke();
  if (f.fortT > 0) { ctx.globalAlpha = .7; ctx.strokeStyle = '#cfc2a0'; ctx.lineWidth = 3; ellipse(f.x, f.y, S * .42, S * .15); ctx.stroke(); }
  if (f.wind && f.dying < 0) { const c = TYPE_COL[f.d.sp.t], pu = .5 + .5 * Math.sin(f.bob * 6); ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = .25 + .25 * pu; ctx.fillStyle = c; ellipse(px, py - S * .42, S * .5 + pu * 4, S * .55 + pu * 4); ctx.fill(); ctx.restore(); }
  ctx.globalAlpha = a; ctx.save(); ctx.translate(px, py - f.hop + oy); ctx.rotate(rot); ctx.scale(sx * f.faceS * (f.sprite.dir || 1), sy);
  if (f.counterT > 0) { ctx.globalAlpha = a * (.45 + .35 * Math.sin(t * 30)); ctx.drawImage(curWhite, -S * .56, -S * 1.1 + 2, S * 1.12, S * 1.12); ctx.globalAlpha = a; }
  ctx.drawImage(curImg, -S / 2, -S + 2, S, S);
  const fl = Math.max(f.flash > 0 ? Math.min(1, f.flash / .08) : 0, wf);
  if (fl > 0) { ctx.globalAlpha = a * fl; ctx.drawImage(curWhite, -S / 2, -S + 2, S, S); }
  ctx.restore(); ctx.globalAlpha = 1;
  const cy = py - f.hop + oy - S * .42;
  if (f.shield > 0) { ctx.globalAlpha = .22 + .08 * Math.sin(t * 6); ctx.fillStyle = '#bff4ff'; ellipse(px, cy, S * .48, S * .55); ctx.fill(); ctx.globalAlpha = .8; ctx.strokeStyle = '#e8fcff'; ctx.lineWidth = 1.5; ctx.stroke(); ctx.globalAlpha = 1; }
  if (f.mirrorT > 0) {
    ctx.save(); ctx.translate(px, cy); ctx.rotate(t * 2); ctx.globalAlpha = .75; ctx.strokeStyle = '#ff9ad0'; ctx.lineWidth = 2; ctx.beginPath();
    for (let i = 0; i <= 6; i++) { const an = i / 6 * Math.PI * 2; ctx[i ? 'lineTo' : 'moveTo'](Math.cos(an) * S * .5, Math.sin(an) * S * .55); } ctx.stroke(); ctx.restore(); ctx.globalAlpha = 1;
  }
  if (f.stunT > 0) for (let i = 0; i < 3; i++) { const an = t * 6 + i * 2.1; txt('★', px + Math.cos(an) * 14, py - S - 2 + Math.sin(an) * 4, 10, '#ffe14a', 'center', F2); }
}
// Chọn khung hình PMD hiện tại: hoạt ảnh một lần (nếu đang chạy) hoặc đi/đứng
function pmdFrame(f, pm) {
  let name, tt, once = false;
  const sp = Math.hypot(f.vx, f.vy), moving = sp > 15 || f.dash || f.roll;
  if (f.dying >= 0) { name = pm.a.Hurt ? 'Hurt' : 'Idle'; tt = 99; once = true; }
  else if (f.pa && pm.a[f.pa] && f.paT < pm.a[f.pa].tot) { name = f.pa; tt = f.paT; once = true; }
  else { name = moving || !pm.a.Idle ? 'Walk' : 'Idle'; tt = moving ? f.loopT : f.paT + f.bob; }
  const an = pm.a[name]; let t60 = once ? Math.min(tt * 60, an.tot * 60 - .01) : (tt * 60) % (an.tot * 60), i = 0;
  while (i < an.d.length - 1 && t60 >= an.d[i]) { t60 -= an.d[i]; i++; }
  return { an, i };
}
function drawPMD(f, t, pm, o) {
  const { an, i } = pmdFrame(f, pm), dir = f.dir8 || 0, k = pm.k;
  const S = Math.max(40, pm.h * k * 1.15), W2 = Math.max(26, pm.w * k);
  const sx = an.fw * i, sy = an.fh * dir, dx = -an.fw / 2, dy = -an.fh / 2 - pm.foot;
  const rot = f.dying >= 0 ? o.rot : f.hitRot * .5, sq = 1 + f.sq * .6;
  for (const g of f.ghosts) { ctx.save(); ctx.globalAlpha = g.a * .5; ctx.translate(g.x, g.y); ctx.rotate(g.rot * .5); ctx.scale(k, k); ctx.globalCompositeOperation = 'lighter'; ctx.drawImage(an.img, sx, sy, an.fw, an.fh, dx, dy, an.fw, an.fh); ctx.restore(); }
  ctx.globalAlpha = .35 * o.a; ctx.fillStyle = '#16101e'; ellipse(o.px, f.y, W2 * .45 * o.sc, W2 * .15 * o.sc); ctx.fill();
  ctx.globalAlpha = .55 * o.a; ctx.strokeStyle = G.sides[f.side].col; ctx.lineWidth = 1.5; ellipse(f.x, f.y, W2 * .55, W2 * .18); ctx.stroke();
  if (f.fortT > 0) { ctx.globalAlpha = .7; ctx.strokeStyle = '#cfc2a0'; ctx.lineWidth = 3; ellipse(f.x, f.y, W2 * .65, W2 * .22); ctx.stroke(); }
  if (f.wind && f.dying < 0) { const c = TYPE_COL[f.d.sp.t], pu = .5 + .5 * Math.sin(f.bob * 6); ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = .25 + .25 * pu; ctx.fillStyle = c; ellipse(o.px, o.py - S * .42, S * .5 + pu * 4, S * .55 + pu * 4); ctx.fill(); ctx.restore(); }
  ctx.globalAlpha = o.a; ctx.save(); ctx.translate(o.px, o.py + o.oy); ctx.rotate(rot); ctx.scale(k * o.sc * (2 - sq), k * o.sc * sq);
  if (f.counterT > 0 && an.white) { ctx.globalAlpha = o.a * (.45 + .35 * Math.sin(t * 30)); ctx.drawImage(an.white, sx, sy, an.fw, an.fh, dx * 1.1, dy * 1.1, an.fw * 1.1, an.fh * 1.1); ctx.globalAlpha = o.a; }
  ctx.drawImage(an.img, sx, sy, an.fw, an.fh, dx, dy, an.fw, an.fh);
  const fl = Math.max(f.flash > 0 ? Math.min(1, f.flash / .08) : 0, o.wf);
  if (fl > 0 && an.white) { ctx.globalAlpha = o.a * fl; ctx.drawImage(an.white, sx, sy, an.fw, an.fh, dx, dy, an.fw, an.fh); }
  ctx.restore(); ctx.globalAlpha = 1;
  const cy = o.py + o.oy - S * .42;
  if (f.shield > 0) { ctx.globalAlpha = .22 + .08 * Math.sin(t * 6); ctx.fillStyle = '#bff4ff'; ellipse(o.px, cy, S * .48, S * .55); ctx.fill(); ctx.globalAlpha = .8; ctx.strokeStyle = '#e8fcff'; ctx.lineWidth = 1.5; ctx.stroke(); ctx.globalAlpha = 1; }
  if (f.mirrorT > 0) {
    ctx.save(); ctx.translate(o.px, cy); ctx.rotate(t * 2); ctx.globalAlpha = .75; ctx.strokeStyle = '#ff9ad0'; ctx.lineWidth = 2; ctx.beginPath();
    for (let j = 0; j <= 6; j++) { const an2 = j / 6 * Math.PI * 2; ctx[j ? 'lineTo' : 'moveTo'](Math.cos(an2) * S * .5, Math.sin(an2) * S * .55); } ctx.stroke(); ctx.restore(); ctx.globalAlpha = 1;
  }
  if (f.stunT > 0) for (let j = 0; j < 3; j++) { const an2 = t * 6 + j * 2.1; txt('★', o.px + Math.cos(an2) * 14, o.py - S - 2 + Math.sin(an2) * 4, 10, '#ffe14a', 'center', F2); }
}
function render(now) {
  ctx.setTransform(RS, 0, 0, RS, 0, 0); ctx.imageSmoothingEnabled = false;
  const t = now / 1000;
  let sx = 0, sy = 0; if (G && G.shake > 0) { sx = Math.sin(t * 67) * G.shake * .9; sy = Math.cos(t * 53) * G.shake * .9; }
  ctx.save(); ctx.translate(sx, sy);
  ctx.drawImage(BG, 0, 0);
  ctx.fillStyle = 'rgba(200,230,255,.35)'; for (let y = AR.y0; y < H; y += 7) { const x = AR.x1 + 3 + Math.sin(t * 2 + y * .13) * 3; ctx.fillRect(x | 0, y, 4, 1); }
  if (!G) { ctx.restore(); return; }

  // Huấn luyện viên đứng ở cổng dưới, nhảy lên khi đội bạn ra đòn mạnh
  const cheer = G.trainerCheer > 0 ? Math.abs(Math.sin(G.trainerCheer * 18)) * 6 : 0;
  ctx.drawImage(TRAINER_SPR, 168, H - 33 - cheer + Math.sin(t * 3.5) * 1, 24, 32);

  for (const d of G.debris) { ctx.globalAlpha = Math.min(1, d.life); rockBlob(d.x, d.y, d.s, d.col); }
  ctx.globalAlpha = 1;
  const wt = G.weather && G.weather.type;
  if (wt) { ctx.fillStyle = wt === 'sand' ? 'rgba(214,170,100,.13)' : wt === 'rain' ? 'rgba(30,50,110,.18)' : wt === 'sun' ? 'rgba(255,170,60,.12)' : 'rgba(200,235,255,.12)'; ctx.fillRect(0, AR.y0 - 6, W, H); }
  for (const h of G.hazards) drawHazard(h, t);
  for (const tl of G.teles) {
    if (tl.t < 0) continue;
    const p = tl.t / tl.max, col = TYPE_COL[tl.mv.t], fl = .35 + .25 * Math.sin(t * 30);
    if (tl.k === 'circle') {
      ctx.globalAlpha = .22 + p * .2; ctx.fillStyle = '#ff3a3a'; ellipse(tl.x, tl.y, tl.r, tl.r * .6); ctx.fill(); ctx.globalAlpha = fl + .3; ctx.strokeStyle = col; ctx.lineWidth = 2; ellipse(tl.x, tl.y, tl.r * p, tl.r * .6 * p); ctx.stroke();
      if (tl.fx === 'meteor') { const my = tl.y - (1 - p) * 260; ctx.globalAlpha = 1; ctx.fillStyle = '#ff8a2a'; ctx.beginPath(); ctx.arc(tl.x + (1 - p) * 60, my - 10, 9, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#ffe48a'; ctx.beginPath(); ctx.arc(tl.x + (1 - p) * 60, my - 10, 5, 0, Math.PI * 2); ctx.fill(); G.parts.length < 900 && Math.random() < .5 && G.parts.push({ x: tl.x + (1 - p) * 60, y: my - 10, vx: 30, vy: -60, life: .3, max: .3, col: '#ffb030', s: 3, g: 0 }); }
    }
    if (tl.k === 'ring') { const o = tl.owner; ctx.globalAlpha = .18 + p * .15; ctx.fillStyle = '#ff3a3a'; ellipse(o.x, o.y - 6, tl.r, tl.r * .65); ctx.fill(); ctx.globalAlpha = fl + .3; ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.stroke(); }
    if (tl.k === 'beam') { const o = tl.owner; ctx.save(); ctx.translate(o.x, o.y - 24); ctx.rotate(tl.ang); ctx.globalAlpha = .2 + p * .25; ctx.fillStyle = '#ff3a3a'; ctx.fillRect(0, -tl.w / 2 * p, tl.len, tl.w * p); ctx.globalAlpha = fl + .3; ctx.fillStyle = col; ctx.fillRect(0, -1, tl.len, 2); ctx.restore(); }
  }
  ctx.globalAlpha = 1;
  const fs = G.sides.map(S => S.active || (S.shown && S.shown.dying >= 0 && !S.shown.fainted ? S.shown : null)).filter(Boolean).sort((a, b) => a.y - b.y);
  fs.forEach(f => drawF(f, t));
  ctx.globalCompositeOperation = 'lighter';
  for (const p of G.proj) {
    if (p.k === 'tornado') { for (let i = 0; i < 4; i++) { ctx.globalAlpha = .5 - i * .08; ctx.strokeStyle = '#e8e0ff'; ctx.lineWidth = 2; const r2 = 6 + i * 4; ctx.beginPath(); ctx.ellipse(p.x + Math.sin(t * 20 + i) * 3, p.y + 10 - i * 7, r2, r2 * .35, 0, t * 12 + i, t * 12 + i + 4.5); ctx.stroke(); } continue; }
    const pu = (1 + Math.sin(t * 40 + p.x) * .15) * p.size; ctx.globalAlpha = .35; ctx.fillStyle = p.col; ctx.beginPath(); ctx.arc(p.x, p.y, 10 * pu, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = .9; ctx.beginPath(); ctx.arc(p.x, p.y, 5 * pu, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(p.x, p.y, 2.6 * p.size, 0, Math.PI * 2); ctx.fill();
  }
  for (const b of G.bolts) { const a = b.life / b.max; ctx.globalAlpha = a; ctx.strokeStyle = '#fff6a0'; ctx.lineWidth = 5; ctx.beginPath(); b.pts.forEach(([x, y], i) => ctx[i ? 'lineTo' : 'moveTo'](x, y)); ctx.stroke(); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.stroke(); }
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  for (const b of G.beams) { const a = b.life / b.max; ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.ang); ctx.globalAlpha = a; ctx.fillStyle = b.col; ctx.fillRect(0, -b.w / 2 * a, b.len, b.w * a); ctx.fillStyle = '#ffffff'; ctx.fillRect(0, -b.w / 5 * a, b.len, b.w / 2.5 * a); ctx.restore(); }
  for (const r of G.rings) { ctx.globalAlpha = r.life / r.max; ctx.strokeStyle = r.col; ctx.lineWidth = r.thin ? 2.5 : 5; ellipse(r.x, r.y, r.r, r.r * .65); ctx.stroke(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.stroke(); }
  ctx.globalAlpha = 1;
  for (const b of G.balls) { const p = b.t / b.max, x = b.sx + (b.tx - b.sx) * p, y = b.sy + (b.ty - b.sy) * p - Math.sin(p * Math.PI) * 90; drawBall(x, y, 6, b.col, p * 12); }
  for (const p of G.parts) { const k = Math.max(0, p.life / p.max), z = Math.max(1, p.s * (.4 + .6 * k)); ctx.globalAlpha = Math.min(1, k * 1.6); ctx.fillStyle = p.col; ctx.fillRect(p.x - z / 2, p.y - z / 2, z, z); }
  ctx.globalAlpha = 1;
  for (const p of G.wp) {
    if (p.k === 'dot') { ctx.fillStyle = p.col; ctx.fillRect(p.x | 0, p.y | 0, p.s, p.s); }
    else if (p.k === 'rain') { ctx.strokeStyle = 'rgba(160,200,255,.7)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - 1, p.y + 9); ctx.stroke(); }
    else if (p.k === 'rock') { ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(p.x - p.s / 2 | 0, p.y - 1 | 0, p.s, 2); rockBlob(p.x, p.y - p.h, p.s, '#6e6a9c'); }
  }
  for (const f of G.floats) { const age = f.max - f.life, a = Math.min(1, f.life / f.max * 2.5), k = age < .2 ? Math.max(.1, easeOutBack(age / .2)) : 1, s = f.size * k * (f.pop && age < .2 ? 1.25 - age : 1); ctx.globalAlpha = a; txt(f.s, f.x, f.y, Math.round(s), f.col, 'center', f.font); }
  for (const b of G.bubbles) {
    const a = Math.min(1, b.life / b.max * 3);
    ctx.save(); ctx.globalAlpha = a; ctx.font = `14px ${F2}`;
    const tw = Math.ceil(ctx.measureText(b.s).width) + 16, th = 20, bx = b.x - tw / 2, by = b.y - th;
    rr(bx, by, tw, th, 4); ctx.fillStyle = 'rgba(18, 14, 24, 0.88)'; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = b.col; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(b.x - 3, by + th); ctx.lineTo(b.x, by + th + 4); ctx.lineTo(b.x + 3, by + th); ctx.closePath(); ctx.fillStyle = 'rgba(18, 14, 24, 0.88)'; ctx.fill(); ctx.stroke();
    txt(b.s, b.x, by + th / 2, 14, '#ffffff', 'center', F2);
    ctx.restore();
  }
  ctx.globalAlpha = 1;
  ctx.restore();
  if (G.slowmo > 0) { ctx.fillStyle = `rgba(120,240,255,${Math.min(.18, G.slowmo * .4)})`; ctx.fillRect(0, 0, W, H); }
  drawHud(0); drawHud(1);
  rr(150, 84, 60, 20, 10); ctx.fillStyle = 'rgba(10,8,14,.85)'; ctx.fill();
  const tm = Math.floor(G.time); txt(`${Math.floor(tm / 60)}:${String(tm % 60).padStart(2, '0')}`, 180, 94.5, 10, '#ffffff', 'center');
  if (G.weather) { const w = WEATHER[G.weather.type]; txt(`${w.n} ${Math.ceil(G.weather.t)}s`, 180, 114, 15, w.col, 'center', F2); }
  if (G.hc.n >= 2) { const k = Math.min(1, G.hc.t / .4); ctx.globalAlpha = k; txt(`${G.hc.n} HIT`, 12, 140, 14 + Math.min(6, G.hc.n), '#ffcf3a', 'left', F1, '#6a1200'); ctx.globalAlpha = 1; }
  if (G.banner) { const b = G.banner, a = Math.min(1, b.life / b.max * 3), k = Math.min(1, (b.max - b.life) * 6); ctx.globalAlpha = a * .7; ctx.fillStyle = '#120e17'; ctx.fillRect(0, 300, W, 40); ctx.globalAlpha = a; txt(b.s, 180 - (1 - k) * 120, 320, 24, b.col, 'center', F2); ctx.globalAlpha = 1; }
  if (G.fightBanner > 0) {
    const p = 1.35 - G.fightBanner, sc = p < 0.22 ? 2.5 - (p / 0.22) * 1.5 : 1 + Math.sin(p * 8) * 0.08, a = Math.min(1, G.fightBanner / 0.35);
    ctx.save(); ctx.translate(180, 310); ctx.scale(sc, sc); ctx.globalAlpha = a; txt('FIGHT!', 0, 0, 48, '#ffcf3a', 'center', F1, '#6a1200'); ctx.restore();
  }
  if (G.koBanner && G.koBanner.life > 0) {
    const b = G.koBanner, a = Math.min(1, b.life / b.max * 3);
    ctx.save(); ctx.globalAlpha = a * 0.88; ctx.fillStyle = '#140c1a'; ctx.fillRect(0, 185, W, 42); ctx.strokeStyle = b.col; ctx.lineWidth = 2; ctx.strokeRect(0, 185, W, 42);
    ctx.globalAlpha = a; txt(b.s, 180, 206, 26, b.col, 'center', F2, '#000000'); ctx.restore();
  }
  if (G.phase === 'intro') {
    const p = Math.min(1, G.pt / .4); ctx.fillStyle = 'rgba(10,8,14,.72)'; ctx.fillRect(0, 0, W, H);
    txt('BẠN', 180 - (1 - p) * 200, 220, 30, '#4aa8ff', 'center', F2);
    G.sides[0].team.forEach((m, k) => ctx.drawImage(m.sprite.img, 180 - (1 - p) * 240 - 105 + k * 35, 240, 32, 32));
    txt('VS', 180, 320, 30, '#ffcf3a', 'center');
    txt('ĐỐI THỦ', 180 + (1 - p) * 200, 370, 30, '#ff5a5a', 'center', F2);
    G.sides[1].team.forEach((m, k) => ctx.drawImage(m.sprite.img, 180 + (1 - p) * 240 - 105 + k * 35, 390, 32, 32));
  }
  if (G.phase === 'end' && G.endT > .9) {
    const a = Math.min(1, (G.endT - .9) * 3); ctx.globalAlpha = a; ctx.fillStyle = 'rgba(10,8,14,.75)'; ctx.fillRect(0, 0, W, H);
    const win = G.winner === 0;
    txt(win ? 'CHIẾN THẮNG!' : 'THẤT BẠI', 180, 270, 44, win ? '#ffcf3a' : '#ff5a5a', 'center', F2);
    const tm2 = Math.floor(G.time), kos = G.sides[1].team.filter(m => m.fainted).length;
    txt(`Thời gian: ${Math.floor(tm2 / 60)}:${String(tm2 % 60).padStart(2, '0')}   Hạ gục: ${kos}/6`, 180, 320, 20, '#ffffff', 'center', F2);
    const mvp = G.sides[0].team.slice().sort((x, y) => y.dealt - x.dealt)[0];
    txt(`MVP đội bạn: ${mvp.name} (${mvp.dealt} sát thương)`, 180, 345, 18, '#a99fb4', 'center', F2);
    if (G.endT > 1.5) txt('Chạm màn hình hoặc Enter để chơi lại', 180, 400, 18, '#ffffff', 'center', F2);
    ctx.globalAlpha = 1;
  }
  if (joy && G.phase === 'fight') { ctx.globalAlpha = .4; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(joy.ox, joy.oy, 30, 0, Math.PI * 2); ctx.stroke(); const dx = joy.x - joy.ox, dy = joy.y - joy.oy, l = Math.hypot(dx, dy), k = l > 30 ? 30 / l : 1; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(joy.ox + dx * k, joy.oy + dy * k, 12, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1; }
  if (G.paused) { ctx.fillStyle = 'rgba(10,8,14,.6)'; ctx.fillRect(0, 0, W, H); txt('TẠM DỪNG', 180, 320, 40, '#ffffff', 'center', F2); }
}
