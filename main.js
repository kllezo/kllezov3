/**
 * KLLEZO — Universe Engine
 *
 * One Three.js scene. Camera travels a CatmullRom spline.
 * Scroll progress (0→1) drives the entire journey.
 *
 * Zones (world Z-axis):
 *   Hero     z=0  → z=-40
 *   Content  z=-60 → z=-150
 *   Websites z=-180 → z=-270
 *   Calling  z=-300 → z=-390
 *   Texting  z=-410 → z=-480
 *   Ecosystem z=-500 → z=-550
 */

'use strict';

/* ═══════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════ */
const lerp  = (a, b, t) => a + (b - a) * t;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const rand  = (lo, hi) => lo + Math.random() * (hi - lo);
const PI    = Math.PI;
const TAU   = PI * 2;

/* ═══════════════════════════════════════════
   1. RENDERER SETUP
   ═══════════════════════════════════════════ */
const canvas   = document.getElementById('universe');
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  powerPreference: 'high-performance',
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x040e0c, 1);
renderer.toneMapping        = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.6;

const scene  = new THREE.Scene();
scene.fog    = new THREE.FogExp2(0x040e0c, 0.004);

const camera = new THREE.PerspectiveCamera(
  68, window.innerWidth / window.innerHeight, 0.1, 800
);
camera.position.set(0, 4, 90);

/* Resize */
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

/* ═══════════════════════════════════════════
   2. LIGHTING
   ═══════════════════════════════════════════ */
scene.add(new THREE.AmbientLight(0x0d3a34, 2.5));

const sun = new THREE.DirectionalLight(0xfbf5e9, 1.2);
sun.position.set(20, 40, 30);
scene.add(sun);

// Powerful zone lights
const lightContent = new THREE.PointLight(0x1a9e8f, 6.0, 120);
lightContent.position.set(0, 8, -90);
scene.add(lightContent);

const lightWebsites = new THREE.PointLight(0x1a7a70, 5.0, 120);
lightWebsites.position.set(0, 5, -220);
scene.add(lightWebsites);

const lightCalling = new THREE.PointLight(0x20bfad, 8.0, 160);
lightCalling.position.set(0, 0, -340);
scene.add(lightCalling);

const lightTexting = new THREE.PointLight(0x1a9e8f, 5.0, 120);
lightTexting.position.set(0, 3, -440);
scene.add(lightTexting);

const lightEco = new THREE.PointLight(0xfbf5e9, 4.0, 120);
lightEco.position.set(0, 0, -510);
scene.add(lightEco);

/* ═══════════════════════════════════════════
   3. CAMERA PATH
   ═══════════════════════════════════════════ */
const CAM_PATH = new THREE.CatmullRomCurve3([
  new THREE.Vector3(0,   2,   18),   // t=0.00  Hero — close
  new THREE.Vector3(0,   1,    6),   // t=0.06  Hero push in
  new THREE.Vector3(2,   2,  -15),   // t=0.11  Hero departing
  new THREE.Vector3(20,  4,  -60),   // t=0.17  Swing right, phone appears
  new THREE.Vector3(22,  3,  -95),   // t=0.22  Alongside giant phone — immersed
  new THREE.Vector3(2,   1,  -115),  // t=0.28  Front of phone screen
  new THREE.Vector3(-5,  0,  -140),  // t=0.33  Departing Content
  new THREE.Vector3(-8,  0,  -175),  // t=0.38  Entering website canyon
  new THREE.Vector3(0,   1,  -215),  // t=0.43  Flying through canyon
  new THREE.Vector3(7,   2,  -255),  // t=0.48  Emerging from canyon
  new THREE.Vector3(15,  3,  -295),  // t=0.53  Approach Calling
  new THREE.Vector3(0,   0,  -340),  // t=0.59  CENTER of rings — immersed
  new THREE.Vector3(-6, -1,  -370),  // t=0.64  Through rings, exiting
  new THREE.Vector3(-14, 4,  -400),  // t=0.69  Approach Texting
  new THREE.Vector3(0,   1,  -435),  // t=0.74  Riding message river
  new THREE.Vector3(10,  8,  -460),  // t=0.80  Rising up
  new THREE.Vector3(0,  40,  -490),  // t=0.87  High pullback
  new THREE.Vector3(0,  60,  -470),  // t=0.93  Majestic overview
  new THREE.Vector3(0,  75,  -455),  // t=1.00  Final
], false, 'catmullrom', 0.5);

// Look-at target path (guides camera rotation)
const LOOK_PATH = new THREE.CatmullRomCurve3([
  new THREE.Vector3(0,   0,   -5),   // Looking into void
  new THREE.Vector3(0,   0,  -20),
  new THREE.Vector3(-2,  0,  -60),
  new THREE.Vector3(-6,  0,  -95),   // Look at phone center
  new THREE.Vector3(0,   0, -100),   // Front of phone
  new THREE.Vector3(0,   0, -140),
  new THREE.Vector3(0,   0, -200),   // Through canyon
  new THREE.Vector3(0,   0, -235),
  new THREE.Vector3(0,   0, -280),
  new THREE.Vector3(0,   0, -340),   // Calling center
  new THREE.Vector3(0,   0, -360),
  new THREE.Vector3(0,   0, -410),   // Texting
  new THREE.Vector3(0,   0, -440),
  new THREE.Vector3(0, -8,  -460),   // Start looking down
  new THREE.Vector3(0, -20, -470),
  new THREE.Vector3(0, -35, -480),   // Final overview down
  new THREE.Vector3(0, -45, -490),
  new THREE.Vector3(0, -55, -490),
  new THREE.Vector3(0, -60, -490),
], false, 'catmullrom', 0.5);

/* ═══════════════════════════════════════════
   4. SCROLL SYSTEM
   ═══════════════════════════════════════════ */
let scrollRaw = 0;
let scrollProgress = 0; // smoothed 0→1

window.addEventListener('scroll', () => {
  const max = document.body.scrollHeight - window.innerHeight;
  scrollRaw = window.scrollY / max;
}, { passive: true });

/* ═══════════════════════════════════════════
   5. MOUSE
   ═══════════════════════════════════════════ */
const mouse = { x: 0, y: 0, sx: 0, sy: 0 };
window.addEventListener('mousemove', e => {
  mouse.x = (e.clientX / window.innerWidth  - 0.5) * 2;
  mouse.y = -(e.clientY / window.innerHeight - 0.5) * 2;
});

/* ═══════════════════════════════════════════
   6. MATERIAL LIBRARY
   ═══════════════════════════════════════════ */
