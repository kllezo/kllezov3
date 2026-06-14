/**
 * KLLEZO — UI Texture Library
 * Real, premium interfaces rendered to canvas → THREE.CanvasTexture
 * Quality target: Apple · Linear · Stripe · Notion · Raycast
 */

'use strict';

/* ════════════════════════════════════════════
   HELPERS
   ════════════════════════════════════════════ */

function rrect(ctx, x, y, w, h, r) {
  const rx = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rx, y);
  ctx.lineTo(x + w - rx, y);
  ctx.arcTo(x + w, y, x + w, y + rx, rx);
  ctx.lineTo(x + w, y + h - rx);
  ctx.arcTo(x + w, y + h, x + w - rx, y + h, rx);
  ctx.lineTo(x + rx, y + h);
  ctx.arcTo(x, y + h, x, y + h - rx, rx);
  ctx.lineTo(x, y + rx);
  ctx.arcTo(x, y, x + rx, y, rx);
  ctx.closePath();
}

function fillRR(ctx, x, y, w, h, r, col) {
  ctx.fillStyle = col; rrect(ctx, x, y, w, h, r); ctx.fill();
}

function strokeRR(ctx, x, y, w, h, r, col, lw = 1) {
  ctx.strokeStyle = col; ctx.lineWidth = lw;
  rrect(ctx, x, y, w, h, r); ctx.stroke();
}

function txt(ctx, s, x, y, font, col, align = 'left', base = 'alphabetic') {
  ctx.save();
  ctx.fillStyle = col; ctx.font = font;
  ctx.textAlign = align; ctx.textBaseline = base;
  ctx.fillText(s, x, y);
  ctx.restore();
}

function line(ctx, x1, y1, x2, y2, col, lw = 1) {
  ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = lw;
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  ctx.restore();
}

function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return { c, ctx: c.getContext('2d') };
}

function toTexture(canvas) {
  const t = new THREE.CanvasTexture(canvas);
  t.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return t;
}

/* ════════════════════════════════════════════
   CONTENT WORLD TEXTURES
   ════════════════════════════════════════════ */

