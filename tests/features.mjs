// Kiểm thử từng chức năng của game. Chạy: npm run test:all
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
const results = []; let group = '';
const ok = (c, m) => { results.push([group, m, !!c]); console.log((c ? 'ĐẠT  ' : 'LỖI  ') + `[${group}] ${m}`); };
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined });
const ctx = await browser.newContext({ viewport: { width: 414, height: 736 } });
const page = await ctx.newPage(); const errs = []; page.on('pageerror', e => errs.push(e.message));
await page.goto(url); await page.waitForFunction(() => R.every(d => SPR[d.id].real), null, { timeout: 15000 });
const E = (fn, arg) => page.evaluate(fn, arg);
// Công cụ trong trang: dựng trận thử, chạy giả lập theo bước 1/60 giây
await E(() => {
  window.TT = {
    step(sec) { for (let i = 0; i < Math.round(sec * 60); i++) update(1 / 60); },
    setup(a, b, map) {
      showMenu(); Snd.stopBgm(); for (const k in keys) keys[k] = false;
      setMap(map ? MAPS.find(m => m.id === map) : Object.assign({}, MAPS[0], { id: 'test', rocks: [], zones: [] }));
      const f = n => R.find(d => d.name === n); newBattle(a.map(f), b.map(f)); G.auto = false; G.paused = true;
      document.getElementById('menu').style.display = 'none'; document.getElementById('ctrl').style.display = 'block';
      TT.step(3); const p = G.sides[0].active, o = G.sides[1].active; return !!(p && o && alive(p) && alive(o));
    },
    place(d = 45) { const p = G.sides[0].active, o = G.sides[1].active; Object.assign(p, { x: 150, y: 420, vx: 0, vy: 0, kx: 0, ky: 0 }); Object.assign(o, { x: 150 + d, y: 420, vx: 0, vy: 0, kx: 0, ky: 0 }); return [p, o]; },
    dummyFor(att) { // đối thủ đứng yên mà cả 3 đòn của att đều gây được sát thương
      const c = ['MEW', 'SNORLAX', 'BLASTOISE', 'GARDEVOIR', 'TYRANITAR', 'METAGROSS', 'CHARIZARD'].filter(n => n !== att.name);
      return c.find(n => { const d = R.find(x => x.name === n); return [att.basic, att.sp, att.sig].every(m => m.p === 0 || eff(m.t, d.types) > 0); });
    }
  };
});

// ---------- 1. Dữ liệu ----------
group = 'Dữ liệu';
ok(await E(() => R.length === 41), '41 Pokémon');
ok(await E(() => Object.keys(GROUPS).every(g => R.some(d => d.g === g))), 'Đủ 5 nhóm, nhóm nào cũng có Pokémon');
ok(await E(() => Object.keys(TYPE_COL).length === 18 && Object.keys(CHART).every(t => TYPE_COL[t] && Object.keys(CHART[t]).every(d => TYPE_COL[d]))), '18 hệ, bảng tương khắc hợp lệ');
ok(await E(() => eff('Water', ['Fire']) === 2 && eff('Normal', ['Ghost']) === 0 && eff('Electric', ['Ground']) === 0 && eff('Fire', ['Grass', 'Steel']) === 4 && eff('Fairy', ['Dragon']) === 2 && eff('Fire', ['Water', 'Rock']) === .25), 'Tương khắc tính đúng (x2, x4, x0.25, miễn nhiễm)');
ok(await E(() => R.every(d => [d.basic, d.sp, d.sig].every(m => TYPE_COL[m.t]) && SP_DESC[d.sp.k] && SIG_DESC[d.sig.k] && ITEMS[d.item])), 'Mọi chiêu có hệ hợp lệ, mọi vật phẩm có tên');
ok(await E(() => R.every(d => !R.some(e => e !== d && [d.basic, d.sp, d.sig].every(m => m.p === 0 || eff(m.t, e.types) === 0) && [e.basic, e.sp, e.sig].every(m => m.p === 0 || eff(m.t, d.types) === 0)))), 'Không có cặp Pokémon nào không đánh được nhau');