const MAT = {
  phone: new THREE.MeshStandardMaterial({
    color: 0x0d5c54, roughness: 0.15, metalness: 0.85,
    envMapIntensity: 1.2,
  }),
  phoneScreen: new THREE.MeshStandardMaterial({
    color: 0x020808, roughness: 0.8, metalness: 0.1,
    emissive: 0x030f0e, emissiveIntensity: 0.5,
  }),
  reelFrame: new THREE.MeshStandardMaterial({
    color: 0x1a6e64, roughness: 0.3, metalness: 0.6,
    emissive: 0x0d3e38, emissiveIntensity: 0.3,
  }),
  pageArchitecture: new THREE.MeshStandardMaterial({
    color: 0x0a3832, roughness: 0.4, metalness: 0.5,
    transparent: true, opacity: 0.92,
  }),
  pageWireframe: new THREE.MeshStandardMaterial({
    color: 0x1a9e8f, roughness: 1, metalness: 0,
    transparent: true, opacity: 0.12,
    wireframe: true,
  }),
  ring: new THREE.MeshStandardMaterial({
    color: 0x0e6e64, roughness: 0.1, metalness: 0.9,
    emissive: 0x0a4a42, emissiveIntensity: 0.6,
    transparent: true, opacity: 0.85,
  }),
  glow: new THREE.MeshStandardMaterial({
    color: 0x1a9e8f, roughness: 0, metalness: 1,
    emissive: 0x1a9e8f, emissiveIntensity: 2.0,
    transparent: true, opacity: 0.9,
  }),
  calCell: new THREE.MeshStandardMaterial({
    color: 0x0a4a42, roughness: 0.5, metalness: 0.4,
    emissive: 0x062e28, emissiveIntensity: 0.4,
    transparent: true, opacity: 0.8,
  }),
  messageBubble: new THREE.MeshStandardMaterial({
    color: 0x0d6058, roughness: 0.5, metalness: 0.3,
    emissive: 0x083832, emissiveIntensity: 0.3,
    transparent: true, opacity: 0.88,
  }),
  messageBubbleAlt: new THREE.MeshStandardMaterial({
    color: 0x164040, roughness: 0.6, metalness: 0.2,
    emissive: 0x0b2828, emissiveIntensity: 0.2,
    transparent: true, opacity: 0.75,
  }),
  nodeSphere: new THREE.MeshStandardMaterial({
    color: 0x1a7a70, roughness: 0.2, metalness: 0.8,
    emissive: 0x0d4a42, emissiveIntensity: 0.5,
  }),
  footage: new THREE.MeshStandardMaterial({
    color: 0x0f4a44, roughness: 0.8, metalness: 0,
    transparent: true, opacity: 0.55,
    side: THREE.DoubleSide,
    emissive: 0x082e2a, emissiveIntensity: 0.4,
  }),
  timeline: new THREE.MeshStandardMaterial({
    color: 0x1a9e8f, roughness: 0.3, metalness: 0.6,
    emissive: 0x0f6a60, emissiveIntensity: 0.8,
    transparent: true, opacity: 0.9,
  }),
  waveform: new THREE.MeshStandardMaterial({
    color: 0x20bfad, roughness: 0.1, metalness: 0.9,
    emissive: 0x1a9e8f, emissiveIntensity: 1.2,
    transparent: true, opacity: 0.9,
  }),
};

/* ═══════════════════════════════════════════
   7. PARTICLE SYSTEM — Universal void particles
   ═══════════════════════════════════════════ */
const VOID_COUNT = 6000;
const voidGeo    = new THREE.BufferGeometry();
const voidPos    = new Float32Array(VOID_COUNT * 3);
const voidCol    = new Float32Array(VOID_COUNT * 3);
for (let i = 0; i < VOID_COUNT; i++) {
  const r     = rand(10, 80);
  const theta = rand(0, TAU);
  const phi   = rand(0, PI);
  voidPos[i*3]   = r * Math.sin(phi) * Math.cos(theta) * rand(0.5, 2.0);
  voidPos[i*3+1] = r * Math.sin(phi) * Math.sin(theta) * rand(0.3, 1.2);
  voidPos[i*3+2] = rand(-550, 10);
  // Beige-ish colors
  const bright = rand(0.5, 1.0);
  voidCol[i*3]   = bright * 0.98;
  voidCol[i*3+1] = bright * 0.96;
  voidCol[i*3+2] = bright * 0.91;
}
voidGeo.setAttribute('position', new THREE.BufferAttribute(voidPos, 3));
voidGeo.setAttribute('color',    new THREE.BufferAttribute(voidCol, 3));
const voidMat = new THREE.PointsMaterial({
  size: 0.12, vertexColors: true,
  transparent: true, opacity: 0.55,
  blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
});
scene.add(new THREE.Points(voidGeo, voidMat));

/* ═══════════════════════════════════════════
   8. ZONE — HERO
   ═══════════════════════════════════════════ */
