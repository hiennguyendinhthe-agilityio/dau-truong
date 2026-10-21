// Kiểm thử PvP thật qua Supabase: 2 trình duyệt ghép trận và đánh nhau. Chạy: npm run test:pvp
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { chromium, devices } from 'playwright';
const root = new URL('..', import.meta.url).pathname;
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.woff2': 'font/woff2' };
const server = createServer(async (req, res) => {
  try { const p = join(root, decodeURIComponent(req.url.split('?')[0]).replace(/\/$/, '/index.html')); const body = await readFile(p); res.writeHead(200, { 'content-type': TYPES[extname(p)] || 'application/octet-stream' }); res.end(body); }
  catch { res.writeHead(404); res.end(); }
}).listen(0);
const url = `http://127.0.0.1:${server.address().port}/`;
let fail = 0; const ok = (c, m) => { console.log((c ? 'ĐẠT  ' : 'LỖI  ') + m); if (!c) fail++; };
const launch = { executablePath: process.env.CHROME_PATH || undefined };
// Môi trường có proxy (máy CI/máy ảo): cho Supabase đi qua proxy, trang game nội bộ đi thẳng
if (process.env.HTTPS_PROXY) launch.args = ['--proxy-server=' + process.env.HTTPS_PROXY, '--proxy-bypass-list=127.0.0.1;localhost'];
const browser = await chromium.launch(launch);
const errs = [];
async function player(name, team, opts = {}) {
  const ctx = await browser.newContext({ ...(opts.mobile ? devices['iPhone 13'] : { viewport: { width: 414, height: 736 } }), ignoreHTTPSErrors: true });
  await ctx.addInitScript(n => { try { localStorage.setItem('dt-name', n); } catch (e) { } }, name);
  const p = await ctx.newPage(); p.on('pageerror', e => errs.push(name + ': ' + e.message));
  await p.goto(url + (opts.query || '')); await p.waitForFunction(() => typeof NET !== 'undefined');
  await p.evaluate(t => { picks = t.slice(); refresh(); NET.waitAsk = 6; }, team);
  return p;
}
const T = n => ['p25', 'p6', 'p9', 'p94', 'p448', 'p130', 'p143', 'p282', 'p150', 'p249', 'p250', 'p382', 'p383', 'p483', 'p487', 'p644'].slice(n, n + 6);
const waitFn = (p, fn, arg, ms = 25000) => p.waitForFunction(fn, arg, { timeout: ms, polling: 200 }).then(() => true).catch(() => false);
const queue = 'free-' + Date.now();   // hàng chờ riêng cho lần chạy test, không lẫn với người chơi thật

// 1. Ghép trận ngẫu nhiên
const A = await player('AN', T(0)), B = await player('BINH', T(0));
await A.evaluate(q => NET.findMatch(q), queue); await B.waitForTimeout(800); await B.evaluate(q => NET.findMatch(q), queue);
const t0 = Date.now();
const matched = await waitFn(A, () => G && G.net) && await waitFn(B, () => G && G.net);
ok(matched, `Ghép trận ngẫu nhiên thành công (${((Date.now() - t0) / 1000).toFixed(1)} giây)`);
const roles = await Promise.all([A, B].map(p => p.evaluate(() => [G.net, G.me, G.sides.map(s => s.name).join(' vs ')])));
ok(roles[0][0] !== roles[1][0] && roles[0][1] !== roles[1][1], `Một máy làm chủ phòng, một máy là khách (${roles[0][0]}/${roles[1][0]})`);
ok(roles[0][2] === roles[1][2] && /AN/.test(roles[0][2]) && /BINH/.test(roles[0][2]), 'Hai bên thấy đúng tên nhau: ' + roles[0][2]);
const H = roles[0][0] === 'host' ? A : B, C = H === A ? B : A;
ok(await waitFn(C, () => G.phase === 'fight' && G.sides.every(s => s.active && s.active.released && s.active.appear >= 1)), 'Máy khách thấy trận bắt đầu, cả 2 Pokémon đã ra sân');
ok((await H.evaluate(() => MAP.id)) === (await C.evaluate(() => MAP.id)), 'Hai bên cùng một sân đấu');
await H.waitForTimeout(1500);

