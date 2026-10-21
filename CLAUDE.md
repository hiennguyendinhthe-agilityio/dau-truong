# Hướng dẫn cho AI làm việc trên dự án này

- Đọc README.md để nắm cấu trúc. Không gộp code lại thành một file.
- Code trong `src/` là script thường chia sẻ biến toàn cục theo thứ tự `<script>` trong index.html. Không đổi sang ES module nếu chưa được yêu cầu.
- Không sửa tay `sw.js` và `src/core/version.js`; chạy `node tools/gen-sw.mjs` sau khi thêm/xoá/đổi file trong `src/` hoặc `assets/`.
- Trước khi commit: chạy `npm run test:all` và chỉ commit khi tất cả ĐẠT. Thêm tính năng mới thì thêm kiểm thử vào tests/features.mjs. Báo kết quả kiểm thử thật cho người dùng.
- Người dùng nói tiếng Việt, không phải lập trình viên: giải thích ngắn, dễ hiểu.
- Không dùng nhạc/hình có bản quyền mới ngoài các nguồn ghi trong README; nhạc mới dùng nguồn CC0.
- Khi bắt đầu session: đọc mục "Trạng thái và việc tiếp theo" trong README.md. Xong một tính năng thì cập nhật mục đó.
- Bài học đã gặp (đừng lặp lại):
  - Điện thoại giữ bản cũ: sw.js phải lấy file bằng `cache: 'no-cache'` (GitHub Pages cho giữ file 10 phút). Có tests/update.mjs kiểm tra.
  - Ngoài test tự động, luôn chụp màn hình để tự xem: lỗi chữ không hiện trên splash chỉ lộ ra qua ảnh chụp.
  - Vẽ lên canvas riêng (splash, Pokédex) thì không dùng hàm `txt()` chung, vì hàm đó vẽ lên canvas game.
  - Test trong môi trường có proxy: Chromium cần `--proxy-server` + `--proxy-bypass-list=127.0.0.1;localhost` (xem tests/pvp.mjs).