(function buildHero() {
  // Swirling ring of particles at z=0
  const COUNT = 1800;
  const geo   = new THREE.BufferGeometry();
  const pos   = new Float32Array(COUNT * 3);
  for (let i = 0; i < COUNT; i++) {
    const angle = (i / COUNT) * TAU + rand(-0.3, 0.3);
    const r     = rand(12, 30);
    const layer = Math.floor(i / 600);
    pos[i*3]   = Math.cos(angle) * r;
    pos[i*3+1] = Math.sin(angle) * r * 0.3 + layer * 5 - 5 + rand(-1, 1);
    pos[i*3+2] = rand(-8, 8);
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({
    color: 0xfbf5e9, size: 0.14,
    transparent: true, opacity: 0.4,
    blending: THREE.AdditiveBlending, depthWrite: false,
  });
  const ring = new THREE.Points(geo, mat);
  ring.userData.zone = 'hero';
  scene.add(ring);
  scene.userData.heroRing = ring;
})();

/* ═══════════════════════════════════════════
   9. ZONE — CONTENT ENGINE  (center z=-100)
   ═══════════════════════════════════════════ */
const contentGroup = new THREE.Group();
contentGroup.position.z = 0; // objects have absolute positions

(function buildContent() {

  /* ── GIANT PHONE (10 × 20 units) at (0, 0, -100) ── */
  const PHONE_Z = -100;

  // Phone body
  const phoneBody = new THREE.Mesh(
    new THREE.BoxGeometry(10, 20, 1.4, 2, 2),
    MAT.phone.clone()
  );
  phoneBody.position.set(0, 0, PHONE_Z);
  scene.add(phoneBody);

  // Phone screen
  const phoneScreen = new THREE.Mesh(
    new THREE.PlaneGeometry(8.4, 17.2),
    MAT.phoneScreen.clone()
  );
  phoneScreen.position.set(0, 0, PHONE_Z + 0.72);
  scene.add(phoneScreen);

  // Screen content strips (simulated reels scrolling)
  const stripColors = [0x1a9e8f, 0x0d6058, 0x687b75, 0x1a7a70, 0x0a4a42, 0x1a9e8f, 0x0d5c54];
  for (let i = 0; i < 7; i++) {
    const strip = new THREE.Mesh(
      new THREE.PlaneGeometry(7.6, 2.1),
      new THREE.MeshStandardMaterial({
        color: stripColors[i % stripColors.length],
        emissive: stripColors[i % stripColors.length],
        emissiveIntensity: 0.2,
        roughness: 0.8,
      })
    );
    strip.position.set(0, 7 - i * 2.5, PHONE_Z + 0.75);
    scene.add(strip);
  }

  // Phone notch
  const notch = new THREE.Mesh(
    new THREE.CylinderGeometry(0.5, 0.5, 0.12, 16),
    new THREE.MeshStandardMaterial({ color: 0x020808, roughness: 0.9 })
  );
  notch.rotation.x = PI / 2;
  notch.position.set(0, 9.2, PHONE_Z + 0.74);
  scene.add(notch);

  /* ── ORBITING REELS — 22 planes ── */
  scene.userData.reels = [];
  for (let i = 0; i < 22; i++) {
    const angleBase = (i / 22) * TAU;
    const rw = rand(3.0, 4.8);
    const rh = rand(4.5, 7.0);
    const reel = new THREE.Group();

    // Background
    const bg = new THREE.Mesh(
      new THREE.PlaneGeometry(rw, rh),
      new THREE.MeshStandardMaterial({
        color: [0x1a6e64, 0x0d5c54, 0x1a9e8f, 0x0a3832, 0x156b60, 0x0f4a44][i % 6],
        roughness: 0.5, metalness: 0.3,
        transparent: true, opacity: 0.82,
        side: THREE.DoubleSide,
        emissive: [0x0a3e38, 0x083830, 0x0d6058, 0x060f0e, 0x0b4038, 0x082e2a][i % 6],
        emissiveIntensity: 0.25,
      })
    );
    reel.add(bg);

    // Content lines on reel
    for (let r = 0; r < 4; r++) {
      const lw = rw * rand(0.4, 0.8);
      const line = new THREE.Mesh(
        new THREE.PlaneGeometry(lw, 0.12),
        new THREE.MeshStandardMaterial({
          color: 0xfbf5e9, transparent: true, opacity: rand(0.15, 0.35),
          emissive: 0xfbf5e9, emissiveIntensity: 0.1,
        })
      );
      line.position.set(rand(-rw*0.2, rw*0.2), rh/2 - 0.8 - r * 0.55 + rand(-0.1, 0.1), 0.01);
      reel.add(line);
    }

    reel.userData = {
      angleBase,
      orbitRadius: rand(14, 22),
      orbitDepth:  rand(4, 10),
      speed:       rand(0.12, 0.28) * (Math.random() > 0.5 ? 1 : -1),
      yBase:       rand(-6, 6),
      yAmp:        rand(1.5, 4),
      yFreq:       rand(0.3, 0.7),
      phase:       rand(0, TAU),
    };
    reel.position.set(0, 0, PHONE_Z);
    scene.userData.reels.push(reel);
    scene.add(reel);
  }

  /* ── CONTENT CALENDAR (floating grid at (28, 2, -90)) ── */
  const calGroup = new THREE.Group();
  calGroup.position.set(28, 2, -90);
  calGroup.rotation.y = -0.4;
  const COLS = 7, ROWS = 5;
  const cellW = 2.2, cellH = 1.5, gap = 0.18;
  for (let c = 0; c < COLS; c++) {
    for (let r = 0; r < ROWS; r++) {
      const fill = Math.random() > 0.35;
      const cell = new THREE.Mesh(
        new THREE.PlaneGeometry(cellW, cellH),
        new THREE.MeshStandardMaterial({
          color: fill ? 0x1a6e64 : 0x0a3832,
          emissive: fill ? 0x0f5a52 : 0x060f0e,
          emissiveIntensity: fill ? 0.5 : 0.1,
          transparent: true, opacity: fill ? 0.8 : 0.35,
          side: THREE.DoubleSide,
        })
      );
      cell.position.set(
        (c - COLS/2 + 0.5) * (cellW + gap),
        (r - ROWS/2 + 0.5) * (cellH + gap),
        0
      );
      calGroup.add(cell);
    }
  }
  // Grid outline
  const gridMat = new THREE.LineBasicMaterial({ color: 0x1a9e8f, transparent: true, opacity: 0.2 });
  for (let c = 0; c <= COLS; c++) {
    const pts = [
      new THREE.Vector3((c - COLS/2) * (cellW + gap) - gap/2, -ROWS*(cellH+gap)/2, 0.01),
      new THREE.Vector3((c - COLS/2) * (cellW + gap) - gap/2,  ROWS*(cellH+gap)/2, 0.01),
    ];
    calGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), gridMat));
  }
  scene.add(calGroup);
  scene.userData.calGroup = calGroup;

  /* ── FOOTAGE PLANES — giant translucent surfaces ── */
  const footageData = [
    { pos: [-25, 8, -85],  rot: [0.05, 0.3, 0],    size: [12, 7] },
    { pos: [-30, -5, -115], rot: [-0.1, 0.4, 0.05], size: [14, 8] },
    { pos: [30, -8, -120], rot: [0.1, -0.35, 0],    size: [10, 6] },
    { pos: [24, 12, -80],  rot: [0.15, -0.25, 0.1], size: [9, 5]  },
  ];
  scene.userData.footagePlanes = [];
  footageData.forEach(d => {
    const plane = new THREE.Mesh(
      new THREE.PlaneGeometry(...d.size),
      MAT.footage.clone()
    );
    plane.position.set(...d.pos);
    plane.rotation.set(...d.rot);
    plane.userData.phase = rand(0, TAU);
    scene.userData.footagePlanes.push(plane);
    scene.add(plane);

    // Scan lines on footage
    const lineMat = new THREE.LineBasicMaterial({ color: 0x1a9e8f, transparent: true, opacity: 0.08 });
    for (let l = 0; l < 8; l++) {
      const lpts = [
        new THREE.Vector3(-d.size[0]/2, d.size[1]/2 - l * d.size[1]/7, 0.01),
        new THREE.Vector3( d.size[0]/2, d.size[1]/2 - l * d.size[1]/7, 0.01),
      ];
      plane.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(lpts), lineMat));
    }
  });

  /* ── CONTENT PARTICLE FIELD ── */
  const COUNT = 2500;
  const geo   = new THREE.BufferGeometry();
  const pos   = new Float32Array(COUNT * 3);
  for (let i = 0; i < COUNT; i++) {
    pos[i*3]   = rand(-40, 40);
    pos[i*3+1] = rand(-20, 20);
    pos[i*3+2] = rand(-150, -60);
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  scene.add(new THREE.Points(geo, new THREE.PointsMaterial({
    color: 0x1a9e8f, size: 0.08,
    transparent: true, opacity: 0.3,
    blending: THREE.AdditiveBlending, depthWrite: false,
  })));

})();

