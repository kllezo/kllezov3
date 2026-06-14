/**
 * KLLEZO V4.1 — Hero Screen Controller
 * Manages Tier 1 DOM panels: real HTML/CSS positioned in pseudo-3D space
 * synced to the same scrollProgress as Three.js.
 *
 * Each hero screen has:
 *   - A target position in the virtual 3D journey (entryP, exitP)
 *   - A CSS transform that mirrors camera approach
 *   - Live micro-animations driven by requestAnimationFrame
 */
'use strict';

(function () {
  /* ── Shared scroll state (written by main.js, read here) ──────── */
  window.HERO = {
    scrollProgress: 0,  // 0–1, smoothed by main.js
    time: 0,            // elapsed seconds
  };

  /* ── Helpers ──────────────────────────────────────────────────── */
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function invlerp(a, b, v) { return clamp((v - a) / (b - a), 0, 1); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function easeInOut(t) { return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; }
  function ease(t) { return 1 - Math.pow(1 - t, 4); }

  /* ── Hero screen registry ─────────────────────────────────────── */
  // entryP: scroll position where screen starts becoming visible
  // peakP:  scroll position where screen is fully in view
  // exitP:  scroll position where screen fades out
  // pos:    {x, y} percent of viewport (50,50 = center)
  // scale:  base scale
  // rot:    {x, y} degrees rotation at peak
  const HERO_SCREENS = [
    {
      id: 'hero-mission',
      entryP: 0.18, peakP: 0.26, exitP: 0.34,
      pos: { x: 50, y: 48 },
      scale: 0.88,
      rot: { x: 2, y: 0 },
      type: 'mission',
    },
    {
      id: 'hero-creator',
      entryP: 0.32, peakP: 0.40, exitP: 0.50,
      pos: { x: 26, y: 50 },
      scale: 0.78,
      rot: { x: 1, y: 8 },
      type: 'creator',
    },
    {
      id: 'hero-website',
      entryP: 0.46, peakP: 0.54, exitP: 0.64,
      pos: { x: 50, y: 50 },
      scale: 0.82,
      rot: { x: 2, y: -4 },
      type: 'website',
    },
    {
      id: 'hero-call',
      entryP: 0.60, peakP: 0.68, exitP: 0.78,
      pos: { x: 50, y: 50 },
      scale: 0.86,
      rot: { x: 1, y: 6 },
      type: 'call',
    },
    {
      id: 'hero-lead',
      entryP: 0.60, peakP: 0.68, exitP: 0.78,
      pos: { x: 80, y: 50 },
      scale: 0.72,
      rot: { x: 2, y: -10 },
      type: 'lead',
    },
    {
      id: 'hero-whatsapp',
      entryP: 0.73, peakP: 0.80, exitP: 0.90,
      pos: { x: 28, y: 50 },
      scale: 0.76,
      rot: { x: 1, y: 12 },
      type: 'whatsapp',
    },
    {
      id: 'hero-booking',
      entryP: 0.73, peakP: 0.80, exitP: 0.90,
      pos: { x: 72, y: 50 },
      scale: 0.74,
      rot: { x: 2, y: -8 },
      type: 'booking',
    },
  ];

  /* ── Cache DOM refs ───────────────────────────────────────────── */
  HERO_SCREENS.forEach(s => {
    s.el = document.getElementById(s.id);
  });

  /* ── Website morph state ──────────────────────────────────────── */
  let morphIndex = 0;
  let lastMorphIndex = -1;

  function setMorphLayer(idx) {
    if (idx === lastMorphIndex) return;
    lastMorphIndex = idx;
    for (let i = 0; i < 3; i++) {
      const el = document.getElementById('wm-' + i);
      if (el) el.classList.toggle('active', i === idx);
    }
  }

  /* ── Call timer ───────────────────────────────────────────────── */
  let callTimerBase = 167; // seconds
  let callTimerStart = Date.now();

  function updateCallTimer() {
    const elapsed = Math.floor((Date.now() - callTimerStart) / 1000);
    const total = callTimerBase + elapsed;
    const mn = Math.floor(total / 60);
    const sc = total % 60;
    const el = document.getElementById('call-timer');
    if (el) el.textContent = `0${mn}:${sc.toString().padStart(2, '0')}`;
  }

  /* ── Waveform bars ────────────────────────────────────────────── */
  const waveformEl = document.getElementById('call-waveform');
  if (waveformEl) {
    for (let i = 0; i < 40; i++) {
      const bar = document.createElement('div');
      bar.className = 'call-waveform-bar';
      const delay = Math.random() * 0.6;
      const dur = 0.3 + Math.random() * 0.6;
      bar.style.animationDelay = delay + 's';
      bar.style.animationDuration = dur + 's';
      bar.style.height = Math.round(10 + Math.random() * 30) + 'px';
      waveformEl.appendChild(bar);
    }
  }

  /* ── Creator view counter ─────────────────────────────────────── */
  let creatorViewCount = 847291;
  let lastCreatorTick = Date.now();

  const creatorComments = [
    ['@alex_k', 'This changed my life honestly 🙏'],
    ['@fitness_emma', 'Week 6 — down 6kg already!!'],
    ['@coach_ryan', 'Sharing this with my entire list'],
    ['@priya_s', 'Been waiting for this content 🔥'],
    ['@joe_lifts', 'The 4AM club is real'],
    ['@daniella_r', 'This is exactly what I needed to hear'],
    ['@tomB_fit', 'Just signed up! So excited'],
    ['@mindset_max', 'Mind = blown 🧠'],
    ['@sara_m', '12 weeks and I\'m a different person'],
    ['@fitness_fan', 'Sending to my gym partner NOW'],
  ];
  let commentIdx = 0;

  function addCreatorComment() {
    const container = document.getElementById('creator-comments');
    if (!container) return;
    const data = creatorComments[commentIdx % creatorComments.length];
    commentIdx++;
    const div = document.createElement('div');
    div.className = 'creator-comment';
    div.innerHTML = `<span class="creator-comment-name">${data[0]}</span><span>${data[1]}</span>`;
    container.appendChild(div);
    if (container.children.length > 5) container.removeChild(container.firstChild);
  }

  /* ── Mission control live feed ───────────────────────────────── */
  const callsFeed = [
    ['Sarah Chen', '#3fb950', 'Booking', 'now'],
    ['Mike Okafor', '#f59e0b', 'Qualifying', '1m'],
    ['Lucy Barnes', '#3fb950', 'Booked', '3m'],
    ['Aisha Johnson', '#58a6ff', 'Intro', '4m'],
    ['David Park', '#8b949e', 'No answer', '5m'],
    ['Rachel Green', '#BFA27A', 'Won £3.6K', '8m'],
    ['Tom Bradley', '#3fb950', 'Booked', '10m'],
    ['Oliver Fox', '#BFA27A', 'Won £4.8K', '13m'],
  ];

  let feedIdx = 0;
  function updateMCFeed() {
    const feed = document.getElementById('mc-calls-feed');
    if (!feed) return;
    const data = callsFeed[feedIdx % callsFeed.length];
    feedIdx++;
    const item = feed.firstElementChild;
    if (!item) return;
    item.querySelector('.mc-feed-name').textContent = data[0];
    item.querySelector('.mc-feed-status').textContent = data[2];
    item.querySelector('.mc-feed-status').style.color = data[1];
    item.querySelector('.mc-feed-time').textContent = data[3];
    item.style.animation = 'none';
    requestAnimationFrame(() => { item.style.animation = ''; });
    // rotate DOM order
    feed.appendChild(feed.firstElementChild);
  }

  /* ── MC KPI counter animation ─────────────────────────────────── */
  let mcAnimated = false;
  function animateMCKPIs() {
    if (mcAnimated) return;
    mcAnimated = true;
    const targets = [
      { id: 'mc-leads', end: 124, duration: 1400 },
      { id: 'mc-convs', end: 42, duration: 1100 },
      { id: 'mc-bookings', end: 18, duration: 900 },
      { id: 'mc-sites', end: 7, duration: 700 },
      { id: 'mc-assets', end: 53, duration: 1200 },
    ];
    targets.forEach(t => {
      const el = document.getElementById(t.id);
      if (!el) return;
      const start = Date.now();
      function step() {
        const p = Math.min((Date.now() - start) / t.duration, 1);
        el.textContent = Math.round(ease(p) * t.end);
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    });
  }

  /* ── Main update loop ─────────────────────────────────────────── */
  let lastCommentTime = 0;
  let lastFeedTime = 0;
  let lastViewTime = 0;

  function updateOutcomeLayer(p) {
    const outcomes = [
      { id: 'oc-content',  range: [0.32, 0.45] },
      { id: 'oc-lead',     range: [0.46, 0.58] },
      { id: 'oc-call',     range: [0.60, 0.73] },
      { id: 'oc-payment',  range: [0.74, 0.87] },
      { id: 'oc-customer', range: [0.88, 0.96] },
    ];
    outcomes.forEach(o => {
      const el = document.getElementById(o.id);
      if (el) {
        const isVisible = (p >= o.range[0] && p <= o.range[1]);
        el.classList.toggle('visible', isVisible);
      }
    });
  }

  function heroTick(time) {
    requestAnimationFrame(heroTick);

    const p = window.HERO.scrollProgress;
    const t = time / 1000;
    window.HERO.time = t;

    // Update call timer
    updateCallTimer();

    // Creator view counter (every ~1.8s)
    if (t - lastViewTime > 1.8) {
      lastViewTime = t;
      creatorViewCount += Math.floor(100 + Math.random() * 400);
      const el = document.getElementById('creator-views');
      if (el) el.textContent = creatorViewCount.toLocaleString();
    }

    // Creator comments (every 2.8s)
    if (t - lastCommentTime > 2.8) {
      lastCommentTime = t;
      addCreatorComment();
    }

    // Mission control feed (every 3.5s)
    if (t - lastFeedTime > 3.5) {
      lastFeedTime = t;
      updateMCFeed();
    }

    // Website morph: changes within the website zone (0.46–0.64) - exactly 3 websites
    if (p >= 0.46 && p <= 0.64) {
      const localP = (p - 0.46) / 0.18;
      const newMorphIdx = Math.min(Math.floor(localP * 3), 2);
      if (newMorphIdx !== morphIndex) {
        morphIndex = newMorphIdx;
        setMorphLayer(morphIndex);
      }
    }

    // Mission control KPI animation on entry
    if (p >= 0.20 && !mcAnimated) animateMCKPIs();

    // Update floating outcome cards based on scroll
    updateOutcomeLayer(p);

    // Position each hero screen
    HERO_SCREENS.forEach(s => {
      if (!s.el) return;

      // Calculate Focus Factor F (0 at entry/exit, 1 at peak)
      let F = 0;
      if (p >= s.entryP && p <= s.exitP) {
        if (p < s.peakP) {
          F = invlerp(s.entryP, s.peakP, p);
        } else {
          F = invlerp(s.exitP, s.peakP, p);
        }
      }

      // Hybrid visibility calculations
      // Fades in from 0 to ecosystem opacity (0.18) at the very start (p = 0 to 0.08)
      // Fades out completely at the very end of the scroll (p = 0.95 to 1.0)
      const introFade = clamp(p / 0.08, 0, 1);
      const ctaFade = 1 - invlerp(0.95, 1.0, p);
      const ecosystemOpacity = 0.18 * introFade * ctaFade;

      // Opacity: ecosystemOpacity when far, 1.0 when in focus
      const opacity = lerp(ecosystemOpacity, 1.0, ease(F));

      // Blur: 4px when far, 0px when in focus
      const blurVal = lerp(4, 0, ease(F));
      s.el.style.filter = blurVal > 0.15 ? `blur(${blurVal}px)` : 'none';

      // Scale: 0.65x when far, full scale when in focus
      const targetScale = lerp(s.scale * 0.65, s.scale, ease(F));
      
      // Focus-dependent Z-Index and interactive pointer-events
      s.el.style.zIndex = Math.round(10 + F * 15);
      s.el.style.pointerEvents = F > 0.85 ? 'auto' : 'none';

      // Subtle breathing / float (still present, but smaller in ecosystem mode)
      const floatAmp = lerp(0.4, 1.0, F);
      const breathX = Math.sin(t * 0.28 + s.pos.x) * 4 * floatAmp;
      const breathY = Math.cos(t * 0.22 + s.pos.y * 0.5) * 3 * floatAmp;

      // Position
      const left = s.pos.x + breathX * 0.1;
      const top  = s.pos.y + breathY * 0.1;

      // Rotation (slight perspective tilt)
      const rotY = s.rot.y + Math.sin(t * 0.15) * 1.5;
      const rotX = s.rot.x + Math.cos(t * 0.12) * 0.8;

      // Scale breathing
      const scale = targetScale + Math.sin(t * 0.18) * 0.003;

      s.el.style.opacity = opacity;
      s.el.style.left = left + 'vw';
      s.el.style.top  = top  + 'vh';
      s.el.style.transform = [
        `translate(-50%, -50%)`,
        `perspective(1200px)`,
        `rotateY(${rotY}deg)`,
        `rotateX(${rotX}deg)`,
        `scale(${scale})`,
      ].join(' ');
    });
  }

  requestAnimationFrame(heroTick);

  /* ── Cursor interactions ──────────────────────────────────────── */
  const dot = document.getElementById('cur-dot');
  const ring = document.getElementById('cur-ring');
  let mx = 0, my = 0, rx = 0, ry = 0;

  document.addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;
  });

  function cursorTick() {
    requestAnimationFrame(cursorTick);
    rx = lerp(rx, mx, 0.14);
    ry = lerp(ry, my, 0.14);
    if (dot) dot.style.transform = `translate(${mx}px, ${my}px) translate(-50%, -50%)`;
    if (ring) ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%)`;
  }
  cursorTick();

  document.querySelectorAll('a, button').forEach(el => {
    el.addEventListener('mouseenter', () => document.body.classList.add('hov'));
    el.addEventListener('mouseleave', () => document.body.classList.remove('hov'));
  });

  console.log('[KLLEZO] Hero screen controller ready — 7 DOM panels');
})();