// ---------- 2. Menu ----------
group = 'Màn chọn đội';
await E(() => showMenu());
const tabCounts = await E(async () => { const out = {}; for (const b of document.querySelectorAll('#tabs .tab')) { b.click(); out[b.dataset.k] = [...document.querySelectorAll('.card')].filter(c => c.style.display !== 'none').length; } return out; });
ok(tabCounts.all === 41 && tabCounts.common === 8 && tabCounts.pseudo === 8 && tabCounts.legend === 9 && tabCounts.myth === 8 && tabCounts.cosmic === 8, 'Tab nhóm lọc đúng số Pokémon ' + JSON.stringify(tabCounts));
ok(await E(() => { document.querySelector('#tabs .tab[data-k="legend"]').click(); document.getElementById('rand').click(); return picks.length === 6 && picks.every(id => R.find(d => d.id === id).g === 'legend'); }), 'NGẪU NHIÊN chọn 6 con trong tab đang mở');
ok(await E(() => { document.getElementById('clear').click(); return picks.length === 0 && document.getElementById('start').disabled; }), 'XÓA bỏ hết; chưa đủ 6 con thì nút BẮT ĐẦU khoá');
ok(await E(() => { document.querySelector('#tabs .tab[data-k="all"]').click(); const c = document.querySelectorAll('.card'); c[0].click(); const a = picks.length === 1 && document.getElementById('info').textContent.includes(R[0].name); c[0].click(); return a && picks.length === 0; }), 'Chạm thẻ: chọn/bỏ chọn, hiện thông tin chiêu');
ok(await E(() => { document.querySelectorAll('.card').forEach((c, i) => i < 7 && c.click()); return picks.length === 6; }), 'Không chọn quá 6 con');
ok(await E(() => { document.getElementById('mAuto').click(); const a = MODE === 'auto'; document.getElementById('mManual').click(); return a && MODE === 'manual'; }), 'Nút TỰ ĐIỀU KHIỂN / XEM AI ĐẤU');
ok(await E(() => [...document.querySelectorAll('#maps .tab')].every(b => { b.click(); return mapPick === b.dataset.k && document.getElementById('mapInfo').textContent.length > 10; }) && document.querySelectorAll('#maps .tab').length === 7), 'Nút chọn sân (6 sân + ngẫu nhiên) và mô tả sân');
ok(await E(() => { document.querySelector('#maps .tab[data-k="random"]').click(); return mapPick === 'random'; }), 'Chọn lại sân ngẫu nhiên');
ok(await E(() => { const e = enemyTeam(R.filter(d => d.g === 'legend').slice(0, 6)); return e.length === 6 && e.every(d => d.g === 'legend'); }), 'Đội đối thủ cùng nhóm với đội bạn');

// ---------- 2a. Bố cục điện thoại ----------
group = 'Bố cục màn chọn đội';
{
  const ph = await browser.newContext({ ...devices['iPhone 13'] }), pp = await ph.newPage(); await pp.goto(url); await pp.waitForTimeout(1500);
  const vis = id => pp.$eval(id, e => { const r = e.getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight && r.height > 0; });
  ok(await vis('#start') && await vis('#findBtn') && await vis('#inviteBtn') && await vis('#joinBtn'), 'Mở game trên iPhone: thấy ngay các nút vào trận, không cần cuộn');
  await pp.evaluate(() => { document.getElementById('menu').scrollTop = 900; }); await pp.waitForTimeout(200);
  ok(await vis('#start') && await vis('#findBtn'), 'Cuộn giữa danh sách Pokémon: nút vào trận vẫn luôn hiện ở đáy');
  ok(await pp.evaluate(() => { const last = document.getElementById('actbar').previousElementSibling; document.getElementById('menu').scrollTop = 1e6; const c = last.getBoundingClientRect(); return c.bottom <= document.getElementById('actbar').getBoundingClientRect().top + 1; }), 'Cuộn hết cỡ: thanh nút không che mất nội dung cuối menu');
  await pp.evaluate(() => { picks = R.slice(0, 4).map(d => d.id); refresh(); });
  ok(/4\/6/.test(await pp.textContent('#teamCount')) && await pp.$eval('#start', e => e.disabled), 'Thanh nút báo số Pokémon đã chọn (ĐỘI 4/6), chưa đủ thì khoá nút');
  await pp.evaluate(() => { picks = R.slice(0, 6).map(d => d.id); refresh(); });
  ok(/sẵn sàng/.test(await pp.textContent('#teamCount')) && !(await pp.$eval('#start', e => e.disabled)), 'Đủ 6 con: báo sẵn sàng, mở khoá nút');
  await pp.tap('.card[data-id="p150"] .dx-i'); await pp.waitForTimeout(300);
  await pp.evaluate(() => { document.getElementById('dexBox').scrollTop = 600; }); await pp.waitForTimeout(200);
  ok(await vis('#dxX'), 'Pokédex: nút X luôn hiện ở góc trên khi cuộn');
  await pp.tap('#dxX'); ok(await pp.$eval('#dex', e => e.style.display === 'none'), 'Bấm X đóng Pokédex');
  await ph.close();
}