/* ═══════════════════════════════════════════
   10. ZONE — WEBSITE ARCHITECTURE (canyon z=-200 to z=-260)
   ═══════════════════════════════════════════ */
(function buildWebsites() {

  // Canyon configuration: slabs on left and right sides
  const slabDefs = [
    // Left side
    { x: -20, y:  0, z: -205, ry:  0.18, w: 8, h: 22, d: 2.5 },
    { x: -22, y: -3, z: -232, ry:  0.12, w: 7, h: 18, d: 2.0 },
    { x: -19, y:  4, z: -258, ry:  0.22, w: 9, h: 20, d: 2.2 },
    // Right side
    { x:  20, y:  0, z: -210, ry: -0.18, w: 8, h: 22, d: 2.5 },
    { x:  22, y:  2, z: -237, ry: -0.14, w: 7, h: 20, d: 2.0 },
    { x:  18, y: -4, z: -262, ry: -0.20, w: 10,h: 18, d: 2.2 },
  ];

  scene.userData.slabs = [];
  slabDefs.forEach((d, idx) => {
    const group = new THREE.Group();

    // Slab body
    const slab = new THREE.Mesh(
      new THREE.BoxGeometry(d.w, d.h, d.d),
      MAT.pageArchitecture.clone()
    );
    group.add(slab);

    // Wireframe overlay
    const wire = new THREE.Mesh(
      new THREE.BoxGeometry(d.w, d.h, d.d),
      MAT.pageWireframe.clone()
    );
    group.add(wire);

    // Browser chrome bar at top
    const chrome = new THREE.Mesh(
      new THREE.BoxGeometry(d.w * 0.98, 0.6, d.d + 0.05),
      new THREE.MeshStandardMaterial({
        color: 0x1a6e64, roughness: 0.2, metalness: 0.7,
        emissive: 0x0f4a42, emissiveIntensity: 0.4,
      })
    );
    chrome.position.y = d.h / 2 - 0.4;
    group.add(chrome);

    // URL bar indicator
    const urlBar = new THREE.Mesh(
      new THREE.BoxGeometry(d.w * 0.55, 0.18, 0.05),
      new THREE.MeshStandardMaterial({ color: 0x0a3832, roughness: 0.8 })
    );
    urlBar.position.set(0, d.h / 2 - 0.4, d.d / 2 + 0.04);
    group.add(urlBar);

    // Content blocks on page face
    const face = d.x < 0 ? d.d / 2 + 0.05 : d.d / 2 + 0.05;
    const blockConfigs = [
      { y: d.h/2 - 2,    w: d.w*0.85, h: 2.8,  col: 0x1a6e64 }, // Hero image
      { y: d.h/2 - 5,    w: d.w*0.7,  h: 0.22, col: 0x9aada7 }, // H1
      { y: d.h/2 - 5.5,  w: d.w*0.55, h: 0.12, col: 0x687b75 }, // body
      { y: d.h/2 - 5.9,  w: d.w*0.5,  h: 0.12, col: 0x687b75 },
      { y: d.h/2 - 7.5,  w: d.w*0.28, h: 0.7,  col: 0x1a9e8f }, // CTA button
    ];
    blockConfigs.forEach(b => {
      const block = new THREE.Mesh(
        new THREE.PlaneGeometry(b.w, b.h),
        new THREE.MeshStandardMaterial({
          color: b.col, transparent: true, opacity: 0.6,
          emissive: b.col, emissiveIntensity: 0.1,
        })
      );
      block.position.set(0, b.y, face);
      group.add(block);
    });

    group.position.set(d.x, d.y - 12, d.z); // Start below (rise effect)
    group.rotation.y = d.ry;
    group.userData = { targetY: d.y, d, idx, phase: idx * 0.8 };
    scene.userData.slabs.push(group);
    scene.add(group);
  });

  // Canyon floor grid
  const floorGeo = new THREE.PlaneGeometry(60, 80, 12, 20);
  const floorMat = new THREE.MeshStandardMaterial({
    color: 0x041a16, roughness: 1, metalness: 0,
    wireframe: false,
    transparent: true, opacity: 0.9,
  });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -PI / 2;
  floor.position.set(0, -12, -232);
  scene.add(floor);

  const floorWire = new THREE.Mesh(
    new THREE.PlaneGeometry(60, 80, 12, 20),
    new THREE.MeshBasicMaterial({ color: 0x1a9e8f, wireframe: true, transparent: true, opacity: 0.04 })
  );
  floorWire.rotation.x = -PI / 2;
  floorWire.position.set(0, -12.05, -232);
  scene.add(floorWire);

  // Atmosphere lights in canyon
  const canyonLight1 = new THREE.PointLight(0x1a9e8f, 1.5, 50);
  canyonLight1.position.set(0, 5, -225);
  scene.add(canyonLight1);
  scene.userData.canyonLight = canyonLight1;

})();

/* ═══════════════════════════════════════════
   11. ZONE — AI CALLING  (center z=-340)
   ═══════════════════════════════════════════ */
