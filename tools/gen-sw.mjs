// Tạo lại sw.js với danh sách đầy đủ file cần lưu để chơi không cần mạng.
// Chạy sau khi thêm/xoá file trong src/ hoặc assets/:  node tools/gen-sw.mjs
import { readdirSync, statSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { createHash } from 'node:crypto';
const root = new URL('..', import.meta.url).pathname;
const walk = d => readdirSync(d).flatMap(f => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p) : [p]; });
// (version.js được ghi lại sau khi băm; nội dung đổi theo bản nên không đưa vào phép băm)
const files = ['index.html', 'apple-touch-icon.png', ...walk(join(root, 'src')), ...walk(join(root, 'assets'))]
  .map(f => relative(root, f.startsWith('/') ? f : join(root, f))).sort();
// Phiên bản bộ nhớ đệm đổi theo nội dung file -> điện thoại tự nhận bản mới
const hash = createHash('sha1'); files.filter(f => f !== 'src/core/version.js').forEach(f => hash.update(f).update(readFileSync(join(root, f))));
const ver = hash.digest('hex').slice(0, 10);
// Ghi phiên bản cho trang hiển thị (để người chơi biết đang chạy bản nào)
const now = new Date(Date.now() + 7 * 3600e3).toISOString();
writeFileSync(join(root, 'src/core/version.js'), `'use strict';\n// FILE TỰ SINH bởi tools/gen-sw.mjs — không sửa tay.\nconst APP_VERSION = '${now.slice(8, 10)}/${now.slice(5, 7)} ${now.slice(11, 16)} · ${ver.slice(0, 6)}';\n`);
writeFileSync(join(root, 'sw.js'), `// FILE TỰ SINH bởi tools/gen-sw.mjs — không sửa tay.
// Lưu toàn bộ game vào máy ở lần mở đầu tiên để lần sau chơi được cả khi không có mạng.
const CACHE = 'dau-truong-${ver}';
const FILES = ${JSON.stringify(files, null, 1)};
self.addEventListener('install', e => e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting())));
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())));
// Có mạng: lấy bản mới nhất. Mất mạng: dùng bản đã lưu.
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(caches.open(CACHE).then(c => c.match(e.request, { ignoreSearch: true }).then(hit =>
    hit && e.request.url.includes('/assets/') ? hit :
      // no-cache: luôn hỏi lại GitHub Pages xem file có đổi không (bỏ qua bộ nhớ đệm 10 phút của trình duyệt)
      fetch(e.request, { cache: 'no-cache' }).then(res => { if (res.ok) c.put(e.request, res.clone()); return res; }).catch(() => hit || c.match('index.html')))));
});
`);
console.log(`sw.js: ${files.length} file, phiên bản ${ver}`);
