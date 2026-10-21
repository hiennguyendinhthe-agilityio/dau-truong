'use strict';
// Nút bấm, cảm ứng, bàn phím

// ---------- ĐIỀU KHIỂN ----------
const $ = id => document.getElementById(id);
const pad = $('pad'), bAtk = $('bAtk'), bSk1 = $('bSk1'), bSk2 = $('bSk2'), bRoll = $('bRoll');
const btnCache = {};
function setBtn(el, id, label, sub, cd, max) {
  const p = cd > 0 ? Math.min(100, cd / max * 100) : 0, num = cd > .05 && max > 1;
  const key = label + '|' + sub + '|' + (num ? cd.toFixed(1) : '') + '|' + Math.round(p);
  if (btnCache[id] === key) return; btnCache[id] = key;
  el.querySelector('b').textContent = num ? cd.toFixed(1) : label;
  el.querySelector('small').textContent = sub;
  el.querySelector('.cdv').style.setProperty('--p', p + '%');
  el.classList.toggle('cd', cd > .05);
}
function updBtns() {
  const show = G && !G.auto && G.phase === 'fight';
  pad.style.visibility = show ? 'visible' : 'hidden'; if (!show) return;
  const f = G.sides[G.me].active; if (!f) return; const cf = f.item === 'claw' ? .85 : 1;
  setBtn(bAtk, 'a', 'ĐÁNH', f.d.basic.n, Math.max(0, f.atkCd), .6);
  setBtn(bSk1, '1', 'CHIÊU', f.d.sp.n, Math.max(0, f.cdS), f.d.sp.cd * cf);
  setBtn(bSk2, '2', 'RIÊNG', f.d.sig.n, Math.max(0, f.cdG), f.d.sig.cd * cf);
  setBtn(bRoll, 'r', 'NÉ', '', Math.max(0, f.cdR), 1.1);
}
function syncCtrl() {
  $('aBtn').textContent = G && G.auto ? '🤖' : '🎮';
  $('sBtn').textContent = 'x' + SPEED;
  for (const id of ['pBtn', 'sBtn', 'aBtn']) $(id).style.display = G && G.net ? 'none' : '';
  $('pBtn').textContent = G && G.paused ? '▶' : '⏸';
  $('sndBtn').textContent = Snd.muted ? '🔇' : '🔊';
}
function bindAct(el, k, holdKey) {
  el.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); Snd.init(); el.classList.add('on'); press(k); if (holdKey) held[holdKey] = true; if (el.setPointerCapture) el.setPointerCapture(e.pointerId); });
  const up = () => { el.classList.remove('on'); if (holdKey) held[holdKey] = false; };
  el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up); el.addEventListener('lostpointercapture', up);
}
bindAct(bAtk, 'atk', 'atk'); bindAct(bSk1, 'sk1'); bindAct(bSk2, 'sk2'); bindAct(bRoll, 'dodge');
$('stage').addEventListener('contextmenu', e => e.preventDefault());
// Bỏ focus khỏi nút sau khi bấm để phím Space/Enter không kích hoạt lại nút
document.querySelectorAll('button').forEach(b => b.addEventListener('click', () => b.blur()));
$('sndBtn').onclick = () => { Snd.init(); Snd.toggle(); syncCtrl(); };
$('pBtn').onclick = () => { Snd.init(); Snd.click(); if (G && !G.net) { G.paused = !G.paused; syncCtrl(); } };
$('sBtn').onclick = () => { Snd.init(); Snd.click(); if (G && G.net) return; SPEED = SPEED % 3 + 1; syncCtrl(); };
$('aBtn').onclick = () => { Snd.init(); Snd.click(); if (G && !G.net) { G.auto = !G.auto; joy = null; syncCtrl(); } };
const toLogical = e => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) / r.width * W, (e.clientY - r.top) / r.height * H]; };
cv.addEventListener('pointerdown', e => {
  Snd.init();
  if (!G) return;
  if (G.phase === 'end' && G.endT > 1.5) { showMenu(); return; }
  if (G.auto || G.phase !== 'fight') return;
  const [x, y] = toLogical(e); joy = { id: e.pointerId, ox: x, oy: y, x, y }; cv.setPointerCapture(e.pointerId);
});
cv.addEventListener('pointermove', e => { if (joy && e.pointerId === joy.id) { [joy.x, joy.y] = toLogical(e); } });
const endJoy = e => { if (joy && e.pointerId === joy.id) joy = null; };
cv.addEventListener('pointerup', endJoy); cv.addEventListener('pointercancel', endJoy);
const KEYMAP = { KeyQ: 'atk', KeyW: 'sk1', KeyE: 'sk2', KeyR: 'dodge', Space: 'dodge' };
addEventListener('keydown', e => {
  Snd.init();
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
  keys[e.code] = true;
  if (!G) return;
  if (!e.repeat && !e.ctrlKey && !e.metaKey && KEYMAP[e.code]) press(KEYMAP[e.code]);
  if (e.code === 'KeyP' && !G.net) { G.paused = !G.paused; syncCtrl(); }
  if (e.code === 'Enter' && G.phase === 'end' && G.endT > 1.5) showMenu();
});
addEventListener('keyup', e => { keys[e.code] = false; });
addEventListener('blur', () => { for (const k in keys) keys[k] = false; held.atk = false; });
// Chuyển tab → tự tạm dừng (nhạc và âm thanh môi trường cũng dừng theo)
document.addEventListener('visibilitychange', () => { if (document.hidden && G && !G.net && G.phase === 'fight' && !G.paused) { G.paused = true; syncCtrl(); } });