(function buildCalling() {

  const Z = -340;

  /* ── CONCENTRIC TORUS RINGS — 14 rings ── */
  scene.userData.callingRings = [];
  const ringRadii = [3.5, 7, 11, 15.5, 20, 25, 30, 36, 42, 48, 54, 60, 66, 72];
  ringRadii.forEach((r, i) => {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(r, 0.10 - i * 0.004, 8, 64 + i * 4),
      new THREE.MeshStandardMaterial({
        color: 0x1a9e8f,
        emissive: 0x1a9e8f,
        emissiveIntensity: Math.max(0.1, 1.2 - i * 0.09),
        roughness: 0.1, metalness: 0.9,
        transparent: true, opacity: Math.max(0.08, 0.9 - i * 0.06),
      })
    );
    ring.position.z = Z;
    ring.rotation.x = PI / 2;
    ring.userData = {
      baseRadius: r,
      phase: i * 0.42,
      speed: 0.008 + i * 0.001,
      tiltX: rand(-0.08, 0.08),
      tiltY: rand(-0.06, 0.06),
    };
    scene.userData.callingRings.push(ring);
    scene.add(ring);
  });

  /* ── VOICE WAVEFORM — tube along sine curve ── */
  const wavePoints = [];
  for (let i = 0; i <= 120; i++) {
    const t = (i / 120) * TAU * 3;
    const r = 2 + Math.sin(t * 0.5) * 1.5;
    wavePoints.push(new THREE.Vector3(
      Math.cos(t) * r,
      Math.sin(t * 1.3) * 1.8,
      Z + Math.sin(t * 0.4) * 3
    ));
  }
  const waveCurve = new THREE.CatmullRomCurve3(wavePoints);
  const waveTube  = new THREE.Mesh(
    new THREE.TubeGeometry(waveCurve, 120, 0.06, 8, false),
    MAT.waveform.clone()
  );
  scene.add(waveTube);
  scene.userData.waveTube = waveTube;

  /* ── LEAD PARTICLES — 4000 streaming toward center ── */
  const LEAD_COUNT = 4000;
  const leadGeo    = new THREE.BufferGeometry();
  const leadPos    = new Float32Array(LEAD_COUNT * 3);
  const leadPhase  = new Float32Array(LEAD_COUNT);
  const leadRadius = new Float32Array(LEAD_COUNT);
  const leadAngle  = new Float32Array(LEAD_COUNT);
  const leadZ      = new Float32Array(LEAD_COUNT);
  const leadSpeed  = new Float32Array(LEAD_COUNT);

  for (let i = 0; i < LEAD_COUNT; i++) {
    leadPhase[i]  = Math.random();
    leadRadius[i] = rand(80, 120);
    leadAngle[i]  = rand(0, TAU);
    leadZ[i]      = rand(-30, 30);
    leadSpeed[i]  = rand(0.003, 0.008);
    // Initial positions set in updateCalling
  }
  leadGeo.setAttribute('position', new THREE.BufferAttribute(leadPos, 3));
  const leadMat = new THREE.PointsMaterial({
    color: 0x1a9e8f, size: 0.18,
    transparent: true, opacity: 0.55,
    blending: THREE.AdditiveBlending, depthWrite: false,
  });
  const leadPoints = new THREE.Points(leadGeo, leadMat);
  scene.add(leadPoints);
  scene.userData.leadPoints = leadPoints;
  scene.userData.leadPhase  = leadPhase;
  scene.userData.leadRadius = leadRadius;
  scene.userData.leadAngle  = leadAngle;
  scene.userData.leadZ      = leadZ;
  scene.userData.leadSpeed  = leadSpeed;
  scene.userData.LEAD_COUNT = LEAD_COUNT;
  scene.userData.CALLING_Z  = Z;

  /* ── CALENDAR ASSEMBLY (right side, (38, 5, -340)) ── */
  const calAssembly = new THREE.Group();
  calAssembly.position.set(38, 5, Z);
  calAssembly.rotation.y = -0.5;

  const CA_COLS = 5, CA_ROWS = 6;
  const cw = 2.8, ch = 2.0, cg = 0.22;
  for (let c = 0; c < CA_COLS; c++) {
    for (let r = 0; r < CA_ROWS; r++) {
      const booked = Math.random() > 0.45;
      const cell   = new THREE.Mesh(
        new THREE.BoxGeometry(cw, ch, 0.12),
        new THREE.MeshStandardMaterial({
          color: booked ? 0x1a9e8f : 0x0a3832,
          emissive: booked ? 0x0f6a60 : 0x040f0e,
          emissiveIntensity: booked ? 0.7 : 0.1,
          transparent: true, opacity: booked ? 0.9 : 0.35,
        })
      );
      cell.position.set(
        (c - CA_COLS/2 + 0.5) * (cw + cg),
        (r - CA_ROWS/2 + 0.5) * (ch + cg),
        0
      );
      cell.userData = { booked, phase: (c + r) * 0.4 };
      calAssembly.add(cell);
    }
  }
  scene.add(calAssembly);
  scene.userData.calAssembly = calAssembly;

  // Core glow sphere
  const core = new THREE.Mesh(
    new THREE.SphereGeometry(1.5, 32, 32),
    MAT.glow.clone()
  );
  core.position.set(0, 0, Z);
  scene.add(core);
  scene.userData.callingCore = core;

})();

/* ═══════════════════════════════════════════
   12. ZONE — AI TEXTING  (center z=-440)
   ═══════════════════════════════════════════ */
