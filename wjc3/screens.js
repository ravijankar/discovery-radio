/* Discovery One — Ambient Screen Display */
(function () {
  'use strict';

  const G      = '#22dd66';
  const G2     = '#0d5528';
  const G3     = '#071a0e';
  const A      = '#e08c10';
  const A2     = '#6a4008';
  const A3     = '#1e1000';
  const FONT   = "'Share Tech Mono', monospace";
  const W = 800, H = 450;

  function rnd(a, b)    { return a + Math.random() * (b - a); }
  function ri(a, b)     { return Math.floor(rnd(a, b + 1)); }
  function f1(n)        { return n.toFixed(1); }
  function f3(n)        { return n.toFixed(3); }
  function pad(n, w)    { return String(n).padStart(w, '0'); }

  /* ── helpers ── */
  function txt(ctx, s, x, y, sz, col, align) {
    ctx.font = sz + 'px ' + FONT;
    ctx.fillStyle = col;
    ctx.textAlign = align || 'left';
    ctx.fillText(s, x, y);
    ctx.textAlign = 'left';
  }

  function header(ctx, label, col) {
    ctx.fillStyle = col;
    ctx.fillRect(20, 16, 4, 14);
    txt(ctx, label, 32, 27, 9, col);
    ctx.strokeStyle = col + '40';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(20, 36); ctx.lineTo(W - 20, 36); ctx.stroke();
  }

  function grid(ctx) {
    ctx.strokeStyle = 'rgba(255,255,255,0.025)';
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 24) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let y = 0; y < H; y += 24) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }
  }

  function scanlines(ctx) {
    ctx.fillStyle = 'rgba(0,0,0,0.14)';
    for (let y = 0; y < H; y += 4) ctx.fillRect(0, y, W, 1);
  }

  function border(ctx) {
    ctx.strokeStyle = 'rgba(255,255,255,0.07)';
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, W - 1, H - 1);
  }

  /* ── fresh random payload ── */
  function freshData() {
    return {
      o2:         rnd(20.4, 21.3),
      co2:        rnd(0.28, 0.52),
      temp:       rnd(20.0, 22.8),
      pressure:   rnd(100.8, 101.9),
      water:      rnd(95, 99),
      distance:   rnd(0.85, 2.6),
      velocity:   rnd(28.2, 31.8),
      missionDay: ri(110, 420),
      eta:        ri(160, 540),
      signalFreq: rnd(8.41, 8.57),
      signalAmp:  rnd(0.55, 0.95),
      systems: [
        ['PROP SYS',  'NOMINAL'],
        ['NAV COMP',  'NOMINAL'],
        ['LIFE SPT',  'NOMINAL'],
        ['COMM ARR',  'NOMINAL'],
        ['PWR DIST',  'NOMINAL'],
        ['THERMAL',   'NOMINAL'],
        ['ACS UNIT',  Math.random() > 0.82 ? 'WARNING' : 'NOMINAL'],
        ['CREW MOD',  'NOMINAL'],
        ['ANT DISH',  'NOMINAL'],
        ['SCIENCE',   'NOMINAL'],
        ['HAB SYS',   'NOMINAL'],
        ['MED BAY',   'NOMINAL'],
      ],
    };
  }

  /* ════════════════════════════════════════════════════
     DiscoveryScreen class
     ════════════════════════════════════════════════════ */
  function DiscoveryScreen(container) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const canvas = document.createElement('canvas');
    canvas.width  = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width       = '100%';
    canvas.style.height      = 'auto';
    canvas.style.aspectRatio = W + '/' + H;
    canvas.style.display     = 'block';
    container.appendChild(canvas);

    this.ctx    = canvas.getContext('2d');
    this.ctx.scale(dpr, dpr);
    this.frame  = 0;
    this._last  = 0;
    this._raf   = null;
    this._timer = null;
    this.data   = freshData();

    const types = ['nav', 'life', 'diag', 'signal', 'log'];
    this.types   = types;
    this.current = types[ri(0, types.length - 1)];
  }

  DiscoveryScreen.prototype.start = function () {
    this._schedule();
    const loop = (ts) => {
      if (ts - this._last >= 32) {   // ~30 fps
        this._last = ts;
        this.frame++;
        this._draw();
      }
      this._raf = requestAnimationFrame(loop);
    };
    this._raf = requestAnimationFrame(loop);
  };

  DiscoveryScreen.prototype._schedule = function () {
    const delay = rnd(6000, 11000);
    this._timer = setTimeout(() => {
      const others = this.types.filter(t => t !== this.current);
      this.current = others[ri(0, others.length - 1)];
      this.data = freshData();
      this._schedule();
    }, delay);
  };

  DiscoveryScreen.prototype._draw = function () {
    const ctx = this.ctx;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);
    grid(ctx);
    switch (this.current) {
      case 'nav':    this._nav();    break;
      case 'life':   this._life();   break;
      case 'diag':   this._diag();   break;
      case 'signal': this._signal(); break;
      case 'log':    this._log();    break;
    }
    scanlines(ctx);
    border(ctx);
  };

  /* ── 1. Navigation ── */
  DiscoveryScreen.prototype._nav = function () {
    const ctx = this.ctx, d = this.data, f = this.frame;
    const cx = W * 0.36, cy = H * 0.55;
    const rx = 130, ry = 92;
    const t  = f / 80;

    header(ctx, 'NAVIGATION  /  TRAJECTORY ANALYSIS  /  HELIOCENTRIC FRAME', G);

    /* orbit ellipse */
    ctx.strokeStyle = G2;
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.setLineDash([]);

    /* tick marks */
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const ox = cx + Math.cos(a) * rx, oy = cy + Math.sin(a) * ry;
      const nx = cx + Math.cos(a) * (rx + 7), ny = cy + Math.sin(a) * (ry + 5);
      ctx.strokeStyle = G2;
      ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(nx, ny); ctx.stroke();
    }

    /* planet */
    const pg = ctx.createRadialGradient(cx - 5, cy - 5, 3, cx, cy, 28);
    pg.addColorStop(0, '#1d5533'); pg.addColorStop(1, '#071a0e');
    ctx.fillStyle = pg;
    ctx.beginPath(); ctx.arc(cx, cy, 28, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = G2; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(cx, cy, 28, 0, Math.PI * 2); ctx.stroke();

    /* crosshair */
    if (f % 70 < 52) {
      ctx.strokeStyle = G2;
      ctx.beginPath();
      ctx.moveTo(cx - 40, cy); ctx.lineTo(cx + 40, cy);
      ctx.moveTo(cx, cy - 40); ctx.lineTo(cx, cy + 40);
      ctx.stroke();
    }

    /* spacecraft */
    const angle = t * 0.42;
    const sx = cx + Math.cos(angle) * rx;
    const sy = cy + Math.sin(angle) * ry;

    /* velocity vector */
    const vx = -Math.sin(angle) * 36, vy = Math.cos(angle) * 26;
    ctx.strokeStyle = A; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + vx * 0.55, sy + vy * 0.55); ctx.stroke();
    /* arrowhead */
    const hvx = vx / Math.hypot(vx, vy), hvy = vy / Math.hypot(vx, vy);
    ctx.fillStyle = A;
    ctx.beginPath();
    ctx.moveTo(sx + vx * 0.55, sy + vy * 0.55);
    ctx.lineTo(sx + vx * 0.55 - hvx * 6 + hvy * 3, sy + vy * 0.55 - hvy * 6 - hvx * 3);
    ctx.lineTo(sx + vx * 0.55 - hvx * 6 - hvy * 3, sy + vy * 0.55 - hvy * 6 + hvx * 3);
    ctx.fill();

    /* ship marker */
    ctx.strokeStyle = G; ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(sx - 6, sy); ctx.lineTo(sx + 6, sy);
    ctx.moveTo(sx, sy - 6); ctx.lineTo(sx, sy + 6);
    ctx.stroke();
    ctx.fillStyle = G;
    ctx.beginPath(); ctx.arc(sx, sy, 2.5, 0, Math.PI * 2); ctx.fill();

    /* readout table */
    const rx2 = W * 0.64, rows = [
      ['DIST FROM ORIGIN', f3(d.distance) + ' AU'],
      ['VELOCITY (SOL)',   f1(d.velocity) + ' km/s'],
      ['MISSION DAY',      String(d.missionDay)],
      ['ETA DESTINATION',  d.eta + ' DAYS'],
      ['INCLINATION',      f1(rnd(1.4, 3.5)) + '\u00b0'],
      ['LONG. ASC. NODE',  f1(rnd(84, 97)) + '\u00b0'],
      ['TRUE ANOMALY',     f1(((angle * 180 / Math.PI) % 360 + 360) % 360) + '\u00b0'],
      ['COMM DELAY',       f1(d.distance * 8.317) + ' MIN'],
    ];
    rows.forEach(([label, val], i) => {
      const y = 58 + i * 46;
      txt(ctx, label, rx2, y,      8, G2);
      txt(ctx, val,   W - 20, y,   9, G, 'right');
      ctx.strokeStyle = G3;
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(rx2, y + 6); ctx.lineTo(W - 20, y + 6); ctx.stroke();
    });

    txt(ctx, 'PHIL 9000  SERIES IV', 20, H - 14, 7, G2);
    txt(ctx, 'CELESTIAL MECHANICS MODULE  v4.1', W - 20, H - 14, 7, G2, 'right');
  };

  /* ── 2. Life Support ── */
  DiscoveryScreen.prototype._life = function () {
    const ctx = this.ctx, d = this.data, f = this.frame;

    header(ctx, 'LIFE SUPPORT  /  ENVIRONMENTAL CONTROL  /  CREW HABITAT', A);

    const rows = [
      { label: 'O\u2082 PARTIAL PRESSURE', val: f1(d.o2),            unit: '%',   min: 19.5, max: 22.0, cur: d.o2,       ok: d.o2 >= 19.5 && d.o2 <= 22 },
      { label: 'CO\u2082 CONCENTRATION',   val: f1(d.co2 * 100) / 100, unit: '%', min: 0,    max: 1.0,  cur: d.co2,       ok: d.co2 < 0.5 },
      { label: 'CABIN TEMPERATURE',        val: f1(d.temp),           unit: '\u00b0C', min: 18, max: 24, cur: d.temp,    ok: true },
      { label: 'HULL PRESSURE',            val: f1(d.pressure),       unit: 'kPa',  min: 99,  max: 103, cur: d.pressure,  ok: true },
      { label: 'WATER RECOVERY',           val: Math.round(d.water),  unit: '%',    min: 90,  max: 100, cur: d.water,     ok: d.water > 93 },
    ];

    const bx = 20, bRight = W - 20;
    const labelW = 220, valW = 90;
    const barX = bx + labelW + 14;
    const barW = bRight - barX - valW - 10;

    rows.forEach((row, i) => {
      const y = 60 + i * 70;
      const col = row.ok ? A : '#ff3322';

      txt(ctx, row.label, bx, y, 8, A + '99');

      /* status dot */
      const dotBlink = !row.ok && f % 40 < 20;
      if (!dotBlink) {
        ctx.fillStyle = col;
        ctx.beginPath(); ctx.arc(bx + labelW, y - 3, 3.5, 0, Math.PI * 2); ctx.fill();
      }

      /* bar bg */
      ctx.fillStyle = '#0a0a0a';
      ctx.strokeStyle = A3;
      ctx.lineWidth = 1;
      ctx.fillRect(barX, y - 10, barW, 12);
      ctx.strokeRect(barX, y - 10, barW, 12);

      /* bar fill */
      const frac = Math.max(0, Math.min(1, (row.cur - row.min) / (row.max - row.min)));
      const gradient = ctx.createLinearGradient(barX, 0, barX + barW, 0);
      gradient.addColorStop(0, col + '88');
      gradient.addColorStop(1, col);
      ctx.fillStyle = gradient;
      ctx.fillRect(barX, y - 10, barW * frac, 12);

      /* value */
      txt(ctx, row.val + ' ' + row.unit, barX + barW + 10, y, 9, col);

      /* grid ticks on bar */
      for (let t = 1; t < 4; t++) {
        const tx = barX + barW * (t / 4);
        ctx.strokeStyle = '#111';
        ctx.beginPath(); ctx.moveTo(tx, y - 10); ctx.lineTo(tx, y + 2); ctx.stroke();
      }
    });

    const blink = f % 80 < 60;
    if (blink) txt(ctx, '\u25cf  ALL SYSTEMS NOMINAL  \u25cf  CREW COMPLEMENT: 5', 20, H - 14, 7, A + '88');
    txt(ctx, 'MISSION DAY  ' + pad(d.missionDay, 3), W - 20, H - 14, 7, A2, 'right');
  };

  /* ── 3. Systems Diagnostic ── */
  DiscoveryScreen.prototype._diag = function () {
    const ctx = this.ctx, d = this.data, f = this.frame;

    header(ctx, 'SYSTEMS STATUS  /  AUTOMATED DIAGNOSTIC  /  PHIL 9000', G);

    const cols = 3, rowCount = 4;
    const cw = (W - 40) / cols;
    const rh = (H - 56) / rowCount;

    d.systems.forEach((sys, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = 20 + col * cw;
      const y = 46 + row * rh;
      const warn  = sys[1] === 'WARNING';
      const color = warn ? '#ff3322' : G;
      const blink = warn && f % 40 < 20;

      /* cell */
      ctx.fillStyle = warn ? '#110000' : G3;
      ctx.fillRect(x + 5, y + 5, cw - 10, rh - 10);
      ctx.strokeStyle = blink ? 'transparent' : color + '40';
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 5, y + 5, cw - 10, rh - 10);

      /* label */
      txt(ctx, sys[0], x + 16, y + 26, 8, G2);

      /* status string */
      if (!blink) txt(ctx, sys[1], x + 16, y + 44, 9, color);

      /* indicator */
      if (!blink) {
        ctx.fillStyle = color;
        ctx.beginPath(); ctx.arc(x + cw - 22, y + rh / 2, 5, 0, Math.PI * 2); ctx.fill();
      }

      /* connector line if warning */
      if (warn) {
        ctx.strokeStyle = '#ff3322' + '22';
        ctx.setLineDash([2, 3]);
        ctx.beginPath(); ctx.moveTo(x + 5, y + rh / 2); ctx.lineTo(x + cw - 10, y + rh / 2); ctx.stroke();
        ctx.setLineDash([]);
      }
    });

    txt(ctx, 'AUTOMATED SYSTEMS CHECK  \u2014  ' + new Date().toISOString().slice(0, 16) + ' UTC', 20, H - 14, 7, G2);
  };

  /* ── 4. Signal Analysis ── */
  DiscoveryScreen.prototype._signal = function () {
    const ctx = this.ctx, d = this.data, f = this.frame;

    header(ctx, 'SIGNAL MONITOR  /  COMMUNICATIONS ARRAY  /  HIGH GAIN', A);

    /* waveform */
    const wx = 20, wy = 46, ww = W - 40, wh = 110;
    ctx.fillStyle = A3;
    ctx.fillRect(wx, wy, ww, wh);
    ctx.strokeStyle = A2;
    ctx.lineWidth = 1;
    ctx.strokeRect(wx, wy, ww, wh);

    /* center line */
    ctx.strokeStyle = A2;
    ctx.setLineDash([3, 5]);
    ctx.beginPath(); ctx.moveTo(wx, wy + wh / 2); ctx.lineTo(wx + ww, wy + wh / 2); ctx.stroke();
    ctx.setLineDash([]);

    /* waveform curve */
    ctx.strokeStyle = A;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    const freq = 3.8 + d.signalFreq * 0.4;
    for (let px = 0; px <= ww; px++) {
      const phase  = (px / ww) * Math.PI * 2 * freq - f * 0.09;
      const noise  = Math.sin(px * 0.29 + f * 0.04) * 0.12 + Math.sin(px * 0.07 - f * 0.06) * 0.08;
      const amp    = wh * 0.38 * d.signalAmp * (1 + noise);
      const py     = wy + wh / 2 + Math.sin(phase) * amp;
      px === 0 ? ctx.moveTo(wx + px, py) : ctx.lineTo(wx + px, py);
    }
    ctx.stroke();

    /* y-axis ticks */
    for (let t = 1; t < 4; t++) {
      const ty = wy + wh * (t / 4);
      ctx.strokeStyle = A2 + '66';
      ctx.beginPath(); ctx.moveTo(wx, ty); ctx.lineTo(wx + 6, ty); ctx.stroke();
    }

    /* readout row */
    const rl = [
      ['FREQUENCY',  f3(d.signalFreq) + ' GHz'],
      ['AMPLITUDE',  f1(d.signalAmp * 100) + ' %'],
      ['PHASE',      f1(rnd(11, 33)) + '\u00b0'],
      ['SNR',        f1(rnd(17, 29)) + ' dB'],
      ['BIT RATE',   '1200 BPS'],
      ['POLARIZ.',   'CIRCULAR-R'],
    ];
    const cw = (W - 40) / rl.length;
    rl.forEach(([label, val], i) => {
      const x = 20 + i * cw + cw / 2;
      const y = 184;
      ctx.strokeStyle = A2 + '33';
      ctx.lineWidth = 1;
      if (i > 0) { ctx.beginPath(); ctx.moveTo(20 + i * cw, 168); ctx.lineTo(20 + i * cw, 204); ctx.stroke(); }
      txt(ctx, label, x, y,      7, A + '77', 'center');
      txt(ctx, val,   x, y + 17, 9.5, A,      'center');
    });

    /* spectrum */
    const spx = 20, spy = 218, spw = W - 40, sph = H - 218 - 24;
    ctx.fillStyle = A3;
    ctx.fillRect(spx, spy, spw, sph);
    ctx.strokeStyle = A2;
    ctx.lineWidth = 1;
    ctx.strokeRect(spx, spy, spw, sph);
    txt(ctx, 'FREQ DOMAIN', spx + 6, spy - 4, 7, A2);

    const bars = 64;
    const bw   = spw / bars;
    const mid  = bars / 2;
    for (let i = 0; i < bars; i++) {
      const dist  = Math.abs(i - mid);
      const base  = Math.max(0, 1 - dist / (bars * 0.32));
      const n     = Math.sin(i * 1.9 + f * 0.04) * 0.18 + Math.sin(i * 0.5 - f * 0.07) * 0.1;
      const bh    = Math.max(2, sph * (base * 0.82 + n * 0.18) * d.signalAmp);
      ctx.fillStyle = Math.abs(i - mid) < 2 ? A : A + '77';
      ctx.fillRect(spx + i * bw + 1, spy + sph - bh, bw - 2, bh);
    }

    txt(ctx, 'EARTH  DSN  CONTACT  \u25cf  LINK NOMINAL', 20, H - 14, 7, A + '88');
    txt(ctx, 'ANT DISH  34m  AZ ' + f1(rnd(120, 200)) + '\u00b0  EL ' + f1(rnd(15, 55)) + '\u00b0', W - 20, H - 14, 7, A2, 'right');
  };

  /* ── 5. Mission Log ── */
  DiscoveryScreen.prototype._log = function () {
    const ctx = this.ctx, d = this.data, f = this.frame;

    header(ctx, 'MISSION LOG  /  STATUS REPORT  /  AUTOMATED ENTRY', G);

    const entries = [
      ['MISSION DAY',            pad(d.missionDay, 3)],
      ['CREW STATUS',            'NOMINAL'],
      ['HIBERNATION PODS',       '3 ACTIVE  /  0 FAULT'],
      ['SHIP INTEGRITY',         '100.0 %'],
      ['DISTANCE FROM EARTH',    f3(d.distance) + ' AU'],
      ['VELOCITY (SOLAR REF)',   f1(d.velocity) + ' km/s'],
      ['ETA PRIMARY OBJECTIVE',  d.eta + ' DAYS'],
      ['FUEL RESERVES',          f1(rnd(60, 76)) + ' %'],
      ['COMM DELAY (ONE-WAY)',   f1(d.distance * 8.317) + ' MIN'],
      ['NEXT CREW REVIVAL',      pad(ri(1, 28), 2) + ' JAN 2002'],
      ['PHIL 9000 DIAGNOSTIC',   'COMPLETE'],
      ['MISSION PRIORITY ALPHA', 'CLASSIFIED'],
    ];

    entries.forEach(([k, v], i) => {
      const y = 52 + i * 31;
      const dim = i === 0 ? G : G + 'bb';

      txt(ctx, k, 20, y, 8.5, G2);
      txt(ctx, v, W - 20, y, 8.5, dim === G ? G : G, 'right');

      ctx.strokeStyle = G3;
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(20, y + 5); ctx.lineTo(W - 20, y + 5); ctx.stroke();

      if (i === 0) {
        ctx.strokeStyle = G2;
        ctx.beginPath(); ctx.moveTo(20, y + 5); ctx.lineTo(W - 20, y + 5); ctx.stroke();
      }
    });

    if (f % 60 < 30) txt(ctx, '_', 20, H - 14, 10, G);
    txt(ctx, 'END OF AUTOMATED LOG ENTRY ' + pad(d.missionDay, 3), W - 20, H - 14, 7, G2, 'right');
  };

  /* ── export ── */
  window.DiscoveryScreen = DiscoveryScreen;
})();