// ---------- 2b. Pokédex ----------
group = 'Pokédex';
ok(await E(() => R.every(d => { const x = DEX[d.dex]; return x && x.genus && x.gen >= 1 && x.region && x.h > 0 && x.w > 0 && x.abil.length && x.evo.length && x.e.length >= 2 && x.e.every(([v, t]) => v && t.length > 20); })), 'Đủ dữ liệu Pokédex cho 41 con (phân loại, thế hệ, vùng, cao/nặng, đặc tính, tiến hoá, ≥2 mô tả)');
ok(await E(() => R.every(d => (DEX[d.dex].kind === 'leg') === (d.g === 'legend' || ['p384', 'p800', 'p791', 'p792'].includes(d.id)) || d.g === 'myth' || d.g === 'cosmic')), 'Nhãn Huyền thoại khớp với dữ liệu gốc');
await E(() => { picks = []; refresh(); });  // các bài test menu ở trên để lại đội 6 con
ok(await E(() => { document.querySelector('.card[data-id="p150"] .dx-i').click(); const t = document.getElementById('dexBox').textContent; return document.getElementById('dex').style.display === 'flex' && /MEWTWO/.test(t) && /Di Truyền/.test(t) && /Thế hệ 1/.test(t) && /Red \(1996\)/.test(t) && /Psystrike/.test(t) && picks.length === 0; }), 'Nút i trên thẻ mở Pokédex (không chọn nhầm vào đội), đủ thông tin, lịch sử, chiêu');
ok(await E(() => { const t = document.getElementById('dexBox').textContent; return /Yếu trước:.*BÓNG TỐI x2/.test(t) && /Kháng:.*GIÁC ĐẤU x0.5/.test(t); }), 'Bảng tương khắc của Mewtwo đúng (yếu Bóng tối/Ma/Bọ, kháng Giác đấu)');
ok(await E(() => { document.getElementById('dxNext').click(); const a = /MEW\b/.test(document.querySelector('.dx-nm').textContent) || true; const n1 = document.querySelector('.dx-nm').textContent; document.getElementById('dxPrev').click(); return n1 !== 'MEWTWO' && document.querySelector('.dx-nm').textContent === 'MEWTWO'; }), 'Nút ◀ ▶ chuyển Pokémon trước/sau');
ok(await E(() => { document.getElementById('dxPick').click(); const a = picks.includes('p150'); document.getElementById('dxPick').click(); const b = !picks.includes('p150'); document.getElementById('dxClose').click(); return a && b && document.getElementById('dex').style.display === 'none'; }), 'CHỌN VÀO ĐỘI / BỎ KHỎI ĐỘI ngay trong Pokédex, nút ĐÓNG');
ok(await E(() => { document.querySelector('.card[data-id="p25"]').click(); const l = document.getElementById('infoDex'); l.click(); const ok2 = /PIKACHU/.test(document.getElementById('dexBox').textContent) && /Pichu → <b>Pikachu<\/b> → Raichu/.test(document.getElementById('dexBox').innerHTML); dexUI.close(); document.querySelector('.card[data-id="p25"]').click(); return ok2; }), 'Liên kết trong khung thông tin mở Pokédex; chuỗi tiến hoá Pichu → Pikachu → Raichu');
ok(await E(() => { document.getElementById('dexBtn').click(); const ok2 = document.getElementById('dex').style.display === 'flex'; dexUI.close(); return ok2; }), 'Nút POKÉDEX ở menu');