(function buildTexting() {

  const Z = -440;

  /* ── MAIN RIVER TUBE ── */
  const riverPts = [
    new THREE.Vector3(-40, 8,  Z - 40),
    new THREE.Vector3(-20, 3,  Z - 20),
    new THREE.Vector3(  0, 0,  Z),
    new THREE.Vector3( 20, -3, Z + 20),
    new THREE.Vector3( 35, -8, Z + 35),
  ];
  const riverCurve = new THREE.CatmullRomCurve3(riverPts);
  const riverTube  = new THREE.Mesh(
    new THREE.TubeGeometry(riverCurve, 80, 0.35, 12, false),
    new THREE.MeshStandardMaterial({
      color: 0x1a9e8f, emissive: 0x1a9e8f, emissiveIntensity: 0.8,
      transparent: true, opacity: 0.7,
      roughness: 0.1, metalness: 0.9,
    })
  );
  scene.add(riverTube);

  /* ── BRANCH TUBES — 8 branches off the river ── */
  scene.userData.branches = [];
  const branchSeeds = [
    { src: [0, 0, Z],      dst: [-15, 12, Z-15],   col: 0x1a9e8f },
    { src: [0, 0, Z],      dst: [18, 10, Z-8],     col: 0x0f6a60 },
    { src: [-10, 4, Z-20], dst: [-28, -5, Z-30],   col: 0x1a9e8f },
    { src: [10, -2, Z+10], dst: [28, 8, Z+18],     col: 0x0d6058 },
    { src: [-5, 1, Z-5],   dst: [-12, 18, Z-12],   col: 0x156b60 },
    { src: [5, -1, Z+5],   dst: [14, -14, Z+10],   col: 0x1a9e8f },
    { src: [15, -3, Z+18], dst: [22, 12, Z+28],    col: 0x0a4a42 },
    { src: [-15, 3, Z-18], dst: [-22, -10, Z-25],  col: 0x1a9e8f },
  ];
  branchSeeds.forEach((b, i) => {
    const midPt = [
      (b.src[0] + b.dst[0]) / 2 + rand(-5, 5),
      (b.src[1] + b.dst[1]) / 2 + rand(-3, 3),
      (b.src[2] + b.dst[2]) / 2,
    ];
    const bCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(...b.src),
      new THREE.Vector3(...midPt),
      new THREE.Vector3(...b.dst),
    ]);
    const bTube = new THREE.Mesh(
      new THREE.TubeGeometry(bCurve, 24, 0.14, 6, false),
      new THREE.MeshStandardMaterial({
        color: b.col, emissive: b.col, emissiveIntensity: 0.6,
        transparent: true, opacity: 0.6,
        roughness: 0.2, metalness: 0.8,
      })
    );
    scene.userData.branches.push({ tube: bTube, curve: bCurve, phase: i * 0.7 });
    scene.add(bTube);
  });

  /* ── CHAT BUBBLES — floating ── */
  const bubbleDefs = [
    { pos: [-8, 3, Z-12],  w: 7.5, side: 'r', col: 0x0d6058 },
    { pos: [ 6, 1, Z-6],   w: 6.2, side: 'l', col: 0x164040 },
    { pos: [-4, 5, Z+2],   w: 8.0, side: 'r', col: 0x0d6058 },
    { pos: [ 8, -2, Z+10], w: 5.5, side: 'l', col: 0x164040 },
    { pos: [-10, 2, Z+18], w: 9.0, side: 'r', col: 0x1a7a70 },
    { pos: [ 6, 4, Z+25],  w: 6.8, side: 'l', col: 0x164040 },
    { pos: [-2, -3, Z+32], w: 7.2, side: 'r', col: 0x0d6058 },
    { pos: [ 10, 1, Z+38], w: 5.0, side: 'l', col: 0x164040 },
  ];
  scene.userData.textBubbles = [];
  bubbleDefs.forEach(b => {
    const bubble = new THREE.Mesh(
      new THREE.BoxGeometry(b.w, 1.1, 0.18),
      new THREE.MeshStandardMaterial({
        color: b.col, emissive: b.col, emissiveIntensity: 0.15,
        roughness: 0.5, metalness: 0.3,
        transparent: true, opacity: 0.85,
      })
    );
    bubble.position.set(...b.pos);
    bubble.userData.baseY  = b.pos[1];
    bubble.userData.phase  = rand(0, TAU);

    // Text lines on bubble
    for (let l = 0; l < 2; l++) {
      const tl = new THREE.Mesh(
        new THREE.PlaneGeometry(b.w * rand(0.4, 0.75), 0.08),
        new THREE.MeshStandardMaterial({ color: 0xfbf5e9, transparent: true, opacity: 0.3 })
      );
      tl.position.set(rand(-b.w*0.1, b.w*0.1), l === 0 ? 0.18 : -0.18, 0.1);
      bubble.add(tl);
    }
    scene.userData.textBubbles.push(bubble);
    scene.add(bubble);
  });

  /* ── FLOWING MESSAGE PARTICLES on branches ── */
  const MSG_COUNT = 5000;
  const msgGeo    = new THREE.BufferGeometry();
  const msgPos    = new Float32Array(MSG_COUNT * 3);
  const msgPhase  = new Float32Array(MSG_COUNT);

  for (let i = 0; i < MSG_COUNT; i++) {
    const branch = branchSeeds[i % branchSeeds.length];
    msgPos[i*3]   = branch.src[0] + rand(-5, 5);
    msgPos[i*3+1] = branch.src[1] + rand(-3, 3);
    msgPos[i*3+2] = branch.src[2] + rand(-5, 5);
    msgPhase[i]   = Math.random();
  }
  msgGeo.setAttribute('position', new THREE.BufferAttribute(msgPos, 3));
  const msgMat = new THREE.PointsMaterial({
    color: 0x20bfad, size: 0.12,
    transparent: true, opacity: 0.45,
    blending: THREE.AdditiveBlending, depthWrite: false,
  });
  scene.add(new THREE.Points(msgGeo, msgMat));
  scene.userData.msgGeo   = msgGeo;
  scene.userData.msgPhase = msgPhase;
  scene.userData.MSG_COUNT = MSG_COUNT;
  scene.userData.branchSeeds = branchSeeds;

})();

/* ═══════════════════════════════════════════
   13. ZONE — ECOSYSTEM (z≈-510)
   ═══════════════════════════════════════════ */
(function buildEcosystem() {

  const Z = -510;

  // Four world nodes
  const nodePositions = [
    [-22, -12, Z - 20], // Content
    [ 22, -12, Z - 20], // Websites
    [-22,  12, Z + 20], // Calling
    [ 22,  12, Z + 20], // Texting
  ];
  scene.userData.ecoNodes = [];
  nodePositions.forEach((pos, i) => {
    const node = new THREE.Group();

    // Core sphere
    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(2.5, 32, 32),
      MAT.nodeSphere.clone()
    );
    node.add(sphere);

    // Orbit ring
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(4, 0.06, 8, 48),
      new THREE.MeshStandardMaterial({
        color: 0x1a9e8f, emissive: 0x1a9e8f, emissiveIntensity: 0.6,
        transparent: true, opacity: 0.5,
      })
    );
    ring.rotation.x = rand(-0.3, 0.3);
    ring.rotation.z = rand(-0.2, 0.2);
    node.add(ring);

    node.position.set(...pos);
    node.userData = { i, phase: i * PI / 2, basePos: pos.slice() };
    scene.userData.ecoNodes.push(node);
    scene.add(node);
  });

  // Connection lines between nodes
  const connMat = new THREE.LineBasicMaterial({
    color: 0x1a9e8f, transparent: true, opacity: 0.2,
    blending: THREE.AdditiveBlending,
  });
  scene.userData.connLines = [];
  const connections = [[0,1],[2,3],[0,2],[1,3],[0,3],[1,2]];
  connections.forEach(([a, b]) => {
    const pts = [
      new THREE.Vector3(...nodePositions[a]),
      new THREE.Vector3(...nodePositions[b]),
    ];
    const line = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(pts),
      connMat.clone()
    );
    scene.userData.connLines.push({ line, a, b });
    scene.add(line);
  });

  // Central ecosystem core
  const ecoCore = new THREE.Mesh(
    new THREE.SphereGeometry(1.2, 32, 32),
    new THREE.MeshStandardMaterial({
      color: 0xfbf5e9, emissive: 0xfbf5e9, emissiveIntensity: 1.5,
      roughness: 0, metalness: 1,
    })
  );
  ecoCore.position.set(0, 0, Z);
  scene.add(ecoCore);
  scene.userData.ecoCore = ecoCore;

  // Eco particle field
  const ECO_COUNT = 3000;
  const ecoGeo    = new THREE.BufferGeometry();
  const ecoPos    = new Float32Array(ECO_COUNT * 3);
  for (let i = 0; i < ECO_COUNT; i++) {
    ecoPos[i*3]   = rand(-50, 50);
    ecoPos[i*3+1] = rand(-30, 30);
    ecoPos[i*3+2] = Z + rand(-40, 40);
  }
  ecoGeo.setAttribute('position', new THREE.BufferAttribute(ecoPos, 3));
  scene.add(new THREE.Points(ecoGeo, new THREE.PointsMaterial({
    color: 0x1a9e8f, size: 0.1,
    transparent: true, opacity: 0.25,
    blending: THREE.AdditiveBlending, depthWrite: false,
  })));

})();

/* ═══════════════════════════════════════════
   14. OVERLAY TEXT SYSTEM
   Zone ranges: progress values where text is visible
   ═══════════════════════════════════════════ */
