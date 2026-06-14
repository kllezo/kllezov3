/**
 * KLLEZO — Universe Engine v4
 *
 * PRINCIPLE: SHOW LESS. MAKE IT BEAUTIFUL.
 * One cinematic hero per zone. Every object intentional.
 *
 * Zones:
 *   Hero      z = 0
 *   Content   z = -90   ONE luxury phone + real reel
 *   Websites  z = -210  ONE award-winning website
 *   Calling   z = -330  ONE call journey + rings
 *   Texting   z = -430  ONE conversation + dashboard
 *   Finale    z = -520  Clean ecosystem
 */

'use strict';

/* ─────────────────────────────────────────
   HELPERS
───────────────────────────────────────── */
const lerp  = (a, b, t) => a + (b - a) * t;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const rand  = (lo, hi) => lo + Math.random() * (hi - lo);
const PI    = Math.PI;
const TAU   = PI * 2;

/* ─────────────────────────────────────────
   1. RENDERER
───────────────────────────────────────── */
const canvas = document.getElementById('universe');
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  powerPreference: 'high-performance',
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x060d0b, 1);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.5;

const scene = new THREE.Scene();
scene.fog   = new THREE.FogExp2(0x060d0b, 0.005);

const camera = new THREE.PerspectiveCamera(
  62, window.innerWidth / window.innerHeight, 0.1, 600
);
camera.position.set(0, 2, 22);

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

/* ─────────────────────────────────────────
   2. LIGHTING — One global + one accent per zone
───────────────────────────────────────── */
scene.add(new THREE.AmbientLight(0x0c3530, 2.0));

const sunLight = new THREE.DirectionalLight(0xfbf5e9, 0.6);
sunLight.position.set(20, 40, 20);
scene.add(sunLight);

// Per-zone accent (hue shifts as journey progresses)
const lights = {
  content:  makeZoneLight(0x1a9e8f, 5.0, 90,  0, 12, -90),
  websites: makeZoneLight(0xfbf5e9, 3.0, 80,  0,  8, -210),
  calling:  makeZoneLight(0x20bfad, 7.0, 110, 0,  0, -330),
  texting:  makeZoneLight(0x1a9e8f, 4.0, 80,  0,  4, -430),
  finale:   makeZoneLight(0xfbf5e9, 3.0, 90,  0, 20, -510),
};

function makeZoneLight(color, intensity, distance, x, y, z) {
  const l = new THREE.PointLight(color, intensity, distance);
  l.position.set(x, y, z);
  scene.add(l);
  return l;
}

/* ─────────────────────────────────────────
   3. CAMERA PATH — Smooth, cinematic
   One dwell per zone. Feels curated, not rushed.
───────────────────────────────────────── */
const CAM_PATH = new THREE.CatmullRomCurve3([
  new THREE.Vector3( 0,  3,  22),   // t=0.00  Hero entrance
  new THREE.Vector3( 0,  1,   6),   // t=0.07  Hero push
  new THREE.Vector3( 0,  0,  -8),   // t=0.13  Hero depart
  new THREE.Vector3( 5,  2,  -55),  // t=0.20  Approach phone
  new THREE.Vector3( 2,  0,  -90),  // t=0.28  Phone — slight angle
  new THREE.Vector3( 0,  0, -100),  // t=0.33  Phone front dwell
  new THREE.Vector3(-3,  2, -125),  // t=0.38  Depart content
  new THREE.Vector3( 0,  3, -170),  // t=0.44  Approach website
  new THREE.Vector3( 0,  0, -210),  // t=0.51  Website front dwell
  new THREE.Vector3( 0, -5, -226),  // t=0.56  Website detail zoom
  new THREE.Vector3( 0,  2, -270),  // t=0.62  Depart website
  new THREE.Vector3( 0,  0, -330),  // t=0.69  Calling center dwell
  new THREE.Vector3( 0,  5, -370),  // t=0.76  Depart calling
  new THREE.Vector3( 3,  2, -400),  // t=0.81  Approach texting
  new THREE.Vector3( 0,  0, -430),  // t=0.87  Texting dwell
  new THREE.Vector3( 0, 35, -455),  // t=0.93  Pull back high
  new THREE.Vector3( 0, 60, -435),  // t=0.97  Majestic finale
  new THREE.Vector3( 0, 72, -425),  // t=1.00  End
], false, 'catmullrom', 0.5);

