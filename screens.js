/**
 * KLLEZO V4 — Screen Texture Library
 * Each function draws a complete UI onto a <canvas> element.
 * main.js wraps these with THREE.CanvasTexture for 3D use.
 */
'use strict';
(function () {

  /* ── Drawing Utilities ───────────────────────────────────────── */
  function makeCanvas(w, h) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    return { c, ctx: c.getContext('2d') };
  }

  function rrect(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
  }
  function fillRR(ctx, x, y, w, h, r, color) {
    if (w <= 0 || h <= 0) return;
    ctx.fillStyle = color; rrect(ctx, x, y, w, h, r); ctx.fill();
  }
  function strokeRR(ctx, x, y, w, h, r, color, lw) {
    if (w <= 0 || h <= 0) return;
    ctx.strokeStyle = color; ctx.lineWidth = lw || 1; rrect(ctx, x, y, w, h, r); ctx.stroke();
  }
  function txt(ctx, text, x, y, font, color, align, baseline) {
    ctx.save();
    ctx.font = font; ctx.fillStyle = color;
    ctx.textAlign = align || 'left'; ctx.textBaseline = baseline || 'alphabetic';
    ctx.fillText(text, x, y);
    ctx.restore();
  }
  function ln(ctx, x1, y1, x2, y2, color, lw) {
    ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = lw || 1;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    ctx.restore();
  }
  function dot(ctx, x, y, r, color) {
    ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  }
  function avatar(ctx, x, y, r, bg, initials, tc) {
    dot(ctx, x, y, r, bg);
    txt(ctx, initials, x, y + 1, `bold ${Math.round(r * 0.82)}px -apple-system,sans-serif`, tc || '#fff', 'center', 'middle');
  }
  function progressBar(ctx, x, y, w, h, pct, bg, fg, r) {
    fillRR(ctx, x, y, w, h, r || 3, bg);
    if (pct > 0) fillRR(ctx, x, y, Math.max(w * pct, r * 2 || 4), h, r || 3, fg);
  }
  function waveform(ctx, x, y, w, h, color, seed) {
    seed = seed || 0;
    const bars = 60, bw = w / bars;
    ctx.fillStyle = color;
    for (let i = 0; i < bars; i++) {
      const amp = 0.2 + 0.8 * Math.abs(Math.sin(i * 0.45 + seed) * Math.cos(i * 0.17 + seed * 0.6));
      const bh = Math.max(2, amp * h);
      ctx.fillRect(x + i * bw + 0.5, y + (h - bh) / 2, bw - 1, bh);
    }
  }
  function scanlines(ctx, w, h) {
    ctx.save(); ctx.globalAlpha = 0.03; ctx.fillStyle = '#000';
    for (let y = 0; y < h; y += 3) ctx.fillRect(0, y, w, 1);
    ctx.restore();
  }
  function gradRect(ctx, x, y, w, h, c1, c2, horiz) {
    const g = horiz ? ctx.createLinearGradient(x, y, x + w, y) : ctx.createLinearGradient(x, y, x, y + h);
    g.addColorStop(0, c1); g.addColorStop(1, c2);
    ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
  }

  /* ── 01. INSTAGRAM REEL ──────────────────────────────────────── */
  function drawInstagramReel() {
    const W = 640, H = 1138;
    const { c, ctx } = makeCanvas(W, H);

    gradRect(ctx, 0, 0, W, H, '#1a1a2e', '#533483');
    // bottom dark overlay
    const bot = ctx.createLinearGradient(0, H * 0.45, 0, H);
    bot.addColorStop(0, 'rgba(0,0,0,0)'); bot.addColorStop(1, 'rgba(0,0,0,0.88)');
    ctx.fillStyle = bot; ctx.fillRect(0, H * 0.45, W, H * 0.55);
    // top overlay
    const top = ctx.createLinearGradient(0, 0, 0, 110);
    top.addColorStop(0, 'rgba(0,0,0,0.62)'); top.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = top; ctx.fillRect(0, 0, W, 110);

    // Story progress bars
    for (let i = 0; i < 4; i++) {
      fillRR(ctx, 18 + i * 155, 16, 140, 3, 2, 'rgba(255,255,255,0.3)');
      if (i < 2) fillRR(ctx, 18 + i * 155, 16, i === 1 ? 80 : 140, 3, 2, '#fff');
    }

    // Profile area
    avatar(ctx, 44, 78, 22, '#BFA27A', 'KF');
    txt(ctx, 'kllezo_fitness', 76, 72, 'bold 14px -apple-system,sans-serif', '#fff');
    txt(ctx, 'Sponsored · Fitness', 76, 92, '12px -apple-system,sans-serif', 'rgba(255,255,255,0.65)');
    strokeRR(ctx, W - 108, 60, 90, 32, 6, 'rgba(255,255,255,0.7)', 1.5);
    txt(ctx, 'Follow', W - 63, 80, 'bold 13px -apple-system,sans-serif', '#fff', 'center');
    txt(ctx, '···', W - 40, 80, 'bold 22px sans-serif', '#fff');

    // Gym ambience — abstract shapes
    ctx.save(); ctx.globalAlpha = 0.22;
    const rg = ctx.createRadialGradient(W * 0.5, H * 0.38, 0, W * 0.5, H * 0.38, 220);
    rg.addColorStop(0, '#BFA27A'); rg.addColorStop(1, 'transparent');
    ctx.fillStyle = rg; ctx.fillRect(0, 0, W, H);
    ctx.restore();
    // Stylized "4AM" text in background
    ctx.save(); ctx.globalAlpha = 0.055;
    txt(ctx, '4AM', W / 2, H * 0.4, 'bold 200px -apple-system,sans-serif', '#fff', 'center', 'middle');
    ctx.restore();

    // Caption section
    const CY = H - 290;
    txt(ctx, 'The 4AM gym grind hits different 🔥', 22, CY, 'bold 16px -apple-system,sans-serif', '#fff');
    txt(ctx, 'Tag your gym partner 👇 This is the life', 22, CY + 26, '15px -apple-system,sans-serif', 'rgba(255,255,255,0.9)');
    txt(ctx, 'nobody shows you on Instagram.', 22, CY + 50, '15px -apple-system,sans-serif', 'rgba(255,255,255,0.9)');
    txt(ctx, '... more', 22, CY + 72, '14px -apple-system,sans-serif', 'rgba(255,255,255,0.45)');
    txt(ctx, '#fitness #gym #transformation #4amclub #kllezo', 22, CY + 100, '13px -apple-system,sans-serif', '#60a5fa');

    // Music row
    dot(ctx, 22, CY + 134, 10, 'rgba(255,255,255,0.2)');
    txt(ctx, '♪', 22, CY + 135, '11px sans-serif', '#fff', 'center', 'middle');
    txt(ctx, 'Original Sound · KLLEZO Fitness · 2.4K uses', 40, CY + 138, '12px -apple-system,sans-serif', '#fff');

    // Right-side actions
    const AX = W - 48;
    const acts = [
      { icon: '♡', count: '847K', y: H - 430 },
      { icon: '💬', count: '12.4K', y: H - 338 },
      { icon: '↗', count: '8.9K', y: H - 248 },
      { icon: '🔖', count: '', y: H - 168 },
    ];
    acts.forEach(a => {
      txt(ctx, a.icon, AX, a.y, '30px sans-serif', '#fff', 'center');
      if (a.count) txt(ctx, a.count, AX, a.y + 36, '12px -apple-system,sans-serif', '#fff', 'center');
    });

    // Progress bar
    fillRR(ctx, 0, H - 4, W, 4, 0, 'rgba(255,255,255,0.25)');
    fillRR(ctx, 0, H - 4, W * 0.42, 4, 0, '#fff');
    scanlines(ctx, W, H);
    return c;
  }

  /* ── 02. CONTENT CALENDAR ────────────────────────────────────── */
  function drawContentCalendar() {
    const W = 1024, H = 640;
    const { c, ctx } = makeCanvas(W, H);
    ctx.fillStyle = '#0d1117'; ctx.fillRect(0, 0, W, H);
    // Header
    ctx.fillStyle = '#161b22'; ctx.fillRect(0, 0, W, 52);
    ln(ctx, 0, 52, W, 52, '#30363d');
    txt(ctx, '‹', 22, 34, 'bold 18px sans-serif', '#8b949e');
    txt(ctx, 'June 2025', W / 2, 35, 'bold 15px -apple-system,sans-serif', '#e6edf3', 'center');
    txt(ctx, '›', W - 22, 34, 'bold 18px sans-serif', '#8b949e', 'right');
    ['Month', 'Week', 'Day'].forEach((v, i) => {
      fillRR(ctx, W - 218 + i * 70, 14, 62, 26, 5, v === 'Month' ? '#238636' : '#21262d');
      txt(ctx, v, W - 218 + i * 70 + 31, 31, '11px -apple-system,sans-serif', v === 'Month' ? '#fff' : '#8b949e', 'center');
    });
    fillRR(ctx, W - 38, 14, 28, 26, 5, '#238636');
    txt(ctx, '+', W - 24, 32, 'bold 16px sans-serif', '#fff', 'center');

    // Day headers
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const CW = W / 7, RH = (H - 90) / 5;
    days.forEach((d, i) => txt(ctx, d, i * CW + CW / 2, 76, '10px -apple-system,sans-serif', '#8b949e', 'center'));
    ln(ctx, 0, 82, W, 82, '#30363d');

    // Cell grid
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 7; col++) {
        const cx = col * CW, cy = 82 + row * RH;
        if (col === 0 || col === 6) { ctx.fillStyle = '#0a0f14'; ctx.fillRect(cx, cy, CW, RH); }
        if (col > 0) ln(ctx, cx, cy, cx, cy + RH, '#21262d');
        ln(ctx, cx, cy, cx + CW, cy, '#21262d');
      }
    }

    // Cell data
    const cells = [
      { c: 1, r: 0, d: '2',  posts: [{ t: 'Reel',   tx: 'Morning Routine', col: '#238636' }] },
      { c: 2, r: 0, d: '3',  posts: [{ t: 'Story',  tx: 'BTS Shoot',       col: '#8b5cf6' }] },
      { c: 3, r: 0, d: '4',  posts: [{ t: 'Post',   tx: 'Product Launch',  col: '#3b82f6' }] },
      { c: 4, r: 0, d: '5',  posts: [{ t: 'Reel',   tx: 'Client Result',   col: '#238636' }, { t: 'Story', tx: 'Poll', col: '#8b5cf6' }] },
      { c: 1, r: 1, d: '9',  posts: [{ t: 'Reel',   tx: '5-Day Challenge', col: '#238636' }] },
      { c: 2, r: 1, d: '10', posts: [{ t: 'Letter', tx: 'Weekly Tips',     col: '#f59e0b' }] },
      { c: 3, r: 1, d: '11', posts: [{ t: 'Post',   tx: 'Quote Card',      col: '#3b82f6' }] },
      { c: 4, r: 1, d: '12', posts: [{ t: 'Reel',   tx: 'Recipe of Week',  col: '#238636' }] },
      { c: 1, r: 2, d: '16', posts: [{ t: 'Reel',   tx: 'Workout 🔥',      col: '#238636' }] },
      { c: 2, r: 2, d: '17', posts: [{ t: 'Story',  tx: 'Q&A Session',     col: '#8b5cf6' }] },
      { c: 3, r: 2, d: '18', posts: [{ t: 'Post',   tx: 'Team Feature',    col: '#3b82f6' }, { t: 'Letter', tx: 'Mid-June', col: '#f59e0b' }] },
      { c: 4, r: 2, d: '19', posts: [{ t: 'Reel',   tx: 'Meal Prep Guide', col: '#238636' }] },
      { c: 1, r: 3, d: '23', posts: [{ t: 'Reel',   tx: 'Leg Day 🔥',      col: '#238636', st: 'live' }] },
      { c: 2, r: 3, d: '24', posts: [{ t: 'Post',   tx: 'Progress Photo',  col: '#3b82f6', st: 'sched' }], today: true },
      { c: 3, r: 3, d: '25', posts: [{ t: 'Reel',   tx: 'Protein Myths',   col: '#238636', st: 'draft' }] },
      { c: 4, r: 3, d: '26', posts: [{ t: 'Story',  tx: 'Studio Tour',     col: '#8b5cf6', st: 'draft' }] },
      { c: 5, r: 3, d: '27', posts: [{ t: 'Post',   tx: 'Client Win',      col: '#3b82f6', st: 'draft' }] },
      { c: 1, r: 4, d: '30', posts: [{ t: 'Reel',   tx: 'Month Recap',     col: '#238636' }] },
    ];

    cells.forEach(cell => {
      const cx = cell.c * CW + 4, cy = 82 + cell.r * RH;
      if (cell.today) { fillRR(ctx, cell.c * CW, cy, CW - 1, RH - 1, 0, '#1f2937'); }
      if (cell.today) {
        dot(ctx, cx + 12, cy + 16, 12, '#0969da');
        txt(ctx, cell.d, cx + 12, cy + 21, 'bold 11px -apple-system,sans-serif', '#fff', 'center');
      } else {
        txt(ctx, cell.d, cx + 3, cy + 20, '11px -apple-system,sans-serif', '#8b949e');
      }
      cell.posts.forEach((p, pi) => {
        const py = cy + 28 + pi * 25;
        if (py + 19 > cy + RH) return;
        fillRR(ctx, cx, py, CW - 14, 20, 3, p.col + '28');
        const dc = p.st === 'live' ? '#3fb950' : p.st === 'sched' ? '#58a6ff' : p.st === 'draft' ? '#8b949e' : p.col;
        dot(ctx, cx + 7, py + 10, 3, dc);
        txt(ctx, p.tx, cx + 14, py + 14, '9px -apple-system,sans-serif', '#e6edf3');
      });
    });

    // Legend
    [['#238636', 'Reel'], ['#8b5cf6', 'Story'], ['#3b82f6', 'Post'], ['#f59e0b', 'Newsletter']].forEach(([col, lbl], i) => {
      dot(ctx, 20 + i * 100, H - 11, 4, col);
      txt(ctx, lbl, 30 + i * 100, H - 7, '10px -apple-system,sans-serif', '#8b949e');
    });
    txt(ctx, '14 posts scheduled this month', W - 16, H - 7, '10px -apple-system,sans-serif', '#3fb950', 'right');
    scanlines(ctx, W, H); return c;
  }

  /* ── 03. CREATOR ANALYTICS DASHBOARD ─────────────────────────── */
  function drawCreatorDashboard() {
    const W = 1024, H = 640;
    const { c, ctx } = makeCanvas(W, H);
    ctx.fillStyle = '#0d1117'; ctx.fillRect(0, 0, W, H);

    // Sidebar
    ctx.fillStyle = '#161b22'; ctx.fillRect(0, 0, 210, H);
    ln(ctx, 210, 0, 210, H, '#30363d');
    txt(ctx, 'KLLEZO', 18, 38, 'bold 15px -apple-system,sans-serif', '#BFA27A');
    txt(ctx, 'Creator Studio', 18, 56, '10px -apple-system,sans-serif', '#8b949e');
    const navItems = [
      ['📊', 'Dashboard', true], ['📹', 'Videos', false], ['📅', 'Calendar', false],
      ['💬', 'Comments', false], ['💰', 'Revenue', false], ['👥', 'Audience', false]
    ];
    navItems.forEach(([ic, lbl, act], i) => {
      const iy = 76 + i * 44;
      if (act) { fillRR(ctx, 6, iy, 198, 36, 5, '#238636' + '22'); strokeRR(ctx, 6, iy, 198, 36, 5, '#238636' + '44'); }
      txt(ctx, ic, 22, iy + 23, '15px sans-serif', '#e6edf3');
      txt(ctx, lbl, 46, iy + 24, act ? 'bold 12px -apple-system,sans-serif' : '12px -apple-system,sans-serif', act ? '#3fb950' : '#8b949e');
    });

    // Main content
    const MX = 226, MW = W - MX - 14;
    ctx.fillStyle = '#161b22'; ctx.fillRect(MX, 0, MW, 50);
    ln(ctx, MX, 50, W, 50, '#30363d');
    txt(ctx, 'Performance Overview', MX, 33, 'bold 16px -apple-system,sans-serif', '#e6edf3');
    fillRR(ctx, MX, 60, 96, 22, 5, '#21262d');
    txt(ctx, 'Last 30 days ▾', MX + 8, 75, '10px -apple-system,sans-serif', '#8b949e');

    // KPIs
    const kpis = [
      { l: 'Total Views', v: '2.4M', ch: '+18.4%', up: true },
      { l: 'New Followers', v: '+1,247', ch: '+34.2%', up: true },
      { l: 'Avg Engagement', v: '8.4%', ch: '+2.1%', up: true },
      { l: 'Link Clicks', v: '34.2K', ch: '-3.8%', up: false },
    ];
    const kW = (MW - 24) / 4;
    kpis.forEach((k, i) => {
      const kx = MX + i * (kW + 8);
      fillRR(ctx, kx, 90, kW, 78, 7, '#161b22'); strokeRR(ctx, kx, 90, kW, 78, 7, '#30363d');
      txt(ctx, k.l, kx + 12, 110, '10px -apple-system,sans-serif', '#8b949e');
      txt(ctx, k.v, kx + 12, 138, 'bold 20px -apple-system,sans-serif', '#e6edf3');
      const cc = k.up ? '#3fb950' : '#f85149';
      txt(ctx, (k.up ? '▲' : '▼') + ' ' + k.ch, kx + 12, 158, '10px -apple-system,sans-serif', cc);
    });

    // Views chart
    const CY = 186, CH = 150, CX = MX;
    txt(ctx, 'Daily Views — Last 30 Days', MX, CY - 10, 'bold 12px -apple-system,sans-serif', '#e6edf3');
    for (let g = 0; g <= 4; g++) {
      const gy = CY + g * (CH / 4);
      ln(ctx, CX, gy, CX + MW, gy, '#21262d');
      txt(ctx, ['120K', '90K', '60K', '30K', '0'][g], CX - 6, gy + 4, '9px -apple-system,sans-serif', '#8b949e', 'right');
    }
    const vd = [55, 48, 72, 88, 52, 94, 112, 82, 70, 95, 105, 78, 62, 90, 98, 70, 85, 110, 94, 76, 98, 86, 72, 96, 114, 87, 70, 93, 107, 120];
    const bW = MW / vd.length - 2;
    vd.forEach((v, i) => {
      const bh = (v / 120) * (CH - 8);
      fillRR(ctx, CX + i * (MW / vd.length) + 1, CY + CH - bh - 4, bW, bh, 2, i > 24 ? '#1a9e8f' : '#1a9e8f' + '66');
    });

    // Top posts table
    const TPY = 362;
    txt(ctx, 'Top Performing Content', MX, TPY, 'bold 12px -apple-system,sans-serif', '#e6edf3');
    ln(ctx, MX, TPY + 18, MX + MW, TPY + 18, '#30363d');
    const cols = ['Content', 'Views', 'Likes', 'Shares'];
    const cx2 = [MX + 4, MX + 290, MX + 380, MX + 460];
    cols.forEach((col, i) => txt(ctx, col, cx2[i], TPY + 13, '10px -apple-system,sans-serif', '#8b949e'));
    const posts = [
      { t: 'The 4AM Gym Grind 🔥', v: '847.2K', l: '42.1K', s: '18.4K' },
      { t: '12-Week Transformation (Before & After)', v: '612.8K', l: '38.4K', s: '24.7K' },
      { t: 'Protein Myths Debunked', v: '398.4K', l: '22.8K', s: '9.2K' },
      { t: 'My 5AM Morning Routine', v: '284.6K', l: '18.4K', s: '6.8K' },
    ];
    posts.forEach((p, i) => {
      const py = TPY + 44 + i * 46;
      if (i === 0) { ctx.fillStyle = '#1a9e8f' + '0e'; ctx.fillRect(MX, py - 14, MW, 40); }
      fillRR(ctx, MX + 2, py - 12, 30, 24, 3, '#21262d');
      txt(ctx, `#${i + 1}`, MX + 17, py + 2, 'bold 10px -apple-system,sans-serif', i === 0 ? '#f59e0b' : '#8b949e', 'center');
      txt(ctx, p.t, MX + 40, py + 2, '12px -apple-system,sans-serif', '#e6edf3');
      txt(ctx, p.v, cx2[1], py + 2, 'bold 12px -apple-system,sans-serif', '#e6edf3');
      txt(ctx, p.l, cx2[2], py + 2, '11px -apple-system,sans-serif', '#8b949e');
      txt(ctx, p.s, cx2[3], py + 2, '11px -apple-system,sans-serif', '#8b949e');
      ln(ctx, MX, py + 22, MX + MW, py + 22, '#21262d');
    });
    scanlines(ctx, W, H); return c;
  }

  /* ── 04. VIDEO TIMELINE EDITOR ───────────────────────────────── */
  function drawVideoTimeline() {
    const W = 1280, H = 400;
    const { c, ctx } = makeCanvas(W, H);
    ctx.fillStyle = '#1a1a1e'; ctx.fillRect(0, 0, W, H);

    // Toolbar
    ctx.fillStyle = '#252528'; ctx.fillRect(0, 0, W, 44);
    ln(ctx, 0, 44, W, 44, '#3a3a40');
    dot(ctx, 18, 22, 5, '#ef4444');
    txt(ctx, 'KLLEZO_FitnessReel_v7_FINAL.mp4', 34, 27, 'bold 11px -apple-system,sans-serif', '#e6edf3');
    ['Undo', 'Redo', 'Cut', 'Split', 'Speed', 'Effects', 'Audio', 'Captions'].forEach((b, i) => {
      if (300 + i * 82 > W - 180) return;
      fillRR(ctx, 298 + i * 82, 8, 74, 28, 4, '#353538');
      txt(ctx, b, 298 + i * 82 + 37, 27, '10px -apple-system,sans-serif', '#aaa', 'center');
    });
    fillRR(ctx, W - 140, 8, 122, 28, 5, '#23453F');
    txt(ctx, '↑ Export', W - 79, 27, 'bold 11px -apple-system,sans-serif', '#fff', 'center');

    // Preview panel
    ctx.fillStyle = '#111'; ctx.fillRect(0, 44, 230, H - 44);
    ln(ctx, 230, 44, 230, H, '#3a3a40');
    gradRect(ctx, 12, 60, 206, 152, '#1a1a2e', '#533483');
    ctx.save(); ctx.globalAlpha = 0.7; dot(ctx, 115, 136, 22, '#00000088'); ctx.restore();
    ctx.fillStyle = '#fff'; ctx.beginPath();
    ctx.moveTo(107, 125); ctx.lineTo(107, 147); ctx.lineTo(128, 136); ctx.closePath(); ctx.fill();
    txt(ctx, '00:08:14', 115, 222, '11px monospace', '#aaa', 'center');
    txt(ctx, '/ 01:24:00', 115, 238, '10px monospace', '#666', 'center');
    ['|◀', '◀◀', '⏸', '▶▶', '▶|'].forEach((ctrl, i) => txt(ctx, ctrl, 28 + i * 40, 266, '13px sans-serif', '#aaa', 'center'));
    txt(ctx, '🔊', 24, 298, '13px sans-serif', '#aaa');
    progressBar(ctx, 48, 290, 148, 5, 0.72, '#3a3a40', '#aaa', 2);

    // Timeline area
    const TLX = 230, LBLW = 72, TLW = W - TLX;
    ctx.fillStyle = '#1e1e22'; ctx.fillRect(TLX, 44, TLW, 24);
    ln(ctx, TLX, 68, W, 68, '#3a3a40');
    for (let t = 0; t <= 84; t += 6) {
      const tx = TLX + LBLW + (t / 84) * (TLW - LBLW);
      const maj = t % 12 === 0;
      ctx.strokeStyle = maj ? '#555' : '#333'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(tx, 44); ctx.lineTo(tx, maj ? 68 : 60); ctx.stroke();
      if (maj) txt(ctx, `${Math.floor(t / 60)}:${(t % 60).toString().padStart(2, '0')}`, tx + 2, 64, '8px monospace', '#555');
    }
    // Playhead
    const phX = TLX + LBLW + (8.23 / 84) * (TLW - LBLW);
    ctx.strokeStyle = '#BFA27A'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(phX, 44); ctx.lineTo(phX, H); ctx.stroke();
    fillRR(ctx, phX - 5, 44, 10, 10, 3, '#BFA27A');

    // Tracks
    const tracks = [
      { n: 'VIDEO 1', col: '#1a6e64', h: 50, clips: [{ s: 0, d: 18, l: 'Hook.mp4' }, { s: 19, d: 33, l: 'Main_Content.mp4' }, { s: 53, d: 31, l: 'CTA_Final.mp4' }] },
      { n: 'B-ROLL', col: '#6e1a6e', h: 40, clips: [{ s: 4, d: 10, l: 'broll_gym.mp4' }, { s: 25, d: 14, l: 'broll_outdoor.mp4' }, { s: 60, d: 20, l: 'broll_results.mp4' }] },
      { n: 'MUSIC', col: '#1a3a6e', h: 42, clips: [{ s: 0, d: 84, l: 'Energy_Beats_v2.wav', wav: true }] },
      { n: 'SFX', col: '#5a6e1a', h: 30, clips: [{ s: 0, d: 2, l: 'swoosh' }, { s: 18, d: 1, l: 'hit' }, { s: 52, d: 2, l: 'ding' }] },
      { n: 'CAPTIONS', col: '#6e4a1a', h: 30, clips: [{ s: 1, d: 82, l: 'Auto-Generated (EN)' }] },
    ];
    let tY = 68;
    tracks.forEach(tr => {
      ctx.fillStyle = '#1c1c20'; ctx.fillRect(TLX, tY, LBLW, tr.h);
      ln(ctx, TLX + LBLW, tY, TLX + LBLW, tY + tr.h, '#3a3a40');
      txt(ctx, tr.n, TLX + 8, tY + tr.h / 2 + 4, 'bold 7px -apple-system,sans-serif', '#666');
      tr.clips.forEach(clip => {
        const cx3 = TLX + LBLW + (clip.s / 84) * (TLW - LBLW);
        const cw3 = (clip.d / 84) * (TLW - LBLW) - 2;
        fillRR(ctx, cx3, tY + 2, cw3, tr.h - 4, 3, tr.col + 'cc');
        if (clip.wav) {
          ctx.save(); ctx.beginPath(); rrect(ctx, cx3, tY + 2, cw3, tr.h - 4, 3); ctx.clip();
          waveform(ctx, cx3 + 4, tY + 2, cw3 - 8, tr.h - 4, 'rgba(255,255,255,0.25)', 24);
          ctx.restore();
        }
        if (cw3 > 40 && clip.l) {
          ctx.save(); ctx.beginPath(); rrect(ctx, cx3, tY + 2, cw3, tr.h - 4, 3); ctx.clip();
          txt(ctx, clip.l, cx3 + 7, tY + 14, 'bold 8px -apple-system,sans-serif', 'rgba(255,255,255,0.9)');
          ctx.restore();
        }
        ln(ctx, cx3, tY, cx3, tY + tr.h, '#3a3a40');
      });
      ln(ctx, TLX, tY + tr.h, W, tY + tr.h, '#252528');
      tY += tr.h;
    });
    scanlines(ctx, W, H); return c;
  }

  /* ── 05. SOCIAL PUBLISHING QUEUE ────────────────────────────── */
  function drawPublishingQueue() {
    const W = 1024, H = 640;
    const { c, ctx } = makeCanvas(W, H);
    ctx.fillStyle = '#0d1117'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#161b22'; ctx.fillRect(0, 0, W, 52);
    ln(ctx, 0, 52, W, 52, '#30363d');
    txt(ctx, 'Publishing Queue', 20, 34, 'bold 15px -apple-system,sans-serif', '#e6edf3');
    [['14', 'Scheduled', '#58a6ff'], ['3', 'Published', '#3fb950'], ['7', 'Draft', '#8b949e'], ['0', 'Failed', '#f85149']].forEach(([v, l, col], i) => {
      const sx = W - 452 + i * 112;
      txt(ctx, v, sx, 27, 'bold 15px -apple-system,sans-serif', col);
      txt(ctx, l, sx, 46, '9px -apple-system,sans-serif', '#8b949e');
    });
    ['All', 'Instagram', 'TikTok', 'LinkedIn', 'Twitter'].forEach((p, i) => {
      const active = i === 0;
      txt(ctx, p, 20 + i * 88, 80, active ? 'bold 12px -apple-system,sans-serif' : '12px -apple-system,sans-serif', active ? '#3fb950' : '#8b949e');
    });
    ln(ctx, 0, 88, W, 88, '#21262d');

    const posts = [
      { pl: 'IG', time: 'Today, 9:00 AM', st: 'Published', title: 'The 4AM gym grind hits different 🔥', type: 'Reel', reach: '42.8K', likes: '3.2K' },
      { pl: 'TK', time: 'Today, 12:00 PM', st: 'Published', title: 'POV: You started your fitness journey 🏃', type: 'Video', reach: '18.4K', likes: '2.1K' },
      { pl: 'LI', time: 'Today, 2:00 PM', st: 'Published', title: '3 things I wish I knew before starting', type: 'Article', reach: '4.2K', likes: '312' },
      { pl: 'IG', time: 'Tomorrow, 9:00 AM', st: 'Scheduled', title: 'Week 4 transformation check-in 💪', type: 'Reel' },
      { pl: 'TK', time: 'Tomorrow, 6:00 PM', st: 'Scheduled', title: 'Protein myths you need to stop believing', type: 'Video' },
      { pl: 'IG', time: 'Jun 26, 11:00 AM', st: 'Scheduled', title: 'Behind the scenes: content shoot day', type: 'Story' },
      { pl: 'LI', time: 'Jun 27, 9:00 AM', st: 'Draft', title: 'Why 80% of fitness businesses fail', type: 'Article' },
    ];
    const pCol = { IG: '#e1306c', TK: '#69c9d0', LI: '#0077b5', TW: '#1da1f2' };
    posts.forEach((p, i) => {
      const py = 96 + i * 74; if (py > H - 20) return;
      if (i % 2 === 0) { ctx.fillStyle = '#16212a' + '55'; ctx.fillRect(0, py, W, 72); }
      ln(ctx, 0, py + 72, W, py + 72, '#21262d');
      const pc = pCol[p.pl] || '#8b949e';
      fillRR(ctx, 14, py + 19, 34, 34, 5, pc + '22');
      txt(ctx, p.pl, 31, py + 39, 'bold 10px -apple-system,sans-serif', pc, 'center');
      fillRR(ctx, 58, py + 8, 52, 56, 4, '#21262d');
      gradRect(ctx, 58, py + 8, 52, 56, pc + '33', '#21262d');
      txt(ctx, p.title, 122, py + 28, 'bold 12px -apple-system,sans-serif', '#e6edf3');
      txt(ctx, `${p.type} · ${p.time}`, 122, py + 48, '10px -apple-system,sans-serif', '#8b949e');
      const sc = p.st === 'Published' ? '#3fb950' : p.st === 'Scheduled' ? '#58a6ff' : '#8b949e';
      fillRR(ctx, W - 98, py + 26, 82, 20, 5, sc + '22');
      txt(ctx, p.st, W - 57, py + 40, '10px -apple-system,sans-serif', sc, 'center');
      if (p.reach) {
        txt(ctx, `${p.reach} reach · ${p.likes} likes`, W - 200, py + 40, '10px -apple-system,sans-serif', '#8b949e', 'right');
      }
    });
    scanlines(ctx, W, H); return c;
  }

  /* ── 06. LUXURY REAL ESTATE WEBSITE ─────────────────────────── */
  function drawLuxuryRealEstate() {
    const W = 1024, H = 640;
    const { c, ctx } = makeCanvas(W, H);
    gradRect(ctx, 0, 0, W, H, '#3d2b1f', '#9c6b4e');
    // Architectural vertical lines
    ctx.save(); ctx.globalAlpha = 0.09; ctx.strokeStyle = '#f7d49e'; ctx.lineWidth = 1;
    [W * 0.25, W * 0.5, W * 0.75].forEach(x => { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H * 0.68); ctx.stroke(); });
    ctx.restore();
    // Dark overlays
    const bo = ctx.createLinearGradient(0, H * 0.3, 0, H);
    bo.addColorStop(0, 'rgba(0,0,0,0)'); bo.addColorStop(1, 'rgba(0,0,0,0.94)');
    ctx.fillStyle = bo; ctx.fillRect(0, H * 0.3, W, H * 0.7);
    const no = ctx.createLinearGradient(0, 0, 0, 80);
    no.addColorStop(0, 'rgba(0,0,0,0.7)'); no.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = no; ctx.fillRect(0, 0, W, 80);
    // Navigation
    txt(ctx, 'MERIDIAN', 38, 36, 'bold 13px Georgia,serif', '#F7F3EB');
    txt(ctx, 'ESTATES', 38, 52, '9px Georgia,serif', '#BFA27A');
    ['Properties', 'Services', 'About', 'Contact'].forEach((l, i) => txt(ctx, l, W / 2 - 160 + i * 100, 42, '12px -apple-system,sans-serif', 'rgba(247,243,235,0.75)'));
    strokeRR(ctx, W - 172, 22, 144, 34, 17, 'rgba(247,243,235,0.35)', 1);
    txt(ctx, 'Book Consultation', W - 100, 43, '11px -apple-system,sans-serif', '#F7F3EB', 'center');
    // Exclusive badge
    fillRR(ctx, W - 158, 76, 132, 26, 3, '#BFA27A' + '22');
    strokeRR(ctx, W - 158, 76, 132, 26, 3, '#BFA27A' + '55', 1);
    txt(ctx, 'EXCLUSIVE LISTING', W - 92, 93, '8px -apple-system,sans-serif', '#BFA27A', 'center');
    // Main content
    const HY = H * 0.52;
    txt(ctx, 'Penthouse Residenza', 58, HY, '300 42px Georgia,serif', '#F7F3EB');
    txt(ctx, 'Monte Pinciano, Roma', 58, HY + 52, '300 20px Georgia,serif', 'rgba(247,243,235,0.65)');
    ctx.strokeStyle = '#BFA27A'; ctx.lineWidth = 0.5;
    ctx.beginPath(); ctx.moveTo(58, HY + 70); ctx.lineTo(300, HY + 70); ctx.stroke();
    txt(ctx, '€ 2,400,000', 58, HY + 100, 'bold 28px -apple-system,sans-serif', '#F7F3EB');
    ['4 Bedrooms', '280 m²', '4 Baths', 'Private Terrace'].forEach((d, i) => {
      txt(ctx, '·', 58 + i * 145 - 14, HY + 130, '14px sans-serif', '#BFA27A');
      txt(ctx, d, 58 + i * 145, HY + 130, '11px -apple-system,sans-serif', 'rgba(247,243,235,0.6)');
    });
    fillRR(ctx, 58, HY + 150, 188, 46, 23, '#BFA27A');
    txt(ctx, 'Book Private Viewing', 152, HY + 177, 'bold 12px -apple-system,sans-serif', '#0B0D10', 'center');
    strokeRR(ctx, 256, HY + 150, 162, 46, 23, 'rgba(247,243,235,0.3)', 1);
    txt(ctx, 'View Gallery →', 337, HY + 177, '12px -apple-system,sans-serif', '#F7F3EB', 'center');
    // Thumbnail strip
    [['Living Room', '#5c3d2e', '#3d2b1f'], ['Terrace', '#2e3d5c', '#1f2b3d'], ['Master Suite', '#3d5c2e', '#2b3d1f']].forEach(([name, c1, c2], i) => {
      const tx2 = W - 338 + i * 110;
      gradRect(ctx, tx2, H - 108, 100, 90, c1, c2);
      strokeRR(ctx, tx2, H - 108, 100, 90, 4, 'rgba(191,162,122,0.2)', 0.5);
      txt(ctx, name, tx2 + 8, H - 24, '9px -apple-system,sans-serif', 'rgba(247,243,235,0.65)');
    });
    scanlines(ctx, W, H); return c;
  }

  /* ── 07. BOUTIQUE HOTEL WEBSITE ──────────────────────────────── */
  function drawBoutiqueHotel() {
    const W = 1024, H = 640;
    const { c, ctx } = makeCanvas(W, H);
    gradRect(ctx, 0, 0, W, H, '#0b1a18', '#162e2a');
    const lg = ctx.createRadialGradient(W * 0.8, -40, 0, W * 0.8, -40, W * 0.7);
    lg.addColorStop(0, 'rgba(191,162,122,0.14)'); lg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = lg; ctx.fillRect(0, 0, W, H);
    txt(ctx, '≡', 38, 38, '22px sans-serif', 'rgba(247,243,235,0.55)');
    txt(ctx, 'MAISON ELARA', W / 2, 38, '300 17px Georgia,serif', '#F7F3EB', 'center');
    txt(ctx, 'Reserve', W - 38, 36, '12px -apple-system,sans-serif', '#BFA27A', 'right');
    const CY = H * 0.37;
    ctx.strokeStyle = '#BFA27A'; ctx.lineWidth = 0.5; ctx.globalAlpha = 0.4;
    ctx.beginPath(); ctx.moveTo(W / 2 - 80, CY - 52); ctx.lineTo(W / 2 + 80, CY - 52); ctx.stroke();
    ctx.globalAlpha = 1;
    txt(ctx, 'Where Luxury Meets Nature', W / 2, CY - 30, '300 italic 14px Georgia,serif', 'rgba(247,243,235,0.5)', 'center');
    txt(ctx, 'MAISON', W / 2, CY + 12, '100 62px Georgia,serif', '#F7F3EB', 'center');
    txt(ctx, 'ELARA', W / 2, CY + 76, '100 62px Georgia,serif', '#BFA27A', 'center');
    txt(ctx, 'LAKE COMO  ·  ITALY', W / 2, CY + 108, '300 10px -apple-system,sans-serif', 'rgba(247,243,235,0.35)', 'center');
    ctx.globalAlpha = 0.25; ctx.beginPath(); ctx.moveTo(W / 2 - 80, CY + 122); ctx.lineTo(W / 2 + 80, CY + 122); ctx.stroke();
    ctx.globalAlpha = 1;
    txt(ctx, 'From € 280 / night', W / 2, H * 0.76, '12px -apple-system,sans-serif', 'rgba(247,243,235,0.5)', 'center');
    fillRR(ctx, W / 2 - 88, H * 0.79, 176, 44, 22, '#BFA27A');
    txt(ctx, 'Reserve Now', W / 2, H * 0.79 + 28, 'bold 12px -apple-system,sans-serif', '#0B0D10', 'center');
    // Room grid
    [['Lake Suite', '€280', '#1a4a3e', '#0f2e26'], ['Garden Villa', '€420', '#2e3a1a', '#1a2610'], ['Penthouse', '€680', '#3a2a1a', '#261a10'], ['Heritage', '€220', '#1a2a3a', '#101826']].forEach(([name, price, c1, c2], i) => {
      const rw = (W - 60) / 4 - 10, rx = 28 + i * (rw + 10), ry = H - 100;
      gradRect(ctx, rx, ry, rw, 82, c1, c2);
      strokeRR(ctx, rx, ry, rw, 82, 5, 'rgba(191,162,122,0.18)', 0.5);
      txt(ctx, name, rx + 10, ry + 28, '12px Georgia,serif', '#F7F3EB');
      txt(ctx, price + '/night', rx + 10, ry + 50, '11px -apple-system,sans-serif', '#BFA27A');
      txt(ctx, 'Book →', rx + 10, ry + 72, '9px -apple-system,sans-serif', 'rgba(247,243,235,0.35)');
    });
    scanlines(ctx, W, H); return c;
  }

  /* ── 08. FITNESS COACH LANDING ───────────────────────────────── */
  function drawFitnessCoach() {
    const W = 1024, H = 640;
    const { c, ctx } = makeCanvas(W, H);
    ctx.fillStyle = '#080808'; ctx.fillRect(0, 0, W, H);
    const eg = ctx.createRadialGradient(W * 0.75, 0, 0, W * 0.75, 0, W * 0.65);
    eg.addColorStop(0, 'rgba(234,88,12,0.28)'); eg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = eg; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#111'; ctx.fillRect(0, 0, W, 54);
    ln(ctx, 0, 54, W, 54, '#222');
    txt(ctx, 'APEX PERFORMANCE', 28, 35, 'bold 13px -apple-system,sans-serif', '#fff');
    ['Programs', 'Transformations', 'Nutrition', 'About'].forEach((it, i) => txt(ctx, it, W / 2 - 190 + i * 120, 35, '12px -apple-system,sans-serif', '#555'));
    fillRR(ctx, W - 168, 14, 148, 30, 4, '#ea580c');
    txt(ctx, 'START YOUR JOURNEY', W - 94, 33, 'bold 9px -apple-system,sans-serif', '#fff', 'center');
    const LX = 44;
    txt(ctx, 'TRANSFORM YOUR BODY IN', LX, 132, '200 28px -apple-system,sans-serif', 'rgba(255,255,255,0.35)');
    txt(ctx, '90', LX, 302, 'bold 190px -apple-system,sans-serif', '#ea580c');
    txt(ctx, 'DAYS', LX + 196, 278, 'bold 58px -apple-system,sans-serif', '#fff');
    txt(ctx, 'GUARANTEED RESULTS OR YOUR MONEY BACK', LX, 340, 'bold 11px -apple-system,sans-serif', '#ea580c');
    ['✓ Personalized 90-day program', '✓ Daily AI coaching & check-ins', '✓ Nutrition + meal plan included', '✓ 94% success rate across 2,847 clients'].forEach((it, i) => {
      txt(ctx, it, LX, 378 + i * 30, '13px -apple-system,sans-serif', i === 0 ? '#ea580c' : 'rgba(255,255,255,0.7)');
    });
    fillRR(ctx, LX, 510, 224, 50, 4, '#ea580c');
    txt(ctx, 'START YOUR 90-DAY JOURNEY', LX + 112, 539, 'bold 10px -apple-system,sans-serif', '#fff', 'center');
    strokeRR(ctx, LX + 234, 510, 162, 50, 4, '#ea580c', 1);
    txt(ctx, 'See Transformations', LX + 315, 539, '11px -apple-system,sans-serif', '#ea580c', 'center');
    // Photo grid (right side)
    const RX = W * 0.55, RW = W - RX - 28;
    txt(ctx, '2,847 TRANSFORMATIONS', RX, 88, 'bold 10px -apple-system,sans-serif', '#ea580c');
    const gW = (RW - 10) / 3, gH = 128;
    const pCols = [['#3d2b1a', '#1a1208'], ['#1a2d3d', '#0a1520'], ['#2d3d1a', '#151a08'], ['#3d1a1a', '#1a0808'], ['#1a1a3d', '#08081a'], ['#3d2d1a', '#1a1408']];
    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < 3; col++) {
        const gx = RX + col * (gW + 5), gy = 106 + row * (gH + 6), ci = row * 3 + col;
        gradRect(ctx, gx, gy, gW, gH, pCols[ci][0], pCols[ci][1]);
        if (col === 0 || col === 2) {
          fillRR(ctx, gx + 4, gy + 4, 46, 15, 2, '#00000088');
          txt(ctx, col === 0 ? 'BEFORE' : 'AFTER', gx + 6, gy + 15, 'bold 8px -apple-system,sans-serif', col === 0 ? '#666' : '#ea580c');
        }
        if (col === 2) txt(ctx, `-${[12, 18][row]}kg`, gx + gW / 2, gy + gH - 10, 'bold 12px -apple-system,sans-serif', '#ea580c', 'center');
      }
    }
    fillRR(ctx, RX, 392, RW, 68, 5, '#ea580c' + '10');
    strokeRR(ctx, RX, 392, RW, 68, 5, '#ea580c' + '30', 1);
    txt(ctx, '"I lost 18kg in 12 weeks. Best investment I\'ve ever made."', RX + 12, 418, 'italic 11px Georgia,serif', '#ffffffcc');
    avatar(ctx, RX + 14, 448, 11, '#ea580c', 'JS');
    txt(ctx, 'James S. · Week 12 Graduate', RX + 32, 453, '10px -apple-system,sans-serif', '#666');
    txt(ctx, '★★★★★', RX + RW - 78, 452, '12px sans-serif', '#f59e0b');
    scanlines(ctx, W, H); return c;
  }

  /* ── 09. RESTAURANT FINE DINING ──────────────────────────────── */
  function drawRestaurant() {
    const W = 1024, H = 640;
    const { c, ctx } = makeCanvas(W, H);
    gradRect(ctx, 0, 0, W, H, '#1a0f08', '#0a0804');
    [[W * 0.3, H * 0.4], [W * 0.7, H * 0.3], [W * 0.5, H * 0.62]].forEach(([gx, gy]) => {
      const g = ctx.createRadialGradient(gx, gy, 0, gx, gy, 200);
      g.addColorStop(0, 'rgba(191,130,50,0.14)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    });
    txt(ctx, 'OSTERIA BELLACORTE', W / 2, 36, '300 15px Georgia,serif', '#BFA27A', 'center');
    txt(ctx, 'Reservations  ·  Menu  ·  Events  ·  Cellar', W / 2, 55, '10px -apple-system,sans-serif', 'rgba(191,162,122,0.35)', 'center');
    ln(ctx, 60, 63, W - 60, 63, 'rgba(191,162,122,0.12)');
    // Left — food visual
    const LW = W * 0.44;
    gradRect(ctx, 0, 72, LW - 18, H - 90, '#3d2510', '#100c06');
    const pg = ctx.createRadialGradient(LW * 0.45, H * 0.5, 0, LW * 0.45, H * 0.5, 130);
    pg.addColorStop(0, '#1a1006'); pg.addColorStop(0.5, '#231408'); pg.addColorStop(1, 'transparent');
    ctx.fillStyle = pg; ctx.beginPath(); ctx.arc(LW * 0.45, H * 0.5, 112, 0, Math.PI * 2); ctx.fill();
    ctx.save(); ctx.globalAlpha = 0.5;
    fillRR(ctx, LW * 0.45 - 60, H - 96, 120, 34, 3, 'rgba(191,162,122,0.12)');
    ctx.restore();
    txt(ctx, '✦ MICHELIN GUIDE 2025', LW * 0.45, H - 73, '8px -apple-system,sans-serif', '#BFA27A', 'center');
    // Right — content
    const RX = LW + 18, RW = W - RX - 28;
    txt(ctx, '★ 1 Michelin Star  ·  Top 50 Italy', RX, 100, '10px -apple-system,sans-serif', '#BFA27A');
    ln(ctx, RX, 112, RX + RW, 112, 'rgba(191,162,122,0.12)');
    txt(ctx, 'An Experience', RX, 155, '300 30px Georgia,serif', '#F7F3EB');
    txt(ctx, 'Beyond Dining', RX, 190, '300 italic 30px Georgia,serif', '#BFA27A');
    txt(ctx, 'Chef Marco Bellacorte invites you on a journey', RX, 226, '11px -apple-system,sans-serif', 'rgba(247,243,235,0.5)');
    txt(ctx, 'through the flavors of Puglia, reimagined.', RX, 244, '11px -apple-system,sans-serif', 'rgba(247,243,235,0.5)');
    ln(ctx, RX, 264, RX + RW, 264, 'rgba(191,162,122,0.1)');
    const menu = [
      { n: 'Crudo di Mare', d: 'Raw seafood, citrus caviar, sea herbs', p: '€ 32' },
      { n: 'Pasta Nera', d: 'Squid ink fettuccine, lobster bisque, bottarga', p: '€ 44' },
      { n: 'Agnello in Crosta', d: 'Lamb, herb crust, truffle jus, root vegetables', p: '€ 58' },
    ];
    menu.forEach((item, i) => {
      const my = 284 + i * 56;
      txt(ctx, item.n, RX, my, 'bold 13px Georgia,serif', '#F7F3EB');
      txt(ctx, item.d, RX, my + 20, '10px -apple-system,sans-serif', 'rgba(247,243,235,0.38)');
      txt(ctx, item.p, RX + RW, my, '13px -apple-system,sans-serif', '#BFA27A', 'right');
      ln(ctx, RX, my + 38, RX + RW, my + 38, 'rgba(191,162,122,0.08)');
    });
    txt(ctx, 'View Full Menu →', RX, 458, '11px -apple-system,sans-serif', '#BFA27A');
    fillRR(ctx, RX, 476, RW, 108, 7, '#1a1208');
    strokeRR(ctx, RX, 476, RW, 108, 7, 'rgba(191,162,122,0.18)', 1);
    txt(ctx, 'Reserve Your Table', RX + 14, 498, 'bold 12px -apple-system,sans-serif', '#F7F3EB');
    ['Date', 'Time', 'Guests'].forEach((f, i) => {
      const fx = RX + 14 + i * (RW / 3 - 2), fw = RW / 3 - 14;
      fillRR(ctx, fx, 510, fw, 28, 4, '#0a0804'); strokeRR(ctx, fx, 510, fw, 28, 4, 'rgba(191,162,122,0.15)', 1);
      txt(ctx, f === 'Date' ? 'Fri, 28 Jun' : f === 'Time' ? '8:00 PM' : '2 guests', fx + 8, 528, '10px -apple-system,sans-serif', 'rgba(247,243,235,0.55)');
    });
    fillRR(ctx, RX + 14, 548, RW - 28, 28, 4, '#BFA27A');
    txt(ctx, 'Confirm Reservation', RX + 14 + (RW - 28) / 2, 566, 'bold 10px -apple-system,sans-serif', '#0B0D10', 'center');
    scanlines(ctx, W, H); return c;
  }

  /* ── 10. E-COMMERCE PRODUCT PAGE ─────────────────────────────── */
  function drawEcommerce() {
    const W = 1024, H = 640;
    const { c, ctx } = makeCanvas(W, H);
    ctx.fillStyle = '#faf9f7'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, 50);
    ln(ctx, 0, 50, W, 50, '#e5e7eb');
    txt(ctx, 'LUMIÈRE', 28, 33, 'bold 14px Georgia,serif', '#1a1a1a');
    ['Products', 'Ingredients', 'Rituals', 'About'].forEach((l, i) => txt(ctx, l, 150 + i * 100, 32, '11px -apple-system,sans-serif', '#666'));
    txt(ctx, '🔍  🛒', W - 55, 32, '13px sans-serif', '#666');
    // Product area left
    gradRect(ctx, 18, 58, 420, 546, '#f5f0e8', '#ede7db');
    // Bottle
    const bottleGrad = ctx.createLinearGradient(190, 160, 280, 490);
    bottleGrad.addColorStop(0, '#d4a853'); bottleGrad.addColorStop(0.5, '#BFA27A'); bottleGrad.addColorStop(1, '#8a6a3e');
    fillRR(ctx, 188, 160, 100, 340, 18, '#BFA27A');
    ctx.fillStyle = bottleGrad; rrect(ctx, 188, 160, 100, 340, 18); ctx.fill();
    fillRR(ctx, 196, 140, 84, 28, 5, '#8a6a3e');
    ctx.fillStyle = '#fff'; ctx.fillRect(194, 278, 88, 96);
    txt(ctx, 'LUMIÈRE', 238, 302, 'bold 8px Georgia,serif', '#1a1a1a', 'center');
    txt(ctx, 'FACE OIL', 238, 316, '6px -apple-system,sans-serif', '#666', 'center');
    txt(ctx, '30ml', 238, 336, '8px -apple-system,sans-serif', '#999', 'center');
    [0, 1, 2, 3].forEach(i => {
      const tc = ['#f5f0e8', '#ede7db', '#f0ece4', '#e8e4dc'][i];
      gradRect(ctx, 28 + i * 102, H - 60, 92, 50, tc, '#d4c8b8');
      if (i === 0) strokeRR(ctx, 28 + i * 102, H - 60, 92, 50, 3, '#BFA27A', 1.5);
    });
    // Product details right
    const RX = 456;
    txt(ctx, 'Skincare / Face Oils / Best Sellers', RX, 78, '10px -apple-system,sans-serif', '#999');
    txt(ctx, 'Golden Hour', RX, 112, '300 34px Georgia,serif', '#1a1a1a');
    txt(ctx, 'Luxe Face Oil', RX, 148, '300 34px Georgia,serif', '#1a1a1a');
    txt(ctx, '★★★★★', RX, 170, '13px sans-serif', '#BFA27A');
    txt(ctx, '4.9 (247 reviews)', RX + 80, 170, '11px -apple-system,sans-serif', '#666');
    txt(ctx, '🏆 Vogue Beauty Awards 2025', RX, 190, '10px -apple-system,sans-serif', '#BFA27A');
    txt(ctx, '£ 68.00', RX, 224, 'bold 26px -apple-system,sans-serif', '#1a1a1a');
    txt(ctx, 'Save £12 with subscription', RX + 96, 224, '10px -apple-system,sans-serif', '#3b82f6');
    txt(ctx, 'Size', RX, 256, 'bold 10px -apple-system,sans-serif', '#1a1a1a');
    [['30ml', '£68'], ['50ml', '£98'], ['100ml', '£178']].forEach(([sz, pr], i) => {
      fillRR(ctx, RX + i * 104, 264, 96, 34, 3, i === 0 ? '#1a1a1a' : '#f5f0e8');
      strokeRR(ctx, RX + i * 104, 264, 96, 34, 3, i === 0 ? '#1a1a1a' : '#e5e7eb', 1);
      txt(ctx, sz, RX + i * 104 + 22, 282, 'bold 10px -apple-system,sans-serif', i === 0 ? '#fff' : '#1a1a1a');
      txt(ctx, pr, RX + i * 104 + 22, 296, '9px -apple-system,sans-serif', i === 0 ? '#fff' : '#999');
    });
    ln(ctx, RX, 312, W - 18, 312, '#e5e7eb');
    txt(ctx, 'Key Benefits', RX, 332, 'bold 10px -apple-system,sans-serif', '#1a1a1a');
    ['24K Gold Micro-Particles', 'Bakuchiol (Natural Retinol)', 'Sea Buckthorn + Rosehip', 'Certified Organic · Vegan'].forEach((b, i) => {
      txt(ctx, '✓', RX + (i % 2) * 194, 356 + Math.floor(i / 2) * 22, '10px sans-serif', '#BFA27A');
      txt(ctx, b, RX + (i % 2) * 194 + 14, 356 + Math.floor(i / 2) * 22, '10px -apple-system,sans-serif', '#444');
    });
    ln(ctx, RX, 404, W - 18, 404, '#e5e7eb');
    fillRR(ctx, RX, 416, 278, 50, 4, '#1a1a1a');
    txt(ctx, 'Add to Bag — £68', RX + 139, 445, 'bold 12px -apple-system,sans-serif', '#fff', 'center');
    fillRR(ctx, RX + 288, 416, 50, 50, 4, '#f5f0e8'); strokeRR(ctx, RX + 288, 416, 50, 50, 4, '#e5e7eb', 1);
    txt(ctx, '♡', RX + 313, 445, '18px sans-serif', '#1a1a1a', 'center');
    txt(ctx, '✓ Free shipping over £50  ·  ✓ 30-day returns  ·  ✓ Luxury packaging', RX, 482, '9px -apple-system,sans-serif', '#999');
    ln(ctx, RX, 496, W - 18, 496, '#e5e7eb');
    txt(ctx, '"Completely transformed my skin in 4 weeks. Worth every penny."', RX, 518, 'italic 10px Georgia,serif', '#444');
    txt(ctx, '— Sophie L., Verified Purchase · ★★★★★', RX, 534, '9px -apple-system,sans-serif', '#999');
    scanlines(ctx, W, H); return c;
  }

  /* ── 11. ACTIVE AI CALL INTERFACE ─────────────────────────────── */
  function drawActiveCall(seed) {
    seed = seed || 0;
    const W = 1024, H = 640;
    const { c, ctx } = makeCanvas(W, H);
    gradRect(ctx, 0, 0, W, H, '#0b0d10', '#0b1210');
    const ag = ctx.createRadialGradient(W / 2, H * 0.3, 0, W / 2, H * 0.3, 320);
    ag.addColorStop(0, 'rgba(26,158,143,0.1)'); ag.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = ag; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#161b22'; ctx.fillRect(0, 0, W, 50); ln(ctx, 0, 50, W, 50, '#30363d');
    txt(ctx, 'KLLEZO', 18, 32, 'bold 12px -apple-system,sans-serif', '#BFA27A');
    txt(ctx, 'AI Calling Agent', 70, 32, '11px -apple-system,sans-serif', '#8b949e');
    fillRR(ctx, W / 2 - 50, 14, 100, 22, 11, '#3fb950' + '22'); strokeRR(ctx, W / 2 - 50, 14, 100, 22, 11, '#3fb950' + '55', 1);
    dot(ctx, W / 2 - 36, 25, 4, '#3fb950');
    txt(ctx, 'LIVE', W / 2 - 24, 29, 'bold 9px -apple-system,sans-serif', '#3fb950');
    const sec = 167 + Math.floor(seed * 3), mn = Math.floor(sec / 60), ss = sec % 60;
    txt(ctx, `0${mn}:${ss.toString().padStart(2, '0')}`, W / 2 + 6, 29, 'bold 9px -apple-system,sans-serif', '#8b949e');
    txt(ctx, 'Calls: 47  ·  Qualified: 12  ·  Booked: 8', W - 18, 32, '9px -apple-system,sans-serif', '#8b949e', 'right');
    // Left column — contact card
    const LW = W * 0.38;
    fillRR(ctx, 18, 62, LW - 26, 238, 9, '#161b22'); strokeRR(ctx, 18, 62, LW - 26, 238, 9, '#30363d');
    const ag2 = ctx.createLinearGradient(50, 88, 118, 158);
    ag2.addColorStop(0, '#1a6e64'); ag2.addColorStop(1, '#0d4a42');
    ctx.fillStyle = ag2; ctx.beginPath(); ctx.arc(78, 128, 34, 0, Math.PI * 2); ctx.fill();
    txt(ctx, 'SC', 78, 136, 'bold 19px -apple-system,sans-serif', '#fff', 'center');
    txt(ctx, 'Sarah Chen', 126, 106, 'bold 15px -apple-system,sans-serif', '#e6edf3');
    txt(ctx, 'Organic Lead · Fitness Enquiry', 126, 126, '10px -apple-system,sans-serif', '#8b949e');
    txt(ctx, '📍 Manchester, UK', 126, 146, '10px -apple-system,sans-serif', '#8b949e');
    txt(ctx, 'Contact Form Submission', 126, 164, '10px -apple-system,sans-serif', '#8b949e');
    txt(ctx, 'Lead Score', 28, 196, '9px -apple-system,sans-serif', '#8b949e');
    txt(ctx, '87 / 100', LW - 34, 196, 'bold 10px -apple-system,sans-serif', '#3fb950', 'right');
    progressBar(ctx, 28, 204, LW - 52, 8, 0.87, '#21262d', '#3fb950', 4);
    const stages = ['New', 'Contacted', 'Qualifying', 'Booking', 'Won'];
    stages.forEach((s, i) => {
      const sx = 28 + i * ((LW - 56) / 4);
      dot(ctx, sx, 234, i <= 2 ? 6 : 4, i <= 2 ? '#1a9e8f' : '#30363d');
      if (i < 4) ln(ctx, sx + 6, 234, sx + (LW - 56) / 4 - 6, 234, i < 2 ? '#1a9e8f' : '#30363d', 1);
      txt(ctx, s, sx, 252, '7px -apple-system,sans-serif', i === 2 ? '#1a9e8f' : '#8b949e', 'center');
    });
    // AI notes
    fillRR(ctx, 18, 312, LW - 26, 152, 8, '#161b22'); strokeRR(ctx, 18, 312, LW - 26, 152, 8, '#30363d');
    txt(ctx, 'AI Notes (Auto-Generated)', 30, 333, 'bold 9px -apple-system,sans-serif', '#8b949e');
    const notes = ['✓ Goal: weight loss before August wedding', '✓ Tried gym before, needs accountability', '✓ Budget flexible — "worth it if it works"', '→ Offer: 12-Week Bridal Package'];
    notes.forEach((n, i) => txt(ctx, n, 30, 354 + i * 24, '9px -apple-system,sans-serif', i < 3 ? '#e6edf3' : '#BFA27A'));
    // Action buttons
    [['Book Appointment', '#238636'], ['Transfer to Human', '#1a6e64'], ['End Call', '#b91c1c']].forEach(([lbl, col], i) => {
      fillRR(ctx, 18, 478 + i * 44, LW - 26, 36, 5, col + '22'); strokeRR(ctx, 18, 478 + i * 44, LW - 26, 36, 5, col + '55', 1);
      txt(ctx, lbl, LW / 2, 500 + i * 44, 'bold 10px -apple-system,sans-serif', col, 'center');
    });
    // Right — waveform + transcript
    const WX = LW + 10, WW = W - LW - 28;
    fillRR(ctx, WX, 62, WW, 136, 8, '#161b22'); strokeRR(ctx, WX, 62, WW, 136, 8, '#30363d');
    txt(ctx, 'Voice Activity', WX + 14, 82, 'bold 10px -apple-system,sans-serif', '#8b949e');
    txt(ctx, '● Recording', WX + WW - 14, 82, 'bold 9px -apple-system,sans-serif', '#3fb950', 'right');
    waveform(ctx, WX + 14, WX > 400 ? 95 : 95, WW - 28, 80, '#1a9e8f', seed * 10);
    const TY = 210, TH = H - TY - 14;
    fillRR(ctx, WX, TY, WW, TH, 8, '#161b22'); strokeRR(ctx, WX, TY, WW, TH, 8, '#30363d');
    txt(ctx, 'Live Transcript', WX + 14, TY + 22, 'bold 10px -apple-system,sans-serif', '#8b949e');
    const transcript = [
      ['0:00', 'AI', 'Hi Sarah, this is Alex from KLLEZO. You enquired about our 12-week program.'],
      ['0:12', 'SC', 'Yes, perfect! I was just thinking about it actually.'],
      ['0:18', 'AI', 'Fantastic! What\'s your main goal — weight loss, muscle, or general fitness?'],
      ['0:29', 'SC', 'Weight loss mainly. I have a wedding in August and want to feel confident.'],
      ['0:38', 'AI', 'Perfect timing! We have a 12-week bridal program with 94% success rate.'],
      ['0:46', 'SC', 'That sounds exactly what I need. What\'s involved exactly?'],
      ['0:52', 'AI', 'Daily personalized workouts, nutrition plan, and daily check-in with your coach.'],
      ['1:03', 'SC', 'And how much does it cost?'],
      ['1:07', 'AI', 'The bridal package starts at £497. Should I check Tuesday availability for a call?'],
    ];
    const visibleLines = transcript.slice(0, Math.min(transcript.length, 9));
    visibleLines.forEach((line, i) => {
      const ly = TY + 44 + i * 22; if (ly > TY + TH - 16) return;
      const nc = line[1] === 'AI' ? '#1a9e8f' : '#BFA27A';
      txt(ctx, line[0], WX + 14, ly, '8px monospace', '#8b949e');
      txt(ctx, line[1] === 'AI' ? 'AGENT' : 'SARAH', WX + 50, ly, 'bold 8px -apple-system,sans-serif', nc);
      txt(ctx, line[2], WX + 102, ly, '9px -apple-system,sans-serif', i > 5 ? '#e6edf3' : '#8b949e');
    });
    if (Math.floor(seed * 2) % 2 === 0) txt(ctx, '▌', WX + 560, TY + 44 + 8 * 22, '9px sans-serif', '#1a9e8f');
    scanlines(ctx, W, H); return c;
  }

  /* ── 12. CRM LEAD PIPELINE ───────────────────────────────────── */
  function drawCRMPipeline() {
    const W = 1024, H = 640;
    const { c, ctx } = makeCanvas(W, H);
    ctx.fillStyle = '#0d1117'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#161b22'; ctx.fillRect(0, 0, W, 50); ln(ctx, 0, 50, W, 50, '#30363d');
    txt(ctx, 'Lead Pipeline — AI Calling', 18, 33, 'bold 14px -apple-system,sans-serif', '#e6edf3');
    txt(ctx, 'This Week: 47 calls · 12 qualified · 8 booked · £18,400 pipeline', W - 18, 33, '10px -apple-system,sans-serif', '#8b949e', 'right');
    const stages = [
      { n: 'New Leads', col: '#8b949e', cnt: 18, leads: [{ nm: 'Emma Rodriguez', src: 'Instagram', val: '£2,400' }, { nm: 'James Wilson', src: 'Google Ad', val: '£1,800' }, { nm: 'Priya Sharma', src: 'Referral', val: '£3,200' }] },
      { n: 'AI Contacted', col: '#58a6ff', cnt: 12, leads: [{ nm: 'Sarah Chen', src: 'Contact Form', val: '£2,800', live: true }, { nm: 'Mike Okafor', src: 'Facebook', val: '£2,200' }] },
      { n: 'Qualified', col: '#f59e0b', cnt: 8, leads: [{ nm: 'David Park', src: 'Referral', val: '£4,200' }, { nm: 'Anna Silva', src: 'Google', val: '£2,800' }] },
      { n: 'Appointment Set', col: '#3fb950', cnt: 6, leads: [{ nm: 'Rachel Green', src: 'Referral', val: '£3,600' }, { nm: 'Matt Johnson', src: 'Google', val: '£2,400' }] },
      { n: 'Won', col: '#BFA27A', cnt: 3, leads: [{ nm: 'Oliver Fox', src: 'Instagram', val: '£4,800' }] },
    ];
    const cW = W / 5;
    stages.forEach((st, si) => {
      const sx = si * cW + 5, sw = cW - 10;
      fillRR(ctx, sx, 58, sw, 34, 5, st.col + '22');
      txt(ctx, st.n, sx + 10, 78, 'bold 10px -apple-system,sans-serif', st.col);
      fillRR(ctx, sx + sw - 32, 65, 26, 18, 9, st.col + '33');
      txt(ctx, st.cnt, sx + sw - 19, 78, 'bold 9px -apple-system,sans-serif', st.col, 'center');
      st.leads.forEach((ld, li) => {
        const cy = 100 + li * 108; if (cy + 100 > H - 44) return;
        fillRR(ctx, sx, cy, sw, 100, 5, ld.live ? st.col + '18' : '#161b22');
        strokeRR(ctx, sx, cy, sw, 100, 5, ld.live ? st.col + '88' : '#30363d', ld.live ? 1.5 : 1);
        if (ld.live) { fillRR(ctx, sx + sw - 12, cy + 6, 8, 8, 4, '#3fb950'); txt(ctx, 'LIVE', sx + sw - 38, cy + 14, 'bold 7px sans-serif', '#3fb950'); }
        const ic = ld.nm.split(' ').map(n => n[0]).join('');
        avatar(ctx, sx + 18, cy + 28, 14, st.col + '44', ic, st.col);
        txt(ctx, ld.nm, sx + 38, cy + 22, 'bold 10px -apple-system,sans-serif', '#e6edf3');
        txt(ctx, ld.src, sx + 38, cy + 38, '8px -apple-system,sans-serif', '#8b949e');
        txt(ctx, ld.val, sx + 10, cy + 58, 'bold 12px -apple-system,sans-serif', '#BFA27A');
        txt(ctx, 'pipeline value', sx + 10, cy + 74, '8px -apple-system,sans-serif', '#8b949e');
        progressBar(ctx, sx + 10, cy + 86, sw - 20, 4, [0.15, 0.38, 0.62, 0.80, 0.95][si], '#21262d', st.col + 'aa', 2);
      });
      if (st.cnt > st.leads.length) txt(ctx, `+${st.cnt - st.leads.length} more`, sx + sw / 2, 100 + st.leads.length * 108 + 14, '9px -apple-system,sans-serif', '#8b949e', 'center');
    });
    ctx.fillStyle = '#161b22'; ctx.fillRect(0, H - 36, W, 36); ln(ctx, 0, H - 36, W, H - 36, '#30363d');
    txt(ctx, 'Total Pipeline: £18,400  ·  Conversion Rate: 18.7%  ·  Avg Close: 4.2 days', W / 2, H - 12, '10px -apple-system,sans-serif', '#8b949e', 'center');
    scanlines(ctx, W, H); return c;
  }

  /* ── 13. WHATSAPP CONVERSATION ───────────────────────────────── */
  function drawWhatsApp(seed) {
    seed = seed || 0;
    const W = 640, H = 1138;
    const { c, ctx } = makeCanvas(W, H);
    ctx.fillStyle = '#111b21'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#1f2c34'; ctx.fillRect(0, 0, W, 68);
    txt(ctx, '←', 18, 43, '17px sans-serif', '#aebac1');
    avatar(ctx, 62, 34, 21, '#3a6a6e', 'ER');
    txt(ctx, 'Emma Rodriguez', 92, 28, 'bold 14px -apple-system,sans-serif', '#e9edef');
    txt(ctx, 'online', 92, 47, '12px -apple-system,sans-serif', '#00a884');
    txt(ctx, '📞', W - 98, 38, '15px sans-serif', '#aebac1');
    txt(ctx, '🔍', W - 60, 38, '15px sans-serif', '#aebac1');
    txt(ctx, '⋮', W - 26, 42, '19px sans-serif', '#aebac1');
    ctx.fillStyle = '#0b141a'; ctx.fillRect(0, 68, W, H - 136);
    fillRR(ctx, W / 2 - 52, 84, 104, 20, 10, '#111b21cc');
    txt(ctx, 'Today', W / 2, 98, '10px -apple-system,sans-serif', '#8696a0', 'center');
    const msgs = [
      { f: 'them', txt: 'Hi! I saw your ad about the business growth\npackage. Can you tell me more about it?' },
      { f: 'ai', txt: "Hi Emma! Thanks for reaching out 😊 I'm Alex\nfrom KLLEZO. We help businesses grow through\ncontent, websites and AI systems.\n\nWhich area interests you most?" },
      { f: 'them', txt: 'Mainly my website and getting more leads\nhonestly. My current site is embarrassing 😅' },
      { f: 'ai', txt: "That's exactly our specialty! We build premium\nwebsites designed to convert visitors into leads,\nthen use AI to follow up automatically 24/7.\n\nWould you like to see some examples?" },
      { f: 'them', txt: 'Yes please!' },
      { f: 'ai', txt: "Would you be open to a quick 15-minute strategy\ncall this week? I can show you exactly what\nwe'd do for your specific business." },
      { f: 'them', txt: 'Sure, Tuesday works for me' },
      { f: 'ai', txt: 'Checking Tuesday availability...' },
    ];
    let mY = 116;
    const times = ['10:24 AM', '10:24 AM', '10:25 AM', '10:26 AM', '10:26 AM', '10:27 AM', '10:28 AM', '10:28 AM'];
    msgs.forEach((m, mi) => {
      const isAI = m.f === 'ai';
      const lines = m.txt.split('\n');
      const maxW = W * 0.74;
      ctx.font = '13px -apple-system,sans-serif';
      const lineW = Math.max(...lines.map(l => ctx.measureText(l).width + 44), 120);
      const bW = Math.min(maxW, lineW);
      const bH = lines.length * 19 + 28;
      const bX = isAI ? W - bW - 14 : 14;
      fillRR(ctx, bX, mY, bW, bH, 8, isAI ? '#005c4b' : '#202c33');
      lines.forEach((line, li) => txt(ctx, line, bX + 14, mY + 19 + li * 19, '13px -apple-system,sans-serif', '#e9edef'));
      txt(ctx, times[mi] + (isAI ? ' ✓✓' : ''), bX + bW - 10, mY + bH - 6, '10px -apple-system,sans-serif', isAI ? '#53bdeb' : '#8696a0', 'right');
      mY += bH + 8;
    });
    // Booking confirmation card
    fillRR(ctx, 18, mY, W - 36, 80, 9, '#202c33'); strokeRR(ctx, 18, mY, W - 36, 80, 9, '#00a884' + '55', 2);
    txt(ctx, '✅ Appointment Confirmed', 36, mY + 24, 'bold 13px -apple-system,sans-serif', '#00a884');
    txt(ctx, 'Tuesday, 24 June · 3:00 PM', 36, mY + 46, '12px -apple-system,sans-serif', '#e9edef');
    txt(ctx, 'Google Meet link sent to your email', 36, mY + 64, '10px -apple-system,sans-serif', '#8696a0');
    txt(ctx, '📅', W - 48, mY + 40, '22px sans-serif', '#00a884', 'center');
    mY += 90;
    const fm = "Done! Booked for Tuesday 3pm 🎯\nConfirmation + prep guide sent to\nyour email. See you then!";
    const fL = fm.split('\n'), fH = fL.length * 19 + 28, fW = 310;
    fillRR(ctx, W - fW - 14, mY, fW, fH, 8, '#005c4b');
    fL.forEach((l, li) => txt(ctx, l, W - fW, mY + 19 + li * 19, '13px -apple-system,sans-serif', '#e9edef'));
    txt(ctx, '10:29 AM ✓✓', W - 18, mY + fH - 6, '10px -apple-system,sans-serif', '#53bdeb', 'right');
    // Input
    ctx.fillStyle = '#1f2c34'; ctx.fillRect(0, H - 68, W, 68);
    fillRR(ctx, 14, H - 54, W - 96, 38, 19, '#2a3942');
    txt(ctx, '😊', 30, H - 28, '17px sans-serif', '#8696a0');
    txt(ctx, 'Type a message', 58, H - 28, '13px -apple-system,sans-serif', '#8696a0', 'left', 'middle');
    dot(ctx, W - 34, H - 34, 19, '#00a884');
    txt(ctx, '🎤', W - 34, H - 26, '16px sans-serif', '#fff', 'center');
    scanlines(ctx, W, H); return c;
  }

  /* ── 14. MULTI-LEAD DASHBOARD ────────────────────────────────── */
  function drawMultiLeadDashboard() {
    const W = 1024, H = 640;
    const { c, ctx } = makeCanvas(W, H);
    ctx.fillStyle = '#0d1117'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#161b22'; ctx.fillRect(0, 0, W, 50); ln(ctx, 0, 50, W, 50, '#30363d');
    txt(ctx, 'AI Texting — Active Conversations', 18, 33, 'bold 14px -apple-system,sans-serif', '#e6edf3');
    [['24', 'Active', '#58a6ff'], ['94%', 'Response Rate', '#3fb950'], ['8s', 'Avg Reply', '#BFA27A'], ['18', 'Booked Today', '#f59e0b']].forEach(([v, l, col], i) => {
      const sx = W - 420 + i * 102;
      txt(ctx, v, sx, 26, 'bold 13px -apple-system,sans-serif', col);
      txt(ctx, l, sx, 44, '9px -apple-system,sans-serif', '#8b949e');
    });
    const hY = 62;
    ctx.fillStyle = '#161b22'; ctx.fillRect(0, hY, W, 26); ln(ctx, 0, hY + 26, W, hY + 26, '#30363d');
    const hCols = ['Contact', 'Source', 'Status', 'Last Message', 'Time', 'Actions'];
    const hX = [18, 198, 316, 438, 716, 836];
    hCols.forEach((col, i) => txt(ctx, col, hX[i], hY + 18, 'bold 9px -apple-system,sans-serif', '#8b949e'));
    const convs = [
      { nm: 'Emma Rodriguez', src: 'Facebook Ad', st: 'Booking', msg: 'Sure, Tuesday works for me', time: '10:28 AM', col: '#3fb950', hot: false },
      { nm: 'James Wilson', src: 'Google Ad', st: 'Qualifying', msg: 'Interested in the website package', time: '10:31 AM', col: '#f59e0b', hot: false },
      { nm: 'Priya Sharma', src: 'Referral', st: 'New', msg: 'Hi, can you send me more info?', time: '10:33 AM', col: '#58a6ff', hot: true },
      { nm: 'Tom Bradley', src: 'Instagram', st: 'Nurturing', msg: 'What\'s the pricing for the full package?', time: '10:26 AM', col: '#8b5cf6', hot: false },
      { nm: 'Sophie Laurent', src: 'Referral', st: 'Booking', msg: 'Wednesday at 2pm works', time: '10:19 AM', col: '#3fb950', hot: false },
      { nm: 'Alex Kim', src: 'TikTok Ad', st: 'Qualifying', msg: 'Thinking about getting a new website', time: '10:15 AM', col: '#f59e0b', hot: false },
      { nm: 'Rachel Green', src: 'Google Ad', st: 'Won', msg: 'Just transferred the deposit! Excited!', time: '10:08 AM', col: '#BFA27A', hot: false },
      { nm: 'David Park', src: 'Website', st: 'Qualifying', msg: 'Do you work with restaurants?', time: '9:58 AM', col: '#f59e0b', hot: false },
    ];
    convs.forEach((cv, i) => {
      const ry = 92 + i * 50; if (ry > H - 24) return;
      if (i % 2 === 0) { ctx.fillStyle = '#161b22' + '55'; ctx.fillRect(0, ry, W, 48); }
      if (cv.hot) { ctx.fillStyle = '#58a6ff' + '06'; ctx.fillRect(0, ry, W, 48); }
      ln(ctx, 0, ry + 48, W, ry + 48, '#21262d');
      if (cv.hot) dot(ctx, 7, ry + 24, 4, '#58a6ff');
      const ic = cv.nm.split(' ').map(n => n[0]).join('');
      avatar(ctx, 44, ry + 24, 14, cv.col + '44', ic, cv.col);
      txt(ctx, cv.nm, hX[0] + 24, ry + 20, 'bold 11px -apple-system,sans-serif', '#e6edf3');
      txt(ctx, cv.src, hX[0] + 24, ry + 36, '9px -apple-system,sans-serif', '#8b949e');
      txt(ctx, cv.src, hX[1], ry + 26, '10px -apple-system,sans-serif', '#8b949e');
      fillRR(ctx, hX[2], ry + 15, 82, 17, 4, cv.col + '22');
      txt(ctx, cv.st, hX[2] + 41, ry + 27, '9px -apple-system,sans-serif', cv.col, 'center');
      const msg = cv.msg.length > 46 ? cv.msg.substring(0, 44) + '...' : cv.msg;
      txt(ctx, msg, hX[3], ry + 26, '10px -apple-system,sans-serif', cv.hot ? '#e6edf3' : '#8b949e');
      txt(ctx, cv.time, hX[4], ry + 26, '9px -apple-system,sans-serif', '#8b949e');
      fillRR(ctx, hX[5], ry + 14, 54, 20, 4, '#238636' + '33');
      txt(ctx, 'View', hX[5] + 27, ry + 28, '9px -apple-system,sans-serif', '#3fb950', 'center');
    });
    ctx.fillStyle = '#161b22'; ctx.fillRect(0, H - 30, W, 30); ln(ctx, 0, H - 30, W, H - 30, '#30363d');
    txt(ctx, 'AI managing all conversations automatically · Human takeover available at any time', W / 2, H - 10, '9px -apple-system,sans-serif', '#8b949e', 'center');
    scanlines(ctx, W, H); return c;
  }

  /* ── 15. APPOINTMENT BOOKING CALENDAR ────────────────────────── */
  function drawBookingCalendar(seed) {
    seed = seed || 0;
    const W = 1024, H = 640;
    const { c, ctx } = makeCanvas(W, H);
    ctx.fillStyle = '#0d1117'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#161b22'; ctx.fillRect(0, 0, W, 50); ln(ctx, 0, 50, W, 50, '#30363d');
    txt(ctx, 'Booking Calendar', 18, 33, 'bold 14px -apple-system,sans-serif', '#e6edf3');
    txt(ctx, 'June 2025', W / 2, 33, 'bold 12px -apple-system,sans-serif', '#8b949e', 'center');
    txt(ctx, 'Today: 8 bookings  ·  94% fill rate', W - 18, 33, '10px -apple-system,sans-serif', '#8b949e', 'right');
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dates = ['23', '24', '25', '26', '27', '28'];
    const CW = (W - 72) / 6, TW = 72;
    days.forEach((d, i) => {
      const dx = TW + i * CW + CW / 2, isToday = i === 1;
      if (isToday) { fillRR(ctx, TW + i * CW + 3, 56, CW - 6, 42, 5, '#238636' + '22'); }
      txt(ctx, d, dx, 73, '9px -apple-system,sans-serif', isToday ? '#3fb950' : '#8b949e', 'center');
      txt(ctx, dates[i], dx, 93, isToday ? 'bold 14px -apple-system,sans-serif' : '13px -apple-system,sans-serif', isToday ? '#3fb950' : '#e6edf3', 'center');
    });
    ln(ctx, 0, 102, W, 102, '#30363d');
    const SH = 8, EH = 18, SLH = (H - 118) / (EH - SH);
    for (let h = SH; h < EH; h++) {
      const ty = 102 + (h - SH) * SLH;
      txt(ctx, `${h}:00`, 8, ty + 13, '8px -apple-system,sans-serif', '#8b949e');
      ln(ctx, TW, ty, W, ty, '#21262d');
    }
    for (let i = 1; i < 6; i++) ln(ctx, TW + i * CW, 102, TW + i * CW, H, '#21262d');
    const appts = [
      { d: 0, h: 9, dr: 1, nm: 'James Wilson', t: 'Strategy Call', col: '#238636' },
      { d: 0, h: 11, dr: 1.5, nm: 'Priya Sharma', t: 'Website Review', col: '#8b5cf6' },
      { d: 0, h: 14, dr: 1, nm: 'Tom Bradley', t: 'Discovery', col: '#238636' },
      { d: 1, h: 10, dr: 1, nm: 'Emma Rodriguez', t: 'Strategy Call', col: '#238636', isNew: true },
      { d: 1, h: 15, dr: 2, nm: 'David Park', t: 'Full Proposal', col: '#f59e0b' },
      { d: 2, h: 9, dr: 1, nm: 'Alex Kim', t: 'Discovery', col: '#238636' },
      { d: 2, h: 13, dr: 1, nm: 'Rachel Green', t: 'Onboarding', col: '#BFA27A' },
      { d: 3, h: 10, dr: 1, nm: 'Chris Hunt', t: 'Review', col: '#8b5cf6' },
      { d: 3, h: 14, dr: 1.5, nm: 'Aisha Johnson', t: 'Full Proposal', col: '#f59e0b' },
      { d: 4, h: 11, dr: 1, nm: 'Oliver Fox', t: 'Strategy', col: '#238636' },
    ];
    appts.forEach(a => {
      const ax = TW + a.d * CW + 3, ay = 102 + (a.h - SH) * SLH + 2, aw = CW - 6, ah = a.dr * SLH - 4;
      fillRR(ctx, ax, ay, aw, ah, 4, a.col + '30'); strokeRR(ctx, ax, ay, aw, ah, 4, a.col + '80', a.isNew ? 2 : 1);
      if (a.isNew) { fillRR(ctx, ax + aw - 34, ay + 3, 30, 13, 3, '#3fb950' + '44'); txt(ctx, 'NEW', ax + aw - 19, ay + 13, 'bold 6px sans-serif', '#3fb950', 'center'); }
      ctx.save(); ctx.beginPath(); rrect(ctx, ax, ay, aw, ah, 4); ctx.clip();
      txt(ctx, a.nm, ax + 5, ay + 14, 'bold 8px -apple-system,sans-serif', '#e6edf3');
      if (ah > 26) txt(ctx, a.t, ax + 5, ay + 28, '7px -apple-system,sans-serif', a.col);
      ctx.restore();
    });
    [8, 12, 13].forEach(h => {
      const ax = TW + 1 * CW + 3, ay = 102 + (h - SH) * SLH + 2, aw = CW - 6, ah = SLH - 4;
      strokeRR(ctx, ax, ay, aw, ah, 4, '#30363d', 1);
      txt(ctx, '+ Available', ax + aw / 2, ay + SLH * 0.4, '8px -apple-system,sans-serif', '#8b949e55', 'center');
    });
    scanlines(ctx, W, H); return c;
  }

  /* ── 16. NURTURE SEQUENCE BUILDER ────────────────────────────── */
  function drawNurtureSequence() {
    const W = 1024, H = 640;
    const { c, ctx } = makeCanvas(W, H);
    ctx.fillStyle = '#0d1117'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#161b22'; ctx.fillRect(0, 0, 192, H); ln(ctx, 192, 0, 192, H, '#30363d');
    txt(ctx, 'Sequences', 14, 34, 'bold 12px -apple-system,sans-serif', '#e6edf3');
    [['Lead Nurture', true, '247 active'], ['Post-Call Follow', false, '89 active'], ['Win-Back', false, '34 active'], ['Onboarding', false, '12 active']].forEach(([nm, act, cnt], i) => {
      const sy = 54 + i * 46;
      if (act) { ctx.fillStyle = '#238636' + '22'; ctx.fillRect(0, sy, 192, 38); ctx.fillStyle = '#238636'; ctx.fillRect(0, sy, 3, 38); }
      txt(ctx, nm, 14, sy + 16, act ? 'bold 11px -apple-system,sans-serif' : '11px -apple-system,sans-serif', act ? '#3fb950' : '#8b949e');
      txt(ctx, cnt, 14, sy + 32, '9px -apple-system,sans-serif', '#8b949e');
    });
    fillRR(ctx, 10, H - 44, 172, 30, 5, '#238636' + '44');
    txt(ctx, '+ New Sequence', 96, H - 24, 'bold 10px -apple-system,sans-serif', '#3fb950', 'center');
    const MX = 206;
    ctx.fillStyle = '#161b22'; ctx.fillRect(MX, 0, W - MX, 46); ln(ctx, MX, 46, W, 46, '#30363d');
    txt(ctx, 'Lead Nurture Sequence', MX + 14, 30, 'bold 13px -apple-system,sans-serif', '#e6edf3');
    txt(ctx, '247 enrolled  ·  68% open  ·  23% click  ·  8% conversion', W - 18, 30, '9px -apple-system,sans-serif', '#8b949e', 'right');
    const nodes = [
      { ic: '⚡', l: 'TRIGGER', d: 'Form Submitted', col: '#f59e0b' },
      { ic: '⏱', l: 'WAIT', d: 'Immediately', col: '#8b949e' },
      { ic: '💬', l: 'SEND SMS', d: 'Welcome msg\n+ case studies', col: '#3b82f6' },
      { ic: '⏱', l: 'WAIT', d: '2 Days', col: '#8b949e' },
      { ic: '💬', l: 'SEND SMS', d: 'Value msg\n+ success story', col: '#3b82f6' },
      { ic: '↔', l: 'CHECK', d: 'Replied?', col: '#8b5cf6' },
    ];
    const nW = (W - MX - 40) / nodes.length - 8, nH = 92, nY = 68;
    nodes.forEach((nd, i) => {
      const nx = MX + 18 + i * (nW + 8);
      if (i < nodes.length - 1) {
        ln(ctx, nx + nW, nY + nH / 2, nx + nW + 8, nY + nH / 2, '#30363d');
        ctx.fillStyle = '#30363d'; ctx.beginPath();
        ctx.moveTo(nx + nW + 9, nY + nH / 2 - 4); ctx.lineTo(nx + nW + 9, nY + nH / 2 + 4); ctx.lineTo(nx + nW + 14, nY + nH / 2); ctx.closePath(); ctx.fill();
      }
      fillRR(ctx, nx, nY, nW, nH, 7, '#161b22'); strokeRR(ctx, nx, nY, nW, nH, 7, nd.col + '55', 1.5);
      txt(ctx, nd.ic, nx + nW / 2, nY + 24, '19px sans-serif', nd.col, 'center');
      txt(ctx, nd.l, nx + nW / 2, nY + 42, 'bold 8px -apple-system,sans-serif', nd.col, 'center');
      nd.d.split('\n').forEach((dl, di) => txt(ctx, dl, nx + nW / 2, nY + 60 + di * 14, '8px -apple-system,sans-serif', '#e6edf3', 'center'));
    });
    // Branch
    const ckX = MX + 18 + 5 * (nW + 8), ckBot = nY + nH;
    ln(ctx, ckX + nW / 2, ckBot, ckX + nW / 2, ckBot + 28, '#3fb950');
    ln(ctx, ckX + nW / 2, ckBot + 28, ckX + nW * 1.5 + 24, ckBot + 28, '#3fb950');
    txt(ctx, 'YES', ckX + nW / 2 + 30, ckBot + 20, '8px sans-serif', '#3fb950');
    ln(ctx, ckX + nW / 2, ckBot, ckX + nW / 2, ckBot + 56, '#f85149');
    ln(ctx, ckX + nW / 2, ckBot + 56, ckX - nW / 2 - 8, ckBot + 56, '#f85149');
    txt(ctx, 'NO REPLY', ckX + nW / 2 - 84, ckBot + 48, '8px sans-serif', '#f85149');
    [{ l: 'NOTIFY', d: 'Slack alert', col: '#3fb950' }, { l: 'SEND LINK', d: 'Calendly link', col: '#BFA27A' }].forEach((yn, i) => {
      const ynX = ckX + nW * 1.5 + 32 + i * (nW + 8);
      fillRR(ctx, ynX, ckBot + 8, nW, 56, 5, '#161b22'); strokeRR(ctx, ynX, ckBot + 8, nW, 56, 5, yn.col + '55', 1);
      txt(ctx, yn.l, ynX + nW / 2, ckBot + 32, 'bold 8px sans-serif', yn.col, 'center');
      txt(ctx, yn.d, ynX + nW / 2, ckBot + 50, '8px sans-serif', '#8b949e', 'center');
      if (i === 0) ln(ctx, ynX + nW, ckBot + 36, ynX + nW + 8, ckBot + 36, '#30363d');
    });
    fillRR(ctx, ckX - nW - 12, ckBot + 36, nW, 56, 5, '#161b22'); strokeRR(ctx, ckX - nW - 12, ckBot + 36, nW, 56, 5, '#f85149' + '55', 1);
    txt(ctx, 'WAIT 5 DAYS', ckX - nW - 12 + nW / 2, ckBot + 60, 'bold 8px sans-serif', '#f85149', 'center');
    txt(ctx, 'then final SMS', ckX - nW - 12 + nW / 2, ckBot + 76, '8px sans-serif', '#8b949e', 'center');
    // Stats
    const sY = nY + nH + 132;
    txt(ctx, 'Sequence Performance', MX + 14, sY, 'bold 11px -apple-system,sans-serif', '#8b949e');
    ln(ctx, MX + 14, sY + 13, W - 18, sY + 13, '#21262d');
    [['Enrolled', '247', '100%', '#8b949e'], ['SMS 1 Sent', '244', '98.8%', '#3b82f6'], ['SMS 1 Opened', '167', '68.4%', '#3b82f6'], ['Replied', '56', '22.7%', '#3fb950'], ['Booked', '19', '7.7%', '#BFA27A']].forEach((s, i) => {
      const sx = MX + 14 + i * 154;
      txt(ctx, s[0], sx, sY + 32, '8px -apple-system,sans-serif', '#8b949e');
      txt(ctx, s[1], sx, sY + 52, 'bold 15px -apple-system,sans-serif', s[3]);
      txt(ctx, s[2], sx, sY + 68, '9px -apple-system,sans-serif', s[3] + 'aa');
      progressBar(ctx, sx, sY + 76, 140, 4, parseFloat(s[2]) / 100, '#21262d', s[3] + '88', 2);
    });
    scanlines(ctx, W, H); return c;
  }

  /* ── 17. CALL PERFORMANCE DASHBOARD ──────────────────────────── */
  function drawCallDashboard() {
    const W = 1024, H = 640;
    const { c, ctx } = makeCanvas(W, H);
    ctx.fillStyle = '#0d1117'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#161b22'; ctx.fillRect(0, 0, W, 50); ln(ctx, 0, 50, W, 50, '#30363d');
    txt(ctx, 'AI Calling — Performance', 18, 33, 'bold 14px -apple-system,sans-serif', '#e6edf3');
    dot(ctx, W - 82, 25, 4, '#3fb950');
    txt(ctx, 'Live · Today, June 24 2025', W - 70, 33, '10px -apple-system,sans-serif', '#3fb950');
    const kpis = [
      { v: '47', l: 'Calls Made', ch: '+14 today', col: '#58a6ff' },
      { v: '12', l: 'Qualified', ch: '+4 today', col: '#f59e0b' },
      { v: '8', l: 'Appointments', ch: '+3 today', col: '#3fb950' },
      { v: '3', l: 'Deals Closed', ch: 'new', col: '#BFA27A' },
      { v: '£8,400', l: 'Revenue', ch: '▲ generated', col: '#BFA27A' },
    ];
    const kW = (W - 38) / 5 - 7;
    kpis.forEach((k, i) => {
      const kx = 18 + i * (kW + 7);
      fillRR(ctx, kx, 60, kW, 92, 7, '#161b22'); strokeRR(ctx, kx, 60, kW, 92, 7, '#30363d');
      txt(ctx, k.v, kx + 14, 96, 'bold 24px -apple-system,sans-serif', k.col);
      txt(ctx, k.l, kx + 14, 116, 'bold 9px -apple-system,sans-serif', '#e6edf3');
      txt(ctx, k.ch, kx + 14, 132, '9px -apple-system,sans-serif', k.col + 'aa');
    });
    const CY = 174, CW2 = W - 38, CH = 130;
    txt(ctx, 'Calls by Hour', 18, CY - 7, 'bold 10px -apple-system,sans-serif', '#e6edf3');
    const hourData = [0,0,0,0,0,0,0,0,3,7,9,8,6,7,5,2,0,0,0,0,0,0,0,0];
    const bW2 = CW2 / 24 - 1;
    hourData.forEach((v, h) => {
      const bh = v > 0 ? (v / 10) * (CH - 16) : 2;
      fillRR(ctx, 18 + h * (CW2 / 24), CY + CH - bh - 4, bW2, bh, 2, h >= 8 && h <= 16 ? '#1a9e8f' : '#21262d');
      if (h % 4 === 0) txt(ctx, `${h}:00`, 18 + h * (CW2 / 24), CY + CH + 14, '7px sans-serif', '#8b949e');
    });
    const aY = 336;
    txt(ctx, 'Active Calls Now', 18, aY, 'bold 11px -apple-system,sans-serif', '#e6edf3');
    [['Sarah Chen', '2:47', 'Qualifying', 87], ['Mike Okafor', '1:12', 'Intro', 42], ['Lucy Barnes', '4:18', 'Booking', 94]].forEach((cl, i) => {
      const cy = aY + 22 + i * 58;
      fillRR(ctx, 18, cy, 440, 50, 5, '#161b22'); strokeRR(ctx, 18, cy, 440, 50, 5, '#3fb950' + '55', 1);
      dot(ctx, 33, cy + 25, 5, '#3fb950');
      ctx.save(); ctx.globalAlpha = 0.25; dot(ctx, 33, cy + 25, 10, '#3fb950'); ctx.restore();
      avatar(ctx, 60, cy + 25, 14, '#1a6e64', cl[0].split(' ').map(n => n[0]).join(''));
      txt(ctx, cl[0], 84, cy + 18, 'bold 11px -apple-system,sans-serif', '#e6edf3');
      txt(ctx, `${cl[2]} · ${cl[1]}`, 84, cy + 36, '9px -apple-system,sans-serif', '#8b949e');
      txt(ctx, `Score: ${cl[3]}`, 360, cy + 18, 'bold 11px -apple-system,sans-serif', cl[3] > 70 ? '#3fb950' : '#f59e0b', 'right');
      progressBar(ctx, 298, cy + 32, 140, 5, cl[3] / 100, '#21262d', cl[3] > 70 ? '#3fb950' : '#f59e0b', 2);
    });
    const RX = 476;
    txt(ctx, 'Recent Results', RX, aY, 'bold 11px -apple-system,sans-serif', '#e6edf3');
    [['Emma R.', 'Booked', '10:28', '£2,800'], ['David P.', 'Qualified', '10:15', '£4,200'], ['Chris H.', 'Booked', '9:52', '£1,800'], ['Rachel G.', 'Won', '9:34', '£3,600'], ['James W.', 'No Answer', '9:18', '—'], ['Aisha J.', 'Qualified', '9:02', '£2,200']].forEach((r, i) => {
      const ry = aY + 26 + i * 38;
      const oc = { Booked: '#3fb950', Won: '#BFA27A', Qualified: '#f59e0b', 'No Answer': '#8b949e' };
      txt(ctx, r[0], RX, ry, 'bold 10px -apple-system,sans-serif', '#e6edf3');
      fillRR(ctx, RX + 84, ry - 11, 78, 17, 3, (oc[r[1]] || '#8b949e') + '22');
      txt(ctx, r[1], RX + 123, ry, '9px -apple-system,sans-serif', oc[r[1]] || '#8b949e', 'center');
      txt(ctx, r[2], RX + 178, ry, '9px -apple-system,sans-serif', '#8b949e');
      txt(ctx, r[3], W - 18, ry, 'bold 10px -apple-system,sans-serif', '#BFA27A', 'right');
      ln(ctx, RX, ry + 16, W - 18, ry + 16, '#21262d');
    });
    scanlines(ctx, W, H); return c;
  }

  /* ── 18. BUSINESS ANALYTICS DASHBOARD ───────────────────────── */
  function drawAnalytics() {
    const W = 1024, H = 640;
    const { c, ctx } = makeCanvas(W, H);
    ctx.fillStyle = '#0d1117'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#161b22'; ctx.fillRect(0, 0, W, 50); ln(ctx, 0, 50, W, 50, '#30363d');
    txt(ctx, 'Business Analytics', 18, 33, 'bold 14px -apple-system,sans-serif', '#e6edf3');
    txt(ctx, 'All channels · June 2025', W - 18, 33, '10px -apple-system,sans-serif', '#8b949e', 'right');
    const LW = W * 0.56, CX = 18, CY = 170, CH = 148;
    txt(ctx, '£ 56,400', CX, 85, 'bold 22px -apple-system,sans-serif', '#BFA27A');
    txt(ctx, '▲ 16.7% vs last month', CX + 138, 85, '10px -apple-system,sans-serif', '#3fb950');
    txt(ctx, 'Monthly Revenue — 2025', CX, 106, 'bold 11px -apple-system,sans-serif', '#e6edf3');
    const rD = [18,22,19,28,32,27,35,38,44,42,48,56];
    const mnths = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const bW3 = (LW - CX - 12) / rD.length - 2;
    for (let g = 0; g <= 4; g++) {
      const gy = CY + g * (CH / 4);
      ln(ctx, CX, gy, LW, gy, '#21262d');
      txt(ctx, ['£60K', '£45K', '£30K', '£15K', '£0'][g], CX - 4, gy + 4, '8px sans-serif', '#8b949e', 'right');
    }
    // Draw area
    ctx.save(); ctx.beginPath();
    rD.forEach((v, i) => { const px = CX + i * (bW3 + 2) + bW3/2, py = CY + CH - (v/60)*CH; i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py); });
    ctx.lineTo(CX + (rD.length - 0.5) * (bW3 + 2), CY + CH);
    ctx.lineTo(CX + bW3/2, CY + CH); ctx.closePath();
    const aG = ctx.createLinearGradient(0, CY, 0, CY + CH);
    aG.addColorStop(0, '#BFA27A' + '50'); aG.addColorStop(1, '#BFA27A' + '00');
    ctx.fillStyle = aG; ctx.fill(); ctx.restore();
    ctx.save(); ctx.beginPath(); ctx.strokeStyle = '#BFA27A'; ctx.lineWidth = 2;
    rD.forEach((v, i) => { const px = CX + i * (bW3 + 2) + bW3/2, py = CY + CH - (v/60)*CH; i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py); });
    ctx.stroke(); ctx.restore();
    rD.forEach((v, i) => {
      const px = CX + i * (bW3 + 2) + bW3/2, py = CY + CH - (v/60)*CH;
      dot(ctx, px, py, 3, '#BFA27A');
      txt(ctx, mnths[i], px, CY + CH + 16, '8px sans-serif', '#8b949e', 'center');
    });
    // Sources
    const srcsY = 350;
    txt(ctx, 'Revenue by Source', CX, srcsY, 'bold 11px -apple-system,sans-serif', '#e6edf3');
    [['Content Marketing', 0.35, '£19,740', '#BFA27A'], ['Website Leads', 0.28, '£15,792', '#1a9e8f'], ['AI Calling', 0.22, '£12,408', '#3b82f6'], ['AI Texting', 0.15, '£8,460', '#8b5cf6']].forEach((s, i) => {
      const sy = srcsY + 22 + i * 48;
      txt(ctx, s[0], CX, sy + 14, '10px -apple-system,sans-serif', '#e6edf3');
      txt(ctx, s[2], LW - 8, sy + 14, 'bold 10px -apple-system,sans-serif', s[3], 'right');
      progressBar(ctx, CX, sy + 22, LW - CX - 14, 8, s[1], '#21262d', s[3], 4);
      txt(ctx, `${Math.round(s[1] * 100)}%`, LW - 2, sy + 30, '9px sans-serif', '#8b949e', 'right');
    });
    // Right column metrics
    const RX2 = LW + 16, RW = W - RX2 - 14;
    [['New Clients', '23', '#3fb950'], ['Retention', '87%', '#3fb950'], ['Avg Deal', '£2,452', '#BFA27A'], ['NPS Score', '72', '#3fb950'], ['Calls/Day', '47', '#58a6ff'], ['Chat Leads', '24', '#58a6ff']].forEach((m, i) => {
      const row = Math.floor(i/2), col = i%2, mx = RX2 + col * (RW/2 + 3), my = 60 + row * 88;
      fillRR(ctx, mx, my, RW/2 - 6, 74, 5, '#161b22'); strokeRR(ctx, mx, my, RW/2 - 6, 74, 5, '#30363d');
      txt(ctx, m[0], mx + 10, my + 20, '9px -apple-system,sans-serif', '#8b949e');
      txt(ctx, m[1], mx + 10, my + 46, 'bold 20px -apple-system,sans-serif', m[2]);
      txt(ctx, '▲ +this month', mx + 10, my + 64, '8px sans-serif', m[2] + '88');
    });
    // Goals
    const gY = 346;
    txt(ctx, 'Monthly Goals', RX2, gY, 'bold 11px -apple-system,sans-serif', '#e6edf3');
    [['Revenue Target £60K', 0.94, '#BFA27A'], ['New Clients (target 25)', 0.92, '#3fb950'], ['Daily Call Target (50)', 0.94, '#58a6ff']].forEach((g, i) => {
      const gy = gY + 24 + i * 50;
      txt(ctx, g[0], RX2, gy, '10px -apple-system,sans-serif', '#e6edf3');
      txt(ctx, `${Math.round(g[1]*100)}%`, W - 16, gy, 'bold 10px -apple-system,sans-serif', g[2], 'right');
      progressBar(ctx, RX2, gy + 12, RW, 9, g[1], '#21262d', g[2], 4);
    });
    scanlines(ctx, W, H); return c;
  }

  /* ── 19. MISSION CONTROL (Canvas Tier 2) ─────────────────────── */
  function drawMissionControl() {
    const W = 1024, H = 640;
    const { c, ctx } = makeCanvas(W, H);
    ctx.fillStyle = '#0d1117'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#161b22'; ctx.fillRect(0, 0, W, 50);
    ln(ctx, 0, 50, W, 50, '#30363d');
    txt(ctx, 'KLLEZO', 18, 32, 'bold 12px -apple-system,sans-serif', '#BFA27A');
    txt(ctx, 'Mission Control', 70, 32, '11px -apple-system,sans-serif', '#8b949e');
    dot(ctx, W - 90, 25, 4, '#3fb950');
    txt(ctx, 'LIVE · June 24, 2025', W - 78, 32, '9px -apple-system,sans-serif', '#3fb950');
    const kpis = [
      { v: '124', l: 'Active Leads', col: '#58a6ff' },
      { v: '42', l: 'Conversations', col: '#3fb950' },
      { v: '18', l: 'Bookings Today', col: '#BFA27A' },
      { v: '7', l: 'Live Websites', col: '#1a9e8f' },
      { v: '53', l: 'Content Assets', col: '#f59e0b' },
    ];
    const kW = W / 5;
    kpis.forEach((k, i) => {
      const kx = i * kW;
      if (i > 0) ln(ctx, kx, 50, kx, 160, '#30363d');
      ctx.fillStyle = k.col + '12'; ctx.fillRect(kx, 50, kW, 110);
      ctx.fillStyle = k.col; ctx.fillRect(kx, 50, kW, 2);
      txt(ctx, k.v, kx + kW / 2, 108, 'bold 34px -apple-system,sans-serif', k.col, 'center');
      txt(ctx, k.l, kx + kW / 2, 132, '10px -apple-system,sans-serif', '#8b949e', 'center');
    });
    ln(ctx, 0, 160, W, 160, '#30363d');
    const cols = W / 3;
    [0, 1, 2].forEach(i => { if (i > 0) ln(ctx, i * cols, 160, i * cols, H, '#21262d'); });
    txt(ctx, '● AI Calls', 14, 182, 'bold 9px sans-serif', '#3fb950');
    txt(ctx, '● AI Texts', cols + 14, 182, 'bold 9px sans-serif', '#00a884');
    txt(ctx, '● Content', cols * 2 + 14, 182, 'bold 9px sans-serif', '#BFA27A');
    const callItems = [['Sarah Chen', 'Booking', '#3fb950'], ['Mike Okafor', 'Qualifying', '#f59e0b'], ['Lucy Barnes', 'Booked ✓', '#BFA27A'], ['David Park', 'No answer', '#8b949e'], ['Aisha J.', 'Intro', '#58a6ff']];
    callItems.forEach((item, i) => {
      const y = 202 + i * 52;
      fillRR(ctx, 12, y, cols - 24, 44, 5, '#161b22'); strokeRR(ctx, 12, y, cols - 24, 44, 5, '#30363d');
      avatar(ctx, 34, y + 22, 13, item[2] + '44', item[0].split(' ').map(n => n[0]).join(''), item[2]);
      txt(ctx, item[0], 54, y + 18, 'bold 10px -apple-system,sans-serif', '#e6edf3');
      txt(ctx, item[1], 54, y + 34, '9px -apple-system,sans-serif', item[2]);
    });
    const textItems = [['Emma Rodriguez', 'Booked', '#3fb950'], ['James Wilson', 'Qualifying', '#f59e0b'], ['Priya Sharma', 'New lead', '#58a6ff'], ['Tom Bradley', 'Nurturing', '#8b5cf6'], ['Sophie Laurent', 'Won £2.4K', '#BFA27A']];
    textItems.forEach((item, i) => {
      const y = 202 + i * 52, x = cols + 12;
      fillRR(ctx, x, y, cols - 24, 44, 5, '#161b22'); strokeRR(ctx, x, y, cols - 24, 44, 5, '#30363d');
      avatar(ctx, x + 22, y + 22, 13, '#00a884' + '44', item[0].split(' ').map(n => n[0]).join(''), '#00a884');
      txt(ctx, item[0], x + 40, y + 18, 'bold 10px -apple-system,sans-serif', '#e6edf3');
      txt(ctx, item[1], x + 40, y + 34, '9px -apple-system,sans-serif', item[2]);
    });
    const contentItems = ['Reel: 4AM Gym · 847K views', 'Story: BTS Shoot · Publishing', 'Newsletter · Scheduled 9am', 'Post: Week 4 · 12K likes', 'TikTok: Protein Tips · 42K'];
    contentItems.forEach((item, i) => {
      const y = 202 + i * 52, x = cols * 2 + 12;
      fillRR(ctx, x, y, cols - 24, 44, 5, '#161b22'); strokeRR(ctx, x, y, cols - 24, 44, 5, '#30363d');
      dot(ctx, x + 20, y + 22, 5, '#BFA27A');
      txt(ctx, item, x + 34, y + 24, '9px -apple-system,sans-serif', '#e6edf3');
    });
    scanlines(ctx, W, H); return c;
  }

  /* ── 20. GOOGLE ADS DASHBOARD ────────────────────────────────── */
  function drawGoogleAds() {
    const W = 1024, H = 640;
    const { c, ctx } = makeCanvas(W, H);
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#f8f9fa'; ctx.fillRect(0, 0, W, 56);
    ln(ctx, 0, 56, W, 56, '#e8eaed');
    txt(ctx, '≡', 20, 36, '22px sans-serif', '#5f6368');
    txt(ctx, 'Google Ads', 48, 35, 'bold 14px -apple-system,sans-serif', '#5f6368');
    txt(ctx, 'KLLEZO Fitness — June 2025', W / 2, 36, '12px -apple-system,sans-serif', '#5f6368', 'center');
    fillRR(ctx, W - 136, 14, 118, 28, 4, '#1a73e8');
    txt(ctx, '+ New Campaign', W - 77, 32, 'bold 10px -apple-system,sans-serif', '#fff', 'center');
    const kpis = [
      { l: 'Impressions', v: '284,620', ch: '+22%', up: true },
      { l: 'Clicks', v: '8,247', ch: '+18%', up: true },
      { l: 'CTR', v: '2.9%', ch: '+0.4%', up: true },
      { l: 'Avg CPC', v: '£0.84', ch: '-12%', up: true },
      { l: 'Conversions', v: '342', ch: '+34%', up: true },
      { l: 'ROAS', v: '4.8x', ch: '+1.2x', up: true },
    ];
    const kW = (W - 40) / 6;
    kpis.forEach((k, i) => {
      const kx = 18 + i * kW;
      ctx.fillStyle = '#f8f9fa'; ctx.fillRect(kx, 68, kW - 6, 78);
      ctx.strokeStyle = '#e8eaed'; ctx.lineWidth = 1; ctx.strokeRect(kx, 68, kW - 6, 78);
      txt(ctx, k.l, kx + 8, 86, '9px -apple-system,sans-serif', '#5f6368');
      txt(ctx, k.v, kx + 8, 116, 'bold 17px -apple-system,sans-serif', '#202124');
      const cc = k.up ? '#137333' : '#c5221f';
      txt(ctx, (k.up ? '▲ ' : '▼ ') + k.ch, kx + 8, 136, '9px -apple-system,sans-serif', cc);
    });
    const campaigns = [
      { n: 'Fitness 90-Day Challenge', st: 'Active', imp: '142K', cpc: '£0.72', roas: '5.2x', spend: '£1,240', col: '#1a73e8' },
      { n: 'Weight Loss Local UK', st: 'Active', imp: '84K', cpc: '£0.94', roas: '4.4x', spend: '£892', col: '#1a73e8' },
      { n: 'Bridal Fitness Program', st: 'Active', imp: '38K', cpc: '£1.12', roas: '6.1x', spend: '£640', col: '#1a73e8' },
      { n: 'Retargeting — Website Visitors', st: 'Active', imp: '20K', cpc: '£0.44', roas: '8.4x', spend: '£284', col: '#34a853' },
    ];
    ctx.fillStyle = '#f8f9fa'; ctx.fillRect(0, 158, W, 28);
    ln(ctx, 0, 186, W, 186, '#e8eaed');
    const hx = [18, 240, 330, 404, 482, 570, 650];
    ['Campaign', 'Status', 'Impressions', 'CPC', 'ROAS', 'Spend', 'Actions'].forEach((h, i) => txt(ctx, h, hx[i], 176, 'bold 9px -apple-system,sans-serif', '#5f6368'));
    campaigns.forEach((cp, i) => {
      const ry = 196 + i * 56;
      if (i % 2 === 0) { ctx.fillStyle = '#f8f9fa'; ctx.fillRect(0, ry, W, 54); }
      ln(ctx, 0, ry + 54, W, ry + 54, '#e8eaed');
      dot(ctx, 10, ry + 27, 4, cp.col);
      txt(ctx, cp.n, 22, ry + 22, 'bold 11px -apple-system,sans-serif', '#202124');
      txt(ctx, 'KLLEZO Fitness · Search & Display', 22, ry + 40, '9px -apple-system,sans-serif', '#5f6368');
      fillRR(ctx, hx[1], ry + 17, 60, 18, 9, '#e6f4ea');
      txt(ctx, cp.st, hx[1] + 30, ry + 29, '9px -apple-system,sans-serif', '#137333', 'center');
      txt(ctx, cp.imp, hx[2], ry + 28, '11px -apple-system,sans-serif', '#202124');
      txt(ctx, cp.cpc, hx[3], ry + 28, '11px -apple-system,sans-serif', '#202124');
      txt(ctx, cp.roas, hx[4], ry + 28, 'bold 11px -apple-system,sans-serif', '#137333');
      txt(ctx, cp.spend, hx[5], ry + 28, '11px -apple-system,sans-serif', '#202124');
      fillRR(ctx, hx[6], ry + 17, 52, 20, 4, '#1a73e8' + '20');
      txt(ctx, 'Details', hx[6] + 26, ry + 30, '9px -apple-system,sans-serif', '#1a73e8', 'center');
    });
    txt(ctx, 'Total Spend: £3,056  ·  Total ROAS: 4.8x  ·  Est. Revenue: £14,669', W / 2, H - 12, '10px -apple-system,sans-serif', '#5f6368', 'center');
    scanlines(ctx, W, H); return c;
  }

  /* ── 21. STRIPE PAYMENT SUCCESS ──────────────────────────────── */
  function drawPaymentSuccess() {
    const W = 640, H = 640;
    const { c, ctx } = makeCanvas(W, H);
    ctx.fillStyle = '#0d1117'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#161b22'; ctx.fillRect(0, 0, W, 52);
    ln(ctx, 0, 52, W, 52, '#30363d');
    txt(ctx, '▤', 20, 34, '16px sans-serif', '#8b949e');
    txt(ctx, 'KLLEZO', 44, 34, 'bold 11px -apple-system,sans-serif', '#BFA27A');
    txt(ctx, 'Payment Complete', W / 2, 34, '10px -apple-system,sans-serif', '#8b949e', 'center');
    const rg = ctx.createRadialGradient(W / 2, H * 0.38, 0, W / 2, H * 0.38, 180);
    rg.addColorStop(0, '#3fb950' + '18'); rg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = rg; ctx.fillRect(0, 0, W, H);
    dot(ctx, W / 2, 170, 40, '#3fb950' + '22');
    dot(ctx, W / 2, 170, 28, '#3fb950' + '33');
    dot(ctx, W / 2, 170, 18, '#3fb950');
    ctx.fillStyle = '#fff'; ctx.font = 'bold 22px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('✓', W / 2, 170); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    txt(ctx, 'Payment Successful', W / 2, 234, 'bold 22px -apple-system,sans-serif', '#e6edf3', 'center');
    txt(ctx, 'Welcome to the KLLEZO Family', W / 2, 260, '12px -apple-system,sans-serif', '#8b949e', 'center');
    fillRR(ctx, 40, 282, W - 80, 140, 8, '#161b22'); strokeRR(ctx, 40, 282, W - 80, 140, 8, '#30363d');
    [['Client', 'Rachel Green'], ['Package', '12-Week Full Transformation'], ['Amount', '£ 1,497.00'], ['Reference', 'KLLZ-2025-0847']].forEach((r, i) => {
      const ry = 304 + i * 28;
      txt(ctx, r[0], 60, ry, '10px -apple-system,sans-serif', '#8b949e');
      txt(ctx, r[1], W - 60, ry, i === 2 ? 'bold 12px -apple-system,sans-serif' : '10px -apple-system,sans-serif', i === 2 ? '#BFA27A' : '#e6edf3', 'right');
      if (i < 3) ln(ctx, 60, ry + 10, W - 60, ry + 10, '#21262d');
    });
    fillRR(ctx, 40, 440, W - 80, 46, 5, '#3fb950' + '22'); strokeRR(ctx, 40, 440, W - 80, 46, 5, '#3fb950' + '55', 1);
    txt(ctx, '📅 Onboarding call scheduled for Tuesday, 24 June · 3:00 PM', W / 2, 467, '10px -apple-system,sans-serif', '#3fb950', 'center');
    txt(ctx, 'Powered by Stripe  ·  256-bit SSL encryption', W / 2, H - 20, '9px -apple-system,sans-serif', '#8b949e55', 'center');
    scanlines(ctx, W, H); return c;
  }

  /* ── 22. SLACK NOTIFICATION FEED ─────────────────────────────── */
  function drawSlack() {
    const W = 800, H = 640;
    const { c, ctx } = makeCanvas(W, H);
    ctx.fillStyle = '#1a1d21'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#141922'; ctx.fillRect(0, 0, 220, H);
    ln(ctx, 220, 0, 220, H, '#2b2d33');
    txt(ctx, 'KLLEZO', 14, 36, 'bold 13px -apple-system,sans-serif', '#BFA27A');
    txt(ctx, '● Online', 14, 54, '10px -apple-system,sans-serif', '#3fb950');
    const channels = [['# general', false], ['# leads', true], ['# bookings', false], ['# ai-alerts', false], ['# content', false]];
    channels.forEach(([ch, act], i) => {
      const y = 76 + i * 34;
      if (act) { ctx.fillStyle = '#27292f'; ctx.fillRect(0, y - 12, 220, 30); }
      txt(ctx, ch, 14, y + 4, act ? 'bold 11px -apple-system,sans-serif' : '11px -apple-system,sans-serif', act ? '#fff' : '#8b9099');
      if (i === 1 || i === 3) { dot(ctx, 196, y - 4, 7, '#e01e5a'); txt(ctx, i === 1 ? '3' : '1', 196, y - 0, 'bold 8px sans-serif', '#fff', 'center'); }
    });
    txt(ctx, '#leads', 240, 34, 'bold 14px -apple-system,sans-serif', '#e6edf3');
    ln(ctx, 220, 50, W, 50, '#2b2d33');
    const messages = [
      { name: 'AI Agent', time: '10:28 AM', icon: '🤖', msgs: ['🎯 NEW BOOKING: Emma Rodriguez → Tuesday 24 Jun, 3PM', 'Pipeline value: £2,800 · Source: AI Text Agent · 8s response'], col: '#3fb950' },
      { name: 'KLLEZO Bot', time: '10:26 AM', icon: '⚡', msgs: ['🔔 HIGH INTENT LEAD: Priya Sharma (Instagram)', '"I\'ve been following you for months, ready to invest"', 'Est. value: £3,200 · Score: 91/100'], col: '#f59e0b' },
      { name: 'AI Agent', time: '10:22 AM', icon: '🤖', msgs: ['📞 CALL COMPLETE: Sarah Chen · Duration: 4:32', 'Status: QUALIFIED → Bridal Package sent', 'Score: 87 · Follow-up scheduled: Tomorrow 9AM'], col: '#58a6ff' },
      { name: 'KLLEZO Bot', time: '9:58 AM', icon: '📊', msgs: ['Daily Summary: 47 calls · 12 qualified · 8 booked', 'Revenue pipeline: £18,400 · Rate: 18.7%'], col: '#BFA27A' },
    ];
    let mY = 68;
    messages.forEach(msg => {
      dot(ctx, 250, mY + 14, 18, msg.col + '33');
      txt(ctx, msg.icon, 250, mY + 20, '16px sans-serif', '#fff', 'center', 'middle');
      txt(ctx, msg.name, 278, mY + 12, 'bold 12px -apple-system,sans-serif', '#e6edf3');
      txt(ctx, msg.time, 278 + ctx.measureText(msg.name).width + 8, mY + 12, '10px -apple-system,sans-serif', '#8b9099');
      msg.msgs.forEach((m, i) => {
        const isFirst = i === 0;
        txt(ctx, m, 278, mY + 30 + i * 18, isFirst ? 'bold 10px -apple-system,sans-serif' : '10px -apple-system,sans-serif', isFirst ? '#e6edf3' : '#8b9099');
      });
      mY += 36 + msg.msgs.length * 18;
      ln(ctx, 230, mY, W - 14, mY, '#2b2d33');
      mY += 10;
    });
    scanlines(ctx, W, H); return c;
  }

  /* ── 23. SEO DASHBOARD ───────────────────────────────────────── */
  function drawSEODashboard() {
    const W = 1024, H = 640;
    const { c, ctx } = makeCanvas(W, H);
    ctx.fillStyle = '#0d1117'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#161b22'; ctx.fillRect(0, 0, W, 50); ln(ctx, 0, 50, W, 50, '#30363d');
    txt(ctx, 'SEO Performance · kllezo.com', 18, 33, 'bold 13px -apple-system,sans-serif', '#e6edf3');
    txt(ctx, '▲ 24% organic growth vs last month', W - 18, 33, '10px -apple-system,sans-serif', '#3fb950', 'right');
    const kpis = [
      { l: 'Organic Traffic', v: '12.4K', ch: '+24%', col: '#3fb950' },
      { l: 'Keywords (Top 10)', v: '84', ch: '+12', col: '#58a6ff' },
      { l: 'Domain Rating', v: '47', ch: '+3', col: '#BFA27A' },
      { l: 'Backlinks', v: '1,247', ch: '+84', col: '#8b5cf6' },
    ];
    const kW = (W - 38) / 4;
    kpis.forEach((k, i) => {
      const kx = 18 + i * (kW + 2);
      fillRR(ctx, kx, 60, kW, 76, 5, '#161b22'); strokeRR(ctx, kx, 60, kW, 76, 5, '#30363d');
      txt(ctx, k.l, kx + 10, 78, '9px -apple-system,sans-serif', '#8b949e');
      txt(ctx, k.v, kx + 10, 108, 'bold 22px -apple-system,sans-serif', k.col);
      txt(ctx, '▲ ' + k.ch, kx + 10, 126, '9px -apple-system,sans-serif', k.col);
    });
    txt(ctx, 'Top Ranking Keywords', 18, 160, 'bold 11px -apple-system,sans-serif', '#e6edf3');
    ln(ctx, 18, 172, W - 18, 172, '#30363d');
    const kws = [
      { kw: 'fitness coach manchester', pos: 1, vol: '2.4K', diff: 32, chg: '+4' },
      { kw: 'personal trainer online uk', pos: 2, vol: '8.2K', diff: 44, chg: '+2' },
      { kw: '90 day fitness program', pos: 3, vol: '1.8K', diff: 28, chg: 'new' },
      { kw: 'ai fitness coaching', pos: 4, vol: '3.6K', diff: 52, chg: '+7' },
      { kw: 'weight loss coach uk', pos: 5, vol: '12.4K', diff: 58, chg: '+1' },
      { kw: 'online personal trainer', pos: 7, vol: '22K', diff: 71, chg: '0' },
      { kw: 'fitness content creator uk', pos: 9, vol: '840', diff: 36, chg: '+3' },
    ];
    const hx2 = [18, 280, 370, 450, 530];
    ['Keyword', 'Position', 'Volume', 'Difficulty', 'Change'].forEach((h, i) => txt(ctx, h, hx2[i], 188, 'bold 9px -apple-system,sans-serif', '#8b949e'));
    kws.forEach((kw, i) => {
      const ry = 202 + i * 42;
      if (i % 2 === 0) { ctx.fillStyle = '#161b22' + '55'; ctx.fillRect(0, ry - 10, W, 40); }
      ln(ctx, 0, ry + 28, W, ry + 28, '#21262d');
      const posCol = kw.pos <= 3 ? '#3fb950' : kw.pos <= 5 ? '#f59e0b' : '#8b949e';
      txt(ctx, kw.kw, 18, ry + 8, '11px -apple-system,sans-serif', '#e6edf3');
      fillRR(ctx, hx2[1], ry - 4, 28, 20, 10, posCol + '33');
      txt(ctx, '#' + kw.pos, hx2[1] + 14, ry + 9, 'bold 10px -apple-system,sans-serif', posCol, 'center');
      txt(ctx, kw.vol, hx2[2], ry + 8, '10px -apple-system,sans-serif', '#e6edf3');
      progressBar(ctx, hx2[3], ry - 2, 60, 10, kw.diff / 100, '#21262d', kw.diff < 50 ? '#3fb950' : '#f59e0b', 5);
      const cc2 = kw.chg.startsWith('+') ? '#3fb950' : kw.chg === '0' ? '#8b949e' : '#f85149';
      txt(ctx, kw.chg, hx2[4], ry + 8, 'bold 10px -apple-system,sans-serif', cc2);
    });
    scanlines(ctx, W, H); return c;
  }

  /* ── 24. WEBSITE HEATMAP ─────────────────────────────────────── */
  function drawHeatmap() {
    const W = 800, H = 640;
    const { c, ctx } = makeCanvas(W, H);
    ctx.fillStyle = '#f8fafc'; ctx.fillRect(0, 0, W, H);
    fillRR(ctx, 8, 8, W - 16, 30, 4, '#fff');
    strokeRR(ctx, 8, 8, W - 16, 30, 4, '#e2e8f0', 1);
    dot(ctx, 28, 23, 6, '#ef4444'); dot(ctx, 46, 23, 6, '#f59e0b'); dot(ctx, 64, 23, 6, '#22c55e');
    txt(ctx, 'kllezo.com/services', 86, 27, '9px monospace', '#64748b');
    txt(ctx, 'Heatmap · 847 sessions · June 24', W - 14, 27, '9px -apple-system,sans-serif', '#64748b', 'right');
    // Webpage skeleton
    ctx.fillStyle = '#334155'; ctx.fillRect(0, 46, W, 34);
    txt(ctx, 'KLLEZO', 20, 67, 'bold 11px -apple-system,sans-serif', '#fff');
    txt(ctx, 'Content  ·  Websites  ·  AI Calling  ·  AI Texting', W / 2, 67, '9px sans-serif', 'rgba(255,255,255,0.5)', 'center');
    fillRR(ctx, W - 120, 56, 104, 22, 11, '#BFA27A'); txt(ctx, 'Book Strategy Call', W - 68, 70, 'bold 7px sans-serif', '#fff', 'center');
    // Heat spots — where users actually click
    const heatSpots = [
      { x: W - 68, y: 67, r: 42, a: 0.62 },   // CTA nav
      { x: W / 2, y: 200, r: 64, a: 0.45 },    // hero headline
      { x: 200, y: 380, r: 38, a: 0.35 },       // service card 1
      { x: 440, y: 380, r: 30, a: 0.28 },       // service card 2
      { x: 680, y: 380, r: 22, a: 0.20 },       // service card 3
      { x: W / 2, y: 480, r: 52, a: 0.55 },    // main CTA
      { x: 120, y: 560, r: 18, a: 0.15 },
    ];
    heatSpots.forEach(hs => {
      const rg2 = ctx.createRadialGradient(hs.x, hs.y, 0, hs.x, hs.y, hs.r);
      rg2.addColorStop(0, `rgba(239,68,68,${hs.a})`);
      rg2.addColorStop(0.4, `rgba(251,146,60,${hs.a * 0.6})`);
      rg2.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = rg2; ctx.fillRect(0, 46, W, H - 46);
    });
    // Page content ghost
    ctx.save(); ctx.globalAlpha = 0.18;
    fillRR(ctx, 60, 160, W - 120, 60, 4, '#334155');
    fillRR(ctx, 120, 232, 400, 14, 3, '#94a3b8');
    [0, 1, 2].forEach(i => { const bx = 60 + i * 248; fillRR(ctx, bx, 310, 228, 150, 8, '#334155'); });
    fillRR(ctx, W / 2 - 90, 460, 180, 40, 20, '#BFA27A');
    ctx.restore();
    // Click count labels
    txt(ctx, '342 clicks', W - 68, 120, 'bold 9px sans-serif', '#ef4444', 'center');
    txt(ctx, '284 clicks', W / 2, 252, 'bold 9px sans-serif', '#f97316', 'center');
    txt(ctx, '218 clicks', W / 2, 512, 'bold 9px sans-serif', '#ef4444', 'center');
    fillRR(ctx, 8, H - 32, W - 16, 24, 4, '#161b22');
    txt(ctx, 'Main CTA: 25.7% click rate  ·  Nav CTA: 40.4%  ·  Avg scroll depth: 78%', W / 2, H - 15, '9px -apple-system,sans-serif', '#94a3b8', 'center');
    scanlines(ctx, W, H); return c;
  }

  /* ── 25. CLIENT PORTAL ───────────────────────────────────────── */
  function drawClientPortal() {
    const W = 1024, H = 640;
    const { c, ctx } = makeCanvas(W, H);
    ctx.fillStyle = '#0d1117'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#161b22'; ctx.fillRect(0, 0, 200, H); ln(ctx, 200, 0, 200, H, '#30363d');
    txt(ctx, 'KLLEZO', 14, 36, 'bold 12px -apple-system,sans-serif', '#BFA27A');
    txt(ctx, 'Client Portal', 14, 52, '9px -apple-system,sans-serif', '#8b949e');
    avatar(ctx, 100, 90, 22, '#1a6e64', 'RG');
    txt(ctx, 'Rachel Green', 100, 122, '11px -apple-system,sans-serif', '#e6edf3', 'center');
    txt(ctx, 'Week 8 of 12', 100, 138, '9px -apple-system,sans-serif', '#3fb950', 'center');
    progressBar(ctx, 20, 148, 160, 5, 0.67, '#21262d', '#3fb950', 2);
    [['📊', 'My Progress', true], ['🎥', 'Video Library', false], ['🥗', 'Nutrition', false], ['📅', 'Bookings', false], ['💬', 'Messages', false]].forEach(([ic, l, act], i) => {
      const y = 168 + i * 40;
      if (act) { ctx.fillStyle = '#3fb950' + '18'; ctx.fillRect(0, y - 8, 200, 32); }
      txt(ctx, ic + ' ' + l, 16, y + 10, act ? 'bold 10px sans-serif' : '10px sans-serif', act ? '#3fb950' : '#8b949e');
    });
    const MX2 = 216;
    ctx.fillStyle = '#161b22'; ctx.fillRect(MX2, 0, W - MX2, 50); ln(ctx, MX2, 50, W, 50, '#30363d');
    txt(ctx, 'My Progress — Week 8', MX2 + 12, 33, 'bold 13px -apple-system,sans-serif', '#e6edf3');
    txt(ctx, 'You\'re in the top 8% of clients this month! 🏆', W - 18, 33, '10px -apple-system,sans-serif', '#BFA27A', 'right');
    const stats = [['Starting Weight', '86kg', '#8b949e'], ['Current Weight', '73.4kg', '#3fb950'], ['Lost', '-12.6kg', '#3fb950'], ['Body Fat', '-6.2%', '#3fb950']];
    const sW = (W - MX2 - 30) / 4;
    stats.forEach((s, i) => {
      const sx = MX2 + 12 + i * sW;
      fillRR(ctx, sx, 62, sW - 8, 72, 5, '#161b22'); strokeRR(ctx, sx, 62, sW - 8, 72, 5, '#30363d');
      txt(ctx, s[0], sx + 8, 80, '9px -apple-system,sans-serif', '#8b949e');
      txt(ctx, s[1], sx + 8, 106, 'bold 18px -apple-system,sans-serif', s[2]);
    });
    txt(ctx, 'Weekly Check-ins', MX2 + 12, 162, 'bold 10px -apple-system,sans-serif', '#e6edf3');
    const weeks = [64, 71, 74, 74, 80, 82, 86, 88, 0, 0, 0, 0];
    const bw4 = (W - MX2 - 30) / 12 - 3;
    const maxPct = 100;
    weeks.forEach((w, i) => {
      const bh2 = (w / maxPct) * 100;
      const bx2 = MX2 + 12 + i * (bw4 + 3), by2 = 282 - bh2;
      fillRR(ctx, bx2, by2, bw4, bh2, 3, w > 0 ? (i === 7 ? '#3fb950' : '#1a9e8f' + 'aa') : '#21262d');
      if (w > 0) txt(ctx, `W${i + 1}`, bx2 + bw4 / 2, 298, '7px sans-serif', '#8b949e', 'center');
    });
    txt(ctx, 'Latest Videos', MX2 + 12, 324, 'bold 10px -apple-system,sans-serif', '#e6edf3');
    const vids = [['Week 8 Workout', 'Chest & Shoulders', '38:24'], ['Meal Prep Guide', 'High Protein', '22:10'], ['Mindset Monday', 'Week 8 Review', '14:45']];
    const vW = (W - MX2 - 30) / 3;
    vids.forEach((v, i) => {
      const vx = MX2 + 12 + i * vW, vy = 338;
      gradRect(ctx, vx, vy, vW - 8, 90, '#1a2a1a', '#0f1a0f');
      strokeRR(ctx, vx, vy, vW - 8, 90, 5, '#238636' + '33', 0.5);
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(vx + vW / 2 - 8, vy + 40); ctx.lineTo(vx + vW / 2 - 8, vy + 58); ctx.lineTo(vx + vW / 2 + 10, vy + 49); ctx.closePath(); ctx.fill();
      txt(ctx, v[0], vx + 4, vy + 100, 'bold 9px -apple-system,sans-serif', '#e6edf3');
      txt(ctx, v[1], vx + 4, vy + 114, '8px -apple-system,sans-serif', '#8b949e');
      txt(ctx, v[2], vx + vW - 14, vy + 100, '8px sans-serif', '#BFA27A', 'right');
    });
    txt(ctx, 'Next session: Thursday, 26 Jun · 7:00 AM · Coach Alex', MX2 + 12, H - 18, '10px -apple-system,sans-serif', '#8b949e');
    fillRR(ctx, W - 188, H - 36, 172, 26, 4, '#238636' + '33');
    txt(ctx, '+ Book Additional Session', W - 102, H - 19, 'bold 9px -apple-system,sans-serif', '#3fb950', 'center');
    scanlines(ctx, W, H); return c;
  }

  /* ── TIER 3: Simplified Background Screens (drawn at 512×320) ── */
  function drawSimpleContent(variant) {
    const W = 512, H = 320;
    const { c, ctx } = makeCanvas(W, H);
    const bgs = ['#0d1117', '#080808', '#0f0f0f', '#0b0d10'];
    ctx.fillStyle = bgs[variant % bgs.length]; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#161b22'; ctx.fillRect(0, 0, W, 32);
    ln(ctx, 0, 32, W, 32, '#30363d');
    const labels = ['Creator Studio', 'Content Queue', 'Analytics', 'Publishing'];
    txt(ctx, labels[variant % labels.length], 14, 21, 'bold 9px -apple-system,sans-serif', '#8b949e');
    for (let i = 0; i < 6; i++) {
      fillRR(ctx, 14 + (i % 3) * 160, 44 + Math.floor(i / 3) * 80, 148, 68, 5, '#161b22');
      strokeRR(ctx, 14 + (i % 3) * 160, 44 + Math.floor(i / 3) * 80, 148, 68, 5, '#30363d');
      const vc = ['#3fb950', '#58a6ff', '#BFA27A', '#8b5cf6', '#f59e0b', '#1a9e8f'][i];
      fillRR(ctx, 20 + (i % 3) * 160, 48 + Math.floor(i / 3) * 80, 136, 3, 1, vc);
      txt(ctx, ['2.4M', '847K', '34.2K', '8.4%', '1.2K', '92%'][i], 22 + (i % 3) * 160, 86 + Math.floor(i / 3) * 80, 'bold 18px -apple-system,sans-serif', vc);
    }
    for (let r = 0; r < 4; r++) { const y = 178 + r * 28; fillRR(ctx, 14, y, W - 28, 20, 3, '#161b22'); }
    return c;
  }

  function drawSimpleCall(variant) {
    const W = 512, H = 320;
    const { c, ctx } = makeCanvas(W, H);
    ctx.fillStyle = '#0b0d10'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#161b22'; ctx.fillRect(0, 0, W, 32);
    ln(ctx, 0, 32, W, 32, '#30363d');
    dot(ctx, 14, 16, 4, '#3fb950');
    txt(ctx, 'AI Calling · LIVE', 26, 21, 'bold 9px -apple-system,sans-serif', '#3fb950');
    const cols3 = ['#58a6ff', '#f59e0b', '#3fb950', '#BFA27A', '#8b949e'];
    for (let i = 0; i < 5; i++) {
      fillRR(ctx, 14 + i * 96, 44, 84, 58, 5, '#161b22'); strokeRR(ctx, 14 + i * 96, 44, 84, 58, 5, cols3[i] + '33');
      txt(ctx, ['47', '12', '8', '£8.4K', '19%'][i], 56 + i * 96, 80, 'bold 16px -apple-system,sans-serif', cols3[i], 'center');
      txt(ctx, ['Calls', 'Qualif.', 'Booked', 'Revenue', 'Conv.'][i], 56 + i * 96, 94, '7px sans-serif', '#8b949e', 'center');
    }
    for (let r = 0; r < 5; r++) {
      const ry = 114 + r * 36;
      fillRR(ctx, 14, ry, W - 28, 28, 4, '#161b22');
      dot(ctx, 30, ry + 14, 5, '#3fb950');
      txt(ctx, ['Sarah Chen', 'Mike Okafor', 'Lucy Barnes', 'David Park', 'Rachel Green'][r % 5], 44, ry + 10, '10px -apple-system,sans-serif', '#e6edf3');
      txt(ctx, ['Qualifying', 'Booked', 'Intro', 'No answer', 'Won'][r % 5], 44, ry + 24, '8px -apple-system,sans-serif', cols3[r]);
    }
    return c;
  }

  function drawSimpleWebsite(variant) {
    const W = 512, H = 320;
    const { c, ctx } = makeCanvas(W, H);
    const bgs2 = [['#1a0f08', '#0a0804'], ['#080808', '#111'], ['#0b1a18', '#162e2a']];
    const bg2 = bgs2[variant % bgs2.length];
    gradRect(ctx, 0, 0, W, H, bg2[0], bg2[1]);
    const nav = ctx.createLinearGradient(0, 0, 0, 38);
    nav.addColorStop(0, 'rgba(0,0,0,0.6)'); nav.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = nav; ctx.fillRect(0, 0, W, 38);
    const names = ['MERIDIAN ESTATES', 'APEX PERFORMANCE', 'MAISON ELARA'];
    txt(ctx, names[variant % names.length], W / 2, 22, 'bold 9px Georgia,serif', '#BFA27A', 'center');
    const hg = ctx.createLinearGradient(0, H * 0.5, 0, H);
    hg.addColorStop(0, 'rgba(0,0,0,0)'); hg.addColorStop(1, 'rgba(0,0,0,0.9)');
    ctx.fillStyle = hg; ctx.fillRect(0, H * 0.5, W, H * 0.5);
    const headlines = [['Penthouse', 'Roma'], ['Transform', 'In 90 Days'], ['Maison', 'Elara']];
    const hl = headlines[variant % headlines.length];
    txt(ctx, hl[0], 24, H * 0.65, '300 28px Georgia,serif', '#F7F3EB');
    txt(ctx, hl[1], 24, H * 0.65 + 36, '300 28px Georgia,serif', '#BFA27A');
    fillRR(ctx, 24, H - 44, 120, 30, 15, '#BFA27A');
    txt(ctx, 'Enquire Now', 84, H - 24, 'bold 8px sans-serif', '#0B0D10', 'center');
    return c;
  }

  /* ── EXPORT ──────────────────────────────────────────────────── */
  window.SCREENS = {
    // Tier 2 — animated Canvas screens
    instagramReel:      drawInstagramReel,
    contentCalendar:    drawContentCalendar,
    creatorDashboard:   drawCreatorDashboard,
    videoTimeline:      drawVideoTimeline,
    publishingQueue:    drawPublishingQueue,
    luxuryRealEstate:   drawLuxuryRealEstate,
    boutiqueHotel:      drawBoutiqueHotel,
    fitnessCoach:       drawFitnessCoach,
    restaurant:         drawRestaurant,
    ecommerce:          drawEcommerce,
    activeCall:         drawActiveCall,
    crmPipeline:        drawCRMPipeline,
    whatsApp:           drawWhatsApp,
    multiLeadDashboard: drawMultiLeadDashboard,
    bookingCalendar:    drawBookingCalendar,
    nurtureSequence:    drawNurtureSequence,
    callDashboard:      drawCallDashboard,
    analytics:          drawAnalytics,
    missionControl:     drawMissionControl,
    googleAds:          drawGoogleAds,
    paymentSuccess:     drawPaymentSuccess,
    slack:              drawSlack,
    seoSashboard:       drawSEODashboard,
    heatmap:            drawHeatmap,
    clientPortal:       drawClientPortal,
    // Tier 3 — lightweight background screens
    simpleContent:      drawSimpleContent,
    simpleCall:         drawSimpleCall,
    simpleWebsite:      drawSimpleWebsite,
  };

  console.log('[KLLEZO] Screen library V4.1 loaded — 28 screen functions ready');
})();