const ZONES = [
  { id: 'zt-hero',      from: 0.00, peak: 0.05, to: 0.11  },
  { id: 'zt-content',   from: 0.19, peak: 0.25, to: 0.34  },
  { id: 'zt-websites',  from: 0.38, peak: 0.44, to: 0.52  },
  { id: 'zt-calling',   from: 0.54, peak: 0.60, to: 0.68  },
  { id: 'zt-texting',   from: 0.70, peak: 0.76, to: 0.83  },
  { id: 'zt-ecosystem', from: 0.86, peak: 0.89, to: 0.93  },
  { id: 'zt-cta',       from: 0.94, peak: 0.97, to: 1.00  },
];

const NAV_CONTEXTS = [
  { from: 0.00, to: 0.15, text: '' },
  { from: 0.15, to: 0.35, text: 'Content Engine' },
  { from: 0.35, to: 0.53, text: 'Website Experiences' },
  { from: 0.53, to: 0.68, text: 'AI Calling Agents' },
  { from: 0.68, to: 0.85, text: 'AI Texting Agents' },
  { from: 0.85, to: 1.00, text: 'The Ecosystem' },
];

const zoneEls = {};
ZONES.forEach(z => { zoneEls[z.id] = document.getElementById(z.id); });

function updateOverlay(t) {
  ZONES.forEach(z => {
    const el = zoneEls[z.id];
    if (!el) return;
    let alpha = 0;
    if (t >= z.from && t <= z.to) {
      if (t <= z.peak) alpha = (t - z.from) / (z.peak - z.from);
      else             alpha = (z.to - t)   / (z.to - z.peak);
      alpha = Math.pow(clamp(alpha, 0, 1), 0.7);
    }
    el.style.opacity = alpha;
  });

  // Nav context
  const ctx = document.getElementById('nav-context');
  if (ctx) {
    const zone = NAV_CONTEXTS.find(n => t >= n.from && t < n.to);
    ctx.textContent = zone ? zone.text : '';
  }

  // Nav visibility
  const nav = document.getElementById('nav');
  if (nav) {
    nav.classList.toggle('visible', t > 0.08);
    nav.classList.toggle('bg', t > 0.12);
  }

  // Progress bar
  const fill = document.getElementById('progress-fill');
  if (fill) fill.style.height = `${t * 100}%`;
}

/* ═══════════════════════════════════════════
   15. BACKGROUND COLOUR TRANSITION
   Beige (hero) → deep void (worlds)
   ═══════════════════════════════════════════ */
const BG_START = new THREE.Color(0x0a1e1a); // slightly warm dark
const BG_END   = new THREE.Color(0x040e0c); // very dark void

function updateBackground(t) {
  const pct = clamp(t / 0.15, 0, 1); // Transition over first 15% of scroll
  const bg  = new THREE.Color().lerpColors(BG_START, BG_END, pct);
  renderer.setClearColor(bg, 1);
  scene.fog.color.copy(bg);
}

/* ═══════════════════════════════════════════
   16. CURSOR
   ═══════════════════════════════════════════ */
const curDot  = document.getElementById('cur-dot');
const curRing = document.getElementById('cur-ring');
let cx = 0, cy = 0, rx = 0, ry = 0;

window.addEventListener('mousemove', e => { cx = e.clientX; cy = e.clientY; });

document.querySelectorAll('a, button, .zt-cta-btn, .nav-cta').forEach(el => {
  el.addEventListener('mouseenter', () => document.body.classList.add('hov'));
  el.addEventListener('mouseleave', () => document.body.classList.remove('hov'));
});

function updateCursor() {
  rx = lerp(rx, cx, 0.1);
  ry = lerp(ry, cy, 0.1);
  curDot.style.left  = cx + 'px';
  curDot.style.top   = cy + 'px';
  curRing.style.left = rx + 'px';
  curRing.style.top  = ry + 'px';
}

/* ═══════════════════════════════════════════
   17. ANIMATION UPDATERS PER ZONE
   ═══════════════════════════════════════════ */
function updateContent(t, time) {
  // Reels orbit phone
  if (scene.userData.reels) {
    scene.userData.reels.forEach(reel => {
      const d = reel.userData;
      const a = d.angleBase + time * d.speed;
      reel.position.x = Math.cos(a) * d.orbitRadius;
      reel.position.z = -100 + Math.sin(a) * d.orbitDepth;
      reel.position.y = d.yBase + Math.sin(time * d.yFreq + d.phase) * d.yAmp;
      reel.rotation.y = -a + PI * 0.5;
      reel.rotation.z = Math.sin(time * 0.15 + d.phase) * 0.06;
    });
  }

  // Calendar float
  if (scene.userData.calGroup) {
    scene.userData.calGroup.position.y = 2 + Math.sin(time * 0.3) * 0.8;
    scene.userData.calGroup.rotation.y = -0.4 + Math.sin(time * 0.18) * 0.06;
  }

  // Footage planes drift
  if (scene.userData.footagePlanes) {
    scene.userData.footagePlanes.forEach(p => {
      p.position.y += Math.sin(time * 0.2 + p.userData.phase) * 0.003;
    });
  }
}

function updateWebsites(t, time) {
  // Rise slabs based on scroll proximity
  if (scene.userData.slabs) {
    scene.userData.slabs.forEach(g => {
      const inZone = t > 0.32 && t < 0.52;
      const targetY = inZone ? g.userData.targetY : g.userData.targetY - 14;
      g.position.y = lerp(g.position.y, targetY, 0.04);
      g.position.y += Math.sin(time * 0.2 + g.userData.phase) * 0.04;
    });
  }

  // Canyon light pulse
  if (scene.userData.canyonLight) {
    scene.userData.canyonLight.intensity = 1.2 + Math.sin(time * 1.5) * 0.4;
  }
}

