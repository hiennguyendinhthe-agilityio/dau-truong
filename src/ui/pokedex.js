'use strict';
// Màn hình Pokédex: thông tin, lịch sử (mô tả qua các bản game), chỉ số và chiêu trong Đấu Trường

const dexUI = {
  cur: null, anim: null,
  list() { return R.filter(d => tab === 'all' || d.g === tab); },
  open(d) {
    this.cur = d; ensurePMD(d.dex);
    const x = DEX[d.dex], g = GROUPS[d.g], types = d.types.map(t => `<span class="tb" style="background:${TYPE_COL[t]};color:${TYPE_FG(t)}">${TYPE_VI[t]}</span>`).join('');
    const kind = x.kind === 'leg' ? 'Pokémon Huyền thoại' : x.kind === 'myth' ? 'Pokémon Huyền bí (Mythical)' : '';
    const evo = x.evo.map(st => st.map(n => n.toUpperCase() === d.name ? `<b>${n}</b>` : n).join(' / ')).join(' → ');
    // Tương khắc: hệ tấn công gây x2 trở lên = yếu; x0.5 trở xuống = kháng; x0 = miễn nhiễm
    const all = Object.keys(TYPE_COL), m = t => eff(t, d.types);
    const chip = (t, v) => `<span class="tb" style="background:${TYPE_COL[t]};color:${TYPE_FG(t)}">${TYPE_VI[t]}${v ? ' x' + v : ''}</span>`;
    const weak = all.filter(t => m(t) > 1).map(t => chip(t, m(t))).join('') || '—';
    const res = all.filter(t => m(t) > 0 && m(t) < 1).map(t => chip(t, m(t))).join('') || '—';
    const imm = all.filter(t => m(t) === 0).map(t => chip(t)).join('');
    const bar = (lab, v, val) => `<div class="st"><span>${lab}</span><i><em style="width:${Math.min(100, v / 1.6)}%"></em></i><b>${val}</b></div>`;
    const mv = (lab, cls, o, desc) => `<p class="mv"><span class="${cls}">${lab}: ${o.n}</span> <span class="tb" style="background:${TYPE_COL[o.t]};color:${TYPE_FG(o.t)}">${TYPE_VI[o.t]}</span><br>${desc}</p>`;
    const sel = picks.includes(d.id);
    $('dexBox').innerHTML = `
      <div class="dx-head"><canvas id="dexAnim" width="96" height="96"></canvas><div>
        <div class="dx-no">#${String(d.dex).padStart(3, '0')}</div><div class="dx-nm">${d.name}</div>
        <div class="dx-gn">${x.genus}</div><div>${types}</div>
        <div class="grp" style="color:${g.col}">${g.n}${kind ? ' · ' + kind : ''}</div></div></div>
      <h3>THÔNG TIN</h3>
      <table class="dx-t"><tr><td>Ra mắt</td><td>Thế hệ ${x.gen} · vùng ${x.region}</td></tr>
        <tr><td>Chiều cao</td><td>${x.h.toLocaleString('vi-VN')} m</td></tr><tr><td>Cân nặng</td><td>${x.w.toLocaleString('vi-VN')} kg</td></tr>
        <tr><td>Đặc tính gốc</td><td>${x.abil.join(', ')}</td></tr><tr><td>Tiến hoá</td><td>${x.evo.length > 1 ? evo : 'Không tiến hoá'}</td></tr></table>
      <h3>LỊCH SỬ QUA CÁC BẢN GAME</h3>
      ${x.e.map(([v, t]) => `<p class="dx-e"><span>Pokémon ${v}</span>${t}</p>`).join('')}
      <h3>TRONG ĐẤU TRƯỜNG</h3>
      ${bar('MÁU', d.b[0], d.b[0] * 5 + 300)}${bar('CÔNG', d.b[1], d.b[1])}${bar('THỦ', d.b[2], d.b[2])}${bar('TỐC', d.b[3], d.b[3])}
      ${mv('Đánh thường', '', d.basic, (d.basic.k === 'melee' ? 'Cận chiến' : 'Tầm xa') + ', giữ nút để đánh liên hoàn 3 đòn.')}
      ${mv('Chiêu 1 (W)', 's1', d.sp, `${SP_DESC[d.sp.k]}. Hồi ${d.sp.cd} giây.${d.sp.st ? (d.sp.st === 'burn' ? ' Có thể gây bỏng.' : ' Có thể gây tê liệt.') : ''}`)}
      ${mv('Chiêu riêng (E)', 's2', d.sig, `${d.sig.d}. Hồi ${d.sig.cd} giây.`)}
      <p class="mv">Vật phẩm: <b>${ITEMS[d.item]}</b>${d.ab ? ` · Vào sân: <b>${{ sand: 'gọi Bão Cát', rain: 'gọi Mưa Lớn', sun: 'gọi Nắng Gắt', hail: 'gọi Mưa Đá', intim: 'Đe Doạ (giảm công đối thủ)' }[d.ab]}</b>` : ''}</p>
      <h3>TƯƠNG KHẮC</h3>
      <p class="mv">Yếu trước: ${weak}</p><p class="mv">Kháng: ${res}</p>${imm ? `<p class="mv">Miễn nhiễm: ${imm}</p>` : ''}
      <p class="dx-src">Số liệu và mô tả: PokeAPI (pokeapi.co), dịch từ các bản game Pokémon. Pokémon © Nintendo / Game Freak.</p>
      <div class="dx-nav"><button class="btn" id="dxPrev">◀</button><button class="btn${sel ? ' on' : ''}" id="dxPick">${sel ? 'BỎ KHỎI ĐỘI' : picks.length >= 6 ? 'ĐỘI ĐÃ ĐỦ 6' : 'CHỌN VÀO ĐỘI'}</button><button class="btn" id="dxNext">▶</button></div>
      <button class="btn dx-close" id="dxClose">ĐÓNG</button>`;
    $('dex').style.display = 'flex'; $('dexBox').scrollTop = 0;
    const L = this.list(), i = L.indexOf(d);
    $('dxPrev').onclick = () => { Snd.click(); this.open(L[(i - 1 + L.length) % L.length]); };
    $('dxNext').onclick = () => { Snd.click(); this.open(L[(i + 1) % L.length]); };
    $('dxPick').onclick = () => {
      const k = picks.indexOf(d.id);
      if (k >= 0) { picks.splice(k, 1); Snd.unpick(); } else if (picks.length < 6) { picks.push(d.id); Snd.pick(); } else return;
      refresh(); this.open(d);
    };
    $('dxClose').onclick = () => this.close();
    this.startAnim(d);
  },
  close() { $('dex').style.display = 'none'; cancelAnimationFrame(this.anim); this.anim = null; Snd.click(); },
  // Hoạt ảnh xem trước: đi bộ xoay đủ 8 hướng (khi chưa tải xong thì hiện ảnh chân dung)
  startAnim(d) {
    cancelAnimationFrame(this.anim); const c = $('dexAnim'), x = c.getContext('2d'), t0 = performance.now();
    const loop = now => {
      if (!$('dexAnim') || this.cur !== d) return;
      x.clearRect(0, 0, 96, 96); x.imageSmoothingEnabled = false;
      const pm = PMD[d.dex], ok = pm && pm.started && pm.ready === pm.need;
      if (ok) {
        const an = pm.a.Walk, t = (now - t0) / 1000, dir = Math.floor(t / 1.2) % 8; let t60 = (t * 60) % (an.tot * 60), i = 0;
        while (i < an.d.length - 1 && t60 >= an.d[i]) { t60 -= an.d[i]; i++; }
        const k = Math.min(2, 80 / Math.max(an.fw, an.fh) * 1.4);
        x.fillStyle = 'rgba(0,0,0,.3)'; x.beginPath(); x.ellipse(48, 84, pm.w * k * .45, 5, 0, 0, Math.PI * 2); x.fill();
        x.drawImage(an.img, an.fw * i, an.fh * dir, an.fw, an.fh, 48 - an.fw * k / 2, 84 - (an.fh / 2 + pm.foot) * k, an.fw * k, an.fh * k);
      } else x.drawImage(SPR[d.id].img, 8, 8, 80, 80);
      this.anim = requestAnimationFrame(loop);
    };
    this.anim = requestAnimationFrame(loop);
  }
};
// Nút ⓘ trên mỗi thẻ và nút POKÉDEX ở menu
grid.querySelectorAll('.card').forEach(el => {
  const b = document.createElement('button'); b.className = 'dx-i'; b.textContent = 'i'; b.title = 'Xem Pokédex';
  b.onclick = e => { e.stopPropagation(); Snd.init(); Snd.click(); dexUI.open(R.find(d => d.id === el.dataset.id)); };
  el.appendChild(b);
});
$('dexBtn').onclick = () => { Snd.init(); Snd.click(); dexUI.open(dexUI.list()[0]); };
$('dex').addEventListener('click', e => { if (e.target.id === 'dex') dexUI.close(); });
addEventListener('keydown', e => { if ($('dex').style.display === 'flex') { if (e.code === 'Escape') dexUI.close(); if (e.code === 'ArrowRight') $('dxNext').click(); if (e.code === 'ArrowLeft') $('dxPrev').click(); } });