const LOOK_PATH = new THREE.CatmullRomCurve3([
  new THREE.Vector3( 0,  0,  -5),
  new THREE.Vector3( 0,  0, -20),
  new THREE.Vector3( 0,  0, -50),
  new THREE.Vector3( 0,  0, -90),
  new THREE.Vector3( 0,  0, -95),
  new THREE.Vector3( 0,  0, -95),
  new THREE.Vector3( 0,  0, -140),
  new THREE.Vector3( 0,  0, -180),
  new THREE.Vector3( 0,  0, -210),
  new THREE.Vector3( 0, -2, -215),
  new THREE.Vector3( 0,  0, -280),
  new THREE.Vector3( 0,  0, -330),
  new THREE.Vector3( 0,  0, -360),
  new THREE.Vector3( 0,  0, -415),
  new THREE.Vector3( 0,  0, -432),
  new THREE.Vector3( 0,-20, -445),
  new THREE.Vector3( 0,-42, -445),
  new THREE.Vector3( 0,-55, -445),
], false, 'catmullrom', 0.5);

/* ─────────────────────────────────────────
   4. SCROLL
───────────────────────────────────────── */
let scrollRaw      = 0;
let scrollProgress = 0;

window.addEventListener('scroll', () => {
  const max = document.body.scrollHeight - window.innerHeight;
  scrollRaw = window.scrollY / max;
}, { passive: true });

/* ─────────────────────────────────────────
   5. MOUSE PARALLAX
───────────────────────────────────────── */
const mouse = { x: 0, y: 0, sx: 0, sy: 0 };
window.addEventListener('mousemove', e => {
  mouse.x = (e.clientX / window.innerWidth  - 0.5) * 2;
  mouse.y = -(e.clientY / window.innerHeight - 0.5) * 2;
});

/* ─────────────────────────────────────────
   6. VOID PARTICLES — Tasteful, minimal
───────────────────────────────────────── */
{
  const N = 1200;
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    pos[i*3]   = rand(-55, 55);
    pos[i*3+1] = rand(-28, 28);
    pos[i*3+2] = rand(-530, 22);
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  scene.add(new THREE.Points(geo, new THREE.PointsMaterial({
    color: 0xfbf5e9, size: 0.055,
    transparent: true, opacity: 0.22,
    blending: THREE.AdditiveBlending, depthWrite: false,
  })));
}

/* ─────────────────────────────────────────
   SHARED MATERIAL BUILDERS
───────────────────────────────────────── */
function screenMat(tex, emissive = 0.12) {
  return new THREE.MeshStandardMaterial({
    map: tex,
    emissiveMap: tex,
    emissive: new THREE.Color(0xffffff),
    emissiveIntensity: emissive,
    roughness: 0.12,
    metalness: 0.0,
  });
}

function darkMetal(color = 0x080c0b) {
  return new THREE.MeshStandardMaterial({
    color, roughness: 0.08, metalness: 0.96,
  });
}

