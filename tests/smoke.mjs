// Kiểm thử tự động: chạy game trong trình duyệt ảo, kiểm tra không lỗi và trận đấu kết thúc.
// Chạy: npm test   (cần: npm install)
import { createServer } from 'node:http';
import { readFile, readdir } from 'node:fs/promises';
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
const browser = await chromium.launch(launch);

// 1. Mọi Pokémon có đủ thư mục hình
const dexes = (await readdir(join(root, 'assets/pokemon'))).sort();
const src = await readFile(join(root, 'src/data/pokemon.js'), 'utf8');
const used = [...src.matchAll(/P\((\d+), '/g)].map(m => m[1]);
ok(used.every(d => dexes.includes(d)), `Hình đủ cho ${used.length} Pokémon`);
const sw = await readFile(join(root, 'sw.js'), 'utf8');
ok(used.every(d => sw.includes(`assets/pokemon/${d}/portrait.png`)), 'sw.js có đủ file (nếu LỖI: chạy node tools/gen-sw.mjs)');

// 2. Điện thoại: chọn đội, kéo di chuyển, bấm chiêu
const ctx = await browser.newContext({ ...devices['iPhone 13'] });
const page = await ctx.newPage(); const errs = []; page.on('pageerror', e => errs.push(e.message)); const bad = [];
page.on('response', r => { if (r.status() >= 400) bad.push(r.url()); });
await page.goto(url); await page.waitForFunction(() => R.every(d => SPR[d.id].real), null, { timeout: 15000 });
ok(true, 'Ảnh chân dung tải đủ');
const cards = await page.$$('.card'); for (let i = 0; i < 6; i++) await cards[i].tap();
await page.tap('#start'); await page.waitForFunction(() => G && G.sides.every(s => s.team.every(f => pmdOf(f))), null, { timeout: 15000 });
ok(true, 'Hoạt ảnh PMD tải đủ cho 12 Pokémon trong trận');
await page.waitForTimeout(3000);
const cdp = await ctx.newCDPSession(page);
const touch = (type, x, y) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y, id: 1 }] });
const pos = () => page.evaluate(() => { const f = G.sides[0].active; return f ? f.x : 0; });
const x0 = await pos(); await touch('touchStart', 150, 450); for (let i = 1; i <= 8; i++) { await touch('touchMove', 150 + i * 4, 450); await page.waitForTimeout(40); } await page.waitForTimeout(500); await touch('touchEnd');
ok(Math.abs((await pos()) - x0) > 30, 'Kéo tay làm Pokémon di chuyển');
await page.waitForFunction(() => G.sides[0].active && G.sides[0].active.cdS <= 0, null, { timeout: 8000 }).catch(() => { });
const b = await page.$eval('#bSk1', e => { const r = e.getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; });
await touch('touchStart', b[0], b[1]); await page.waitForTimeout(80); await touch('touchEnd'); await page.waitForTimeout(150);
ok(await page.evaluate(() => G.sides[0].active.cdS > 1), 'Nút CHIÊU ra chiêu');
ok(await page.evaluate(() => Snd.music.on && Snd.music.id === MAP.id), 'Nhạc nền đúng bài của sân đấu');
await page.evaluate(() => showMenu()); await page.waitForTimeout(1800); await page.tap('#rand');
ok(await page.evaluate(() => Snd.music.on && Snd.music.id === 'menu'), 'Về màn chọn đội thì chuyển sang nhạc menu');

// 3. AI tự đánh nhiều trận, trận nào cũng phải kết thúc
// Mỗi sân đấu một trận
const maps = await page.evaluate(() => MAPS.map(m => m.id));
for (const id of maps) {
  await page.evaluate(id => { showMenu(); setMap(MAPS.find(m => m.id === id)); SPEED = 3; const s = [...R].sort(() => Math.random() - .5).slice(0, 6); newBattle(s, enemyTeam(s)); G.auto = true; document.getElementById('menu').style.display = 'none'; }, id);
  if (process.env.SHOTS) { await page.waitForTimeout(4500); await page.screenshot({ path: `${process.env.SHOTS}/map-${id}.png` }); }
  const end = await page.waitForFunction(() => G.phase === 'end', null, { timeout: 240000, polling: 1000 }).then(() => true).catch(() => false);
  const stuck = await page.evaluate(() => G.sides.flatMap(s => s.team).some(f => MAP.rocks.some(r => Math.hypot(f.x - r.x, f.y - r.y) < r.r + 9)));
  ok(end && !stuck, `Sân ${id}: trận AI kết thúc (${await page.evaluate(() => Math.round(G.time))}s), không Pokémon nào kẹt trong chướng ngại`);
}
ok(errs.length === 0, 'Không có lỗi JavaScript' + (errs.length ? ': ' + errs.slice(0, 3).join(' | ') : ''));
ok(bad.length === 0, 'Không có file bị thiếu' + (bad.length ? ': ' + bad.slice(0, 3).join(' | ') : ''));
await browser.close(); server.close();
console.log(fail ? `\n${fail} mục LỖI — không đẩy lên GitHub.` : '\nTất cả đều ĐẠT.');
process.exit(fail ? 1 : 0);
