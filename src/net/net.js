'use strict';
// PvP online qua Supabase Realtime (gói miễn phí).
// - Ghép trận ngẫu nhiên: kênh "sảnh" dùng presence, mỗi máy tự tính cặp theo cùng một quy tắc.
// - Mời bạn: kênh "code-XXXX" (mã 4 số / QR).
// - Trong trận: máy chủ phòng (host) tính toàn bộ trận và gửi ảnh chụp trạng thái 15 lần/giây;
//   máy khách (guest) chỉ gửi thao tác và vẽ lại theo ảnh chụp.

const SB_URL = 'https://zvsocohjsojvfijwkwfy.supabase.co', SB_KEY = 'sb_publishable_CyTQjopc_pzQyY1vUt7Hnw_izSRdQDQ';
const GROUP_POWER = { common: 1, pseudo: 2, myth: 3, cosmic: 3, legend: 4 };
const teamPower = ids => ids.reduce((s, id) => s + GROUP_POWER[R.find(d => d.id === id).g], 0);
// Âm thanh không phát lại bên máy khách (máy khách tự phát theo góc nhìn của mình)
const SND_LOCAL = ['init', 'T', 'N', 'out', 'toggle', 'click', 'pick', 'unpick', 'spb', 'startBgm', 'stopBgm', 'playStep', 'setAmbient', 'victory', 'defeat', 'heartbeat', 'fight', 'ballOpen', 'perfect'];