/* ══════════════════════════════════════════
   ZONE 1: HERO — KLLEZO wordmark only
   Minimal particle constellation
══════════════════════════════════════════ */
(function buildHero() {
  // Orbital ring of fine particles at z=0
  const N = 900;
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    const angle = (i / N) * TAU + rand(-0.4, 0.4);
    const r = rand(9, 20);
    pos[i*3]   = Math.cos(angle) * r;
    pos[i*3+1] = Math.sin(angle) * r * 0.18 + rand(-0.8, 0.8);
    pos[i*3+2] = rand(-5, 5);
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const heroRing = new THREE.Points(geo, new THREE.PointsMaterial({
    color: 0xfbf5e9, size: 0.09,
    transparent: true, opacity: 0.22,
    blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  scene.userData.heroRing = heroRing;
  scene.add(heroRing);
})();

/* ══════════════════════════════════════════
   ZONE 2: CONTENT — ONE luxury phone
   Real Instagram reel. Full-bleed. Cinematic.
══════════════════════════════════════════ */
(function buildContent() {
  const Z = -90;
  const phoneGroup = new THREE.Group();
  phoneGroup.position.set(0, 0, Z);

  // Body chassis — premium dark titanium
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(7.0, 14.4, 0.8),
    darkMetal(0x090d0c)
  );
  phoneGroup.add(body);

  // Titanium rail — all four edges
  const railMat = new THREE.MeshStandardMaterial({
    color: 0x1a4a42, roughness: 0.04, metalness: 1.0,
  });
  [[-3.54, 0, 'v'], [3.54, 0, 'v'], [0, 7.24, 'h'], [0, -7.24, 'h']].forEach(([x, y, axis]) => {
    const rail = new THREE.Mesh(
      axis === 'v'
        ? new THREE.BoxGeometry(0.07, 14.4, 0.82)
        : new THREE.BoxGeometry(7.14, 0.07, 0.82),
      railMat
    );
    rail.position.set(x, y, 0);
    phoneGroup.add(rail);
  });

  // Screen — real Instagram Reel
  const reelTex = drawInstagramReel(0).texture;
  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(6.1, 12.95),
    screenMat(reelTex, 0.15)
  );
  screen.position.z = 0.41;
  phoneGroup.add(screen);

  // Dynamic Island
  const island = new THREE.Mesh(
    new THREE.BoxGeometry(1.5, 0.36, 0.06),
    new THREE.MeshStandardMaterial({ color: 0x000000, roughness: 0.9 })
  );
  island.position.set(0, 6.18, 0.43);
  phoneGroup.add(island);

  // Ultra-thin edge highlight strip (top)
  const highlight = new THREE.Mesh(
    new THREE.BoxGeometry(7.0, 0.03, 0.05),
    new THREE.MeshStandardMaterial({
      color: 0x1a9e8f, emissive: 0x1a9e8f, emissiveIntensity: 0.8,
      transparent: true, opacity: 0.7,
    })
  );
  highlight.position.set(0, 7.22, 0);
  phoneGroup.add(highlight);

  // Subtle ground reflection plane
  const reflectGeo = new THREE.PlaneGeometry(7, 14.4);
  const reflect = new THREE.Mesh(reflectGeo,
    new THREE.MeshStandardMaterial({
      color: 0x0a1a16, roughness: 1, metalness: 0,
      transparent: true, opacity: 0.12,
    })
  );
  reflect.rotation.x = PI;
  reflect.position.set(0, -7.6, 0);
  phoneGroup.add(reflect);

  scene.add(phoneGroup);
  scene.userData.contentPhone = phoneGroup;
})();

/* ══════════════════════════════════════════
   ZONE 3: WEBSITES — ONE breathtaking website
   Large monitor. Camera flies into it.
══════════════════════════════════════════ */
(function buildWebsites() {
  const Z = -210;

  // Website texture — premium landing page
  const siteTex = drawLandingPage(1).texture; // dark variant

  // Screen
  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(30, 18.75),  // 16:10
    screenMat(siteTex, 0.09)
  );
  screen.position.set(0, 0, Z);
  scene.add(screen);

  // Monitor frame
  const frame = new THREE.Mesh(
    new THREE.BoxGeometry(30.7, 19.4, 0.35),
    new THREE.MeshStandardMaterial({ color: 0x060a09, roughness: 0.25, metalness: 0.75 })
  );
  frame.position.set(0, 0, Z - 0.19);
  scene.add(frame);

  // Bezel glow — top and bottom edges only
  const glowMat = new THREE.MeshStandardMaterial({
    color: 0x1a9e8f, emissive: 0x1a9e8f, emissiveIntensity: 0.5,
    roughness: 0, metalness: 1, transparent: true, opacity: 0.45,
  });

  const topGlow = new THREE.Mesh(new THREE.BoxGeometry(30.7, 0.04, 0.04), glowMat);
  topGlow.position.set(0, 9.72, Z - 0.16);
  scene.add(topGlow);

  const botGlow = new THREE.Mesh(new THREE.BoxGeometry(30.7, 0.04, 0.04), glowMat.clone());
  botGlow.position.set(0, -9.72, Z - 0.16);
  scene.add(botGlow);

  // Side glow (left / right)
  const lGlow = new THREE.Mesh(new THREE.BoxGeometry(0.04, 19.4, 0.04), glowMat.clone());
  lGlow.position.set(-15.37, 0, Z - 0.16);
  scene.add(lGlow);
  const rGlow = new THREE.Mesh(new THREE.BoxGeometry(0.04, 19.4, 0.04), glowMat.clone());
  rGlow.position.set(15.37, 0, Z - 0.16);
  scene.add(rGlow);

  // Thin monitor stand
  const neck = new THREE.Mesh(
    new THREE.BoxGeometry(0.6, 3.5, 0.35),
    new THREE.MeshStandardMaterial({ color: 0x0a1210, roughness: 0.2, metalness: 0.9 })
  );
  neck.position.set(0, -11.5, Z - 0.15);
  scene.add(neck);

  const base = new THREE.Mesh(
    new THREE.BoxGeometry(6, 0.2, 2.5),
    new THREE.MeshStandardMaterial({ color: 0x090d0c, roughness: 0.15, metalness: 0.95 })
  );
  base.position.set(0, -13.3, Z + 0.9);
  scene.add(base);

  // Atmospheric breath particles (very sparse)
  const N = 180;
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    pos[i*3]   = rand(-22, 22);
    pos[i*3+1] = rand(-14, 14);
    pos[i*3+2] = Z + rand(-6, 18);
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  scene.add(new THREE.Points(geo, new THREE.PointsMaterial({
    color: 0xfbf5e9, size: 0.045,
    transparent: true, opacity: 0.18,
    blending: THREE.AdditiveBlending, depthWrite: false,
  })));

  scene.userData.websiteGlow = { top: topGlow, bot: botGlow, l: lGlow, r: rGlow };
})();