/** Instagram Reel — portrait 390×844 */
window.drawInstagramReel = function(variant = 0) {
  const W = 780, H = 1688;
  const { c, ctx } = makeCanvas(W, H);
  const sf = 2;

  // Video background — lush scene
  const palettes = [
    ['#0d2e2a', '#1a5e54', '#0a3830'],
    ['#1a1a2e', '#16213e', '#0f3460'],
    ['#1a0a2e', '#2a1a4e', '#3a2a5e'],
  ];
  const pal = palettes[variant % 3];

  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, pal[0]);
  bg.addColorStop(0.5, pal[1]);
  bg.addColorStop(1, pal[2]);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Abstract "content" visual — represents brand video
  ctx.save();
  ctx.globalAlpha = 0.3;
  fillRR(ctx, 40, 160, W - 80, 540, 24, '#1a9e8f');
  ctx.restore();

  // Floating content shapes (simulated video frame)
  ctx.save();
  ctx.globalAlpha = 0.18;
  for (let i = 0; i < 6; i++) {
    const x = 60 + i * 120;
    const y = 200 + Math.sin(i * 1.3) * 80;
    fillRR(ctx, x, y, 80, 110, 12, '#fff');
  }
  ctx.restore();

  // Grid lines suggesting content layout
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 5; i++) {
    ctx.beginPath(); ctx.moveTo(W/5*i, 100); ctx.lineTo(W/5*i, H - 200); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, 120 + i*120); ctx.lineTo(W, 120 + i*120); ctx.stroke();
  }
  ctx.restore();

  // Bottom gradient overlay (text legibility)
  const overlay = ctx.createLinearGradient(0, H * 0.55, 0, H);
  overlay.addColorStop(0, 'rgba(0,0,0,0)');
  overlay.addColorStop(1, 'rgba(0,0,0,0.88)');
  ctx.fillStyle = overlay;
  ctx.fillRect(0, 0, W, H);

  // ── TOP BAR ──
  // Story progress bars (3 segments)
  const barY = 20, barH = 3, barW = (W - 40) / 3 - 8;
  [0, 1, 2].forEach(i => {
    const bx = 14 + i * (barW + 10);
    fillRR(ctx, bx, barY, barW, barH, 2, 'rgba(255,255,255,0.28)');
    if (i === 0) fillRR(ctx, bx, barY, barW * 0.62, barH, 2, '#fff'); // active
    if (i === 1) fillRR(ctx, bx, barY, barW * 0.15, barH, 2, '#fff'); // partially done
  });

  // "Reels" header
  txt(ctx, 'Reels', W/2, 56, `bold ${13*sf}px -apple-system,sans-serif`, '#fff', 'center');

  // Camera icon top-left
  strokeRR(ctx, 20, 44, 28, 22, 4, 'rgba(255,255,255,0.8)', 1.5);
  ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(48, 50); ctx.lineTo(56, 46); ctx.lineTo(56, 64); ctx.lineTo(48, 60); ctx.stroke();
  ctx.restore();

  // DM icon top-right
  strokeRR(ctx, W - 62, 44, 26, 22, 4, 'rgba(255,255,255,0.8)', 1.5);
  // tail
  ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(W - 52, 66); ctx.lineTo(W - 44, 74); ctx.lineTo(W - 44, 66); ctx.stroke();
  ctx.restore();

  // ── RIGHT ACTION COLUMN ──
  const rx = W - 38, ryStart = H - 520;
  const gap = 92;

  // Profile avatar
  ctx.save();
  ctx.beginPath(); ctx.arc(rx, ryStart, 26, 0, Math.PI * 2);
  const avatarGrad = ctx.createLinearGradient(rx-26, ryStart-26, rx+26, ryStart+26);
  avatarGrad.addColorStop(0, '#1a9e8f');
  avatarGrad.addColorStop(1, '#0d6058');
  ctx.fillStyle = avatarGrad; ctx.fill();
  ctx.restore();
  // 'K' initial
  txt(ctx, 'K', rx, ryStart + 7, `bold ${18*sf}px -apple-system,sans-serif`, '#fff', 'center');
  // + button
  fillRR(ctx, rx - 10, ryStart + 28, 20, 20, 10, '#1a9e8f');
  txt(ctx, '+', rx, ryStart + 42, `bold ${12*sf}px sans-serif`, '#fff', 'center');

  // Heart
  ctx.save();
  ctx.fillStyle = '#fff';
  ctx.font = `${22*sf}px sans-serif`;
  ctx.textAlign = 'center';
  // Draw heart manually
  const hx = rx, hy = ryStart + gap;
  ctx.beginPath();
  ctx.moveTo(hx, hy + 10);
  ctx.bezierCurveTo(hx, hy + 6, hx - 4, hy, hx - 8, hy);
  ctx.bezierCurveTo(hx - 14, hy, hx - 14, hy + 10, hx - 14, hy + 10);
  ctx.bezierCurveTo(hx - 14, hy + 18, hx - 8, hy + 22, hx, hy + 28);
  ctx.bezierCurveTo(hx + 8, hy + 22, hx + 14, hy + 18, hx + 14, hy + 10);
  ctx.bezierCurveTo(hx + 14, hy + 10, hx + 14, hy, hx + 8, hy);
  ctx.bezierCurveTo(hx + 4, hy, hx, hy + 6, hx, hy + 10);
  ctx.fill();
  ctx.restore();
  txt(ctx, '12.4K', rx, ryStart + gap + 40, `${10*sf}px -apple-system,sans-serif`, 'rgba(255,255,255,0.85)', 'center');

  // Comment bubble
  ctx.save(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
  ctx.beginPath();
  rrect(ctx, rx - 14, ryStart + gap*2 - 14, 28, 24, 8);
  ctx.moveTo(rx - 6, ryStart + gap*2 + 10);
  ctx.lineTo(rx - 14, ryStart + gap*2 + 18);
  ctx.stroke();
  ctx.restore();
  txt(ctx, '384', rx, ryStart + gap*2 + 32, `${10*sf}px -apple-system,sans-serif`, 'rgba(255,255,255,0.85)', 'center');

  // Share arrow
  ctx.save(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(rx - 12, ryStart + gap*3 + 4);
  ctx.lineTo(rx + 12, ryStart + gap*3 - 10);
  ctx.lineTo(rx + 2, ryStart + gap*3 - 10);
  ctx.moveTo(rx + 12, ryStart + gap*3 - 10);
  ctx.lineTo(rx + 12, ryStart + gap*3 + 2);
  ctx.stroke();
  ctx.restore();
  txt(ctx, '2.1K', rx, ryStart + gap*3 + 20, `${10*sf}px -apple-system,sans-serif`, 'rgba(255,255,255,0.85)', 'center');

  // Bookmark
  ctx.save(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(rx - 10, ryStart + gap*4 - 14);
  ctx.lineTo(rx + 10, ryStart + gap*4 - 14);
  ctx.lineTo(rx + 10, ryStart + gap*4 + 14);
  ctx.lineTo(rx, ryStart + gap*4 + 6);
  ctx.lineTo(rx - 10, ryStart + gap*4 + 14);
  ctx.closePath();
  ctx.stroke();
  ctx.restore();

  // Music disc
  fillRR(ctx, rx - 16, ryStart + gap*5 - 16, 32, 32, 16, '#222');
  fillRR(ctx, rx - 8, ryStart + gap*5 - 8, 16, 16, 8, '#1a9e8f');
  fillRR(ctx, rx - 4, ryStart + gap*5 - 4, 8, 8, 4, '#111');

  // ── BOTTOM LEFT INFO ──
  const bx = 18, bY = H - 210;

  // Username line
  txt(ctx, '@kllezo_official', bx, bY, `bold ${13*sf}px -apple-system,sans-serif`, '#fff');
  // Verified badge
  ctx.save();
  ctx.fillStyle = '#1a9e8f';
  ctx.beginPath(); ctx.arc(bx + 176, bY - 8, 10, 0, Math.PI*2); ctx.fill();
  txt(ctx, '✓', bx + 176, bY - 3, `bold ${11*sf}px sans-serif`, '#fff', 'center');
  ctx.restore();

  txt(ctx, 'Content that converts. Attention', bx, bY + 28, `${11*sf}px -apple-system,sans-serif`, 'rgba(255,255,255,0.9)');
  txt(ctx, 'that compounds. Book your free call →', bx, bY + 52, `${11*sf}px -apple-system,sans-serif`, 'rgba(255,255,255,0.9)');

  // Audio info
  ctx.save();
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.font = `${10*sf}px -apple-system,sans-serif`;
  // small music note
  ctx.fillText('♪  Original Audio — KLLEZO Official', bx, bY + 84);
  ctx.restore();

  // Video scrubber
  fillRR(ctx, 0, H - 5, W, 5, 0, 'rgba(255,255,255,0.2)');
  fillRR(ctx, 0, H - 5, W * 0.35, 5, 0, '#fff');

  return { canvas: c, texture: toTexture(c) };
};

/** Content Calendar — landscape 1440×900 */
window.drawContentCalendar = function() {
  const W = 1440, H = 900;
  const { c, ctx } = makeCanvas(W, H);

  // Background
  ctx.fillStyle = '#f8f9fa';
  ctx.fillRect(0, 0, W, H);

  // Header bar
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, W, 64);
  line(ctx, 0, 64, W, 64, '#e5e7eb', 1);

  // Logo/brand area
  fillRR(ctx, 24, 18, 32, 32, 8, '#09453e');
  txt(ctx, 'K', 40, 39, 'bold 16px -apple-system,sans-serif', '#fff', 'center');
  txt(ctx, 'Content Calendar', 66, 38, 'bold 14px -apple-system,sans-serif', '#1a1a1a');
  txt(ctx, '— June 2025', 230, 38, '13px -apple-system,sans-serif', '#6b7280');

  // Navigation
  txt(ctx, '← May', W - 300, 38, '13px -apple-system,sans-serif', '#6b7280');
  txt(ctx, 'June 2025', W - 200, 38, 'bold 13px -apple-system,sans-serif', '#1a1a1a', 'center');
  txt(ctx, 'Jul →', W - 100, 38, '13px -apple-system,sans-serif', '#6b7280');

  // Stats row
  const stats = [
    { label: 'Scheduled', val: '24', col: '#09453e' },
    { label: 'Published', val: '18', col: '#059669' },
    { label: 'Drafts', val: '6', col: '#d97706' },
    { label: 'Reach Est.', val: '84K', col: '#7c3aed' },
  ];
  stats.forEach((s, i) => {
    const sx = W - 620 + i * 150;
    fillRR(ctx, sx, 14, 130, 36, 8, '#f3f4f6');
    txt(ctx, s.val, sx + 14, 34, `bold 15px -apple-system,sans-serif`, s.col);
    txt(ctx, s.label, sx + 14 + 30, 37, '11px -apple-system,sans-serif', '#6b7280');
  });

  // Day headers
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const colW = (W - 140) / 7;
  const headerY = 72;
  days.forEach((d, i) => {
    const dx = 140 + i * colW;
    ctx.fillStyle = i >= 5 ? '#f9fafb' : '#fff';
    ctx.fillRect(dx, headerY, colW, 30);
    txt(ctx, d, dx + colW/2, headerY + 20, 'bold 11px -apple-system,sans-serif', i >= 5 ? '#9ca3af' : '#374151', 'center');
    line(ctx, dx, headerY, dx, H, '#e5e7eb');
  });
  line(ctx, 140, headerY, W, headerY, '#e5e7eb');

  // Sidebar (dates)
  const weeks = 5;
  const rowH = (H - 102) / weeks;
  const weekDates = [
    [2,3,4,5,6,7,8],
    [9,10,11,12,13,14,15],
    [16,17,18,19,20,21,22],
    [23,24,25,26,27,28,29],
    [30,1,2,3,4,5,6],
  ];

  weekDates.forEach((wk, wi) => {
    const wy = 102 + wi * rowH;
    line(ctx, 0, wy, W, wy, '#e5e7eb');
    // Week label
    txt(ctx, `W${wi+24}`, 16, wy + 18, 'bold 10px -apple-system,sans-serif', '#9ca3af');
    txt(ctx, `${wk[0]}—${wk[6]}`, 16, wy + 34, '10px -apple-system,sans-serif', '#d1d5db');
  });

  // Content cards
  const posts = [
    { wk:0, day:0, type:'Reel', title:'5 Business Hacks', col:'#dcfce7', border:'#059669', icon:'▶' },
    { wk:0, day:1, type:'Story', title:'Behind the Scenes', col:'#fef3c7', border:'#d97706', icon:'◉' },
    { wk:0, day:2, type:'Carousel', title:'Why Content Wins', col:'#ede9fe', border:'#7c3aed', icon:'⊞' },
    { wk:0, day:4, type:'Reel', title:'Client Results 2025', col:'#dcfce7', border:'#059669', icon:'▶' },
    { wk:0, day:5, type:'Story', title:'Weekend Motivation', col:'#fef3c7', border:'#d97706', icon:'◉' },
    { wk:1, day:0, type:'Post', title:'Top 10 Strategies', col:'#dbeafe', border:'#2563eb', icon:'□' },
    { wk:1, day:1, type:'Reel', title:'AI Tools for Growth', col:'#dcfce7', border:'#059669', icon:'▶' },
    { wk:1, day:3, type:'Carousel', title:'Platform Comparison', col:'#ede9fe', border:'#7c3aed', icon:'⊞' },
    { wk:1, day:4, type:'Reel', title:'Lead Gen Masterclass', col:'#dcfce7', border:'#059669', icon:'▶' },
    { wk:1, day:6, type:'Story', title:'Sunday Recap', col:'#fef3c7', border:'#d97706', icon:'◉' },
    { wk:2, day:0, type:'Reel', title:'Website Case Study', col:'#dcfce7', border:'#059669', icon:'▶' },
    { wk:2, day:1, type:'Post', title:'Industry Insights', col:'#dbeafe', border:'#2563eb', icon:'□' },
    { wk:2, day:2, type:'Reel', title:'AI Calling Demo', col:'#dcfce7', border:'#059669', icon:'▶' },
    { wk:2, day:4, type:'Carousel', title:'Client Testimonials', col:'#ede9fe', border:'#7c3aed', icon:'⊞' },
    { wk:3, day:0, type:'Reel', title:'Monthly Wrap-Up', col:'#dcfce7', border:'#059669', icon:'▶' },
    { wk:3, day:2, type:'Story', title:'Team Spotlight', col:'#fef3c7', border:'#d97706', icon:'◉' },
    { wk:3, day:3, type:'Post', title:'Q3 Goals Revealed', col:'#dbeafe', border:'#2563eb', icon:'□' },
    { wk:3, day:5, type:'Reel', title:'Success Stories', col:'#dcfce7', border:'#059669', icon:'▶' },
  ];

  posts.forEach(p => {
    const cx = 140 + p.day * colW + 4;
    const cy = 102 + p.wk * rowH + 6;
    const cw = colW - 8;
    const ch = Math.min(64, rowH - 12);
    fillRR(ctx, cx, cy, cw, ch, 8, p.col);
    ctx.save();
    ctx.strokeStyle = p.border; ctx.lineWidth = 2;
    rrect(ctx, cx, cy, cw, ch, 8); ctx.stroke();
    ctx.restore();
    txt(ctx, `${p.icon} ${p.type}`, cx + 8, cy + 16, 'bold 9px -apple-system,sans-serif', p.border);
    txt(ctx, p.title, cx + 8, cy + 32, '9px -apple-system,sans-serif', '#374151');
  });

  // Platform legend
  const platforms = [
    { name: 'Reel', col: '#059669' },
    { name: 'Carousel', col: '#7c3aed' },
    { name: 'Story', col: '#d97706' },
    { name: 'Post', col: '#2563eb' },
  ];
  platforms.forEach((p, i) => {
    const lx = 14 + i * 34;
    // not enough space in sidebar, draw at very bottom if space
  });

  return { canvas: c, texture: toTexture(c) };
};

/** Analytics Dashboard — landscape dark */
window.drawAnalyticsDashboard = function() {
  const W = 1440, H = 900;
  const { c, ctx } = makeCanvas(W, H);

  ctx.fillStyle = '#0d1117'; ctx.fillRect(0, 0, W, H);

  // Sidebar
  ctx.fillStyle = '#161b22'; ctx.fillRect(0, 0, 220, H);
  line(ctx, 220, 0, 220, H, '#30363d');

  // Sidebar logo
  fillRR(ctx, 16, 18, 36, 36, 10, '#09453e');
  txt(ctx, 'KLLEZO', 28, 41, 'bold 9px -apple-system,sans-serif', '#fff');

  // Sidebar nav items
  const navItems = ['Dashboard', 'Content', 'Analytics', 'Audience', 'Publishing', 'Settings'];
  navItems.forEach((n, i) => {
    const ny = 90 + i * 44;
    if (i === 2) { // Analytics active
      fillRR(ctx, 8, ny - 10, 204, 34, 8, '#09453e');
      txt(ctx, n, 44, ny + 7, 'bold 12px -apple-system,sans-serif', '#fff');
    } else {
      txt(ctx, n, 44, ny + 7, '12px -apple-system,sans-serif', '#8b949e');
    }
  });

  // Main area header
  txt(ctx, 'Analytics Overview', 248, 36, 'bold 18px -apple-system,sans-serif', '#e6edf3');
  txt(ctx, 'Last 30 days · Jun 2025', 248, 56, '12px -apple-system,sans-serif', '#8b949e');

  // Date range picker
  fillRR(ctx, W - 200, 18, 160, 34, 8, '#21262d');
  strokeRR(ctx, W - 200, 18, 160, 34, 8, '#30363d');
  txt(ctx, 'May 15 – Jun 14', W - 120, 40, '11px -apple-system,sans-serif', '#e6edf3', 'center');
  txt(ctx, '▾', W - 56, 40, '10px sans-serif', '#8b949e');

  // KPI Cards row
  const kpis = [
    { label: 'Total Reach', val: '2.4M', delta: '+34%', col: '#1f6feb', bg: '#0d1f3c' },
    { label: 'Impressions', val: '8.7M', delta: '+18%', col: '#238636', bg: '#0d2b1f' },
    { label: 'Engagement Rate', val: '4.2%', delta: '+0.8%', col: '#a371f7', bg: '#1f0d3c' },
    { label: 'New Followers', val: '+12.4K', delta: '+22%', col: '#f78166', bg: '#3c1a0d' },
  ];
  const cw = (W - 248 - 24) / 4 - 12;
  kpis.forEach((k, i) => {
    const kx = 248 + i * (cw + 12);
    fillRR(ctx, kx, 76, cw, 100, 12, '#161b22');
    strokeRR(ctx, kx, 76, cw, 100, 12, '#30363d');
    txt(ctx, k.label, kx + 16, 100, '11px -apple-system,sans-serif', '#8b949e');
    txt(ctx, k.val, kx + 16, 130, `bold 22px -apple-system,sans-serif`, '#e6edf3');
    fillRR(ctx, kx + 16, 140, 54, 20, 6, k.bg);
    txt(ctx, k.delta, kx + 43, 154, 'bold 10px -apple-system,sans-serif', k.col, 'center');
  });

  // Main chart
  const chartX = 248, chartY = 200, chartW = W - 248 - 300, chartH = 300;
  fillRR(ctx, chartX, chartY, chartW, chartH, 12, '#161b22');
  strokeRR(ctx, chartX, chartY, chartW, chartH, 12, '#30363d');
  txt(ctx, 'Reach Over Time', chartX + 16, chartY + 26, 'bold 13px -apple-system,sans-serif', '#e6edf3');
  txt(ctx, 'Daily reach across all platforms', chartX + 16, chartY + 44, '11px -apple-system,sans-serif', '#8b949e');

  // Chart gridlines
  ctx.save();
  ctx.strokeStyle = '#21262d'; ctx.lineWidth = 1;
  for (let g = 0; g < 5; g++) {
    const gy = chartY + 60 + g * (chartH - 80) / 4;
    ctx.beginPath(); ctx.moveTo(chartX + 16, gy); ctx.lineTo(chartX + chartW - 16, gy); ctx.stroke();
    txt(ctx, `${1200 - g * 300}K`, chartX + 20, gy - 4, '10px -apple-system,sans-serif', '#6e7681');
  }
  ctx.restore();

  // Chart data — smooth line
  const dataPoints = [0.3, 0.45, 0.38, 0.52, 0.48, 0.65, 0.7, 0.58, 0.72, 0.8, 0.75, 0.88, 0.82, 0.92,
    0.78, 0.85, 0.9, 0.95, 0.88, 0.76, 0.82, 0.9, 0.95, 0.88, 0.92, 0.98, 0.85, 0.9, 0.95, 1.0];
  const ptW = (chartW - 60) / (dataPoints.length - 1);
  const ptH = chartH - 100;
  const ptStartY = chartY + 60 + ptH;

  // Area fill
  const areaGrad = ctx.createLinearGradient(0, chartY + 60, 0, ptStartY);
  areaGrad.addColorStop(0, 'rgba(31,111,235,0.35)');
  areaGrad.addColorStop(1, 'rgba(31,111,235,0)');
  ctx.beginPath();
  ctx.moveTo(chartX + 44, ptStartY - dataPoints[0] * ptH);
  dataPoints.forEach((v, i) => {
    const px = chartX + 44 + i * ptW;
    const py = ptStartY - v * ptH;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  });
  ctx.lineTo(chartX + 44 + (dataPoints.length-1) * ptW, ptStartY);
  ctx.lineTo(chartX + 44, ptStartY);
  ctx.closePath();
  ctx.fillStyle = areaGrad; ctx.fill();

  // Line
  ctx.save(); ctx.strokeStyle = '#1f6feb'; ctx.lineWidth = 2.5; ctx.lineJoin = 'round';
  ctx.beginPath();
  dataPoints.forEach((v, i) => {
    const px = chartX + 44 + i * ptW;
    const py = ptStartY - v * ptH;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  });
  ctx.stroke(); ctx.restore();

  // Chart dot at end
  const lastPx = chartX + 44 + 29 * ptW;
  const lastPy = ptStartY - 1.0 * ptH;
  ctx.fillStyle = '#1f6feb';
  ctx.beginPath(); ctx.arc(lastPx, lastPy, 5, 0, Math.PI*2); ctx.fill();
  fillRR(ctx, lastPx - 2, lastPy - 2, 4, 4, 2, '#fff');

  // X-axis labels
  ['Jun 1', 'Jun 8', 'Jun 15', 'Jun 22', 'Jun 30'].forEach((l, i) => {
    txt(ctx, l, chartX + 44 + i * ptW * 7.25, chartY + chartH - 12, '9px -apple-system,sans-serif', '#6e7681', 'center');
  });

  // Right panel — Top Posts
  const rpX = W - 276, rpY = 76;
  fillRR(ctx, rpX, rpY, 256, 424, 12, '#161b22');
  strokeRR(ctx, rpX, rpY, 256, 424, 12, '#30363d');
  txt(ctx, 'Top Posts', rpX + 16, rpY + 26, 'bold 13px -apple-system,sans-serif', '#e6edf3');
  txt(ctx, 'This month', rpX + 16, rpY + 44, '11px -apple-system,sans-serif', '#8b949e');

  const posts = [
    { title: 'AI Calling Demo', reach: '124K', eng: '8.4%', type: '▶ Reel' },
    { title: 'Website Case Study', reach: '98K', eng: '6.2%', type: '⊞ Carousel' },
    { title: '5 Business Hacks', reach: '87K', eng: '7.1%', type: '▶ Reel' },
    { title: 'Client Results 2025', reach: '72K', eng: '5.8%', type: '▶ Reel' },
    { title: 'Lead Gen Masterclass', reach: '61K', eng: '4.9%', type: '⊞ Carousel' },
  ];
  posts.forEach((p, i) => {
    const py = rpY + 60 + i * 70;
    fillRR(ctx, rpX + 12, py, 232, 58, 8, '#0d1117');
    // Thumbnail
    fillRR(ctx, rpX + 20, py + 8, 40, 40, 6, '#09453e');
    txt(ctx, p.type.charAt(0), rpX + 40, py + 33, 'bold 14px sans-serif', '#1a9e8f', 'center');
    txt(ctx, p.title, rpX + 72, py + 22, 'bold 11px -apple-system,sans-serif', '#e6edf3');
    txt(ctx, `${p.reach} reach · ${p.eng} eng`, rpX + 72, py + 40, '10px -apple-system,sans-serif', '#8b949e');
    // Bar
    fillRR(ctx, rpX + 72, py + 50, 160, 4, 2, '#21262d');
    const bw = parseFloat(p.eng) / 9 * 160;
    fillRR(ctx, rpX + 72, py + 50, bw, 4, 2, '#1f6feb');
  });

  // Bottom platform breakdown
  const bpY = 520;
  fillRR(ctx, chartX, bpY, W - 248 - 16, 140, 12, '#161b22');
  strokeRR(ctx, chartX, bpY, W - 248 - 16, 140, 12, '#30363d');
  txt(ctx, 'Platform Breakdown', chartX + 16, bpY + 26, 'bold 13px -apple-system,sans-serif', '#e6edf3');

  const platforms = [
    { name: 'Instagram', pct: 0.48, col: '#e1306c', val: '1.15M' },
    { name: 'TikTok', pct: 0.28, col: '#69c9d0', val: '672K' },
    { name: 'YouTube', pct: 0.14, col: '#ff0000', val: '336K' },
    { name: 'LinkedIn', pct: 0.10, col: '#0077b5', val: '240K' },
  ];
  platforms.forEach((p, i) => {
    const bw = (W - 248 - 16 - 32) * p.pct;
    const bx = chartX + 16;
    const by = bpY + 48 + i * 22;
    txt(ctx, p.name, bx, by + 12, '11px -apple-system,sans-serif', '#8b949e');
    fillRR(ctx, bx + 100, by + 2, bw, 14, 4, p.col + '55');
    fillRR(ctx, bx + 100, by + 2, bw * 0.7, 14, 4, p.col);
    txt(ctx, p.val, bx + 100 + bw + 10, by + 13, 'bold 10px -apple-system,sans-serif', '#e6edf3');
  });

  // Footer bar
  fillRR(ctx, chartX, H - 100, W - 248 - 16, 80, 12, '#161b22');
  strokeRR(ctx, chartX, H - 100, W - 248 - 16, 80, 12, '#30363d');
  const fstats = ['24 posts/month', '4.2% avg engagement', '2.4M total reach', '↑ 34% MoM growth'];
  fstats.forEach((f, i) => {
    const fx = chartX + 24 + i * (W - 248 - 16) / 4;
    txt(ctx, f, fx, H - 54, 'bold 12px -apple-system,sans-serif', '#e6edf3');
  });

  return { canvas: c, texture: toTexture(c) };
};

/* ════════════════════════════════════════════
   WEBSITE WORLD TEXTURES
   ════════════════════════════════════════════ */

/** Premium landing page — Stripe/Linear aesthetic */
window.drawLandingPage = function(variant = 0) {
  const W = 1440, H = 900;
  const { c, ctx } = makeCanvas(W, H);

  const themes = [
    { bg: '#ffffff', accent: '#09453e', cta: '#09453e', text: '#0f1117', sub: '#6b7280' },
    { bg: '#0f1117', accent: '#1a9e8f', cta: '#1a9e8f', text: '#f0f6fc', sub: '#8b949e' },
    { bg: '#fafafa', accent: '#2563eb', cta: '#2563eb', text: '#0f172a', sub: '#64748b' },
  ];
  const th = themes[variant % 3];

  ctx.fillStyle = th.bg; ctx.fillRect(0, 0, W, H);

  // Grid background (Stripe-style)
  ctx.save();
  ctx.strokeStyle = variant === 1 ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)';
  ctx.lineWidth = 1;
  for (let x = 0; x < W; x += 60) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
  for (let y = 0; y < H; y += 60) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }
  ctx.restore();

  // Nav
  ctx.fillStyle = variant === 1 ? 'rgba(15,17,23,0.85)' : 'rgba(255,255,255,0.85)';
  ctx.fillRect(0, 0, W, 64);
  ctx.save(); ctx.filter = 'blur(0px)'; ctx.restore();

  // Logo
  fillRR(ctx, 32, 16, 32, 32, 8, th.accent);
  txt(ctx, 'K', 48, 36, 'bold 14px -apple-system,sans-serif', '#fff', 'center');
  txt(ctx, 'KLLEZO', 72, 37, 'bold 14px -apple-system,sans-serif', th.text);

  // Nav links
  const navLinks = ['Content', 'Websites', 'AI Calling', 'AI Texting', 'Pricing'];
  navLinks.forEach((nl, i) => {
    txt(ctx, nl, 200 + i * 110, 37, '13px -apple-system,sans-serif', th.sub);
  });

  // CTA button
  fillRR(ctx, W - 160, 16, 128, 34, 8, th.cta);
  txt(ctx, 'Book Strategy Call', W - 96, 37, 'bold 11px -apple-system,sans-serif', '#fff', 'center');

  line(ctx, 0, 64, W, 64, variant === 1 ? '#21262d' : '#e5e7eb');

  // Hero badge
  const badgeTxt = ['Content That Converts', 'Websites That Sell', 'AI That Closes Deals'][variant];
  fillRR(ctx, W/2 - 120, 110, 240, 28, 20, th.accent + '1a');
  strokeRR(ctx, W/2 - 120, 110, 240, 28, 20, th.accent + '44');
  txt(ctx, `🚀 ${badgeTxt}`, W/2, 129, 'bold 11px -apple-system,sans-serif', th.accent, 'center');

  // Hero headline
  const headlines = [
    ['Content That Earns', 'Attention At Scale'],
    ['Websites That Turn', 'Visitors Into Revenue'],
    ['AI That Grows Your', 'Business While You Sleep'],
  ];
  const hl = headlines[variant];
  txt(ctx, hl[0], W/2, 198, `bold 52px -apple-system,sans-serif`, th.text, 'center');
  txt(ctx, hl[1], W/2, 264, `bold 52px -apple-system,sans-serif`, th.accent, 'center');

  // Subheadline
  const subs = [
    'Stop posting into the void. KLLEZO builds content systems that generate real leads.',
    'Your website should be your best salesperson. We build sites that convert 24/7.',
    'Our AI agents call, qualify, and book appointments — all without human intervention.',
  ];
  txt(ctx, subs[variant], W/2, 312, '18px -apple-system,sans-serif', th.sub, 'center');

  // CTA buttons
  fillRR(ctx, W/2 - 196, 352, 184, 52, 10, th.cta);
  txt(ctx, 'Book A Strategy Call', W/2 - 104, 383, 'bold 14px -apple-system,sans-serif', '#fff', 'center');

  fillRR(ctx, W/2 + 12, 352, 184, 52, 10, 'transparent');
  strokeRR(ctx, W/2 + 12, 352, 184, 52, 10, th.accent + '66');
  txt(ctx, 'See Case Studies →', W/2 + 104, 383, '14px -apple-system,sans-serif', th.accent, 'center');

  // Social proof
  txt(ctx, 'Trusted by 200+ businesses', W/2, 430, '12px -apple-system,sans-serif', th.sub, 'center');
  // Stars
  txt(ctx, '★★★★★', W/2, 454, '14px sans-serif', '#f59e0b', 'center');
  txt(ctx, '5.0 · 147 reviews', W/2, 474, '11px -apple-system,sans-serif', th.sub, 'center');

  // Feature strip
  const feats = [
    { icon: '📱', title: 'Content Engine', desc: 'Reels · Carousels · Stories' },
    { icon: '🌐', title: 'Websites', desc: 'Landing · Funnels · Stores' },
    { icon: '📞', title: 'AI Calling', desc: 'Outbound · Qualify · Book' },
    { icon: '💬', title: 'AI Texting', desc: 'Follow-up · Nurture · Close' },
  ];
  const fY = 510;
  ctx.fillStyle = variant === 1 ? '#161b22' : '#f8f9fa';
  ctx.fillRect(0, fY, W, H - fY);
  line(ctx, 0, fY, W, fY, variant === 1 ? '#21262d' : '#e5e7eb');

  feats.forEach((f, i) => {
    const fx = 80 + i * 330;
    fillRR(ctx, fx, fY + 30, 290, 120, 12, variant === 1 ? '#1c2128' : '#fff');
    strokeRR(ctx, fx, fY + 30, 290, 120, 12, variant === 1 ? '#30363d' : '#e5e7eb');
    txt(ctx, f.icon, fx + 28, fY + 74, '28px sans-serif', '#fff');
    txt(ctx, f.title, fx + 68, fY + 68, 'bold 14px -apple-system,sans-serif', th.text);
    txt(ctx, f.desc, fx + 68, fY + 90, '12px -apple-system,sans-serif', th.sub);
  });

  // Metrics row
  const metrics = ['3× more leads', '40hrs saved/week', '24/7 automation', '200+ clients'];
  metrics.forEach((m, i) => {
    const mx = 80 + i * 330;
    txt(ctx, m, mx + 145, fY + 192, 'bold 16px -apple-system,sans-serif', th.accent, 'center');
  });

  // Bottom CTA bar
  ctx.fillStyle = th.accent;
  ctx.fillRect(0, H - 100, W, 100);
  txt(ctx, 'Ready to grow your business?', W/2, H - 58, 'bold 22px -apple-system,sans-serif', '#fff', 'center');
  fillRR(ctx, W/2 - 100, H - 44, 200, 34, 8, '#fff');
  txt(ctx, 'Book Free Strategy Call', W/2, H - 22, 'bold 12px -apple-system,sans-serif', th.accent, 'center');

  return { canvas: c, texture: toTexture(c) };
};

