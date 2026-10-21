'use strict';
// Danh sách Pokémon theo nhóm. Thêm Pokémon mới: thêm 1 dòng P(...) và thư mục assets/pokemon/<số dex>/

const SP_DESC = { dash: 'Lao tới húc cực mạnh', volley: 'Bắn 3 tia toả ra', beam: 'Tia xuyên thẳng (có cảnh báo)', quake: 'Đánh vùng ngay chỗ đối thủ', aoe: 'Sóng năng lượng lan quanh mình' };
// Nhóm: chỉ số gốc của nhóm cao hơn nên to hơn và mạnh hơn trên sân
const GROUPS = { common: { n: 'PHỔ THÔNG', col: '#c8c0d8', sc: 1 }, pseudo: { n: 'SỬ THI', col: '#b07aff', sc: 1.08 }, legend: { n: 'HUYỀN THOẠI', col: '#ffcf3a', sc: 1.18 }, myth: { n: 'HUYỀN BÍ', col: '#ff8ad0', sc: 1.05 }, cosmic: { n: 'VŨ TRỤ', col: '#6ae0ff', sc: 1.15 } };
const SIG_DESC = {
  roar: 'Đẩy lùi và giảm công đối thủ, tăng công bản thân 5 giây', burrow: 'Chui xuống đất, miễn mọi đòn 1.3 giây rồi trồi lên gây sát thương',
  trail: 'Chạy nhanh hơn, để lại vệt lửa thiêu đốt trong 3 giây', whirl: 'Tạo xoáy nước dưới chân đối thủ: hút vào, làm chậm, gây sát thương liên tục',
  heal: 'Hồi 30% máu (45% khi nắng), xoá trạng thái xấu', blink: 'Dịch chuyển ra sau lưng đối thủ, đánh choáng 0.7 giây',
  shield: 'Khiên chặn sát thương bằng 25% máu, làm chậm kẻ đánh cận chiến', tornado: 'Lốc xoáy xuyên thấu, thổi bay đối thủ ra xa',
  reflect: 'Trong 2.2 giây phản lại mọi viên đạn, giảm nửa sát thương nhận vào', counter: 'Thủ thế 0.9 giây: nếu bị đánh sẽ né và phản đòn cực mạnh',
  fort: 'Giảm 55% sát thương, miễn đẩy lùi và choáng trong 4.5 giây', meteor: 'Gọi 3 khối năng lượng rơi xuống quanh đối thủ',
  spikes: 'Rải bãi gai quanh mình 5 giây: làm chậm và gây sát thương', storm: '3 tia sét bám theo rồi giáng xuống đối thủ'
};
// P(số Pokédex, tên, nhóm, hệ, [HP, CÔNG, THỦ, TỐC], đánh thường, chiêu 1, chiêu riêng, vật phẩm, đặc tính)
// Chỉ số lấy từ chỉ số gốc: CÔNG = max(Atk, SpA), THỦ = trung bình (Def, SpD), giới hạn 160.
const P = (dex, name, g, types, b, ba, sp, sg, item, ab) => {
  const tc = TYPE_COL[types[0]];
  return {
    id: 'p' + dex, dex, name, g, types, b, sc: GROUPS[g].sc, shape: 'round', pal: [tc, mix(tc, .6), mix(tc, -.7)], fx: TYPE_COL[types[1] || types[0]], feat: [],
    basic: { n: ba[0], t: ba[1], p: ba[2], k: ba[3] },
    sp: Object.assign({ n: sp[0], t: sp[1], p: sp[2], k: sp[3], cd: sp[4] }, sp[5] ? { st: sp[5] } : {}),
    sig: Object.assign({ n: sg[0], t: sg[1], k: sg[2], p: sg[3], cd: sg[4], d: SIG_DESC[sg[2]] }, sg[5] ? { st: sg[5] } : {}, sg[2] === 'trail' ? { stc: .15 } : {}),
    item, ab
  };
};
const R = [
  // PHỔ THÔNG
  P(25, 'PIKACHU', 'common', ['Electric'], [35, 55, 45, 90], ['Thunder Shock', 'Electric', 40, 'shot'], ['Thunderbolt', 'Electric', 95, 'beam', 5.5, 'para'], ['Iron Tail', 'Steel', 'blink', 70, 7], 'claw'),
  P(6, 'CHARIZARD', 'common', ['Fire', 'Flying'], [78, 109, 82, 100], ['Ember', 'Fire', 40, 'shot'], ['Heat Wave', 'Fire', 48, 'volley', 5, 'burn'], ['Flare Blitz', 'Fire', 'trail', 22, 8, 'burn'], 'orb'),
  P(9, 'BLASTOISE', 'common', ['Water'], [79, 85, 103, 78], ['Water Gun', 'Water', 40, 'shot'], ['Hydro Pump', 'Water', 105, 'beam', 6], ['Whirlpool', 'Water', 'whirl', 24, 9], 'lefto'),
  P(94, 'GENGAR', 'common', ['Ghost', 'Poison'], [60, 130, 68, 110], ['Hex', 'Ghost', 42, 'shot'], ['Sludge Bomb', 'Poison', 95, 'quake', 5.5], ['Shadow Sneak', 'Ghost', 'blink', 70, 7], 'orb'),
  P(448, 'LUCARIO', 'common', ['Fighting', 'Steel'], [70, 115, 70, 90], ['Force Palm', 'Fighting', 45, 'melee'], ['Aura Sphere', 'Fighting', 100, 'beam', 6], ['Counter', 'Fighting', 'counter', 120, 7], 'sash'),
  P(130, 'GYARADOS', 'common', ['Water', 'Flying'], [95, 125, 90, 81], ['Waterfall', 'Water', 45, 'melee'], ['Aqua Tail', 'Water', 100, 'dash', 6], ['Twister', 'Dragon', 'tornado', 65, 7], 'band', 'intim'),
  P(143, 'SNORLAX', 'common', ['Normal'], [160, 110, 88, 30], ['Body Slam', 'Normal', 45, 'melee'], ['Heavy Slam', 'Steel', 100, 'dash', 6], ['Rest', 'Normal', 'heal', 0, 12], 'lefto'),
  P(282, 'GARDEVOIR', 'common', ['Psychic', 'Fairy'], [68, 125, 90, 80], ['Confusion', 'Psychic', 42, 'shot'], ['Moonblast', 'Fairy', 90, 'aoe', 5], ['Magic Coat', 'Psychic', 'reflect', 0, 9], 'lefto'),
  // SỬ THI (bán huyền thoại)
  P(149, 'DRAGONITE', 'pseudo', ['Dragon', 'Flying'], [91, 134, 98, 80], ['Dragon Claw', 'Dragon', 45, 'melee'], ['Outrage', 'Dragon', 105, 'dash', 6], ['Extreme Speed', 'Normal', 'blink', 70, 7], 'band'),
  P(248, 'TYRANITAR', 'pseudo', ['Rock', 'Dark'], [100, 134, 105, 61], ['Crunch', 'Dark', 45, 'melee'], ['Stone Edge', 'Rock', 100, 'quake', 6], ['Stealth Rock', 'Rock', 'spikes', 26, 9], 'smooth', 'sand'),
  P(373, 'SALAMENCE', 'pseudo', ['Dragon', 'Flying'], [95, 135, 80, 100], ['Dragon Breath', 'Dragon', 42, 'shot'], ['Fly', 'Flying', 100, 'dash', 5.5], ['Hurricane', 'Flying', 'tornado', 65, 7], 'orb', 'intim'),
  P(376, 'METAGROSS', 'pseudo', ['Steel', 'Psychic'], [80, 135, 110, 70], ['Meteor Mash', 'Steel', 45, 'melee'], ['Zen Headbutt', 'Psychic', 100, 'dash', 6], ['Iron Defense', 'Steel', 'fort', 60, 11], 'sitrus'),
  P(445, 'GARCHOMP', 'pseudo', ['Dragon', 'Ground'], [108, 130, 90, 102], ['Dragon Claw', 'Dragon', 45, 'melee'], ['Earthquake', 'Ground', 95, 'quake', 5.5], ['Dig', 'Ground', 'burrow', 85, 8], 'band'),
  P(635, 'HYDREIGON', 'pseudo', ['Dark', 'Dragon'], [92, 125, 90, 98], ['Dark Pulse', 'Dark', 42, 'shot'], ['Dragon Pulse', 'Dragon', 46, 'volley', 5], ['Noble Roar', 'Normal', 'roar', 0, 9], 'claw'),
  P(706, 'GOODRA', 'pseudo', ['Dragon'], [90, 110, 110, 80], ['Dragon Breath', 'Dragon', 40, 'shot'], ['Muddy Water', 'Water', 90, 'aoe', 5.5], ['Acid Armor', 'Poison', 'shield', 0, 10], 'lefto'),
  P(887, 'DRAGAPULT', 'pseudo', ['Dragon', 'Ghost'], [88, 120, 75, 142], ['Dragon Darts', 'Dragon', 40, 'shot'], ['Phantom Force', 'Ghost', 100, 'dash', 5.5], ['U-turn', 'Bug', 'blink', 70, 7], 'claw'),
  // HUYỀN THOẠI
  P(150, 'MEWTWO', 'legend', ['Psychic'], [106, 154, 90, 130], ['Shadow Ball', 'Ghost', 42, 'shot'], ['Psystrike', 'Psychic', 110, 'beam', 6], ['Barrier', 'Psychic', 'reflect', 0, 9], 'orb'),
  P(249, 'LUGIA', 'legend', ['Psychic', 'Flying'], [106, 90, 142, 110], ['Gust', 'Flying', 40, 'shot'], ['Aeroblast', 'Flying', 105, 'beam', 6], ['Whirlwind', 'Flying', 'tornado', 65, 7], 'lefto'),
  P(250, 'HO-OH', 'legend', ['Fire', 'Flying'], [106, 130, 122, 90], ['Brave Bird', 'Flying', 45, 'melee'], ['Sacred Fire', 'Fire', 48, 'volley', 5, 'burn'], ['Recover', 'Normal', 'heal', 0, 12], 'lefto'),
  P(382, 'KYOGRE', 'legend', ['Water'], [100, 150, 115, 90], ['Water Pulse', 'Water', 40, 'shot'], ['Origin Pulse', 'Water', 50, 'volley', 5], ['Whirlpool', 'Water', 'whirl', 24, 9], 'damp', 'rain'),
  P(383, 'GROUDON', 'legend', ['Ground'], [100, 150, 115, 90], ['Fire Punch', 'Fire', 45, 'melee'], ['Precipice Blades', 'Ground', 100, 'quake', 6], ['Eruption', 'Fire', 'meteor', 75, 10, 'burn'], 'heat', 'sun'),
  P(483, 'DIALGA', 'legend', ['Steel', 'Dragon'], [100, 150, 110, 90], ['Flash Cannon', 'Steel', 42, 'shot'], ['Roar of Time', 'Dragon', 110, 'beam', 6.5], ['Iron Defense', 'Steel', 'fort', 60, 11], 'sitrus'),
  P(487, 'GIRATINA', 'legend', ['Ghost', 'Dragon'], [150, 100, 120, 90], ['Dragon Claw', 'Dragon', 45, 'melee'], ['Shadow Force', 'Ghost', 105, 'dash', 6], ['Roar', 'Normal', 'roar', 0, 9], 'lefto'),
  P(644, 'ZEKROM', 'legend', ['Dragon', 'Electric'], [100, 150, 110, 90], ['Dragon Claw', 'Dragon', 45, 'melee'], ['Bolt Strike', 'Electric', 105, 'dash', 6, 'para'], ['Fusion Bolt', 'Electric', 'storm', 62, 10, 'para'], 'band'),
  P(716, 'XERNEAS', 'legend', ['Fairy'], [126, 131, 96, 99], ['Fairy Wind', 'Fairy', 40, 'shot'], ['Moonblast', 'Fairy', 100, 'beam', 6], ['Geomancy', 'Fairy', 'heal', 0, 12], 'lefto'),
  // HUYỀN BÍ (Mythical)
  P(151, 'MEW', 'myth', ['Psychic'], [100, 100, 100, 100], ['Psywave', 'Psychic', 42, 'shot'], ['Psychic', 'Psychic', 90, 'aoe', 5], ['Teleport', 'Psychic', 'blink', 70, 7], 'lefto'),
  P(251, 'CELEBI', 'myth', ['Psychic', 'Grass'], [100, 100, 100, 100], ['Magical Leaf', 'Grass', 40, 'shot'], ['Leaf Storm', 'Grass', 90, 'aoe', 5.5], ['Synthesis', 'Grass', 'heal', 0, 12], 'lefto'),
  P(385, 'JIRACHI', 'myth', ['Steel', 'Psychic'], [100, 100, 100, 100], ['Iron Head', 'Steel', 45, 'melee'], ['Zen Headbutt', 'Psychic', 100, 'dash', 6], ['Doom Desire', 'Steel', 'meteor', 75, 10], 'claw'),
  P(491, 'DARKRAI', 'myth', ['Dark'], [70, 135, 90, 125], ['Dark Pulse', 'Dark', 42, 'shot'], ['Dark Void', 'Dark', 90, 'aoe', 5, 'para'], ['Feint Attack', 'Dark', 'blink', 70, 7], 'orb'),
  P(493, 'ARCEUS', 'myth', ['Normal'], [120, 120, 120, 120], ['Hyper Voice', 'Normal', 42, 'shot'], ['Hyper Beam', 'Normal', 110, 'beam', 6.5], ['Judgment', 'Psychic', 'meteor', 75, 10], 'lefto'),
  P(649, 'GENESECT', 'myth', ['Bug', 'Steel'], [71, 120, 95, 99], ['U-turn', 'Bug', 45, 'melee'], ['Techno Blast', 'Steel', 105, 'beam', 6], ['Sticky Web', 'Bug', 'spikes', 26, 9], 'claw'),
  P(802, 'MARSHADOW', 'myth', ['Fighting', 'Ghost'], [90, 125, 85, 125], ['Drain Punch', 'Fighting', 45, 'melee'], ['Spectral Thief', 'Ghost', 100, 'dash', 5.5], ['Counter', 'Fighting', 'counter', 120, 7], 'sash'),
  P(807, 'ZERAORA', 'myth', ['Electric'], [88, 112, 78, 143], ['Plasma Fists', 'Electric', 45, 'melee'], ['Close Combat', 'Fighting', 100, 'dash', 5.5], ['Thunder', 'Electric', 'storm', 62, 10, 'para'], 'claw'),
  // VŨ TRỤ (Rayquaza, Deoxys, Necrozma, Solgaleo, Lunala và Ultra Beast)
  P(384, 'RAYQUAZA', 'cosmic', ['Dragon', 'Flying'], [105, 150, 90, 95], ['Dragon Breath', 'Dragon', 42, 'shot'], ['Dragon Ascent', 'Flying', 110, 'dash', 6], ['Draco Meteor', 'Dragon', 'meteor', 75, 10], 'orb'),
  P(386, 'DEOXYS', 'cosmic', ['Psychic'], [50, 150, 50, 150], ['Psycho Cut', 'Psychic', 42, 'shot'], ['Psycho Boost', 'Psychic', 110, 'beam', 6], ['Cosmic Power', 'Psychic', 'shield', 0, 10], 'claw'),
  P(800, 'NECROZMA', 'cosmic', ['Psychic'], [97, 127, 95, 79], ['Power Gem', 'Rock', 42, 'shot'], ['Prismatic Laser', 'Psychic', 115, 'beam', 7], ['Photon Geyser', 'Psychic', 'meteor', 75, 10], 'orb'),
  P(791, 'SOLGALEO', 'cosmic', ['Psychic', 'Steel'], [137, 137, 98, 97], ['Iron Head', 'Steel', 45, 'melee'], ['Sunsteel Strike', 'Steel', 105, 'dash', 6], ['Morning Sun', 'Fire', 'heal', 0, 12], 'sitrus'),
  P(792, 'LUNALA', 'cosmic', ['Psychic', 'Ghost'], [137, 137, 98, 97], ['Psyshock', 'Psychic', 42, 'shot'], ['Moongeist Beam', 'Ghost', 105, 'beam', 6], ['Phantom Force', 'Ghost', 'blink', 70, 7], 'lefto'),
  P(793, 'NIHILEGO', 'cosmic', ['Rock', 'Poison'], [109, 127, 89, 103], ['Power Gem', 'Rock', 42, 'shot'], ['Sludge Wave', 'Poison', 90, 'aoe', 5.5], ['Toxic Spikes', 'Poison', 'spikes', 26, 9], 'lefto'),
  P(794, 'BUZZWOLE', 'cosmic', ['Bug', 'Fighting'], [107, 139, 96, 79], ['Leech Life', 'Bug', 45, 'melee'], ['Superpower', 'Fighting', 105, 'dash', 6], ['Bulk Up', 'Fighting', 'roar', 0, 9], 'band'),
  P(798, 'KARTANA', 'cosmic', ['Grass', 'Steel'], [59, 160, 81, 109], ['Leaf Blade', 'Grass', 45, 'melee'], ['Sacred Sword', 'Fighting', 100, 'dash', 5.5], ['Smart Strike', 'Steel', 'blink', 70, 7], 'sash'),
];
