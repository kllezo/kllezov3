/**
 * KLLEZO V4.1 — The Living Business Ecosystem
 * Three-tier rendering: Hero (DOM) · Medium (Canvas) · Background (Static Canvas)
 * 8 zones · 80 screens · 1400vh scroll journey
 */
'use strict';

(function () {

  /* ── Utils ────────────────────────────────────────────────────── */
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function lerp(a, b, t)  { return a + (b - a) * t; }
  function ease4(t) { return 1 - Math.pow(1 - clamp(t,0,1), 4); }
  function easeIO(t) { t = clamp(t,0,1); return t < 0.5 ? 2*t*t : -1+(4-2*t)*t; }

  /* ── Renderer ─────────────────────────────────────────────────── */
  const canvas = document.getElementById('universe');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = false;
  renderer.setClearColor(0x0B0D10, 1);

  /* ── Scene & Camera ───────────────────────────────────────────── */
  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 800);

  /* ── Fog ──────────────────────────────────────────────────────── */
  scene.fog = new THREE.Fog(0x0B0D10, 60, 280);

  /* ── Lights ───────────────────────────────────────────────────── */
  const ambientLight = new THREE.AmbientLight(0xF7F3EB, 0.04);
  scene.add(ambientLight);

  function addSpot(color, intensity, pos, target) {
    const l = new THREE.SpotLight(color, intensity, 160, Math.PI * 0.22, 0.45, 1.4);
    l.position.set(...pos);
    if (target) l.target.position.set(...target);
    scene.add(l); scene.add(l.target);
    return l;
  }

  const champagneSpot = addSpot(0xBFA27A, 1.2, [0, 18, 0], [0, 0, -40]);
  const forestSpot    = addSpot(0x23453F, 0.8, [-30, 12, -30], [0, 0, -80]);
  const blueAccent    = addSpot(0x2040A0, 0.4, [40, 10, 20], [0, 0, -60]);

  /* ── Camera Spline ────────────────────────────────────────────── */
  // 1400vh journey through 8 zones
  const PATH_POINTS = [
    new THREE.Vector3(  0,   0,  60),   // 0% – SILENCE (start)
    new THREE.Vector3(  0,   0,  40),   // 7% – still approaching
    new THREE.Vector3(  8,  -2,  10),   // 14% – entering chaos
    new THREE.Vector3(-12,   4, -20),   // 22% – deep chaos
    new THREE.Vector3(  0,   6, -45),   // 30% – MISSION CONTROL approach
    new THREE.Vector3(  0,   2, -65),   // 38% – through mission control
    new THREE.Vector3(-14,  -2, -90),   // 46% – CONTENT ENGINE
    new THREE.Vector3(  0,   0,-115),   // 54% – WEBSITES
    new THREE.Vector3( 14,   2,-138),   // 62% – AI CALLING
    new THREE.Vector3(-10,  -2,-162),   // 70% – AI TEXTING
    new THREE.Vector3(  4,   0,-185),   // 78% – GROWTH
    new THREE.Vector3(  0,   4,-205),   // 86% – ECOSYSTEM OVERVIEW
    new THREE.Vector3(  0,   0,-225),   // 94% – CTA APPROACH
    new THREE.Vector3(  0,   0,-240),   // 100% – FINAL
  ];

  const camSpline = new THREE.CatmullRomCurve3(PATH_POINTS, false, 'catmullrom', 0.5);

  const LOOK_POINTS = [
    new THREE.Vector3(  0,   0,  20),
    new THREE.Vector3(  0,   0,   0),
    new THREE.Vector3(  6,  -1, -18),
    new THREE.Vector3(-10,   2, -38),
    new THREE.Vector3(  0,   4, -60),
    new THREE.Vector3(  0,   0, -80),
    new THREE.Vector3(-12,  -2,-106),
    new THREE.Vector3(  0,   0,-128),
    new THREE.Vector3( 12,   2,-152),
    new THREE.Vector3( -8,  -1,-176),
    new THREE.Vector3(  2,   0,-198),
    new THREE.Vector3(  0,   3,-218),
    new THREE.Vector3(  0,   0,-232),
    new THREE.Vector3(  0,   0,-248),
  ];

  const lookSpline = new THREE.CatmullRomCurve3(LOOK_POINTS, false, 'catmullrom', 0.5);

  /* ── Scroll State ─────────────────────────────────────────────── */
  let scrollRaw = 0;
  let scrollSmooth = 0;

  const scrollDriver = document.getElementById('scroll-driver');
  window.addEventListener('scroll', () => {
    const max = scrollDriver.offsetHeight - window.innerHeight;
    scrollRaw = max > 0 ? window.scrollY / max : 0;
  }, { passive: true });

  /* ── Texture Update Scheduler ─────────────────────────────────── */
  // Round-robin: updates 1-3 Tier 2 textures per second
  const TIER2_UPDATE_INTERVAL = 400; // ms per slot
  let lastTexUpdate = 0;
  let texUpdateQueue = [];

  function scheduleTexture(mesh, drawFn, args) {
    texUpdateQueue.push({ mesh, drawFn, args });
  }

  function processTexQueue(now) {
    if (now - lastTexUpdate < TIER2_UPDATE_INTERVAL) return;
    if (texUpdateQueue.length === 0) return;
    lastTexUpdate = now;
    const item = texUpdateQueue.shift();
    texUpdateQueue.push(item);
    if (!item.mesh || !item.mesh.material) return;
    try {
      const newCanvas = item.args ? item.drawFn(item.args) : item.drawFn();
      if (newCanvas && item.mesh.material.map) {
        item.mesh.material.map.image = newCanvas;
        item.mesh.material.map.needsUpdate = true;
      }
    } catch(e) {}
  }

  /* ── Screen Geometry Factory ──────────────────────────────────── */
  function makeScreen(drawFn, args, w, h, pos, rot, tier) {
    let canvas2d;
    try {
      canvas2d = args !== undefined ? drawFn(args) : drawFn();
    } catch(e) {
      canvas2d = null;
    }
    if (!canvas2d) return null;

    const texture = new THREE.CanvasTexture(canvas2d);
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.generateMipmaps = true;

    const mat = new THREE.MeshBasicMaterial({
      map: texture,
      side: THREE.FrontSide,
      transparent: true,
      opacity: 0.94,
    });

    const geo = new THREE.PlaneGeometry(w, h);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(...pos);
    mesh.rotation.set(...rot);
    scene.add(mesh);

    // Screen border glow
    const borderGeo = new THREE.PlaneGeometry(w + 0.08, h + 0.08);
    const borderMat = new THREE.MeshBasicMaterial({
      color: 0xBFA27A,
      transparent: true,
      opacity: 0.08,
      side: THREE.FrontSide,
    });
    const border = new THREE.Mesh(borderGeo, borderMat);
    border.position.set(...pos);
    border.position.z -= 0.01;
    border.rotation.set(...rot);
    scene.add(border);

    // Tier 2 — schedule for updates
    if (tier === 2) scheduleTexture(mesh, drawFn, args);

    return mesh;
  }

  /* ── Screen Placement Map ─────────────────────────────────────── */
  // Format: [drawFn, args, width, height, [x, y, z], [rx, ry, rz], tier]
  // Tier 1 = DOM (not here), Tier 2 = animated canvas, Tier 3 = static

  const S = window.SCREENS;

  const SCREEN_DEFS = [

    /* ═══════════════════════════════════════════════════════════════
       ZONE 0: SILENCE — just particles, no screens
       ═══════════════════════════════════════════════════════════════ */
    /* none — the universe is empty except the hero text */

    /* ═══════════════════════════════════════════════════════════════
       ZONE 1: CHAOS (scroll 8%–22%)
       40+ screens scattered in a beautiful dense cloud
       z range: 10 → -35
       ═══════════════════════════════════════════════════════════════ */
    // Center cluster
    [S.instagramReel,       undefined, 6, 10.7, [ 0,    0, -5],  [0, 0.12, 0],   2],
    [S.contentCalendar,     undefined, 9, 5.6,  [ 12,   4, -8],  [0, -0.2, 0],   2],
    [S.creatorDashboard,    undefined, 9, 5.6,  [-12,  -3, -10], [0,  0.15, 0],  2],
    [S.analytics,           undefined, 9, 5.6,  [ 16,  -5, -14], [0, -0.18, 0],  2],
    [S.whatsApp,            undefined, 5.5, 9.8,[-18,   2, -12], [0,  0.22, 0],  2],
    [S.publishingQueue,     undefined, 9, 5.6,  [  6,   7, -16], [0, -0.08, 0],  2],
    [S.crmPipeline,         undefined, 9, 5.6,  [ -8,   5, -18], [0,  0.14, 0],  2],
    [S.videoTimeline,       undefined, 10, 3.1, [-20,  -1, -6],  [0.1, 0.1, 0],  2],
    [S.activeCall,          undefined, 9, 5.6,  [ 22,   1, -20], [0, -0.25, 0],  2],
    [S.bookingCalendar,     undefined, 9, 5.6,  [ -4,  -6, -22], [0,  0.06, 0],  2],
    // Mid-depth chaos
    [S.multiLeadDashboard,  undefined, 9, 5.6,  [ 14,   8, -26], [0, -0.16, 0],  3],
    [S.nurtureSequence,     undefined, 9, 5.6,  [-16,  -4, -28], [0,  0.2,  0],  3],
    [S.callDashboard,       undefined, 9, 5.6,  [ -2,   3, -30], [0, -0.1,  0],  3],
    [S.ecommerce,           undefined, 9, 5.6,  [ 20,  -2, -24], [0,  0.18, 0],  3],
    [S.luxuryRealEstate,    undefined, 9, 5.6,  [ -22,  5, -32], [0,  0.08, 0],  3],
    [S.boutiqueHotel,       undefined, 9, 5.6,  [  8,  -8, -34], [0, -0.14, 0],  3],
    // Outer chaos cloud — Tier 3 simplified
    [S.simpleContent, 0, 7, 4.4,  [ 28,   2, -15], [0, -0.3, 0.04],  3],
    [S.simpleCall,    0, 7, 4.4,  [-28,  -3, -18], [0,  0.28, 0],    3],
    [S.simpleWebsite, 0, 7, 4.4,  [ 24,   8, -22], [0.05, -0.2, 0],  3],
    [S.simpleContent, 1, 7, 4.4,  [-24,   6, -26], [0,  0.25, 0],    3],
    [S.simpleCall,    1, 7, 4.4,  [ 32,  -4, -30], [0, -0.32, 0],    3],
    [S.simpleWebsite, 1, 7, 4.4,  [-30,   0, -32], [0,  0.18, 0],    3],
    [S.simpleContent, 2, 7, 4.4,  [ 36,   4, -36], [0, -0.2, 0.03],  3],
    [S.simpleCall,    2, 7, 4.4,  [-36,  -6, -38], [0,  0.22, 0],    3],
    [S.simpleWebsite, 2, 7, 4.4,  [ 10,  14, -28], [-0.1, 0.1, 0],   3],
    [S.simpleContent, 3, 7, 4.4,  [ -6, -14, -32], [0.12, -0.1, 0],  3],
    [S.simpleCall,    0, 7, 4.4,  [ 40,   0, -20], [0, -0.35, 0],    3],
    [S.simpleWebsite, 0, 7, 4.4,  [-40,   2, -24], [0,  0.3,  0],    3],
    [S.simpleContent, 1, 7, 4.4,  [ 18, -12, -40], [0.08, 0.12, 0],  3],
    [S.simpleCall,    2, 7, 4.4,  [-18,  12, -42], [-0.1, -0.1, 0],  3],

    /* ═══════════════════════════════════════════════════════════════
       ZONE 2: MISSION CONTROL (scroll 22%–35%)
       Grid formation, overhead perspective
       z range: -45 → -70
       ═══════════════════════════════════════════════════════════════ */
    // Hero: big central dashboard (DOM — but also a canvas version for depth)
    [S.missionControl,      undefined, 12, 7.5, [  0,   0, -50], [0, 0, 0],      2],
    [S.analytics,           undefined, 8,  5,   [-14,   2, -52], [0, 0.14, 0],   2],
    [S.callDashboard,       undefined, 8,  5,   [ 14,   2, -54], [0, -0.12, 0],  2],
    [S.crmPipeline,         undefined, 8,  5,   [  0,  -6, -56], [-0.08, 0, 0],  2],
    [S.slack,               undefined, 8,  5,   [-12,  -3, -58], [0, 0.1, 0],    2],
    [S.googleAds,           undefined, 9,  5.6, [ 10,   5, -60], [0, -0.1, 0],   2],
    [S.seoSashboard,        undefined, 9,  5.6, [ -2,   2, -65], [0, 0.06, 0],   3],
    [S.paymentSuccess,      undefined, 5.5, 5.5,[-16,   4, -62], [0, 0.18, 0],   3],
    [S.clientPortal,        undefined, 9,  5.6, [ 18,  -1, -64], [0, -0.14, 0],  3],
    [S.simpleContent, 0,    7, 4.4,    [-22,  -4, -55], [0, 0.2, 0],    3],
    [S.simpleCall,    1,    7, 4.4,    [ 22,  -5, -58], [0, -0.18, 0],  3],

    /* ═══════════════════════════════════════════════════════════════
       ZONE 3: CONTENT ENGINE (scroll 35%–50%)
       z range: -75 → -100
       ═══════════════════════════════════════════════════════════════ */
    [S.instagramReel,       undefined, 6, 10.7, [-10,   0, -80], [0, 0.2, 0],    2],
    [S.contentCalendar,     undefined, 9, 5.6,  [  4,   4, -82], [0, -0.1, 0],  2],
    [S.creatorDashboard,    undefined, 9, 5.6,  [ 16,  -2, -84], [0, -0.16, 0], 2],
    [S.videoTimeline,       undefined, 10, 3.1, [ -6,  -4, -86], [0.06, 0.1, 0],2],
    [S.publishingQueue,     undefined, 9, 5.6,  [-18,   3, -88], [0, 0.18, 0],  2],
    [S.heatmap,             undefined, 8, 6.4,  [  8,   6, -90], [0, -0.12, 0], 2],
    [S.googleAds,           undefined, 9, 5.6,  [ -4,  -6, -92], [0, 0.08, 0],  3],
    [S.seoSashboard,        undefined, 9, 5.6,  [ 20,   0, -94], [0, -0.2, 0],  3],
    [S.simpleContent, 0,    7, 4.4,    [-24,   5, -85], [0, 0.22, 0],   3],
    [S.simpleContent, 2,    7, 4.4,    [ 26,  -3, -90], [0, -0.2, 0],   3],
    [S.simpleContent, 3,    7, 4.4,    [-12,  -8, -96], [0.08, 0.1, 0], 3],

    /* ═══════════════════════════════════════════════════════════════
       ZONE 4: WEBSITES (scroll 50%–62%)
       Website morph is DOM — canvas versions for depth
       z range: -105 → -128
       ═══════════════════════════════════════════════════════════════ */
    [S.luxuryRealEstate,    undefined, 10, 6.25,[ -2,   0,-110], [0, 0, 0],      2],
    [S.boutiqueHotel,       undefined, 9,  5.6, [-14,   4,-112], [0, 0.16, 0],   2],
    [S.fitnessCoach,        undefined, 9,  5.6, [ 14,  -2,-114], [0, -0.14, 0],  2],
    [S.restaurant,          undefined, 9,  5.6, [ -8,  -5,-116], [0, 0.1, 0],    2],
    [S.ecommerce,           undefined, 9,  5.6, [ 10,   6,-118], [0, -0.1, 0],   2],
    [S.heatmap,             undefined, 8,  6.4, [-18,   2,-120], [0, 0.2, 0],    3],
    [S.simpleWebsite, 0,    7, 4.4,    [ 22,  -4,-113], [0, -0.22, 0],  3],
    [S.simpleWebsite, 1,    7, 4.4,    [-22,   3,-118], [0, 0.18, 0],   3],
    [S.simpleWebsite, 2,    7, 4.4,    [  4, -10,-122], [0.1, 0, 0],    3],
    [S.simpleWebsite, 0,    7, 4.4,    [ -2,  10,-124], [-0.1, 0, 0],   3],

    /* ═══════════════════════════════════════════════════════════════
       ZONE 5: AI CALLING (scroll 62%–75%)
       z range: -132 → -158
       ═══════════════════════════════════════════════════════════════ */
    [S.activeCall,          undefined, 10, 6.25,[ 6,   0,-138], [0, -0.06, 0],   2],
    [S.crmPipeline,         undefined, 9,  5.6, [-12,  4,-140], [0, 0.18, 0],    2],
    [S.callDashboard,       undefined, 9,  5.6, [ 16, -2,-142], [0, -0.16, 0],   2],
    [S.multiLeadDashboard,  undefined, 9,  5.6, [ -4, -5,-144], [0, 0.08, 0],    2],
    [S.slack,               undefined, 8,  5,   [ 12,  5,-148], [0, -0.1, 0],    2],
    [S.analytics,           undefined, 9,  5.6, [-16, -2,-150], [0, 0.14, 0],    3],
    [S.paymentSuccess,      undefined, 5.5, 5.5,[ -2,  6,-154], [0, 0, 0],       3],
    [S.simpleCall, 0,       7, 4.4,    [ 24,  2,-143], [0, -0.25, 0],   3],
    [S.simpleCall, 1,       7, 4.4,    [-24, -3,-148], [0, 0.2, 0],     3],
    [S.simpleCall, 2,       7, 4.4,    [  8, -8,-153], [0.06, 0.1, 0],  3],
    [S.simpleCall, 0,       7, 4.4,    [-10,  8,-156], [-0.08, -0.1, 0],3],

    /* ═══════════════════════════════════════════════════════════════
       ZONE 6: AI TEXTING (scroll 75%–88%)
       z range: -162 → -185
       ═══════════════════════════════════════════════════════════════ */
    [S.whatsApp,            undefined, 6, 10.7, [-8,  0,-168], [0, 0.14, 0],     2],
    [S.bookingCalendar,     undefined, 9, 5.6,  [ 8,  4,-170], [0, -0.12, 0],    2],
    [S.nurtureSequence,     undefined, 9, 5.6,  [-16, -2,-172], [0, 0.18, 0],    2],
    [S.crmPipeline,         undefined, 9, 5.6,  [ 14,  5,-174], [0, -0.14, 0],   2],
    [S.clientPortal,        undefined, 9, 5.6,  [ -2, -6,-178], [0, 0.08, 0],    2],
    [S.paymentSuccess,      undefined, 5.5,5.5, [ 18, -1,-180], [0, -0.1, 0],    3],
    [S.missionControl,      undefined, 9,  5.6, [-14,  3,-182], [0, 0.16, 0],    3],
    [S.simpleCall, 1,       7, 4.4,    [ 24, -3,-170], [0, -0.2, 0],    3],
    [S.simpleCall, 2,       7, 4.4,    [-22,  4,-175], [0, 0.22, 0],    3],
    [S.simpleWebsite, 0,    7, 4.4,    [  4,  9,-182], [-0.12, 0, 0],   3],

    /* ═══════════════════════════════════════════════════════════════
       ZONE 7: GROWTH / ECOSYSTEM (scroll 88%–100%)
       z range: -192 → -240
       ═══════════════════════════════════════════════════════════════ */
    [S.analytics,           undefined, 10, 6.25,[  0,  0,-196], [0, 0, 0],       2],
    [S.callDashboard,       undefined, 9,  5.6, [-12,  3,-198], [0, 0.14, 0],    2],
    [S.missionControl,      undefined, 9,  5.6, [ 12, -2,-200], [0, -0.1, 0],    2],
    [S.multiLeadDashboard,  undefined, 9,  5.6, [ -4, -4,-202], [0, 0.08, 0],    3],
    [S.googleAds,           undefined, 9,  5.6, [  8,  5,-205], [0, -0.12, 0],   3],
    [S.simpleContent, 0,    7, 4.4,    [ 20, -2,-198], [0, -0.2, 0],    3],
    [S.simpleContent, 1,    7, 4.4,    [-20,  2,-202], [0, 0.18, 0],    3],
    [S.simpleCall, 0,       7, 4.4,    [  2, 10,-206], [-0.1, 0, 0],    3],
    [S.simpleCall, 1,       7, 4.4,    [ -6,-10,-210], [0.12, 0, 0],    3],
  ];

  /* ── Build all screens ────────────────────────────────────────── */
  const meshes = [];
  SCREEN_DEFS.forEach(([drawFn, args, w, h, pos, rot, tier]) => {
    const m = makeScreen(drawFn, args, w, h, pos, rot, tier);
    if (m) meshes.push(m);
  });

  console.log(`[KLLEZO] Built ${meshes.length} screens`);

  /* ── Data Flow Particles ──────────────────────────────────────── */
  // The outcome path: Instagram → Website → Lead → Call → Booking → Payment
  const FLOW_STAGES = [
    { pos: [-10, 0, -82], label: 'Content' },
    { pos: [  0, 0,-110], label: 'Website' },
    { pos: [  6, 0,-138], label: 'Lead' },
    { pos: [ 12, 0,-168], label: 'Call' },
    { pos: [-8,  0,-176], label: 'Booked' },
    { pos: [  0, 0,-196], label: 'Revenue' },
  ];

  const particleCount = 1200;
  const pPositions = new Float32Array(particleCount * 3);
  const pColors    = new Float32Array(particleCount * 3);
  const pSpeeds    = new Float32Array(particleCount);

  for (let i = 0; i < particleCount; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi   = Math.acos(2 * Math.random() - 1);
    const r     = 60 + Math.random() * 120;
    pPositions[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
    pPositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.3;
    pPositions[i * 3 + 2] = -110 + (Math.random() - 0.5) * 200;
    pSpeeds[i] = 0.3 + Math.random() * 0.7;

    // Champagne/forest/steel color palette
    const palette = [
      [0.75, 0.64, 0.48], // champagne
      [0.14, 0.27, 0.25], // forest
      [0.49, 0.54, 0.58], // steel
      [0.10, 0.62, 0.56], // teal
    ];
    const c = palette[Math.floor(Math.random() * palette.length)];
    pColors[i * 3]     = c[0];
    pColors[i * 3 + 1] = c[1];
    pColors[i * 3 + 2] = c[2];
  }

  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));
  pGeo.setAttribute('color', new THREE.BufferAttribute(pColors, 3));
  const pMat = new THREE.PointsMaterial({
    size: 0.18,
    vertexColors: true,
    transparent: true,
    opacity: 0.55,
    sizeAttenuation: true,
  });
  const particles = new THREE.Points(pGeo, pMat);
  scene.add(particles);

  // Data flow path lines — outcome journey
  const flowPositions = [];
  for (let si = 0; si < FLOW_STAGES.length - 1; si++) {
    const a = FLOW_STAGES[si].pos;
    const b = FLOW_STAGES[si + 1].pos;
    const steps = 40;
    for (let t = 0; t <= steps; t++) {
      const tt = t / steps;
      flowPositions.push(
        lerp(a[0], b[0], tt),
        lerp(a[1], b[1], tt),
        lerp(a[2], b[2], tt)
      );
    }
  }

  const flowGeo = new THREE.BufferGeometry();
  flowGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(flowPositions), 3));
  const flowMat = new THREE.LineBasicMaterial({
    color: 0xBFA27A,
    transparent: true,
    opacity: 0.0, // starts invisible, becomes visible mid-journey
  });
  const flowLine = new THREE.Line(flowGeo, flowMat);
  scene.add(flowLine);

  // Outcome nodes — glowing dots at each stage
  const nodeGeo = new THREE.SphereGeometry(0.25, 8, 8);
  const nodeMatGold = new THREE.MeshBasicMaterial({ color: 0xBFA27A, transparent: true, opacity: 0.8 });
  const flowNodes = FLOW_STAGES.map(stage => {
    const m = new THREE.Mesh(nodeGeo, nodeMatGold.clone());
    m.position.set(...stage.pos);
    m.material.opacity = 0;
    scene.add(m);
    return m;
  });

  /* ── Background Grid (subtle depth plane) ─────────────────────── */
  const gridHelper = new THREE.GridHelper(400, 80, 0x23453F, 0x23453F);
  gridHelper.material.transparent = true;
  gridHelper.material.opacity = 0.04;
  gridHelper.position.y = -20;
  scene.add(gridHelper);

  /* ── Overlay Text System ──────────────────────────────────────── */
  const ZONE_TEXT = {
    'zt-hero':       { start: 0.00, peak: 0.04, end: 0.10 },
    'zt-mission':    { start: 0.22, peak: 0.27, end: 0.34 },
    'zt-content':    { start: 0.35, peak: 0.40, end: 0.50 },
    'zt-websites':   { start: 0.50, peak: 0.55, end: 0.62 },
    'zt-calling':    { start: 0.62, peak: 0.67, end: 0.75 },
    'zt-texting':    { start: 0.75, peak: 0.80, end: 0.88 },
    'zt-ecosystem':  { start: 0.88, peak: 0.92, end: 0.96 },
    'zt-cta':        { start: 0.95, peak: 0.97, end: 1.00 },
  };

  const ztEls = {};
  Object.keys(ZONE_TEXT).forEach(id => {
    ztEls[id] = document.getElementById(id);
  });

  function updateZoneText(p) {
    Object.entries(ZONE_TEXT).forEach(([id, z]) => {
      const el = ztEls[id];
      if (!el) return;
      let opacity = 0;
      if (p >= z.start && p <= z.end) {
        const inT  = (p - z.start) / (z.peak - z.start);
        const outT = (p - z.end)   / (z.peak - z.end);
        opacity = Math.min(ease4(inT), ease4(outT));
      }
      el.style.opacity = clamp(opacity, 0, 1);
    });
  }

  /* ── Nav & Progress ───────────────────────────────────────────── */
  const nav = document.getElementById('nav');
  const navCtx = document.getElementById('nav-context');
  const progressFill = document.getElementById('progress-fill');
  const sectionLabel = document.getElementById('section-label');
  const sectionLabelTitle = document.getElementById('section-label-title');
  const sectionLabelSub = document.getElementById('section-label-sub');

  const ZONE_NAV = [
    { range: [0, 0.12], label: '', sub: '' },
    { range: [0.12, 0.22], label: 'The Ecosystem', sub: 'Welcome' },
    { range: [0.22, 0.35], label: 'Mission Control', sub: 'Overview' },
    { range: [0.35, 0.50], label: 'Content Engine', sub: '01' },
    { range: [0.50, 0.62], label: 'Website Experiences', sub: '02' },
    { range: [0.62, 0.75], label: 'AI Calling Agents', sub: '03' },
    { range: [0.75, 0.88], label: 'AI Texting Agents', sub: '04' },
    { range: [0.88, 1.00], label: 'Built To Grow', sub: 'KLLEZO' },
  ];

  let lastNavLabel = '';

  function updateNav(p) {
    progressFill.style.height = (p * 100) + '%';

    // Nav visibility
    if (p > 0.08) {
      nav.classList.add('visible');
      nav.classList.toggle('bg', p > 0.14);
    } else {
      nav.classList.remove('visible');
    }

    // Section label
    let found = false;
    for (const z of ZONE_NAV) {
      if (p >= z.range[0] && p < z.range[1]) {
        if (z.label && z.label !== lastNavLabel) {
          lastNavLabel = z.label;
          navCtx.textContent = z.label;
          if (sectionLabelTitle) sectionLabelTitle.textContent = z.label;
          if (sectionLabelSub) sectionLabelSub.textContent = z.sub;
        }
        found = true;
        break;
      }
    }

    if (sectionLabel) {
      sectionLabel.style.opacity = p > 0.12 && p < 0.95 ? '1' : '0';
    }
  }

  /* ── Particle Animation ───────────────────────────────────────── */
  function animateParticles(time) {
    const pos = pGeo.attributes.position;
    for (let i = 0; i < particleCount; i++) {
      // Slow drift
      pos.array[i * 3]     += Math.sin(time * 0.18 * pSpeeds[i] + i) * 0.004;
      pos.array[i * 3 + 1] += Math.cos(time * 0.14 * pSpeeds[i] + i * 0.7) * 0.003;
    }
    pos.needsUpdate = true;
  }

  /* ── Screen subtle float ──────────────────────────────────────── */
  let screenFloatOriginals = null;

  function captureScreenPositions() {
    screenFloatOriginals = meshes.map(m => ({
      x: m.position.x,
      y: m.position.y,
      z: m.position.z,
      ry: m.rotation.y,
    }));
  }
  captureScreenPositions();

  function animateScreenFloat(time) {
    if (!screenFloatOriginals) return;
    meshes.forEach((m, i) => {
      const o = screenFloatOriginals[i];
      const freq = 0.14 + (i % 7) * 0.02;
      const amp  = 0.04 + (i % 5) * 0.015;
      m.position.y = o.y + Math.sin(time * freq + i) * amp;
      m.rotation.y = o.ry + Math.sin(time * freq * 0.7 + i * 0.8) * 0.008;
    });
  }

  /* ── Data Flow Animation ──────────────────────────────────────── */
  function animateFlowPath(p, time) {
    // Flow becomes visible in content zone and stays
    const flowVisible = p > 0.35;
    const flowOpacity = flowVisible ? easeIO(Math.min((p - 0.35) / 0.1, 1)) * 0.3 : 0;
    flowMat.opacity = flowOpacity;

    // Flow nodes pulse
    flowNodes.forEach((node, i) => {
      const nodeZ = FLOW_STAGES[i].pos[2];
      const camZ  = camera.position.z;
      const dist  = Math.abs(camZ - nodeZ);
      const pulse = Math.sin(time * 1.8 + i * 1.2) * 0.3 + 0.7;
      const proximity = Math.max(0, 1 - dist / 30);
      node.material.opacity = proximity * pulse * 0.9;
      node.scale.setScalar(0.8 + proximity * 0.4 + pulse * 0.15);
    });
  }

  /* ── Main Render Loop ─────────────────────────────────────────── */
  const clock = new THREE.Clock();
  let frameCount = 0;

  // Look-at smoothing
  const lookTarget = new THREE.Vector3();
  const lookCurrent = new THREE.Vector3(0, 0, -10);

  function renderLoop() {
    requestAnimationFrame(renderLoop);

    const time = clock.getElapsedTime();
    const delta = clock.getDelta ? clock.getDelta() : 0.016;
    frameCount++;

    // Smooth scroll
    scrollSmooth = lerp(scrollSmooth, scrollRaw, 0.06);
    const p = clamp(scrollSmooth, 0, 1);

    // Expose to hero-screens.js
    window.HERO.scrollProgress = p;

    // Camera position along spline
    const camPos = camSpline.getPoint(p);
    camera.position.lerp(camPos, 0.08);

    // Camera look-at along spline
    const rawLook = lookSpline.getPoint(p);
    lookCurrent.lerp(rawLook, 0.06);
    camera.lookAt(lookCurrent);

    // Subtle camera micro-drift
    camera.position.x += Math.sin(time * 0.2) * 0.015;
    camera.position.y += Math.cos(time * 0.14) * 0.008;

    // Dynamic lighting
    champagneSpot.intensity = 1.2 + Math.sin(time * 0.4) * 0.15;
    forestSpot.intensity    = 0.8 + Math.cos(time * 0.3) * 0.1;

    // Screen float
    if (frameCount % 2 === 0) animateScreenFloat(time); // every 2 frames

    // Particle drift (every 3 frames for perf)
    if (frameCount % 3 === 0) animateParticles(time);

    // Data flow
    animateFlowPath(p, time);

    // Texture updates
    processTexQueue(performance.now());

    // Overlay text
    updateZoneText(p);
    updateNav(p);

    renderer.render(scene, camera);
  }

  /* ── Resize Handler ───────────────────────────────────────────── */
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  /* ── Start ────────────────────────────────────────────────────── */
  renderLoop();

  console.log('[KLLEZO V4.1] Universe initialized — 3-tier rendering active');
  console.log(`[KLLEZO] Scroll height: 1400vh · Camera path: ${PATH_POINTS.length} keyframes`);

})();