/** Booking flow — calendar + form */
window.drawBookingFlow = function() {
  const W = 1440, H = 900;
  const { c, ctx } = makeCanvas(W, H);

  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H);

  // Left panel — service info
  ctx.fillStyle = '#09453e'; ctx.fillRect(0, 0, 460, H);

  // Logo in left panel
  txt(ctx, 'KLLEZO', 40, 60, 'bold 22px -apple-system,sans-serif', '#fff');
  fillRR(ctx, 40, 80, 48, 3, 2, 'rgba(255,255,255,0.3)');

  txt(ctx, 'Strategy Call', 40, 140, 'bold 28px -apple-system,sans-serif', '#fff');
  txt(ctx, '30 min · Free · Google Meet', 40, 172, '14px -apple-system,sans-serif', 'rgba(255,255,255,0.7)');

  // Divider
  line(ctx, 40, 200, 420, 200, 'rgba(255,255,255,0.2)');

  // What to expect
  txt(ctx, 'What we\'ll cover:', 40, 232, 'bold 13px -apple-system,sans-serif', 'rgba(255,255,255,0.9)');
  const items = [
    '→ Your current marketing setup',
    '→ Biggest growth bottlenecks',
    '→ Which KLLEZO services fit best',
    '→ Expected ROI & timeline',
    '→ Custom strategy for your business',
  ];
  items.forEach((it, i) => {
    txt(ctx, it, 52, 262 + i * 30, '13px -apple-system,sans-serif', 'rgba(255,255,255,0.75)');
  });

  // Testimonial
  fillRR(ctx, 30, 440, 400, 110, 12, 'rgba(255,255,255,0.1)');
  txt(ctx, '"KLLEZO 10x\'d our lead volume in 90 days."', 50, 474, 'italic 12px -apple-system,sans-serif', 'rgba(255,255,255,0.9)');
  fillRR(ctx, 50, 500, 32, 32, 16, '#fff');
  txt(ctx, 'JR', 66, 522, 'bold 11px sans-serif', '#09453e', 'center');
  txt(ctx, 'James R. — Roofing Company Owner', 94, 522, '11px -apple-system,sans-serif', 'rgba(255,255,255,0.7)');

  // Availability note
  txt(ctx, '⏱  Usually available within 24 hours', 40, 580, '12px -apple-system,sans-serif', 'rgba(255,255,255,0.6)');
  txt(ctx, '🔒  No credit card required', 40, 606, '12px -apple-system,sans-serif', 'rgba(255,255,255,0.6)');
  txt(ctx, '📍  Remote — Google Meet link sent', 40, 632, '12px -apple-system,sans-serif', 'rgba(255,255,255,0.6)');

  // RIGHT PANEL — Calendar
  // Month header
  txt(ctx, 'June 2025', 650, 50, 'bold 20px -apple-system,sans-serif', '#111827');
  txt(ctx, '←', 600, 54, '18px sans-serif', '#6b7280');
  txt(ctx, '→', 870, 54, '18px sans-serif', '#6b7280');
  line(ctx, 480, 70, W, 70, '#f3f4f6');

  // Days header
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  dayNames.forEach((d, i) => {
    txt(ctx, d, 510 + i * 120, 105, 'bold 12px -apple-system,sans-serif', '#9ca3af', 'center');
  });
  line(ctx, 480, 115, W, 115, '#f3f4f6');

  // Calendar grid
  const weeks2 = [[1,2,3,4,5,6,7],[8,9,10,11,12,13,14],[15,16,17,18,19,20,21],[22,23,24,25,26,27,28],[29,30,1,2,3,4,5]];
  const available = [2,3,4,9,10,11,16,17,18,23,24,25,30];
  const selected = 17;
  weeks2.forEach((wk, wi) => {
    wk.forEach((d, di) => {
      const cx = 510 + di * 120;
      const cy = 140 + wi * 80;
      const isAvail = available.includes(d) && (wi < 4 || d <= 30);
      const isSel = d === selected && wi === 2;
      if (isSel) {
        fillRR(ctx, cx - 22, cy - 20, 44, 44, 22, '#09453e');
        txt(ctx, String(d), cx, cy + 7, 'bold 14px -apple-system,sans-serif', '#fff', 'center');
      } else if (isAvail) {
        strokeRR(ctx, cx - 22, cy - 20, 44, 44, 22, '#09453e', 1);
        txt(ctx, String(d), cx, cy + 7, '14px -apple-system,sans-serif', '#09453e', 'center');
      } else {
        txt(ctx, String(d), cx, cy + 7, '14px -apple-system,sans-serif', '#d1d5db', 'center');
      }
    });
  });

  // Time slots panel
  line(ctx, 880, 70, 880, H, '#f3f4f6');
  txt(ctx, 'Select a Time', 920, 100, 'bold 15px -apple-system,sans-serif', '#111827');
  txt(ctx, 'Wednesday, June 17', 920, 122, '12px -apple-system,sans-serif', '#6b7280');

  const times = ['9:00 AM','9:30 AM','10:00 AM','10:30 AM','11:00 AM','11:30 AM','1:00 PM','1:30 PM','2:00 PM','2:30 PM','3:00 PM'];
  times.forEach((t, i) => {
    const ty = 148 + i * 56;
    const isSel = t === '2:00 PM';
    if (isSel) {
      fillRR(ctx, 900, ty, 480, 40, 8, '#09453e');
      txt(ctx, t, 1140, ty + 25, 'bold 13px -apple-system,sans-serif', '#fff', 'center');
    } else {
      fillRR(ctx, 900, ty, 480, 40, 8, '#fff');
      strokeRR(ctx, 900, ty, 480, 40, 8, '#e5e7eb');
      txt(ctx, t, 1140, ty + 25, '13px -apple-system,sans-serif', '#374151', 'center');
    }
  });

  // Confirm button
  fillRR(ctx, 900, H - 80, 480, 50, 10, '#09453e');
  txt(ctx, 'Confirm Appointment →', 1140, H - 49, 'bold 14px -apple-system,sans-serif', '#fff', 'center');

  return { canvas: c, texture: toTexture(c) };
};