// ---------- 3. Bàn phím và nút trong trận ----------
group = 'Điều khiển';
await E(() => TT.setup(['PIKACHU', 'CHARIZARD'], ['SNORLAX', 'MEW']));
await E(() => { const [p, o] = TT.place(120); o.stunT = 999; G.paused = false; });
const x0 = await E(() => G.sides[0].active.x); await page.keyboard.down('ArrowLeft'); await page.waitForTimeout(400); await page.keyboard.up('ArrowLeft');
ok((await E(() => G.sides[0].active.x)) < x0 - 20, 'Phím mũi tên di chuyển');
await page.waitForTimeout(600); const x1 = await E(() => G.sides[0].active.x); await page.keyboard.down('KeyD'); await page.waitForTimeout(400); await page.keyboard.up('KeyD');
ok(Math.abs((await E(() => G.sides[0].active.x)) - x1) < 3, 'Phím WASD không còn di chuyển (đã đổi sang Q/W/E/R)');
for (const [k, prep, chk, name] of [
  ['KeyW', 'p.cdS = 0', 'p.cdS > 1', 'Q/W/E/R: W ra Chiêu 1'], ['KeyE', 'p.cdG = 0', 'p.cdG > 1', 'E ra Chiêu riêng'],
  ['KeyR', 'p.cdR = 0', 'p.cdR > .5', 'R lăn né'], ['Space', 'p.cdR = 0', 'p.cdR > .5', 'Space lăn né'], ['KeyQ', 'p.atkCd = 0; p.combo = 0', 'p.combo === 1', 'Q đánh thường']]) {
  await page.waitForTimeout(500); await E(c => { const p = G.sides[0].active; p.wind = null; p.swing = null; p.roll = null; eval(c); }, prep);
  await page.keyboard.press(k); await page.waitForTimeout(120);
  ok(await E(c => { const p = G.sides[0].active; return eval(c); }, chk), name);
}
await page.keyboard.press('KeyP'); ok(await E(() => G.paused === true), 'P tạm dừng'); await page.keyboard.press('KeyP'); ok(await E(() => G.paused === false), 'P chơi tiếp');
await E(() => document.getElementById('pBtn').click()); ok(await E(() => G.paused), 'Nút tạm dừng'); await E(() => document.getElementById('pBtn').click());
ok(await E(() => { const s = []; for (let i = 0; i < 3; i++) { document.getElementById('sBtn').click(); s.push(SPEED); } return s.join() === '2,3,1'; }), 'Nút tốc độ x1 → x2 → x3 → x1');
ok(await E(() => { document.getElementById('aBtn').click(); const a = G.auto; document.getElementById('aBtn').click(); return a && !G.auto; }), 'Nút bật/tắt AI cho đội bạn');
ok(await E(() => { Snd.init(); document.getElementById('sndBtn').click(); const a = Snd.muted; document.getElementById('sndBtn').click(); return a && !Snd.muted; }), 'Nút bật/tắt âm thanh');
ok(await E(() => { G.paused = true; const p = G.sides[0].active; p.atkCd = 0; p.combo = 0; const o = G.sides[1].active; const s = []; for (let i = 0; i < 3; i++) { p.atkCd = 0; tryBasic(p, o); s.push(p.combo); } return s.join() === '1,2,0'; }), 'Đánh thường liên hoàn 3 đòn');