/* ══════════════════════════════════════════
   ZONE 4: AI CALLING — One customer journey
   Rings + call screen + CRM. Nothing else.
══════════════════════════════════════════ */
(function buildCalling() {
  const Z = -330;

  // ── Concentric rings — 8 rings (was 14, now 8)
  scene.userData.callingRings = [];
  const radii = [4, 9, 15, 22, 30, 40, 52, 65];
  radii.forEach((r, i) => {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(r, Math.max(0.03, 0.09 - i * 0.009), 6, 56 + i * 4),
      new THREE.MeshStandardMaterial({
        color: 0x1a9e8f, emissive: 0x1a9e8f,
        emissiveIntensity: Math.max(0.04, 1.1 - i * 0.14),
        roughness: 0.08, metalness: 0.95,
        transparent: true,
        opacity: Math.max(0.04, 0.88 - i * 0.11),
      })
    );
    ring.position.z = Z;
    ring.rotation.x = PI / 2;
    ring.userData = {
      phase: i * 0.55,
      speed: 0.005 + i * 0.0008,
    };
    scene.userData.callingRings.push(ring);
    scene.add(ring);
  });

  // ── ONE call screen (left) — real AI call interface
  const callTex = drawActiveCallScreen().texture;
  const callScreen = new THREE.Mesh(
    new THREE.PlaneGeometry(5.6, 12.1),
    screenMat(callTex, 0.15)
  );
  callScreen.position.set(-22, 0, Z);
  callScreen.rotation.y = 0.18;
  scene.add(callScreen);

  const callFrame = new THREE.Mesh(
    new THREE.BoxGeometry(6.0, 12.6, 0.18),
    darkMetal(0x070b0a)
  );
  callFrame.position.set(-22, 0, Z - 0.1);
  callFrame.rotation.y = 0.18;
  scene.add(callFrame);

  // ── ONE CRM pipeline (right)
  const pipelineTex = drawSalesPipeline().texture;
  const pipeline = new THREE.Mesh(
    new THREE.PlaneGeometry(16, 10),
    screenMat(pipelineTex, 0.09)
  );
  pipeline.position.set(22, 2, Z);
  pipeline.rotation.y = -0.18;
  scene.add(pipeline);

  const pipeBacking = new THREE.Mesh(
    new THREE.BoxGeometry(16.4, 10.4, 0.16),
    new THREE.MeshStandardMaterial({ color: 0x060a09, roughness: 0.35, metalness: 0.6 })
  );
  pipeBacking.position.set(22, 2, Z - 0.09);
  pipeBacking.rotation.y = -0.18;
  scene.add(pipeBacking);

  // ── Central core glow (pulse = alive)
  const core = new THREE.Mesh(
    new THREE.SphereGeometry(1.0, 32, 32),
    new THREE.MeshStandardMaterial({
      color: 0x1a9e8f, roughness: 0, metalness: 1,
      emissive: 0x1a9e8f, emissiveIntensity: 3.0,
      transparent: true, opacity: 0.92,
    })
  );
  core.position.set(0, 0, Z);
  scene.add(core);
  scene.userData.callingCore = core;

  // ── Lead particles — inward spiral (2000, was 4000)
  const LEAD_N = 2000;
  const leadGeo = new THREE.BufferGeometry();
  const leadPos  = new Float32Array(LEAD_N * 3);
  const leadPh   = new Float32Array(LEAD_N);
  const leadRad  = new Float32Array(LEAD_N);
  const leadAng  = new Float32Array(LEAD_N);
  const leadZ    = new Float32Array(LEAD_N);
  const leadSpd  = new Float32Array(LEAD_N);
  for (let i = 0; i < LEAD_N; i++) {
    leadPh[i]  = Math.random();
    leadRad[i] = rand(55, 90);
    leadAng[i] = rand(0, TAU);
    leadZ[i]   = rand(-18, 18);
    leadSpd[i] = rand(0.003, 0.009);
  }
  leadGeo.setAttribute('position', new THREE.BufferAttribute(leadPos, 3));
  const leadPts = new THREE.Points(leadGeo, new THREE.PointsMaterial({
    color: 0x1a9e8f, size: 0.10,
    transparent: true, opacity: 0.35,
    blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  scene.add(leadPts);

  // Store refs
  scene.userData.leadPoints = leadPts;
  scene.userData.leadPh  = leadPh;
  scene.userData.leadRad = leadRad;
  scene.userData.leadAng = leadAng;
  scene.userData.leadZ   = leadZ;
  scene.userData.leadSpd = leadSpd;
  scene.userData.LEAD_N  = LEAD_N;
  scene.userData.CALLING_Z = Z;

  // Stub for animation compat
  scene.userData.calAssembly = { children: [], rotation: { y: 0 } };
})();

/* ══════════════════════════════════════════
   ZONE 5: AI TEXTING — One conversation
   One phone. One story. Beautiful.
══════════════════════════════════════════ */
(function buildTexting() {
  const Z = -430;
  const phoneGroup = new THREE.Group();
  phoneGroup.position.set(0, 0, Z);

  // Phone body
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(6.0, 13.0, 0.8),
    darkMetal(0x090d0c)
  );
  phoneGroup.add(body);

  // Rails
  const railMat = new THREE.MeshStandardMaterial({ color: 0x1a4a42, roughness: 0.04, metalness: 1.0 });
  [[-3.04, 0, 'v'], [3.04, 0, 'v'], [0, 6.54, 'h'], [0, -6.54, 'h']].forEach(([x, y, axis]) => {
    const rail = new THREE.Mesh(
      axis === 'v'
        ? new THREE.BoxGeometry(0.07, 13.0, 0.82)
        : new THREE.BoxGeometry(6.14, 0.07, 0.82),
      railMat
    );
    rail.position.set(x, y, 0);
    phoneGroup.add(rail);
  });

  // Screen — real WhatsApp conversation
  const chatTex = drawWhatsAppChat(0).texture;
  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(5.2, 11.5),
    screenMat(chatTex, 0.14)
  );
  screen.position.z = 0.41;
  phoneGroup.add(screen);

  // Dynamic Island
  const island = new THREE.Mesh(
    new THREE.BoxGeometry(1.3, 0.33, 0.06),
    new THREE.MeshStandardMaterial({ color: 0x000000, roughness: 0.9 })
  );
  island.position.set(0, 5.6, 0.43);
  phoneGroup.add(island);

  // Edge highlight
  const highlight = new THREE.Mesh(
    new THREE.BoxGeometry(6.0, 0.03, 0.05),
    new THREE.MeshStandardMaterial({
      color: 0x1a9e8f, emissive: 0x1a9e8f, emissiveIntensity: 0.8,
      transparent: true, opacity: 0.6,
    })
  );
  highlight.position.set(0, 6.52, 0);
  phoneGroup.add(highlight);

  scene.add(phoneGroup);
  scene.userData.textingPhone = phoneGroup;

  // Campaign dashboard — right side
  const campTex = drawCampaignDashboard().texture;
  const campScreen = new THREE.Mesh(
    new THREE.PlaneGeometry(15, 9.375),
    screenMat(campTex, 0.08)
  );
  campScreen.position.set(20, 2, Z);
  campScreen.rotation.y = -0.16;
  scene.add(campScreen);

  const campBack = new THREE.Mesh(
    new THREE.BoxGeometry(15.4, 9.8, 0.16),
    new THREE.MeshStandardMaterial({ color: 0x060a09, roughness: 0.4, metalness: 0.55 })
  );
  campBack.position.set(20, 2, Z - 0.09);
  campBack.rotation.y = -0.16;
  scene.add(campBack);

  // Minimal floating particles
  const N = 600;
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    pos[i*3]   = rand(-28, 28);
    pos[i*3+1] = rand(-16, 16);
    pos[i*3+2] = Z + rand(-18, 18);
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  scene.add(new THREE.Points(geo, new THREE.PointsMaterial({
    color: 0x20bfad, size: 0.07,
    transparent: true, opacity: 0.18,
    blending: THREE.AdditiveBlending, depthWrite: false,
  })));

  // Compat stubs
  scene.userData.textBubbles  = [phoneGroup];
  scene.userData.branches     = [];
  scene.userData.branchSeeds  = [];
})();