/* ════════════════════════════════════════════
   AI CALLING WORLD TEXTURES
   ════════════════════════════════════════════ */

/** Active AI Call Screen — dark phone UI */
window.drawActiveCallScreen = function() {
  const W = 780, H = 1688;
  const { c, ctx } = makeCanvas(W, H);
  const sf = 2;

  ctx.fillStyle = '#060810'; ctx.fillRect(0, 0, W, H);

  // Status bar
  txt(ctx, '9:41 AM', 44, 46, `${11*sf}px -apple-system,sans-serif`, 'rgba(255,255,255,0.9)');
  txt(ctx, '●●● WiFi 5G', W - 40, 46, `${11*sf}px -apple-system,sans-serif`, 'rgba(255,255,255,0.9)', 'right');

  // AI badge
  fillRR(ctx, W/2 - 80, 68, 160, 32, 16, '#00d084' + '22');
  strokeRR(ctx, W/2 - 80, 68, 160, 32, 16, '#00d084' + '66');
  ctx.fillStyle = '#00d084';
  ctx.beginPath(); ctx.arc(W/2 - 52, 84, 5, 0, Math.PI*2); ctx.fill();
  txt(ctx, 'AI CALLING AGENT', W/2 + 8, 89, `bold ${9*sf}px -apple-system,sans-serif`, '#00d084', 'center');

  // Contact info
  // Avatar
  const avR = 60;
  const avX = W/2, avY = 230;
  const avGrad = ctx.createRadialGradient(avX, avY, 10, avX, avY, avR);
  avGrad.addColorStop(0, '#1a9e8f');
  avGrad.addColorStop(1, '#09453e');
  ctx.fillStyle = avGrad;
  ctx.beginPath(); ctx.arc(avX, avY, avR, 0, Math.PI*2); ctx.fill();
  txt(ctx, 'MT', avX, avY + 12, `bold ${22*sf}px -apple-system,sans-serif`, '#fff', 'center');

  txt(ctx, 'Michael Thompson', W/2, 322, `bold ${16*sf}px -apple-system,sans-serif`, '#fff', 'center');
  txt(ctx, 'Roofing Solutions Inc. · (312) 555-0194', W/2, 354, `${11*sf}px -apple-system,sans-serif`, 'rgba(255,255,255,0.55)', 'center');

  // Call status
  txt(ctx, '● LIVE CALL', W/2, 390, `bold ${10*sf}px -apple-system,sans-serif`, '#00d084', 'center');
  txt(ctx, '00:02:34', W/2, 420, `${14*sf}px "SF Mono",monospace,sans-serif`, 'rgba(255,255,255,0.8)', 'center');

  // Waveform bars
  const waveY = 470, waveW = 540, waveH = 60;
  const waveX = (W - waveW) / 2;
  const bars = 40;
  const barW2 = waveW / bars - 2;
  const waveData = [0.3,0.5,0.8,0.6,0.9,0.7,0.4,0.6,0.8,0.5,0.7,0.9,0.6,0.4,0.7,0.8,0.5,0.9,0.6,0.7,
    0.8,0.5,0.6,0.9,0.7,0.4,0.6,0.8,0.5,0.7,0.9,0.6,0.4,0.7,0.8,0.3,0.5,0.6,0.4,0.3];
  waveData.forEach((v, i) => {
    const bh = v * waveH;
    const bx = waveX + i * (barW2 + 2);
    const by = waveY + (waveH - bh) / 2;
    const progress = i / bars;
    fillRR(ctx, bx, by, barW2, bh, 2, progress < 0.6 ? '#1a9e8f' : 'rgba(255,255,255,0.15)');
  });

  // AI Status label
  fillRR(ctx, W/2 - 200, 555, 400, 48, 10, 'rgba(255,255,255,0.06)');
  txt(ctx, '🤖  AI speaking — Qualifying lead...', W/2, 584, `${11*sf}px -apple-system,sans-serif`, 'rgba(255,255,255,0.7)', 'center');

  // Live transcript panel
  const tpX = 30, tpY = 630, tpW = W - 60;
  fillRR(ctx, tpX, tpY, tpW, 720, 16, 'rgba(255,255,255,0.04)');
  strokeRR(ctx, tpX, tpY, tpW, 720, 16, 'rgba(255,255,255,0.1)');

  txt(ctx, 'LIVE TRANSCRIPT', tpX + 24, tpY + 32, `bold ${9*sf}px -apple-system,sans-serif`, 'rgba(255,255,255,0.35)');
  // Live dot
  ctx.fillStyle = '#00d084';
  ctx.beginPath(); ctx.arc(tpX + tpW - 28, tpY + 28, 5, 0, Math.PI*2); ctx.fill();

  const transcript = [
    { speaker: 'AI', text: 'Hi Michael, this is Sarah calling from KLLEZO. You recently enquired about our growth services — is this a good time?', time: '00:00' },
    { speaker: 'M', text: 'Oh yeah, perfect timing actually. I\'ve been meaning to follow up.', time: '00:12' },
    { speaker: 'AI', text: 'Wonderful! I\'d love to understand your current marketing setup. How are you currently generating new roofing leads?', time: '00:20' },
    { speaker: 'M', text: 'Mostly word of mouth and some Facebook ads, but the cost per lead has been really high lately.', time: '00:35' },
    { speaker: 'AI', text: 'That\'s very common. Our clients typically reduce their cost per lead by 60% within the first 90 days. Would you be open to a quick strategy session with our founder?', time: '01:02' },
    { speaker: 'M', text: 'Yeah, definitely. What does that involve?', time: '01:18' },
    { speaker: 'AI', text: 'It\'s a 30-minute call where we map out a custom growth plan for your roofing business — completely free, no obligation.', time: '01:25' },
  ];

  transcript.forEach((tr, i) => {
    const ty = tpY + 60 + i * 90;
    const isAI = tr.speaker === 'AI';
    fillRR(ctx, tpX + 16, ty, 26, 26, 13, isAI ? '#1a9e8f' : '#374151');
    txt(ctx, tr.speaker, tpX + 29, ty + 18, `bold ${9*sf}px sans-serif`, '#fff', 'center');
    const textX = tpX + 52;
    const maxW = tpW - 80;
    txt(ctx, tr.text.substring(0, 70) + (tr.text.length > 70 ? '...' : ''), textX, ty + 16, `${9.5*sf}px -apple-system,sans-serif`, isAI ? '#e6edf3' : 'rgba(255,255,255,0.75)');
    txt(ctx, tr.time, tpX + tpW - 20, ty + 16, `${9*sf}px mono,sans-serif`, 'rgba(255,255,255,0.3)', 'right');
  });

  // Typing indicator
  const ttY = tpY + 700;
  fillRR(ctx, tpX + 16, ttY, 60, 24, 12, 'rgba(255,255,255,0.08)');
  [0,1,2].forEach(i => {
    fillRR(ctx, tpX + 28 + i * 14, ttY + 8, 8, 8, 4, 'rgba(255,255,255,0.5)');
  });
  txt(ctx, 'Michael is typing...', tpX + 86, ttY + 16, `${9*sf}px -apple-system,sans-serif`, 'rgba(255,255,255,0.35)');

  // Bottom controls
  const ctrlY = H - 160;
  const ctrls = [
    { label: 'Mute', icon: '🔇', col: '#21262d' },
    { label: 'Schedule', icon: '📅', col: '#09453e' },
    { label: 'Transfer', icon: '↗', col: '#21262d' },
    { label: 'End', icon: '✕', col: '#cf222e' },
  ];
  ctrls.forEach((ctrl, i) => {
    const cx = 90 + i * 160;
    fillRR(ctx, cx - 36, ctrlY, 72, 72, 36, ctrl.col);
    txt(ctx, ctrl.icon, cx, ctrlY + 38, `${18*sf}px sans-serif`, '#fff', 'center');
    txt(ctx, ctrl.label, cx, ctrlY + 82, `${9*sf}px -apple-system,sans-serif`, 'rgba(255,255,255,0.5)', 'center');
  });

  return { canvas: c, texture: toTexture(c) };
};

