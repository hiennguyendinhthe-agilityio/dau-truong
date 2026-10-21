# Đấu Trường Pixel

Game đấu Pokémon thời gian thực, chơi trên trình duyệt (máy tính và điện thoại).
Link chơi: https://hiennguyendinhthe-agilityio.github.io/dau-truong/

> Dự án cá nhân, phi thương mại. Pokémon và tên Pokémon thuộc Nintendo / Game Freak / The Pokémon Company.
> Ảnh chân dung: [PokeAPI sprites](https://github.com/PokeAPI/sprites). Hoạt ảnh trên sân:
> [PMD SpriteCollab](https://github.com/PMDCollab/SpriteCollab) (CC BY-NC 4.0). Font: Press Start 2P, VT323 (OFL).

## Cấu trúc thư mục

```
index.html              Trang chính: khung giao diện + nạp các file code theo thứ tự
sw.js                   Lưu game vào máy để chơi không cần mạng (FILE TỰ SINH, không sửa tay)
apple-touch-icon.png    Biểu tượng khi "Thêm vào MH chính" trên iPhone
src/
  core/      config.js (kích thước, canvas, font), utils.js (hàm màu)
  data/      types.js (18 hệ, tương khắc, vật phẩm, thời tiết), maps.js (6 sân đấu),
             music.js (7 bản nhạc: menu + mỗi sân một bài, id bài = id sân)
             pokedex.js (Pokédex: số liệu PokeAPI + mô tả các bản game, dịch tiếng Việt)
             pokemon.js (danh sách Pokémon, chỉ số, chiêu)
             pmd-anim.js (thông số hoạt ảnh)
  audio/     sound.js (hiệu ứng âm thanh, nhạc nền)
  render/    sprites.js (hình tạm), sprite-loader.js (tải hình thật),
             arena.js (nền sân), draw.js (vẽ mọi thứ trên màn hình)
  battle/    state.js (trận đấu, Fighter), terrain.js (địa hình sân), effects.js, combat.js (sát thương, chiêu),
             ai.js (AI + phím), update.js (cập nhật mỗi khung hình)
  ui/        controls.js (nút, cảm ứng, bàn phím), menu.js (màn chọn đội), netui.js (giao diện PvP), pokedex.js (màn hình Pokédex)
  net/       net.js (PvP online: ghép trận, phòng mã/QR, đồng bộ trận qua Supabase Realtime)
  styles/    main.css, fonts.css
  main.js    Vòng lặp game (nạp cuối cùng)
assets/
  fonts/                  Font
  vendor/                 Thư viện: supabase-js 2.118.0 (MIT), qrcode-generator 1.4.4 (MIT)
  pokemon/<số Pokédex>/   portrait.png (menu) + Idle/Walk/Attack/Shoot/Hurt.png (hoạt ảnh 8 hướng)
tools/gen-sw.mjs          Tạo lại sw.js
tests/smoke.mjs           Kiểm thử tự động
```

Các file trong `src/` là JavaScript thường (không cần build), chia sẻ biến chung theo thứ tự nạp trong `index.html`.
Thêm file mới thì phải thêm thẻ `<script>` đúng chỗ: file dùng biến của file khác phải nạp sau file đó.

## Thêm một Pokémon

1. Thêm 1 dòng `P(...)` vào `src/data/pokemon.js` (xem các dòng có sẵn để biết thứ tự tham số).
2. Tạo thư mục `assets/pokemon/<số Pokédex>/` gồm `portrait.png` và các file hoạt ảnh PMD.
3. Thêm thông số hoạt ảnh vào `src/data/pmd-anim.js`.
3b. Thêm mục Pokédex vào `src/data/pokedex.js` (số liệu lấy từ pokeapi.co, mô tả dịch từ mục flavor text).
4. Chạy `npm test`.

## Chạy và kiểm thử trên máy

```
npm install          # lần đầu
npm start            # mở http://localhost:5173
npm test             # kiểm thử nhanh: chọn đội, cảm ứng, nhạc, 1 trận AI mỗi sân
npm run test:all     # 75 chức năng + kiểm thử nhanh + PvP thật qua Supabase (cần mạng)
npm run test:pvp     # chỉ PvP: 2 trình duyệt ghép trận và đánh nhau thật
```

Chỉ đẩy lên GitHub khi `npm test` báo "Tất cả đều ĐẠT". GitHub Pages tự cập nhật link sau 1–2 phút.

## Thêm một sân đấu

Thêm một mục vào `MAPS` trong `src/data/maps.js`: màu nền, kiểu trang trí, vùng địa hình (water / lava / grass / ice),
chướng ngại (rocks) và thời tiết mở trận. Đặt vùng và chướng ngại tránh 2 điểm ra sân (180, 228) và (180, 515).
Chạy `npm test`: kiểm thử tự cho AI đánh một trận trên mỗi sân.

## PvP online

- Dịch vụ: Supabase Realtime (dự án `zvsocohjsojvfijwkwfy`, gói miễn phí). Key trong `src/net/net.js` là key công khai
  (publishable), được phép nằm trong code. Không bao giờ đưa key `service_role` / `sb_secret_` vào code.
- Máy chủ phòng (host) tính trận và gửi ảnh chụp trạng thái 15 lần/giây; máy khách gửi thao tác. Người vào phòng
  điều khiển đội phía trên sân.
- Giới hạn gói miễn phí: khoảng 100 tin nhắn/giây cho cả dự án, mỗi trận dùng khoảng 30 tin/giây
  → khoảng 3 trận cùng lúc. Bước 2 (nối thẳng 2 máy) sẽ bỏ giới hạn này.