/* ══════════════════════════════════════════
   ZONE 6: FINALE — Clean connected ecosystem
══════════════════════════════════════════ */
(function buildFinale() {
  const Z = -520;

  const nodePositions = [
    [-18, -9,  Z - 15],
    [ 18, -9,  Z - 15],
    [-18,  9,  Z + 15],
    [ 18,  9,  Z + 15],
  ];

  const nodeMat = new THREE.MeshStandardMaterial({
    color: 0x1a7a70, roughness: 0.12, metalness: 0.88,
    emissive: 0x0d4a42, emissiveIntensity: 0.45,
  });

  scene.userData.ecoNodes = [];

  nodePositions.forEach((p, i) => {
    const sphere = new THREE.Mesh(new THREE.SphereGeometry(1.4, 32, 32), nodeMat.clone());
    sphere.position.set(...p);
    sphere.userData = { phase: i * 0.85, baseY: p[1] };
    scene.add(sphere);
    scene.userData.ecoNodes.push(sphere);

    // Orbital torus
    const torus = new THREE.Mesh(
      new THREE.TorusGeometry(2.6, 0.025, 6, 40),
      new THREE.MeshStandardMaterial({
        color: 0x1a9e8f, emissive: 0x1a9e8f, emissiveIntensity: 0.55,
        transparent: true, opacity: 0.5,
      })
    );
    torus.position.set(...p);
    torus.userData = { phase: i * 0.65, tilt: (i % 2 === 0 ? 1 : -1) * 0.35 };
    scene.add(torus);
    scene.userData.ecoNodes.push(torus);
  });

  // Connection web — clean lines
  const pairs = [[0,1],[2,3],[0,2],[1,3],[0,3],[1,2]];
  pairs.forEach(([a, b]) => {
    const pa = new THREE.Vector3(...nodePositions[a]);
    const pb = new THREE.Vector3(...nodePositions[b]);
    scene.add(new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([pa, pb]),
      new THREE.LineBasicMaterial({ color: 0x1a9e8f, transparent: true, opacity: 0.12 })
    ));
  });

  // Central hub — pure white glow
  const hub = new THREE.Mesh(
    new THREE.SphereGeometry(0.5, 24, 24),
    new THREE.MeshStandardMaterial({
      color: 0xfbf5e9, roughness: 0, metalness: 1,
      emissive: 0xfbf5e9, emissiveIntensity: 2.0,
      transparent: true, opacity: 0.95,
    })
  );
  hub.position.set(0, 0, Z);
  scene.add(hub);
  scene.userData.ecoHub = hub;
})();

