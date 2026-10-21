'use strict';
// Âm thanh (Web Audio): hiệu ứng, nhạc nền, âm thanh thời tiết

const Snd = {
  ctx: null, muted: false, music: { on: false, timer: null, step: 0, next: 0, level: 1 }, amb: null, ambType: null,
  init() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
      const c = this.ctx = new AC();
      const comp = c.createDynamicsCompressor(); comp.threshold.value = -16; comp.knee.value = 10; comp.ratio.value = 4; comp.attack.value = .003; comp.release.value = .25; comp.connect(c.destination);
      this.master = c.createGain(); this.master.gain.value = .85; this.master.connect(comp);
      this.sfx = c.createGain(); this.sfx.connect(this.master);
      this.mus = c.createGain(); this.mus.gain.value = .42; this.mus.connect(this.master);
      // Reverb: impulse response tự sinh (nhiễu tắt dần)
      const len = c.sampleRate * 1.6 | 0, ir = c.createBuffer(2, len, c.sampleRate);
      for (let ch = 0; ch < 2; ch++) { const d = ir.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2); }
      const conv = c.createConvolver(); conv.buffer = ir; this.rev = c.createGain(); this.rev.gain.value = .5; this.rev.connect(conv); conv.connect(this.master);
      // Delay cho giai điệu chính (nốt móc đơn chấm ở 150 BPM)
      const dl = c.createDelay(1), fb = c.createGain(), dlo = c.createGain(); dl.delayTime.value = .3; fb.gain.value = .33; dlo.gain.value = .35; dl.connect(fb); fb.connect(dl); dl.connect(dlo); dlo.connect(this.mus); this.dly = dl;
      const nl = c.sampleRate * 2 | 0; this.nb = c.createBuffer(1, nl, c.sampleRate); const nd = this.nb.getChannelData(0); for (let i = 0; i < nl; i++) nd[i] = Math.random() * 2 - 1;
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    if (!G && !this.music.on && document.getElementById('menu').style.display !== 'none' && (typeof splash === 'undefined' || splash.done)) this.startBgm('menu');
  },
  toggle() { this.muted = !this.muted; if (this.muted) this.setAmbient(null); return !this.muted; },
  // Đầu ra: panning theo vị trí x trên sân + gửi reverb/delay
  out(o) {
    const c = this.ctx, g = c.createGain(); let dst = o.bus || this.sfx;
    if (o.x !== undefined && c.createStereoPanner) { const p = c.createStereoPanner(); p.pan.value = Math.max(-1, Math.min(1, (o.x / W * 2 - 1) * .8)); p.connect(dst); dst = p; }
    g.connect(dst);
    if (o.rv) { const s = c.createGain(); s.gain.value = o.rv; g.connect(s); s.connect(this.rev); }
    if (o.dl) { const s = c.createGain(); s.gain.value = o.dl; g.connect(s); s.connect(this.dly); }
    return g;
  },
  // Tone: f→f2 (trượt), w = dạng sóng, vib = [tốc độ, độ sâu], fl = [loại lọc, tần số, tần số cuối, Q]
  T(o) {
    if (!this.ctx || this.muted) return; const c = this.ctx;
    try {
      const t = (o.t0 || c.currentTime) + (o.d || 0), dur = o.dur || .1, v = o.v || .15, at = o.at || .004;
      const os = c.createOscillator(), g = c.createGain(); os.type = o.w || 'square';
      os.frequency.setValueAtTime(o.f, t); if (o.f2) os.frequency.exponentialRampToValueAtTime(Math.max(20, o.f2), t + (o.sl || dur));
      if (o.det) os.detune.setValueAtTime(o.det, t);
      if (o.vib) { const l = c.createOscillator(), lg = c.createGain(); l.frequency.value = o.vib[0]; lg.gain.value = o.vib[1]; l.connect(lg); lg.connect(os.frequency); l.start(t); l.stop(t + dur + .05); }
      g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(v, t + at); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
      let n = os; if (o.fl) { const fl = c.createBiquadFilter(); fl.type = o.fl[0]; fl.frequency.setValueAtTime(o.fl[1], t); if (o.fl[2]) fl.frequency.exponentialRampToValueAtTime(o.fl[2], t + dur); fl.Q.value = o.fl[3] || 1; os.connect(fl); n = fl; }
      n.connect(g); g.connect(this.out(o)); os.start(t); os.stop(t + dur + .03);
    } catch (e) { }
  },
  // Noise có lọc (dùng chung một buffer nhiễu 2 giây)
  N(o) {
    if (!this.ctx || this.muted) return; const c = this.ctx;
    try {
      const t = (o.t0 || c.currentTime) + (o.d || 0), dur = o.dur || .1, v = o.v || .15, at = o.at || .003;
      const src = c.createBufferSource(); src.buffer = this.nb;
      const fl = c.createBiquadFilter(), f = o.fl || ['lowpass', 1000]; fl.type = f[0]; fl.frequency.setValueAtTime(f[1], t); if (f[2]) fl.frequency.exponentialRampToValueAtTime(f[2], t + dur); fl.Q.value = f[3] || 1;
      const g = c.createGain(); g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(v, t + at); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
      src.connect(fl); fl.connect(g); g.connect(this.out(o)); src.start(t, Math.random() * 1.4, dur + .05);
    } catch (e) { }
  },
  // --- Giao diện ---
  click() { this.T({ f: 700, f2: 1100, dur: .05, v: .05 }); },
  pick() { [0, 4, 7].forEach((s, i) => this.T({ f: mtof(72 + s), dur: .09, v: .05, d: i * .045, fl: ['lowpass', 3000] })); },
  unpick() { this.T({ f: 600, f2: 300, dur: .1, v: .05 }); },
  // --- Ra sân ---
  ballThrow(x) { this.T({ f: 280, f2: 900, w: 'sine', dur: .35, v: .12, x }); this.N({ dur: .35, v: .06, fl: ['bandpass', 600, 2400, 2], x }); },
  ballOpen(x) { this.N({ dur: .3, v: .2, fl: ['highpass', 2500], x, rv: .3 }); this.T({ f: 1200, f2: 500, w: 'triangle', dur: .15, v: .15, x });[88, 93, 100].forEach((m, i) => this.T({ f: mtof(m), dur: .12, v: .04, d: .06 + i * .05, x, rv: .4 })); },
  // --- Âm thanh theo hệ ---
  ty(t, x, k = 1) {
    const S = this;
    switch (t) {
      case 'Fire': S.N({ dur: .3, v: .22 * k, fl: ['bandpass', 500, 2200, 1], x, rv: .2 }); S.T({ f: 160, f2: 80, w: 'sawtooth', dur: .25, v: .08 * k, fl: ['lowpass', 900], x }); break;
      case 'Water': S.T({ f: 320, f2: 1000, w: 'sine', dur: .12, v: .16 * k, x }); S.T({ f: 520, f2: 1400, w: 'sine', dur: .1, v: .12 * k, d: .06, x }); S.N({ dur: .22, v: .1 * k, fl: ['lowpass', 1600, 300], x }); break;
      case 'Grass': S.N({ dur: .18, v: .12 * k, fl: ['highpass', 2500], x }); S.T({ f: 800, f2: 1500, w: 'triangle', dur: .1, v: .08 * k, x }); break;
      case 'Electric': S.T({ f: 1400, f2: 300, dur: .16, v: .08 * k, vib: [55, 700], x }); S.N({ dur: .08, v: .12 * k, fl: ['highpass', 4500], x }); break;
      case 'Ice': S.T({ f: 2093, w: 'triangle', dur: .3, v: .09 * k, x, rv: .5 }); S.T({ f: 2794, w: 'triangle', dur: .25, v: .06 * k, d: .04, x, rv: .5 }); S.N({ dur: .12, v: .08 * k, fl: ['highpass', 6000], x }); break;
      case 'Ground': case 'Rock': S.N({ dur: .28, v: .26 * k, fl: ['lowpass', 500, 120], x }); S.T({ f: 100, f2: 45, w: 'sine', dur: .25, v: .25 * k, x }); break;
      case 'Flying': S.N({ dur: .22, v: .15 * k, fl: ['bandpass', 600, 2400, 3], x }); break;
      case 'Psychic': S.T({ f: 520, f2: 1300, w: 'sine', dur: .35, v: .1 * k, vib: [14, 70], x, rv: .5 }); break;
      default: S.N({ dur: .12, v: .14 * k, fl: ['bandpass', 900, 2600, 1.4], x });
    }
  },
  cast(t, x) { this.T({ f: 220, f2: 880, w: 'sawtooth', dur: .3, v: .07, fl: ['lowpass', 600, 3000], x, rv: .3 }); this.ty(t, x, .8); },
  // --- Chiến đấu ---
  swing(x) { this.N({ dur: .13, v: .13, fl: ['bandpass', 700, 2800, 1.5], x }); },
  whiff(x) { this.N({ dur: .16, v: .06, fl: ['bandpass', 1800, 500, 2], x }); },
  hit(x, e, crit, melee) {
    this.T({ f: melee ? 170 : 220, f2: 40, w: 'sine', dur: .2, v: e > 1 ? .55 : .42, x });
    this.N({ dur: e < 1 ? .1 : .14, v: e < 1 ? .16 : .3, fl: ['lowpass', e < 1 ? 900 : 3500, 250], x });
    if (e > 1) { this.T({ f: 880, f2: 440, dur: .12, v: .08, x }); this.N({ dur: .1, v: .12, fl: ['highpass', 3000], x, rv: .3 }); }
    if (crit) [1568, 2093, 2637].forEach((f, i) => this.T({ f, w: 'triangle', dur: .18, v: .1, d: .03 + i * .045, x, rv: .5 }));
  },
  tick(x) { this.T({ f: 300, f2: 120, w: 'triangle', dur: .07, v: .1, x }); },
  dodge(x) { this.N({ dur: .22, v: .14, fl: ['bandpass', 400, 1800, 2], x }); this.T({ f: 300, f2: 600, w: 'sine', dur: .15, v: .05, x }); },
  perfect() { this.N({ dur: .35, v: .1, fl: ['highpass', 1500, 6000], rv: .5 });[88, 93, 100].forEach((m, i) => this.T({ f: mtof(m), w: 'triangle', dur: .4, v: .08, d: i * .05, rv: .7 })); this.T({ f: 200, f2: 60, w: 'sine', dur: .5, v: .2 }); },
  dash(x) { this.T({ f: 200, f2: 900, w: 'triangle', dur: .3, v: .2, x }); this.N({ dur: .3, v: .18, fl: ['bandpass', 500, 2500, 1.5], x }); },
  beamCharge(x) { this.T({ f: 200, f2: 1200, w: 'sawtooth', dur: .6, v: .07, fl: ['lowpass', 500, 4000], x, at: .3 }); },
  beam(x) { this.T({ f: 330, f2: 160, w: 'sawtooth', dur: .45, v: .2, vib: [30, 40], x, rv: .3 }); this.N({ dur: .45, v: .25, fl: ['bandpass', 3000, 600, .8], x }); },
  rumble(x) { this.N({ dur: .6, v: .14, fl: ['lowpass', 250], x, at: .25 }); },
  quake(x) { this.N({ dur: .7, v: .45, fl: ['lowpass', 600, 60], x, rv: .3 }); this.T({ f: 80, f2: 35, w: 'sine', dur: .6, v: .4, x }); },
  hum(x) { this.T({ f: 110, f2: 220, w: 'sawtooth', dur: .45, v: .08, fl: ['lowpass', 400, 1500], x, at: .2 }); },
  wave(t, x) { this.N({ dur: .45, v: .25, fl: ['bandpass', 1500, 300, 1], x, rv: .3 }); this.ty(t, x, .9); },
  // --- Chiêu riêng ---
  roar(x) { this.T({ f: 150, f2: 70, w: 'sawtooth', dur: .7, v: .25, vib: [28, 25], fl: ['lowpass', 1200, 400], x, rv: .4 }); this.N({ dur: .6, v: .2, fl: ['lowpass', 900, 200], x }); },
  burrow(x) { this.N({ dur: .5, v: .3, fl: ['lowpass', 500, 100], x }); this.T({ f: 120, f2: 50, w: 'sine', dur: .4, v: .25, x }); },
  emerge(x) { this.quake(x); this.T({ f: 90, f2: 300, dur: .15, v: .1, x }); },
  whirl(x) { this.N({ dur: 1, v: .14, fl: ['bandpass', 300, 1400, 4], x, at: .2, rv: .4 }); this.ty('Water', x); },
  heal(x) { [72, 76, 79, 84, 88].forEach((m, i) => this.T({ f: mtof(m), w: 'triangle', dur: .35, v: .09, d: i * .07, x, rv: .6 })); },
  zap(x) { this.T({ f: 2400, f2: 200, dur: .18, v: .1, vib: [80, 900], x }); this.N({ dur: .15, v: .25, fl: ['highpass', 3000], x, rv: .3 }); },
  shield(x) { [96, 100, 103].forEach((m, i) => this.T({ f: mtof(m), w: 'triangle', dur: .6, v: .06, d: i * .04, x, rv: .7 })); this.N({ dur: .3, v: .08, fl: ['highpass', 5000], x }); },
  shieldHit(x) { this.T({ f: 1800, f2: 1400, w: 'triangle', dur: .15, v: .12, x, rv: .4 }); },
  shatter(x) { this.N({ dur: .4, v: .25, fl: ['highpass', 2500], x, rv: .5 });[91, 96, 88, 98].forEach((m, i) => this.T({ f: mtof(m), w: 'triangle', dur: .2, v: .06, d: i * .03, x })); },
  tornado(x) { this.N({ dur: .9, v: .2, fl: ['bandpass', 400, 2000, 5], x, at: .15, rv: .3 }); },
  reflect(x) { this.T({ f: 700, w: 'sine', dur: .6, v: .1, vib: [9, 120], x, rv: .6 }); this.T({ f: 1400, w: 'sine', dur: .5, v: .05, vib: [11, 200], x, rv: .6 }); },
  ping(x) { this.T({ f: 1500, f2: 2600, w: 'triangle', dur: .2, v: .12, x, rv: .5 }); },
  counterReady(x) { this.T({ f: 1200, dur: .05, v: .08, x }); this.T({ f: 2400, w: 'triangle', dur: .35, v: .08, d: .03, x, rv: .5 }); },
  counter(x) { this.T({ f: 3000, f2: 800, w: 'triangle', dur: .25, v: .15, x, rv: .5 }); this.N({ dur: .15, v: .3, fl: ['lowpass', 2000, 200], x }); },
  fort(x) { this.T({ f: 110, f2: 50, dur: .35, v: .15, fl: ['lowpass', 600], x }); this.N({ dur: .4, v: .25, fl: ['lowpass', 500, 100], x }); },
  meteorCall(x) { this.T({ f: 200, f2: 600, w: 'sawtooth', dur: .5, v: .08, fl: ['lowpass', 800, 3000], x, rv: .4 }); },
  whistle(x) { this.T({ f: 2000, f2: 300, w: 'sine', dur: .8, v: .05, x }); },
  impact(x) { this.quake(x); this.N({ dur: .25, v: .2, fl: ['bandpass', 1500, 400], x }); },
  spikes(x) { for (let i = 0; i < 5; i++) this.T({ f: 600 + i * 150, f2: 200, dur: .06, v: .05, d: i * .04, x }); this.ty('Grass', x); },
  stormCall(x) { this.N({ dur: .8, v: .1, fl: ['lowpass', 300], x, at: .3, rv: .5 }); },
  thunder(x) { this.N({ dur: .9, v: .5, fl: ['lowpass', 4000, 80], x, rv: .6 }); this.T({ f: 1800, f2: 150, dur: .12, v: .1, vib: [70, 800], x }); },
  // --- Sự kiện trận ---
  faint(x) { this.T({ f: 700, f2: 120, dur: .8, v: .1, vib: [7, 25], fl: ['lowpass', 2500], x }); this.N({ dur: .5, v: .12, fl: ['lowpass', 600, 80], x, d: .4 }); },
  weather(type) {
    if (type === 'rain') { this.N({ dur: 1.2, v: .15, fl: ['lowpass', 3000, 800], at: .3, rv: .4 }); this.ty('Water'); }
    if (type === 'sand') this.N({ dur: 1.2, v: .2, fl: ['bandpass', 400, 1500, 1], at: .3 });
    if (type === 'sun') [79, 84, 88, 91].forEach((m, i) => this.T({ f: mtof(m), w: 'triangle', dur: .5, v: .06, d: i * .08, rv: .7 }));
    if (type === 'hail') this.ty('Ice', undefined, 1.3);
  },
  fight() { this.N({ dur: .9, v: .18, fl: ['highpass', 3000], rv: .6 });[57, 64, 69, 72, 76].forEach((m, i) => this.T({ f: mtof(m), dur: .5, v: .06, d: i * .02, fl: ['lowpass', 3000], rv: .4 })); this.T({ f: 110, f2: 55, w: 'sine', dur: .5, v: .4 }); },
  victory() {
    [[72, 0, .15], [76, .15, .15], [79, .3, .15], [84, .45, .5], [83, 1, .15], [84, 1.15, .7]].forEach(([m, d, du]) => { this.T({ f: mtof(m), dur: du + .05, v: .08, d, fl: ['lowpass', 3500], rv: .4 }); this.T({ f: mtof(m - 12), w: 'triangle', dur: du + .05, v: .1, d }); });
    [60, 64, 67].forEach(m => this.T({ f: mtof(m), w: 'triangle', dur: 1.4, v: .06, d: 1.15, rv: .5 }));
  },
  defeat() { [[69, 0], [68, .25], [67, .5], [66, .75]].forEach(([m, d]) => this.T({ f: mtof(m), dur: .3, v: .07, d, fl: ['lowpass', 1500] })); this.T({ f: mtof(57), w: 'triangle', dur: 1.5, v: .12, d: 1, vib: [5, 6], rv: .5 }); },
  heartbeat() { this.T({ f: 65, f2: 45, w: 'sine', dur: .15, v: .35 }); this.T({ f: 60, f2: 40, w: 'sine', dur: .18, v: .28, d: .2 }); },
  // --- Nhạc nền: bộ lập lịch nhìn trước (lookahead) theo đồng hồ AudioContext ---
  spb() { const so = this.music.song || SONGS.cave; return 60 / (this.music.level > 1 ? so.bpmHi : so.bpm) / 4; },
  // Phát bài nhạc theo tên (menu, cave, meadow...). Gọi lại với bài khác sẽ chuyển bài.
  startBgm(id = 'cave') {
    if (!this.ctx) return; const m = this.music;
    if (m.on && m.id === id) return; this.stopBgm();
    m.on = true; m.id = id; m.song = SONGS[id] || SONGS.cave; m.step = 0; m.next = this.ctx.currentTime + .1;
    m.timer = setInterval(() => {
      const now = this.ctx.currentTime;
      const play = G ? G.phase === 'fight' && !G.paused : id === 'menu';
      if (!play || this.muted || document.hidden) { m.next = now + .05; return; }
      while (m.next < now + .14) { this.playStep(m.step, m.next); m.next += this.spb(); m.step = (m.step + 1) & 127; }
    }, 30);
  },
  stopBgm() { clearInterval(this.music.timer); this.music.on = false; this.music.timer = null; this.music.id = null; },
  playStep(s, t, so = this.music.song || SONGS.cave) {
    const bar = (s >> 4) & 7, st = s & 15, lv = this.music.level, spb = this.spb(), V = so.vol;
    const T = o => this.T(Object.assign({ bus: this.mus, t0: t }, o, { v: o.v * V })), N = o => this.N(Object.assign({ bus: this.mus, t0: t }, o, { v: o.v * V }));
    const kick = (v = .55) => T({ f: 150, f2: 42, w: 'sine', dur: .2, v, sl: .12 });
    const snare = (v = .28, rv = .25) => { N({ dur: .14, v, fl: ['bandpass', 1900, 900, .8], rv }); T({ f: 200, f2: 140, w: 'triangle', dur: .08, v: v * .55 }); };
    const hat = (v = .07) => N({ dur: .035, v, fl: ['highpass', 7500] });
    const crash = () => N({ dur: .8, v: .07, fl: ['highpass', 5000], rv: .3 });
    // Trống theo phong cách bài
    switch (so.drums) {
      case 'battle':
        if (st % 4 === 0 || (lv > 1 && st === 14) || (st === 10 && bar % 2)) kick();
        if (st === 4 || st === 12) snare();
        if (lv > 1 && st === 15 && bar % 2) N({ dur: .08, v: .16, fl: ['bandpass', 2200, 900] });
        if (st % 2 === 0) hat(); else if (lv > 1) hat(.04);
        if (st === 0 && bar % 4 === 0) crash(); break;
      case 'pop':
        if (st === 0 || st === 8 || (st === 6 && bar % 2) || (lv > 1 && st === 14)) kick(.5);
        if (st === 4 || st === 12) snare(.24);
        if (st % 2 === 0) hat(.05); if (st % 4 === 2) N({ dur: .06, v: .04, fl: ['bandpass', 5000, 3000, 2] });
        if (st === 0 && bar % 4 === 0) crash(); break;
      case 'reggae':
        if (st === 8 || (lv > 1 && st === 0)) { kick(.5); N({ dur: .05, v: .12, fl: ['bandpass', 3000, 2500, 4] }); }
        if (st % 4 === 2) hat(.05); if (st === 14 && bar % 2) N({ dur: .1, v: .08, fl: ['bandpass', 800, 400, 3] });
        break;
      case 'metal':
        if (st % 2 === 0 || (lv > 1)) kick(lv > 1 ? .4 : .5);
        if (st === 4 || st === 12) snare(.3, .15);
        hat(.045); if (st === 0 && bar % 2 === 0) crash(); break;
      case 'calm':
        if (st === 0 || st === 10) kick(.4);
        if (st === 8) snare(.14, .6);
        if (st % 4 === 0) T({ f: 4200, w: 'triangle', dur: .05, v: .025 });
        if (lv > 1 && st % 2 === 0) hat(.035); break;
      case 'space':
        if (st === 0 || st === 8 || (lv > 1 && st === 10)) kick(.5);
        if (st === 12) snare(.22, .8);
        if (st % 4 === 2) hat(.04); if (st === 0 && bar % 4 === 0) N({ dur: 1.4, v: .05, fl: ['highpass', 3000, 8000], rv: .8 });
        break;
      case 'soft':
        if (st === 0 || st === 8) kick(.3); if (st === 12) snare(.1, .5); if (st % 4 === 2) hat(.03); break;
    }
    // Bass
    if (so.bassPat.includes(st)) { const m = so.bass[bar] + (so.drums === 'battle' && (st === 3 || st === 11) ? 12 : 0); T({ f: mtof(m), w: so.bassWave, dur: spb * 1.7, v: so.bassWave === 'sawtooth' ? .14 : .2, fl: ['lowpass', lv > 1 ? 1100 : 750, 200, 2] }); T({ f: mtof(m - 12), dur: spb * 1.5, v: .06, fl: ['lowpass', 300] }); }
    // Rải hợp âm (skank = chỉ đánh nhịp lệch kiểu reggae)
    const ch = so.chords[bar], A = so.arp;
    if (A) {
      if (A.skank) { if (st % 4 === 2) ch.forEach(m => T({ f: mtof(m + A.oct), w: A.wave, dur: spb * .7, v: A.vol, fl: ['lowpass', 2200] })); }
      else if (st % A.every === 0) { const n = ch[A.pat[(st / A.every) % A.pat.length] % ch.length]; T({ f: mtof(n + A.oct + (st >= 8 && lv > 1 ? 12 : 0)), w: lv > 1 && A.wave === 'triangle' ? 'square' : A.wave, dur: spb * .9, v: A.vol, fl: ['lowpass', 2500], dl: A.delay ? .4 : 0, rv: so.bell ? .4 : 0 }); }
    }
    if (st === 0 && so.pad) ch.forEach(m => T({ f: mtof(m), w: so.pad.wave, dur: spb * 15, v: so.pad.vol, at: spb * 3, fl: ['lowpass', 900], rv: .3 }));
    // Giai điệu chính
    const L = so.leadMap.get(s & 127);
    if (L) {
      const f = mtof(L[0] + so.leadOct), du = so.leadShort ? Math.min(L[1], 2) * spb * .9 : L[1] * spb * .95;
      T({ f, w: so.leadWave, dur: du, v: so.leadVol, vib: so.leadShort ? undefined : [5.5, f * .012], fl: ['lowpass', 3200], dl: so.leadDelay || .5, at: .01, rv: so.bell ? .5 : 0 });
      if (so.bell) T({ f: f * 2, w: 'sine', dur: du * .6, v: so.leadVol * .35, rv: .6 });
      else if (so.leadWave !== 'sine') T({ f, det: 12, w: so.leadWave === 'square' ? 'square' : 'sawtooth', dur: du, v: .035, fl: ['lowpass', 2400] });
    }
  },
  // --- Âm thanh môi trường theo thời tiết (vòng lặp nhiễu có lọc) ---
  setAmbient(type) {
    if (this.muted || !this.ctx || type === 'sun') type = null;
    if (type === this.ambType) return; this.ambType = type; const c = this.ctx; if (!c) return;
    if (this.amb) { const a = this.amb; a.g.gain.setTargetAtTime(.0001, c.currentTime, .3); setTimeout(() => { try { a.src.stop(); if (a.lfo) a.lfo.stop(); } catch (e) { } }, 1500); this.amb = null; }
    if (!type) return;
    const src = c.createBufferSource(); src.buffer = this.nb; src.loop = true;
    const fl = c.createBiquadFilter(), g = c.createGain(); let lfo = null, v = .05;
    if (type === 'rain') { fl.type = 'lowpass'; fl.frequency.value = 2200; v = .07; }
    if (type === 'sand') { fl.type = 'bandpass'; fl.frequency.value = 700; fl.Q.value = .9; lfo = c.createOscillator(); lfo.frequency.value = .25; const lg = c.createGain(); lg.gain.value = 350; lfo.connect(lg); lg.connect(fl.frequency); lfo.start(); v = .12; }
    if (type === 'hail') { fl.type = 'highpass'; fl.frequency.value = 3500; v = .035; }
    g.gain.setValueAtTime(.0001, c.currentTime); g.gain.setTargetAtTime(v, c.currentTime, .4);
    src.connect(fl); fl.connect(g); g.connect(this.sfx); src.start();
    this.amb = { src, g, lfo };
  }
};
