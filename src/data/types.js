'use strict';
// Hệ, bảng tương khắc 18 hệ, vật phẩm, thời tiết

const TYPE_COL = { Normal: '#b8b78a', Fire: '#ee8130', Water: '#6390f0', Grass: '#7ac74c', Electric: '#f7d02c', Ice: '#96d9d6', Fighting: '#d0463a', Ground: '#e2bf65', Flying: '#a98ff3', Psychic: '#f95587', Rock: '#c4ae4a', Poison: '#b54fb3', Bug: '#a6b91a', Ghost: '#8a6ab8', Dragon: '#7a4cfc', Dark: '#8a6a58', Steel: '#b7b7ce', Fairy: '#e898c2' };
const TYPE_VI = { Normal: 'THƯỜNG', Fire: 'LỬA', Water: 'NƯỚC', Grass: 'CỎ', Electric: 'ĐIỆN', Ice: 'BĂNG', Fighting: 'GIÁC ĐẤU', Ground: 'ĐẤT', Flying: 'BAY', Psychic: 'TÂM LINH', Rock: 'ĐÁ', Poison: 'ĐỘC', Bug: 'BỌ', Ghost: 'MA', Dragon: 'RỒNG', Dark: 'BÓNG TỐI', Steel: 'THÉP', Fairy: 'TIÊN' };
// Màu chữ trên nhãn hệ: hệ nền tối dùng chữ trắng cho dễ đọc
const TYPE_FG = t => ['Ghost', 'Dragon', 'Dark', 'Poison', 'Fighting'].includes(t) ? '#ffffff' : '#1a1020';
// Bảng tương khắc chuẩn 18 hệ (hệ tấn công → hệ phòng thủ)
const CHART = {
  Normal: { Rock: .5, Ghost: 0, Steel: .5 },
  Fire: { Fire: .5, Water: .5, Grass: 2, Ice: 2, Bug: 2, Rock: .5, Dragon: .5, Steel: 2 },
  Water: { Fire: 2, Water: .5, Grass: .5, Ground: 2, Rock: 2, Dragon: .5 },
  Electric: { Water: 2, Electric: .5, Grass: .5, Ground: 0, Flying: 2, Dragon: .5 },
  Grass: { Fire: .5, Water: 2, Grass: .5, Poison: .5, Ground: 2, Flying: .5, Bug: .5, Rock: 2, Dragon: .5, Steel: .5 },
  Ice: { Fire: .5, Water: .5, Grass: 2, Ice: .5, Ground: 2, Flying: 2, Dragon: 2, Steel: .5 },
  Fighting: { Normal: 2, Ice: 2, Poison: .5, Flying: .5, Psychic: .5, Bug: .5, Rock: 2, Ghost: 0, Dark: 2, Steel: 2, Fairy: .5 },
  Poison: { Grass: 2, Poison: .5, Ground: .5, Rock: .5, Ghost: .5, Steel: 0, Fairy: 2 },
  Ground: { Fire: 2, Electric: 2, Grass: .5, Poison: 2, Flying: 0, Bug: .5, Rock: 2, Steel: 2 },
  Flying: { Electric: .5, Grass: 2, Fighting: 2, Bug: 2, Rock: .5, Steel: .5 },
  Psychic: { Fighting: 2, Poison: 2, Psychic: .5, Dark: 0, Steel: .5 },
  Bug: { Fire: .5, Grass: 2, Fighting: .5, Poison: .5, Flying: .5, Psychic: 2, Ghost: .5, Dark: 2, Steel: .5, Fairy: .5 },
  Rock: { Fire: 2, Ice: 2, Fighting: .5, Ground: .5, Flying: 2, Bug: 2, Steel: .5 },
  Ghost: { Normal: 0, Psychic: 2, Ghost: 2, Dark: .5 },
  Dragon: { Dragon: 2, Steel: .5, Fairy: 0 },
  Dark: { Fighting: .5, Psychic: 2, Ghost: 2, Dark: .5, Fairy: .5 },
  Steel: { Fire: .5, Water: .5, Electric: .5, Ice: 2, Rock: 2, Steel: .5, Fairy: 2 },
  Fairy: { Fire: .5, Fighting: 2, Poison: .5, Dragon: 2, Dark: 2, Steel: .5 }
};
const eff = (t, dt) => dt.reduce((m, d) => m * (CHART[t] && CHART[t][d] !== undefined ? CHART[t][d] : 1), 1);
const ITEMS = { smooth: 'ĐÁ MỊN', damp: 'ĐÁ ẨM', heat: 'ĐÁ NÓNG', icy: 'ĐÁ BĂNG', lefto: 'TÚI THỨC ĂN', band: 'ĐAI SỨC MẠNH', orb: 'NGỌC SINH MỆNH', sash: 'KHĂN TRỤ VỮNG', sitrus: 'QUẢ HỒI PHỤC', claw: 'VUỐT NHANH' };
const WEATHER = { sand: { n: 'BÃO CÁT', item: 'smooth', immune: ['Ground', 'Rock', 'Steel'], col: '#f0c868' }, rain: { n: 'MƯA LỚN', item: 'damp', col: '#7fb0ff' }, sun: { n: 'NẮNG GẮT', item: 'heat', col: '#ffb030' }, hail: { n: 'MƯA ĐÁ', item: 'icy', immune: ['Ice'], col: '#d8f8ff' } };
