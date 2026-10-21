'use strict';
// Giao diện PvP: đặt tên, tìm trận, mời bạn (QR + mã), nhập mã

const netUI = {
  show(html, btns = []) {
    $('netBox').innerHTML = html + '<div class="col"></div>';
    const col = $('netBox').querySelector('.col');
    for (const [label, fn, cls] of btns) { const b = document.createElement('button'); b.className = 'btn' + (cls ? ' ' + cls : ''); b.textContent = label; b.onclick = () => { Snd.init(); Snd.click(); fn(); }; col.appendChild(b); }
    $('net').style.display = 'flex';
  },
  hide() { $('net').style.display = 'none'; },
  cancel() { NET.leave(); netUI.hide(); },
  error(msg) { netUI.show(`<h2>CÓ LỖI</h2><p class="err">${msg}</p>`, [['ĐÓNG', () => netUI.cancel()]]); },
  // Hỏi tên trước khi chơi online (lần đầu), sau đó chạy tiếp hành động next
  askName(next) {
    netUI.show(`<h2>TÊN CỦA BẠN</h2><p>Tên hiện cho đối thủ khi đấu online (2–12 ký tự)</p><input id="nameIn" maxlength="12" value="${PLAYER.name}" autocomplete="off"><p class="err" id="nameErr"></p>`,
      [['LƯU', () => { const r = cleanName($('nameIn').value); if (!r.ok) { $('nameErr').textContent = r.msg; return; } PLAYER.name = r.name; showName(); netUI.hide(); if (next) next(); }], ['HUỶ', () => netUI.hide()]]);
    setTimeout(() => $('nameIn') && $('nameIn').focus(), 50);
  },
  needName(next) { if (PLAYER.name) next(); else netUI.askName(next); },
  chooseQueue() {
    netUI.show(`<h2>TÌM TRẬN</h2><p><b>TỰ DO</b>: ghép với bất kỳ ai.<br><b>CÂN BẰNG</b>: chỉ ghép với đội có sức mạnh tương đương (theo nhóm Pokémon).</p>`,
      [['TỰ DO', () => netUI.go(() => NET.findMatch('free'))], ['CÂN BẰNG', () => netUI.go(() => NET.findMatch('fair'))], ['HUỶ', () => netUI.hide()]]);
  },
  go(fn) { netUI.show('<h2>ĐANG KẾT NỐI<span class="dots"></span></h2>'); fn().catch(e => netUI.error(e.message === 'TIMEOUT' || e.message === 'CHANNEL_ERROR' ? 'Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.' : e.message)); },
  searching() {
    const t0 = Date.now();
    netUI.show(`<h2>ĐANG TÌM ĐỐI THỦ<span class="dots"></span></h2><p>Hàng chờ: ${NET.queue.startsWith('fair') ? 'CÂN BẰNG' : 'TỰ DO'}</p><p id="srchT">0 giây</p>`, [['HUỶ', () => netUI.cancel()]]);
    clearInterval(netUI.tick); netUI.tick = setInterval(() => { const el = $('srchT'); if (!el || NET.state !== 'search') return clearInterval(netUI.tick); el.textContent = Math.floor((Date.now() - t0) / 1000) + ' giây'; }, 500);
  },
  askAI() {
    netUI.show(`<h2>CHƯA CÓ ĐỐI THỦ</h2><p>Chưa có ai đang tìm trận. Bạn muốn đợi thêm hay đấu với <b>AI</b>?</p>`,
      [['ĐỢI THÊM', () => { netUI.searching(); clearTimeout(NET.askT); NET.askT = setTimeout(() => { if (NET.state === 'search') netUI.askAI(); }, NET.waitAsk * 1000); }],
      ['ĐẤU VỚI AI', () => { NET.leave(); netUI.hide(); $('start').click(); }], ['HUỶ', () => netUI.cancel()]]);
  },
  chooseRule() {
    const groups = Object.keys(GROUPS).filter(g => picks.every(id => R.find(d => d.id === id).g === g));
    const btns = [['TỰ DO (mọi Pokémon)', () => netUI.go(() => NET.createRoom('free'))]];
    for (const g of Object.keys(GROUPS)) btns.push([`CHỈ ${GROUPS[g].n}` + (groups.includes(g) ? '' : ' (đội bạn chưa hợp lệ)'), () => groups.includes(g) ? netUI.go(() => NET.createRoom(g)) : netUI.error(`Đội của bạn phải toàn Pokémon nhóm ${GROUPS[g].n} mới tạo được phòng này.`)]);
    btns.push(['HUỶ', () => netUI.hide()]);
    netUI.show('<h2>MỜI BẠN</h2><p>Chọn luật cho phòng. Người vào phòng phải chọn đội theo luật này.</p>', btns);
  },
  invite(code) {
    const link = location.href.split(/[?#]/)[0] + '?join=' + code;
    let qr = ''; try { const q = qrcode(0, 'M'); q.addData(link); q.make(); qr = q.createSvgTag({ cellSize: 4, margin: 2, scalable: true }); } catch (e) { }
    netUI.show(`<h2>PHÒNG CỦA BẠN</h2><p>Bạn bè quét mã QR, hoặc nhập mã:</p><div class="qr">${qr}</div><div class="code">${code}</div>
      <p>Luật: <b>${NET.rule === 'free' ? 'TỰ DO' : 'CHỈ ' + GROUPS[NET.rule].n}</b></p><p>Đang chờ bạn vào phòng<span class="dots"></span></p>`,
      [['GỬI LINK', () => { const d = { title: 'Đấu Trường Pixel', text: 'Vào đấu với mình! Mã phòng ' + code, url: link }; if (navigator.share) navigator.share(d).catch(() => { }); else if (navigator.clipboard) navigator.clipboard.writeText(link).then(() => { $('netBox').querySelector('p').textContent = 'Đã chép link, dán vào Zalo/Messenger để gửi.'; }); }], ['HUỶ PHÒNG', () => netUI.cancel()]]);
  },
  askCode() {
    netUI.show('<h2>NHẬP MÃ PHÒNG</h2><p>Nhập mã 4 số bạn bè gửi cho bạn</p><input id="codeIn" inputmode="numeric" maxlength="4" autocomplete="off"><p class="err" id="codeErr"></p>',
      [['VÀO PHÒNG', () => { const c = ($('codeIn').value || '').trim(); if (!/^\d{4}$/.test(c)) { $('codeErr').textContent = 'Mã gồm đúng 4 chữ số'; return; } netUI.join(c); }], ['HUỶ', () => netUI.hide()]]);
    setTimeout(() => $('codeIn') && $('codeIn').focus(), 50);
  },
  join(code) { NET.pendingCode = null; refresh(); netUI.show(`<h2>ĐANG VÀO PHÒNG ${code}<span class="dots"></span></h2>`, [['HUỶ', () => netUI.cancel()]]); NET.joinCode(code).catch(e => netUI.error(e.message === 'TIMEOUT' || e.message === 'CHANNEL_ERROR' ? 'Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.' : e.message)); }
};
function showName() { $('pname').innerHTML = PLAYER.name ? `Tên: <b>${PLAYER.name}</b>` : 'Chưa đặt tên'; }
showName();
$('nameBtn').onclick = () => { Snd.init(); Snd.click(); netUI.askName(); };
$('findBtn').onclick = () => { Snd.init(); Snd.click(); netUI.needName(() => netUI.chooseQueue()); };
$('inviteBtn').onclick = () => { Snd.init(); Snd.click(); netUI.needName(() => netUI.chooseRule()); };
$('joinBtn').onclick = () => { Snd.init(); Snd.click(); netUI.needName(() => NET.pendingCode ? netUI.join(NET.pendingCode) : netUI.askCode()); };
// Mở từ link mời / quét QR: ?join=1234
{
  const m = location.search.match(/[?&]join=(\d{4})/);
  if (m) {
    NET.pendingCode = m[1]; refresh();
    netUI.show(`<h2>BẠN ĐƯỢC MỜI!</h2><p>Phòng <b>${m[1]}</b>. Chọn đủ 6 Pokémon rồi bấm <b>VÀO PHÒNG ${m[1]}</b>.</p>`, [['CHỌN ĐỘI', () => netUI.hide()]]);
  }
}