/** Lead Pipeline / CRM — Kanban + table */
window.drawSalesPipeline = function() {
  const W = 1440, H = 900;
  const { c, ctx } = makeCanvas(W, H);

  ctx.fillStyle = '#0d1117'; ctx.fillRect(0, 0, W, H);

  // Header
  ctx.fillStyle = '#161b22'; ctx.fillRect(0, 0, W, 64);
  line(ctx, 0, 64, W, 64, '#30363d');

  txt(ctx, 'AI Lead Pipeline', 24, 38, 'bold 16px -apple-system,sans-serif', '#e6edf3');
  txt(ctx, '● Live', 180, 38, 'bold 12px -apple-system,sans-serif', '#00d084');

  // Stats in header
  const pstats = [
    { label: 'Active Calls', val: '7', col: '#00d084' },
    { label: 'Queued', val: '43', col: '#f59e0b' },
    { label: 'Booked Today', val: '12', col: '#1f6feb' },
    { label: 'Conv Rate', val: '28%', col: '#a371f7' },
  ];
  pstats.forEach((s, i) => {
    const sx = W - 560 + i * 130;
    txt(ctx, s.val, sx, 30, `bold 18px -apple-system,sans-serif`, s.col);
    txt(ctx, s.label, sx, 50, '10px -apple-system,sans-serif', '#8b949e');
  });

  // Kanban columns
  const cols = [
    { name: 'New Leads', count: 18, col: '#1f6feb', leads: [
      { name: 'Sarah Johnson', co: 'Plumbing Pro', score: 72, note: 'Interested in content package' },
      { name: 'David Kim', co: 'Kim HVAC', score: 85, note: 'High-value — urgent need' },
      { name: 'Emma Davis', co: 'Davis Dental', score: 68, note: 'Requested website quote' },
      { name: 'Carlos Rivera', co: 'Rivera Roofing', score: 91, note: 'Qualified — decision maker' },
    ]},
    { name: 'AI Calling', count: 7, col: '#00d084', leads: [
      { name: 'Michael Thompson', co: 'Thompson Roof', score: 87, note: '● Live — 2:34 in call' },
      { name: 'Lisa Park', co: 'Park Electrical', score: 79, note: 'Callback requested 3pm' },
      { name: 'James Wilson', co: 'Wilson Plumb', score: 83, note: 'Qualified — booking now' },
    ]},
    { name: 'Appointment Set', count: 12, col: '#f59e0b', leads: [
      { name: 'Anna Martinez', co: 'Martinez Dent', score: 94, note: 'Jun 16, 2pm — high val' },
      { name: 'Tom Baker', co: 'Baker Roofing', score: 88, note: 'Jun 17, 11am' },
      { name: 'Rachel Green', co: 'Green HVAC', score: 76, note: 'Jun 18, 9:30am' },
    ]},
    { name: 'Closed Won', count: 8, col: '#a371f7', leads: [
      { name: 'Steve Rogers', co: 'Rogers Plumb', score: 100, note: '✓ Content + Website pkg' },
      { name: 'Maria Santos', co: 'Santos Dental', score: 100, note: '✓ Full stack — $3,400/mo' },
    ]},
  ];

  const colW = (W - 16 - 8) / cols.length;

  cols.forEach((col, ci) => {
    const colX = 8 + ci * (colW + 4);
    const colY = 72;

    // Column header
    fillRR(ctx, colX, colY, colW - 4, 40, 8, '#161b22');
    strokeRR(ctx, colX, colY, colW - 4, 40, 8, '#30363d');
    ctx.fillStyle = col.col;
    ctx.beginPath(); ctx.arc(colX + 20, colY + 20, 5, 0, Math.PI*2); ctx.fill();
    txt(ctx, col.name, colX + 34, colY + 25, 'bold 12px -apple-system,sans-serif', '#e6edf3');
    fillRR(ctx, colX + colW - 36, colY + 8, 28, 24, 8, col.col + '33');
    txt(ctx, String(col.count), colX + colW - 22, colY + 24, 'bold 11px -apple-system,sans-serif', col.col, 'center');

    // Lead cards
    col.leads.forEach((lead, li) => {
      const cardY = colY + 50 + li * 140;
      if (cardY + 130 > H) return;
      fillRR(ctx, colX, cardY, colW - 4, 130, 10, '#161b22');
      strokeRR(ctx, colX, cardY, colW - 4, 130, 10, '#30363d');

      // Score indicator
      const scoreCol = lead.score >= 85 ? '#00d084' : lead.score >= 70 ? '#f59e0b' : '#8b949e';
      fillRR(ctx, colX + colW - 56, cardY + 10, 46, 20, 6, scoreCol + '22');
      txt(ctx, `${lead.score}`, colX + colW - 33, cardY + 23, 'bold 10px -apple-system,sans-serif', scoreCol, 'center');

      // Avatar
      fillRR(ctx, colX + 12, cardY + 12, 34, 34, 17, col.col + '44');
      txt(ctx, lead.name.charAt(0), colX + 29, cardY + 33, 'bold 13px -apple-system,sans-serif', col.col, 'center');

      txt(ctx, lead.name, colX + 54, cardY + 28, 'bold 12px -apple-system,sans-serif', '#e6edf3');
      txt(ctx, lead.co, colX + 54, cardY + 44, '10px -apple-system,sans-serif', '#8b949e');

      // Note
      txt(ctx, lead.note, colX + 12, cardY + 72, '10px -apple-system,sans-serif', '#8b949e');
      if (lead.note.includes('●')) {
        // Live indicator
        ctx.fillStyle = '#00d084';
        ctx.beginPath(); ctx.arc(colX + 20, cardY + 68, 4, 0, Math.PI*2); ctx.fill();
      }

      // Action buttons
      fillRR(ctx, colX + 12, cardY + 98, 80, 22, 6, '#21262d');
      txt(ctx, 'View Lead', colX + 52, cardY + 113, '9px -apple-system,sans-serif', '#8b949e', 'center');

      fillRR(ctx, colX + 100, cardY + 98, 80, 22, 6, col.col + '22');
      txt(ctx, ci === 1 ? 'Live Transcript' : ci === 2 ? 'View Booking' : 'Qualify', colX + 140, cardY + 113, '9px -apple-system,sans-serif', col.col, 'center');
    });
  });

  return { canvas: c, texture: toTexture(c) };
};