/* ─────────────────────────────────────────
   ANIMATION LOOP
───────────────────────────────────────── */
const clock = new THREE.Clock();
let time = 0;

// Temp vector to avoid allocations in loop
const _camTarget = new THREE.Vector3();
const _lookTarget = new THREE.Vector3();

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);
  time += dt;

  // Smooth scroll
  scrollProgress = lerp(scrollProgress, scrollRaw, 0.038);
  const t = clamp(scrollProgress, 0, 0.9999);

  // ── Camera
  const cp = CAM_PATH.getPoint(t);
  const lp = LOOK_PATH.getPoint(t);

  mouse.sx = lerp(mouse.sx, mouse.x, 0.045);
  mouse.sy = lerp(mouse.sy, mouse.y, 0.045);

  _camTarget.set(
    cp.x + mouse.sx * 1.2,
    cp.y + mouse.sy * 0.8,
    cp.z
  );
  camera.position.lerp(_camTarget, 0.055);
  _lookTarget.copy(lp);
  camera.lookAt(_lookTarget);

  // ── Hero ring
  if (scene.userData.heroRing) {
    scene.userData.heroRing.rotation.z += 0.0003;
    scene.userData.heroRing.rotation.y += 0.0001;
  }

  // ── Content phone — gentle float + slight rotation
  const phone = scene.userData.contentPhone;
  if (phone) {
    phone.position.y = Math.sin(time * 0.35) * 0.25;
    phone.rotation.y = Math.sin(time * 0.22) * 0.035;
  }

  // ── Website glow breathe
  const wg = scene.userData.websiteGlow;
  if (wg) {
    const pulse = 0.4 + Math.sin(time * 0.6) * 0.1;
    [wg.top, wg.bot, wg.l, wg.r].forEach(m => {
      m.material.emissiveIntensity = pulse;
    });
  }

  // ── Calling rings
  const rings = scene.userData.callingRings;
  if (rings) {
    rings.forEach((ring, i) => {
      ring.rotation.z = time * ring.userData.speed + ring.userData.phase;
      ring.rotation.x = PI / 2 + Math.sin(time * 0.28 + ring.userData.phase) * 0.03;
      const scalePulse = 1 + Math.sin(time * 0.45 + ring.userData.phase) * 0.012;
      ring.scale.setScalar(scalePulse);
    });
  }

  // ── Calling core pulse
  const core = scene.userData.callingCore;
  if (core) {
    const s = 1 + Math.sin(time * 2.2) * 0.18;
    core.scale.setScalar(s);
    core.material.emissiveIntensity = 2.5 + Math.sin(time * 1.9) * 1.0;
  }

  // ── Lead particles — spiral inward
  const lp2 = scene.userData.leadPoints;
  if (lp2) {
    const pa  = lp2.geometry.attributes.position;
    const ph  = scene.userData.leadPh;
    const rad = scene.userData.leadRad;
    const ang = scene.userData.leadAng;
    const lz  = scene.userData.leadZ;
    const spd = scene.userData.leadSpd;
    const CZ  = scene.userData.CALLING_Z;
    const N   = scene.userData.LEAD_N;
    for (let i = 0; i < N; i++) {
      ph[i] = (ph[i] + spd[i]) % 1;
      const r = rad[i] * (1 - ph[i]);
      const a = ang[i] + ph[i] * TAU * 1.5;
      pa.setXYZ(i, Math.cos(a) * r, Math.sin(a) * r * 0.25, CZ + lz[i]);
    }
    pa.needsUpdate = true;
  }

  // ── Texting phone — gentle float
  const tp = scene.userData.textingPhone;
  if (tp) {
    tp.position.y = Math.sin(time * 0.38 + 1.2) * 0.22;
    tp.rotation.y = Math.sin(time * 0.18 + 0.8) * 0.028;
  }

  // ── Ecosystem nodes
  const nodes = scene.userData.ecoNodes;
  if (nodes) {
    nodes.forEach(n => {
      if (n.geometry && n.geometry.type === 'TorusGeometry') {
        n.rotation.y += 0.006;
        n.rotation.x += 0.002 * (n.userData.tilt || 1);
      } else {
        const baseY = n.userData.baseY || 0;
        n.position.y = baseY + Math.sin(time * 0.5 + (n.userData.phase || 0)) * 0.4;
        n.material.emissiveIntensity = 0.4 + Math.sin(time * 0.8 + (n.userData.phase || 0)) * 0.15;
      }
    });
  }

  if (scene.userData.ecoHub) {
    const s = 1 + Math.sin(time * 1.6) * 0.12;
    scene.userData.ecoHub.scale.setScalar(s);
  }

  renderer.render(scene, camera);
}

animate();
