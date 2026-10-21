// Tạo lại sw.js với danh sách đầy đủ file cần lưu để chơi không cần mạng.
// Chạy sau khi thêm/xoá file trong src/ hoặc assets/:  node tools/gen-sw.mjs
import { readdirSync, statSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { createHash } from 'node:crypto';
const root = new URL('..', import.meta.url).pathname;
const walk = d => readdirSync(d).flatMap(f => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p) : [p]; });
const files = ['index.html', 'apple-touch-icon.png', ...walk(join(root, 'src')), ...walk(join(root, 'assets'))]
  .map(f => relative(root, f.startsWith('/') ? f : join(root, f))).sort();
// Phiên bản bộ nhớ đệm đổi theo nội dung file -> điện thoại tự nhận bản mới
const hash = createHash('sha1'); files.forEach(f => hash.update(f).update(readFileSync(join(root, f))));
const ver = hash.digest('hex').slice(0, 10);
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
      fetch(e.request).then(res => { if (res.ok) c.put(e.request, res.clone()); return res; }).catch(() => hit || c.match('index.html')))));
});
`);
console.log(`sw.js: ${files.length} file, phiên bản ${ver}`);