// ---------- Tên người chơi ----------
const BAD_WORDS = ['dm', 'dcm', 'đm', 'đcm', 'vl', 'vcl', 'cc', 'clm', 'địt', 'đit', 'lồn', 'buồi', 'cặc', 'đéo', 'đĩ', 'fuck', 'shit', 'bitch', 'dick'];
function cleanName(s) {
  s = String(s || '').replace(/[<>&"'`\\]/g, '').replace(/\s+/g, ' ').trim().slice(0, 12);
  if (s.length < 2) return { ok: false, msg: 'Tên cần ít nhất 2 ký tự' };
  const low = s.toLowerCase(), words = low.split(/[^a-zà-ỹđ0-9]+/);
  if (BAD_WORDS.some(w => words.includes(w) || (w.length > 3 && low.includes(w)))) return { ok: false, msg: 'Tên có từ không phù hợp, chọn tên khác nhé' };
  return { ok: true, name: s.toUpperCase() };
}
const PLAYER = {
  get name() { try { return localStorage.getItem('dt-name') || ''; } catch (e) { return this._n || ''; } },
  set name(v) { this._n = v; try { localStorage.setItem('dt-name', v); } catch (e) { } }
};

const NET = {
  sb: null, id: Math.random().toString(36).slice(2, 10), ch: null, lobby: null, state: 'idle', role: null, peer: null,
  waitAsk: 30, rule: 'free', lastRecv: 0, sentAt: 0, lastInp: '', relayed: 0,
  remote: {
    mx: 0, my: 0, hold: false, p: { atk: 0, sk1: 0, sk2: 0, dodge: 0 },
    vec() { return [this.mx, this.my]; }, wants(k) { return this.p[k] > 0 && G.clock - this.p[k] < .35; }, take(k) { this.p[k] = 0; }, held() { return this.hold; }
  },
  init() {
    if (!this.sb) this.sb = supabase.createClient(SB_URL, SB_KEY, { realtime: { params: { eventsPerSecond: 40 } } });
    if (!this._sndWrapped) {
      this._sndWrapped = true;
      for (const k of Object.keys(Snd)) if (typeof Snd[k] === 'function' && !SND_LOCAL.includes(k)) {
        const orig = Snd[k]; Snd[k] = function (...a) { if (G && G.net === 'host') NET.sndQ.push([k, a.map(v => typeof v === 'number' ? Math.round(v) : v)]); return orig.apply(this, a); };
      }
    }
    this.sndQ = [];
  },
  sub(ch) { return new Promise((res, rej) => { let done = false; ch.subscribe(s => { if (done) return; if (s === 'SUBSCRIBED') { done = true; res(); } else if (s === 'CHANNEL_ERROR' || s === 'TIMED_OUT') { done = true; rej(new Error(s)); } }); setTimeout(() => { if (!done) { done = true; rej(new Error('TIMEOUT')); } }, 12000); }); },
  async leave() {
    clearInterval(this.timer); clearInterval(this.helloT); clearTimeout(this.askT); this.state = 'idle';
    for (const c of [this.lobby, this.ch]) if (c) { try { if (c === this.ch && this.peer) await c.send({ type: 'broadcast', event: 'bye', payload: {} }); await this.sb.removeChannel(c); } catch (e) { } }
    this.lobby = this.ch = null; this.role = null; this.peer = null;
  },

  // ---------- Ghép trận ngẫu nhiên ----------
  async findMatch(queue) {
    this.init(); await this.leave(); this.state = 'search'; this.queue = queue; this.searchStart = Date.now();
    const me = { name: PLAYER.name, q: queue, pw: teamPower(picks), ts: Date.now(), team: picks.slice(), map: mapPick };
    this.lobby = this.sb.channel('lobby-v1', { config: { presence: { key: this.id } } });
    this.lobby.on('presence', { event: 'sync' }, () => this.tryPair());
    // Máy phát hiện cặp trước báo thẳng cho máy kia (tránh trường hợp máy kia chưa kịp thấy mình)
    this.lobby.on('broadcast', { event: 'pair' }, m => { const p = m.payload; if (p.to === this.id && this.state === 'search') this.joinRoom(p.room, p.host === this.id ? 'host' : 'guest'); });
    await this.sub(this.lobby); await this.lobby.track(me);
    netUI.searching();
    this.askT = setTimeout(() => { if (this.state === 'search') netUI.askAI(); }, this.waitAsk * 1000);
  },
  tryPair() {
    if (this.state !== 'search' || !this.lobby) return;
    const st = this.lobby.presenceState(), list = [];
    for (const id in st) { const m = st[id][0]; if (m && !m.busy && m.q === this.queue) list.push(Object.assign({ id }, m)); }
    list.sort((a, b) => a.ts - b.ts || (a.id < b.id ? -1 : 1));
    // Mọi máy chạy cùng quy tắc này trên cùng danh sách nên ra cùng kết quả ghép
    const used = new Set();
    for (let i = 0; i < list.length; i++) {
      if (used.has(list[i].id)) continue;
      for (let j = i + 1; j < list.length; j++) {
        if (used.has(list[j].id)) continue;
        if (this.queue.startsWith('fair') && Math.abs(list[i].pw - list[j].pw) > 3) continue;
        used.add(list[i].id); used.add(list[j].id);
        if (list[i].id === this.id || list[j].id === this.id) {
          const other = list[i].id === this.id ? list[j] : list[i], host = this.id < other.id, room = 'room-' + [this.id, other.id].sort().join('-');
          this.lobby.send({ type: 'broadcast', event: 'pair', payload: { to: other.id, room, host: host ? this.id : other.id } });
          this.joinRoom(room, host ? 'host' : 'guest');
          return;
        }
        break;
      }
    }
  },

  // ---------- Phòng mời bằng mã ----------
  async createRoom(rule) {
    this.init(); await this.leave(); this.rule = rule;
    for (let tries = 0; tries < 5; tries++) {
      const code = String(1000 + Math.floor(Math.random() * 9000));
      const ch = this.chan('code-' + code);
      await this.sub(ch); await new Promise(r => setTimeout(r, 600));
      if (Object.keys(ch.presenceState()).length) { await this.sb.removeChannel(ch); continue; }
      this.code = code; await ch.track({ role: 'host', name: PLAYER.name, rule });
      this.setupRoom(ch, 'host'); netUI.invite(code); return code;
    }
    throw new Error('Không tạo được phòng, thử lại sau');
  },
  async joinCode(code) {
    this.init(); await this.leave(); this.state = 'joining';
    const ch = this.chan('code-' + code);
    await this.sub(ch);
    const host = await new Promise(r => { const t0 = Date.now(); const iv = setInterval(() => { const st = ch.presenceState(); const h = Object.values(st).map(v => v[0]).find(m => m && m.role === 'host'); if (h || Date.now() - t0 > 6000) { clearInterval(iv); r(h); } }, 200); });
    if (!host) { await this.sb.removeChannel(ch); this.state = 'idle'; throw new Error(`Không tìm thấy phòng ${code}. Kiểm tra lại mã hoặc nhờ bạn tạo phòng mới.`); }
    const bad = ruleViolation(host.rule, picks);
    if (bad) { await this.sb.removeChannel(ch); this.state = 'idle'; throw new Error(bad); }
    await ch.track({ role: 'guest', name: PLAYER.name });
    this.setupRoom(ch, 'guest');
  },

  // ---------- Phòng đấu (dùng chung cho ghép ngẫu nhiên và mã mời) ----------
  async joinRoom(name, role) {
    // Vẫn ở trong sảnh cho tới khi trận bắt đầu (đánh dấu đang bận để không ai ghép thêm)
    clearTimeout(this.askT); this.state = 'room';
    if (this.lobby) { try { await this.lobby.track({ busy: 1, ts: Date.now() }); } catch (e) { } }
    const ch = this.chan(name);
    this.setupRoom(ch, role);
    try { await this.sub(ch); await ch.track({ role, name: PLAYER.name }); } catch (e) { netUI.error('Lỗi kết nối phòng: ' + e.message); return; }
    // Không bắt tay được trong 8 giây thì quay lại sảnh tìm tiếp
    setTimeout(() => { if (this.state === 'room' && this.ch === ch) { this.findMatch(this.queue); } }, 9000);
  },
  // Kênh phòng: phải gắn lắng nghe presence trước khi vào kênh thì mới thấy được người khác trong phòng
  chan(name) { const ch = this.sb.channel(name, { config: { presence: { key: this.id }, broadcast: { self: false } } }); ch.on('presence', { event: 'sync' }, () => { }); return ch; },
  async dropLobby() { const lob = this.lobby; this.lobby = null; if (lob) { try { await lob.untrack(); await this.sb.removeChannel(lob); } catch (e) { } } },
  setupRoom(ch, role) {
    this.ch = ch; this.role = role; this.state = 'room'; this.peer = null;
    ch.on('broadcast', { event: 'hello' }, m => { if (role === 'host') this.onHello(m.payload); });
    ch.on('broadcast', { event: 'start' }, m => { if (role === 'guest' && this.state === 'room') this.onStart(m.payload); });
    ch.on('broadcast', { event: 'ready' }, () => { if (role === 'host' && this.state === 'room' && this.pendingStart) this.beginHost(); });
    ch.on('broadcast', { event: 'snap' }, m => { if (role === 'guest') this.applySnap(m.payload); });
    ch.on('broadcast', { event: 'inp' }, m => { if (role === 'host') this.onInput(m.payload); });
    ch.on('broadcast', { event: 'bye' }, () => { this.lastRecv = 0; this.peerLeft = true; });
    if (role === 'guest') {
      const hello = { name: PLAYER.name, team: picks.slice(), map: mapPick, id: this.id };
      this.helloT = setInterval(() => { if (this.state === 'room') ch.send({ type: 'broadcast', event: 'hello', payload: hello }); else clearInterval(this.helloT); }, 700);
    }
  },
  onHello(p) {
    if (this.pendingStart) { this.ch.send({ type: 'broadcast', event: 'start', payload: this.pendingStart }); return; }
    if (this.code) { const bad = ruleViolation(this.rule, p.team); if (bad) return; }
    const cands = [mapPick, p.map].filter(m => m && m !== 'random'), mapId = cands.length ? cands[Math.random() * cands.length | 0] : MAPS[Math.random() * MAPS.length | 0].id;
    this.peer = { name: p.name, id: p.id };
    this.pendingStart = { teams: [picks.slice(), p.team], names: [PLAYER.name, p.name], map: mapId };
    this.ch.send({ type: 'broadcast', event: 'start', payload: this.pendingStart });
  },
  onStart(p) {
    clearInterval(this.helloT); this.peer = { name: p.names[0] };
    this.ch.send({ type: 'broadcast', event: 'ready', payload: {} });
    this.state = 'play'; this.lastRecv = performance.now(); this.dropLobby();
    startNetBattle(p, 'guest');
  },
  beginHost() {
    const p = this.pendingStart; this.pendingStart = null; this.state = 'play'; this.lastRecv = performance.now(); this.dropLobby();
    startNetBattle(p, 'host');
    this.timer = setInterval(() => this.hostTick(), 1000 / 15);
  },

  // ---------- Máy chủ phòng: gửi ảnh chụp trận ----------
  hostTick() {
    if (!G || G.net !== 'host' || !this.ch) return;
    this.watchPeer();
    this.ch.send({ type: 'broadcast', event: 'snap', payload: this.snap() }); this.relayed++;
  },
  onInput(p) {
    this.lastRecv = performance.now(); if (!G) return;
    const r = this.remote; r.mx = p.v[0]; r.my = p.v[1]; r.hold = !!p.h;
    for (const k of p.p || []) r.p[k] = G.clock + .001;
  },
  snap() {
    const r2 = v => typeof v === 'number' ? Math.round(v * 100) / 100 : v;
    const pick = (o, keys) => { const out = {}; for (const k of keys) if (o[k] !== undefined && o[k] !== null) out[k] = r2(o[k]); return out; };
    const FK = ['x', 'y', 'vx', 'vy', 'hp', 'dying', 'appear', 'dieDir', 'under', 'dir8', 'pa', 'paT', 'flash', 'iframe', 'atkT', 'atkDx', 'atkDy', 'hitRot', 'sq', 'cdS', 'cdG', 'cdR', 'atkCd', 'shield', 'mirrorT', 'stunT', 'counterT', 'fortT', 'status', 'face', 'atkMod'];
    const fresh = a => { const out = []; for (const o of a) if (!o._s) { o._s = 1; out.push(o); } return out; };
    return {
      ph: G.phase, pt: r2(G.pt), tm: r2(G.time), et: r2(G.endT), w: G.winner, note: G.endNote,
      wx: G.weather && { type: G.weather.type, t: r2(G.weather.t), max: G.weather.max }, bn: G.banner, kb: G.koBanner, fb: r2(G.fightBanner), sh: r2(G.shake),
      s: G.sides.map(S => ({
        a: S.team.indexOf(S.active), sw: S.team.indexOf(S.shown),
        tm: S.team.map(f => f.released || f.dying >= 0 ? Object.assign(pick(f, FK), { rl: 1, fa: f.fainted ? 1 : 0, iu: f.itemUsed ? 1 : 0, wd: f.wind ? 1 : 0, ds: f.dash || f.roll ? 1 : 0 }) : { hp: Math.round(f.hp), fa: f.fainted ? 1 : 0 })
      })),
      pj: G.proj.map(p => pick(p, ['x', 'y', 'vx', 'vy', 'col', 'size', 'k'])),
      tl: G.teles.map(t => Object.assign(pick(t, ['k', 'x', 'y', 'r', 't', 'max', 'ang', 'len', 'w', 'fx']), { o: t.owner.side, mt: t.mv.t })),
      hz: G.hazards.map(h => Object.assign(pick(h, ['k', 'x', 'y', 'r', 'life', 'max']), { mt: h.mv.t, sp: h.sp })),
      mm: G.mapMet.map(m => pick(m, ['x', 'y', 'r', 't', 'max'])),
      bl: G.balls.map(b => Object.assign(pick(b, ['t', 'max', 'sx', 'sy', 'tx', 'ty', 'col']), { f: [b.f.side, G.sides[b.f.side].team.indexOf(b.f)] })),
      pa: fresh(G.parts).map(p => pick(p, ['x', 'y', 'vx', 'vy', 'life', 'max', 'col', 's', 'g', 'drag'])),
      fl: fresh(G.floats).map(f => pick(f, ['s', 'x', 'y', 'vx', 'vy', 'g', 'life', 'max', 'col', 'size', 'font', 'pop'])),
      bu: fresh(G.bubbles).map(b => pick(b, ['x', 'y', 's', 'col', 'life', 'max'])),
      rg: fresh(G.rings).map(r => pick(r, ['x', 'y', 'r', 'mr', 'life', 'max', 'col', 'thin'])),
      bm: fresh(G.beams).map(b => pick(b, ['x', 'y', 'ang', 'len', 'w', 'life', 'max', 'col'])),
      bo: fresh(G.bolts).map(b => ({ pts: b.pts.map(p => p.map(Math.round)), life: r2(b.life), max: b.max })),
      db: fresh(G.debris).map(d => pick(d, ['x', 'y', 's', 'life', 'col'])),
      snd: this.sndQ.splice(0)
    };
  },

  // ---------- Máy khách: áp ảnh chụp, gửi thao tác ----------
  applySnap(s) {
    this.lastRecv = performance.now(); if (!G || G.net !== 'guest') return;
    const prevPh = G.phase;
    Object.assign(G, { phase: s.ph, time: s.tm, endT: s.et, winner: s.w, endNote: s.note, banner: s.bn, koBanner: s.kb, fightBanner: s.fb });
    if (s.ph === 'intro') G.pt = s.pt;
    G.shake = Math.max(G.shake, s.sh || 0);
    if (s.wx) { if (!G.weather || G.weather.type !== s.wx.type) G.weather = { type: s.wx.type, t: s.wx.t, max: s.wx.max, tick: 0 }; else G.weather.t = s.wx.t; } else G.weather = null;
    s.s.forEach((ss, i) => {
      const S = G.sides[i];
      ss.tm.forEach((d, k) => {
        const f = S.team[k]; f.hp = d.hp; f.fainted = !!d.fa;
        if (!d.rl) { if (f.hp < f.dispHp) f.hold = .45; return; }
        const first = !f.released;
        for (const key in d) if (!['x', 'y', 'rl', 'fa', 'iu', 'wd', 'ds', 'pa', 'paT'].includes(key)) f[key] = d[key];
        if (d.pa && (d.pa !== f.pa || d.paT < (f.paT || 0) - .05)) { f.pa = d.pa; f.paT = d.paT; }
        f.released = true; f.itemUsed = !!d.iu; f.wind = d.wd ? { t: 1, cb() { } } : null; f.dash = d.ds ? { vx: f.vx, vy: f.vy, t: 1, mv: f.d.sp } : null;
        if (first || Math.hypot(d.x - f.x, d.y - f.y) > 80) { f.x = d.x; f.y = d.y; }
        f.tx = d.x; f.ty = d.y; if (d.status === undefined) f.status = null;
      });
      S.active = ss.a >= 0 ? S.team[ss.a] : null; S.shown = ss.sw >= 0 ? S.team[ss.sw] : S.shown;
    });
    G.proj = s.pj; G.mapMet = s.mm;
    G.teles = s.tl.map(t => Object.assign(t, { owner: G.sides[t.o].active || G.sides[t.o].shown, mv: { t: t.mt } }));
    G.hazards = s.hz.map(h => Object.assign(h, { mv: { t: h.mt }, owner: null }));
    G.balls = s.bl.map(b => Object.assign(b, { f: G.sides[b.f[0]].team[b.f[1]] }));
    G.parts.push(...s.pa); G.floats.push(...s.fl); G.bubbles.push(...s.bu); G.rings.push(...s.rg); G.beams.push(...s.bm); G.bolts.push(...s.bo); G.debris.push(...s.db);
    for (const [k, a] of s.snd) if (Snd[k]) Snd[k](...a);
    if (prevPh === 'intro' && s.ph === 'fight') { Snd.fight(); Snd.startBgm(MAP.id); }
    if (prevPh !== 'end' && s.ph === 'end') { Snd.stopBgm(); if (G.winner === G.me) Snd.victory(); else Snd.defeat(); }
  },
  guestStep(dt) {
    // Vẽ mượt giữa 2 ảnh chụp: trượt dần tới vị trí mới
    for (const S of G.sides) for (const f of S.team) {
      if (!f.released || f.tx === undefined) continue;
      const k = Math.min(1, dt * 14); f.x += (f.tx - f.x) * k; f.y += (f.ty - f.y) * k;
      animF(f, dt); f.bob += dt * 6; f.flash = Math.max(0, f.flash - dt);
    }
    for (const p of G.proj) { p.x += p.vx * dt; p.y += p.vy * dt; }
    for (const t of G.teles) t.t += dt;
    for (const m of G.mapMet) m.t += dt;
    if (G.phase === 'end') G.endT += dt;
    updWeather(dt);
    // Gửi thao tác: hướng di chuyển, giữ nút đánh, các phím vừa bấm
    const presses = []; for (const k of ['atk', 'sk1', 'sk2', 'dodge']) if (inp[k] > 0) { presses.push(k); inp[k] = 0; }
    const v = inputVec().map(x => Math.round(x * 100) / 100), h = heldAtk() ? 1 : 0, key = v.join() + h, now = performance.now();
    if (this.ch && (presses.length || (key !== this.lastInp && now - this.sentAt > 50) || now - this.sentAt > 500)) {
      this.ch.send({ type: 'broadcast', event: 'inp', payload: { v, h, p: presses } }); this.sentAt = now; this.lastInp = key;
    }
    this.watchPeer();
  },
  // Mất liên lạc: chờ 15 giây rồi kết thúc trận
  watchPeer() {
    if (!G || G.phase === 'end' || !this.lastRecv) { if (G && this.peerLeft && G.phase !== 'end') this.lastRecv = 1; else return; }
    const gap = (performance.now() - this.lastRecv) / 1000;
    G.netWait = gap > 3 ? Math.max(0, Math.ceil(15 - gap)) : 0;
    if (gap > 15 || (this.peerLeft && gap > 3)) {
      G.netWait = 0; G.phase = 'end'; G.endT = 0; Snd.stopBgm();
      if (G.net === 'host') { G.winner = G.me; G.endNote = 'Đối thủ đã rời trận hoặc mất kết nối'; Snd.victory(); }
      else { G.winner = -1; G.endNote = 'Mất kết nối với đối thủ'; }
      if (G.net === 'host') this.hostTick();
    }
  }
};

function ruleViolation(rule, team) {
  if (!rule || rule === 'free') return '';
  const ok = team.every(id => R.find(d => d.id === id).g === rule);
  return ok ? '' : `Phòng này chỉ cho Pokémon nhóm ${GROUPS[rule].n}. Hãy chọn lại đội rồi vào phòng.`;
}
function startNetBattle(p, role) {
  const me = role === 'host' ? 0 : 1, td = ids => ids.map(id => R.find(d => d.id === id));
  netUI.hide(); Snd.stopBgm();
  setMap(MAPS.find(m => m.id === p.map) || MAPS[0]);
  newBattle(td(p.teams[0]), td(p.teams[1]), { me, net: role, names: p.names });
  NET.remote.p = { atk: 0, sk1: 0, sk2: 0, dodge: 0 }; NET.remote.mx = NET.remote.my = 0; NET.peerLeft = false;
  $('menu').style.display = 'none'; $('ctrl').style.display = 'block'; syncCtrl();
}
