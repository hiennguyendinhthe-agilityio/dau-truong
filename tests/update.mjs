// Kiểm thử tự cập nhật: máy đã mở bản cũ (có lưu offline) phải nhận bản mới khi mở lại app,
// kể cả khi máy chủ bảo trình duyệt giữ file 10 phút như GitHub Pages. Chạy: node tests/update.mjs
import { createServer } from 'node:http';
import { readFile, cp, writeFile, mkdtemp, rm } from 'node:fs/promises';
import { join, extname } from 'node:path'; import { tmpdir } from 'node:os'; import { execFileSync } from 'node:child_process';
import { chromium, devices } from 'playwright';
const src = new URL('..', import.meta.url).pathname, dir = await mkdtemp(join(tmpdir(), 'dt-upd-'));
await cp(src, dir, { recursive: true, filter: p => !p.includes('node_modules') && !p.includes('.git') });
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.woff2': 'font/woff2' };
const server = createServer(async (req, res) => {
  try { const p = join(dir, decodeURIComponent(req.url.split('?')[0]).replace(/\/$/, '/index.html')); const b = await readFile(p); res.writeHead(200, { 'content-type': TYPES[extname(p)] || 'application/octet-stream', 'cache-control': 'max-age=600' }); res.end(b); }
  catch { res.writeHead(404); res.end(); }
}).listen(0);
const url = `http://127.0.0.1:${server.address().port}/`;
let fail = 0; const ok = (c, m) => { console.log((c ? 'ĐẠT  ' : 'LỖI  ') + m); if (!c) fail++; };
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined });
const ctx = await browser.newContext({ ...devices['iPhone 13'] });
let p = await ctx.newPage(); await p.goto(url); await p.evaluate(() => navigator.serviceWorker.ready); await p.waitForTimeout(2500);
const v1 = await p.textContent('#appVer'); ok(/Phiên bản/.test(v1), 'Menu hiện số phiên bản: ' + v1);
await p.reload(); await p.waitForTimeout(1000);
// Đăng bản mới: đổi tiêu đề + tạo lại sw.js
const f = join(dir, 'index.html'); await writeFile(f, (await readFile(f, 'utf8')).replace('Chọn 6 Pokémon cho đội của bạn', 'BẢN MỚI ĐÃ VỀ'));
await new Promise(r => setTimeout(r, 1100)); execFileSync('node', [join(dir, 'tools/gen-sw.mjs')]);
// "Tắt app rồi mở lại": đóng trang, mở trang mới
await p.close(); p = await ctx.newPage(); await p.goto(url);
await p.waitForFunction(() => document.body.textContent.includes('BẢN MỚI ĐÃ VỀ'), null, { timeout: 15000 }).catch(() => { });
ok(await p.evaluate(() => document.body.textContent.includes('BẢN MỚI ĐÃ VỀ')), 'Mở lại app sau khi đăng bản mới: thấy ngay bản mới (dù máy chủ đặt giữ file 10 phút)');
const v2 = await p.textContent('#appVer'); ok(v2 !== v1, `Số phiên bản đổi: ${v1} → ${v2}`);
await ctx.setOffline(true); await p.reload(); await p.waitForTimeout(1500);
ok(await p.evaluate(() => document.body.textContent.includes('BẢN MỚI ĐÃ VỀ') && typeof R !== 'undefined'), 'Tắt mạng sau khi cập nhật: vẫn mở được bản mới');
await browser.close(); server.close(); await rm(dir, { recursive: true, force: true });
console.log(fail ? `\n${fail} mục LỖI.` : '\nTất cả đều ĐẠT.'); process.exit(fail ? 1 : 0);