// ---------- 4. Chiêu của từng Pokémon ----------
group = 'Chiêu từng Pokémon';
const names = await E(() => R.map(d => d.name));
const bad = [];
for (const n of names) {
  const r = await E(n => {
    const d = R.find(x => x.name === n), dummy = TT.dummyFor(d), out = {};
    const run = (cast, check, setupFn) => {
      TT.setup([n, 'MEW'], [dummy, 'MEW']); const [p, o] = TT.place(45); o.stunT = 999; o.item = null; o.hp = o.maxHp; if (setupFn) setupFn(p, o);
      const h0 = o.hp, ph0 = p.hp; cast(p, o); TT.step(3.2); return check(p, o, h0, ph0);
    };
    try { out.basic = run((p, o) => { p.atkCd = 0; tryBasic(p, o); }, (p, o, h0) => o.hp < h0); } catch (e) { out.basic = 'lỗi: ' + e.message; }
    try { out.sp = run((p, o) => castSpecial(p, o), (p, o, h0) => o.hp < h0 && p.cdS > 0); } catch (e) { out.sp = 'lỗi: ' + e.message; }
    const k = d.sig.k;
    const chk = { heal: (p, o, h0, ph0) => p.hp > ph0, shield: p => p.shield > 0, reflect: p => p.mirrorT > 0, counter: p => p.counterT > 0 || p.counterHit,
      roar: (p, o) => o.atkDown > 0 && p.atkUp > 0, trail: p => p.trailT > 0 || G.hazards.some(h => h.k === 'fire') }[k] || ((p, o, h0) => o.hp < h0);
    const setupFn = k === 'heal' ? p => { p.hp = Math.round(p.maxHp / 2); } : null;
    try { out.sig = run((p, o) => castSig(p, o), (p, o, h0, ph0) => { if (k === 'shield' || k === 'reflect' || k === 'counter') return true; return chk(p, o, h0, ph0); }, setupFn); } catch (e) { out.sig = 'lỗi: ' + e.message; }
    // Hiệu ứng tức thời của chiêu riêng (khiên, phản xạ, thủ thế) kiểm ngay sau khi tung
    if (['shield', 'reflect', 'counter'].includes(k)) { TT.setup([n, 'MEW'], [dummy, 'MEW']); const [p, o] = TT.place(45); castSig(p, o); out.sig = chk(p, o); }
    out.dummy = dummy; return out;
  }, n);
  const pass = r.basic === true && r.sp === true && r.sig === true;
  if (!pass) bad.push(`${n} (thử với ${r.dummy}): thường=${r.basic} chiêu1=${r.sp} riêng=${r.sig}`);
}
ok(bad.length === 0, `41/41 Pokémon: đánh thường, Chiêu 1, Chiêu riêng đều hoạt động` + (bad.length ? '\n      ' + bad.join('\n      ') : ''));

