'use strict';
// Tải hình Pokémon thật (ảnh chân dung cho menu, hoạt ảnh PMD cho sân đấu)

// Hướng PMD: 0 xuống, 1 xuống-phải, 2 phải, 3 lên-phải, 4 lên, 5 lên-trái, 6 trái, 7 xuống-trái
const PMD = {};
for (const dex in PMD_DATA) { const src = PMD_DATA[dex]; PMD[dex] = { k: src.k, foot: src.foot, h: src.h, w: src.w, a: {}, ready: 0, need: 0, started: false }; }
// Chỉ tải hoạt ảnh của Pokémon sắp ra trận (gọi khi bắt đầu trận / khi chọn trên menu)
function ensurePMD(dex) {
  const src = PMD_DATA[dex], o = PMD[dex]; if (!src || o.started) return; o.started = true;
  for (const name in src.a) {
    const a = src.a[name], im = new Image(); o.need++;
    const an = { fw: a.fw, fh: a.fh, d: a.d, tot: a.d.reduce((x, y) => x + y, 0) / 60, img: im, white: null };
    im.onload = () => {
      const c = document.createElement('canvas'); c.width = im.width; c.height = im.height; const x = c.getContext('2d');
      x.drawImage(im, 0, 0); x.globalCompositeOperation = 'source-in'; x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height);
      an.white = c; o.ready++;
    };
    im.src = `assets/pokemon/${dex}/${name}.png`; o.a[name] = an;
  }
}
const pmdOf = f => { const o = PMD[f.d.dex]; return o && o.started && o.ready === o.need ? o : null; };
// Phát một hoạt ảnh chạy một lần (đánh, bắn, trúng đòn)
function playAnim(f, name) { const o = PMD[f.d.dex]; if (!o) return; if (name === 'Shoot' && !o.a.Shoot) name = 'Attack'; if (!o.a[name]) return; f.pa = name; f.paT = 0; }
const SPR_WAIT = {};
const onSprite = (id, fn) => { (SPR_WAIT[id] = SPR_WAIT[id] || []).push(fn); };
function loadRealSprite(d) {
  const im = new Image(); im.crossOrigin = 'anonymous';
  im.onload = () => {
    try {
      const t = document.createElement('canvas'); t.width = im.width; t.height = im.height; const tx = t.getContext('2d'); tx.drawImage(im, 0, 0);
      const px = tx.getImageData(0, 0, t.width, t.height).data; let x0 = t.width, y0 = t.height, x1 = -1, y1 = -1;
      for (let y = 0; y < t.height; y++)for (let x = 0; x < t.width; x++)if (px[(y * t.width + x) * 4 + 3] > 20) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
      if (x1 < 0) return;
      const w = x1 - x0 + 1, h = y1 - y0 + 1, n = Math.max(w, h) + 2, ox = ((n - w) / 2) | 0, oy = n - h - 1;
      const sp = SPR[d.id], img = sp.frames[0], wh = sp.whites[0];
      img.width = img.height = n; const ix = img.getContext('2d'); ix.imageSmoothingEnabled = false; ix.drawImage(t, x0, y0, w, h, ox, oy, w, h);
      wh.width = wh.height = n; const wx = wh.getContext('2d'); wx.drawImage(img, 0, 0); wx.globalCompositeOperation = 'source-in'; wx.fillStyle = '#ffffff'; wx.fillRect(0, 0, n, n);
      sp.img = img; sp.white = wh; sp.frames = [img, img]; sp.whites = [wh, wh]; sp.dir = -1; sp.real = true;
      (SPR_WAIT[d.id] || []).forEach(fn => fn());
    } catch (e) { }
  };
  im.src = `assets/pokemon/${d.dex}/portrait.png`;
}
R.forEach(loadRealSprite);