// 2. Máy khách điều khiển Pokémon của mình
const cx0 = await H.evaluate(() => G.sides[1 - G.me].active.x);
await C.bringToFront(); await C.keyboard.down('ArrowLeft'); await C.waitForTimeout(700); await C.keyboard.up('ArrowLeft');
await H.waitForTimeout(400);
const cx1 = await H.evaluate(() => G.sides[1 - G.me].active.x);
ok(cx1 < cx0 - 20 || (cx0 < 50 && cx1 <= cx0), `Khách bấm phím trái: Pokémon của khách di chuyển trên máy chủ (${Math.round(cx0)} → ${Math.round(cx1)})`);
await H.evaluate(() => { const f = G.sides[1 - G.me].active; f.cdS = 0; f.wind = null; f.swing = null; f.roll = null; f.stunT = 0; });
await C.waitForTimeout(150); await C.keyboard.press('KeyW'); await H.waitForTimeout(700);
ok(await H.evaluate(() => G.sides[1 - G.me].active.cdS > 1), 'Khách bấm W: Pokémon của khách ra Chiêu 1 trên máy chủ');
ok(await waitFn(C, () => G.sides[G.me].active.cdS > .5, null, 3000), 'Khách thấy nút chiêu đang hồi (dữ liệu đồng bộ về)');

// 3. Trạng thái đồng bộ
await H.evaluate(() => { const f = G.sides[G.me].active; damage(f, 77, '#fff', 14); });
const hpH = await H.evaluate(() => G.sides[G.me].active.hp);
ok(await waitFn(C, h => G.sides[1 - G.me].active.hp === h, hpH, 3000), `Máu đồng bộ sang máy khách (${hpH})`);
const pos = await Promise.all([H, C].map(p => p.evaluate(() => G.sides.map(s => [Math.round(s.active.x), Math.round(s.active.y)]))));
const drift = Math.max(...pos[0].flatMap((xy, i) => xy.map((v, j) => Math.abs(v - pos[1][i][j]))));
ok(drift < 45, `Vị trí trên 2 máy khớp nhau (lệch tối đa ${drift}px)`);
// đo độ trễ: thời gian từ lúc máy chủ đổi máu tới lúc khách thấy
const lat = [];
for (let i = 0; i < 5; i++) {
  const t1 = Date.now(); await H.evaluate(() => damage(G.sides[1 - G.me].active, 1, '#fff', 10)); const h = await H.evaluate(() => G.sides[1 - G.me].active.hp);
  await waitFn(C, h => G.sides[G.me].active.hp === h, h, 3000); lat.push(Date.now() - t1);
}
lat.sort((a, b) => a - b); ok(lat[2] < 600, `Độ trễ máy chủ → khách: trung vị ${lat[2]}ms (gồm cả thời gian kiểm tra)`);

// 4. Gục ngã, đổi Pokémon, kết thúc trận
await H.evaluate(() => { const f = G.sides[1 - G.me].active; damage(f, f.hp + 10, '#fff', 14); });
ok(await waitFn(C, () => G.sides[G.me].team[0].fainted && G.sides[G.me].active && G.sides[G.me].active !== G.sides[G.me].team[0], null, 6000), 'Pokémon của khách gục, khách thấy Pokémon tiếp theo ra sân');
await H.evaluate(() => { for (const f of G.sides[1 - G.me].team) { f.hp = 1; } });
for (let i = 0; i < 20 && !(await H.evaluate(() => G.phase === 'end')); i++) { await H.evaluate(() => { const f = G.sides[1 - G.me].active; if (alive(f)) damage(f, 99, '#fff', 12); }); await H.waitForTimeout(700); }
ok(await waitFn(H, () => G.phase === 'end' && G.winner === G.me, null, 8000), 'Máy chủ thắng khi đội khách hết Pokémon');
ok(await waitFn(C, () => G.phase === 'end' && G.winner !== G.me, null, 5000), 'Máy khách thấy màn hình THẤT BẠI');
await Promise.all([H, C].map(p => p.evaluate(() => showMenu()))); await A.waitForTimeout(800);
ok((await Promise.all([A, B].map(p => p.evaluate(() => NET.state)))).every(s => s === 'idle'), 'Về menu thì rời phòng');