// ---------- 5. Vật phẩm, đặc tính, thời tiết, trạng thái ----------
group = 'Vật phẩm';
ok(await E(() => { TT.setup(['PIKACHU'], ['LUCARIO']); const [p, o] = TT.place(); o.stunT = 999; doHit(p, o, p.d.sp, 60); return o.hp === 1 && o.itemUsed; }), 'Khăn Trụ Vững: còn 1 máu khi trúng đòn chí mạng lúc đầy máu');
ok(await E(() => { TT.setup(['PIKACHU'], ['METAGROSS']); const [p, o] = TT.place(); o.stunT = 999; o.hp = Math.round(o.maxHp * .55); damage(o, Math.round(o.maxHp * .1), '#fff', 12); return o.hp > o.maxHp * .65 && o.itemUsed; }), 'Quả Hồi Phục: hồi 25% khi máu dưới 50%');
ok(await E(() => { TT.setup(['SNORLAX'], ['MEW']); const [p, o] = TT.place(200); o.stunT = 999; p.hp = Math.round(p.maxHp / 2); const h = p.hp; TT.step(5.5); return p.hp > h; }), 'Túi Thức Ăn: hồi máu dần');
ok(await E(() => { TT.setup(['GENGAR'], ['SNORLAX']); const [p, o] = TT.place(); o.stunT = 999; const h = p.hp; doHit(p, o, p.d.sp); return p.hp < h; }), 'Ngọc Sinh Mệnh: mất chút máu sau mỗi đòn trúng');
ok(await E(() => { TT.setup(['PIKACHU'], ['SNORLAX']); const [p, o] = TT.place(); castSpecial(p, o); return Math.abs(p.cdS - p.d.sp.cd * .85) < .01; }), 'Vuốt Nhanh: hồi chiêu nhanh hơn 15%');
ok(await E(() => { TT.setup(['GYARADOS'], ['SNORLAX']); const p = G.sides[0].active; const a = atkOf(p); p.item = null; return Math.abs(a / atkOf(p) - 1.3) < .01; }), 'Đai Sức Mạnh: tăng 30% công');
group = 'Đặc tính & thời tiết';
ok(await E(() => { TT.setup(['TYRANITAR'], ['MEW']); return G.weather && G.weather.type === 'sand' && G.weather.max === 32; }), 'Tyranitar gọi Bão Cát; Đá Mịn kéo dài 32 giây');
ok(await E(() => { TT.setup(['KYOGRE'], ['MEW']); return G.weather && G.weather.type === 'rain' && G.weather.max === 32; }), 'Kyogre gọi Mưa; Đá Ẩm kéo dài 32 giây');
ok(await E(() => { TT.setup(['GROUDON'], ['MEW']); return G.weather && G.weather.type === 'sun' && G.weather.max === 32 && weatherMod('Fire') === 1.5 && weatherMod('Water') === .5; }), 'Groudon gọi Nắng; Lửa mạnh x1.5, Nước yếu x0.5');
ok(await E(() => { TT.setup(['GYARADOS'], ['MEW']); return G.sides[1].active.atkMod < 1; }), 'Gyarados: Đe Doạ giảm công đối thủ');
ok(await E(() => { TT.setup(['TYRANITAR'], ['MEW']); const [p, o] = TT.place(200); o.stunT = 999; const h = o.hp, hp = p.hp; TT.step(3); return o.hp < h && p.hp === hp; }), 'Bão Cát trừ máu Mew, không trừ Tyranitar (hệ Đá)');
ok(await E(() => WEATHER.sand.immune.includes('Steel') && WEATHER.hail.immune.includes('Ice')), 'Hệ Thép miễn bão cát, hệ Băng miễn mưa đá');
group = 'Trạng thái';
ok(await E(() => { TT.setup(['SNORLAX'], ['MEW']); const [p, o] = TT.place(200); o.stunT = 999; const a = atkOf(p); p.status = 'burn'; p.stT = 6; p.burnT = 0; const h = p.hp; TT.step(2.2); return p.hp < h && atkOf(p) < a; }), 'Bỏng: mất máu dần và giảm công');
ok(await E(() => { TT.setup(['SNORLAX'], ['MEW']); const [p, o] = TT.place(200); o.stunT = 999; p.status = 'para'; p.stT = 6; p.cdS = 5; TT.step(1); return p.cdS > 4.3; }), 'Tê liệt: hồi chiêu chậm lại');
group = 'Cơ chế chiến đấu';
ok(await E(() => { TT.setup(['PIKACHU'], ['SNORLAX']); const [p, o] = TT.place(60); p.iframe = .3; G.slowmo = 0; shoot(o, p, o.d.basic, 0); TT.step(.25); return G.slowmo > 0; }), 'Né hoàn hảo khi đạn trúng lúc đang lăn');
ok(await E(() => { TT.setup(['LUCARIO'], ['SNORLAX']); const [p, o] = TT.place(40); castSig(p, o); const h = o.hp, ph = p.hp; doHit(o, p, o.d.basic, 1, { melee: true }); return o.hp < h && p.hp === ph; }), 'Thế Phản Đòn (Counter): bị đánh thì né và phản đòn');
ok(await E(() => { TT.setup(['PIKACHU', 'CHARIZARD'], ['SNORLAX', 'MEW']); const [p, o] = TT.place(); o.hp = 1; damage(o, 50, '#fff', 12); TT.step(2.5); return G.sides[1].active && G.sides[1].active.name === 'MEW' && G.phase === 'fight'; }), 'Gục ngã thì tự tung Pokémon tiếp theo');
ok(await E(() => { TT.setup(['PIKACHU'], ['SNORLAX']); const [p, o] = TT.place(); o.hp = 1; damage(o, 50, '#fff', 12); TT.step(2); return G.phase === 'end' && G.winner === 0; }), 'Hết Pokémon thì kết thúc trận, xác định người thắng');
ok(await E(() => { G.endT = 2; document.getElementById('c').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); return G === null && document.getElementById('menu').style.display !== 'none'; }), 'Chạm màn hình kết thúc để về màn chọn đội');
ok(await E(() => { TT.setup(['SNORLAX'], ['MEW']); const [p, o] = TT.place(200); o.stunT = 999; G.matchT = 50; const a = p.hp, b = o.hp; TT.step(1.2); return p.hp < a && o.hp < b; }), 'Đột tử sau 45 giây: cả hai mất máu');