/* ════════════════════════════════════════════
   AI TEXTING WORLD TEXTURES
   ════════════════════════════════════════════ */

/** WhatsApp-style conversation */
window.drawWhatsAppChat = function(variant = 0) {
  const W = 780, H = 1440;
  const { c, ctx } = makeCanvas(W, H);
  const sf = 2;

  ctx.fillStyle = variant === 0 ? '#111b21' : '#0b141a';
  ctx.fillRect(0, 0, W, H);

  // Wallpaper pattern (subtle)
  ctx.save(); ctx.globalAlpha = 0.03;
  for (let x = 0; x < W; x += 40) {
    for (let y = 0; y < H; y += 40) {
      ctx.fillStyle = '#128c7e';
      ctx.beginPath(); ctx.arc(x, y, 2, 0, Math.PI*2); ctx.fill();
    }
  }
  ctx.restore();

  // Header
  ctx.fillStyle = '#202c33'; ctx.fillRect(0, 0, W, 76);
  line(ctx, 0, 76, W, 76, '#2a373f');

  // Back arrow
  txt(ctx, '←', 16, 50, `${13*sf}px sans-serif`, 'rgba(255,255,255,0.7)');

  // Contact avatar
  const conversations = [
    { name: 'James Mitchell', role: 'Gym Owner', avatar: 'JM' },
    { name: 'Sarah Chen', role: 'Dental Clinic', avatar: 'SC' },
    { name: 'Carlos Mendez', role: 'Auto Repair', avatar: 'CM' },
  ];
  const conv = conversations[variant % 3];

  const avGrad = ctx.createLinearGradient(60, 12, 96, 64);
  avGrad.addColorStop(0, '#128c7e');
  avGrad.addColorStop(1, '#075e54');
  ctx.fillStyle = avGrad;
  ctx.beginPath(); ctx.arc(72, 38, 26, 0, Math.PI*2); ctx.fill();
  txt(ctx, conv.avatar, 72, 44, `bold ${12*sf}px sans-serif`, '#fff', 'center');

  txt(ctx, conv.name, 108, 32, `bold ${12*sf}px -apple-system,sans-serif`, '#e9edef');
  txt(ctx, conv.role, 108, 54, `${9*sf}px -apple-system,sans-serif`, '#8696a0');

  // Header icons
  txt(ctx, '📹', W - 120, 42, `${13*sf}px sans-serif`, '#aebac1');
  txt(ctx, '📞', W - 64, 42, `${13*sf}px sans-serif`, '#aebac1');
  txt(ctx, '⋮', W - 22, 42, `${16*sf}px sans-serif`, '#aebac1');

  // Date separator
  fillRR(ctx, W/2 - 70, 90, 140, 26, 14, 'rgba(17,27,33,0.8)');
  txt(ctx, 'Today', W/2, 108, `${8.5*sf}px -apple-system,sans-serif`, '#8696a0', 'center');

  // Messages
  const messages = [
    { from: 'ai', text: `Hi ${conv.name.split(' ')[0]}! 👋 This is Sarah from KLLEZO. You recently expressed interest in growing your ${conv.role.toLowerCase()} — is this a good time to chat?`, time: '9:02 AM', read: true },
    { from: 'user', text: 'Hi Sarah! Yes, perfect timing actually. We\'ve been struggling with lead gen.', time: '9:04 AM', read: true },
    { from: 'ai', text: 'I completely understand. Most business owners in your industry are facing the same challenge. Can I ask — what\'s your biggest frustration right now?', time: '9:05 AM', read: true },
    { from: 'user', text: 'Mostly that we\'re relying on word of mouth. We need something more consistent.', time: '9:07 AM', read: true },
    { from: 'ai', text: '100%. That\'s exactly why we built our AI Growth System. Our clients typically see 3x more qualified leads within 90 days. Would you be open to a quick 30-min strategy call with our founder?', time: '9:08 AM', read: true },
    { from: 'user', text: 'That sounds interesting. What\'s involved?', time: '9:10 AM', read: true },
    { from: 'ai', text: 'It\'s completely free — we\'ll map out a custom plan for your specific business. No pushy sales, I promise 😊 I can book you in for tomorrow at 2pm or Thursday at 10am. Which works better?', time: '9:11 AM', read: true },
    { from: 'user', text: 'Tomorrow at 2pm works! 👍', time: '9:13 AM', read: true },
    { from: 'ai', text: '✅ Perfect! I\'ve just booked you in for tomorrow, June 16th at 2:00 PM. You\'ll receive a Google Meet link shortly.\n\nLooking forward to connecting! 🚀', time: '9:14 AM', read: true },
    { from: 'system', text: '📅 Appointment automatically added to CRM — June 16 at 2:00 PM', time: '9:14 AM' },
  ];

  let msgY = 132;
  messages.forEach(msg => {
    if (msg.from === 'system') {
      fillRR(ctx, W/2 - 230, msgY, 460, 32, 10, 'rgba(18,140,126,0.2)');
      txt(ctx, msg.text, W/2, msgY + 21, `${8.5*sf}px -apple-system,sans-serif`, '#128c7e', 'center');
      msgY += 46;
      return;
    }
    const isAI = msg.from === 'ai';
    const maxW = 480;
    const lines2 = [];
    let currentLine = '';
    msg.text.split(' ').forEach(word => {
      const test = currentLine ? currentLine + ' ' + word : word;
      if (test.length > 42) { lines2.push(currentLine); currentLine = word; }
      else currentLine = test;
    });
    if (currentLine) lines2.push(currentLine);
    const lineH = 22 * sf * 0.5;
    const bubbleH = lines2.length * lineH + 20 + 16;

    if (isAI) {
      fillRR(ctx, 16, msgY, maxW, bubbleH, 12, '#202c33');
      lines2.forEach((l, li) => {
        txt(ctx, l, 28, msgY + 16 + li * lineH, `${9.5*sf}px -apple-system,sans-serif`, '#e9edef');
      });
      txt(ctx, msg.time, 28, msgY + bubbleH - 4, `${8*sf}px -apple-system,sans-serif`, '#8696a0');
    } else {
      fillRR(ctx, W - maxW - 16, msgY, maxW, bubbleH, 12, '#005c4b');
      lines2.forEach((l, li) => {
        txt(ctx, l, W - maxW - 4, msgY + 16 + li * lineH, `${9.5*sf}px -apple-system,sans-serif`, '#e9edef');
      });
      txt(ctx, msg.time + '  ✓✓', W - 24, msgY + bubbleH - 4, `${8*sf}px -apple-system,sans-serif`, '#53bdeb', 'right');
    }
    msgY += bubbleH + 8;
  });

  // Input bar
  ctx.fillStyle = '#202c33'; ctx.fillRect(0, H - 72, W, 72);
  fillRR(ctx, 16, H - 56, W - 100, 40, 20, '#2a373f');
  txt(ctx, 'Type a message', 36, H - 32, `${10*sf}px -apple-system,sans-serif`, 'rgba(255,255,255,0.3)');
  // Send button
  fillRR(ctx, W - 60, H - 52, 40, 40, 20, '#00a884');
  txt(ctx, '▶', W - 40, H - 28, `${12*sf}px sans-serif`, '#fff', 'center');

  return { canvas: c, texture: toTexture(c) };
};