// 5. Mời bạn bằng mã + QR, khách mở link ?join=
const code = await A.evaluate(() => NET.createRoom('free'));
ok(/^\d{4}$/.test(code) && await A.evaluate(() => !!document.querySelector('#netBox .qr svg')), `Tạo phòng có mã ${code} và mã QR`);
const D = await player('DUNG', T(6), { query: '?join=' + code, mobile: true });
ok(await D.evaluate(c => NET.pendingCode === c && document.getElementById('joinBtn').textContent.includes(c), code), 'Mở link mời trên điện thoại: hiện sẵn nút VÀO PHÒNG ' + code);
await D.evaluate(() => netUI.hide()); await D.tap('#joinBtn');
ok(await waitFn(A, () => G && G.net === 'host') && await waitFn(D, () => G && G.net === 'guest'), 'Vào phòng bằng mã: trận bắt đầu trên cả 2 máy');
ok(await waitFn(D, () => G.phase === 'fight' && G.sides[G.me].active && G.sides[G.me].active.appear >= 1), 'Điện thoại khách thấy Pokémon của mình ra sân');
// cảm ứng trên điện thoại khách
const cdp = await D.context().newCDPSession(D);
const touch = (type, x, y) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y, id: 1 }] });
const dx0 = await A.evaluate(() => G.sides[1 - G.me].active.x);
await touch('touchStart', 200, 400); for (let i = 1; i <= 8; i++) { await touch('touchMove', 200 + i * 5, 400); await D.waitForTimeout(40); } await D.waitForTimeout(600); await touch('touchEnd'); await A.waitForTimeout(400);
ok(Math.abs((await A.evaluate(() => G.sides[1 - G.me].active.x)) - dx0) > 20, 'Khách kéo tay trên điện thoại: Pokémon di chuyển trên máy chủ');

// 6. Mất kết nối: khách đóng trang -> chủ phòng chờ rồi thắng
await D.context().close();
ok(await waitFn(A, () => G.phase === 'end' && G.winner === G.me && /rời|mất kết nối/.test(G.endNote || ''), null, 25000), 'Khách thoát giữa trận: chủ phòng được xử thắng');
await A.evaluate(() => showMenu());

// 7. Luật phòng: phòng "chỉ Phổ thông" từ chối đội Huyền thoại
await A.evaluate(() => { picks = R.filter(d => d.g === 'common').slice(0, 6).map(d => d.id); refresh(); });
const code2 = await A.evaluate(() => NET.createRoom('common'));
const E2 = await player('EM', T(8));
const err = await E2.evaluate(c => NET.joinCode(c).then(() => '').catch(e => e.message), code2);
ok(/chỉ cho Pokémon nhóm PHỔ THÔNG/.test(err), 'Phòng luật PHỔ THÔNG từ chối đội Huyền thoại, báo lỗi dễ hiểu');
await A.evaluate(() => NET.leave());

// 8. Hàng chờ CÂN BẰNG không ghép đội chênh lệch; quá thời gian thì hỏi đấu AI
const fq = 'fair-' + Date.now();
const F1 = await player('FA', T(0)), F2 = await player('FB', T(0));
await F1.evaluate(() => { picks = R.filter(d => d.g === 'legend').slice(0, 6).map(d => d.id); });
await F2.evaluate(() => { picks = R.filter(d => d.g === 'common').slice(0, 6).map(d => d.id); });
await F1.evaluate(q => { NET.findMatch(q); }, fq); await F2.evaluate(q => { NET.findMatch(q); }, fq);
await F1.waitForTimeout(5000);
ok(await F1.evaluate(() => !G && NET.state === 'search') && await F2.evaluate(() => !G), 'Hàng chờ CÂN BẰNG không ghép đội Huyền thoại với đội Phổ thông');
ok(await waitFn(F1, () => /CHƯA CÓ ĐỐI THỦ/.test(document.getElementById('netBox').textContent), null, 6000), 'Chờ lâu không có ai: hỏi đợi thêm hay đấu AI');
await F1.evaluate(() => [...document.querySelectorAll('#netBox .btn')].find(b => b.textContent === 'ĐẤU VỚI AI').click());
ok(await waitFn(F1, () => G && !G.net && G.phase), 'Bấm ĐẤU VỚI AI: vào trận với AI');
await F2.evaluate(() => NET.leave());

// 9. Đặt tên
ok(await F1.evaluate(() => !cleanName('a').ok && !cleanName('đm thằng').ok && cleanName('  tram  nè ').name === 'TRAM NÈ'), 'Kiểm tra tên: quá ngắn / từ thô tục bị chặn, tên hợp lệ được lưu');

ok(await A.evaluate(() => { const g = G; G = { net: 'host' }; syncCtrl(); const h = ['pBtn', 'sBtn', 'aBtn'].every(id => $(id).style.display === 'none'); G = g; syncCtrl(); return h; }), 'Trong trận PvP ẩn nút tạm dừng / tốc độ / AI');
ok(errs.length === 0, 'Không có lỗi JavaScript' + (errs.length ? ': ' + [...new Set(errs)].slice(0, 4).join(' | ') : ''));
await browser.close(); server.close();
console.log(fail ? `\n${fail} mục LỖI.` : '\nTất cả đều ĐẠT.');
process.exit(fail ? 1 : 0);