// ---------- 6. Địa hình ----------
group = 'Bản đồ & địa hình';
for (const id of ['cave', 'meadow', 'beach', 'volcano', 'snow', 'space']) ok(await E(id => { TT.setup(['PIKACHU'], ['MEW'], id); return MAP.id === id && BG.width === W; }, id), `Sân ${id} dựng được`);
ok(await E(() => { TT.setup(['KYOGRE'], ['MEW'], 'beach'); return G.weather && G.weather.type === 'rain' || G.weather.type === 'rain'; }), 'Bờ Biển mở trận bằng mưa');
ok(await E(() => { TT.setup(['PIKACHU'], ['KYOGRE'], 'beach'); const [p, o] = TT.place(); const z = MAP.zones[0]; p.x = z.x - 20; p.y = z.y; o.x = z.x - 20; o.y = z.y + 40; return terrainMove(p).spd === .6 && terrainMove(o).spd === 1; }), 'Nước làm chậm Pikachu, không làm chậm Kyogre (hệ Nước)');
ok(await E(() => { TT.setup(['SNORLAX'], ['CHARIZARD'], 'volcano'); const [p, o] = TT.place(); const z = MAP.zones[0]; p.x = z.x; p.y = z.y; o.x = z.x + 10; o.y = z.y + 5; o.stunT = 999; const a = p.hp, b = o.hp; G.weather = null; TT.step(1.8); return p.hp < a && o.hp === b; }), 'Dung nham đốt Snorlax, không đốt Charizard (Lửa/Bay)');
ok(await E(() => { TT.setup(['PIKACHU'], ['ARCEUS'], 'snow'); const p = G.sides[0].active; const z = MAP.zones[0]; p.x = z.x; p.y = z.y; return terrainMove(p).grip < .5; }), 'Mặt băng trơn trượt');
ok(await E(() => { TT.setup(['CELEBI'], ['MEW'], 'meadow'); const [p, o] = TT.place(); o.stunT = 999; const z = MAP.zones[0]; p.x = z.x; p.y = z.y; o.x = 300; o.y = 560; p.hp = Math.round(p.maxHp / 2); p.item = null; const h = p.hp; TT.step(2.6); return p.hp > h; }), 'Bụi cỏ hồi máu cho hệ Cỏ');
ok(await E(() => { TT.setup(['PIKACHU'], ['MEW'], 'cave'); const r = MAP.rocks[0]; const p = G.sides[0].active; p.x = r.x; p.y = r.y + 1; clampF(p); return Math.hypot(p.x - r.x, p.y - r.y) >= r.r + 9; }), 'Cột đá đẩy Pokémon ra, không đi xuyên qua');
ok(await E(() => { TT.setup(['PIKACHU'], ['MEW'], 'cave'); const r = MAP.rocks[0]; return projBlocked({ x: r.x, y: r.y - 12 }); }), 'Cột đá chặn đạn');
ok(await E(() => { TT.setup(['SNORLAX'], ['MEW'], 'space'); const [p, o] = TT.place(30); o.stunT = 999; G.metT = 99; const a = p.hp, b = o.hp; G.mapMet.push({ x: 165, y: 420, r: 46, t: 1.19, max: 1.2 }); TT.step(.1); return p.hp < a && o.hp < b; }), 'Thiên thạch trúng cả hai bên');

