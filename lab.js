/* ==========================================================================
   Demo lab — five small animated scenes in the hero:
   programming, AI, networking, security, systems.
   Canvas-based, one shared loop, paused when off-screen or when the visitor
   prefers reduced motion (a static frame is drawn instead).
   ========================================================================== */
(() => {
  'use strict';
  const lab = document.querySelector('[data-lab]');
  if (!lab) return;

  const $ = s => lab.querySelector(s);
  const stage = $('.lab-stage'), canvas = $('canvas'), pre = $('.lab-code');
  const fileEl = $('.lab-file'), capEl = $('.lab-caption');
  const tabs = [...lab.querySelectorAll('[data-scene]')];
  const ctx = canvas.getContext('2d');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const W = 480, H = 330;
  const RGB = { cu: '232,147,90', ok: '95,192,143', bad: '229,89,79', ink: '242,239,232', dim: '138,141,149', line: '44,47,56', panel: '23,26,32' };
  const col = (n, a = 1) => `rgba(${RGB[n]},${a})`;
  const MONO = '"DM Mono", ui-monospace, Menlo, Consolas, monospace';
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const hash = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

  let dpr = 1, scale = 1;
  function resize() {
    const w = stage.clientWidth || 480;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round((w * H / W) * dpr);
    scale = w / W;
    if (!running) drawStatic();
  }

  /* ---------- drawing helpers ---------- */
  const rr = (x, y, w, h, r) => {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  };
  const txt = (s, x, y, color, size = 10, align = 'left', weight = 500) => {
    ctx.font = `${weight} ${size}px ${MONO}`;
    ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = 'middle';
    ctx.fillText(s, x, y);
  };
  const line = (x1, y1, x2, y2, color, w = 1) => {
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
    ctx.strokeStyle = color; ctx.lineWidth = w; ctx.stroke();
  };
  const dot = (x, y, r, fill) => { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = fill; ctx.fill(); };

  /* ======================================================================
     1. PROGRAMMING — typed code (DOM, not canvas)
     ====================================================================== */
  const CODE = [
    [['c', '# TrueImage · verify an upload']],
    [['k', 'def '], ['f', 'verify'], ['p', '(upload):']],
    [['p', '    img = '], ['f', 'fix_orientation'], ['p', '(upload)']],
    [['p', '    face = '], ['f', 'detect_face'], ['p', '(img)  '], ['c', '# YuNet']],
    [['k', '    if '], ['p', 'face '], ['k', 'is None'], ['p', ':']],
    [['k', '        return '], ['f', 'reject'], ['p', '('], ['s', '"no face found"'], ['p', ')']],
    [['p', '    score = model.'], ['f', 'predict'], ['p', '(face)']],
    [['k', '    return '], ['f', 'verdict'], ['p', '(score)']],
  ];
  const CODE_TOTAL = CODE.reduce((s, l) => s + l.reduce((a, [, x]) => a + x.length, 0), 0) + CODE.length - 1;
  const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const renderCode = n => {
    let left = n, html = '';
    for (let i = 0; i < CODE.length; i++) {
      for (const [c, s] of CODE[i]) {
        if (left <= 0) break;
        const part = s.slice(0, left); left -= part.length;
        html += `<span class="${c}">${esc(part)}</span>`;
      }
      if (left <= 0) break;
      left -= 1; html += '\n';
    }
    return html;
  };
  const TYPE_SPEED = 34, OUT_AT = CODE_TOTAL / TYPE_SPEED + 0.7, CODE_LOOP = OUT_AT + 4.2;
  let codeKey = '';
  const programming = {
    reset() { codeKey = ''; },
    step() {},
    draw(t, forceDone) {
      const lt = forceDone ? CODE_LOOP - 1 : t % CODE_LOOP;
      const n = Math.min(CODE_TOTAL, Math.floor(lt * TYPE_SPEED));
      const out = lt >= OUT_AT;
      const key = n + (out ? 'o' : '');
      if (key === codeKey) return;
      codeKey = key;
      pre.innerHTML = renderCode(n) + (out ? '' : '<span class="cursor"></span>') +
        (out ? '\n\n<span class="o">▸ verdict: REAL · 0.93</span>' : '');
    },
  };

  /* ======================================================================
     2. AI — signal passing through a small neural network
     ====================================================================== */
  const AI = (() => {
    const layers = [{ x: 104, n: 5 }, { x: 200, n: 6 }, { x: 296, n: 6 }, { x: 392, n: 2 }];
    const cy = 150;
    const nodes = layers.map(l => Array.from({ length: l.n }, (_, i) => ({
      x: l.x, y: cy + (i - (l.n - 1) / 2) * (l.n === 2 ? 74 : 36),
    })));
    const T = 5.4;
    return {
      reset() {}, step() {},
      draw(t) {
        const cyc = Math.floor(t / T), p = (t % T) / T;
        const running = p < 0.7;
        const wx = running ? 36 + (p / 0.7) * 380 : 999;
        const chosen = cyc % 2; // 0 = real, 1 = AI-generated
        const act = (n, li) => {
          if (li === 3) return p > 0.7 ? (n === chosen ? 1 : 0.08) : clamp(1 - Math.abs(n.x - wx) / 70) * 0.5;
          const base = running ? clamp(1 - Math.abs(n.x - wx) / 80) : clamp(1 - (p - 0.7) / 0.3) * 0.35;
          return base * (0.55 + 0.45 * hash(n.x * 3 + n.y));
        };
        // title
        txt('EfficientNetV2-S', 24, 26, col('dim'), 10);
        txt('face → verdict', 456, 26, col('dim'), 10, 'right');
        // input image (flickering pixels)
        const gx = 24, gy = cy - 24;
        for (let r = 0; r < 5; r++) for (let c = 0; c < 5; c++) {
          const v = running ? hash(r * 17 + c * 31 + Math.floor(t * 7)) : hash(r * 17 + c * 31 + 4);
          ctx.fillStyle = col('cu', 0.12 + v * 0.55);
          ctx.fillRect(gx + c * 11, gy + r * 11, 10, 10);
        }
        txt('input', gx + 27, gy + 66, col('dim'), 9, 'center');
        nodes[0].forEach(n => line(gx + 55, cy, n.x, n.y, col('cu', 0.06), 1));
        // edges
        for (let li = 0; li < 3; li++) {
          nodes[li].forEach(a => nodes[li + 1].forEach(b => {
            const e = (act(a, li) + act(b, li + 1)) / 2;
            line(a.x, a.y, b.x, b.y, col('cu', 0.06 + e * 0.5), 1);
          }));
        }
        // nodes
        nodes.forEach((layer, li) => layer.forEach((n, i) => {
          const a = act(n, li);
          const out = li === 3;
          const tone = out && p > 0.7 ? (i === 0 ? 'ok' : 'bad') : 'cu';
          if (a > 0.02) dot(n.x, n.y, (out ? 15 : 11) * (0.8 + a * 0.4), col(tone, a * 0.16));
          dot(n.x, n.y, out ? 9 : 6, `rgb(${RGB.panel})`);
          ctx.beginPath(); ctx.arc(n.x, n.y, out ? 9 : 6, 0, Math.PI * 2);
          ctx.strokeStyle = a > 0.15 ? col(tone, 0.4 + a * 0.6) : col('line', 1);
          ctx.lineWidth = 1.5; ctx.stroke();
          if (a > 0.15) dot(n.x, n.y, (out ? 5 : 3) * (0.5 + a * 0.5), col(tone, a));
        }));
        txt('REAL', 414, nodes[3][0].y, col('ink', p > 0.7 && chosen === 0 ? 1 : 0.45), 10);
        txt('AI-GEN', 414, nodes[3][1].y, col('ink', p > 0.7 && chosen === 1 ? 1 : 0.45), 10);
        ['conv', 'conv', 'dense', 'output'].forEach((s, i) => txt(s, layers[i].x, 288 - (i === 3 ? 0 : 0), col('dim', 0.8), 9, 'center'));
        // result line
        if (p > 0.72) {
          const conf = (89 + hash(cyc + 3) * 8).toFixed(1);
          const good = chosen === 0;
          txt(`▸ ${good ? 'REAL' : 'AI-GENERATED'} · ${conf}%`, 24, 312, col(good ? 'ok' : 'bad'), 11);
        } else {
          const dots = '.'.repeat(1 + Math.floor(t * 3) % 3);
          txt(`▸ scoring${dots}`, 24, 312, col('dim'), 11);
        }
      },
    };
  })();

  /* ======================================================================
     3. NETWORKING — packets crossing a small topology
     ====================================================================== */
  const NET = (() => {
    const N = {
      c1: { x: 64, y: 96, l: 'PC-A' }, c2: { x: 64, y: 234, l: 'PC-B' },
      sw: { x: 180, y: 165, l: 'SWITCH' }, r: { x: 294, y: 165, l: 'ROUTER' },
      s1: { x: 416, y: 96, l: 'WEB' }, s2: { x: 416, y: 234, l: 'DNS' },
    };
    const E = [['c1', 'sw'], ['c2', 'sw'], ['sw', 'r'], ['r', 's1'], ['r', 's2']];
    const T = 7.4;
    const EV = [
      { at: 0.2, path: ['c1', 'sw', 'r', 's1'], lab: 'SYN', c: 'cu' },
      { at: 1.0, path: ['c2', 'sw', 'r', 's2'], lab: 'DNS?', c: 'cu' },
      { at: 1.6, path: ['s1', 'r', 'sw', 'c1'], lab: 'SYN-ACK', c: 'ok' },
      { at: 2.5, path: ['s2', 'r', 'sw', 'c2'], lab: 'A 10.0.0.8', c: 'ok' },
      { at: 3.0, path: ['c1', 'sw', 'r', 's1'], lab: 'ACK', c: 'cu' },
      { at: 3.9, path: ['c1', 'sw', 'r', 's1'], lab: 'GET /', c: 'cu' },
      { at: 5.2, path: ['s1', 'r', 'sw', 'c1'], lab: '200 OK', c: 'ok' },
    ];
    const SPEED = 125;
    const dist = (a, b) => Math.hypot(N[a].x - N[b].x, N[a].y - N[b].y);
    const S = { clock: 0, fired: new Set(), pk: [], last: null };
    const at = (pk, d) => {
      let acc = 0;
      for (let i = 0; i < pk.path.length - 1; i++) {
        const a = N[pk.path[i]], b = N[pk.path[i + 1]], L = dist(pk.path[i], pk.path[i + 1]);
        if (d <= acc + L || i === pk.path.length - 2) {
          const k = clamp((d - acc) / L);
          return { x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k), seg: i };
        }
        acc += L;
      }
    };
    return {
      reset() { S.clock = 0; S.fired = new Set(); S.pk = []; S.last = null; },
      step(dt) {
        S.clock += dt;
        const cyc = Math.floor(S.clock / T);
        for (let c = Math.max(0, cyc - 1); c <= cyc; c++) EV.forEach((e, i) => {
          const k = c + ':' + i;
          if (!S.fired.has(k) && S.clock >= c * T + e.at) {
            S.fired.add(k);
            let len = 0;
            for (let j = 0; j < e.path.length - 1; j++) len += dist(e.path[j], e.path[j + 1]);
            S.pk.push({ ...e, d: 0, len });
            S.last = e;
          }
        });
        S.pk.forEach(p => { p.d += dt * SPEED; });
        S.pk = S.pk.filter(p => p.d < p.len + 6);
      },
      draw(t) {
        txt('10.0.0.0/24', 24, 26, col('dim'), 10);
        txt('ethernet · tcp/ip', 456, 26, col('dim'), 10, 'right');
        const hot = {}, seg = {};
        S.pk.forEach(p => {
          const pos = at(p, Math.min(p.d, p.len));
          p._pos = pos;
          seg[[p.path[pos.seg], p.path[pos.seg + 1]].sort().join('-')] = p.c;
          Object.keys(N).forEach(k => { if (Math.hypot(N[k].x - pos.x, N[k].y - pos.y) < 26) hot[k] = p.c; });
        });
        E.forEach(([a, b]) => {
          const k = [a, b].sort().join('-');
          line(N[a].x, N[a].y, N[b].x, N[b].y, seg[k] ? col(seg[k], 0.55) : col('line'), seg[k] ? 2.5 : 2);
        });
        Object.entries(N).forEach(([k, n]) => {
          const w = 62, h = 30;
          if (hot[k]) { rr(n.x - w / 2 - 4, n.y - h / 2 - 4, w + 8, h + 8, 12); ctx.fillStyle = col(hot[k], 0.14); ctx.fill(); }
          rr(n.x - w / 2, n.y - h / 2, w, h, 8);
          ctx.fillStyle = `rgb(${RGB.panel})`; ctx.fill();
          ctx.strokeStyle = hot[k] ? col(hot[k], 0.9) : col('dim', 0.45); ctx.lineWidth = 1.2; ctx.stroke();
          txt(n.l, n.x, n.y + 1, col('ink', 0.92), 9.5, 'center');
          for (let i = 0; i < 3; i++) dot(n.x - 8 + i * 8, n.y - h / 2 + 5, 1.6, col(hash(k.charCodeAt(0) + i + Math.floor(t * 2.5)) > 0.45 ? 'ok' : 'dim', 0.9));
        });
        const inNode = pos => Object.values(N).some(n => Math.abs(pos.x - n.x) < 36 && Math.abs(pos.y - n.y) < 20);
        S.pk.forEach(p => {
          const pos = p._pos; if (!pos || inNode(pos)) return;
          for (let i = 3; i >= 1; i--) {
            const tp = at(p, Math.max(0, Math.min(p.d, p.len) - i * 7));
            rr(tp.x - 4, tp.y - 4, 8, 8, 2); ctx.fillStyle = col(p.c, 0.12 * (4 - i)); ctx.fill();
          }
          rr(pos.x - 5, pos.y - 5, 10, 10, 2.5); ctx.fillStyle = col(p.c); ctx.fill();
          txt(p.lab, pos.x, pos.y - 14, col(p.c), 9, 'center');
        });
        if (S.last) {
          const a = N[S.last.path[0]].l, b = N[S.last.path[S.last.path.length - 1]].l;
          txt(`▸ ${a} → ${b}  [${S.last.lab}]`, 24, 312, col('dim'), 11);
        }
      },
    };
  })();

  /* ======================================================================
     4. SECURITY — a firewall allowing 443/80 and dropping the rest
     ====================================================================== */
  const SEC = (() => {
    const WALL = 250, SRV = { x: 392, y: 128, w: 64, h: 76 };
    const OK = [443, 443, 80], BAD = [23, 445, 3389, 6667, 23, 22];
    const S = { n: 0, next: 0.1, pk: [], parts: [], a: 0, b: 0, flash: 0, srv: 0 };
    return {
      reset() { Object.assign(S, { n: 0, next: 0.1, pk: [], parts: [], a: 0, b: 0, flash: 0, srv: 0 }); },
      step(dt) {
        S.next -= dt;
        if (S.next <= 0) {
          S.next = 0.34 + hash(S.n * 3.1) * 0.25;
          const good = hash(S.n * 7.7 + 1) < 0.48, list = good ? OK : BAD;
          S.pk.push({ x: -16, y: 62 + hash(S.n * 9.1) * 208, port: list[Math.floor(hash(S.n * 5.3) * list.length)], good });
          S.n++;
        }
        S.pk.forEach(p => {
          p.x += dt * 150;
          if (!p.good && p.x + 14 >= WALL - 5 && !p.dead) {
            p.dead = true; S.b++; S.flash = 1;
            for (let i = 0; i < 12; i++) {
              const a = hash(S.n * 13 + i + p.y) * Math.PI * 2 - Math.PI / 2 + Math.PI / 2 * 0;
              S.parts.push({ x: WALL - 8, y: p.y, vx: -Math.abs(Math.cos(a)) * 90 - 20, vy: Math.sin(a) * 90, life: 0.7 });
            }
          }
          if (p.good && p.x - 13 >= SRV.x && !p.dead) { p.dead = true; S.a++; S.srv = 1; }
        });
        S.pk = S.pk.filter(p => !p.dead);
        S.parts.forEach(q => { q.x += q.vx * dt; q.y += q.vy * dt; q.life -= dt; });
        S.parts = S.parts.filter(q => q.life > 0);
        S.flash = Math.max(0, S.flash - dt * 3);
        S.srv = Math.max(0, S.srv - dt * 2.5);
      },
      draw() {
        txt('INTERNET', 24, 26, col('dim'), 10);
        txt('INTERNAL', 456, 26, col('dim'), 10, 'right');
        txt('FIREWALL', WALL, 26, col('cu'), 10, 'center');
        // lanes
        for (let y = 62; y <= 270; y += 52) line(0, y, WALL - 6, y, col('line', 0.45), 1);
        // wall
        for (let y = 44; y < 290; y += 22) {
          rr(WALL - 4, y, 8, 18, 2);
          ctx.fillStyle = col('cu', 0.22 + S.flash * 0.6); ctx.fill();
          ctx.strokeStyle = col('cu', 0.55 + S.flash * 0.4); ctx.lineWidth = 1; ctx.stroke();
        }
        // protected server
        rr(SRV.x, SRV.y, SRV.w, SRV.h, 10);
        ctx.fillStyle = `rgb(${RGB.panel})`; ctx.fill();
        ctx.strokeStyle = S.srv > 0 ? col('ok', 0.4 + S.srv * 0.6) : col('dim', 0.45); ctx.lineWidth = 1.4; ctx.stroke();
        if (S.srv > 0) { rr(SRV.x - 5, SRV.y - 5, SRV.w + 10, SRV.h + 10, 14); ctx.strokeStyle = col('ok', S.srv * 0.35); ctx.stroke(); }
        const lx = SRV.x + SRV.w / 2, ly = SRV.y + 40;
        ctx.beginPath(); ctx.arc(lx, ly - 4, 8, Math.PI, 0); ctx.strokeStyle = col('cu'); ctx.lineWidth = 3; ctx.stroke();
        rr(lx - 13, ly - 4, 26, 20, 4); ctx.fillStyle = col('cu'); ctx.fill();
        dot(lx, ly + 6, 2.5, `rgb(${RGB.panel})`);
        txt('SERVER', lx, SRV.y + 14, col('dim'), 8.5, 'center');
        // packets
        S.pk.forEach(p => {
          const c = p.good ? 'ok' : 'bad';
          rr(p.x - 15, p.y - 8, 30, 16, 4);
          ctx.fillStyle = col(c, 0.16); ctx.fill();
          ctx.strokeStyle = col(c, 0.85); ctx.lineWidth = 1; ctx.stroke();
          txt(String(p.port), p.x, p.y + 0.5, col(c), 9, 'center');
        });
        S.parts.forEach(q => dot(q.x, q.y, 2, col('bad', clamp(q.life / 0.7))));
        txt('allow tcp/443,80 · deny *', 24, 312, col('dim'), 10);
        txt(`✓ ${S.a}`, 372, 312, col('ok'), 11, 'right');
        txt(`✕ ${S.b}`, 456, 312, col('bad'), 11, 'right');
      },
    };
  })();

  /* ======================================================================
     5. SYSTEMS — inodes, blocks and a journal (stateless: derived from time)
     ====================================================================== */
  const SYS = (() => {
    const COLS = 10, ROWS = 5, X0 = 22, Y0 = 64, CW = 40, CH = 30, GAP = 4;
    const A = [5, 6, 7, 12], B = [9, 10, 11];
    const STEP = 0.45, STEPS = 21;
    const LABELS = ['mount /dev/fs0', 'create report.txt → inode 2', 'alloc block 5', 'alloc block 6', 'alloc block 7', 'alloc block 12 (indexed)',
      'journal: commit', 'create notes.txt → inode 3', 'alloc block 9', 'alloc block 10', 'alloc block 11', 'journal: commit',
      'rm report.txt', 'free block 5', 'free block 6', 'free block 7', 'free block 12', 'journal: commit', 'crash → replay journal', 'state consistent ✓', 'unmount'];
    const pos = i => ({ x: X0 + (i % COLS) * (CW + GAP), y: Y0 + Math.floor(i / COLS) * (CH + GAP) });
    return {
      reset() {}, step() {},
      draw(t) {
        const s = Math.floor(t / STEP) % STEPS, f = (t / STEP) % 1, fl = 1 - f;
        const aOn = k => s >= 2 + k && s < 13 + k;
        const bOn = k => s >= 8 + k;
        const owner = {}, flash = {};
        A.forEach((b, k) => { if (aOn(k)) owner[b] = 'cu'; if (s === 2 + k || s === 13 + k) flash[b] = fl; });
        B.forEach((b, k) => { if (bOn(k)) owner[b] = 'ok'; if (s === 8 + k) flash[b] = fl; });
        const inoA = s >= 1 && s < 13, inoB = s >= 7;
        txt(LABELS[s], 24, 26, col('ink', 0.9), 11);
        const list = A.filter((b, k) => aOn(k));
        txt(inoA ? `inode 2 → [${list.join(', ')}]` : 'inode 2 → free', 24, 44, col('cu', inoA ? 0.9 : 0.4), 10);
        txt(inoB ? `inode 3 → [${B.filter((b, k) => bOn(k)).join(', ')}]` : '', 456, 44, col('ok', 0.9), 10, 'right');
        // inode → block pointers
        const ip = pos(1);
        A.forEach((b, k) => {
          if (!aOn(k)) return;
          const bp = pos(b);
          ctx.beginPath(); ctx.moveTo(ip.x + CW / 2, ip.y + CH);
          ctx.quadraticCurveTo(ip.x + CW / 2, bp.y + CH / 2, bp.x + CW / 2 - (bp.x > ip.x ? 0 : 0), bp.y);
          ctx.strokeStyle = col('cu', 0.22); ctx.lineWidth = 1; ctx.stroke();
        });
        // grid
        for (let i = 0; i < COLS * ROWS; i++) {
          const { x, y } = pos(i);
          rr(x, y, CW, CH, 5);
          let fill = null, stroke = col('line'), label = String(i), lc = col('dim', 0.55);
          if (i === 0) { fill = col('ink', 0.1); stroke = col('ink', 0.5); label = 'SB'; lc = col('ink', 0.9); }
          else if (i === 1 || i === 2) {
            const on = i === 1 ? inoA : inoB;
            fill = col(i === 1 ? 'cu' : 'ok', on ? 0.22 : 0.06); stroke = col(i === 1 ? 'cu' : 'ok', on ? 0.9 : 0.35);
            label = 'i' + i; lc = col(i === 1 ? 'cu' : 'ok', on ? 1 : 0.5);
          } else if (owner[i]) { fill = col(owner[i], 0.28 + (flash[i] || 0) * 0.5); stroke = col(owner[i], 0.95); lc = col('ink', 0.95); }
          else if (flash[i]) { stroke = col('dim', 0.4 + flash[i] * 0.6); }
          if (fill) { ctx.fillStyle = fill; ctx.fill(); }
          ctx.strokeStyle = stroke; ctx.lineWidth = 1.2; ctx.stroke();
          txt(label, x + CW / 2, y + CH / 2 + 0.5, lc, 9.5, 'center');
        }
        // journal
        txt('JOURNAL', 24, 248, col('dim'), 9);
        const jc = (s >= 6) + (s >= 11) + (s >= 17);
        for (let j = 0; j < 10; j++) {
          const x = X0 + j * (CW + GAP);
          rr(x, 258, CW, 14, 3);
          const on = j < jc, replay = s >= 18 && j < jc;
          if (on) { ctx.fillStyle = col(replay ? 'ok' : 'cu', 0.55); ctx.fill(); }
          ctx.strokeStyle = on ? col(replay ? 'ok' : 'cu', 0.9) : col('line'); ctx.lineWidth = 1; ctx.stroke();
        }
        txt('superblock · inodes · data blocks · journal', 24, 312, col('dim'), 10);
      },
    };
  })();

  /* ---------- scene registry ---------- */
  const SCENES = [
    { id: 'programming', file: 'verify.py', mode: 'code', impl: programming, cap: 'A Flask pipeline validates an upload, finds the face, then asks the model for a verdict.', rel: ['See TrueImage', '#work'] },
    { id: 'ai', file: 'model.forward()', mode: 'canvas', impl: AI, cap: 'A fine-tuned EfficientNetV2-S scores a face image as real or AI-generated.', rel: ['See TrueImage', '#work'] },
    { id: 'networking', file: 'topology.pkt', mode: 'canvas', impl: NET, cap: 'A TCP handshake and a DNS lookup crossing a switch and a router.', rel: ['Cisco networking courses', '#credentials'] },
    { id: 'security', file: 'firewall.rules', mode: 'canvas', impl: SEC, cap: 'A firewall lets HTTPS and HTTP through and drops everything else.', rel: ['Cybersecurity course', '#credentials'] },
    { id: 'systems', file: 'fs.superblock', mode: 'canvas', impl: SYS, cap: 'Files map to inodes and blocks, and a journal restores consistency after a crash.', rel: ['See File System in User Space', '#work'] },
  ];

  /* ---------- loop & controls ---------- */
  const AUTO_MS = 8;
  let cur = 0, sceneT = 0, last = 0, running = false, visible = false, auto = !reduce;

  function setScene(i, byUser) {
    cur = i; sceneT = 0;
    const sc = SCENES[i];
    tabs.forEach((b, k) => { b.setAttribute('aria-pressed', String(k === i)); b.style.setProperty('--p', 0); });
    stage.dataset.mode = sc.mode;
    fileEl.textContent = sc.file;
    capEl.innerHTML = '';
    capEl.append(sc.cap + ' ');
    const a = document.createElement('a'); a.href = sc.rel[1]; a.textContent = sc.rel[0] + ' →';
    capEl.append(a);
    if (byUser) auto = false;
    sc.impl.reset();
    if (!running) drawStatic();
  }

  function render(t) {
    const sc = SCENES[cur];
    if (sc.mode === 'code') { sc.impl.draw(t); return; }
    ctx.setTransform(dpr * scale, 0, 0, dpr * scale, 0, 0);
    ctx.clearRect(0, 0, W, H);
    sc.impl.draw(t);
  }

  function drawStatic() {
    const sc = SCENES[cur];
    sc.impl.reset();
    if (sc.mode === 'code') { sc.impl.draw(0, true); return; }
    const T = 5.2;
    for (let k = 0; k < Math.round(T * 30); k++) sc.impl.step(1 / 30);
    render(sc.id === 'ai' ? 4.4 : sc.id === 'systems' ? 3.6 : T);
  }

  function frame(now) {
    if (!running) return;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now; sceneT += dt;
    const sc = SCENES[cur];
    sc.impl.step(dt, sceneT);
    render(sceneT);
    if (auto) {
      tabs[cur].style.setProperty('--p', clamp(sceneT / AUTO_MS).toFixed(3));
      if (sceneT > AUTO_MS) setScene((cur + 1) % SCENES.length, false);
    }
    requestAnimationFrame(frame);
  }

  function sync() {
    const should = visible && !document.hidden && !reduce;
    if (should && !running) { running = true; last = performance.now(); requestAnimationFrame(frame); }
    else if (!should && running) running = false;
  }

  tabs.forEach((b, i) => b.addEventListener('click', () => setScene(i, true)));
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(es => { visible = es[0].isIntersecting; sync(); }, { threshold: 0.15 }).observe(lab);
  } else { visible = true; }
  document.addEventListener('visibilitychange', sync);
  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(stage);
  addEventListener('resize', resize, { passive: true });

  resize();
  setScene(0, false);
  if (reduce) tabs.forEach(b => b.style.setProperty('--p', 0));
  sync();
})();
