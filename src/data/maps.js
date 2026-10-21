'use strict';
// Bản đồ sân đấu. Vùng (zones) là hình elip: x, y = tâm; rx, ry = bán kính.
// Loại vùng: water (chậm, trừ hệ Nước/Bay), lava (bỏng, trừ hệ Lửa/Bay), grass (hệ Cỏ hồi máu), ice (trơn, trừ hệ Băng/Bay).
// Chướng ngại (rocks): chặn đường đi và chặn đạn. weather: thời tiết lúc mở trận (25 giây).

const MAPS = [
  {
    id: 'cave', n: 'HANG ĐÁ', desc: 'Cột đá chắn đường và chặn đạn. Núp sau đá để tránh đòn tầm xa.',
    ground: [98, 93, 106], noise: 7, deco: 'cracks', edge: 'water', rockCol: '#7a7488',
    zones: [], rocks: [{ x: 85, y: 340, r: 18 }, { x: 278, y: 300, r: 20 }, { x: 205, y: 445, r: 15 }]
  },
  {
    id: 'meadow', n: 'ĐỒNG CỎ', desc: 'Bụi cỏ hồi máu cho hệ Cỏ. Ao nước làm chậm. Cây chắn đường.',
    ground: [92, 150, 72], noise: 9, deco: 'flowers', edge: 'hedge', rockCol: 'tree',
    zones: [{ k: 'grass', x: 80, y: 255, rx: 62, ry: 34 }, { k: 'grass', x: 285, y: 480, rx: 62, ry: 36 }, { k: 'water', x: 105, y: 478, rx: 52, ry: 30 }],
    rocks: [{ x: 300, y: 320, r: 16 }, { x: 175, y: 370, r: 14 }]
  },
  {
    id: 'beach', n: 'BỜ BIỂN', desc: 'Nước nông bên phải làm chậm (trừ hệ Nước/Bay). Mở trận bằng mưa lớn.',
    ground: [214, 192, 142], noise: 8, deco: 'shells', edge: 'water', rockCol: '#8a7a68', weather: 'rain',
    zones: [{ k: 'water', x: 345, y: 380, rx: 105, ry: 230 }, { k: 'water', x: 70, y: 560, rx: 70, ry: 26 }],
    rocks: [{ x: 95, y: 310, r: 16 }, { x: 150, y: 470, r: 13 }]
  },
  {
    id: 'volcano', n: 'NÚI LỬA', desc: 'Dung nham gây sát thương và bỏng (trừ hệ Lửa/Bay). Mở trận bằng nắng gắt.',
    ground: [72, 54, 52], noise: 8, deco: 'embers', edge: 'lava', rockCol: '#4a3a38', weather: 'sun',
    zones: [{ k: 'lava', x: 85, y: 330, rx: 46, ry: 26 }, { k: 'lava', x: 272, y: 452, rx: 50, ry: 28 }, { k: 'lava', x: 258, y: 255, rx: 36, ry: 20 }],
    rocks: [{ x: 62, y: 480, r: 16 }, { x: 300, y: 340, r: 17 }]
  },
  {
    id: 'snow', n: 'ĐỒNG TUYẾT', desc: 'Mặt băng trơn trượt, khó dừng lại (trừ hệ Băng/Bay). Mở trận bằng mưa đá.',
    ground: [214, 224, 236], noise: 6, deco: 'sparkle', edge: 'ice', rockCol: '#9aa8ba', weather: 'hail',
    zones: [{ k: 'ice', x: 180, y: 372, rx: 110, ry: 58 }, { k: 'ice', x: 80, y: 222, rx: 52, ry: 26 }, { k: 'ice', x: 290, y: 545, rx: 55, ry: 28 }],
    rocks: [{ x: 68, y: 452, r: 15 }, { x: 292, y: 252, r: 16 }]
  },
  {
    id: 'space', n: 'VŨ TRỤ', desc: 'Thiên thạch rơi ngẫu nhiên, trúng cả hai bên. Để ý vùng đỏ cảnh báo.',
    ground: [26, 22, 46], noise: 5, deco: 'stars', edge: 'void', rockCol: '#5a5478', meteors: true,
    zones: [], rocks: [{ x: 90, y: 300, r: 14 }, { x: 275, y: 500, r: 14 }]
  }
];