function updateCalling(t, time) {
  // Ring pulse
  if (scene.userData.callingRings) {
    scene.userData.callingRings.forEach((ring, i) => {
      const pulse = 1 + Math.sin(time * 0.9 - ring.userData.phase) * 0.04;
      ring.scale.setScalar(pulse);
      ring.rotation.z = Math.sin(time * 0.12 + ring.userData.phase) * 0.06;
      ring.rotation.y = Math.cos(time * 0.08 + ring.userData.phase) * 0.04;
      ring.material.opacity = Math.max(0.06, (0.9 - i * 0.06) * (0.6 + 0.4 * Math.sin(time * 0.8 - ring.userData.phase)));
    });
  }

  // Lead particles stream toward center
  if (scene.userData.leadPoints) {
    const pos   = scene.userData.leadPoints.geometry.attributes.position.array;
    const phase = scene.userData.leadPhase;
    const radii = scene.userData.leadRadius;
    const angle = scene.userData.leadAngle;
    const zoff  = scene.userData.leadZ;
    const speed = scene.userData.leadSpeed;
    const N     = scene.userData.LEAD_COUNT;
    const Z     = scene.userData.CALLING_Z;

    for (let i = 0; i < N; i++) {
      phase[i] += speed[i];
      if (phase[i] > 1) phase[i] -= 1;
      const p = phase[i];
      const r = radii[i] * (1 - p);
      pos[i*3]   = Math.cos(angle[i]) * r;
      pos[i*3+1] = zoff[i] * (1 - p * 0.6) * Math.sin(p * PI);
      pos[i*3+2] = Z + Math.sin(angle[i]) * r * 0.4;
    }
    scene.userData.leadPoints.geometry.attributes.position.needsUpdate = true;
  }

  // Core glow
  if (scene.userData.callingCore) {
    const s = 1 + Math.sin(time * 2.2) * 0.15;
    scene.userData.callingCore.scale.setScalar(s);
    scene.userData.callingCore.material.emissiveIntensity = 1.8 + Math.sin(time * 1.8) * 0.5;
  }

  // Calendar cell flicker
  if (scene.userData.calAssembly) {
    scene.userData.calAssembly.children.forEach(cell => {
      if (cell.userData.booked) {
        cell.material.emissiveIntensity = 0.5 + Math.sin(time * 1.2 + cell.userData.phase) * 0.25;
      }
    });
    scene.userData.calAssembly.rotation.y = -0.5 + Math.sin(time * 0.15) * 0.04;
  }
}

function updateTexting(t, time) {
  // Text bubbles float
  if (scene.userData.textBubbles) {
    scene.userData.textBubbles.forEach(b => {
      b.position.y = b.userData.baseY + Math.sin(time * 0.4 + b.userData.phase) * 0.35;
      b.rotation.z = Math.sin(time * 0.18 + b.userData.phase) * 0.025;
    });
  }

  // Branch glow pulse
  if (scene.userData.branches) {
    scene.userData.branches.forEach((b, i) => {
      b.tube.material.emissiveIntensity = 0.4 + Math.sin(time * 1.1 + b.phase) * 0.3;
    });
  }

  // Message particle flow along branches
  if (scene.userData.msgGeo) {
    const pos    = scene.userData.msgGeo.attributes.position.array;
    const phase  = scene.userData.msgPhase;
    const seeds  = scene.userData.branchSeeds;
    const N      = scene.userData.MSG_COUNT;

    for (let i = 0; i < N; i++) {
      phase[i] += 0.004;
      if (phase[i] > 1) phase[i] -= 1;
      const b = seeds[i % seeds.length];
      const p = phase[i];
      const mid = [
        (b.src[0] + b.dst[0]) / 2 + Math.sin(time + i) * 2,
        (b.src[1] + b.dst[1]) / 2 + Math.cos(time + i) * 2,
        (b.src[2] + b.dst[2]) / 2,
      ];
      // Quadratic bezier
      const q = 1 - p;
      pos[i*3]   = q*q*b.src[0] + 2*q*p*mid[0] + p*p*b.dst[0] + rand(-0.3, 0.3);
      pos[i*3+1] = q*q*b.src[1] + 2*q*p*mid[1] + p*p*b.dst[1] + rand(-0.2, 0.2);
      pos[i*3+2] = q*q*b.src[2] + 2*q*p*mid[2] + p*p*b.dst[2];
    }
    scene.userData.msgGeo.attributes.position.needsUpdate = true;
  }
}

function updateEcosystem(t, time) {
  if (scene.userData.ecoNodes) {
    scene.userData.ecoNodes.forEach(node => {
      // Gentle orbit
      const bp = node.userData.basePos;
      node.position.x = bp[0] + Math.sin(time * 0.2 + node.userData.phase) * 2;
      node.position.y = bp[1] + Math.cos(time * 0.25 + node.userData.phase) * 1.5;
      node.children[0].rotation.y = time * 0.3 + node.userData.phase;
      node.children[1].rotation.z = time * 0.2;
    });

    // Update connection line endpoints
    if (scene.userData.connLines) {
      const nodes = scene.userData.ecoNodes;
      scene.userData.connLines.forEach(({ line, a, b }) => {
        const pts = [nodes[a].position.clone(), nodes[b].position.clone()];
        line.geometry.setFromPoints(pts);
        const ecoT = clamp((t - 0.86) / 0.08, 0, 1);
        line.material.opacity = ecoT * 0.2;
      });
    }
  }

  if (scene.userData.ecoCore) {
    scene.userData.ecoCore.scale.setScalar(1 + Math.sin(time * 2) * 0.12);
    scene.userData.ecoCore.material.emissiveIntensity = 1.5 + Math.sin(time * 1.8) * 0.5;
  }
}

/* ═══════════════════════════════════════════
   18. MAIN ANIMATION LOOP
   ═══════════════════════════════════════════ */
let time = 0;
const camTarget  = new THREE.Vector3();
const lookTarget = new THREE.Vector3();

function animate() {
  requestAnimationFrame(animate);
  time += 0.01;

  /* -- Smooth scroll -- */
  scrollProgress = lerp(scrollProgress, scrollRaw, 0.06);
  const t = clamp(scrollProgress, 0, 1);

  /* -- Mouse smooth -- */
  mouse.sx = lerp(mouse.sx, mouse.x, 0.04);
  mouse.sy = lerp(mouse.sy, mouse.y, 0.04);

  /* -- Camera along spline -- */
  const camPoint  = CAM_PATH.getPoint(t);
  const lookPoint = LOOK_PATH.getPoint(t);

  // Mouse parallax offset (perpendicular to travel)
  const parallaxX = mouse.sx * 2.5;
  const parallaxY = mouse.sy * 1.2;

  camTarget.set(
    camPoint.x + parallaxX,
    camPoint.y + parallaxY,
    camPoint.z
  );

  camera.position.lerp(camTarget, 0.08);
  lookTarget.set(lookPoint.x + parallaxX * 0.3, lookPoint.y, lookPoint.z);
  camera.lookAt(lookTarget);

  /* -- Zone updates -- */
  updateContent(t, time);
  updateWebsites(t, time);
  updateCalling(t, time);
  updateTexting(t, time);
  updateEcosystem(t, time);

  /* -- Void particles drift -- */
  scene.userData.heroRing && (scene.userData.heroRing.rotation.z = time * 0.03);

  /* -- Background -- */
  updateBackground(t);

  /* -- Overlay -- */
  updateOverlay(t);

  /* -- Cursor -- */
  updateCursor();

  renderer.render(scene, camera);
}

/* ═══════════════════════════════════════════
   19. START
   ═══════════════════════════════════════════ */
document.getElementById('scroll-driver').style.height = '900vh';
animate();