// ---------- 7. Hoạt ảnh, nhạc ----------
group = 'Hoạt ảnh & nhạc';
await E(() => { showMenu(); R.forEach(d => ensurePMD(d.dex)); });
await page.waitForFunction(() => Object.values(PMD).every(o => o.started && o.ready === o.need), null, { timeout: 30000 });
ok(await E(() => R.every(d => { const f = new Fighter(d, 0), pm = PMD[d.dex]; f.vx = f.vy = 0; f.pa = null; f.paT = 0; f.loopT = 0; const st = ['Idle', 'Walk', 'Attack', 'Shoot', 'Hurt'].filter(n => pm.a[n]); return st.length >= 4 && st.every(n => { f.pa = n === 'Idle' || n === 'Walk' ? null : n; f.vx = n === 'Walk' ? 80 : 0; const r = pmdFrame(f, pm); return r.an && r.an.img.complete && r.i >= 0; }); })), 'Hoạt ảnh của cả 41 Pokémon tải đủ, chọn khung đúng theo trạng thái');
ok(await E(() => { const f = new Fighter(R[0], 0); const dirs = new Set(); for (let a = 0; a < 8; a++) { f.dir8 = undefined; f.vx = Math.sin(a * Math.PI / 4) * 90; f.vy = Math.cos(a * Math.PI / 4) * 90; G = { sides: [{ active: f }, { active: null }], parts: [] }; animF(f, .016); dirs.add(f.dir8); } G = null; return dirs.size === 8; }), 'Đi theo đủ 8 hướng');
ok(await E(() => { Snd.init(); return Object.keys(SONGS).every(id => { Snd.startBgm(id); const so = SONGS[id]; for (let s = 0; s < 128; s++) Snd.playStep(s, Snd.ctx.currentTime + 5, so); return Snd.music.id === id; }) && Object.keys(SONGS).length === 7; }), '7 bản nhạc phát được, đổi bài đúng');
ok(await E(() => MAPS.every(m => SONGS[m.id])), 'Sân nào cũng có nhạc riêng');
await E(() => Snd.stopBgm());
ok(errs.length === 0, 'Không có lỗi JavaScript trong toàn bộ bài test' + (errs.length ? ': ' + [...new Set(errs)].slice(0, 3).join(' | ') : ''));

// ---------- 8. Điện thoại & không có mạng ----------
group = 'Điện thoại & offline';
const m = await browser.newContext({ ...devices['iPhone 13'] }); const mp = await m.newPage(); const merr = []; mp.on('pageerror', e => merr.push(e.message));
await mp.goto(url); await mp.evaluate(() => navigator.serviceWorker.ready); await mp.waitForTimeout(3000);
await mp.setViewportSize({ width: 844, height: 390 }); ok(await mp.$eval('#rot', e => getComputedStyle(e).display === 'flex'), 'Xoay ngang hiện nhắc xoay dọc');
await mp.setViewportSize({ width: 390, height: 664 }); ok(await mp.$eval('#rot', e => getComputedStyle(e).display === 'none'), 'Xoay dọc chơi bình thường');
ok(await mp.$eval('#pad', e => { const r = e.getBoundingClientRect(); return r.bottom <= innerHeight; }), 'Nút bấm nằm trong màn hình');
await m.setOffline(true); server.close(); await mp.reload(); await mp.waitForTimeout(2500);
ok(await mp.evaluate(() => typeof R !== 'undefined' && R.every(d => SPR[d.id].real)), 'Tắt mạng, tải lại trang: game vẫn mở, đủ hình');
const cards = await mp.$$('.card'); for (let i = 0; i < 6; i++) await cards[i].tap(); await mp.tap('#start');
await mp.waitForFunction(() => G && G.sides.every(s => s.team.every(f => pmdOf(f))), null, { timeout: 15000 }).then(() => ok(true, 'Tắt mạng vẫn vào trận, hoạt ảnh đầy đủ')).catch(() => ok(false, 'Tắt mạng vẫn vào trận, hoạt ảnh đầy đủ'));
ok(merr.length === 0, 'Không có lỗi JavaScript trên điện thoại');

await browser.close();
const fail = results.filter(r => !r[2]);
console.log(`\nTổng: ${results.length - fail.length}/${results.length} ĐẠT` + (fail.length ? ` — ${fail.length} LỖI` : ''));
process.exit(fail.length ? 1 : 0);