/** Campaign Dashboard — automation sequences */
window.drawCampaignDashboard = function() {
  const W = 1440, H = 900;
  const { c, ctx } = makeCanvas(W, H);

  ctx.fillStyle = '#0d1117'; ctx.fillRect(0, 0, W, H);

  // Sidebar
  ctx.fillStyle = '#161b22'; ctx.fillRect(0, 0, 240, H);
  line(ctx, 240, 0, 240, H, '#30363d');

  fillRR(ctx, 16, 18, 36, 36, 10, '#09453e');
  txt(ctx, 'K', 34, 40, 'bold 14px -apple-system,sans-serif', '#fff', 'center');
  txt(ctx, 'AI Texting Hub', 60, 40, 'bold 12px -apple-system,sans-serif', '#e6edf3');

  const sideItems = [
    { icon: '📊', label: 'Dashboard', active: false },
    { icon: '🚀', label: 'Campaigns', active: true },
    { icon: '💬', label: 'Conversations', active: false },
    { icon: '👥', label: 'Contacts', active: false },
    { icon: '🔄', label: 'Automations', active: false },
    { icon: '📈', label: 'Analytics', active: false },
  ];
  sideItems.forEach((si, i) => {
    const sy = 80 + i * 48;
    if (si.active) {
      fillRR(ctx, 8, sy - 10, 224, 38, 8, '#09453e');
      txt(ctx, `${si.icon}  ${si.label}`, 24, sy + 14, 'bold 12px -apple-system,sans-serif', '#fff');
    } else {
      txt(ctx, `${si.icon}  ${si.label}`, 24, sy + 14, '12px -apple-system,sans-serif', '#8b949e');
    }
  });

  // Global stats in sidebar
  line(ctx, 12, 400, 228, 400, '#21262d');
  txt(ctx, 'TODAY\'S STATS', 16, 424, 'bold 9px -apple-system,sans-serif', '#6e7681');
  const todayStats = [
    { label: 'Messages Sent', val: '1,847' },
    { label: 'Replies', val: '312' },
    { label: 'Appointments', val: '47' },
    { label: 'Revenue', val: '$12.4K' },
  ];
  todayStats.forEach((ts, i) => {
    txt(ctx, ts.val, 16, 454 + i * 38, 'bold 16px -apple-system,sans-serif', '#e6edf3');
    txt(ctx, ts.label, 16, 472 + i * 38, '10px -apple-system,sans-serif', '#8b949e');
  });

  // Main content
  txt(ctx, 'Active Campaigns', 260, 36, 'bold 18px -apple-system,sans-serif', '#e6edf3');
  txt(ctx, '12 running · 1,847 messages sent today', 260, 56, '12px -apple-system,sans-serif', '#8b949e');

  // New Campaign button
  fillRR(ctx, W - 184, 18, 164, 34, 8, '#09453e');
  txt(ctx, '+ New Campaign', W - 102, 39, 'bold 11px -apple-system,sans-serif', '#fff', 'center');

  line(ctx, 240, 68, W, 68, '#30363d');

  // Campaign cards
  const campaigns = [
    {
      name: 'New Lead Welcome Sequence',
      status: 'active', contacts: 234, sent: 1102, replies: 89, booked: 23,
      openRate: 78, replyRate: 34, lastSent: '2 min ago',
      steps: ['Welcome + intro', '24h follow-up', '72h value add', '7d soft close'],
    },
    {
      name: 'Appointment Reminder Flow',
      status: 'active', contacts: 89, sent: 267, replies: 71, booked: 68,
      openRate: 92, replyRate: 58, lastSent: '8 min ago',
      steps: ['24h reminder', '2h reminder', 'Link + directions', 'Post-call review'],
    },
    {
      name: 'Post-Call Follow Up',
      status: 'active', contacts: 156, sent: 468, replies: 102, booked: 41,
      openRate: 81, replyRate: 44, lastSent: '12 min ago',
      steps: ['Same-day thanks', '3d check-in', '7d offer', '14d re-engage'],
    },
    {
      name: 'Re-engagement Campaign',
      status: 'paused', contacts: 412, sent: 1648, replies: 198, booked: 34,
      openRate: 62, replyRate: 22, lastSent: '2 hours ago',
      steps: ['Win-back msg', 'Success story', 'Limited offer', 'Final attempt'],
    },
  ];

  campaigns.forEach((camp, ci) => {
    const cardY = 80 + ci * 192;
    if (cardY + 180 > H) return;
    fillRR(ctx, 256, cardY, W - 272, 180, 12, '#161b22');
    strokeRR(ctx, 256, cardY, W - 272, 180, 12, '#30363d');

    // Status pill
    const statusCol = camp.status === 'active' ? '#00d084' : '#f59e0b';
    fillRR(ctx, W - 130, cardY + 14, 80, 22, 11, statusCol + '22');
    ctx.fillStyle = statusCol;
    ctx.beginPath(); ctx.arc(W - 120, cardY + 25, 4, 0, Math.PI*2); ctx.fill();
    txt(ctx, camp.status.toUpperCase(), W - 110, cardY + 29, 'bold 9px -apple-system,sans-serif', statusCol);

    // Campaign name
    txt(ctx, camp.name, 276, cardY + 30, 'bold 14px -apple-system,sans-serif', '#e6edf3');
    txt(ctx, `Last sent ${camp.lastSent} · ${camp.contacts} contacts`, 276, cardY + 50, '11px -apple-system,sans-serif', '#8b949e');

    // Steps visualization
    const stepsY = cardY + 70;
    camp.steps.forEach((step, si) => {
      const sx = 276 + si * 220;
      fillRR(ctx, sx, stepsY, 200, 28, 6, '#21262d');
      fillRR(ctx, sx, stepsY, 8, 28, 3, '#09453e');
      txt(ctx, `${si+1}. ${step}`, sx + 18, stepsY + 18, '10px -apple-system,sans-serif', '#e6edf3');
      // connector
      if (si < camp.steps.length - 1) {
        ctx.save(); ctx.strokeStyle = '#30363d'; ctx.lineWidth = 1;
        ctx.setLineDash([4, 3]);
        ctx.beginPath(); ctx.moveTo(sx + 200, stepsY + 14); ctx.lineTo(sx + 220, stepsY + 14); ctx.stroke();
        ctx.restore();
      }
    });

    // Stats row
    const statsY = cardY + 118;
    const kpiKeys = [
      { label: 'Open Rate', val: `${camp.openRate}%` },
      { label: 'Reply Rate', val: `${camp.replyRate}%` },
      { label: 'Booked', val: String(camp.booked) },
      { label: 'Messages', val: camp.sent.toLocaleString() },
    ];
    kpiKeys.forEach((k, ki) => {
      const kx = 276 + ki * 220;
      txt(ctx, k.val, kx, statsY + 20, 'bold 18px -apple-system,sans-serif', '#e6edf3');
      txt(ctx, k.label, kx, statsY + 38, '10px -apple-system,sans-serif', '#8b949e');
    });

    // Action buttons
    fillRR(ctx, W - 266, cardY + 122, 80, 28, 6, '#21262d');
    txt(ctx, 'Analytics', W - 226, cardY + 140, '10px -apple-system,sans-serif', '#8b949e', 'center');
    fillRR(ctx, W - 178, cardY + 122, 80, 28, 6, camp.status === 'active' ? '#161b22' : '#09453e');
    strokeRR(ctx, W - 178, cardY + 122, 80, 28, 6, camp.status === 'active' ? '#f59e0b' : '#09453e');
    txt(ctx, camp.status === 'active' ? 'Pause' : 'Resume', W - 138, cardY + 140, '10px -apple-system,sans-serif', camp.status === 'active' ? '#f59e0b' : '#00d084', 'center');
  });

  return { canvas: c, texture: toTexture(c) };
};

