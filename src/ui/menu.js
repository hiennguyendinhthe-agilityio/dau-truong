'use strict';
// Màn chọn đội

// ---------- MENU CHỌN ĐỘI ----------
let picks = [];
const grid = $('grid'), slots = $('slots');
const sprCanvas = (id, n = 64) => { const c = document.createElement('canvas'); c.width = c.height = n; const x = c.getContext('2d'); x.imageSmoothingEnabled = false; const draw = () => { x.clearRect(0, 0, n, n); x.drawImage(SPR[id].img, 0, 0, n, n); }; draw(); onSprite(id, draw); return c; };
function showInfo(d) {
  $('info').innerHTML = `<b>${d.name}</b> · <span style="color:${GROUPS[d.g].col}">${GROUPS[d.g].n}</span> · ${d.types.map(t => TYPE_VI[t]).join('/')} · ${ITEMS[d.item]}<br>`
    + `Đánh thường: <b>${d.basic.n}</b> (${d.basic.k === 'melee' ? 'cận chiến' : 'tầm xa'}, chuỗi 3 đòn)<br>`
    + `<span class="s1">Chiêu 1: ${d.sp.n}</span> (${d.sp.cd}s): ${SP_DESC[d.sp.k]}<br>`
    + `<span class="s2">Chiêu riêng: ${d.sig.n}</span> (${d.sig.cd}s): ${d.sig.d}`;
}
R.forEach(d => {
  const el = document.createElement('div'); el.className = 'card'; el.dataset.id = d.id;
  el.appendChild(sprCanvas(d.id));
  el.insertAdjacentHTML('beforeend', `<div class="num"></div><div class="nm">${d.name}</div><div class="grp" style="color:${GROUPS[d.g].col}">${GROUPS[d.g].n}</div><div>${d.types.map(t => `<span class="tb" style="background:${TYPE_COL[t]};color:${TYPE_FG(t)}">${TYPE_VI[t]}</span>`).join('')}</div><div class="sp" style="color:#8fd0ff">${d.sp.n}</div><div class="sp" style="color:#ff9ad0">${d.sig.n}</div><div class="sp" style="color:#f3d36b">${ITEMS[d.item]}</div>`);
  el.onclick = () => { Snd.init(); ensurePMD(d.dex); const i = picks.indexOf(d.id); if (i >= 0) { picks.splice(i, 1); Snd.unpick(); } else if (picks.length < 6) { picks.push(d.id); Snd.pick(); } else Snd.click(); showInfo(d); refresh(); };
  grid.appendChild(el);
});
// Tab lọc theo nhóm
let tab = 'all';
const tabsEl = $('tabs');
[['all', 'TẤT CẢ', '#f4eee6'], ...Object.entries(GROUPS).map(([k, v]) => [k, v.n, v.col])].forEach(([k, n, col]) => {
  const b = document.createElement('button'); b.className = 'tab'; b.dataset.k = k; b.textContent = n; b.style.setProperty('--c', col);
  b.onclick = () => { Snd.init(); Snd.click(); tab = k; applyTab(); };
  tabsEl.appendChild(b);
});
function applyTab() {
  tabsEl.querySelectorAll('.tab').forEach(b => { const on = b.dataset.k === tab; b.classList.toggle('on', on); b.style.background = on ? b.style.getPropertyValue('--c') : ''; });
  grid.querySelectorAll('.card').forEach(el => { el.style.display = tab === 'all' || R.find(d => d.id === el.dataset.id).g === tab ? '' : 'none'; });
}
applyTab();
// Đội đối thủ: mỗi con của bạn ghép với một con khác cùng nhóm (để trận cân sức)
function enemyTeam(pt) {
  const used = new Set(pt.map(d => d.id)), out = [];
  for (const d of pt) {
    let pool = R.filter(x => x.g === d.g && !used.has(x.id));
    if (!pool.length) pool = R.filter(x => x.g === d.g && !out.includes(x));
    const e = pool[Math.random() * pool.length | 0]; used.add(e.id); out.push(e);
  }
  return out;
}
// Chọn sân đấu
let mapPick = 'random';
const mapsEl = $('maps');
[{ id: 'random', n: 'NGẪU NHIÊN', desc: 'Mỗi trận một sân ngẫu nhiên.' }, ...MAPS].forEach(m => {
  const b = document.createElement('button'); b.className = 'tab'; b.dataset.k = m.id; b.textContent = m.n;
  b.onclick = () => { Snd.init(); Snd.click(); mapPick = m.id; applyMap(); if (m.id !== 'random') { setMap(m); } };
  mapsEl.appendChild(b);
});
function applyMap() {
  mapsEl.querySelectorAll('.tab').forEach(b => { const on = b.dataset.k === mapPick; b.classList.toggle('on', on); b.style.background = on ? '#ffcf3a' : ''; });
  const m = MAPS.find(x => x.id === mapPick); $('mapInfo').textContent = m ? m.desc : 'Mỗi trận một sân ngẫu nhiên.';
}
applyMap();
function refresh() {
  grid.querySelectorAll('.card').forEach(el => { const i = picks.indexOf(el.dataset.id); el.classList.toggle('sel', i >= 0); el.querySelector('.num').textContent = i >= 0 ? i + 1 : ''; });
  slots.innerHTML = ''; for (let i = 0; i < 6; i++) { const s = document.createElement('div'); s.className = 'slot' + (picks[i] ? ' on' : ''); if (picks[i]) s.appendChild(sprCanvas(picks[i])); slots.appendChild(s); }
  const st = $('start'); st.disabled = picks.length !== 6; st.textContent = picks.length === 6 ? 'BẮT ĐẦU' : `CHỌN THÊM ${6 - picks.length}`;
}
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0;[a[i], a[j]] = [a[j], a[i]]; } return a; };
$('rand').onclick = () => { Snd.init(); Snd.pick(); picks = shuffle(tab === 'all' ? R : R.filter(d => d.g === tab)).slice(0, 6).map(d => d.id); refresh(); };
$('clear').onclick = () => { Snd.init(); Snd.unpick(); picks = []; refresh(); };
$('mManual').onclick = () => { Snd.init(); Snd.click(); MODE = 'manual'; $('mManual').classList.add('on'); $('mAuto').classList.remove('on'); };
$('mAuto').onclick = () => { Snd.init(); Snd.click(); MODE = 'auto'; $('mAuto').classList.add('on'); $('mManual').classList.remove('on'); };
$('start').onclick = () => {
  Snd.init(); Snd.click(); Snd.stopBgm();
  setMap(mapPick === 'random' ? MAPS[Math.random() * MAPS.length | 0] : MAPS.find(m => m.id === mapPick));
  const pt = picks.map(id => R.find(d => d.id === id));
  newBattle(pt, enemyTeam(pt));
  if (matchMedia('(pointer: coarse)').matches && document.documentElement.requestFullscreen && !document.fullscreenElement)
    document.documentElement.requestFullscreen({ navigationUI: 'hide' }).then(() => screen.orientation && screen.orientation.lock && screen.orientation.lock('portrait').catch(() => { })).catch(() => { });
  $('menu').style.display = 'none'; $('ctrl').style.display = 'block';
};
function showMenu() { Snd.stopBgm(); setTimeout(() => { if (!G) Snd.startBgm('menu'); }, 1500); Snd.setAmbient(null); G = null; joy = null; held.atk = false; $('menu').style.display = 'block'; $('ctrl').style.display = 'none'; }
refresh();
