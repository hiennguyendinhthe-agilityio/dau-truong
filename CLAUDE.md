# Hướng dẫn cho AI làm việc trên dự án này

- Đọc README.md để nắm cấu trúc. Không gộp code lại thành một file.
- Code trong `src/` là script thường chia sẻ biến toàn cục theo thứ tự `<script>` trong index.html. Không đổi sang ES module nếu chưa được yêu cầu.
- Không sửa tay `sw.js`; chạy `node tools/gen-sw.mjs` sau khi thêm/xoá/đổi file trong `src/` hoặc `assets/`.
- Trước khi commit: chạy `npm test` và chỉ commit khi tất cả ĐẠT. Báo kết quả kiểm thử thật cho người dùng.
- Người dùng nói tiếng Việt, không phải lập trình viên: giải thích ngắn, dễ hiểu.
- Không dùng nhạc/hình có bản quyền mới ngoài các nguồn ghi trong README; nhạc mới dùng nguồn CC0.