/** Video Timeline Editor — Content world */
window.drawVideoTimeline = function() {
  const W = 1440, H = 500;
  const { c, ctx } = makeCanvas(W, H);

  ctx.fillStyle = '#1a1a1e'; ctx.fillRect(0, 0, W, H);

  // Top toolbar
  ctx.fillStyle = '#2a2a2e'; ctx.fillRect(0, 0, W, 48);
  line(ctx, 0, 48, W, 48, '#3a3a3e');

  // File name
  txt(ctx, '● KLLEZO_ContentReel_v3.mp4', 16, 30, 'bold 11px -apple-system,sans-serif', '#e6edf3');

  // Toolbar buttons
  const tbBtns = ['Export', '⌘Z', 'Cut', 'Split', 'Effects', 'Audio', 'Caption'];
  tbBtns.forEach((b, i) => {
    const bx = 280 + i * 100;
    fillRR(ctx, bx, 8, 80, 30, 6, '#3a3a3e');
    txt(ctx, b, bx + 40, 27, '11px -apple-system,sans-serif', '#aaaaaa', 'center');
  });

  // Export button
  fillRR(ctx, W - 120, 8, 100, 30, 6, '#09453e');
  txt(ctx, '↗ Export', W - 70, 27, 'bold 11px -apple-system,sans-serif', '#fff', 'center');

  // Preview panel (left)
  ctx.fillStyle = '#111'; ctx.fillRect(0, 48, 300, 452);
  line(ctx, 300, 48, 300, H, '#3a3a3e');
  // Preview frame
  const prevGrad = ctx.createLinearGradient(0, 48, 0, 300);
  prevGrad.addColorStop(0, '#0d3830');
  prevGrad.addColorStop(1, '#1a5e54');
  ctx.fillStyle = prevGrad; ctx.fillRect(10, 68, 280, 220);
  // Play button overlay
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath(); ctx.arc(150, 178, 30, 0, Math.PI*2); ctx.fill();
  txt(ctx, '▶', 150, 185, 'bold 20px sans-serif', '#fff', 'center');
  // Timecode
  txt(ctx, '00:00:08:14', 150, 310, '13px "SF Mono",monospace,sans-serif', '#e6edf3', 'center');
  txt(ctx, '/ 00:01:24:00', 150, 332, '11px monospace,sans-serif', '#666', 'center');
  // Playback controls
  const playCtrl = ['⏮', '⏪', '⏸', '⏩', '⏭'];
  playCtrl.forEach((p, i) => {
    txt(ctx, p, 40 + i * 56, 374, '18px sans-serif', '#aaa', 'center');
  });

  // Properties panel (right)
  ctx.fillStyle = '#222226'; ctx.fillRect(W - 240, 48, 240, 452);
  line(ctx, W - 240, 48, W - 240, H, '#3a3a3e');
  txt(ctx, 'Clip Properties', W - 200, 74, 'bold 11px -apple-system,sans-serif', '#e6edf3');
  const props = [
    { label: 'Duration', val: '00:08:14' },
    { label: 'Resolution', val: '1080 × 1920' },
    { label: 'Frame Rate', val: '60 fps' },
    { label: 'Audio', val: '48kHz Stereo' },
    { label: 'Speed', val: '100%' },
    { label: 'Opacity', val: '100%' },
  ];
  props.forEach((p, i) => {
    txt(ctx, p.label, W - 228, 104 + i * 36, '10px -apple-system,sans-serif', '#8b949e');
    txt(ctx, p.val, W - 20, 104 + i * 36, 'bold 10px -apple-system,sans-serif', '#e6edf3', 'right');
    line(ctx, W - 232, 118 + i * 36, W - 12, 118 + i * 36, '#2a2a2e');
  });

  // Main timeline area
  const tlX = 300, tlW = W - 300 - 240;

  // Time ruler
  ctx.fillStyle = '#2a2a2e'; ctx.fillRect(tlX, 48, tlW, 30);
  for (let t = 0; t <= 84; t += 4) {
    const tx = tlX + (t / 84) * tlW;
    ctx.strokeStyle = '#555'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(tx, 48); ctx.lineTo(tx, t % 12 === 0 ? 78 : 70); ctx.stroke();
    if (t % 12 === 0) txt(ctx, `${String(Math.floor(t/60)).padStart(2,'0')}:${String(t%60).padStart(2,'0')}`, tx + 2, 76, '9px monospace', '#888');
  }

  // Playhead
  const playheadX = tlX + (8.5 / 84) * tlW;
  ctx.strokeStyle = '#00d084'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(playheadX, 48); ctx.lineTo(playheadX, H); ctx.stroke();
  fillRR(ctx, playheadX - 8, 48, 16, 12, 4, '#00d084');

  // Track labels
  const tracks = [
    { name: 'VIDEO 1', col: '#1a6e64' },
    { name: 'B-ROLL', col: '#6e1a6e' },
    { name: 'MUSIC', col: '#1a3a6e' },
    { name: 'CAPTIONS', col: '#6e4a1a' },
    { name: 'EFFECTS', col: '#1a4a6e' },
  ];
  const trackH = 62;
  tracks.forEach((tr, ti) => {
    const ty = 78 + ti * trackH;
    // Label area
    ctx.fillStyle = '#222'; ctx.fillRect(tlX, ty, 80, trackH - 2);
    line(ctx, tlX + 80, ty, tlX + 80, ty + trackH - 2, '#3a3a3e');
    txt(ctx, tr.name, tlX + 8, ty + 24, 'bold 8px -apple-system,sans-serif', '#888');
    ctx.fillStyle = tr.col + '22'; ctx.fillRect(tlX + 80, ty, 14, trackH - 2);

    // Clips on track
    const clipData = ti === 0 ? [
      { start: 0, dur: 20, label: 'Hook.mp4' },
      { start: 21, dur: 35, label: 'Main_Content.mp4' },
      { start: 57, dur: 27, label: 'CTA_Scene.mp4' },
    ] : ti === 1 ? [
      { start: 5, dur: 12, label: 'Broll1.mp4' },
      { start: 35, dur: 18, label: 'Broll2.mp4' },
      { start: 60, dur: 20, label: 'Broll3.mp4' },
    ] : ti === 2 ? [
      { start: 0, dur: 84, label: 'Background_Music.wav' },
    ] : ti === 3 ? [
      { start: 2, dur: 80, label: 'Auto-Generated Captions' },
    ] : [
      { start: 0, dur: 5, label: 'Fade In' },
      { start: 20, dur: 3, label: 'Transition' },
      { start: 55, dur: 4, label: 'Zoom' },
      { start: 79, dur: 5, label: 'Fade Out' },
    ];

    clipData.forEach(clip => {
      const cx = tlX + 94 + (clip.start / 84) * (tlW - 94);
      const cw = (clip.dur / 84) * (tlW - 94) - 2;
      fillRR(ctx, cx, ty + 4, cw, trackH - 12, 4, tr.col + 'cc');
      ctx.save(); ctx.beginPath(); rrect(ctx, cx, ty + 4, cw, trackH - 12, 4); ctx.clip();
      txt(ctx, clip.label, cx + 8, ty + 24, 'bold 9px -apple-system,sans-serif', 'rgba(255,255,255,0.9)');
      // clip waveform for audio tracks
      if (ti === 2) {
        for (let w2 = 0; w2 < cw; w2 += 3) {
          const wh = 4 + Math.sin(w2 * 0.3) * 8;
          ctx.fillStyle = 'rgba(255,255,255,0.2)';
          ctx.fillRect(cx + w2, ty + trackH/2 - 5 - wh/2, 2, wh);
        }
      }
      ctx.restore();
      line(ctx, cx, ty, cx, ty + trackH - 2, '#3a3a3e');
    });
    line(ctx, tlX, ty + trackH - 2, tlX + tlW, ty + trackH - 2, '#3a3a3e');
  });

  return { canvas: c, texture: toTexture(c) };
};

console.log('[KLLEZO] UI Textures library loaded — 10 interfaces ready');
