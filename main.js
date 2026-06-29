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
 *   Texting  z=-326 → z=-366
 *   Ecosystem z=-400 → z=-470
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

function alignCylinder(cylinder, pointA, pointB) {
  const direction = new THREE.Vector3().subVectors(pointB, pointA);
  const length = direction.length();
  const dirNorm = direction.clone().normalize();
  cylinder.scale.set(1, length, 1);
  const midpoint = new THREE.Vector3().addVectors(pointA, pointB).multiplyScalar(0.5);
  cylinder.position.copy(midpoint);
  const alignAxis = new THREE.Vector3(0, 1, 0);
  const quaternion = new THREE.Quaternion().setFromUnitVectors(alignAxis, dirNorm);
  cylinder.quaternion.copy(quaternion);
}

/* ═══════════════════════════════════════════
   COLOR PALETTE (Tech-Luxury)
   ═══════════════════════════════════════════ */
const PALETTE = {
  bg: 0x050608,         // Void Black
  text: 0xF7F3EB,       // Primary Text
  champagne: 0xC7A66B,  // Champagne Gold
  forest: 0x0A0C10,  // graphite alias (no green)
  steel: 0xB5BDC6,      // Titanium Silver
  gold: 0xC7A66B,       // Gold (alias champagne)
  teal: 0x67A9FF   // Electric Blue
};

let time = 0;
const pageStartTime = Date.now();



// Calling zone variables
let callingZoneTime = 0;
let lastCallingTimeUpdate = 0;
let callingAutoplayTime = 0;

// Texting zone reveal variables
let textingRevealTime = 0;
let lastTextingTimeUpdate = 0;
let textingPhoneSettled = false; // LOCK: no internal UI animation until phone reaches final position
let textingAutoplayTime = 0;

// Ecosystem zone time variables
let ecoTime = 0;

// Section-based storyflow variables
let currentSectionIdx = 0;
let targetSectionIdx = 0;
let sectionTransitionProgress = 1.0; // 1.0 means transition is complete
let transitionDuration = 4.2; // 4.2s cinematic snap transition duration
let transitionTimeElapsed = 0;
let startScrollProgress = 0;
let targetScrollProgress = 0;
let lastGestureTime = 0;
const GESTURE_COOLDOWN = 1400; // cooldown in ms
let lastAnimateTime = performance.now() / 1000.0;

const SECTIONS = [
  { name: 'Kllezo Hero',          vp: 0.0 },
  { name: 'Content Creation',     vp: 0.7 },
  { name: 'Website Experiences',  vp: 2.0 },
  { name: 'AI Calling Agents',    vp: 5.0 },
  { name: 'AI Texting Agents',    vp: 9.0 },
  { name: 'Kllezo Ecosystem',     vp: 13.0 }
];

function isSectionLocked(idx) {
  if (idx === 3) { // AI Calling Agents
    return callingAutoplayTime < 2.8;
  }
  if (idx === 4) { // AI Texting Agents
    return textingAutoplayTime < 12.0;
  }
  return false;
}

function triggerSectionTransition(nextIdx) {
  if (nextIdx < 0 || nextIdx >= SECTIONS.length) return;

  // Initialize Website Experiences progress depending on direction
  if (nextIdx === 2) {
    if (currentSectionIdx < 2) {
      websiteScrollTick = 0;
      websiteScrollProgress = 0.0;
    } else if (currentSectionIdx > 2) {
      websiteScrollTick = WEBSITE_SCROLL_STEPS;
      websiteScrollProgress = 1.0;
    }
  }

  window.manualServiceState = null; // Reset tab override on scroll transition!
  targetSectionIdx = nextIdx;
  startScrollProgress = scrollProgress;
  targetScrollProgress = SECTIONS[nextIdx].vp / 13.0;
  scrollRaw = targetScrollProgress;
  sectionTransitionProgress = 0.0;
  transitionTimeElapsed = 0;
}

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
renderer.setClearColor(PALETTE.bg, 1);
renderer.toneMapping        = THREE.LinearToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.localClippingEnabled = true;

const scene  = new THREE.Scene();
scene.fog    = new THREE.FogExp2(PALETTE.bg, 0.0015);

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
   CANVAS 2D GRAPHICS HELPERS
   ═══════════════════════════════════════════ */
function drawRoundRect(ctx, x, y, w, h, r, fill, stroke) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}

function drawText(ctx, txt, x, y, font, color, align = 'left') {
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(txt, x, y);
}

function drawLine(ctx, x1, y1, x2, y2, color, width = 1) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
}

/* ═══════════════════════════════════════════
   DYNAMIC CANVAS TEXTURE MANAGER
   ═══════════════════════════════════════════ */
const dynamicTextures = [];
function createDynamicTexture(width, height, drawFn) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  
  const entry = { canvas, ctx, width, height, drawFn, texture };
  dynamicTextures.push(entry);
  
  try {
    drawFn(ctx, width, height);
    texture.needsUpdate = true;
  } catch(e) {
    console.error("Error in initial canvas draw:", e);
  }
  
  return texture;
}

function redrawDynamicTextures() {
  dynamicTextures.forEach(item => {
    try {
      item.drawFn(item.ctx, item.width, item.height);
      item.texture.needsUpdate = true;
    } catch(e) {
      console.error("Error in canvas redraw:", e);
    }
  });
  if (typeof scene !== 'undefined' && scene.userData && scene.userData.updateOrbTextures) {
    try {
      scene.userData.updateOrbTextures();
    } catch(e) {
      console.error("Error in ecosystem orb update:", e);
    }
  }
}

let _texTickFrame = 0;
function tickDynamicTextures() {
  _texTickFrame++;
  dynamicTextures.forEach(item => {
    if (item.texture.userData && item.texture.userData.isDynamic) {
      // High-priority textures (chat) redraw every frame
      // Others skip every 2nd frame for performance
      if (_texTickFrame % 2 === 0 || item.texture.userData.highPriority) {
        try {
          item.drawFn(item.ctx, item.width, item.height);
          item.texture.needsUpdate = true;
        } catch(e) {
          console.error("Error in dynamic canvas tick:", e);
        }
      }
    }
  });
}

/* ═══════════════════════════════════════════
   IMAGE PRE-LOADING LOGIC
   ═══════════════════════════════════════════ */
const IMAGES = {
  niche1: new Image(),
  niche2: new Image(),
  niche3: new Image(),
  niche4: new Image(),
  niche5: new Image(),
  niche6: new Image(),
  whatsapp: new Image(),
  instagram: new Image(),
  websiteUi: new Image(),
  textingAgents: new Image(),
  goldenOrb: new Image(),
  goldRing: new Image(),
  f1: new Image(),
  f2: new Image(),
  f4: new Image(),
  callingAgent1: new Image(),
  callingAgent2: new Image(),
  callingAgent3: new Image(),
  callingOrb: new Image()
};
IMAGES.niche1.src = 'assets/niche 1.png';
IMAGES.niche2.src = 'assets/niche 2.png';
IMAGES.niche3.src = 'assets/niche 3.png';
IMAGES.niche4.src = 'assets/niche 4.png';
IMAGES.niche5.src = 'assets/niche 5.png';
IMAGES.niche6.src = 'assets/niche 6.png';
IMAGES.whatsapp.src = 'assets/whatsapp.png';
IMAGES.instagram.src = 'assets/instagram.png';
IMAGES.websiteUi.src = 'assets/kllezo bot.png';
IMAGES.textingAgents.src = 'assets/whatsapp.png'; // Fallback alias
IMAGES.goldenOrb.src = 'assets/golden-orb.png';
IMAGES.goldRing.src = 'assets/gold-ring.png';
IMAGES.f1.src = 'assets/content creation  orb.png';
IMAGES.f2.src = 'assets/websites orb.png';
IMAGES.f4.src = 'assets/texting orb.png';
IMAGES.callingOrb.src = 'assets/calling orb.png';
IMAGES.callingAgent1.src = 'assets/calling-agent-1.png';
IMAGES.callingAgent2.src = 'assets/calling-agent-2.png';
IMAGES.callingAgent3.src = 'assets/calling-agent-3.png';

// Fallback aliases for other canvases (reels, mobile feeds) to prevent crashes
Object.defineProperty(IMAGES, 'villa', { get: () => IMAGES.niche1 });
Object.defineProperty(IMAGES, 'dish', { get: () => IMAGES.niche2 });
Object.defineProperty(IMAGES, 'fitness', { get: () => IMAGES.niche3 });
Object.defineProperty(IMAGES, 'portrait', { get: () => IMAGES.niche6 });

// Register generic onload for all images
Object.keys(IMAGES).forEach(key => {
  const img = IMAGES[key];
  img.onload = () => {
    console.log(`[KLLEZO] Asset loaded: ${key}`);
    redrawDynamicTextures();
  };
  if (img.complete && img.naturalWidth !== 0) {
    redrawDynamicTextures();
  }
});

/* ═══════════════════════════════════════════
   WEBSITE DRAWING LOGIC (Slabs 0 - 5)
   ═══════════════════════════════════════════ */
function drawWebsiteCanvas(idx, ctx, w, h) {
  // Clear background
  ctx.fillStyle = '#050608'; // Pure Void Black
  ctx.fillRect(0, 0, w, h);
  
  const img = IMAGES['niche' + (idx + 1)];
  if (!img || !img.complete || img.naturalWidth === 0) {
    // Elegant fallback during loading
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#0f1218');
    g.addColorStop(1, '#050608');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    
    drawText(ctx, 'L O A D I N G  E X P E R I E N C E...', w/2, h/2, '300 24px "Inter", sans-serif', '#C7A66B', 'center');
    return;
  }

  // Get scroll progress of this slab to drive page parallax
  const slab = (typeof scene !== 'undefined' && scene.userData && scene.userData.slabs) ? scene.userData.slabs[idx] : null;
  const scrollPct = slab ? (slab.userData.scrollPct || 0) : (0.5 + Math.sin(time * 0.2) * 0.5);

  // Scaled dimensions of the image to fill the canvas width (w)
  const imgScaledH = img.naturalHeight * (w / img.naturalWidth);
  const maxScrollY = imgScaledH - h;
  const currentScrollY = scrollPct * maxScrollY;

  // Draw base website image (1:1 scroll, no duplicate drawing or dims)
  ctx.save();
  ctx.drawImage(img, 0, currentScrollY * (img.naturalWidth / w), img.naturalWidth, h * (img.naturalWidth / w), 0, 0, w, h);
  ctx.restore();

  // Common UI styling variables
  const drift1 = (scrollPct - 0.5) * -70 + Math.sin(time * 0.8 + idx) * 10;
  const drift2 = (scrollPct - 0.5) * -110 + Math.cos(time * 0.6 + idx) * 12;

  // Render index-specific floating overlays (no duplicate screenshots/cards)
  if (idx === 0) {
    // Glowing location coordinates/target pin on map
    const targetY = 480 - currentScrollY + drift1 + 130;
    ctx.save();
    ctx.strokeStyle = '#C7A66B';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(320, targetY, 12 + Math.abs(Math.sin(time * 4)) * 6, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#C7A66B';
    ctx.beginPath();
    ctx.arc(320, targetY, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  else if (idx === 1) {
    // Falling gold flakes / dining sparkle particles
    ctx.fillStyle = 'rgba(199, 166, 107, 0.6)';
    for (let i = 0; i < 8; i++) {
      const px = (w * 0.15) + (i * w * 0.1) + Math.sin(time * 0.5 + i) * 20;
      const py = ((time * 30 + i * 200) % h);
      ctx.beginPath();
      ctx.arc(px, py, 2.5 + Math.abs(Math.sin(time + i)) * 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  else if (idx === 2) {
    // Pulsing heart-rate cart graph overlay
    const hrY = 480 - currentScrollY + drift1 + 140;
    ctx.save();
    ctx.strokeStyle = '#E11D48';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(180, hrY);
    for (let xVal = 180; xVal < 360; xVal += 6) {
      const localPhase = (xVal - 180) * 0.1 - time * 6.0;
      const spike = (xVal % 60 === 0) ? -24 : (xVal % 60 === 10) ? 18 : 0;
      ctx.lineTo(xVal, hrY + spike + Math.sin(localPhase) * 3);
    }
    ctx.stroke();
    ctx.restore();
  }
  else if (idx === 3) {
    // Pulsing orange configurator hotspots over the car profile
    const hotX = w * 0.45 + Math.sin(time) * 15;
    const hotY = 480 - currentScrollY + drift1 - 90;
    ctx.save();
    ctx.strokeStyle = '#F97316';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(hotX, hotY, 10 + Math.abs(Math.sin(time * 2.5)) * 14, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#F97316';
    ctx.beginPath();
    ctx.arc(hotX, hotY, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  else if (idx === 4) {
    const card2Y = 1100;
    const card2H = 400;
    const yOffset2 = card2Y - currentScrollY + drift2;

    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 30;
    ctx.shadowOffsetY = 15;
    drawRoundRect(ctx, 100, yOffset2, w - 200, card2H, 20, 'rgba(15, 23, 42, 0.45)', 'rgba(6, 182, 212, 0.25)');
    ctx.restore();

    ctx.save();
    drawRoundRect(ctx, 100 + 2, yOffset2 + 2, w - 204, card2H - 4, 18);
    ctx.clip();
    ctx.drawImage(img, 0, card2Y * (img.naturalWidth / w), img.naturalWidth, card2H * (img.naturalWidth / w), 100, yOffset2, w - 200, card2H);
    ctx.restore();

    // Cyan network pings tracing pathways
    ctx.fillStyle = '#06B6D4';
    for (let i = 0; i < 3; i++) {
      const progress = (time * 0.35 + i * 0.33) % 1.0;
      const px = 180 + progress * 664;
      const py = yOffset2 + 185;
      ctx.beginPath();
      ctx.arc(px, py, 4.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  else if (idx === 5) {
    // 6. Luxury Aesthetic Clinic (niche 6) - Dark luxury Awwwards-style scrollable website
    const virtualH = 5200; // Real long parallax website height
    const maxScrollY = virtualH - h;
    const currentScrollY = scrollPct * maxScrollY;

    // Draw Hero banner (img scaled to fit width w = 2048)
    const heroH = 1500;
    ctx.save();
    // Parallax background image sweep
    const bgDriftY = currentScrollY * 0.12; // slow parallax shift
    ctx.drawImage(img, 0, bgDriftY, img.naturalWidth, img.naturalHeight * 0.75, 0, -currentScrollY, w, heroH);

    // Deep black-charcoal linear gradient overlay over hero image to blend it in
    const heroGrad = ctx.createLinearGradient(0, heroH - 500 - currentScrollY, 0, heroH - currentScrollY);
    heroGrad.addColorStop(0, 'rgba(5, 6, 8, 0)');
    heroGrad.addColorStop(0.6, 'rgba(5, 6, 8, 0.85)');
    heroGrad.addColorStop(1, '#050608');
    ctx.fillStyle = heroGrad;
    ctx.fillRect(0, -currentScrollY, w, heroH);
    ctx.restore();

    // Hero content overlay (drifts faster for parallax)
    const heroContentY = 320 - currentScrollY + drift1 * 1.5;
    drawText(ctx, 'E L E V A T E   C L I N I C', w/2, heroContentY, 'bold 16px "Inter", sans-serif', '#C7A66B', 'center');
    drawText(ctx, 'Natural Beauty.', w/2, heroContentY + 90, '300 72px "Cormorant Garamond", serif', '#F7F3EB', 'center');
    drawText(ctx, 'Elevated Confidence.', w/2, heroContentY + 180, 'italic 300 72px "Cormorant Garamond", serif', '#C7A66B', 'center');
    drawText(ctx, 'EXQUISITE COSMETIC SANCTUARY  ·  BEVERLY HILLS · DUBAI · MONACO', w/2, heroContentY + 260, '14px "Inter", sans-serif', '#8A94A0', 'center');

    // Hero CTA buttons
    const btnY = heroContentY + 340;
    // Book Consultation (Solid bronze gold)
    ctx.save();
    ctx.shadowColor = 'rgba(199, 166, 107, 0.35)';
    ctx.shadowBlur = 20;
    drawRoundRect(ctx, w/2 - 250, btnY, 230, 56, 28, '#C7A66B');
    drawText(ctx, 'BOOK CONSULTATION', w/2 - 135, btnY + 28, 'bold 11px "Inter", sans-serif', '#050608', 'center');
    ctx.restore();

    // View Treatments (Outline)
    drawRoundRect(ctx, w/2 + 20, btnY, 230, 56, 28, 'rgba(255,255,255,0.02)', 'rgba(255, 255, 255, 0.25)');
    drawText(ctx, 'VIEW TREATMENTS ➔', w/2 + 135, btnY + 28, 'bold 11px "Inter", sans-serif', '#F7F3EB', 'center');

    // Section 2: Treatments Grid (y = 1200 to 2300)
    const sec2Y = 1200 - currentScrollY;
    ctx.fillStyle = '#050608';
    ctx.fillRect(0, sec2Y, w, 1100);

    drawText(ctx, 'SIGNATURE CLINICAL TREATMENTS', w/2, sec2Y + 100, 'bold 12px "Inter", sans-serif', '#C7A66B', 'center');
    drawText(ctx, 'Cosmetic Artistry Meets Epigenetics', w/2, sec2Y + 160, '300 36px "Cormorant Garamond", serif', '#F7F3EB', 'center');
    drawLine(ctx, w/2 - 80, sec2Y + 200, w/2 + 80, sec2Y + 200, 'rgba(199, 166, 107, 0.3)', 2);

    // 4 Luxury Treatment Cards (floating slightly with drift1 and drift2)
    const services = [
      { t: "Skin Rejuvenation", p: "From $450", d: "Customized laser therapy, cellular hydration, and deep tissue regeneration." },
      { t: "Injectable Aesthetics", p: "From $850", d: "Targeted wrinkle relaxation, dermal fillers, and subtle volume enhancement." },
      { t: "Facial Sculpting", p: "From $1,200", d: "Non-surgical jawline contouring and structural cheek definition." },
      { t: "Wellness Infusions", p: "From $350", d: "Intravenous cellular nutrition, metabolic activation, and anti-aging compounds." }
    ];

    services.forEach((s, i) => {
      const isLeft = i % 2 === 0;
      const cardX = isLeft ? 150 : w/2 + 50;
      const cardValY = sec2Y + 250 + Math.floor(i / 2) * 360 + (isLeft ? drift1 * 0.4 : drift2 * 0.4);
      const cardW = w/2 - 200;
      const cardH = 300;

      // Dark card body
      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
      ctx.shadowBlur = 25;
      drawRoundRect(ctx, cardX, cardValY, cardW, cardH, 16, '#0f1115', 'rgba(199, 166, 107, 0.15)');
      ctx.restore();

      // Card Content
      drawText(ctx, `0${i + 1}  /  THERAPY`, cardX + 40, cardValY + 50, 'bold 10px "Inter", sans-serif', '#C7A66B');
      drawText(ctx, s.t, cardX + 40, cardValY + 100, '300 28px "Cormorant Garamond", serif', '#F7F3EB');
      drawText(ctx, s.p, cardX + cardW - 40, cardValY + 50, 'bold 11px "Inter", sans-serif', '#C7A66B', 'right');
      
      // Multi-line description text wrapping
      const words = s.d.split(' ');
      let line = '';
      let lineY = cardValY + 160;
      words.forEach(word => {
        const testLine = line + word + ' ';
        const metrics = ctx.measureText(testLine);
        if (metrics.width > cardW - 80) {
          drawText(ctx, line, cardX + 40, lineY, '14px "Inter", sans-serif', '#8A94A0');
          line = word + ' ';
          lineY += 24;
        } else {
          line = testLine;
        }
      });
      drawText(ctx, line, cardX + 40, lineY, '14px "Inter", sans-serif', '#8A94A0');

      // Learn more CTA link
      drawText(ctx, 'EXPLORE TREATMENT ➔', cardX + 40, cardValY + cardH - 45, 'bold 9px "Inter", sans-serif', '#C7A66B');
    });

    // Section 3: About Sanctuary (y = 2300 to 3000)
    const sec3Y = 2300 - currentScrollY;
    ctx.fillStyle = '#0f1115'; // Warm dark charcoal
    ctx.fillRect(0, sec3Y, w, 700);

    drawText(ctx, 'THE SANCTUARY PHILOSOPHY', w/2, sec3Y + 120, 'bold 11px "Inter", sans-serif', '#C7A66B', 'center');
    drawText(ctx, '“Cosmetic science is the pursuit of personal symmetry.”', w/2, sec3Y + 220, 'italic 300 38px "Cormorant Garamond", serif', '#F7F3EB', 'center');
    
    // Detailed about paragraphs
    ctx.font = '300 16px "Inter", sans-serif';
    ctx.fillStyle = '#8A94A0';
    ctx.textAlign = 'center';
    ctx.fillText('Elevate Sanctuary was established with a singular vision: to unify medical precision with elite artistic aesthetics.', w/2, sec3Y + 310);
    ctx.fillText('Operating private clinics in Beverly Hills, Dubai, Monaco, and Singapore, we formulate customized protocols', w/2, sec3Y + 345);
    ctx.fillText('based on real-time epigenetic biomarker mapping and advanced cellular density diagnostics.', w/2, sec3Y + 380);

    // Dynamic bronze crosshair scanning animation
    ctx.strokeStyle = 'rgba(199, 166, 107, 0.25)';
    ctx.lineWidth = 1.5;
    const centerScanY = sec3Y + 480 + Math.sin(time * 2.0) * 40;
    drawLine(ctx, w/2 - 250, centerScanY, w/2 + 250, centerScanY);
    ctx.fillStyle = '#C7A66B';
    ctx.beginPath();
    ctx.arc(w/2 + Math.cos(time * 3.0) * 150, centerScanY, 5, 0, Math.PI * 2);
    ctx.fill();

    // Section 4: Before/After & Testimonials (y = 3000 to 4000)
    const sec4Y = 3000 - currentScrollY;
    ctx.fillStyle = '#050608';
    ctx.fillRect(0, sec4Y, w, 1000);

    drawText(ctx, 'CLINICAL EFFICACY & TESTIMONIALS', w/2, sec4Y + 100, 'bold 11px "Inter", sans-serif', '#C7A66B', 'center');
    
    // Staggered testimonial cards (left/right)
    const quotes = [
      { q: "“The absolute zenith of aesthetic medicine. My skin elasticity restored by 42% in twelve weeks. A masterpiece of clinical results.”", a: "MONACO RESIDENT  ·  AGE 46" },
      { q: "“Unmatched precision and cellular rejuvenation. Dr. Evelyn Ross and her staff are true cosmetic sculptors. The results are completely natural.”", a: "BEVERLY HILLS CLIENT  ·  AGE 52" }
    ];

    quotes.forEach((q, i) => {
      const qx = i === 0 ? 150 : w/2 + 50;
      const qy = sec4Y + 180 + (i * 120) + drift2 * 0.4;
      const qw = w/2 - 200;
      
      ctx.save();
      drawRoundRect(ctx, qx, qy, qw, 200, 12, 'rgba(15,23,42,0.5)', 'rgba(199,166,107,0.12)');
      ctx.restore();

      // Draw wrapped quotes
      ctx.font = 'italic 16px "Cormorant Garamond", serif';
      ctx.fillStyle = '#F7F3EB';
      ctx.textAlign = 'left';
      
      const qWords = q.q.split(' ');
      let qLine = '';
      let qLineY = qy + 45;
      qWords.forEach(word => {
        const testQLine = qLine + word + ' ';
        const metrics = ctx.measureText(testQLine);
        if (metrics.width > qw - 80) {
          ctx.fillText(qLine, qx + 40, qLineY);
          qLine = word + ' ';
          qLineY += 24;
        } else {
          qLine = testQLine;
        }
      });
      ctx.fillText(qLine, qx + 40, qLineY);

      drawText(ctx, q.a, qx + 40, qy + 160, 'bold 9px "Inter", sans-serif', '#C7A66B');
    });

    // Epigenetic Biomarker Progress bars
    const progY = sec4Y + 560 + drift1 * 0.5;
    ctx.save();
    drawRoundRect(ctx, 150, progY, w - 300, 240, 16, '#0f1115', 'rgba(255,255,255,0.05)');
    ctx.restore();

    drawText(ctx, 'PATIENT BIOMARKER DECAY DECELERATION', 190, progY + 50, 'bold 11px "Inter", sans-serif', '#C7A66B');
    
    // Progress Bar 1
    drawText(ctx, 'Cellular DNA Methylation Age Reduction', 190, progY + 100, '13px "Inter", sans-serif', '#8A94A0');
    drawRoundRect(ctx, 190, progY + 120, w - 380, 10, 5, 'rgba(255,255,255,0.05)');
    drawRoundRect(ctx, 190, progY + 120, (w - 380) * 0.84, 10, 5, '#C7A66B');
    drawText(ctx, '84%', w - 190, progY + 100, 'bold 12px "Inter", sans-serif', '#C7A66B', 'right');

    // Progress Bar 2
    drawText(ctx, 'Collagen Fiber Density Optimization', 190, progY + 175, '13px "Inter", sans-serif', '#8A94A0');
    drawRoundRect(ctx, 190, progY + 195, w - 380, 10, 5, 'rgba(255,255,255,0.05)');
    drawRoundRect(ctx, 190, progY + 195, (w - 380) * 0.92, 10, 5, '#C7A66B');
    drawText(ctx, '92%', w - 190, progY + 175, 'bold 12px "Inter", sans-serif', '#C7A66B', 'right');

    // Section 5: Doctor Profile (y = 4000 to 4700)
    const sec5Y = 4000 - currentScrollY;
    ctx.fillStyle = '#0f1115';
    ctx.fillRect(0, sec5Y, w, 700);

    drawText(ctx, 'CLINICAL LEADERSHIP', w/2, sec5Y + 100, 'bold 11px "Inter", sans-serif', '#C7A66B', 'center');
    drawText(ctx, 'Dr. Evelyn Ross, MD, PhD', w/2, sec5Y + 160, '300 44px "Cormorant Garamond", serif', '#F7F3EB', 'center');
    drawText(ctx, 'CHIEF OF CELLULAR LONGEVITY  ·  FORMER HARVARD CLINICAL DIAGNOSTICS FELLOW', w/2, sec5Y + 205, 'bold 9px "Inter", sans-serif', '#C7A66B', 'center');

    const profileW = w - 300;
    const profileH = 340;
    const profBoxY = sec5Y + 250 + drift2 * 0.3;

    ctx.save();
    drawRoundRect(ctx, 150, profBoxY, profileW, profileH, 20, '#050608', 'rgba(199, 166, 107, 0.2)');
    ctx.restore();

    // Dr. Ross qualifications
    const qual = [
      "• 15+ years engineering systemic cellular repair protocols and clinical aesthetic programs.",
      "• Pioneer of advanced DNA methylation sequencing for non-surgical tissue rejuvenation.",
      "• Oversees all personal molecular diagnostics and treatment designs across all global sanctuaries.",
      "• Author of 40+ publications on bio-identical cosmetic architecture and aesthetic symmetry."
    ];
    qual.forEach((q, idxQ) => {
      drawText(ctx, q, 200, profBoxY + 65 + idxQ * 60, '300 16px "Cormorant Garamond", serif', '#8A94A0');
    });

    // Section 6: Final CTA & Footer (y = 4700 to 5200)
    const sec6Y = 4700 - currentScrollY;
    ctx.fillStyle = '#050608';
    ctx.fillRect(0, sec6Y, w, 500);

    drawText(ctx, 'BEGIN YOUR PROTOCOL', w/2, sec6Y + 120, 'bold 11px "Inter", sans-serif', '#C7A66B', 'center');
    drawText(ctx, 'Experience aesthetic refinement.', w/2, sec6Y + 175, '300 32px "Cormorant Garamond", serif', '#F7F3EB', 'center');

    ctx.save();
    ctx.shadowColor = 'rgba(199, 166, 107, 0.35)';
    ctx.shadowBlur = 30;
    drawRoundRect(ctx, w/2 - 250, sec6Y + 240, 500, 60, 30, '#C7A66B');
    drawText(ctx, 'REQUEST PRIVATE CONSULTATION', w/2, sec6Y + 273, 'bold 11px "Inter", sans-serif', '#050608', 'center');
    ctx.restore();

    drawText(ctx, '© ELEVATE CLINIC SANCTUARY 2026. ALL RIGHTS CONFIDENTIAL. COMPLIANT WITH MONACO SPA REGULATIONS', w/2, sec6Y + 440, '9px "Inter", sans-serif', '#475569', 'center');
  }

  // Draw fixed Header/Navbar at the very top of each canvas
  drawHeaderNavbar(idx, ctx, w, h);
}

function drawHeaderNavbar(idx, ctx, w, h) {
  // Crop the top 80px of the scaled image and render it as a fixed navbar
  const img = IMAGES['niche' + (idx + 1)];
  const isLight = false; // All sanctuaries are dark tech-luxury now
  ctx.save();
  ctx.shadowColor = 'rgba(5, 6, 8, 0.25)';
  ctx.shadowBlur = 15;
  ctx.shadowOffsetY = 4;
  
  // Draw blurred backdrop for the fixed header
  ctx.fillStyle = isLight ? 'rgba(248, 250, 252, 0.96)' : 'rgba(11, 13, 16, 0.96)';
  ctx.fillRect(0, 0, w, 80);
  
  // Draw the image's own header crop on top of the backdrop to keep it 100% authentic
  const cropH = 80 * (img.naturalWidth / w);
  ctx.drawImage(img, 0, 0, img.naturalWidth, cropH, 0, 0, w, 80);
  
  // Dynamic glow line below header
  drawLine(ctx, 0, 80, w, 80, isLight ? 'rgba(16, 185, 129, 0.25)' : 'rgba(199, 166, 107, 0.25)', 2);
  ctx.restore();
}

function drawMobileFeedCanvas(ctx, w, h, time) {
  // Clear
  ctx.fillStyle = '#0B0D10';
  ctx.fillRect(0, 0, w, h);

  // Draw scrolling feed content
  const itemHeight = 700;
  const totalHeight = itemHeight * 3;
  let scrollY = (time * 80) % totalHeight;

  for (let i = 0; i < 3; i++) {
    const itemY = i * itemHeight - scrollY;
    
    // Draw feed item background
    drawRoundRect(ctx, 10, itemY + 10, w - 20, itemHeight - 20, 16, '#0F1216', 'rgba(255,255,255,0.06)');

    // Mock video image
    const mockImg = i % 2 === 0 ? IMAGES.fitness : IMAGES.villa;
    if (mockImg.complete && mockImg.naturalWidth !== 0) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(20, itemY + 20, w - 40, 440);
      ctx.clip();
      ctx.drawImage(mockImg, 20, itemY + 20, w - 40, 440);
      ctx.restore();
    } else {
      const grad = ctx.createLinearGradient(0, itemY + 20, 0, itemY + 460);
      grad.addColorStop(0, '#1a1f26');
      grad.addColorStop(1, '#0B0D10');
      ctx.fillStyle = grad;
      ctx.fillRect(20, itemY + 20, w - 40, 440);
    }

    // Creator info and captions
    drawRoundRect(ctx, 30, itemY + 480, 32, 32, 16, '#23453F');
    drawText(ctx, 'K', 46, itemY + 496, 'bold 12px "Inter", sans-serif', '#F7F3EB', 'center');
    drawText(ctx, '@kllezo_media', 72, itemY + 496, 'bold 11px "Inter", sans-serif', '#F7F3EB');
    
    const captions = i === 0 ? [
      "Qualifying 14 high-ticket leads in 24 hours",
      "using AI Texting Agents. Scaled to $45k/mo.",
      "#marketing #growth #scale #aical"
    ] : i === 1 ? [
      "Custom Luxury Real Estate website launch.",
      "See how we got 12 privatized site tour bookings",
      "in the first week. Link in bio! ↗",
      "#realestate #webdesign #custom"
    ] : [
      "Behind the scenes at the content lab.",
      "How we edit 42 reels in 3 days using the",
      "Content Engine structure.",
      "#editing #workflow #content"
    ];
    captions.forEach((line, li) => {
      drawText(ctx, line, 30, itemY + 535 + li * 20, '10px "Inter", sans-serif', 'rgba(247, 243, 235, 0.7)');
    });

    // Likes/Shares metrics
    const metricY = itemY + 180;
    const icons = [
      { char: '♥', val: '12.4K', c: '#1A9E8F' },
      { char: '💬', val: '382', c: '#F7F3EB' },
      { char: '➦', val: '1.2K', c: '#F7F3EB' }
    ];
    icons.forEach((ic, ii) => {
      const iy = metricY + ii * 65;
      drawRoundRect(ctx, w - 65, iy, 45, 45, 22, 'rgba(11, 13, 16, 0.8)', 'rgba(255,255,255,0.08)');
      drawText(ctx, ic.char, w - 42, iy + 16, '14px "Inter", sans-serif', ic.c, 'center');
      drawText(ctx, ic.val, w - 42, iy + 34, 'bold 8px "Inter", sans-serif', '#7D8A94', 'center');
    });
  }

  // Top Status Bar (Fixed)
  ctx.fillStyle = 'rgba(11, 13, 16, 0.88)';
  ctx.fillRect(0, 0, w, 60);
  drawText(ctx, '9:41', 30, 30, 'bold 11px "Inter", sans-serif', '#F7F3EB');
  drawText(ctx, 'KLLEZO FEED', w/2, 30, 'bold 11px "Inter", sans-serif', '#BFA27A', 'center');
  drawText(ctx, '📶 🔋 100%', w - 30, 30, '10px "Inter", sans-serif', '#F7F3EB', 'right');
  drawLine(ctx, 0, 60, w, 60, 'rgba(255,255,255,0.06)');

  // Bottom Navigation Bar (Fixed)
  ctx.fillStyle = 'rgba(11, 13, 16, 0.9)';
  ctx.fillRect(0, h - 60, w, 60);
  drawLine(ctx, 0, h - 60, w, h - 60, 'rgba(255,255,255,0.06)');
  
  const navs = ['Home', 'Search', 'Post', 'Activity', 'Profile'];
  navs.forEach((nv, ni) => {
    const nx = 40 + ni * (w - 80)/4;
    drawText(ctx, nv === 'Post' ? '⊕' : nv[0], nx, h - 30, 'bold 12px "Inter", sans-serif', nv === 'Home' ? '#1A9E8F' : '#7D8A94', 'center');
  });
}

/* ═══════════════════════════════════════════
   ORBITING REELS DRAWING LOGIC (Content Engine Reels)
   ═══════════════════════════════════════════ */
function drawReelCanvas(idx, ctx, w, h) {
  ctx.fillStyle = '#0B0D10';
  ctx.fillRect(0, 0, w, h);

  // Border frame
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 4;
  ctx.strokeRect(2, 2, w - 4, h - 4);

  if (idx === 0) {
    // Editing Timeline
    drawText(ctx, 'Editing Timeline', 15, 30, 'bold 11px "Inter", sans-serif', '#BFA27A');
    drawText(ctx, 'KLLEZO_Reel_v3.mp4', 15, 50, '9px "Inter", sans-serif', '#7D8A94');
    
    // Tracks
    const tracks = ['Video', 'Audio', 'Captions'];
    tracks.forEach((tr, i) => {
      const ty = 80 + i * 45;
      drawRoundRect(ctx, 15, ty, w - 30, 32, 4, '#13171D', 'rgba(255,255,255,0.04)');
      drawText(ctx, tr, 25, ty + 16, 'bold 9px "Inter", sans-serif', '#7D8A94');
      
      if (i === 0) {
        drawRoundRect(ctx, 70, ty + 4, 80, 24, 2, '#23453F');
        drawRoundRect(ctx, 160, ty + 4, 60, 24, 2, '#7D8A94');
      } else if (i === 1) {
        ctx.strokeStyle = '#1A9E8F';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let x = 70; x < 200; x += 4) {
          const wh = 4 + Math.sin(x * 0.2) * 8;
          ctx.moveTo(x, ty + 16 - wh/2);
          ctx.lineTo(x, ty + 16 + wh/2);
        }
        ctx.stroke();
      } else {
        drawRoundRect(ctx, 70, ty + 4, 130, 24, 2, 'rgba(191, 162, 122, 0.1)');
        drawText(ctx, '"Systems scale businesses"', 80, ty + 16, 'bold 8px "Inter", sans-serif', '#BFA27A');
      }
    });

    // Playhead
    drawLine(ctx, w/2, 70, w/2, 210, '#D4A853', 1.5);
    drawText(ctx, 'Export: 1080x1920 60FPS', 15, 235, '9px "Inter", sans-serif', '#7D8A94');
  } 
  else if (idx === 1) {
    // Content Calendar
    drawText(ctx, 'Content Calendar', 15, 30, 'bold 11px "Inter", sans-serif', '#BFA27A');
    drawText(ctx, 'October Schedule', 15, 50, '9px "Inter", sans-serif', '#7D8A94');

    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        const cx = 15 + col * 75;
        const cy = 80 + row * 55;
        const fill = (row + col) % 3 === 0;
        drawRoundRect(ctx, cx, cy, 70, 50, 4, fill ? '#23453F' : '#13171D', 'rgba(255,255,255,0.05)');
        drawText(ctx, `${12 + row * 3 + col}`, cx + 8, cy + 14, 'bold 9px "Inter", sans-serif', '#7D8A94');
        if (fill) {
          drawText(ctx, '● Published', cx + 8, cy + 35, 'bold 8px "Inter", sans-serif', '#1A9E8F');
        } else {
          drawText(ctx, '○ Draft', cx + 8, cy + 35, '8px "Inter", sans-serif', '#7D8A94');
        }
      }
    }
  } 
  else if (idx === 2) {
    // Podcast Quote
    drawRoundRect(ctx, w/2 - 24, 35, 48, 48, 24, '#23453F');
    drawText(ctx, '“', w/2, 65, 'bold 36px "Cormorant Garamond", serif', '#F7F3EB', 'center');

    const quotes = [
      "“Systems scale",
      "businesses. Hustle",
      "is just a placeholder",
      "for missing pipeline.”",
    ];
    quotes.forEach((q, i) => {
      drawText(ctx, q, w/2, 115 + i * 24, 'light 14px "Cormorant Garamond", serif', '#F7F3EB', 'center');
    });

    drawText(ctx, 'EP. 42 - THE KLLEZO METHOD', w/2, 230, 'bold 8px "Inter", sans-serif', '#BFA27A', 'center');
  } 
  else if (idx === 3) {
    // Product Shoot Layout
    drawText(ctx, 'RAW CAMERA STREAM', 15, 30, 'bold 9px "Inter", sans-serif', '#7D8A94');
    drawText(ctx, 'REC [●]', w - 15, 30, 'bold 9px "Inter", sans-serif', '#D4A853', 'right');

    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 1;
    ctx.strokeRect(20, 60, w - 40, 150);
    drawLine(ctx, w/2 - 10, 135, w/2 + 10, 135, 'rgba(255,255,255,0.3)');
    drawLine(ctx, w/2, 125, w/2, 145, 'rgba(255,255,255,0.3)');

    drawText(ctx, '4K 60FPS · ISO 100 · F/2.8', w/2, 230, 'bold 9px "Inter", sans-serif', '#F7F3EB', 'center');
  }
  else if (idx === 4) {
    // Social Feed Post Mock
    drawRoundRect(ctx, 15, 30, 24, 24, 12, '#23453F');
    drawText(ctx, 'K', 27, 42, 'bold 10px "Inter", sans-serif', '#F7F3EB', 'center');
    drawText(ctx, 'kllezo_media', 48, 42, 'bold 10px "Inter", sans-serif', '#F7F3EB');

    drawRoundRect(ctx, 15, 70, w - 30, 110, 6, '#13171D');
    drawText(ctx, '[Video Preview]', w/2, 125, '10px "Inter", sans-serif', '#7D8A94', 'center');

    drawText(ctx, 'Likes: 14.8K  ·  Comments: 421', 15, 200, 'bold 9px "Inter", sans-serif', '#1A9E8F');
    drawText(ctx, 'Scaling Apex Athletics to $1.2M...', 15, 225, '9px "Inter", sans-serif', '#F7F3EB');
  }
  else if (idx === 5) {
    // Video Script
    drawText(ctx, 'REEL SCRIPTING LAB', 15, 30, 'bold 10px "Inter", sans-serif', '#BFA27A');
    drawLine(ctx, 15, 48, w - 15, 48, 'rgba(255,255,255,0.06)');

    drawText(ctx, 'VISUAL (A-ROLL)', 15, 70, 'bold 8px "Inter", sans-serif', '#7D8A94');
    drawText(ctx, 'Speak directly to the lens.', 15, 90, 'italic 10px "Inter", sans-serif', '#F7F3EB');

    drawText(ctx, 'AUDIO VOICEOVER', 15, 130, 'bold 8px "Inter", sans-serif', '#7D8A94');
    const scriptLines = [
      "“Most businesses do not",
      "fail because of product.",
      "They fail because they",
      "are invisible.”"
    ];
    scriptLines.forEach((sl, i) => {
      drawText(ctx, sl, 15, 155 + i * 16, 'bold 10px "Inter", sans-serif', '#F7F3EB');
    });
  }
  else if (idx === 6) {
    // Engagement Analytics
    drawText(ctx, 'PERFORMANCE INSIGHTS', 15, 30, 'bold 10px "Inter", sans-serif', '#F7F3EB');
    drawText(ctx, 'Engagement Rate: +182%', 15, 50, 'bold 11px "Inter", sans-serif', '#1A9E8F');

    for (let i = 0; i < 6; i++) {
      const bh = 30 + i * 22;
      const bx = 30 + i * 35;
      drawRoundRect(ctx, bx, 200 - bh, 20, bh, 2, '#1A9E8F');
    }
    drawText(ctx, 'VIEWS: 2.4M', w/2, 230, 'bold 11px "Inter", sans-serif', '#F7F3EB', 'center');
  }
  else {
    // Thumbnails Lab
    drawText(ctx, 'THUMBNAILS LAB', 15, 30, 'bold 10px "Inter", sans-serif', '#BFA27A');
    
    drawRoundRect(ctx, 20, 60, w - 40, 75, 4, '#1c1f26', 'rgba(255,255,255,0.1)');
    drawText(ctx, 'SECRET TO $100K/MO', w/2, 97, 'bold 10px "Inter", sans-serif', '#F7F3EB', 'center');

    drawRoundRect(ctx, 20, 145, w - 40, 75, 4, '#23453F', 'rgba(255,255,255,0.1)');
    drawText(ctx, 'AI TEXTING SYSTEM', w/2, 182, 'bold 10px "Inter", sans-serif', '#F7F3EB', 'center');
  }
}

/* ═══════════════════════════════════════════
   FOOTAGE PLANES DRAWING LOGIC (Content Engine Backgrounds)
   ═══════════════════════════════════════════ */
function drawFootageCanvas(idx, ctx, w, h) {
  ctx.fillStyle = 'rgba(11, 13, 16, 0.95)';
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = '#1A9E8F';
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, w - 2, h - 2);

  if (idx === 0) {
    // Video Editor Timeline
    drawText(ctx, 'ADOBE PREMIERE PRO MOCKUP', 20, 30, 'bold 11px "Inter", sans-serif', '#7D8A94');
    drawText(ctx, 'Project: KLLEZO_Promo_v2', 20, 50, 'bold 14px "Inter", sans-serif', '#F7F3EB');

    const tracks = ['Video 1', 'B-Roll', 'Audio 1', 'Music'];
    tracks.forEach((tr, i) => {
      const ty = 90 + i * 70;
      ctx.fillStyle = 'rgba(255,255,255,0.02)';
      ctx.fillRect(20, ty, w - 40, 50);
      drawText(ctx, tr, 35, ty + 25, 'bold 10px "Inter", sans-serif', '#7D8A94');
      
      if (i === 0) {
        drawRoundRect(ctx, 120, ty + 5, 180, 40, 4, '#23453F');
        drawText(ctx, 'A_ROLL_Main.mp4', 135, ty + 25, 'bold 10px "Inter", sans-serif', '#F7F3EB');
        drawRoundRect(ctx, 310, ty + 5, 200, 40, 4, '#1A9E8F');
        drawText(ctx, 'A_ROLL_Outro.mp4', 325, ty + 25, 'bold 10px "Inter", sans-serif', '#F7F3EB');
      } else if (i === 1) {
        drawRoundRect(ctx, 220, ty + 5, 120, 40, 4, '#7D8A94');
        drawText(ctx, 'B_ROLL_Malibu.mp4', 235, ty + 25, 'bold 9px "Inter", sans-serif', '#0B0D10');
      } else if (i === 2) {
        drawRoundRect(ctx, 120, ty + 5, 390, 40, 4, 'rgba(191, 162, 122, 0.1)', 'rgba(191, 162, 122, 0.3)');
        drawText(ctx, 'Dialogue_Audio_Cleaned.wav', 135, ty + 25, 'bold 9px "Inter", sans-serif', '#BFA27A');
      } else {
        drawRoundRect(ctx, 20, ty + 5, w - 60, 40, 4, '#13171D');
        drawText(ctx, 'Cinematic_Ambient_Bed.wav', 35, ty + 25, 'bold 9px "Inter", sans-serif', '#7D8A94');
      }
    });

    drawLine(ctx, 300, 70, 300, 370, '#D4A853', 2);
  }
  else if (idx === 1) {
    // Podcast interview
    drawText(ctx, 'LIVE PODCAST INTERVIEW SCREEN', 20, 30, 'bold 11px "Inter", sans-serif', '#7D8A94');
    drawText(ctx, '“Scale systems, not your manual input.”', 20, 60, 'bold 20px "Cormorant Garamond", serif', '#F7F3EB');
    
    ctx.strokeStyle = '#BFA27A';
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let x = 20; x < w - 20; x += 12) {
      const wh = 10 + Math.sin(x * 0.1) * 120 * rand(0.3, 1.0);
      ctx.moveTo(x, h/2 + 50 - wh/2);
      ctx.lineTo(x, h/2 + 50 + wh/2);
    }
    ctx.stroke();

    drawText(ctx, 'EPISODE 18: AUTOMATION SECRETS', 20, h - 40, 'bold 9px "Inter", sans-serif', '#BFA27A');
    drawText(ctx, '08:42 / 48:00  ·  ACTIVE CAPTIONS ENABLED', w - 20, h - 40, 'bold 9px "Inter", sans-serif', '#7D8A94', 'right');
  }
  else if (idx === 2) {
    // Product catalog
    drawText(ctx, 'PRODUCTION CONTENT PREVIEW', 20, 30, 'bold 11px "Inter", sans-serif', '#7D8A94');
    drawText(ctx, 'APEX WATCH Co. — LUXURY SERIES', 20, 55, 'bold 18px "Inter", sans-serif', '#F7F3EB');

    drawRoundRect(ctx, 20, 90, 260, 240, 6, '#13171D', 'rgba(255,255,255,0.06)');
    drawText(ctx, '[Product Photo Frame]', 150, 210, '10px "Inter", sans-serif', '#7D8A94', 'center');

    drawText(ctx, 'PRODUCT METADATA', 300, 110, 'bold 9px "Inter", sans-serif', '#BFA27A');
    drawText(ctx, 'Brand: Chrono Elite V', 300, 135, 'bold 14px "Inter", sans-serif', '#F7F3EB');
    drawText(ctx, 'Materials: Oystersteel & Gold', 300, 160, '11px "Inter", sans-serif', '#7D8A94');
    drawText(ctx, 'Launch Price: $12,450', 300, 185, 'bold 12px "Inter", sans-serif', '#1A9E8F');

    const p = [
      "High-fidelity luxury catalog asset prepared for",
      "social deployment. Color graded, formatted for",
      "immediate attention capture."
    ];
    p.forEach((line, i) => {
      drawText(ctx, line, 300, 225 + i * 20, '10px "Inter", sans-serif', '#7D8A94');
    });

    drawRoundRect(ctx, 300, 290, 180, 40, 6, '#F7F3EB');
    drawText(ctx, 'EXPORT HIGH-RES ASSET', 390, 310, 'bold 9px "Inter", sans-serif', '#0B0D10', 'center');
  }
  else {
    // Metric Dashboard
    drawText(ctx, 'CONTENT ENGINE PERFORMANCE REPORT', 20, 30, 'bold 11px "Inter", sans-serif', '#BFA27A');
    drawText(ctx, 'All Client Campaigns (Aggregated)', 20, 50, '9px "Inter", sans-serif', '#7D8A94');

    drawRoundRect(ctx, 20, 80, 220, 150, 8, '#13171D', 'rgba(255,255,255,0.05)');
    drawText(ctx, 'IMPRESSIONS GAINED', 35, 105, 'bold 9px "Inter", sans-serif', '#7D8A94');
    drawText(ctx, '12.4M (+242%)', 35, 125, 'bold 20px "Inter", sans-serif', '#1A9E8F');
    ctx.strokeStyle = '#1A9E8F';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(35, 200);
    ctx.bezierCurveTo(90, 190, 130, 160, 220, 140);
    ctx.stroke();

    drawRoundRect(ctx, 260, 80, 220, 150, 8, '#13171D', 'rgba(255,255,255,0.05)');
    drawText(ctx, 'LEADS CONVERTED', 275, 105, 'bold 9px "Inter", sans-serif', '#7D8A94');
    drawText(ctx, '482 (+182%)', 275, 125, 'bold 20px "Inter", sans-serif', '#D4A853');
    ctx.strokeStyle = '#D4A853';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(275, 200);
    ctx.bezierCurveTo(330, 195, 370, 160, 460, 135);
    ctx.stroke();

    drawRoundRect(ctx, 20, 250, w - 40, 100, 8, 'rgba(255,255,255,0.02)', 'rgba(255,255,255,0.06)');
    drawText(ctx, 'CLIENT REVENUE METRICS ATTR. BY CONTENT ENGINE', 35, 275, 'bold 8px "Inter", sans-serif', '#BFA27A');
    drawText(ctx, '$1,248,502.80 USD generated past 90 days.', 35, 305, 'bold 14px "Inter", sans-serif', '#F7F3EB');
    drawText(ctx, 'Verified ROI: 14.8x average attribution score.', 35, 330, '10px "Inter", sans-serif', '#7D8A94');
  }
}

// ═══════════════════════════════════════════
function wrapText(ctx, text, maxWidth) {
  const words = text.split(' ');
  let lines = [];
  let currentLine = '';

  for (let i = 0; i < words.length; i++) {
    let w = words[i];
    const wWidth = ctx.measureText(w).width;
    
    if (wWidth > maxWidth) {
      if (currentLine) {
        lines.push(currentLine);
        currentLine = '';
      }
      
      let temp = '';
      for (let j = 0; j < w.length; j++) {
        const char = w[j];
        if (ctx.measureText(temp + char).width > maxWidth) {
          lines.push(temp);
          temp = char;
        } else {
          temp += char;
        }
      }
      currentLine = temp;
    } else {
      const testLine = currentLine ? currentLine + ' ' + w : w;
      if (ctx.measureText(testLine).width > maxWidth) {
        lines.push(currentLine);
        currentLine = w;
      } else {
        currentLine = testLine;
      }
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }
  return lines;
}
function measureMaxLineWidth(ctx, lines) {
  let maxW = 0;
  lines.forEach(l => {
    const w = ctx.measureText(l).width;
    if (w > maxW) maxW = w;
  });
  return maxW;
}

function drawCallingScreenCanvas(idx, ctx, w, h, img, isLoaded) {
  ctx.clearRect(0, 0, w, h);
  if (!isLoaded || !img) {
    ctx.fillStyle = '#07090e';
    ctx.fillRect(0, 0, w, h);
    return;
  }

  // Draw opaque rounded rectangle background matching the card shape
  ctx.save();
  drawRoundRect(ctx, 2, 2, w - 4, h - 4, w * 0.06, '#08090c');
  ctx.restore();

  // 1. Draw base image
  ctx.drawImage(img, 0, 0, w, h);

  // 2. Compute timing parameters based on calling zone timer
  const cycleTime = callingZoneTime % 2.8; // 2.8s overall pipeline loop

  if (idx === 0) {
    // ─── CARD 1: LIVE VOICE CALL ───
    // Mask original waveform (Y: 490-695, X: 240-920)
    ctx.fillStyle = '#08090b';
    ctx.fillRect(240, 490, 680, 205);

    // Mask original timer "09:45" (Y: 780-860, X: 450-700)
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(450, 780, 250, 80);

    // Mask original green dot
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(860, 115, 190, 50);

    // Green Active Call pulsing dot
    const pulse = Math.abs(Math.sin(callingZoneTime * Math.PI)); // pulse period 2s
    ctx.fillStyle = `rgba(34, 197, 94, ${0.4 + pulse * 0.6})`;
    ctx.beginPath(); ctx.arc(887, 139, 10, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = `rgba(34, 197, 94, ${0.15 + pulse * 0.15})`;
    ctx.beginPath(); ctx.arc(887, 139, 20, 0, Math.PI * 2); ctx.fill();
    
    ctx.font = 'bold 24px "Inter", sans-serif';
    ctx.fillStyle = '#22c55e';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('Call Active', 915, 139);

    // Live call timer counting up (slower count-up)
    let displaySecs = Math.floor(callingZoneTime * 0.5);
    const mins = Math.floor(displaySecs / 60);
    const secs = displaySecs % 60;
    const timeStr = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    ctx.font = 'bold 58px "Inter", sans-serif';
    ctx.fillStyle = '#f1f5f9';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(timeStr, 578, 825);

    // Dynamic wave animation (smoother, slower breathing)
    const barCount = 31;
    const spacing = 18;
    const barW = 6;
    const startX = 578 - (barCount * spacing) / 2;

    let activeAmp = 1.0;
    if (cycleTime > 2.4) {
      activeAmp = 0.04; // Flatline/idle hum when pipeline resets/finishes
    } else {
      const speechCycle = (callingZoneTime * 0.6) % (Math.PI * 2);
      const isSpeaking = Math.sin(speechCycle) > -0.3; // speak 60%, pause 40%
      activeAmp = isSpeaking ? (0.5 + 0.5 * Math.abs(Math.sin(callingZoneTime * 1.0))) : 0.15;
    }

    for (let i = 0; i < barCount; i++) {
      const dist = Math.abs(i - barCount/2) / (barCount/2);
      const envelope = Math.max(0.1, 1.0 - dist * dist);
      const barNoise = Math.abs(Math.sin(callingZoneTime * 3.5 - i * 0.35)) * 0.5 + 0.5;
      const hVal = (30 + envelope * 120) * (0.08 + activeAmp * barNoise * 0.92);
      drawRoundRect(ctx, startX + i * spacing, 590 - hVal/2, barW, hVal, 3, '#D4A853');
    }

    // Subtle Golden Energy Particles flowing through waveform
    if (!ctx.particles) {
      ctx.particles = [];
      for (let p = 0; p < 20; p++) {
        ctx.particles.push({
          x: 240 + Math.random() * 680,
          y: 490 + Math.random() * 205,
          speed: 1.2 + Math.random() * 2.0,
          size: 1.2 + Math.random() * 2.0,
          phase: Math.random() * Math.PI * 2
        });
      }
    }
    
    ctx.fillStyle = 'rgba(212, 168, 83, 0.45)';
    ctx.particles.forEach(p => {
      p.x += p.speed;
      if (p.x > 920) {
        p.x = 240;
        p.y = 490 + Math.random() * 205;
      }
      const oscY = p.y + Math.sin(callingZoneTime * 2.0 + p.phase) * 12;
      ctx.beginPath();
      ctx.arc(p.x, oscY, p.size, 0, Math.PI * 2);
      ctx.fill();
    });

  } 
  else if (idx === 1) {
    // ─── CARD 2: LIVE TRANSCRIPT CONVERSATION ───
    // Mask original transcript bubbles (Y: 460-1175, X: 47-1075) - preserves card borders (X=1078+)
    ctx.fillStyle = '#080808';
    ctx.fillRect(47, 460, 1028, 715);

    // Dynamic timer mask and draw
    // Mask static timer "00:02" (Y: 160-190, X: 970-1040)
    ctx.fillStyle = '#080808';
    ctx.fillRect(960, 160, 90, 30);
    
    // Draw dynamic timer
    let displaySecs = Math.floor(cycleTime) + 2;
    const mins = Math.floor(displaySecs / 60);
    const secs = displaySecs % 60;
    const timeStr = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    ctx.font = '28px "Inter", sans-serif';
    ctx.fillStyle = '#D4A853';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText(timeStr, 1040, 175);

    // Slow subtle gold accent wave under the top divider line
    ctx.strokeStyle = 'rgba(212, 168, 83, 0.2)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let x = 47; x <= 1075; x += 10) {
      const waveY = 122 + Math.sin(callingZoneTime * 0.8 + x * 0.005) * 3;
      if (x === 47) ctx.moveTo(x, waveY);
      else ctx.lineTo(x, waveY);
    }
    ctx.stroke();

    const dialog = [
      { sender: 'Customer', text: "Hi, I'm interested in learning more.", side: 'left', time: 0.8, typeDuration: 0.4, waitTime: 0.4 },
      { sender: 'AI', text: "Absolutely. I'd be happy to help.", side: 'right', time: 1.4, typeDuration: 0.5, waitTime: 0.9 },
      { sender: 'Customer', text: "Can I schedule a call?", side: 'left', time: 1.9, typeDuration: 0.4, waitTime: 1.5 },
      { sender: 'AI', text: "Yes. Let's find a suitable time.", side: 'right', time: 2.5, typeDuration: 0.5, waitTime: 2.0 }
    ];

    let visibleMessages = [];
    let showTypingIndicator = false;

    dialog.forEach(msg => {
      if (msg.waitTime && cycleTime >= msg.waitTime && cycleTime < msg.time) {
        showTypingIndicator = true;
      }
      if (cycleTime >= msg.time) {
        const elapsedTyping = cycleTime - msg.time;
        if (elapsedTyping < msg.typeDuration) {
          const chars = Math.floor((elapsedTyping / msg.typeDuration) * msg.text.length);
          const cursorStr = (Math.floor(callingZoneTime * 4.0) % 2 === 0) ? '|' : '';
          visibleMessages.push({
            sender: msg.sender,
            text: msg.text.substring(0, chars) + cursorStr,
            side: msg.side,
            isNew: true
          });
        } else {
          visibleMessages.push({
            sender: msg.sender,
            text: msg.text,
            side: msg.side,
            isNew: false
          });
        }
      }
    });

    const startY = 480;
    const maxChatHeight = 650; // Taller scrolling area matching the Y:460-1175 viewport
    
    let bubbleLayouts = [];
    let currentLayoutY = 0;

    visibleMessages.forEach((msg, mi) => {
      ctx.font = '28px "Inter", sans-serif';
      const maxTextW = 600; // max-width constraint for text: bubbleW = maxTextW + 50 <= 650
      const lines = wrapText(ctx, msg.text, maxTextW);
      const bubbleW = Math.max(160, measureMaxLineWidth(ctx, lines) + 50); // 25px padding on each side
      const bubbleH = 35 + lines.length * 38 + 25; // padding/margins

      bubbleLayouts.push({
        sender: msg.sender,
        lines: lines,
        w: bubbleW,
        h: bubbleH,
        side: msg.side,
        isNew: msg.isNew && mi === visibleMessages.length - 1
      });

      currentLayoutY += bubbleH + 25;
    });

    let typingBubbleH = 0;
    if (showTypingIndicator) {
      typingBubbleH = 75;
      currentLayoutY += typingBubbleH + 25;
    }

    if (!ctx.chatState) {
      ctx.chatState = {
        scrollOffset: 0
      };
    }
    const state = ctx.chatState;
    const targetScrollOffset = Math.max(0, currentLayoutY - maxChatHeight);
    state.scrollOffset = state.scrollOffset + (targetScrollOffset - state.scrollOffset) * 0.1;

    let drawY = startY - state.scrollOffset;

    // Apply clipping mask for the message bubbles area to prevent any overflow outside the card bounds
    ctx.save();
    ctx.beginPath();
    ctx.rect(47, 460, 1028, 715); // Strict viewport boundaries (equivalent to overflow: hidden)
    ctx.clip();

    bubbleLayouts.forEach(bub => {
      const isRight = bub.side === 'right';
      // Left side starts at 75, Right side ends at 1050. Clamp width to fit available container bounds
      const minX = 75;
      const maxX = 1050;
      const clampedW = Math.min(bub.w, maxX - minX);
      const x = isRight ? maxX - clampedW : minX;

      ctx.save();
      if (bub.isNew) {
        ctx.shadowColor = 'rgba(212, 168, 83, 0.22)';
        ctx.shadowBlur = 25;
      }
      
      ctx.fillStyle = isRight ? 'rgba(212, 168, 83, 0.09)' : 'rgba(255, 255, 255, 0.04)';
      ctx.strokeStyle = isRight ? 'rgba(212, 168, 83, 0.22)' : 'rgba(255, 255, 255, 0.07)';
      drawRoundRect(ctx, x, drawY, clampedW, bub.h, 16, ctx.fillStyle, ctx.strokeStyle);
      ctx.restore();

      ctx.font = 'bold 18px "Inter", sans-serif';
      ctx.fillStyle = isRight ? '#D4A853' : '#c7a66b';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(bub.sender, x + 25, drawY + 28);

      ctx.font = '26px "Inter", sans-serif';
      ctx.fillStyle = '#e2e8f0';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      bub.lines.forEach((line, li) => {
        ctx.fillText(line, x + 25, drawY + 62 + li * 38);
      });

      drawY += bub.h + 25;
    });

    if (showTypingIndicator) {
      const typingW = 160;
      const tx = 1050 - typingW;

      ctx.fillStyle = 'rgba(212, 168, 83, 0.09)';
      ctx.strokeStyle = 'rgba(212, 168, 83, 0.22)';
      drawRoundRect(ctx, tx, drawY, typingW, typingBubbleH, 16, ctx.fillStyle, ctx.strokeStyle);

      ctx.fillStyle = '#D4A853';
      for (let dotIdx = 0; dotIdx < 3; dotIdx++) {
        const dotOffset = Math.sin(callingZoneTime * 8.0 - dotIdx * 1.5) * 5;
        ctx.beginPath();
        ctx.arc(tx + 45 + dotIdx * 35, drawY + typingBubbleH / 2 + dotOffset, 6, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore(); // Restore message area clipping mask

    // ─── BOTTOM AI STATUS BAR ANIMATION ───
    // Mask bottom status bar area (Y: 1205 to 1345, X: 47 to 1082)
    // Left status text: X: 205-555, Y: 1235-1280
    // Thinking dots: X: 205-655, Y: 1300-1320
    // Waveform: X: 935-1015, Y: 1255-1285
    ctx.fillStyle = '#080808';
    ctx.fillRect(205, 1235, 350, 45); // status text mask
    ctx.fillRect(205, 1300, 450, 20); // thinking dots mask
    ctx.fillRect(935, 1255, 90, 30);  // waveform mask

    // 1. Status Text Cycling Animation
    const statusTexts = [
      'AI Agent is speaking...',
      'AI Agent is listening...',
      'AI Agent is responding...',
      'AI Agent is scheduling...',
      'AI Agent is confirming...'
    ];
    const statusIdx = Math.floor(callingZoneTime / 2.5) % statusTexts.length;
    const currentStatus = statusTexts[statusIdx];
    ctx.font = '28px "Inter", sans-serif';
    ctx.fillStyle = '#60a5fa';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(currentStatus, 210, 1258);

    // 2. Typing/Thinking Dots Animation
    const dotSpacing = 20;
    const startDotX = 210;
    const dotY = 1311;
    
    const dotSequence = [1, 2, 3, 4, 3, 2];
    const seqIdx = Math.floor(callingZoneTime * 2.5) % dotSequence.length;
    const numVisibleDots = dotSequence[seqIdx];

    ctx.fillStyle = '#3b82f6';
    for (let d = 0; d < numVisibleDots; d++) {
      const dotX = startDotX + d * dotSpacing;
      ctx.beginPath();
      ctx.arc(dotX, dotY, 4.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // 3. Dynamic Waveform Animation
    const waveBarCount = 7;
    const waveSpacing = 8;
    const waveBarW = 3;
    const waveStartX = 943;
    const waveCenterY = 1272;
    ctx.fillStyle = '#3b82f6';

    const isSpeakingText = currentStatus.includes('speaking') || currentStatus.includes('responding');
    let activeAmp = isSpeakingText 
      ? (0.4 + 0.6 * Math.abs(Math.sin(callingZoneTime * 5.0))) 
      : 0.15; // idle hum
    
    // Occasional spikes when speaking
    if (isSpeakingText && Math.sin(callingZoneTime * 1.5) > 0.7) {
      activeAmp *= 1.4;
    }

    for (let i = 0; i < waveBarCount; i++) {
      const waveVal = Math.sin(callingZoneTime * 15.0 - i * 1.2) * 0.5 + 0.5;
      const hVal = (4 + 16 * activeAmp * waveVal);
      drawRoundRect(ctx, waveStartX + i * waveSpacing, waveCenterY - hVal/2, waveBarW, hVal, 1.5, '#3b82f6');
    }
  } 
  else if (idx === 2) {
    // ─── CARD 3: APPOINTMENT SECURED Checklist ───
    const maskBgColors = ['#141310', '#131210', '#13120f', '#12120e', '#10110d'];
    const checkCentersY = [548, 648, 748, 847, 945];

    for (let c = 0; c < 5; c++) {
      ctx.fillStyle = maskBgColors[c];
      ctx.fillRect(835, checkCentersY[c] - 30, 80, 60);
    }

    const stepTimes = [1.1, 1.4, 1.7, 2.0, 2.3];
    
    for (let s = 0; s < 5; s++) {
      if (cycleTime >= stepTimes[s]) {
        const stepAge = cycleTime - stepTimes[s];
        const scale = Math.min(1.0, stepAge / 0.25);
        const cy = checkCentersY[s];
        
        ctx.save();
        ctx.translate(865, cy);
        ctx.scale(scale, scale);
        
        ctx.fillStyle = 'rgba(212, 168, 83, 0.16)';
        ctx.beginPath(); ctx.arc(0, 0, 24, 0, Math.PI * 2); ctx.fill();

        ctx.fillStyle = '#D4A853';
        ctx.beginPath(); ctx.arc(0, 0, 16, 0, Math.PI * 2); ctx.fill();

        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(-6, 0);
        ctx.lineTo(-1.5, 4.5);
        ctx.lineTo(6, -4.5);
        ctx.stroke();

        ctx.restore();
      }
    }

    if (cycleTime >= 1.1 && cycleTime < 2.4) {
      const lineProgress = (cycleTime - 1.1) / 1.3;
      const pulseY = 540 + lineProgress * (950 - 540);
      
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      
      const radGrad = ctx.createRadialGradient(351, pulseY, 0, 351, pulseY, 25);
      radGrad.addColorStop(0.0, 'rgba(255, 220, 120, 0.95)');
      radGrad.addColorStop(0.3, 'rgba(212, 168, 83, 0.65)');
      radGrad.addColorStop(1.0, 'rgba(212, 168, 83, 0.0)');
      
      ctx.fillStyle = radGrad;
      ctx.beginPath();
      ctx.arc(351, pulseY, 25, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    if (cycleTime >= 2.5 && cycleTime < 2.8) {
      const shimmerProgress = (cycleTime - 2.5) / 0.3;
      const gradX = -w + shimmerProgress * (w * 3);
      
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      
      const grad = ctx.createLinearGradient(gradX, 0, gradX + w, h);
      grad.addColorStop(0.0, 'rgba(255, 255, 255, 0.0)');
      grad.addColorStop(0.45, 'rgba(255, 255, 255, 0.0)');
      grad.addColorStop(0.5, 'rgba(212, 168, 83, 0.22)');
      grad.addColorStop(0.55, 'rgba(255, 255, 255, 0.0)');
      grad.addColorStop(1.0, 'rgba(255, 255, 255, 0.0)');
      
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
      ctx.restore();
    }
  }
}



/* ═══════════════════════════════════════════
   TEXT BUBBLE DRAWING LOGIC — Platform Morphing Chat
   Single conversation morphs: WhatsApp → Instagram → Messenger → Website Chat
   ═══════════════════════════════════════════ */

// 6-message conversation — User/AI/User/AI/User/AI
// Platform morphs: WhatsApp (msgs 1-2) → Instagram (msgs 3-4) → Kllezo Bot (msgs 5-6)
const CONVERSATION_SCRIPT = [
  { sender: 'customer', text: "Hi! I saw your website." },
  { sender: 'ai',       text: "Hey! Thanks for reaching out 👋 What kind of business do you run?" },
  { sender: 'customer', text: "A local restaurant. We miss too many calls." },
  { sender: 'ai',       text: "We can fix that. Our AI handles every missed call automatically. Want to see how?" },
  { sender: 'customer', text: "Yes! How fast can you set it up?" },
  { sender: 'ai',       text: "Usually 24–48 hours 🚀 I'll send you a setup link right now." }
];

function easeOutBack(t) {
  const c1 = 1.3;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

function drawTextBubbleCanvas(idx, ctx, w, h) {
  ctx.clearRect(0, 0, w, h);

  const imgW = IMAGES.whatsapp;
  const imgI = IMAGES.instagram;
  const imgWeb = IMAGES.websiteUi;

  if (imgW && imgW.complete && imgI && imgI.complete && imgWeb && imgWeb.complete) {
    const phoneSettled = (typeof textingPhoneSettled !== 'undefined') ? textingPhoneSettled : false;

    const now = performance.now() / 1000.0;
    if (!ctx.lastChatUpdateTime) ctx.lastChatUpdateTime = now;
    const chatDt = Math.min(0.1, now - ctx.lastChatUpdateTime);
    ctx.lastChatUpdateTime = now;

    function calculateBubbleLayout(text, maxW) {
      ctx.font = '500 14px "Inter", -apple-system, sans-serif';
      const words = text.split(' ');
      const lines = [];
      let currentLine = words[0] || '';
      for (let i = 1; i < words.length; i++) {
        const word = words[i];
        const width = ctx.measureText(currentLine + " " + word).width;
        if (width < maxW - 28) {
          currentLine += " " + word;
        } else {
          lines.push(currentLine);
          currentLine = word;
        }
      }
      lines.push(currentLine);
      let maxLineWidth = 0;
      lines.forEach(line => {
        const width = ctx.measureText(line).width;
        if (width > maxLineWidth) maxLineWidth = width;
      });
      const paddingX = 14;
      const paddingY = 10;
      const lineHeight = 20;
      const height = lines.length * lineHeight + paddingY * 2;
      return { lines, width: Math.ceil(maxLineWidth + paddingX * 2), height };
    }

    function getPlatformStyle(platform) {
      if (platform === 'whatsapp') {
        return {
          customerBubble: 'rgb(217, 253, 211)',
          customerText: 'rgb(17, 27, 33)',
          aiBubble: 'rgb(32, 44, 51)',
          aiText: 'rgb(233, 237, 239)',
          borderRadius: 12
        };
      } else if (platform === 'instagram') {
        return {
          customerBubble: 'rgb(0, 149, 246)',
          customerText: 'rgb(255, 255, 255)',
          aiBubble: 'rgb(38, 38, 38)',
          aiText: 'rgb(255, 255, 255)',
          borderRadius: 18
        };
      } else {
        return {
          customerBubble: 'rgb(79, 70, 229)',
          customerText: 'rgb(255, 255, 255)',
          aiBubble: 'rgb(31, 41, 55)',
          aiText: 'rgb(255, 255, 255)',
          borderRadius: 12
        };
      }
    }

    function drawBubble(bx, by, bw, bh, br, fillStyle) {
      ctx.beginPath();
      ctx.moveTo(bx + br, by);
      ctx.lineTo(bx + bw - br, by);
      ctx.quadraticCurveTo(bx + bw, by, bx + bw, by + br);
      ctx.lineTo(bx + bw, by + bh - br);
      ctx.quadraticCurveTo(bx + bw, by + bh, bx + bw - br, by + bh);
      ctx.lineTo(bx + br, by + bh);
      ctx.quadraticCurveTo(bx, by + bh, bx, by + bh - br);
      ctx.lineTo(bx, by + br);
      ctx.quadraticCurveTo(bx, by, bx + br, by);
      ctx.closePath();
      ctx.fillStyle = fillStyle;
      ctx.fill();
    }

    // Reset chat state if phone is not settled/active
    if (!phoneSettled) {
      ctx.chatState = null;
      window.textingChatDone = false;
    }

    // Initialize chatState if null
    if (!ctx.chatState) {
      ctx.chatState = {
        messages: [], // start empty
        messageIdCounter: 1,
        scriptIndex: 0,
        state: 'customer_typing',
        timer: 0,
        charIndex: 0,
        inputText: '',
        targetDelay: 0.0,
        charDelay: 0.05,
        scrollOffset: 0,
        scrollTargetOffset: 0,
        scrollStartOffset: 0,
        scrollAnimTime: 9.9,
        scrollAnimDuration: 0.85,
        lastTotalHeight: 0,
        time: 0,
        thinkingText: 'Kllezo AI is typing',
        platform: 'whatsapp',
        targetPlatform: 'whatsapp',
        platformProgress: 0.0
      };
    }

    const state = ctx.chatState;
    state.time += chatDt;
    state.timer += chatDt;

    // Platform transition state update
    if (state.platform !== state.targetPlatform) {
      state.platformProgress = Math.min(1.0, state.platformProgress + chatDt / 1.0); // 1.0s smooth morph
      if (state.platformProgress >= 1.0) {
        state.platform = state.targetPlatform;
        state.platformProgress = 0.0;
      }
    }

    // Blend platform opacities based on active state and progress
    let whatsappOpacity = 0.0;
    let instagramOpacity = 0.0;
    let websiteUiOpacity = 0.0;

    if (state.platform === 'whatsapp' && state.targetPlatform === 'instagram') {
      whatsappOpacity = 1.0 - state.platformProgress;
      instagramOpacity = state.platformProgress;
    } else if (state.platform === 'instagram' && state.targetPlatform === 'web') {
      instagramOpacity = 1.0 - state.platformProgress;
      websiteUiOpacity = state.platformProgress;
    } else {
      if (state.platform === 'whatsapp') whatsappOpacity = 1.0;
      else if (state.platform === 'instagram') instagramOpacity = 1.0;
      else if (state.platform === 'web') websiteUiOpacity = 1.0;
    }

    const destW = 422;
    const destH = 912;
    const destX = (w - destW) / 2;
    const destY = (h - destH) / 2;

    // Draw persistent iPhone background & crossfade
    let baseImg = imgW;
    let fadeImg = null;
    let fadeOpacity = 0;

    if (instagramOpacity > 0.001) {
      fadeImg = imgI;
      fadeOpacity = instagramOpacity;
    }
    if (websiteUiOpacity > 0.001) {
      fadeImg = imgWeb;
      fadeOpacity = websiteUiOpacity;
      if (instagramOpacity > 0.001) {
        baseImg = imgI;
      }
    }

    // ── SCREEN CLIPPING: enforce curved edges of the phone display ──
    ctx.save();
    ctx.beginPath();
    const screenX = destX + 10;
    const screenY = destY + 88;
    const screenW = destW - 20;
    const screenH = destH - 110;
    const screenR = 38;
    ctx.moveTo(screenX + screenR, screenY);
    ctx.arcTo(screenX + screenW, screenY,            screenX + screenW, screenY + screenH, screenR);
    ctx.arcTo(screenX + screenW, screenY + screenH,  screenX,           screenY + screenH, screenR);
    ctx.arcTo(screenX,           screenY + screenH,  screenX,           screenY,           screenR);
    ctx.arcTo(screenX,           screenY,            screenX + screenW, screenY,           screenR);
    ctx.closePath();
    ctx.clip();

    ctx.save();
    // Solid backdrop behind the transparent frame
    drawRoundRect(ctx, destX + 2, destY + 2, destW - 4, destH - 4, 38, '#08090c');
    ctx.restore();

    if (fadeImg) {
      ctx.globalAlpha = 1.0 - fadeOpacity;
      ctx.drawImage(baseImg, 0, 0, baseImg.naturalWidth, baseImg.naturalHeight, destX, destY, destW, destH);
      ctx.globalAlpha = fadeOpacity;
      ctx.drawImage(fadeImg, 0, 0, fadeImg.naturalWidth, fadeImg.naturalHeight, destX, destY, destW, destH);
    } else {
      ctx.globalAlpha = 1.0;
      ctx.drawImage(baseImg, 0, 0, baseImg.naturalWidth, baseImg.naturalHeight, destX, destY, destW, destH);
    }
    ctx.globalAlpha = 1.0;

    // CHAT STATE MACHINE
    if (phoneSettled) {
      const activeMsg = CONVERSATION_SCRIPT[state.scriptIndex];

      if (state.state === 'customer_typing') {
        if (state.timer >= state.charDelay) {
          state.timer = 0;
          state.charIndex++;
          state.inputText = activeMsg.text.substring(0, state.charIndex);

          // Fast, natural typing speed (12-24ms per character)
          const baseSpeed = 0.012 + Math.random() * 0.012;
          const lastChar = state.inputText[state.inputText.length - 1];
          if (lastChar === ' ') {
            state.charDelay = 0.03 + Math.random() * 0.03;
          } else if (lastChar === ',' || lastChar === '.' || lastChar === '?' || lastChar === '!') {
            state.charDelay = 0.06 + Math.random() * 0.06;
          } else {
            state.charDelay = baseSpeed;
          }

          if (state.charIndex >= activeMsg.text.length) {
            state.state = 'customer_pause';
            state.timer = 0;
            state.targetDelay = 0.2 + Math.random() * 0.2; // 200 - 400ms pause
          }
        }
      }
      else if (state.state === 'customer_pause') {
        if (state.timer >= state.targetDelay) {
          state.state = 'customer_send';
          state.timer = 0;
        }
      }
      else if (state.state === 'customer_send') {
        state.messages.push({
          id: state.messageIdCounter++,
          sender: 'customer',
          text: activeMsg.text,
          opacity: 0,
          yOffset: 25,
          scale: 0.5,
          popProgress: 0.0
        });
        state.inputText = '';
        state.scriptIndex++;

        if (state.scriptIndex >= CONVERSATION_SCRIPT.length) {
          state.state = 'done';
          window.textingChatDone = true;
        } else {
          state.state = 'ai_thinking';
          state.timer = 0;
          state.targetDelay = 0.8 + Math.random() * 0.2; // 0.8 to 1.0s typing indicator
          state.thinkingText = 'Kllezo AI is typing';
        }
      }
      else if (state.state === 'ai_thinking') {
        if (state.timer >= state.targetDelay) {
          // Send complete AI reply bubble with spring animations
          state.messages.push({
            id: state.messageIdCounter++,
            sender: 'ai',
            text: activeMsg.text,
            opacity: 0,
            yOffset: 25,
            scale: 0.5,
            popProgress: 0.0
          });
          state.scriptIndex++;
          state.state = 'ai_pause';
          state.timer = 0;
          state.targetDelay = 0.8; // 0.8s delay before next user message starts
        }
      }
      else if (state.state === 'ai_pause') {
        // Trigger platform morphs after AI replies are fully displayed
        if (state.messages.length === 2 && state.targetPlatform === 'whatsapp') {
          state.targetPlatform = 'instagram';
        } else if (state.messages.length === 4 && state.targetPlatform === 'instagram') {
          state.targetPlatform = 'web';
        }

        if (state.timer >= state.targetDelay) {
          if (state.scriptIndex >= CONVERSATION_SCRIPT.length) {
            state.state = 'done';
            window.textingChatDone = true;
          } else {
            state.state = 'customer_typing';
            state.timer = 0;
            state.charIndex = 0;
            state.inputText = '';
            state.charDelay = 0.02;
          }
        }
      }
    }

    // Update message spring pop animations
    state.messages.forEach(msg => {
      if (msg.popProgress !== undefined && msg.popProgress < 1.0) {
        msg.popProgress = Math.min(1.0, msg.popProgress + chatDt * 5.0); // Snap pop in ~0.2s
        const ease = easeOutBack(msg.popProgress);
        msg.opacity = Math.min(1.0, msg.popProgress * 2.0);
        msg.scale = 0.8 + ease * 0.2;
        msg.yOffset = (1.0 - Math.min(1.0, ease)) * 25;
      }
    });

    // Chat area dimensions
    let activeMinY = destY + 145;
    let activeMaxY = destY + destH - 102;
    let activeW = destW - 32;
    let activeX = destX + 16;

    if (websiteUiOpacity > 0.001) {
      activeMinY = lerp(destY + 145, destY + 185, websiteUiOpacity);
      activeMaxY = lerp(destY + destH - 102, destY + destH - 120, websiteUiOpacity);
      activeW = lerp(destW - 32, destW - 48, websiteUiOpacity);
      activeX = destX + 16;
    }

    const chatContentMinY = activeMinY + 16;
    const chatContentMaxY = activeMaxY - 16;
    const maxViewportHeight = chatContentMaxY - chatContentMinY;
    const maxBubbleWidth = 250;

    let bubblesToDraw = [];
    let totalHeight = 0;
    const spacing = 12;

    state.messages.forEach(m => {
      const layout = calculateBubbleLayout(m.text, maxBubbleWidth);
      bubblesToDraw.push({
        id: m.id,
        sender: m.sender,
        text: m.text,
        lines: layout.lines,
        width: layout.width,
        height: layout.height,
        opacity: m.opacity !== undefined ? m.opacity : 1.0,
        yOffset: m.yOffset !== undefined ? m.yOffset : 0,
        scale: m.scale !== undefined ? m.scale : 1.0
      });
      totalHeight += layout.height + spacing;
    });

    const maxScroll = Math.max(0, totalHeight - maxViewportHeight);

    // Initial total height check
    if (state.lastTotalHeight === undefined || state.lastTotalHeight === 0) {
      state.lastTotalHeight = totalHeight;
      state.scrollOffset = maxScroll;
      state.scrollTargetOffset = maxScroll;
    }

    // Scroll animation trigger on height increase
    if (totalHeight > state.lastTotalHeight + 1) {
      state.scrollStartOffset = state.scrollOffset;
      state.scrollTargetOffset = maxScroll;
      state.scrollAnimTime = 0.0;
      state.scrollAnimDuration = 0.75;
      state.lastTotalHeight = totalHeight;
    } else if (totalHeight < state.lastTotalHeight - 1) {
      state.lastTotalHeight = totalHeight;
    }

    // Gentle scroll drift upward during active typing or thinking states (4 pixels per second)
    let drift = 0;
    if (state.scrollAnimTime >= state.scrollAnimDuration) {
      if (state.state === 'customer_typing' || state.state === 'ai_thinking') {
        drift = 4.0 * chatDt;
      }
    }

    // power3.out Ease scrolling
    if (state.scrollAnimTime < state.scrollAnimDuration) {
      state.scrollAnimTime = Math.min(state.scrollAnimDuration, state.scrollAnimTime + chatDt);
      const t = state.scrollAnimTime / state.scrollAnimDuration;
      const ease = 1 - Math.pow(1 - t, 3);
      state.scrollOffset = state.scrollStartOffset + (state.scrollTargetOffset - state.scrollStartOffset) * ease;
    } else {
      state.scrollOffset = Math.min(maxScroll, state.scrollOffset + drift);
    }

    // BLENDED DYNAMIC MORPHING STYLES
    const wStyle = getPlatformStyle('whatsapp');
    const iStyle = getPlatformStyle('instagram');
    const webStyle = getPlatformStyle('web');

    const parseRGB = (rgbStr) => rgbStr.match(/\d+/g).map(Number);
    const wCustC = parseRGB(wStyle.customerBubble);
    const wCustT = parseRGB(wStyle.customerText);
    const wAiC = parseRGB(wStyle.aiBubble);
    const wAiT = parseRGB(wStyle.aiText);

    const iCustC = parseRGB(iStyle.customerBubble);
    const iCustT = parseRGB(iStyle.customerText);
    const iAiC = parseRGB(iStyle.aiBubble);
    const iAiT = parseRGB(iStyle.aiText);

    const webCustC = parseRGB(webStyle.customerBubble);
    const webCustT = parseRGB(webStyle.customerText);
    const webAiC = parseRGB(webStyle.aiBubble);
    const webAiT = parseRGB(webStyle.aiText);

    const blend = (c1, c2, c3) => {
      const r = c1[0] * whatsappOpacity + c2[0] * instagramOpacity + c3[0] * websiteUiOpacity;
      const g = c1[1] * whatsappOpacity + c2[1] * instagramOpacity + c3[1] * websiteUiOpacity;
      const b = c1[2] * whatsappOpacity + c2[2] * instagramOpacity + c3[2] * websiteUiOpacity;
      return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
    };

    const customerBubbleColor = blend(wCustC, iCustC, webCustC);
    const customerTextColor = blend(wCustT, iCustT, webCustT);
    const aiBubbleColor = blend(wAiC, iAiC, webAiC);
    const aiTextColor = blend(wAiT, iAiT, webAiT);
    
    const styleBorderRadius = wStyle.borderRadius * whatsappOpacity + 
                              iStyle.borderRadius * instagramOpacity + 
                              webStyle.borderRadius * websiteUiOpacity;

    // RENDER MESSAGE BUBBLES
    let renderY = chatContentMinY - state.scrollOffset;

    ctx.save();
    ctx.beginPath();
    ctx.rect(destX - 10, activeMinY, destW + 20, activeMaxY - activeMinY);
    ctx.clip();

    bubblesToDraw.forEach(b => {
      const y = renderY + b.yOffset;
      if (y + b.height >= activeMinY - 20 && y <= activeMaxY + 20) {
        let bubbleX = (b.sender === 'customer') ? (activeX + activeW - b.width) : activeX;

        ctx.save();
        ctx.globalAlpha = b.opacity;

        ctx.translate(bubbleX + b.width / 2, y + b.height / 2);
        ctx.scale(b.scale, b.scale);
        ctx.translate(-(bubbleX + b.width / 2), -(y + b.height / 2));

        const bubbleColor = (b.sender === 'customer') ? customerBubbleColor : aiBubbleColor;
        const textColor = (b.sender === 'customer') ? customerTextColor : aiTextColor;
        drawBubble(bubbleX, y, b.width, b.height, styleBorderRadius, bubbleColor);
        
        ctx.font = '500 14px "Inter", -apple-system, sans-serif';
        ctx.fillStyle = textColor;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        const lineHeight = 20;
        const paddingX = 14;
        const paddingY = 10;
        b.lines.forEach((line, lineIdx) => {
          ctx.fillText(line, bubbleX + paddingX, y + paddingY + lineIdx * lineHeight);
        });
        ctx.restore();
      }
      renderY += b.height + spacing;
    });

    // ── ANIMATED TYPING INDICATOR BUBBLE (three bouncing dots) ──
    if (state.state === 'ai_thinking') {
      const dotBubbleW = 64;
      const dotBubbleH = 42;
      const dotBubbleX = activeX;
      const dotBubbleY = renderY;

      // Only draw if inside clip region
      if (dotBubbleY < activeMaxY) {
        ctx.save();
        // Draw bubble background
        drawBubble(dotBubbleX, dotBubbleY, dotBubbleW, dotBubbleH, styleBorderRadius, aiBubbleColor);

        // Animate three dots
        const dotRadius = 5;
        const dotSpacing = 16;
        const totalDotsW = dotRadius * 2 * 3 + dotSpacing * 2;
        const dotStartX = dotBubbleX + (dotBubbleW - totalDotsW) / 2 + dotRadius;
        const dotCenterY = dotBubbleY + dotBubbleH / 2;
        const bounceAmp = 5;
        const bounceSpeed = 6.0;
        const phase = state.time * bounceSpeed;

        // Blend dot color (slightly lighter than bubble)
        const dotColorR = 120 * whatsappOpacity + 120 * instagramOpacity + 120 * websiteUiOpacity;
        const dotColorG = 130 * whatsappOpacity + 130 * instagramOpacity + 130 * websiteUiOpacity;
        const dotColorB = 140 * whatsappOpacity + 140 * instagramOpacity + 140 * websiteUiOpacity;
        ctx.fillStyle = `rgb(${Math.round(dotColorR)}, ${Math.round(dotColorG)}, ${Math.round(dotColorB)})`;

        for (let d = 0; d < 3; d++) {
          const dotX = dotStartX + d * (dotRadius * 2 + dotSpacing);
          const dotY = dotCenterY + Math.sin(phase + d * 1.2) * bounceAmp;
          ctx.beginPath();
          ctx.arc(dotX, dotY, dotRadius, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }
    }

    ctx.restore();

    // Bottom input bar typing text overlay (unified for WhatsApp, Instagram, and Kllezo Bot)
    const bottomInputY = destY + destH - 77;
    const cursorStr = (state.state === 'customer_typing' && Math.floor(state.time * 4.0) % 2 === 0) ? '|' : '';
    const textToDraw = (state.state === 'customer_typing' || state.state === 'customer_pause') ? (state.inputText + cursorStr) : '';
    
    if (textToDraw) {
      ctx.save();
      
      // Calculate background color dynamically to cover the baked-in placeholder
      const wBg = [255, 255, 255];
      const iBg = [242, 242, 242];
      const webBg = [255, 255, 255];
      const bgR = wBg[0] * whatsappOpacity + iBg[0] * instagramOpacity + webBg[0] * websiteUiOpacity;
      const bgG = wBg[1] * whatsappOpacity + iBg[1] * instagramOpacity + webBg[1] * websiteUiOpacity;
      const bgB = wBg[2] * whatsappOpacity + iBg[2] * instagramOpacity + webBg[2] * websiteUiOpacity;
      
      ctx.fillStyle = `rgb(${Math.round(bgR)}, ${Math.round(bgG)}, ${Math.round(bgB)})`;
      
      // Cover the placeholder
      const coverX = destX + 52;
      const coverW = destW - 150;
      ctx.fillRect(coverX, bottomInputY - 12, coverW, 24);
      
      // Blend text color
      const wText = [17, 27, 33];
      const iText = [0, 0, 0];
      const webText = [55, 65, 81];
      const txR = wText[0] * whatsappOpacity + iText[0] * instagramOpacity + webText[0] * websiteUiOpacity;
      const txG = wText[1] * whatsappOpacity + iText[1] * instagramOpacity + webText[1] * websiteUiOpacity;
      const txB = wText[2] * whatsappOpacity + iText[2] * instagramOpacity + webText[2] * websiteUiOpacity;
      
      ctx.font = '12px "Inter", -apple-system, sans-serif';
      ctx.fillStyle = `rgb(${Math.round(txR)}, ${Math.round(txG)}, ${Math.round(txB)})`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(textToDraw, destX + 52, bottomInputY);
      ctx.restore();
    }

    // (Typing indicator is rendered inline as a bouncing-dots bubble above)

    ctx.restore(); // end screen clip

  } else {
    ctx.font = '20px "Inter", sans-serif';
    ctx.fillStyle = 'rgba(247, 243, 235, 0.4)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('L O A D I N G  A S S E T S...', w / 2, h / 2);
  }
}

/* ═══════════════════════════════════════════
   2. LIGHTING
   ═══════════════════════════════════════════ */
const mainAmbientLight = new THREE.AmbientLight(0xF5F3EE, 1.8);
scene.add(mainAmbientLight);  // strong fill — screens are pure diffuse

const sun = new THREE.DirectionalLight(0xF5F3EE, 0.3);
sun.position.set(20, 40, 30);
scene.add(sun);

// Powerful zone lights
const lightContent = new THREE.PointLight(0xffffff, 1.0, 150);
lightContent.position.set(0, 8, -90);
scene.add(lightContent);

const lightWebsites = new THREE.PointLight(0xFFD27D, 1.2, 150);
lightWebsites.position.set(0, 5, -220);
scene.add(lightWebsites);

const lightTexting = new THREE.PointLight(0xFFE8CC, 0.8, 150);
lightTexting.position.set(0, 3, -360);
scene.add(lightTexting);

const lightEco = new THREE.PointLight(0xffffff, 0.7, 120);
lightEco.position.set(0, 0, -430);
scene.add(lightEco);

/* ═══════════════════════════════════════════
   3. CAMERA PATH
   ═══════════════════════════════════════════ */
const CAM_PATH = new THREE.CatmullRomCurve3([
  new THREE.Vector3(0,   2,   -30),  // t=0.00  Hero
  new THREE.Vector3(10,  3,   -50),  // t=0.05
  new THREE.Vector3(20,  4,   -70),  // t=0.10  Alongside giant phone
  new THREE.Vector3(22,  3,   -95),  // t=0.15  Front of phone screen
  new THREE.Vector3(2,   1,  -115),  // t=0.20  Front of phone screen
  new THREE.Vector3(0,   0.0, -140), // t=0.25  Departing Content
  new THREE.Vector3(0,   4.5, -180), // t=0.28  Entering website canyon
  new THREE.Vector3(0,   4.5, -215), // t=0.32  Website Row 2
  new THREE.Vector3(0,   4.5, -240), // t=0.36  Website Row 3
  new THREE.Vector3(0,   4.5, -255), // t=0.40  Leaving Row 3
  new THREE.Vector3(0,   4.5, -271), // t=0.44  Transition 1 empty travel (shortened)
  new THREE.Vector3(0,   4.5, -275), // t=0.48  Calling entry — parked at z=-275
  new THREE.Vector3(0,   4.5, -275), // t=0.52  Parked at Calling
  new THREE.Vector3(0,   4.5, -275), // t=0.55  Parked at Calling
  new THREE.Vector3(0,   4.5, -275), // t=0.58  Calling hold
  new THREE.Vector3(0,   4.5, -295), // t=0.61  Calling hold end / transition 2 starts
  new THREE.Vector3(0,   4.5, -330), // t=0.65  Transition 2 travel
  new THREE.Vector3(0,   4.5, -365), // t=0.68  Texting entry
  new THREE.Vector3(0,   4.5, -365), // t=0.72  Parked at Texting
  new THREE.Vector3(0,   4.5, -365), // t=0.75  Texting hold
  new THREE.Vector3(0,   4.5, -365), // t=0.78  Exit Texting
  new THREE.Vector3(0,   4.5, -365), // t=0.80  Website Bot hold
  new THREE.Vector3(0,   4.5, -385), // t=0.84  Transition 3 travel space (absorb phone)
  new THREE.Vector3(0,   4.5, -410), // t=0.88  Ecosystem entry (fading in centerpiece logo)
  new THREE.Vector3(0,   4.5, -420), // t=0.93  Ecosystem orbs reveal
  new THREE.Vector3(0,   4.5, -420), // t=1.00  Final framing
], false, 'catmullrom', 0.5);

const LOOK_PATH = new THREE.CatmullRomCurve3([
  new THREE.Vector3(0,   0,   -65),  // t=0.00
  new THREE.Vector3(0,   0,   -85),  // t=0.05
  new THREE.Vector3(-2,  0,  -110),  // t=0.10
  new THREE.Vector3(-6,  0,  -135),  // t=0.15
  new THREE.Vector3(0,   0,  -150),  // t=0.20
  new THREE.Vector3(0,   0,  -180),  // t=0.25
  new THREE.Vector3(0,   4.5, -220),  // t=0.28  Look ahead into canyon
  new THREE.Vector3(0,   4.5, -250),  // t=0.32  Through Row 2
  new THREE.Vector3(0,   4.5, -270),  // t=0.36  Through Row 3
  new THREE.Vector3(0,   4.5, -290),  // t=0.40  Leaving Row 3
  new THREE.Vector3(0,   4.5, -291),  // t=0.44  Transition 1 travel
  new THREE.Vector3(0,   4.5, -295),  // t=0.48  Look at Calling screens (positioned at z=-290)
  new THREE.Vector3(0,   4.5, -295),  // t=0.52
  new THREE.Vector3(0,   4.5, -295),  // t=0.55
  new THREE.Vector3(0,   4.5, -295),  // t=0.58
  new THREE.Vector3(0,   4.5, -315),  // t=0.61  Transition 2 travel starts
  new THREE.Vector3(0,   4.5, -350),  // t=0.65  Transition 2 travel mid
  new THREE.Vector3(0,   4.5, -375.2),// t=0.68  Look at Texting phone
  new THREE.Vector3(0,   4.5, -375.2),// t=0.72
  new THREE.Vector3(0,   4.5, -375.2),// t=0.75
  new THREE.Vector3(0,   4.5, -375.2),// t=0.78
  new THREE.Vector3(0,   4.5, -375.2),// t=0.80  Look at texting phone
  new THREE.Vector3(0,   4.5, -430),  // t=0.84  Look ahead to ecosystem
  new THREE.Vector3(0,   4.5, -470),  // t=0.88  Ecosystem framing
  new THREE.Vector3(0,   4.5, -470),  // t=0.93
  new THREE.Vector3(0,   4.5, -470),  // t=1.00  Final frame
], false, 'catmullrom', 0.5);


/* ═══════════════════════════════════════════
   4. SCROLL SYSTEM
   ═══════════════════════════════════════════ */
let scrollRaw = 0;
let scrollProgress = 0; // smoothed 0→1
let hoveredNodeIdx = -1;
let lastEcoTime = performance.now();

let maxSafeT = 1.0;
function updateMaxSafeT() {
  maxSafeT = 1.0;
}

// Initial calculation
updateMaxSafeT();

// Window resize listener helper to update maxSafeT
window.addEventListener('resize', () => {
  updateMaxSafeT();
});

// Strict Section-Based Storyflow Gesture Listeners
document.body.style.overflow = 'hidden';

// ── WEBSITE EXPERIENCES SCROLL MODE ──
// When the user is parked at section 2 (Website Experiences), scroll
// advances the website billboards instead of triggering section transitions.
let websiteScrollProgress = 0.0; // 0 = entry, 1 = exit
const WEBSITE_SCROLL_STEPS = 18;  // number of scroll ticks to traverse the zone
let websiteScrollTick = 0;         // integer 0..WEBSITE_SCROLL_STEPS

function isWebsiteScrollMode() {
  return currentSectionIdx === 2 && sectionTransitionProgress >= 1.0;
}

function advanceWebsiteScroll(direction) {
  // direction: +1 = forward (scroll down), -1 = backward (scroll up)
  websiteScrollTick = Math.max(0, Math.min(WEBSITE_SCROLL_STEPS, websiteScrollTick + direction));
  websiteScrollProgress = websiteScrollTick / WEBSITE_SCROLL_STEPS;

  if (direction > 0 && websiteScrollTick >= WEBSITE_SCROLL_STEPS) {
    // User has scrolled past the end of website section → enter Calling
    websiteScrollTick = WEBSITE_SCROLL_STEPS;
    triggerSectionTransition(currentSectionIdx + 1);
    return;
  }
  if (direction < 0 && websiteScrollTick <= 0) {
    // User scrolled back to start → return to Content Engine
    websiteScrollTick = 0;
    triggerSectionTransition(currentSectionIdx - 1);
  }
}

function handleWheelGesture(e) {
  const now = performance.now();
  if (now - lastGestureTime < GESTURE_COOLDOWN) return;
  if (sectionTransitionProgress < 1.0) return;

  // Website Experiences: intercept scroll to drive billboard progress
  if (isWebsiteScrollMode()) {
    if (e.deltaY > 5) {
      advanceWebsiteScroll(+1);
      lastGestureTime = now;
    } else if (e.deltaY < -5) {
      advanceWebsiteScroll(-1);
      lastGestureTime = now;
    }
    return;
  }

  if (isSectionLocked(currentSectionIdx)) return;

  if (e.deltaY > 5) {
    triggerSectionTransition(currentSectionIdx + 1);
    lastGestureTime = now;
  } else if (e.deltaY < -5) {
    triggerSectionTransition(currentSectionIdx - 1);
    lastGestureTime = now;
  }
}

window.addEventListener('wheel', handleWheelGesture, { passive: false });

let touchStartY = 0;
window.addEventListener('touchstart', e => {
  touchStartY = e.touches[0].clientY;
}, { passive: true });

window.addEventListener('touchmove', e => {
  const touchEndY = e.touches[0].clientY;
  const deltaY = touchStartY - touchEndY; // positive = swipe up / scroll down

  const now = performance.now();
  if (now - lastGestureTime < GESTURE_COOLDOWN) return;
  if (sectionTransitionProgress < 1.0) return;

  // Website Experiences: intercept touch to drive billboard progress
  if (isWebsiteScrollMode()) {
    if (deltaY > 30) {
      advanceWebsiteScroll(+1);
      lastGestureTime = now;
    } else if (deltaY < -30) {
      advanceWebsiteScroll(-1);
      lastGestureTime = now;
    }
    return;
  }

  if (isSectionLocked(currentSectionIdx)) return;

  if (deltaY > 30) {
    triggerSectionTransition(currentSectionIdx + 1);
    lastGestureTime = now;
  } else if (deltaY < -30) {
    triggerSectionTransition(currentSectionIdx - 1);
    lastGestureTime = now;
  }
}, { passive: true });

window.addEventListener('keydown', e => {
  const now = performance.now();
  if (now - lastGestureTime < GESTURE_COOLDOWN) return;
  if (sectionTransitionProgress < 1.0) return;

  // Website Experiences: intercept key to drive billboard progress
  if (isWebsiteScrollMode()) {
    if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ') {
      advanceWebsiteScroll(+1);
      lastGestureTime = now;
    } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
      advanceWebsiteScroll(-1);
      lastGestureTime = now;
    }
    return;
  }

  if (isSectionLocked(currentSectionIdx)) return;

  if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ') {
    triggerSectionTransition(currentSectionIdx + 1);
    lastGestureTime = now;
  } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
    triggerSectionTransition(currentSectionIdx - 1);
    lastGestureTime = now;
  }
});

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
    color: 0x0F1216, roughness: 0.15, metalness: 0.85,
    envMapIntensity: 1.2,
  }),
  phoneScreen: new THREE.MeshStandardMaterial({
    color: PALETTE.bg, roughness: 0.8, metalness: 0.1,
    emissive: PALETTE.bg, emissiveIntensity: 0.5,
  }),
  reelFrame: new THREE.MeshStandardMaterial({
    color: PALETTE.steel, roughness: 0.3, metalness: 0.6,
    emissive: 0x000000, emissiveIntensity: 0,
  }),
  pageArchitecture: new THREE.MeshStandardMaterial({
    color: PALETTE.bg, roughness: 0.4, metalness: 0.5,
    transparent: true, opacity: 0.95,
  }),
  pageWireframe: new THREE.MeshStandardMaterial({
    color: PALETTE.steel, roughness: 1, metalness: 0,
    transparent: true, opacity: 0.25,
    wireframe: true,
  }),
  ring: new THREE.MeshStandardMaterial({
    color: PALETTE.champagne, roughness: 0.1, metalness: 0.9,
    emissive: PALETTE.champagne, emissiveIntensity: 0.8,
    transparent: true, opacity: 0.85,
  }),
  glow: new THREE.MeshStandardMaterial({
    color: PALETTE.gold, roughness: 0, metalness: 1,
    emissive: PALETTE.gold, emissiveIntensity: 0.8,
    transparent: true, opacity: 0.9,
  }),
  calCell: new THREE.MeshStandardMaterial({
    color: 0x0A0C10, roughness: 0.5, metalness: 0.4,
    emissive: 0x000000, emissiveIntensity: 0,
    transparent: true, opacity: 0.8,
  }),
  messageBubble: new THREE.MeshStandardMaterial({
    color: 0x0A0C10, roughness: 0.5, metalness: 0.3,
    emissive: 0x000000, emissiveIntensity: 0,
    transparent: true, opacity: 0.88,
  }),
  messageBubbleAlt: new THREE.MeshStandardMaterial({
    color: PALETTE.bg, roughness: 0.6, metalness: 0.2,
    emissive: PALETTE.bg, emissiveIntensity: 0.2,
    transparent: true, opacity: 0.75,
  }),
  nodeSphere: new THREE.MeshStandardMaterial({
    color: PALETTE.champagne, roughness: 0.2, metalness: 0.8,
    emissive: PALETTE.champagne, emissiveIntensity: 0.5,
  }),
  footage: new THREE.MeshStandardMaterial({
    color: PALETTE.bg, roughness: 0.8, metalness: 0,
    transparent: true, opacity: 0.85,
    side: THREE.DoubleSide,
    emissive: PALETTE.bg, emissiveIntensity: 0.4,
  }),
  timeline: new THREE.MeshStandardMaterial({
    color: 0x405080, roughness: 0.3, metalness: 0.6,
    emissive: 0x405080, emissiveIntensity: 0.2,
    transparent: true, opacity: 0.9,
  }),
  waveform: new THREE.MeshStandardMaterial({
    color: PALETTE.gold, roughness: 0.1, metalness: 0.9,
    emissive: PALETTE.gold, emissiveIntensity: 0.5,
    transparent: true, opacity: 0.9,
  }),
};

/* ═══════════════════════════════════════════
   LIQUID GOLD GUIDE STREAM (LIVING ELEMENT)
   ═══════════════════════════════════════════ */
const pTopLeft = new THREE.Vector3(-25, 18.5, -470);
const pCenter = new THREE.Vector3(0, 4.5, -470);
const pTopRight = new THREE.Vector3(25, 18.5, -470);
const pBottomRight = new THREE.Vector3(25, -9.5, -470);
const pBottomLeft = new THREE.Vector3(-25, -9.5, -470);

// Helper function to create separate procedural molten gold shader material copies for each stream
function createGoldMaterial(initialOpacity = 0.0) {
  return new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0.0 },
      opacity: { value: initialOpacity },
      progress: { value: 0.0 }
    },
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vPosition;
      varying vec3 vViewPosition;
      uniform float time;
      uniform float progress;

      // GPU Value Noise 3D
      float hash(vec3 p) {
        p = fract(p * 0.3183099 + vec3(0.1));
        p *= 17.0;
        return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
      }

      float noise(vec3 x) {
        vec3 i = floor(x);
        vec3 f = fract(x);
        f = f * f * (3.0 - 2.0 * f);
        return mix(mix(mix(hash(i + vec3(0.0,0.0,0.0)), hash(i + vec3(1.0,0.0,0.0)), f.x),
                       mix(hash(i + vec3(0.0,1.0,0.0)), hash(i + vec3(1.0,1.0,0.0)), f.x), f.y),
                   mix(mix(hash(i + vec3(0.0,0.0,1.0)), hash(i + vec3(1.0,0.0,1.0)), f.x),
                       mix(hash(i + vec3(0.0,1.0,1.0)), hash(i + vec3(1.0,1.0,1.0)), f.x), f.y), f.z);
      }

      void main() {
        vUv = uv;
        vNormal = normalize(normalMatrix * normal);
        
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vViewPosition = -mvPosition.xyz;
        vPosition = position;

        // Mask to only displace facing center of the tube, tapering at edges
        float edgeMask = abs(vNormal.z);

        // 1. Viscosity changes: slow frequency scaling over time
        float viscosity = 0.5 + 0.35 * sin(time * 0.4);

        // 2. Organic turbulence: coordinate warping
        vec3 warp = vec3(
          noise(position * 0.08 - time * 0.2),
          noise(position * 0.10 + time * 0.15),
          noise(position * 0.06 - time * 0.1)
        ) * 0.45;
        vec3 warpedPos = position + warp;

        // 3. Layered FBM displacement with viscosity modulation
        float breathing = noise(warpedPos * (0.16 + 0.04 * viscosity) + vec3(0.0, -time * 0.35, 0.0)) * 0.08;
        float waves = noise(warpedPos * (0.5 + 0.15 * viscosity) + vec3(0.0, -time * 1.1, 0.0)) * 0.04;
        float shimmer = noise(warpedPos * 1.6 + vec3(0.0, -time * 3.2, 0.0)) * 0.015;

        // 4. Breathing amplitude pulse every few seconds — subtle, elegant
        // Primary slow breath: barely noticeable expansion/contraction
        float breathingPulse = 1.0 + 0.12 * sin(time * 0.55);
        // Secondary micro-viscosity variation at a different beat
        float breathSlow = 1.0 + 0.06 * sin(time * 0.22 + position.z * 0.008);

        // 5. Micro pressure pulses traveling along the tube — gentler
        float pressure = sin(position.y * 2.5 - time * 6.5) * 0.007 * (0.5 + 0.5 * sin(time * 1.2));
        
        float displacement = (breathing * breathingPulse * breathSlow + waves + shimmer + pressure) * edgeMask * progress;
        vec3 deformedPosition = position + normal * displacement;

        gl_Position = projectionMatrix * modelViewMatrix * vec4(deformedPosition, 1.0);
      }
    `,
    fragmentShader: `
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vPosition;
      varying vec3 vViewPosition;
      
      uniform float time;
      uniform float opacity;
      uniform float progress;

      // GPU Value Noise 3D
      float hash(vec3 p) {
        p = fract(p * 0.3183099 + vec3(0.1));
        p *= 17.0;
        return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
      }

      float noise(vec3 x) {
        vec3 i = floor(x);
        vec3 f = fract(x);
        f = f * f * (3.0 - 2.0 * f);
        return mix(mix(mix(hash(i + vec3(0.0,0.0,0.0)), hash(i + vec3(1.0,0.0,0.0)), f.x),
                       mix(hash(i + vec3(0.0,1.0,0.0)), hash(i + vec3(1.0,1.0,0.0)), f.x), f.y),
                   mix(mix(hash(i + vec3(0.0,0.0,1.0)), hash(i + vec3(1.0,0.0,1.0)), f.x),
                       mix(hash(i + vec3(0.0,1.0,1.0)), hash(i + vec3(1.0,1.0,1.0)), f.x), f.y), f.z);
      }

      float fbm(vec3 p) {
        float value = 0.0;
        float amplitude = 0.5;
        float frequency = 1.0;
        for (int i = 0; i < 3; i++) {
          value += amplitude * noise(p * frequency);
          amplitude *= 0.5;
          frequency *= 2.0;
        }
        return value;
      }

      void main() {
        // Discard pixels beyond organic fluid progress boundary along the tube length (vUv.x)
        float leadingEdgeNoise = noise(vec3(vUv.y * 5.0, time * 2.0, 0.0)) * 0.015;
        float organicProgress = progress - leadingEdgeNoise;
        if (vUv.x > organicProgress) {
          discard;
        }

        // Domain warping coordinates with local flow speed variations
        float flowTime = time * 0.42 + 0.16 * sin(time * 0.45 + vUv.x * 2.5) + 0.08 * noise(vec3(vUv.x * 3.5, time * 0.7, 0.0));
        vec3 p = vec3(vUv.y * 2.5, vUv.x * 10.0 - flowTime, time * 0.08);
        
        vec3 q = vec3(
          fbm(p + vec3(0.0)),
          fbm(p + vec3(4.1, 1.2, 0.8)),
          fbm(p + vec3(1.6, 7.3, 3.2))
        );
        
        vec3 r = vec3(
          fbm(p + 3.0 * q + vec3(flowTime * 0.2, 0.0, 0.0)),
          fbm(p + 3.0 * q + vec3(2.5, flowTime * 0.28, 1.2)),
          fbm(p + 3.0 * q + vec3(0.0, 3.8, flowTime * 0.12))
        );
        
        float veins = fbm(p + 4.0 * r);

        // Palette definitions (Apple Cinematic Gold)
        vec3 deepGold = vec3(0.38, 0.22, 0.03); // Deep amber/gold
        vec3 richAmber = vec3(0.70, 0.48, 0.12); // Golden amber
        vec3 champagne = vec3(0.90, 0.78, 0.50); // Champagne gold
        vec3 highlights = vec3(0.99, 0.94, 0.82); // Molten highlights

        vec3 color = mix(deepGold, richAmber, veins);
        color = mix(color, champagne, smoothstep(0.4, 0.75, veins));
        color = mix(color, highlights, smoothstep(0.7, 0.95, veins));

        // Normal-based lighting
        vec3 N = normalize(vNormal);
        vec3 V = normalize(vViewPosition);
        
        // Faux reflection mapping using noise-warped coordinates
        vec3 reflectDir = reflect(-V, N);
        float reflPattern = fbm(reflectDir * 3.0 + vec3(0.0, flowTime * 0.35, 0.0));
        vec3 reflColor = mix(richAmber, highlights, reflPattern);
        
        // Fresnel calculation
        float fresnel = pow(1.0 - max(0.0, dot(N, V)), 4.0);
        color = mix(color, reflColor, fresnel * 0.5);

        // Clearcoat specularity
        vec3 L = normalize(vec3(0.4, 0.8, 0.6));
        vec3 H = normalize(L + V);
        float spec = pow(max(0.0, dot(N, H)), 96.0) * 1.5;
        color += highlights * spec;

        // Subtle emissive glow in hot molten gold channels
        float glowIntensity = smoothstep(0.5, 0.9, veins);
        vec3 glow = champagne * glowIntensity * 0.5 * (1.0 + 0.3 * sin(time * 2.0));
        color += glow;

        // Edge fade near start and end of path curves along tube length (vUv.x)
        float edgeFade = smoothstep(0.0, 0.08, vUv.x) * (1.0 - smoothstep(0.92, 1.0, vUv.x));

        gl_FragColor = vec4(color, opacity * edgeFade);
      }
    `,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide
  });
}

// Custom linear path curve helper to prevent spline-of-splines overshoot wiggling
class LinearPathCurve extends THREE.Curve {
  constructor(points) {
    super();
    this.points = points;
  }
  getPoint(t, optionalTarget = new THREE.Vector3()) {
    const points = this.points;
    const len = points.length - 1;
    const index = t * len;
    const i = Math.floor(index);
    const weight = index - i;
    if (i >= len) return optionalTarget.copy(points[len]);
    if (i < 0) return optionalTarget.copy(points[0]);
    return optionalTarget.lerpVectors(points[i], points[i + 1], weight);
  }
}

// Geometry helper to sample growing path along curve in a sliding progress window
function getGrowingTubeGeometry(curve, startProgress, endProgress, radius = 0.42, segments = 180) {
  const subPoints = [];
  const samples = segments;
  const range = endProgress - startProgress;
  for (let i = 0; i <= samples; i++) {
    const pct = startProgress + (i / samples) * range;
    subPoints.push(curve.getPointAt(pct)); // Use getPointAt for uniform spacing along the curve
  }
  const subCurve = new LinearPathCurve(subPoints);
  return new THREE.TubeGeometry(
    subCurve,
    420, // much smoother along length
    radius,
    96,  // perfectly round
    false
  );
}

// Geometry updates with resource disposal
function updateMeshGeometry(mesh, newGeom) {
  const oldGeom = mesh.geometry;
  mesh.geometry = newGeom;
  if (oldGeom) {
    oldGeom.dispose();
  }
}

// Points for Segment 1: Hero to Content Engine
// TRANSLATED: dx=+3.5 to shift the entire spline rightward into the corridor center
const ptsHeroToContent = [
  new THREE.Vector3(11.5,  -8.5, -30),
  new THREE.Vector3(13.5,  -8.7, -38),
  new THREE.Vector3(15.5,  -9.3, -46),
  new THREE.Vector3(14.5, -10.0, -54),
  new THREE.Vector3(12.5, -10.5, -62),
  new THREE.Vector3(11.5, -11.0, -70),
  new THREE.Vector3(12.5, -10.5, -78),
  new THREE.Vector3(14.5, -10.0, -86),
  new THREE.Vector3(16.5, -10.5, -94),
  new THREE.Vector3(15.5, -11.5, -100),
  new THREE.Vector3(13.5, -13.0, -108),
  new THREE.Vector3(12.5, -14.5, -114),
  new THREE.Vector3(13.5, -15.5, -120),
  new THREE.Vector3(15.5, -14.5, -128),
  new THREE.Vector3(14.5, -13.0, -136),
  new THREE.Vector3(13.5, -11.5, -145),
  new THREE.Vector3(12.5, -10.5, -150),
  new THREE.Vector3(11.5, -10.0, -155)
];

// Points for Segment 2: Content Engine to Website Experiences
// TRANSLATED: dx=+3.5 to shift the entire spline rightward into the corridor center
const ptsContentToWebsites = [
  new THREE.Vector3(11.5,  -10.0, -155),       // Connected to Segment 1 end
  new THREE.Vector3(8.5,   -6.0, -162),
  new THREE.Vector3(5.5,   -2.0, -170),
  new THREE.Vector3(3.5,    1.0, -180),        // Enters center corridor gap
  new THREE.Vector3(2.5,    3.0, -190),        // Corridor
  new THREE.Vector3(1.5,    2.5, -200),        // Corridor
  new THREE.Vector3(2.5,    1.0, -210),        // Corridor
  new THREE.Vector3(4.5,    0.0, -220),        // Corridor
  new THREE.Vector3(5.5,    2.0, -230),        // Corridor
  new THREE.Vector3(4.5,    4.0, -240),        // Corridor
  new THREE.Vector3(2.5,    3.0, -250),        // Corridor
  new THREE.Vector3(1.5,    2.5, -258),        // Corridor
  new THREE.Vector3(2.5,    2.8, -266)         // Connects to Segment 3 at x=2.5
];

// Points for Segment 3: Website Experiences to AI Calling Agents
const ptsWebsitesToCalling = [
  new THREE.Vector3(2.5, 2.8, -266),     // Connects to Segment 2 end in the corridor
  new THREE.Vector3(-1, 2.5, -271),
  new THREE.Vector3(-6, 2.2, -276),
  new THREE.Vector3(-12, 1.8, -281),
  new THREE.Vector3(-18, 1.5, -296),     // Entry of Calling weave on the left
  new THREE.Vector3(-15, 4.5, -296),
  new THREE.Vector3(-10.5, 2.0, -298),
  new THREE.Vector3(-5.25, 7.5, -296),
  new THREE.Vector3(0.0, 2.0, -298),
  new THREE.Vector3(5.25, 7.5, -296),
  new THREE.Vector3(10.5, 2.0, -298),
  new THREE.Vector3(16.5, 7.5, -296),
  new THREE.Vector3(22.0, 2.5, -296)
];

// Points for Segment 4: AI Calling Agents to AI Texting Agents (Reverted to original 15 points)
const ptsCallingToTexting = [
  new THREE.Vector3(22.0, 2.5, -296),
  new THREE.Vector3(14.0, -5.0, -300),
  new THREE.Vector3(6.0, -15.0, -315),
  new THREE.Vector3(-2.0, -18.0, -330),
  new THREE.Vector3(-8.0, -15.0, -345),
  new THREE.Vector3(-12.0, -5.0, -360),
  new THREE.Vector3(-7.5, -2.0, -370),
  new THREE.Vector3(-3.5, 0.1, -374),
  new THREE.Vector3(5.5, 2.2, -376),      // Turn 1 Right Apex (fixed position)
  new THREE.Vector3(-5.5, 4.2, -375),     // Turn 2 Left Apex (fixed position)
  new THREE.Vector3(5.0, 6.2, -376),      // Turn 3 Right Apex (fixed position)
  new THREE.Vector3(-4.5, 8.2, -375),     // Turn 4 Left Apex (fixed position)
  new THREE.Vector3(1.0, 10.2, -376),
  new THREE.Vector3(1.0, 19.0, -378),
  new THREE.Vector3(1.0, 28.0, -380)
];

// Points for Segment 5: AI Texting Agents to Ecosystem Center Logo
const ptsTextingToEcosystem = [
  new THREE.Vector3(1.0, 28.0, -380),     // Starts off-screen at Segment 4's exit
  new THREE.Vector3(0.0, 10.0, -410),     // Descends straight down behind phone
  new THREE.Vector3(0.0, -10.0, -440),    // Deep behind canyon
  new THREE.Vector3(0.0, -32.0, -470),    // Arrives at vertical supply start
  new THREE.Vector3(0.0, -18.0, -470),    // Perfect vertical rise
  new THREE.Vector3(0.0, -6.0, -470),
  new THREE.Vector3(0.0, 4.5, -470)       // Enters Logo center
];

// Custom Cubic Hermite Spline Curve implementation for precise tangent/handle control
class HermiteCurve3 extends THREE.Curve {
  constructor(points, tangents) {
    super();
    this.points = points;
    this.tangents = tangents;
  }
  getPoint(t, optionalTarget = new THREE.Vector3()) {
    const points = this.points;
    const tangents = this.tangents;
    const len = points.length - 1;
    const index = t * len;
    const i = Math.min(len - 1, Math.floor(index));
    const localT = index - i;

    const p0 = points[i];
    const p1 = points[i + 1];
    const t0 = tangents[i];
    const t1 = tangents[i + 1];

    const t2 = localT * localT;
    const t3 = t2 * localT;

    const h00 = 2 * t3 - 3 * t2 + 1;
    const h10 = t3 - 2 * t2 + localT;
    const h01 = -2 * t3 + 3 * t2;
    const h11 = t3 - t2;

    optionalTarget.set(
      h00 * p0.x + h10 * t0.x + h01 * p1.x + h11 * t1.x,
      h00 * p0.y + h10 * t0.y + h01 * p1.y + h11 * t1.y,
      h00 * p0.z + h10 * t0.z + h01 * p1.z + h11 * t1.z
    );
    return optionalTarget;
  }
}

// Helper to compute standard Catmull-Rom tangents at Hermite control points
function computeHermiteTangents(points) {
  const tangents = [];
  const len = points.length;
  for (let i = 0; i < len; i++) {
    let t = new THREE.Vector3();
    if (i === 0) {
      t.subVectors(points[1], points[0]);
    } else if (i === len - 1) {
      t.subVectors(points[len - 1], points[len - 2]);
    } else {
      t.subVectors(points[i + 1], points[i - 1]).multiplyScalar(0.5);
    }
    tangents.push(t);
  }
  return tangents;
}

// Compute tangents for Segment 4 points and override apexes to point vertically (smoothing the corners)
const HermiteTangentsCallingToTexting = computeHermiteTangents(ptsCallingToTexting);
HermiteTangentsCallingToTexting[8] = new THREE.Vector3(0.0, 11.5, 0.0);   // Turn 1 Apex
HermiteTangentsCallingToTexting[9] = new THREE.Vector3(0.0, 11.5, 0.0);   // Turn 2 Apex
HermiteTangentsCallingToTexting[10] = new THREE.Vector3(0.0, 11.5, 0.0);  // Turn 3 Apex
HermiteTangentsCallingToTexting[11] = new THREE.Vector3(0.0, 11.5, 0.0);  // Turn 4 Apex

// Instantiate separate curves
const curveHeroToContent = new THREE.CatmullRomCurve3(ptsHeroToContent, false, 'centripetal');
const curveContentToWebsites = new THREE.CatmullRomCurve3(ptsContentToWebsites, false, 'centripetal');
const curveWebsitesToCalling = new THREE.CatmullRomCurve3(ptsWebsitesToCalling, false, 'centripetal');

// Manually-authored spline using exact Vector3 control points and constant-radius circular bends
const allPointsCallingToTexting = [];

// 1. Entry Swoop (smoothly travel from Calling to the start of Weave)
const entryPtsCallingToTexting = [
  new THREE.Vector3(22.0, 2.5, -296),
  new THREE.Vector3(14.0, -5.0, -300),
  new THREE.Vector3(6.0, -15.0, -315),
  new THREE.Vector3(-2.0, -18.0, -330),
  new THREE.Vector3(-8.0, -15.0, -345),
  new THREE.Vector3(-12.0, -5.0, -360),
  new THREE.Vector3(-7.5, -2.0, -370),
  new THREE.Vector3(-3.5, 0.1, -374),
  new THREE.Vector3(1.0, 1.2, -380) // smooth blend to organic weave start
];
const entryCurveCallingToTexting = new THREE.CatmullRomCurve3(entryPtsCallingToTexting, false, 'centripetal');
for (let i = 0; i < 100; i++) {
  allPointsCallingToTexting.push(entryCurveCallingToTexting.getPoint(i / 100));
}

// ----------------------------------------------------
// NEW SMOOTH ORGANIC WEAVE
// ----------------------------------------------------
const weavePoints = [
  new THREE.Vector3( 1.0, 1.2, -380),
  new THREE.Vector3( 3.2, 2.5, -378),
  new THREE.Vector3( 5.2, 3.6, -374),
  new THREE.Vector3( 3.0, 4.8, -370),
  new THREE.Vector3(-1.0, 5.8, -368),
  new THREE.Vector3(-4.8, 6.9, -370),
  new THREE.Vector3(-6.2, 8.0, -374),
  new THREE.Vector3(-4.5, 9.2, -378),
  new THREE.Vector3(-1.0, 10.2, -380),
  new THREE.Vector3( 3.5, 11.6, -378),
  new THREE.Vector3( 6.2, 13.4, -373),
  new THREE.Vector3( 4.0, 15.5, -369),
  new THREE.Vector3( 0.0, 17.5, -368),
  new THREE.Vector3(-3.8, 19.2, -370),
  new THREE.Vector3(-5.8, 21.2, -374),
  new THREE.Vector3(-4.2, 23.0, -378),
  new THREE.Vector3( 1.0, 28.0, -380)
];
const smoothCurve = new THREE.CatmullRomCurve3( weavePoints, false, "centripetal", 0.25 );
const weavePointsSampled = smoothCurve.getPoints(400);
allPointsCallingToTexting.push(...weavePointsSampled);

const curveCallingToTexting = new LinearPathCurve(allPointsCallingToTexting);
const curveTextingToEcosystem = new THREE.CatmullRomCurve3(ptsTextingToEcosystem, false, 'centripetal');

// The exact cutoff points for each segment when parked at that section's destination
const SEGMENT_CUTOFFS = [
  0.72, // Segment 1 cutoff (terminates exactly at the purple reference line)
  0.42, // Segment 2 cutoff (terminates exactly at the purple cut marker right before the Maison Noir showcase)
  1.00, // Segment 3 cutoff
  1.00, // Segment 4 cutoff
  1.00  // Segment 5 cutoff
];

// Helper function to return stable segment progress when parked
function getParkedSegmentProgress(idx, i, callingAutoplayTime, textingAutoplayTime) {
  const segmentNum = i + 1;
  if (segmentNum < idx) {
    return 1.0;
  }
  if (segmentNum === idx) {
    if (idx === 3) { // AI Calling Agents: includes travel and card weave autoplay
      const autoplayPct = Math.min(1.0, Math.max(0.0, callingAutoplayTime / 2.8));
      return 0.27 + autoplayPct * 0.73;
    }
    if (idx === 4) { // AI Texting Agents: includes travel and phone card weave autoplay
      const autoplayPct = Math.min(1.0, Math.max(0.0, textingAutoplayTime / 12.0));
      return 0.35 + autoplayPct * 0.65;
    }
    return SEGMENT_CUTOFFS[i];
  }
  return 0.0;
}

// Meshes declared globally
const goldMeshes = [];
let branchTLMesh = null;
let branchTRMesh = null;
let branchBLMesh = null;
let branchBRMesh = null;





/* ═══════════════════════════════════════════
   7. PARTICLE SYSTEM — Universal void particles
   ═══════════════════════════════════════════ */
const VOID_COUNT = 3000;
const voidGeo    = new THREE.BufferGeometry();
const voidPos    = new Float32Array(VOID_COUNT * 3);
const voidCol    = new Float32Array(VOID_COUNT * 3);
for (let i = 0; i < VOID_COUNT; i++) {
  const r     = rand(10, 80);
  const theta = rand(0, TAU);
  const phi   = rand(0, PI);
  voidPos[i*3]   = r * Math.sin(phi) * Math.cos(theta) * rand(0.5, 2.0);
  voidPos[i*3+1] = r * Math.sin(phi) * Math.sin(theta) * rand(0.3, 1.2);
  voidPos[i*3+2] = rand(-470, 10);
  // Luxury tech colors: Champagne, Steel Gray, Gold
  const rColor = Math.random();
  let colorHex;
  if (rColor < 0.4)      colorHex = PALETTE.champagne;
  else if (rColor < 0.7) colorHex = PALETTE.steel;
  else                   colorHex = PALETTE.gold;
  const color = new THREE.Color(colorHex);
  const bright = rand(0.5, 1.0);
  voidCol[i*3]   = color.r * bright;
  voidCol[i*3+1] = color.g * bright;
  voidCol[i*3+2] = color.b * bright;
}
voidGeo.setAttribute('position', new THREE.BufferAttribute(voidPos, 3));
voidGeo.setAttribute('color',    new THREE.BufferAttribute(voidCol, 3));
const voidMat = new THREE.PointsMaterial({
  size: 0.12, vertexColors: true,
  transparent: true, opacity: 0.20,
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
    color: PALETTE.champagne, size: 0.14,
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

(function buildContent() {
  window.isInspecting = false;
  window.inspectedCardObj = null;
  window.inspectionClone = null;

  function enterInspection(cardObj) {
    if (window.isInspecting) return;
    window.isInspecting = true;
    window.inspectedCardObj = cardObj;

    const overlay = document.getElementById('gallery-inspection-overlay');
    const container = document.getElementById('inspection-card-container');
    const mainGalleryOverlay = document.getElementById('content-gallery-overlay');

    // 1. Save original card element reference and screen bounds
    const originalCard = cardObj.element;
    const rect = originalCard.getBoundingClientRect();

    // 2. Clone ONLY .gallery-card-inner
    const originalInner = originalCard.querySelector('.gallery-card-inner');
    const clone = originalInner.cloneNode(true);
    window.inspectionClone = clone;

    // 3. Position clone exactly over original using position: fixed
    clone.style.position = 'fixed';
    clone.style.left = rect.left + 'px';
    clone.style.top = rect.top + 'px';
    clone.style.width = rect.width + 'px';
    clone.style.height = rect.height + 'px';
    clone.style.margin = '0';
    clone.style.transform = 'none';
    clone.style.transformOrigin = 'center center';
    clone.style.zIndex = '2001';
    clone.style.willChange = 'transform, left, top, width, height';

    // 4. Append the clone into the overlay container
    container.innerHTML = '';
    container.appendChild(clone);

    // 5. Hide original card (stays in marquee layout, opacity 0)
    originalCard.style.opacity = '0';
    originalCard.style.pointerEvents = 'none';
    originalCard.classList.add('inspected-original');

    // 6. Dim the gallery layer (applies filter blur & brightness)
    mainGalleryOverlay.classList.add('dimmed');

    // 7. Show translucent backdrop
    overlay.classList.add('active');

    // 8. Calculate responsive target size
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const originalAspect = rect.width / rect.height;

    // Target max width: 65vw on desktop, 85vw on smaller screens
    const maxW = vw > 1024 ? vw * 0.65 : vw * 0.85;
    // Target max height: 65vh
    const maxH = vh * 0.65;

    let targetWidth = maxW;
    let targetHeight = targetWidth / originalAspect;

    if (targetHeight > maxH) {
      targetHeight = maxH;
      targetWidth = targetHeight * originalAspect;
    }

    // Centering coordinates
    const centerX = (vw - targetWidth) / 2;
    const centerY = (vh - targetHeight) / 2;

    // 9. Animate clone - 800ms back.out ease (spring with slight overshoot)
    // To ensure perfect stillness and remove perspective distortion at the end,
    // we clear the transform and preserve-3d effects onComplete.
    gsap.killTweensOf(clone);
    gsap.to(clone, {
      left: centerX,
      top: centerY,
      width: targetWidth,
      height: targetHeight,
      duration: 0.8,
      ease: "back.out(1.2)",
      onStart: () => {
        clone.style.transform = 'translateZ(0px) rotate(0deg)';
      },
      onComplete: () => {
        clone.style.transform = 'none'; // remove perspective/depth distortion when fully settled
      }
    });

    // 10. Click on clone to close
    clone.addEventListener('click', (e) => {
      e.stopPropagation();
      exitInspection();
    });
  }

  function exitInspection() {
    if (!window.isInspecting || !window.inspectedCardObj || !window.inspectionClone) return;

    const cardObj = window.inspectedCardObj;
    const clone = window.inspectionClone;
    const overlay = document.getElementById('gallery-inspection-overlay');
    const container = document.getElementById('inspection-card-container');
    const mainGalleryOverlay = document.getElementById('content-gallery-overlay');

    const originalCard = cardObj.element;

    // Gradually fade backdrop and un-dim gallery
    overlay.classList.remove('active');
    mainGalleryOverlay.classList.remove('dimmed');

    // Get current positions of clone and set up frame-by-frame tracking animation to the moving original card
    const startLeft = parseFloat(clone.style.left) || 0;
    const startTop = parseFloat(clone.style.top) || 0;
    const startWidth = parseFloat(clone.style.width) || 0;
    const startHeight = parseFloat(clone.style.height) || 0;

    const animObj = { progress: 0 };
    gsap.killTweensOf(clone);
    gsap.to(animObj, {
      progress: 1,
      duration: 0.8,
      ease: "expo.out",
      onUpdate: () => {
        const p = animObj.progress;
        const currentRect = originalCard.getBoundingClientRect();

        const curLeft = startLeft + (currentRect.left - startLeft) * p;
        const curTop = startTop + (currentRect.top - startTop) * p;
        const curWidth = startWidth + (currentRect.width - startWidth) * p;
        const curHeight = startHeight + (currentRect.height - startHeight) * p;

        clone.style.left = curLeft + 'px';
        clone.style.top = curTop + 'px';
        clone.style.width = curWidth + 'px';
        clone.style.height = curHeight + 'px';
      },
      onComplete: () => {
        // Destroy clone
        container.innerHTML = '';
        // Reveal original card
        originalCard.style.opacity = '1';
        originalCard.style.pointerEvents = 'auto';
        originalCard.classList.remove('inspected-original');
        
        // Reset states
        window.isInspecting = false;
        window.inspectedCardObj = null;
        window.inspectionClone = null;
      }
    });
  }

  // Set up global close events
  document.getElementById('gallery-inspection-overlay').addEventListener('click', (e) => {
    if (e.target === document.getElementById('gallery-inspection-overlay') || e.target === document.getElementById('inspection-backdrop')) {
      exitInspection();
    }
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      exitInspection();
    }
  });

  window.addEventListener('scroll', () => {
    if (window.isInspecting) {
      exitInspection();
    }
  });

  const ccLoader = new THREE.TextureLoader();
  const maxAniso = (typeof renderer !== 'undefined' && renderer.capabilities && renderer.capabilities.getMaxAnisotropy)
    ? renderer.capabilities.getMaxAnisotropy() : 16;

  const loadCCTexture = (url) => {
    const tex = ccLoader.load(url);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.generateMipmaps = true;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.anisotropy = maxAniso;
    return tex;
  };

  const contentGroup = new THREE.Group();
  scene.add(contentGroup);
  scene.userData.contentGroup = contentGroup;

  /* ── Card definitions ─────────────────────────────────────
     Premium semicircle gallery — wide curved wall of floating
     displays. Camera at ~(17.7, 3.8, -65.5) looks toward (-1.5, 0, -104.5).
     
     LARGE hero displays: 01, 02, 03, 10, 11, 12
     MEDIUM support displays: 04, 05, 06, 07, 08, 09
     
     Coordinates calculated using view-frustum projection math
     to guarantee zero overlaps and zero viewport cutoffs.
     ───────────────────────────────────────────────────────── */
  const BORDER = 0.15;             // border thickness (world units)
  const BORDER_COLOR = 0x0A0C10;   // near-black premium border

  // HTML-based Content Engine sliding gallery initialization
  const rowDefs = [
    {
      id: 'gallery-inner-top',
      direction: 'right',
      speedMultiplier: 1.0,
      files: [
        { name: '1a-1d', aspect: 1672/941 },
        { name: '2', aspect: 1.5 },
        { name: '3', aspect: 1.5 },
        { name: '4', aspect: 1.5 }
      ]
    },
    {
      id: 'gallery-inner-middle',
      direction: 'left',
      speedMultiplier: 0.8,
      files: [
        { name: '5', aspect: 1477/1065 },
        { name: '6', aspect: 1.5 },
        { name: '7', aspect: 1.5 },
        { name: '8', aspect: 1.5 }
      ]
    },
    {
      id: 'gallery-inner-bottom',
      direction: 'right',
      speedMultiplier: 1.15,
      files: [
        { name: '9', aspect: 1.5 },
        { name: '10', aspect: 1.5 },
        { name: '11', aspect: 1.5 },
        { name: '12', aspect: 1.5 }
      ]
    }
  ];

  const rowsData = [];
  const gap = 95; // increased gap to avoid overlap and let cards breathe

  rowDefs.forEach(rowDef => {
    const container = document.getElementById(rowDef.id);
    if (!container) return;

    const cardsList = [];
    // Create 3 sets of cards for infinite wrapping
    const numSets = 3;
    for (let set = 0; set < numSets; set++) {
      rowDef.files.forEach(fileInfo => {
        const cardEl = document.createElement('div');
        cardEl.className = 'gallery-card';

        const innerEl = document.createElement('div');
        innerEl.className = 'gallery-card-inner';
        
        const img = document.createElement('img');
        img.src = `assets/content creation/${fileInfo.name}.png`;
        img.loading = 'lazy';
        
        innerEl.appendChild(img);
        cardEl.appendChild(innerEl);
        container.appendChild(cardEl);

        const cardObj = {
          element: cardEl,
          aspect: fileInfo.aspect,
          width: 0,
          x: 0,
          isHovered: false,
          // Drag state — always present, read by updateContent every frame
          dragging: false,
          returning: false,
          marqueePaused: false,
          dragX: 0,
          dragY: 0,
          dragZ: 0,
          dragScale: 1.0,
          dragRotation: 0,
          targetDragX: 0,
          targetDragY: 0
        };

        cardEl.addEventListener('mouseenter', () => {
          if (window.isInspecting || cardObj.dragging || cardObj.returning) return;
          cardObj.isHovered = true;
          document.body.classList.add('hov');
        });
        cardEl.addEventListener('mouseleave', () => {
          cardObj.isHovered = false;
          document.body.classList.remove('hov');
        });

        // Pointer event dragging implementation
        let startX = 0;
        let startY = 0;
        let hasMoved = false;

        cardEl.addEventListener('pointerdown', (e) => {
          if (e.button !== 0) return; // Only left-click drags
          if (window.isInspecting) return;
          e.stopPropagation();

          cardObj.dragging = true;
          cardObj.dragStartX = cardObj.x;
          cardObj.dragZ = 20; // Lift slightly toward camera
          cardObj.dragScale = 1.08; // Hover scale
          cardObj.dragRotation = 0;
          
          startX = e.clientX;
          startY = e.clientY;
          cardObj.pointerDx = 0;
          cardObj.pointerDy = 0;
          cardObj.targetDragX = 0;
          cardObj.targetDragY = 0;
          hasMoved = false;

          cardEl.setPointerCapture(e.pointerId);
          cardEl.classList.add('dragging');
        });

        cardEl.addEventListener('pointermove', (e) => {
          if (!cardObj.dragging) return;
          e.stopPropagation();

          cardObj.pointerDx = e.clientX - startX;
          cardObj.pointerDy = e.clientY - startY;

          // Drag threshold to filter simple clicks
          if (Math.abs(cardObj.pointerDx) > 6 || Math.abs(cardObj.pointerDy) > 6) {
            hasMoved = true;
          }
        });

        const handlePointerUp = (e) => {
          if (!cardObj.dragging) return;
          e.stopPropagation();

          cardEl.releasePointerCapture(e.pointerId);
          cardEl.classList.remove('dragging');

          cardObj.dragging = false;

          if (!hasMoved) {
            // No movement: treat as a click -> enter Inspection Mode
            cardObj.dragX = 0;
            cardObj.dragY = 0;
            cardObj.dragZ = 0;
            cardObj.dragScale = 1.0;
            enterInspection(cardObj);
            return;
          }

          cardObj.returning = true;
          cardEl.classList.add('returning');

          // Animate ONLY visual offsets back to zero relative to the scrolling card.x
          gsap.killTweensOf(cardObj);
          gsap.to(cardObj, {
            dragX: 0,
            dragY: 0,
            dragZ: 0,
            dragScale: 1.0,
            dragRotation: 0,
            duration: 0.8,
            ease: "elastic.out(1, 0.55)",
            overwrite: true,
            onComplete: () => {
              cardObj.returning = false;
              cardEl.classList.remove('returning');
            }
          });
        };

        cardEl.addEventListener('pointerup', handlePointerUp);
        cardEl.addEventListener('pointercancel', handlePointerUp);

        cardsList.push(cardObj);
      });
    }

    rowsData.push({
      container: container,
      direction: rowDef.direction,
      speedMultiplier: rowDef.speedMultiplier,
      cards: cardsList
    });
  });

  scene.userData.htmlGalleryRows = rowsData;
  scene.userData.contentCards = []; // keep empty array to prevent issues in other loops

  function resizeGallery() {
    const width = window.innerWidth;
    let heightFactor = 0.30; // increased by 15-20% for luxury exhibition feel
    if (width <= 480) {
      heightFactor = 0.20;
    } else if (width <= 768) {
      heightFactor = 0.24;
    }
    const height = window.innerHeight * heightFactor;

    rowsData.forEach(row => {
      // Sync parent gallery-row height to match
      const rowEl = row.container.parentElement;
      if (rowEl) {
        rowEl.style.height = height + 'px';
      }
      row.cards.forEach(card => {
        card.width = height * card.aspect;
        card.element.style.height = height + 'px';
        card.element.style.width = card.width + 'px';
      });

      if (row.direction === 'left') {
        let currentX = 0;
        row.cards.forEach(card => {
          card.x = currentX;
          card.element.style.transform = `translate3d(${card.x}px, 0, 0)`;
          currentX += card.width + gap;
        });
      } else {
        let totalWidth = 0;
        row.cards.forEach(card => {
          totalWidth += card.width + gap;
        });
        // Shift start position leftwards so it fills screen and moves rightwards
        let currentX = -totalWidth * 0.35;
        row.cards.forEach(card => {
          card.x = currentX;
          card.element.style.transform = `translate3d(${card.x}px, 0, 0)`;
          currentX += card.width + gap;
        });
      }
    });
  }

  window.addEventListener('resize', resizeGallery);
  resizeGallery();

  /* ── CONTENT PARTICLE FIELD ── */
  const COUNT = 800;
  const geo   = new THREE.BufferGeometry();
  const pos   = new Float32Array(COUNT * 3);
  for (let i = 0; i < COUNT; i++) {
    pos[i*3]   = rand(-40, 40);
    pos[i*3+1] = rand(-20, 20);
    pos[i*3+2] = rand(-150, -60);
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  scene.add(new THREE.Points(geo, new THREE.PointsMaterial({
    color: 0x405080, size: 0.08,
    transparent: true, opacity: 0.25,
    blending: THREE.AdditiveBlending, depthWrite: false,
  })));

})();

/* ═══════════════════════════════════════════
   10. ZONE — WEBSITE ARCHITECTURE (canyon z=-200 to z=-260)
   ═══════════════════════════════════════════ */
// Injected volumetric light beam helper
function createLightBeam(spotPos, targetPos, color) {
  const direction = new THREE.Vector3().subVectors(targetPos, spotPos);
  const length = direction.length();
  const dirNorm = direction.clone().normalize();

  // Cylinder pointing along light vector
  const beamGeo = new THREE.CylinderGeometry(2.0, 0.1, length, 16, 1, true);
  beamGeo.translate(0, length / 2, 0);

  // Rotate to align with direction
  const alignAxis = new THREE.Vector3(0, 1, 0);
  const quaternion = new THREE.Quaternion().setFromUnitVectors(alignAxis, dirNorm);
  beamGeo.applyQuaternion(quaternion);

  const beamMat = new THREE.MeshBasicMaterial({
    color: color,
    transparent: true,
    opacity: 0.25,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    depthWrite: false
  });

  const beam = new THREE.Mesh(beamGeo, beamMat);
  beam.position.copy(spotPos);
  return beam;
}

(function buildWebsites() {

  const slabDefs = [
    // Website 1: Michelin Restaurant (Nara Omakase) — NO STAND (ground mounted)
    { x: -16, y: 0, z: -225, ry: 0.15, w: 24.0, h: 14.4, d: 1.8, poleHeight: 0 },
    // Website 2: Luxury Real Estate (Aurelia) — NO STAND (ground mounted)
    { x: 16, y: 0, z: -225, ry: -0.15, w: 24.0, h: 14.4, d: 1.8, poleHeight: 0 },
    
    // Website 3: Luxury Fitness (Apex Performance Lab) — SHORT STAND (185%)
    { x: -19, y: 0, z: -240, ry: 0.10, w: 21.6, h: 12.96, d: 1.8, poleHeight: 14.8 },
    // Website 4: Premium Automotive (Verta GT) — SHORT STAND (185%)
    { x: 19, y: 0, z: -240, ry: -0.10, w: 21.6, h: 12.96, d: 1.8, poleHeight: 14.8 },
    
    // Website 5: Longevity / Medical (Elevate) — FULL STAND (375%)
    { x: -16, y: 0, z: -257, ry: 0.18, w: 19.44, h: 11.52, d: 1.8, poleHeight: 30.0 },
    // Website 6: Premium SaaS / AI (Kllezo Automate) — FULL STAND (375%)
    { x: 16, y: 0, z: -257, ry: -0.18, w: 19.44, h: 11.52, d: 1.8, poleHeight: 30.0 }
  ];

  const floorClippingPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 12);

  const websitesGroup = new THREE.Group();
  scene.add(websitesGroup);
  scene.userData.websitesGroup = websitesGroup;

  scene.userData.slabs = [];
  scene.userData.billboardSpotlights = [];
  scene.userData.beams = [];
  scene.userData.lenses = [];
  scene.userData.fixtures = [];

  const fixtureBodyMat = new THREE.MeshStandardMaterial({
    color: 0x1f2124, roughness: 0.4, metalness: 0.8
  });
  const SPOT_COLOR = 0xFFD27D; // Warm luxury light (2700K-3200K)

  slabDefs.forEach((d, idx) => {
    const group = new THREE.Group();

    // Slab body
    const bodyMat = MAT.pageArchitecture.clone();
    bodyMat.color.setHex(0x181a1d);
    bodyMat.emissive.setHex(0x000000);
    bodyMat.emissiveIntensity = 0;
    bodyMat.roughness = 0.95;
    bodyMat.metalness = 0.05;
    bodyMat.clippingPlanes = [ floorClippingPlane ];
    bodyMat.clipShadows = true;
    const slab = new THREE.Mesh(
      new THREE.BoxGeometry(d.w, d.h, d.d),
      bodyMat
    );
    slab.userData.baseOpacity = bodyMat.opacity;
    group.add(slab);

    // Browser chrome bar at top
    const chromeMat = new THREE.MeshStandardMaterial({
      color: 0x22252a, roughness: 0.9, metalness: 0.1,
      clippingPlanes: [ floorClippingPlane ],
      clipShadows: true,
      transparent: true,
      opacity: 1.0
    });
    const chrome = new THREE.Mesh(
      new THREE.BoxGeometry(d.w * 0.98, 0.6, d.d + 0.05),
      chromeMat
    );
    chrome.userData.baseOpacity = 1.0;
    chrome.position.y = d.h / 2 - 0.4;
    group.add(chrome);

    // URL bar indicator
    const urlBarMat = new THREE.MeshStandardMaterial({
      color: 0x131518, roughness: 1.0, metalness: 0.0,
      clippingPlanes: [ floorClippingPlane ],
      clipShadows: true,
      transparent: true,
      opacity: 1.0
    });
    const urlBar = new THREE.Mesh(
      new THREE.BoxGeometry(d.w * 0.55, 0.18, 0.05),
      urlBarMat
    );
    urlBar.userData.baseOpacity = 1.0;
    urlBar.position.set(0, d.h / 2 - 0.4, d.d / 2 + 0.04);
    group.add(urlBar);

    // Web Page screen - scaled to match plane aspect ratio for 4K quality
    const planeW = d.w * 0.96;
    const planeH = d.h * 0.92;

    const img = IMAGES['niche' + (idx + 1)];
    const webTexture = new THREE.Texture(img);
    webTexture.minFilter = THREE.LinearFilter;
    webTexture.magFilter = THREE.LinearFilter;
    webTexture.generateMipmaps = false;
    webTexture.wrapS = THREE.ClampToEdgeWrapping;
    webTexture.wrapT = THREE.ClampToEdgeWrapping;
    webTexture.encoding = THREE.sRGBEncoding;

    const webMat = new THREE.MeshStandardMaterial({
      map: webTexture,
      emissiveMap: webTexture,
      emissive: new THREE.Color(0xffffff),
      emissiveIntensity: 1.0, // High-end premium self-illumination
      roughness: 0.15,
      metalness: 0.05,
      clippingPlanes: [ floorClippingPlane ],
      transparent: true,
      opacity: 1.0
    });

    const webMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(planeW, planeH),
      webMat
    );
    webMesh.name = 'screen';
    webMesh.userData.baseOpacity = 1.0;
    webMesh.position.set(0, -0.3, d.d / 2 + 0.03);
    group.add(webMesh);

    const updateTextureDimensions = () => {
      if (img.naturalWidth > 0 && img.naturalHeight > 0) {
        const aspectPlane = planeH / planeW;
        const aspectImg = img.naturalHeight / img.naturalWidth;
        const repeatYVal = aspectPlane / aspectImg;
        webTexture.repeat.set(1.0, repeatYVal);
        webTexture.offset.set(0.0, 1.0 - repeatYVal);
        webTexture.needsUpdate = true;
        group.userData.repeatY = repeatYVal;
      }
    };

    if (img.complete && img.naturalWidth > 0) {
      setTimeout(updateTextureDimensions, 0);
    } else {
      img.addEventListener('load', updateTextureDimensions);
    }

    // Variable pole system
    const colHeight = d.poleHeight;
    const colMat = new THREE.MeshStandardMaterial({
      color: 0x1a1c1f,
      roughness: 0.55,
      metalness: 0.6,
      clippingPlanes: [ floorClippingPlane ],
      clipShadows: true,
      transparent: true,
      opacity: 1.0
    });

    if (colHeight > 0) {
      const colRadius = d.w * 0.05;
      const colGeo = new THREE.CylinderGeometry(colRadius, colRadius * 1.15, colHeight, 32);
      const column = new THREE.Mesh(colGeo, colMat);
      column.userData.baseOpacity = 1.0;
      column.position.set(0, -d.h / 2 - colHeight / 2, 0);
      group.add(column);

      // Mounting bracket
      const bracketGeo = new THREE.BoxGeometry(d.w * 0.18, 0.25, d.d * 0.6);
      const bracket = new THREE.Mesh(bracketGeo, colMat);
      bracket.userData.baseOpacity = 1.0;
      bracket.position.set(0, -d.h / 2 - 0.12, 0);
      group.add(bracket);
    }

    const targetYAbsolute = -12 + colHeight + d.h / 2;
    const loweredY = -14.5 - d.h / 2;

    group.position.set(d.x, loweredY, d.z);
    group.rotation.y = d.ry;

    group.userData = {
      targetY: targetYAbsolute,
      loweredY,
      d,
      idx,
      phase: idx * 0.8,
      webTexture,
      repeatY: 1.0
    };

    scene.userData.slabs.push(group);
    websitesGroup.add(group);

    // Ground Spotlight setup removed per request - hoardings are self-illuminated and do not have dedicated spotlights
  });

  // Canyon floor grid
  const floorGeo = new THREE.PlaneGeometry(60, 80, 12, 20);
  const floorMat = new THREE.MeshStandardMaterial({
    color: 0x060810, roughness: 1, metalness: 0,
    wireframe: false,
    transparent: true, opacity: 0.9,
  });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -PI / 2;
  floor.position.set(0, -12, -252);
  websitesGroup.add(floor);

  const floorWire = new THREE.Mesh(
    new THREE.PlaneGeometry(60, 80, 12, 20),
    new THREE.MeshBasicMaterial({ color: 0x1a3060, wireframe: true, transparent: true, opacity: 0.04 })
  );
  floorWire.rotation.x = -PI / 2;
  floorWire.position.set(0, -12.05, -252);
  websitesGroup.add(floorWire);

  // Platform side skirting / front face to completely hide area beneath y = -12
  const frontWallGeo = new THREE.PlaneGeometry(60, 28);
  const frontWall = new THREE.Mesh(frontWallGeo, floorMat);
  frontWall.position.set(0, -26, -212); // Front edge (z = -212)
  websitesGroup.add(frontWall);

  const frontWallWire = new THREE.Mesh(
    new THREE.PlaneGeometry(60, 28, 12, 6),
    new THREE.MeshBasicMaterial({ color: 0x1a3060, wireframe: true, transparent: true, opacity: 0.03 })
  );
  frontWallWire.position.set(0, -26, -211.95);
  websitesGroup.add(frontWallWire);

  // Side walls
  const sideWallGeo = new THREE.PlaneGeometry(80, 28);
  const leftWall = new THREE.Mesh(sideWallGeo, floorMat);
  leftWall.position.set(-30, -26, -252);
  leftWall.rotation.y = PI / 2;
  websitesGroup.add(leftWall);

  const leftWallWire = new THREE.Mesh(
    new THREE.PlaneGeometry(80, 28, 20, 6),
    new THREE.MeshBasicMaterial({ color: 0x1a9e8f, wireframe: true, transparent: true, opacity: 0.02 })
  );
  leftWallWire.position.set(-29.95, -26, -252);
  leftWallWire.rotation.y = PI / 2;
  websitesGroup.add(leftWallWire);

  const rightWall = new THREE.Mesh(sideWallGeo, floorMat);
  rightWall.position.set(30, -26, -252);
  rightWall.rotation.y = -PI / 2;
  websitesGroup.add(rightWall);

  const rightWallWire = new THREE.Mesh(
    new THREE.PlaneGeometry(80, 28, 20, 6),
    new THREE.MeshBasicMaterial({ color: 0x1a9e8f, wireframe: true, transparent: true, opacity: 0.02 })
  );
  rightWallWire.position.set(29.95, -26, -252);
  rightWallWire.rotation.y = -PI / 2;
  websitesGroup.add(rightWallWire);

  // Back wall
  const backWallGeo = new THREE.PlaneGeometry(60, 28);
  const backWall = new THREE.Mesh(backWallGeo, floorMat);
  backWall.position.set(0, -26, -292);
  backWall.rotation.y = PI;
  websitesGroup.add(backWall);

  const backWallWire = new THREE.Mesh(
    new THREE.PlaneGeometry(60, 28, 12, 6),
    new THREE.MeshBasicMaterial({ color: 0x1a9e8f, wireframe: true, transparent: true, opacity: 0.02 })
  );
  backWallWire.position.set(0, -26, -291.95);
  backWallWire.rotation.y = PI;
  websitesGroup.add(backWallWire);

  // Atmosphere lights in canyon
  const canyonLight1 = new THREE.PointLight(0x4060a0, 0.5, 50);
  canyonLight1.position.set(0, 5, -245);
  websitesGroup.add(canyonLight1);
  scene.userData.canyonLight = canyonLight1;

  scene.userData.canyonFloor = floor;
  scene.userData.canyonFloorWire = floorWire;
  scene.userData.canyonWalls = [
    frontWall, frontWallWire,
    leftWall, leftWallWire,
    rightWall, rightWallWire,
    backWall, backWallWire
  ];



})();

// Helper to construct a custom tube geometry with varying radius (narrows by 35% in the middle)
function createVaryingRadiusTubeGeometry(curve, tubularSegments, baseRadius, radialSegments) {
  const points = [];
  const indices = [];
  const uvs = [];
  const normals = [];
  
  // Compute Frenet frames along the curve
  const frames = curve.computeFrenetFrames(tubularSegments, false);
  
  for (let i = 0; i <= tubularSegments; i++) {
    const u = i / tubularSegments;
    const pt = curve.getPointAt(u);
    const tangent = frames.tangents[i];
    const normal = frames.normals[i];
    const binormal = frames.binormals[i];
    
    // Narrows slightly in the middle (min scale 0.65 = 35% narrowing)
    const radiusScale = 1.0 - 0.35 * Math.sin(u * Math.PI);
    const r = baseRadius * radiusScale;
    
    for (let j = 0; j <= radialSegments; j++) {
      const v = j / radialSegments;
      const angle = v * Math.PI * 2;
      
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      
      const vertex = new THREE.Vector3()
        .copy(pt)
        .addScaledVector(normal, cos * r)
        .addScaledVector(binormal, sin * r);
        
      points.push(vertex.x, vertex.y, vertex.z);
      
      const norm = new THREE.Vector3()
        .copy(normal).multiplyScalar(cos)
        .addScaledVector(binormal, sin)
        .normalize();
      normals.push(norm.x, norm.y, norm.z);
      
      uvs.push(u, v);
    }
  }
  
  for (let i = 0; i < tubularSegments; i++) {
    for (let j = 0; j < radialSegments; j++) {
      const a = i * (radialSegments + 1) + j;
      const b = i * (radialSegments + 1) + j + 1;
      const c = (i + 1) * (radialSegments + 1) + j;
      const d = (i + 1) * (radialSegments + 1) + j + 1;
      
      indices.push(a, c, b);
      indices.push(b, c, d);
    }
  }
  
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  return geo;
}





(function buildCalling() {
  const Z = -290;

  const callingGroup = new THREE.Group();
  scene.add(callingGroup);
  scene.userData.callingGroup = callingGroup;

  /* ── 3 CALLING PANELS — Voice Call, Live Transcript, Appointment Booked ── */
  scene.userData.callingScreens = [];
  const callingCardDefs = [
    { id: 0, name: 'voiceCall',  w: 9.0, h: 10.8, y: 4.5, finalX: -10.5, finalRy: 0.2 },
    { id: 1, name: 'transcript', w: 9.0, h: 10.8, y: 4.5, finalX: 0.0,  finalRy: 0.0 },
    { id: 2, name: 'confirmed',  w: 9.0, h: 10.8, y: 4.5, finalX: 10.5,  finalRy: -0.2 }
  ];

  callingCardDefs.forEach((s, si) => {
    // Create dynamic canvas for this screen
    const canvas = document.createElement('canvas');
    canvas.width = 400; // temporary default size
    canvas.height = 480;
    const ctx = canvas.getContext('2d');
    
    // Create THREE.CanvasTexture
    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = false;
    texture.userData = { isDynamic: true, highPriority: true };

    const mat = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: false,
      opacity: 1.0,
      depthWrite: true,
      depthTest: true,
      alphaTest: 0.5,
      side: THREE.DoubleSide
    });

    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(s.w, s.h),
      mat
    );

    // Initial position: stacked behind Card 1 in Z depth
    mesh.position.set(0, s.y, Z - si * 0.5);
    mesh.rotation.y = 0;
    mesh.scale.set(0.80, 0.80, 1.0);
    
    // Set renderOrder: Card 2 (index 1) has highest to be on top of others when emerging
    mesh.renderOrder = (si === 1) ? 12 : 10;
    mesh.userData = {
      def: s,
      si: si,
      isLoaded: false
    };
    mesh.visible = true;

    scene.userData.callingScreens.push(mesh);
    callingGroup.add(mesh);

    const imgKey = 'callingAgent' + (si + 1);
    const img = IMAGES[imgKey];

    // Register drawing function with global dynamic texture tick manager
    dynamicTextures.push({
      canvas,
      ctx,
      width: canvas.width,
      height: canvas.height,
      drawFn: (context, w, h) => {
        // Check if image is loaded and resize dynamically if needed
        if (!mesh.userData.isLoaded && img && img.complete && img.naturalWidth > 0) {
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;

          // Update resolution in dynamicTextures registry entry
          const entry = dynamicTextures.find(item => item.texture === texture);
          if (entry) {
            entry.width = img.naturalWidth;
            entry.height = img.naturalHeight;
          }

          const imgAspect = img.naturalWidth / img.naturalHeight;
          const targetW = s.h * imgAspect;

          mesh.geometry.dispose();
          mesh.geometry = new THREE.PlaneGeometry(targetW, s.h);
          mesh.userData.def.w = targetW;

          mesh.userData.isLoaded = true;
          texture.needsUpdate = true;
          console.log(`[KLLEZO] Rebuilt dynamic Calling Screen ${si}: ${canvas.width}x${canvas.height}`);
        }

        // Redraw only if the card is visible in the scene
        if (callingGroup.visible && mesh.material.opacity > 0.0) {
          drawCallingScreenCanvas(si, context, w, h, img, mesh.userData.isLoaded);
        }
      },
      texture
    });
  });



})();


(function buildTexting() {
  const Z = -365;

  const textingGroup = new THREE.Group();
  scene.add(textingGroup);
  scene.userData.textingGroup = textingGroup;

  scene.userData.riverTube = null;
  scene.userData.branches = [];
  scene.userData.msgMat = null;

  /* ── SINGLE MORPHING CHAT SCREEN — centered, large ── */
  scene.userData.textBubbles = [];

  const chatTexture = createDynamicTexture(683, 1024, (ctx, w, h) => {
    drawTextBubbleCanvas(0, ctx, w, h);
  });
  chatTexture.userData = { isDynamic: true, highPriority: true };

  const chatMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(4.59, 6.885), // Reduced phone size by 15% (from 5.4 x 8.1) for proper breathing margins
    new THREE.MeshBasicMaterial({
      map: chatTexture,
      transparent: false,
      opacity: 1.0,
      depthWrite: true,
      depthTest: true,
      alphaTest: 0.5,
      side: THREE.DoubleSide
    })
  );
  chatMesh.position.set(0, 0.6, Z); // Placed at Z (z = -450) facing camera and lowered to fit inside framing
  chatMesh.rotation.y = 0;
  chatMesh.renderOrder = 10;
  chatMesh.userData.baseY = 0.6;
  chatMesh.userData.phase = 0;
  scene.userData.textBubbles.push(chatMesh);
  textingGroup.add(chatMesh);

  scene.userData.flowCurvesTexting = [];
  scene.userData.flowDotsTexting = [];

  // Legacy texting streams removed in favor of single master gold stream

})();



/* ═══════════════════════════════════════════
   ECOSYSTEM / OUTRO CANVAS TEXTURE HELPERS
   ═══════════════════════════════════════════ */
function createDestinationLabelTexture(icon, title) {
  return createDynamicTexture(1024, 512, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    
    // Glassmorphic panel background with thick gold border
    ctx.lineWidth = 10;
    drawRoundRect(ctx, 24, 24, w - 48, h - 48, 56, 'rgba(5, 6, 8, 0.85)', 'rgba(199, 166, 107, 0.45)');
    
    // Draw icon (substantially larger)
    ctx.font = '140px "Segoe UI Emoji", "Arial"';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(icon, w / 2, 150);
    
    // Draw title (substantially larger, bold, readable)
    ctx.font = 'bold 54px "Inter", sans-serif';
    ctx.fillStyle = '#F7F3EB';
    ctx.textAlign = 'center';
    ctx.fillText(title.toUpperCase(), w / 2, 320);
    
    // Accent electric blue line (thicker)
    ctx.beginPath();
    ctx.moveTo(w / 2 - 120, 420);
    ctx.lineTo(w / 2 + 120, 420);
    ctx.strokeStyle = 'rgba(103, 169, 255, 0.85)';
    ctx.lineWidth = 8;
    ctx.stroke();
  });
}

function createCentralTitleTexture() {
  return createDynamicTexture(512, 128, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    
    // Subtly dark glassmorphic background
    ctx.fillStyle = 'rgba(5, 6, 8, 0.65)';
    drawRoundRect(ctx, 4, 4, w - 8, h - 8, 12, 'rgba(5, 6, 8, 0.65)', 'rgba(199, 166, 107, 0.15)');
    
    // Title
    ctx.font = 'bold 16px "Inter", sans-serif';
    ctx.fillStyle = '#C7A66B'; // Gold/Champagne
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    if (self.CanvasRenderingContext2D && 'letterSpacing' in ctx) {
      ctx.letterSpacing = '5px';
    }
    ctx.fillText('THE KLLEZO ECOSYSTEM', w / 2, 45);

    // Subtitle
    ctx.font = '11px "Inter", sans-serif';
    ctx.fillStyle = 'rgba(247, 243, 235, 0.55)';
    if (self.CanvasRenderingContext2D && 'letterSpacing' in ctx) {
      ctx.letterSpacing = '2px';
    }
    ctx.fillText('Content. Websites. AI. Connected.', w / 2, 80);
  });
}

function createGlowTexture() {
  return createDynamicTexture(256, 256, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    const grad = ctx.createRadialGradient(w/2, h/2, 0, w/2, h/2, w/2);
    grad.addColorStop(0, 'rgba(123, 47, 190, 0.35)');  // Brand purple (lower intensity)
    grad.addColorStop(0.35, 'rgba(103, 169, 255, 0.20)'); // Electric Cyan
    grad.addColorStop(0.7, 'rgba(123, 47, 190, 0.05)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  });
}

function loadAndTintLogo(url, tintColorHex, callback) {
  const loader = new THREE.ImageLoader();
  loader.load(url, (image) => {
    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(image, 0, 0);

    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;

    const tintColor = new THREE.Color(tintColorHex);
    const rTint = Math.floor(tintColor.r * 255);
    const gTint = Math.floor(tintColor.g * 255);
    const bTint = Math.floor(tintColor.b * 255);

    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] > 5) {
        data[i]     = rTint;
        data[i + 1] = gTint;
        data[i + 2] = bTint;
      }
    }
    ctx.putImageData(imgData, 0, 0);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    callback(texture);
  });
}

(function buildEcosystem() {
  const ecosystemGroup = new THREE.Group();
  scene.add(ecosystemGroup);
  scene.userData.ecosystemGroup = ecosystemGroup;

  const destinations = [
    {
      name: 'Content Creation',
      imgKey: 'f1',
      pos: [-59, 29.5, -470],
      radius: 12.0
    },
    {
      name: 'Website Experiences',
      imgKey: 'f2',
      pos: [59, 29.5, -470],
      radius: 12.0
    },
    {
      name: 'AI Calling Agents',
      imgKey: 'callingOrb',
      pos: [-59, -29.5, -470],
      radius: 12.0
    },
    {
      name: 'AI Texting Agents',
      imgKey: 'f4',
      pos: [59, -29.5, -470],
      radius: 12.0
    }
  ];

  scene.userData.ecoNodes = [];

  destinations.forEach((dest, i) => {
    const node = new THREE.Group();
    
    // Core stable body (golden orb with transparency) loaded directly from the RGBA PNG files
    const texture = new THREE.Texture(IMAGES[dest.imgKey]);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = false;
    
    const coreMat = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      opacity: 0.0,
      depthWrite: false, // Don't write to depth buffer to avoid occlusion artifacts
      depthTest: false,  // Ensure it renders above EVERYTHING (conduits, particles, logo)
      alphaTest: 0.05
    });
    coreMat.userData.baseOpacity = 1.0;
    
    const planeH = 16.8; // 20% larger orbs for premium corner anchors
    const planeW = 16.8; // Perfectly square plane
    
    const coreMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(planeW, planeH),
      coreMat
    );
    coreMesh.position.z = 0.0; // Center depth plane
    coreMesh.renderOrder = 10; // Frontmost layer
    node.add(coreMesh);

    node.position.set(...dest.pos);
    node.userData = {
      i,
      phase: i * PI / 2,
      basePos: dest.pos.slice(),
      texture
    };
    
    scene.userData.ecoNodes.push(node);
    ecosystemGroup.add(node);
  });

  // Dynamic image loader with high fidelity preservation
  function updateOrbTextures() {
    if (!IMAGES.f1.complete || !IMAGES.f2.complete || !IMAGES.f4.complete || !IMAGES.callingOrb.complete) return;
    
    scene.userData.ecoNodes.forEach((node) => {
      if (node.userData && node.userData.texture) {
        node.userData.texture.needsUpdate = true;
      }
    });
  }

  // Store on scene to allow updates when redrawDynamicTextures runs
  scene.userData.updateOrbTextures = updateOrbTextures;

  ['f1', 'f2', 'f4', 'callingOrb'].forEach(key => {
    // Add event listener to all images to guarantee loading updates
    IMAGES[key].addEventListener('load', updateOrbTextures);
    if (IMAGES[key].complete) {
      updateOrbTextures();
    }
  });

  // Legacy ecosystem streams removed in favor of single master gold stream

  // Drifting eco background particles
  const ECO_COUNT = 800;
  const ecoGeo = new THREE.BufferGeometry();
  const ecoPos = new Float32Array(ECO_COUNT * 3);
  for (let i = 0; i < ECO_COUNT; i++) {
    ecoPos[i*3]   = rand(-40, 40);
    ecoPos[i*3+1] = rand(-25, 25);
    ecoPos[i*3+2] = -540 + rand(-40, 40);
  }
  ecoGeo.setAttribute('position', new THREE.BufferAttribute(ecoPos, 3));
  const pts = new THREE.Points(ecoGeo, new THREE.PointsMaterial({
    color: 0x67A9FF,
    size: 0.08,
    transparent: true,
    opacity: 0.0,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  }));
  pts.material.userData.baseOpacity = 0.25;
  ecosystemGroup.add(pts);
  scene.userData.ecoParticles = pts;
})();

function rebuildEcosystemStreams() {
  const logoCenter = new THREE.Vector3(0, 4.5, -470);
  
  // Diagonal curves: originate from logoCenter and flow to orbs
  // Top-Left (Content Creation) - arched upwards
  const tlPoints = [
    logoCenter,
    new THREE.Vector3(-8, 14.0, -470),
    new THREE.Vector3(-18, 18.0, -470),
    pTopLeft
  ];
  const tlCurve = new THREE.CatmullRomCurve3(tlPoints, false, 'centripetal');
  
  // Top-Right (Website Experiences) - arched upwards
  const trPoints = [
    logoCenter,
    new THREE.Vector3(8, 14.0, -470),
    new THREE.Vector3(18, 18.0, -470),
    pTopRight
  ];
  const trCurve = new THREE.CatmullRomCurve3(trPoints, false, 'centripetal');
  
  // Bottom-Left (AI Calling) - bowed downwards
  const blPoints = [
    logoCenter,
    new THREE.Vector3(-8, -6.0, -470),
    new THREE.Vector3(-18, -9.0, -470),
    pBottomLeft
  ];
  const blCurve = new THREE.CatmullRomCurve3(blPoints, false, 'centripetal');
  
  // Bottom-Right (AI Texting) - bowed downwards
  const brPoints = [
    logoCenter,
    new THREE.Vector3(8, -6.0, -470),
    new THREE.Vector3(18, -9.0, -470),
    pBottomRight
  ];
  const brCurve = new THREE.CatmullRomCurve3(brPoints, false, 'centripetal');
  
  scene.userData.branchTLCurve = tlCurve;
  scene.userData.branchTRCurve = trCurve;
  scene.userData.branchBLCurve = blCurve;
  scene.userData.branchBRCurve = brCurve;

  // Build and apply full branch tube geometries once
  const tlGeom = new THREE.TubeGeometry(tlCurve, 420, 0.42, 96, false);
  const trGeom = new THREE.TubeGeometry(trCurve, 420, 0.42, 96, false);
  const blGeom = new THREE.TubeGeometry(blCurve, 420, 0.42, 96, false);
  const brGeom = new THREE.TubeGeometry(brCurve, 420, 0.42, 96, false);

  updateMeshGeometry(branchTLMesh, tlGeom);
  updateMeshGeometry(branchTRMesh, trGeom);
  updateMeshGeometry(branchBLMesh, blGeom);
  updateMeshGeometry(branchBRMesh, brGeom);
}

(function buildConnectionPipe() {
  const vStart = new THREE.Vector3(0, 4.5, -470);
  const curves = [
    curveHeroToContent,
    curveContentToWebsites,
    curveWebsitesToCalling,
    curveCallingToTexting,
    curveTextingToEcosystem
  ];

  // Initialize the 5 segment gold meshes with their full curve geometries once
  for (let i = 0; i < 5; i++) {
    const geom = new THREE.TubeGeometry(curves[i], 420, 0.42, 96, false);
    const mesh = new THREE.Mesh(geom, createGoldMaterial(0.0));
    mesh.renderOrder = 8;
    mesh.visible = false;
    scene.add(mesh);
    goldMeshes.push(mesh);
  }
  scene.userData.goldMeshes = goldMeshes;

  // Initialize dummy branch meshes, which will be updated immediately with full geometries in rebuildEcosystemStreams
  const dummyCurve = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 8, -30), new THREE.Vector3(0, 8, -31)]);
  const dummyGeom = new THREE.TubeGeometry(dummyCurve, 2, 0.42, 8, false);

  branchTLMesh = new THREE.Mesh(dummyGeom.clone(), createGoldMaterial(0.0));
  branchTRMesh = new THREE.Mesh(dummyGeom.clone(), createGoldMaterial(0.0));
  branchBLMesh = new THREE.Mesh(dummyGeom.clone(), createGoldMaterial(0.0));
  branchBRMesh = new THREE.Mesh(dummyGeom.clone(), createGoldMaterial(0.0));
  
  branchTLMesh.renderOrder = 7;
  branchTRMesh.renderOrder = 7;
  branchBLMesh.renderOrder = 7;
  branchBRMesh.renderOrder = 7;
  
  scene.add(branchTLMesh);
  scene.add(branchTRMesh);
  scene.add(branchBLMesh);
  scene.add(branchBRMesh);

  scene.userData.branchTLMesh = branchTLMesh;
  scene.userData.branchTRMesh = branchTRMesh;
  scene.userData.branchBLMesh = branchBLMesh;
  scene.userData.branchBRMesh = branchBRMesh;

  // Perform initial build of ecosystem curves and branch geometries
  rebuildEcosystemStreams();

  const loader = new THREE.TextureLoader();
  loader.load('assets/logo-removebg.png', (texture) => {
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.anisotropy = renderer.capabilities ? renderer.capabilities.getMaxAnisotropy() : 16;
    const aspect = texture.image.width / texture.image.height;
    
    // Set centerpiece logo plane size (scaled to 18.0 units for breathing room)
    const logoGeo = new THREE.PlaneGeometry(18.0 * aspect, 18.0);
    const logoMat = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      opacity: 0.0,
      depthWrite: false, // Don't write to depth buffer to avoid occlusion artifacts
      depthTest: true,
      side: THREE.DoubleSide
    });
    
    const logoMesh = new THREE.Mesh(logoGeo, logoMat);
    logoMesh.position.copy(vStart);
    logoMesh.renderOrder = 8; // Render on top of gold conduits (renderOrder=4), behind orbs (renderOrder=10)
    scene.add(logoMesh);
    scene.userData.junctionMesh = logoMesh;
  });
})();

/* ═══════════════════════════════════════════
   14. OVERLAY TEXT SYSTEM
   Zone ranges: progress values where text is visible
   ═══════════════════════════════════════════ */
const ZONES = [
  { id: 'zt-hero',      from: -0.5,  peak: 0.0,  to: 0.4  },
  { id: 'zt-content',   from: 0.6,   peak: 1.0,  to: 1.6  },
  { id: 'zt-websites',  from: 1.9,   peak: 2.5,  to: 3.4  },
  { id: 'zt-calling',   from: 4.8,   peak: 5.5,  to: 6.5  },
  { id: 'zt-texting',   from: 8.8,   peak: 9.5,  to: 10.5 },
  { id: 'zt-ecosystem', from: 12.0,  peak: 13.0, to: 13.5 },
];

const NAV_CONTEXTS = [
  { from: 0.00,  to: 0.5,   text: '' },
  { from: 0.5,   to: 2.0,   text: 'Content Engine' },
  { from: 2.0,   to: 3.5,   text: 'Website Experiences' },
  { from: 3.5,   to: 7.0,   text: 'AI Calling Agents' },
  { from: 7.0,   to: 11.25, text: 'AI Texting Agents' },
  { from: 11.25, to: 14.0,  text: 'The Ecosystem' },
];

const zoneEls = {};
ZONES.forEach(z => { zoneEls[z.id] = document.getElementById(z.id); });

// Description Typewriter Reveal Elements
const descElements = {
  1: document.querySelector('#zt-content .zt-body'),
  2: document.querySelector('#zt-websites .zt-body'),
  3: document.querySelector('#zt-calling .zt-body'),
  4: document.querySelector('#zt-texting .zt-body')
};
const descOriginalTexts = {};
for (let key in descElements) {
  if (descElements[key]) {
    descOriginalTexts[key] = descElements[key].innerHTML.replace(/<br\s*\/?>/gi, '\n').trim();
    descElements[key].innerHTML = '';
  }
}
const sectionActiveTimes = [0, 0, 0, 0, 0, 0];

function updateDescriptionTyping(idx, activeTime) {
  const el = descElements[idx];
  const fullText = descOriginalTexts[idx];
  if (!el || !fullText) return;
  
  const duration = 2.8; // 2.8s typing reveal (within 2-4s)
  const progress = clamp(activeTime / duration, 0, 1);
  const numChars = Math.floor(progress * fullText.length);
  
  let typed = fullText.slice(0, numChars);
  if (progress < 1.0) {
    const flash = Math.floor(performance.now() / 150) % 2 === 0;
    typed += flash ? '|' : '';
  }
  
  el.innerHTML = typed.replace(/\n/g, '<br>');
  el.style.opacity = 0.4 + 0.6 * progress;
}

function updateOverlay(t) {
  const vp = scrollProgress * 13.0;
  ZONES.forEach((z, idx) => {
    const el = zoneEls[z.id];
    if (!el) return;
    el.style.opacity = getSectionOpacity(idx);
  });

  // HTML gallery overlay sync (fades in early from vp = 0.2 to 0.8, stays full to 1.4, fades out to 1.8)
  const galleryOverlay = document.getElementById('content-gallery-overlay');
  if (galleryOverlay) {
    let galleryOp = 0.0;
    if (vp >= 0.2 && vp <= 1.8) {
      if (vp < 0.8) {
        galleryOp = (vp - 0.2) / 0.6;
      } else if (vp > 1.4) {
        galleryOp = (1.8 - vp) / 0.4;
      } else {
        galleryOp = 1.0;
      }
    }
    galleryOverlay.style.opacity = clamp(galleryOp * getSectionOpacity(1), 0, 1);
    if (galleryOp > 0.05) {
      galleryOverlay.style.pointerEvents = 'auto';
    } else {
      galleryOverlay.style.pointerEvents = 'none';
    }
  }

  // Update typing animations for active descriptions
  for (let key in descElements) {
    const idx = parseInt(key);
    if (currentSectionIdx === idx && sectionTransitionProgress >= 0.99) {
      updateDescriptionTyping(idx, sectionActiveTimes[idx]);
    } else {
      if (descElements[key]) {
        descElements[key].innerHTML = '';
      }
    }
  }

  // Nav context
  const ctx = document.getElementById('nav-context');
  if (ctx) {
    const zone = NAV_CONTEXTS.find(n => vp >= n.from && vp < n.to);
    ctx.textContent = zone ? zone.text : '';
  }

  // Nav visibility
  const nav = document.getElementById('nav');
  if (nav) {
    nav.classList.toggle('visible', vp > 1.0);
    nav.classList.toggle('bg', vp > 1.5);
  }

  // Progress bar
  const fill = document.getElementById('progress-fill');
  if (fill) fill.style.height = `${scrollProgress * 100}%`;
}

/* ═══════════════════════════════════════════
   15. BACKGROUND COLOUR TRANSITION
   Beige (hero) → deep void (worlds)
   ═══════════════════════════════════════════ */
const BG_START = new THREE.Color(PALETTE.bg);
const BG_END   = new THREE.Color(PALETTE.bg);

const _targetColor = new THREE.Color();

function updateBackground(t) {
  _targetColor.setHex(PALETTE.bg); // Always lock clear color to void black
  const targetDensity = 0.007;    // Clean, light, consistent atmosphere to preserve starfield visibility

  if (!scene.userData.currBg) scene.userData.currBg = new THREE.Color(PALETTE.bg);
  scene.userData.currBg.lerp(_targetColor, 0.04);
  
  renderer.setClearColor(scene.userData.currBg, 1);
  if (scene.fog) {
    scene.fog.color.copy(scene.userData.currBg);
    scene.fog.density = lerp(scene.fog.density, targetDensity, 0.04);
  }
}

/* ═══════════════════════════════════════════
   16. CURSOR
   ═══════════════════════════════════════════ */
const curDot  = document.getElementById('cur-dot');
const curRing = document.getElementById('cur-ring');
let cx = 0, cy = 0, rx = 0, ry = 0;
let hoveringHtml = false;

window.addEventListener('mousemove', e => { cx = e.clientX; cy = e.clientY; });

document.querySelectorAll('a, button, .zt-cta-btn, .nav-cta').forEach(el => {
  el.addEventListener('mouseenter', () => {
    hoveringHtml = true;
    document.body.classList.add('hov');
  });
  el.addEventListener('mouseleave', () => {
    hoveringHtml = false;
    document.body.classList.remove('hov');
  });
});

window.addEventListener('click', (event) => {
  // Guard against clicking interactive HTML overlay elements
  if (event.target.closest('a') || event.target.closest('button') || event.target.closest('.zt-cta-btn') || event.target.closest('.nav-cta')) {
    return;
  }

  if (scrollProgress >= 0.80 && scene.userData.ecoNodes) {
    const raycaster = new THREE.Raycaster();
    const clickMouse = new THREE.Vector2();
    clickMouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    clickMouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    
    raycaster.setFromCamera(clickMouse, camera);
    const spheres = [];
    scene.userData.ecoNodes.forEach((node, idx) => {
      if (node.children && node.children[0]) {
        node.children[0].userData.nodeIndex = idx;
        spheres.push(node.children[0]);
      }
    });
    
    const intersects = raycaster.intersectObjects(spheres);
    if (intersects.length > 0) {
      const idx = intersects[0].object.userData.nodeIndex;
      const urls = [
        'services.html#content',
        'services.html#websites',
        'services.html#calling',
        'services.html#texting'
      ];
      if (urls[idx]) {
        window.location.href = urls[idx];
      }
    }
  }
});

function updateCursor() {
  rx = lerp(rx, cx, 0.1);
  ry = lerp(ry, cy, 0.1);
  curDot.style.left  = cx + 'px';
  curDot.style.top   = cy + 'px';
  curRing.style.left = rx + 'px';
  curRing.style.top  = ry + 'px';

  // Hover detection for 3D ecosystem spheres
  let isHoveringNode = false;
  hoveredNodeIdx = -1;
  if (scrollProgress >= 0.80 && scene.userData.ecoNodes) {
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);
    const spheres = [];
    scene.userData.ecoNodes.forEach((node, idx) => {
      if (node.children && node.children[0]) {
        node.children[0].userData.nodeIndex = idx;
        spheres.push(node.children[0]);
      }
    });
    const intersects = raycaster.intersectObjects(spheres);
    if (intersects.length > 0) {
      isHoveringNode = true;
      hoveredNodeIdx = intersects[0].object.userData.nodeIndex;
    }
  }

  if (isHoveringNode || hoveringHtml) {
    document.body.classList.add('hov');
  } else {
    document.body.classList.remove('hov');
  }
}

/* ═══════════════════════════════════════════
   17. ANIMATION UPDATERS PER ZONE
   ═══════════════════════════════════════════ */
function updateContent(t, time, dt) {
  const vp = scrollProgress * 13.0;

  if (scene.userData.contentGroup) {
    scene.userData.contentGroup.visible = getSectionOpacity(1) > 0.001;
  }

  // Update HTML-based sliding gallery marquee
  const htmlRows = scene.userData.htmlGalleryRows;
  if (htmlRows) {
    const baseSpeed = 18; // base speed in px per second
    const viewportWidth = window.innerWidth;
    const gap = 95; // increased gap to avoid overlap and let cards breathe
    const dtSafe = Math.min(dt || 0.016, 0.1);

    htmlRows.forEach(row => {
      const speed = baseSpeed * row.speedMultiplier;
      row.cards.forEach(card => {
        // The marquee always auto-scrolls to keep spacing mathematically identical
        if (row.direction === 'left') {
          card.x -= speed * dtSafe;
        } else {
          card.x += speed * dtSafe;
        }

        // While dragging, interpolate offsets toward cursor target relative to moving slots
        if (card.dragging) {
          card.targetDragX = lerp(card.targetDragX || 0, card.pointerDx || 0, 0.22);
          card.targetDragY = lerp(card.targetDragY || 0, card.pointerDy || 0, 0.22);

          const targetX = card.dragStartX + card.targetDragX;
          const targetY = card.targetDragY;

          card.dragX = targetX - card.x;
          card.dragY = targetY;
        }

        // --- Gentle Curvature Math ---
        // "Rows should gently arc inward toward the viewer. Very soft curvature only."
        // Calculate the card's relative X position on the screen to apply a subtle depth bend (Z translation and rotation)
        const screenCenterX = viewportWidth / 2;
        const currentCardXOnScreen = card.x + (card.dragX || 0) + card.width / 2;
        const normalizedDist = (currentCardXOnScreen - screenCenterX) / (viewportWidth / 2); // -1.5 to 1.5 approx
        
        // Soft arc: Translate card back in depth (Z) as it gets further from the screen center,
        // and rotateY slightly inward to point toward the center.
        const arcZ = -40 * Math.pow(Math.abs(normalizedDist), 2); // soft max 40px depth push back
        const arcRotateY = -6 * normalizedDist; // soft max 6deg inward Y rotation
        
        // SINGLE SOURCE OF TRUTH: one unified transform write for all states.
        card.element.style.transform = `translate3d(${card.x + (card.dragX || 0)}px, ${card.dragY || 0}px, ${card.dragZ || 0}px) translateZ(${arcZ}px) rotateY(${arcRotateY}deg) scale(${card.dragScale != null ? card.dragScale : 1}) rotate(${card.dragRotation || 0}deg)`;
      });

      // Wrap check
      if (row.direction === 'left') {
        row.cards.forEach(card => {
          if (card.x + card.width < -150) {
            let maxCard = null;
            let maxX = -Infinity;
            row.cards.forEach(other => {
              if (other !== card && other.x > maxX) {
                maxX = other.x;
                maxCard = other;
              }
            });
            if (maxCard) {
              card.x = maxCard.x + maxCard.width + gap;
            }
          }
        });
      } else {
        row.cards.forEach(card => {
          if (card.x > viewportWidth + 150) {
            let minCard = null;
            let minX = Infinity;
            row.cards.forEach(other => {
              if (other !== card && other.x < minX) {
                minX = other.x;
                minCard = other;
              }
            });
            if (minCard) {
              card.x = minCard.x - card.width - gap;
            }
          }
        });
      }
    });
  }
}


function updateWebsites(t, time, vpOverride) {
  const vp = (vpOverride !== undefined) ? vpOverride : (scrollProgress * 13.0);
  const envOpacity = getSectionOpacity(2);

  if (scene.userData.websitesGroup) {
    scene.userData.websitesGroup.visible = envOpacity > 0.001;
  }

  if (scene.userData.websitesGroup && scene.userData.websitesGroup.visible && scene.userData.slabs) {
    if (scene.userData.canyonFloor) {
      scene.userData.canyonFloor.material.opacity = 0.9 * envOpacity;
      scene.userData.canyonFloor.material.transparent = true;
    }
    if (scene.userData.canyonFloorWire) {
      scene.userData.canyonFloorWire.material.opacity = 0.04 * envOpacity;
      scene.userData.canyonFloorWire.material.transparent = true;
    }
    if (scene.userData.canyonWalls) {
      scene.userData.canyonWalls.forEach((wall, wi) => {
        if (wall.material) {
          wall.material.transparent = true;
          const isWire = wall.material.wireframe;
          wall.material.opacity = (isWire ? (wi === 1 ? 0.03 : 0.02) : 0.9) * envOpacity;
        }
      });
    }

    scene.userData.slabs.forEach(g => {
      const idx = g.userData.idx;
      const d = g.userData.d;
      const targetY = g.userData.targetY;
      const rowIdx = Math.floor(idx / 2);

      // Distance-based fade
      const distanceZ = Math.abs(camera.position.z - d.z);
      const fadeVal = clamp(1.0 - distanceZ / 25.0, 0, 1);
      const easeFade = 0.5 * (1.0 - Math.cos(fadeVal * Math.PI));
      const finalOpacity = easeFade * envOpacity;

      // Position the panel - STRICTLY FIXED structures, never translate or slide
      g.position.set(d.x, targetY, d.z);

      // Cursor micro-tilt influence for high-end feel (Apple Vision Pro inspired)
      g.rotation.y = d.ry + mouse.sx * 0.015;
      g.rotation.x = mouse.sy * 0.012;

      // Scroll website texture based on row focal progress
      let scrollPct = 0.0;
      if (rowIdx === 0) {
        scrollPct = clamp(websiteScrollProgress / 0.33, 0, 1);
      } else if (rowIdx === 1) {
        scrollPct = clamp((websiteScrollProgress - 0.33) / 0.33, 0, 1);
      } else {
        scrollPct = clamp((websiteScrollProgress - 0.66) / 0.34, 0, 1);
      }
      
      const easeScrollPct = 0.5 * (1.0 - Math.cos(scrollPct * Math.PI));
      g.userData.scrollPct = easeScrollPct;
      if (g.userData.webTexture && g.userData.repeatY !== undefined) {
        // Micro scroll offset influenced by vertical mouse position
        const mouseScrollInfluence = mouse.sy * 0.015;
        g.userData.webTexture.offset.y = clamp(
          (1.0 - g.userData.repeatY) * (1.0 - easeScrollPct) + mouseScrollInfluence,
          0.0,
          1.0 - g.userData.repeatY
        );
      }

      // Animate opacity of all meshes in the group
      g.traverse(child => {
        if (child.isMesh && child.material) {
          child.material.transparent = true;
          const baseOpacity = child.userData.baseOpacity !== undefined ? child.userData.baseOpacity : 1.0;
          child.material.opacity = baseOpacity * finalOpacity;

          // Micro-depth parallax on the website screen mesh (Apple Vision Pro inspired 3D layered look)
          if (child.name === 'screen') {
            child.position.x = mouse.sx * 0.12;
            child.position.y = -0.3 + mouse.sy * 0.12;
          }
        }
      });

      // Update spotlight, lens, fixture and beam intensity/opacity linked to the slab
      const spot1 = scene.userData.billboardSpotlights[idx * 2];
      const spot2 = scene.userData.billboardSpotlights[idx * 2 + 1];
      const beam1 = scene.userData.beams[idx * 2];
      const beam2 = scene.userData.beams[idx * 2 + 1];
      const lens1 = scene.userData.lenses[idx * 2];
      const lens2 = scene.userData.lenses[idx * 2 + 1];
      const fixture1 = scene.userData.fixtures[idx * 2];
      const fixture2 = scene.userData.fixtures[idx * 2 + 1];

      // Slow showroom spotlight sweeps
      if (spot1 && spot1.target) {
        const sweepSpeed = 0.4;
        const rangeX = d.w * 0.35;
        const rangeY = d.h * 0.35;
        const targetX1 = d.x + Math.sin(time * sweepSpeed + idx * 1.5) * rangeX;
        const targetY1 = (-12 + d.poleHeight + d.h * 0.5) + Math.cos(time * sweepSpeed * 0.8 + idx * 1.5) * rangeY;
        spot1.target.position.set(targetX1, targetY1, d.z);

        if (beam1) {
          const spotPos = spot1.position;
          const targetPos = spot1.target.position;
          const direction = new THREE.Vector3().subVectors(targetPos, spotPos);
          const length = direction.length();
          const dirNorm = direction.clone().normalize();
          if (!beam1.userData.initialLength) beam1.userData.initialLength = length;
          beam1.scale.set(1, length / beam1.userData.initialLength, 1);
          const alignAxis = new THREE.Vector3(0, 1, 0);
          const quaternion = new THREE.Quaternion().setFromUnitVectors(alignAxis, dirNorm);
          beam1.quaternion.copy(quaternion);
        }
      }

      if (spot2 && spot2.target) {
        const sweepSpeed = 0.4;
        const rangeX = d.w * 0.35;
        const rangeY = d.h * 0.35;
        const targetX2 = d.x + Math.cos(time * sweepSpeed + idx * 2.2) * rangeX;
        const targetY2 = (-12 + d.poleHeight + d.h * 0.5) + Math.sin(time * sweepSpeed * 0.8 + idx * 2.2) * rangeY;
        spot2.target.position.set(targetX2, targetY2, d.z);

        if (beam2) {
          const spotPos = spot2.position;
          const targetPos = spot2.target.position;
          const direction = new THREE.Vector3().subVectors(targetPos, spotPos);
          const length = direction.length();
          const dirNorm = direction.clone().normalize();
          if (!beam2.userData.initialLength) beam2.userData.initialLength = length;
          beam2.scale.set(1, length / beam2.userData.initialLength, 1);
          const alignAxis = new THREE.Vector3(0, 1, 0);
          const quaternion = new THREE.Quaternion().setFromUnitVectors(alignAxis, dirNorm);
          beam2.quaternion.copy(quaternion);
        }
      }

      if (spot1) spot1.intensity = 3.0 * finalOpacity;
      if (spot2) spot2.intensity = 3.0 * finalOpacity;
      if (beam1) beam1.material.opacity = 0.35 * finalOpacity;
      if (beam2) beam2.material.opacity = 0.35 * finalOpacity;
      if (lens1) lens1.material.opacity = 1.0 * finalOpacity;
      if (lens2) lens2.material.opacity = 1.0 * finalOpacity;
      if (fixture1) fixture1.material.opacity = 1.0 * finalOpacity;
      if (fixture2) fixture2.material.opacity = 1.0 * finalOpacity;
    });

    // Canyon light pulse
    if (scene.userData.canyonLight) {
      scene.userData.canyonLight.intensity = (0.5 + Math.sin(time * 1.5) * 0.2) * envOpacity;
    }
  } else {
    if (scene.userData.slabs) {
      scene.userData.slabs.forEach(g => {
        g.position.y = g.userData.targetY; // Keep physically set at targetY
        g.traverse(child => {
          if (child.isMesh && child.material) {
            child.material.opacity = 0;
          }
        });
      });
    }
    if (scene.userData.billboardSpotlights) {
      scene.userData.billboardSpotlights.forEach(spot => {
        spot.intensity = 0;
      });
    }
    if (scene.userData.beams) {
      scene.userData.beams.forEach(beam => {
        beam.material.opacity = 0;
      });
    }
    if (scene.userData.lenses) {
      scene.userData.lenses.forEach(lens => {
        lens.material.opacity = 0;
      });
    }
    if (scene.userData.fixtures) {
      scene.userData.fixtures.forEach(f => {
        f.material.opacity = 0;
      });
    }
    if (scene.userData.canyonFloor) scene.userData.canyonFloor.material.opacity = 0.0;
    if (scene.userData.canyonFloorWire) scene.userData.canyonFloorWire.material.opacity = 0.0;
    if (scene.userData.canyonWalls) {
      scene.userData.canyonWalls.forEach((wall, wi) => {
        if (wall.material) {
          wall.material.opacity = 0.0;
        }
      });
    }
    if (scene.userData.canyonLight) {
      scene.userData.canyonLight.intensity = 0.0;
    }
  }
}





function updateCalling(t, time) {
  const now = performance.now() / 1000.0;
  if (lastCallingTimeUpdate === 0) {
    lastCallingTimeUpdate = now;
  }
  const dt = now - lastCallingTimeUpdate;
  lastCallingTimeUpdate = now;

  const vp = scrollProgress * 13.0;
  const inZone = vp >= 4.8 && vp <= 6.5;
  const isTransitioningInOrActive = inZone || (getSectionOpacity(3) > 0.001);

  if (isTransitioningInOrActive) {
    callingZoneTime += dt;
    callingAutoplayTime += dt;
  } else {
    callingZoneTime = 0;
    callingAutoplayTime = 0;
    lastCallingTimeUpdate = 0;
  }

  if (scene.userData.callingGroup) {
    scene.userData.callingGroup.visible = getSectionOpacity(3) > 0.001;
  }

  if (isTransitioningInOrActive && scene.userData.callingScreens) {
    const Z = -290;
    const cubicInOut = (val) => val < 0.5 ? 4 * val * val * val : 1 - Math.pow(-2 * val + 2, 3) / 2;
    const animTime = callingAutoplayTime;

    // Master fade out as we exit the section (from vp = 6.1 to 6.5)
    let exitFade = clamp((6.5 - vp) / 0.4, 0, 1);

    // Master fade in as we enter the section (from vp = 4.2 to 4.7)
    let entryFade = clamp((vp - 4.2) / 0.5, 0, 1);



    scene.userData.callingScreens.forEach((mesh, si) => {
      const def = mesh.userData.def;
      let posX = 0;
      let posY = def.y;
      let posZ = Z;
      let rotY = 0;
      let opacity = 0;

      // ─── CARD 1: voiceCall (si === 0) ───
      if (si === 0) {
        if (animTime < 0.4) {
          // Centered & hold
          posX = 0;
          rotY = 0;
          posZ = Z;
          opacity = clamp(animTime / 0.1, 0, 1);
        } else if (animTime < 0.55) {
          // Slide left to final position
          const progress = clamp((animTime - 0.4) / 0.15, 0, 1);
          const ease = cubicInOut(progress);
          posX = lerp(0, def.finalX, ease);
          rotY = lerp(0, def.finalRy, ease);
          posZ = Z;
          opacity = 1.0;
        } else {
          // Parked at final position
          posX = def.finalX;
          rotY = def.finalRy;
          posZ = Z;
          opacity = 1.0;
        }
      }

      // ─── CARD 2: transcript (si === 1) ───
      else if (si === 1) {
        if (animTime < 0.4) {
          // Hidden behind Card 1
          posX = 0;
          rotY = 0;
          posZ = Z - 0.5;
          opacity = 0.0;
        } else if (animTime < 0.55) {
          // Emerge from behind Card 1 to center
          const progress = clamp((animTime - 0.4) / 0.15, 0, 1);
          const ease = cubicInOut(progress);
          posX = 0;
          rotY = 0;
          posZ = lerp(Z - 0.5, Z + 0.1, ease);
          opacity = progress;
        } else {
          // Center hold
          posX = 0;
          rotY = 0;
          posZ = Z + 0.1;
          opacity = 1.0;
        }
      }

      // ─── CARD 3: confirmed (si === 2) ───
      else if (si === 2) {
        if (animTime < 0.8) {
          // Hidden behind Card 2
          posX = 0;
          rotY = 0;
          posZ = Z - 0.5;
          opacity = 0.0;
        } else if (animTime < 0.95) {
          // Emerge from behind Card 2, slide right
          const progress = clamp((animTime - 0.8) / 0.15, 0, 1);
          const ease = cubicInOut(progress);
          posX = lerp(0, def.finalX, ease);
          rotY = lerp(0, def.finalRy, ease);
          posZ = lerp(Z - 0.5, Z, ease);
          opacity = progress;
        } else {
          // Stays visible, parked at final position
          posX = def.finalX;
          rotY = def.finalRy;
          posZ = Z;
          opacity = 1.0;
        }
      }

      // Gentle float once visible
      const isCardActive = (animTime >= 0 && si === 0) || (animTime >= 0.4 && si === 1) || (animTime >= 0.8 && si === 2);
      const floatY = isCardActive ? (Math.sin(time * 0.9 + si * 0.5) * 0.5 + 0.5) * 0.15 : 0;

      // Note: NO scroll-driven movement. No parallax card movement.
      mesh.position.set(posX, posY + floatY, posZ);
      mesh.rotation.y = rotY;
      const finalOpacity = opacity * entryFade * exitFade * getSectionOpacity(3);
      mesh.material.opacity = finalOpacity;
      mesh.visible = finalOpacity > 0.001;

      // Make the card material completely opaque when fully visible to ensure depth testing and occlusion
      if (finalOpacity >= 0.95) {
        mesh.material.transparent = false;
        mesh.material.depthWrite = true;
        mesh.material.depthTest = true;
        mesh.material.alphaTest = 0.5;
      } else {
        // Smooth transition fallback
        mesh.material.transparent = true;
        mesh.material.depthWrite = true;
        mesh.material.depthTest = true;
        mesh.material.alphaTest = 0.05;
      }
      mesh.material.needsUpdate = true;

      // Exit collapse (starts at vp = 6.1, ends at vp = 6.5)
      if (vp >= 6.1) {
        const collapseP = clamp((vp - 6.1) / 0.4, 0, 1);
        const easeCollapse = collapseP * collapseP;
        mesh.position.x = lerp(posX, 0, easeCollapse);
        mesh.position.z = lerp(posZ, Z - 40, easeCollapse);
        mesh.rotation.y = lerp(rotY, 0, easeCollapse);
      }
      mesh.scale.set(0.80, 0.80, 1.0);
    });
  } else {
    if (scene.userData.callingScreens) {
      scene.userData.callingScreens.forEach(mesh => {
        mesh.material.opacity = 0;
        mesh.visible = false;
        mesh.scale.set(0.80, 0.80, 1.0);
      });
    }
  }
}

function updateEcosystem(t, time) {
  const vp = scrollProgress * 13.0;
  const inZone = vp >= 12.0;
  const isTransitioningInOrActive = inZone || (getSectionOpacity(5) > 0.001);

  if (scene.userData.ecosystemGroup) {
    scene.userData.ecosystemGroup.visible = getSectionOpacity(5) > 0.001;
  }

  if (isTransitioningInOrActive) {
    // 1. Centerpiece logo fades in first between vp = 12.0 and 12.15
    const logoOpacity = clamp((vp - 12.0) / 0.15, 0, 1);
    
    // Payoff trigger starts after final orb assembly (vp >= 12.8)
    const payoff = vp >= 12.8 ? lerp(1.0, 2.0, clamp((vp - 12.8) / 0.5, 0, 1)) : 1.0;

    // Update centerpiece logo (junctionMesh) opacity and keep its scale completely stable (increased to 1.75)
    if (scene.userData.junctionMesh && scene.userData.junctionMesh.material) {
      scene.userData.junctionMesh.material.opacity = logoOpacity * 0.95 * getSectionOpacity(5);
      scene.userData.junctionMesh.renderOrder = 8; // Render behind orbs, above conduits
      scene.userData.junctionMesh.scale.set(1.75, 1.75, 1.75); // Enlarged to 1.75
    }
    
    // Float the nodes and rotate elements
    if (scene.userData.ecoNodes) {
      // Dynamically position the nodes based on camera viewport boundaries at z = -470
      const aspect = window.innerWidth / window.innerHeight;
      const fovRad = (camera.fov * Math.PI) / 360;
      const dist = Math.abs(camera.position.z - (-470));
      const halfHeight = dist * Math.tan(fovRad);
      const halfWidth = halfHeight * aspect;

      // Conversions: set centers to exactly 240px from left/right and 220px from top/bottom
      const marginX_units = (240 / window.innerWidth) * (2 * halfWidth);
      const marginY_units = (220 / window.innerHeight) * (2 * halfHeight);
      const targetX = halfWidth - marginX_units;
      const targetY = halfHeight - marginY_units;

      // Make center Y = 4.5 the horizontal symmetry line (4-quadrant corner layout)
      // Removed the 0.50 vertical centerline multiplier to keep the layout wide and closer to corners
      const dynamicPositions = [
        [-targetX, 4.5 + targetY, -470], // Top Left (Content Creation)
        [targetX, 4.5 + targetY, -470],  // Top Right (Website Experiences)
        [-targetX, 4.5 - targetY, -470], // Bottom Left (AI Calling Agents)
        [targetX, 4.5 - targetY, -470]   // Bottom Right (AI Texting Agents)
      ];

      // Compute delta time for frame-rate independent hover transitions
      const now = performance.now();
      const dt = now - lastEcoTime;
      lastEcoTime = now;

      scene.userData.ecoNodes.forEach((node, idx) => {
        const bp = dynamicPositions[idx];
        node.userData.basePos = bp;
        
        // Orbs remain perfectly stable at their base positions
        node.position.set(bp[0], bp[1], bp[2]);
        
        // Make the core body face the camera directly
        node.children[0].quaternion.copy(camera.quaternion);

        // ALIVE ORB SYSTEM - Slow breathing/pulsing animation
        const angle = (ecoTime / 3.2) * Math.PI * 2;
        const breathingScale = 1.00 + (Math.sin(angle) * 0.5 + 0.5) * 0.015 * payoff;
        
        // Smooth hover transition state tracking (300ms transition)
        if (node.userData.hoverFactor === undefined) {
          node.userData.hoverFactor = 0.0;
        }
        
        const isHovered = (idx === hoveredNodeIdx);
        const targetHover = isHovered ? 1.0 : 0.0;
        
        const speed = 1.0 / 300.0;
        const step = dt * speed;
        
        if (node.userData.hoverFactor < targetHover) {
          node.userData.hoverFactor = Math.min(targetHover, node.userData.hoverFactor + step);
        } else if (node.userData.hoverFactor > targetHover) {
          node.userData.hoverFactor = Math.max(targetHover, node.userData.hoverFactor - step);
        }
        
        const easeOutCubic = x => 1 - Math.pow(1 - x, 3);
        const easedHover = targetHover > 0 
          ? easeOutCubic(node.userData.hoverFactor)
          : 1 - easeOutCubic(1 - node.userData.hoverFactor);
        
        const finalScale = lerp(breathingScale, 1.65, easedHover);
        node.children[0].scale.set(finalScale, finalScale, 1.0);
        
        if (isHovered) {
          node.children[0].renderOrder = 15;
        } else if (node.userData.hoverFactor > 0) {
          node.children[0].renderOrder = 12;
        } else {
          node.children[0].renderOrder = 10;
        }
        
        // Fade in core mesh (orbs) between t = 0.88 and 0.93
        const coreMesh = node.children[0];
        if (coreMesh.material) {
          const baseOp = coreMesh.material.userData.baseOpacity !== undefined ? coreMesh.material.userData.baseOpacity : 1.0;
          const orbZoneOpacity = clamp((vp - 12.0) / 0.15, 0, 1) * getSectionOpacity(5);
          coreMesh.material.opacity = baseOp * orbZoneOpacity;
          
          // Balanced highlight on hover
          const highlightBoost = 1.0 + 0.3 * easedHover;
          coreMesh.material.color.setRGB(highlightBoost, highlightBoost, highlightBoost);
        }
      });

      // Check if orb targets have moved, update spline anchors, and rebuild tube geometry dynamically
      const tl = dynamicPositions[0];
      const tr = dynamicPositions[1];
      const bl = dynamicPositions[2];
      const br = dynamicPositions[3];

      if (pTopLeft.x !== tl[0] || pTopLeft.y !== tl[1] ||
          pTopRight.x !== tr[0] || pTopRight.y !== tr[1] ||
          pBottomLeft.x !== bl[0] || pBottomLeft.y !== bl[1] ||
          pBottomRight.x !== br[0] || pBottomRight.y !== br[1]) {
        
        pTopLeft.set(tl[0], tl[1], tl[2]);
        pTopRight.set(tr[0], tr[1], tr[2]);
        pBottomLeft.set(bl[0], bl[1], bl[2]);
        pBottomRight.set(br[0], br[1], br[2]);

        // Rebuild ecosystem curves based on new dynamic positions
        rebuildEcosystemStreams();
      }
    }

    // Converging ecosystem streams replaced by single continuous master stream

    // Drifting eco background particles update
    if (scene.userData.ecoParticles) {
      const pts = scene.userData.ecoParticles;
      pts.rotation.y = ecoTime * 0.02;
      pts.rotation.z = ecoTime * 0.01;
      if (pts.material) {
        const baseOp = pts.material.userData.baseOpacity !== undefined ? pts.material.userData.baseOpacity : 0.25;
        const ptsOpacity = clamp((vp - 12.0) / 0.15, 0, 1) * getSectionOpacity(5); // Fades in with centerpiece logo
        pts.material.opacity = baseOp * ptsOpacity;
        pts.material.size = 0.08 * payoff; // scale particle size by payoff
      }
    }

    // Ecosystem point light payoff
    if (lightEco) {
      lightEco.intensity = 0.7 + 0.8 * (payoff - 1.0);
    }
  } else {
    // Hide logo, nodes and point lights
    if (scene.userData.junctionMesh && scene.userData.junctionMesh.material) {
      scene.userData.junctionMesh.material.opacity = 0.0;
    }
    if (scene.userData.ecoNodes) {
      scene.userData.ecoNodes.forEach((node) => {
        const coreMesh = node.children[0];
        if (coreMesh && coreMesh.material) coreMesh.material.opacity = 0.0;
      });
    }

    if (scene.userData.ecoParticles && scene.userData.ecoParticles.material) {
      scene.userData.ecoParticles.material.opacity = 0.0;
    }
  }
}

function updateTexting(t, time) {
  const now = performance.now() / 1000.0;
  if (lastTextingTimeUpdate === 0) {
    lastTextingTimeUpdate = now;
  }
  const dt = now - lastTextingTimeUpdate;
  lastTextingTimeUpdate = now;

  const vp = scrollProgress * 13.0;
  // Texting zone: active strictly from vp = 8.8 to 10.5
  const inZone = vp >= 8.8 && vp <= 10.5;

  const isTransitioningInOrActive = inZone || (getSectionOpacity(4) > 0.001);

  if (scene.userData.textingGroup) {
    scene.userData.textingGroup.visible = getSectionOpacity(4) > 0.001;
  }

  // Phone enters after camera settles at Section 5 (AI Texting Agents)
  const startEnteringPhone = isTransitioningInOrActive && (currentSectionIdx === 4 && sectionTransitionProgress >= 0.99);
  let phoneOpacity = 1.0;
  if (vp < 9.1) {
    phoneOpacity = clamp((vp - 8.8) / 0.3, 0, 1);
  } else if (vp > 10.2) {
    phoneOpacity = clamp((10.5 - vp) / 0.3, 0, 1);
  }

  if (startEnteringPhone) {
    textingRevealTime = Math.min(1.0, textingRevealTime + dt / 1.2);
  } else {
    textingRevealTime = Math.max(0.0, textingRevealTime - dt / 1.2);
    textingPhoneSettled = false; // Reset settlement lock when leaving zone
  }

  // SETTLEMENT LOCK: phone must be fully in position before any UI animates
  if (textingRevealTime >= 0.99) {
    textingPhoneSettled = true;
  }

  if (startEnteringPhone && textingPhoneSettled) {
    textingAutoplayTime += dt;
  } else {
    textingAutoplayTime = 0;
  }



  if (isTransitioningInOrActive) {
    
    // Main river tube (disabled for visual cleanup)
    if (scene.userData.riverTube) {
      scene.userData.riverTube.material.opacity = 0;
    }

    // Text bubbles float & relative camera positioning to keep phone centered and stable
    if (scene.userData.textBubbles) {
      scene.userData.textBubbles.forEach(b => {
        // Calculate camera look direction including parallax
        const lookDir = new THREE.Vector3().subVectors(lookTarget, camera.position).normalize();
        const phoneDist = 7.2; // 15% visual reduction for proper breathing margins
        
        // Position phone along the camera look axis at a fixed distance
        b.position.copy(camera.position).addScaledVector(lookDir, phoneDist);
        
        // Slide phone upward relative to local camera Up-axis
        const camUp = new THREE.Vector3(0, 1, 0).applyQuaternion(camera.quaternion);
        const slideOffset = (1.0 - textingRevealTime) * -9.5;
        b.position.addScaledVector(camUp, slideOffset);
        
        // Compute slow, premium floating/breathing offsets
        const floatY = Math.sin(time * 0.35 + b.userData.phase) * 0.14;
        const floatX = Math.cos(time * 0.25 + b.userData.phase) * 0.08;
        
        // Compute mouse parallax offsets
        const mouseParallaxX = mouse.sx * 0.28;
        const mouseParallaxY = mouse.sy * 0.22;
        
        // Project offsets relative to local camera axes
        const camRight = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
        b.position.addScaledVector(camRight, floatX + mouseParallaxX);
        b.position.addScaledVector(camUp, floatY + mouseParallaxY);
        
        // Compute organic rotational breathing drift
        const floatRotZ = Math.sin(time * 0.15 + b.userData.phase) * 0.02;
        const floatRotY = Math.cos(time * 0.12 + b.userData.phase) * 0.025;
        const floatRotX = Math.sin(time * 0.10 + b.userData.phase) * 0.02;
        
        // Compute interactive mouse tilts
        const mouseRotY = mouse.sx * 0.14;
        const mouseRotX = -mouse.sy * 0.087;
        
        // Align phone flat with camera and apply tilts
        b.quaternion.copy(camera.quaternion);
        const euler = new THREE.Euler().setFromQuaternion(b.quaternion);
        euler.x += floatRotX + mouseRotX;
        euler.y += floatRotY + mouseRotY;
        euler.z += floatRotZ;
        b.quaternion.setFromEuler(euler);
        
        // Scale slightly while entering (starts at 92%, scales to 100%)
        const entryScale = 0.92 + 0.08 * textingRevealTime;
        const floatScale = 1.0 + Math.sin(time * 0.2 + b.userData.phase) * 0.015;
        b.scale.set(entryScale * floatScale, entryScale * floatScale, 1.0);
        
        const finalOpacity = phoneOpacity * 0.98 * getSectionOpacity(4);
        b.material.opacity = finalOpacity;
        b.visible = finalOpacity > 0.001;

        // Make the card material completely opaque when fully visible to ensure depth testing and occlusion
        if (finalOpacity >= 0.95) {
          b.material.transparent = false;
          b.material.depthWrite = true;
          b.material.depthTest = true;
          b.material.alphaTest = 0.5;
        } else {
          // Smooth transition fallback
          b.material.transparent = true;
          b.material.depthWrite = true;
          b.material.depthTest = true;
          b.material.alphaTest = 0.05;
        }
        b.material.needsUpdate = true;
      });
    }

    // Branch glow pulse (disabled for visual cleanup)
    if (scene.userData.branches) {
      scene.userData.branches.forEach((b, i) => {
        b.tube.material.opacity = 0;
        b.tube.material.emissiveIntensity = 0;
      });
    }

    // Message particle flow along branches (disabled for visual cleanup)
    if (scene.userData.msgMat) {
      scene.userData.msgMat.opacity = 0;
    }
  } else {
    // Hide all texting elements strictly
    if (scene.userData.riverTube) {
      scene.userData.riverTube.material.opacity = 0;
    }
    if (scene.userData.textBubbles) {
      scene.userData.textBubbles.forEach(b => {
        b.material.opacity = 0;
        b.visible = false;
      });
    }
    if (scene.userData.branches) {
      scene.userData.branches.forEach(b => {
        b.tube.material.opacity = 0;
      });
    }
    if (scene.userData.msgMat) {
      scene.userData.msgMat.opacity = 0;
    }
  }
}





const goldCurves = [
  curveHeroToContent,
  curveContentToWebsites,
  curveWebsitesToCalling,
  curveCallingToTexting,
  curveTextingToEcosystem
];

const goldCurveTravelLimits = [
  0.90, // Hero -> Content
  0.92, // Content -> Website
  0.33, // Website -> Calling
  0.60, // Calling -> Texting
  0.45  // Texting -> Ecosystem
];

function getSectionOpacity(idx) {
  if (sectionTransitionProgress >= 1.0) {
    return (idx === currentSectionIdx) ? 1.0 : 0.0;
  }
  const progress = clamp(transitionTimeElapsed / transitionDuration, 0, 1);
  if (idx === currentSectionIdx) {
    if (progress < 0.2) {
      return 1.0 - (progress / 0.2);
    }
    return 0.0;
  }
  if (idx === targetSectionIdx) {
    if (progress < 0.5) {
      return 0.0;
    }
    return (progress - 0.5) / 0.5;
  }
  return 0.0;
}

const camTarget  = new THREE.Vector3();
const lookTarget = new THREE.Vector3();

function animate() {
  requestAnimationFrame(animate);
  time += 0.01;
  tickDynamicTextures();

  /* -- Smooth snap transitions -- */
  const nowAnimate = performance.now() / 1000.0;
  const dt = nowAnimate - lastAnimateTime;
  lastAnimateTime = nowAnimate;

  let progressVal = 1.0;
  if (sectionTransitionProgress < 1.0) {
    transitionTimeElapsed += dt;
    progressVal = clamp(transitionTimeElapsed / transitionDuration, 0, 1);
    
    // Phase 1 (0.0 to 0.2): Fade out departure. Camera does not move yet.
    if (progressVal < 0.2) {
      scrollProgress = startScrollProgress;
    }
    // Phase 2 (0.2 to 0.8): Travel. Camera moves along spline using t_travel.
    else if (progressVal <= 0.8) {
      const t_travel = (progressVal - 0.2) / 0.6;
      const ease = t_travel * t_travel * (3 - 2 * t_travel); // smoothstep
      scrollProgress = lerp(startScrollProgress, targetScrollProgress, ease);
    }
    // Phase 3 (0.8 to 1.0): Settle. Camera is at destination.
    else {
      scrollProgress = targetScrollProgress;
    }

    if (progressVal >= 1.0) {
      sectionTransitionProgress = 1.0;
      currentSectionIdx = targetSectionIdx;
      scrollProgress = targetScrollProgress;
    }
  }

  // Active section typing time accumulator
  if (sectionTransitionProgress >= 0.99) {
    sectionActiveTimes[currentSectionIdx] += dt;
  } else {
    for (let i = 0; i < sectionActiveTimes.length; i++) {
      if (i !== targetSectionIdx) {
        sectionActiveTimes[i] = 0;
      }
    }
  }
  
  // ═══════════════════════════════════════════════════════════════════
  // SCROLL → CAMERA PROGRESS REMAPPING
  //
  // Layout (1200vh total scroll — minimal travel gaps):
  //   s 0.00–0.30 → t 0.00–0.40  Hero + Content + Websites     (360vh)
  //   s 0.30–0.32 → t 0.40–0.44  Travel: website → calling     ( 24vh — minimal)
  //   s 0.32–0.64 → t 0.44–0.615 CALLING AGENTS                (384vh)
  //   s 0.64–0.67 → t 0.615–0.67 Travel: calling → texting     ( 36vh — 0.5 viewport)
  //   s 0.67–0.87 → t 0.67–0.82  TEXTING AGENTS                (240vh)
  //   s 0.87–0.89 → t 0.82–0.86  Travel: texting → ecosystem   ( 24vh — minimal)
  //   s 0.89–1.00 → t 0.86–max   ECOSYSTEM                     (132vh)
  // ═══════════════════════════════════════════════════════════════════
  const vp = scrollProgress * 13.0;
  let activeVp = vp;
  if (isWebsiteScrollMode()) {
    activeVp = 2.0 + websiteScrollProgress * 1.4; // maps websiteScrollProgress 0..1 to activeVp 2.0..3.4
  }
  let t = 0;
  if (activeVp < 3.0) {
    t = (activeVp / 3.0) * 0.38;
  } else if (activeVp < 4.0) {
    t = 0.38 + (activeVp - 3.0) * 0.10;
  } else if (activeVp < 7.0) {
    t = 0.48 + ((activeVp - 4.0) / 3.0) * 0.10;
  } else if (activeVp < 7.75) {
    t = 0.58 + ((activeVp - 7.0) / 0.75) * 0.10;
  } else if (activeVp < 11.25) {
    t = 0.68 + ((activeVp - 7.75) / 3.5) * 0.12;
  } else if (activeVp < 11.75) {
    t = 0.80 + ((activeVp - 11.25) / 0.5) * 0.08;
  } else {
    t = 0.88 + clamp((activeVp - 11.75) / 1.25, 0, 1) * (maxSafeT - 0.88);
  }
  t = clamp(t, 0, maxSafeT);

  // Accumulate ecoTime with payoff speed multiplier
  const payoff = t >= 0.86 ? lerp(1.0, 2.0, clamp((t - 0.86) / 0.08, 0, 1)) : 1.0;
  ecoTime += 0.01 * payoff;

  /* -- Mouse smooth -- */
  mouse.sx = lerp(mouse.sx, mouse.x, 0.04);
  mouse.sy = lerp(mouse.sy, mouse.y, 0.04);

  /* -- Helper for stationary camera state at each section -- */
  function getStationCamera(sectionIdx, webProgress) {
    if (sectionIdx === 2) {
      // Custom Website Experiences Exhibition walk-through (between the rows at X=0)
      const camZ = lerp(-195.0, -272.0, webProgress);
      // Non-linear elevation ramp: starting lower (Row 1), eye-level (Row 2), elevated overlook (Row 3)
      const easeY = Math.pow(webProgress, 1.5);
      const camY = 1.2 + easeY * 8.0;
      const pos = new THREE.Vector3(0.0, camY, camZ);
      const look = new THREE.Vector3(0.0, camY + easeY * 2.0, camZ - 20.0); // look slightly upward as we rise
      return { pos, look };
    } else {
      // Normal sections: evaluate CAM_PATH and LOOK_PATH at their fixed station positions
      const secVp = SECTIONS[sectionIdx].vp;
      let secT = 0;
      if (secVp < 3.0) {
        secT = (secVp / 3.0) * 0.38;
      } else if (secVp < 4.0) {
        secT = 0.38 + (secVp - 3.0) * 0.10;
      } else if (secVp < 7.0) {
        secT = 0.48 + ((secVp - 4.0) / 3.0) * 0.10;
      } else if (secVp < 7.75) {
        secT = 0.58 + ((secVp - 7.0) / 0.75) * 0.10;
      } else if (secVp < 11.25) {
        secT = 0.68 + ((secVp - 7.75) / 3.5) * 0.12;
      } else if (secVp < 11.75) {
        secT = 0.80 + ((secVp - 11.25) / 0.5) * 0.08;
      } else {
        secT = 0.88 + clamp((secVp - 11.75) / 1.25, 0, 1) * (maxSafeT - 0.88);
      }
      secT = clamp(secT, 0, maxSafeT);
      const pos = CAM_PATH.getPoint(secT);
      const look = LOOK_PATH.getPoint(secT);
      return { pos, look };
    }
  }

  // Determine mouse parallax scaling based on location
  const inTunnel = (t >= 0.40 && t <= 0.48);
  const isEcosystem = (t >= 0.82);
  const parallaxScale = isEcosystem ? 0.0 : (inTunnel ? 0.15 : 1.0);
  const parallaxX = mouse.sx * 1.8 * parallaxScale;
  const parallaxY = mouse.sy * 0.8 * parallaxScale;

  const finalCamTarget = new THREE.Vector3();
  const finalLookTarget = new THREE.Vector3();

  const fromIdx = currentSectionIdx;
  const toIdx = targetSectionIdx;

  if (sectionTransitionProgress < 1.0) {
    // ── STATE 1: ROLLER COASTER TRAVEL ──
    const startState = getStationCamera(fromIdx, fromIdx === 2 ? websiteScrollProgress : 0.0);
    const endState = getStationCamera(toIdx, toIdx === 2 ? websiteScrollProgress : 0.0);

    if (progressVal < 0.2) {
      // Phase 1: Departure hold
      finalCamTarget.copy(startState.pos);
      finalLookTarget.copy(startState.look);
    } else if (progressVal > 0.8) {
      // Phase 3: Settle hold
      finalCamTarget.copy(endState.pos);
      finalLookTarget.copy(endState.look);
    } else {
      // Phase 2: Traveling on tube
      const t_travel = (progressVal - 0.2) / 0.6; // 0..1
      const minIdx = Math.min(fromIdx, toIdx);
      const followCurve = goldCurves[minIdx];
      let limit = goldCurveTravelLimits[minIdx];
      if (minIdx === 1) {
        limit = 0.36; // Dismount at Z = -195 (Gallery entry)
      }

      let followProgress = 0.0;
      if (toIdx > fromIdx) {
        followProgress = t_travel * limit;
      } else {
        followProgress = (1.0 - t_travel) * limit;
      }

      const pTube = followCurve.getPointAt(Math.min(followProgress, 0.9999));
      const tangent = followCurve.getTangentAt(Math.min(followProgress, 0.9999)).normalize();
      const upVec = new THREE.Vector3(0, 1, 0);
      const rightVec = new THREE.Vector3().crossVectors(tangent, upVec).normalize();
      const actualUp = new THREE.Vector3().crossVectors(rightVec, tangent).normalize();

      // Banking into turns
      const bankAngle = clamp(rightVec.y * 0.25, -0.10, 0.10);
      if (Math.abs(bankAngle) > 0.001) {
        actualUp.applyAxisAngle(tangent, bankAngle);
      }

      const rideHeight = 3.5;
      const tubeCamPos = pTube.clone().addScaledVector(actualUp, rideHeight);
      const tubeLookPos = pTube.clone().addScaledVector(tangent, 8.0).addScaledVector(actualUp, -1.0);

      // Extended transition boarding/dismounting blend ranges (35% of travel) for deliberate moving walkway dismount/boarding feel
      const blendRange = 0.35;
      if (t_travel < blendRange) {
        const boardBlend = t_travel / blendRange;
        const easeBlend = 0.5 * (1.0 - Math.cos(boardBlend * Math.PI));
        finalCamTarget.copy(startState.pos).lerp(tubeCamPos, easeBlend);
        finalLookTarget.copy(startState.look).lerp(tubeLookPos, easeBlend);

        if (fromIdx === 2) {
          // Boarding: lift camera vertically above tube
          const liftOffset = Math.sin(boardBlend * Math.PI) * 1.5;
          finalCamTarget.y += liftOffset;
        }
      } else if (t_travel > (1.0 - blendRange)) {
        const dismountBlend = (1.0 - t_travel) / blendRange;
        const easeBlend = 0.5 * (1.0 - Math.cos(dismountBlend * Math.PI));
        finalCamTarget.copy(endState.pos).lerp(tubeCamPos, easeBlend);
        finalLookTarget.copy(endState.look).lerp(tubeLookPos, easeBlend);

        if (toIdx === 2) {
          // Dismounting: lift camera above tube then drop gently onto ramp
          const liftOffset = Math.sin((1.0 - dismountBlend) * Math.PI) * 1.5;
          finalCamTarget.y += liftOffset;
        }
      } else {
        finalCamTarget.copy(tubeCamPos);
        finalLookTarget.copy(tubeLookPos);
      }
    }
  } else {
    // ── STATE 2 & 3: PARKED / STATIONARY ──
    scene.userData.followBlend = 0.0; // Hard dismount: clear any residual blend weight immediately
    const currentState = getStationCamera(currentSectionIdx, currentSectionIdx === 2 ? websiteScrollProgress : 0.0);
    finalCamTarget.copy(currentState.pos);
    finalLookTarget.copy(currentState.look);
  }

  // Apply cursor influence and parallax to target positions
  finalCamTarget.x += parallaxX;
  finalCamTarget.y += parallaxY;
  finalLookTarget.x += parallaxX * 0.3;
  finalLookTarget.y += parallaxY * 0.3;

  camera.position.lerp(finalCamTarget, 0.12);
  lookTarget.lerp(finalLookTarget, 0.12);
  camera.lookAt(lookTarget);

  /* -- Zone updates -- */
  updateContent(t, time, dt);

  // ── WEBSITE EXPERIENCES SCROLL MODE: override vp when user is exploring websites ──
  if (isWebsiteScrollMode()) {
    updateWebsites(t, time, activeVp);
  } else {
    // Normal: websites animate based on global scroll vp
    // Reset websiteScrollTick when leaving section 2 going forward
    if (currentSectionIdx > 2 && websiteScrollTick !== WEBSITE_SCROLL_STEPS) {
      websiteScrollTick = WEBSITE_SCROLL_STEPS;
      websiteScrollProgress = 1.0;
    } else if (currentSectionIdx < 2 && websiteScrollTick !== 0) {
      websiteScrollTick = 0;
      websiteScrollProgress = 0.0;
    }
    updateWebsites(t, time);
  }
  updateCalling(t, time);
  updateTexting(t, time);
  updateEcosystem(t, time);

  // ═══════════════════════════════════════════
  // PROGRESSIVE LIQUID GOLD GUIDE STREAM GENERATION (REAL-TIME SCROLL REVEAL)
  // ═══════════════════════════════════════════
  // ═══════════════════════════════════════════
  // PROGRESSIVE LIQUID GOLD GUIDE STREAMS GENERATION (SECTION-OWNED STREAMS)
  // ═══════════════════════════════════════════
  // vp is already defined above in animate() scope

  // ── PROGRESSIVE LIQUID GOLD GUIDE STREAMS GENERATION (SECTION-OWNED STREAMS) ──
  if (goldMeshes && goldMeshes.length === 5) {
    let fromIdx = currentSectionIdx;
    let toIdx = targetSectionIdx;
    if (sectionTransitionProgress >= 0.999) {
      fromIdx = currentSectionIdx;
      toIdx = currentSectionIdx;
    }

    const minIdx = Math.min(fromIdx, toIdx);
    const maxIdx = Math.max(fromIdx, toIdx);
    const isParked = (minIdx === maxIdx);

    // Compute target progress for each of the 5 segments
    const segmentProgresses = [0, 0, 0, 0, 0];

    if (isParked) {
      for (let i = 0; i < 5; i++) {
        segmentProgresses[i] = getParkedSegmentProgress(currentSectionIdx, i, callingAutoplayTime, textingAutoplayTime);
      }
    } else {
      // Transitioning
      const progress = clamp(transitionTimeElapsed / transitionDuration, 0, 1);
      if (progress < 0.2) {
        // Phase 1: departure fades out. Tube is still at departure parked state
        for (let i = 0; i < 5; i++) {
          segmentProgresses[i] = getParkedSegmentProgress(fromIdx, i, callingAutoplayTime, textingAutoplayTime);
        }
      } else if (progress > 0.8) {
        // Phase 3: destination fades in. Tube is at destination parked state
        for (let i = 0; i < 5; i++) {
          segmentProgresses[i] = getParkedSegmentProgress(toIdx, i, callingAutoplayTime, textingAutoplayTime);
        }
      } else {
        // Phase 2: active travel along curveIdx
        const curveIdx = minIdx;
        const t_travel = (progress - 0.2) / 0.6;
        for (let i = 0; i < 5; i++) {
          if (i < curveIdx) {
            segmentProgresses[i] = 1.0;
          } else if (i > curveIdx) {
            segmentProgresses[i] = 0.0;
          } else {
            // Active segment grows with t_travel
            const limit = goldCurveTravelLimits[curveIdx];
            if (toIdx > fromIdx) {
              segmentProgresses[i] = t_travel * limit;
            } else {
              segmentProgresses[i] = (1.0 - t_travel) * limit;
            }
          }
        }
      }
    }

    // Master opacity envelope matching the snap transition phases
    let goldTubeMasterOpacity = 0.0;
    if (sectionTransitionProgress >= 1.0) {
      // Parked: guide tube is visible ONLY for Website Experiences
      goldTubeMasterOpacity = (currentSectionIdx === 2) ? 1.0 : 0.0;
    } else {
      // Transitioning
      const progress = clamp(transitionTimeElapsed / transitionDuration, 0, 1);
      if (progress < 0.2) {
        goldTubeMasterOpacity = 0.0;
      } else if (progress >= 0.2 && progress < 0.35) {
        goldTubeMasterOpacity = (progress - 0.2) / 0.15; // Fade in
      } else if (progress >= 0.35 && progress <= 0.65) {
        goldTubeMasterOpacity = 1.0;
      } else if (progress > 0.65 && progress <= 0.8) {
        if (targetSectionIdx === 2) {
          goldTubeMasterOpacity = 1.0; // Stays visible for Website Experiences
        } else {
          goldTubeMasterOpacity = (0.8 - progress) / 0.15; // Fade out
        }
      } else {
        goldTubeMasterOpacity = (targetSectionIdx === 2) ? 1.0 : 0.0;
      }
    }

    // Update each of the 5 segment meshes
    for (let i = 0; i < 5; i++) {
      const mesh = goldMeshes[i];
      mesh.material.uniforms.time.value = time;
      mesh.material.uniforms.opacity.value = goldTubeMasterOpacity;

      const progressVal = segmentProgresses[i];
      mesh.material.uniforms.progress.value = progressVal;

      if (progressVal > 0.001) {
        mesh.visible = true;
      } else {
        mesh.visible = false;
      }
    }
  }

  // 2. Ecosystem Branch Streams
  if (branchTLMesh && branchTRMesh && branchBLMesh && branchBRMesh) {
    branchTLMesh.material.uniforms.time.value = time;
    branchTRMesh.material.uniforms.time.value = time;
    branchBLMesh.material.uniforms.time.value = time;
    branchBRMesh.material.uniforms.time.value = time;

    // Branches grow outward from the logo center when the master stream reaches the logo (progress >= 0.95, corresponding to vp >= 11.0)
    let targetEcoProgress = clamp((vp - 11.0) / 1.0, 0.0, 1.0);
    if (scene.userData.smoothEcoProgress === undefined) {
      scene.userData.smoothEcoProgress = targetEcoProgress;
    }
    scene.userData.smoothEcoProgress = lerp(scene.userData.smoothEcoProgress, targetEcoProgress, 0.05);
    const ecoProgress = scene.userData.smoothEcoProgress;

    // Diagonal streams split outward from Kllezo logo after supply stream reaches the logo center
    let diagonalProgress = clamp((ecoProgress - 0.5) * 2.0, 0.0, 1.0);

    branchTLMesh.material.uniforms.progress.value = diagonalProgress;
    branchTRMesh.material.uniforms.progress.value = diagonalProgress;
    branchBLMesh.material.uniforms.progress.value = diagonalProgress;
    branchBRMesh.material.uniforms.progress.value = diagonalProgress;

    if (diagonalProgress > 0.001) {
      branchTLMesh.visible = true;
      branchTRMesh.visible = true;
      branchBLMesh.visible = true;
      branchBRMesh.visible = true;

      // Branch visibility/opacity
      let branchOpacity = clamp((vp - 11.25) / 0.55, 0.0, 1.0);
      if (vp > 12.8) {
        // Disappear once ecosystem section ends (CTA phase)
        branchOpacity *= clamp((13.5 - vp) / 0.7, 0.0, 1.0);
      }
      branchOpacity *= getSectionOpacity(5); // Apply transition fade
      
      branchTLMesh.material.uniforms.opacity.value = branchOpacity;
      branchTRMesh.material.uniforms.opacity.value = branchOpacity;
      branchBLMesh.material.uniforms.opacity.value = branchOpacity;
      branchBRMesh.material.uniforms.opacity.value = branchOpacity;
    } else {
      branchTLMesh.visible = false;
      branchTRMesh.visible = false;
      branchBLMesh.visible = false;
      branchBRMesh.visible = false;

      branchTLMesh.material.uniforms.opacity.value = 0.0;
      branchTRMesh.material.uniforms.opacity.value = 0.0;
      branchBLMesh.material.uniforms.opacity.value = 0.0;
      branchBRMesh.material.uniforms.opacity.value = 0.0;
    }
  }

  /* -- Void particles drift -- */
  const heroOpacityVal = getSectionOpacity(0);
  if (scene.userData.heroRing) {
    scene.userData.heroRing.visible = heroOpacityVal > 0.001;
    if (scene.userData.heroRing.visible && scene.userData.heroRing.material) {
      scene.userData.heroRing.rotation.z = time * 0.03;
      scene.userData.heroRing.material.transparent = true;
      if (scene.userData.heroRing.material.userData.baseOpacity === undefined) {
        scene.userData.heroRing.material.userData.baseOpacity = scene.userData.heroRing.material.opacity;
      }
      scene.userData.heroRing.material.opacity = scene.userData.heroRing.material.userData.baseOpacity * heroOpacityVal;
    }
  }

  if (voidGeo) {
    const posAttr = voidGeo.getAttribute('position');
    const posArray = posAttr.array;
    const baseSpeed = 0.02;
    const scrollSpeed = Math.abs(scrollRaw - scrollProgress) * 0.8;
    const speed = baseSpeed + scrollSpeed;

    const isSuctionZone = t >= 0.78 && t <= 0.83;

    for (let i = 0; i < VOID_COUNT; i++) {
      let pSpeed = speed;
      if (isSuctionZone) {
        // Accelerate Z speed during gravitational pull
        pSpeed = speed * (1.0 + 3.0 * suctionStrength);
      }
      
      // Move star towards positive Z (towards camera)
      posArray[i * 3 + 2] += pSpeed;

      if (isSuctionZone) {
        // 1. Converge particles towards center axis (X=0, Y=0)
        posArray[i * 3] *= 0.95;
        posArray[i * 3 + 1] *= 0.95;

        // 2. Add subtle spiraling physics around the central axis
        const spiralAngle = 0.04 * suctionStrength;
        const x = posArray[i * 3];
        const y = posArray[i * 3 + 1];
        posArray[i * 3] = x * Math.cos(spiralAngle) - y * Math.sin(spiralAngle);
        posArray[i * 3 + 1] = x * Math.sin(spiralAngle) + y * Math.cos(spiralAngle);
      }

      // Wrap if it passes behind the camera
      if (posArray[i * 3 + 2] > camera.position.z + 10) {
        posArray[i * 3 + 2] = -470;
        // Randomize X and Y when wrapping
        const r = rand(10, 80);
        const theta = rand(0, TAU);
        const phi = rand(0, PI);
        posArray[i * 3] = r * Math.sin(phi) * Math.cos(theta) * rand(0.5, 2.0);
        posArray[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * rand(0.3, 1.2);
      }
    }
    posAttr.needsUpdate = true;
  }

  /* -- Background -- */
  updateBackground(t);

  /* -- Overlay -- */
  updateOverlay(t);

  // Centralized scroll instruction manager
  const scrollInstruction = document.getElementById('scroll-instruction');
  if (scrollInstruction) {
    if (currentSectionIdx === 3) {
      if (callingAutoplayTime < 2.8) {
        scrollInstruction.textContent = "Scroll resumes automatically after the interaction.";
        scrollInstruction.style.opacity = '0.5';
      } else {
        scrollInstruction.textContent = "Continue Scrolling";
        scrollInstruction.style.opacity = '1';
      }
    } else if (currentSectionIdx === 4) {
      if (textingAutoplayTime < 12.0) {
        scrollInstruction.textContent = "Finish exploring this conversation to continue scrolling.";
        scrollInstruction.style.opacity = '0.5';
      } else {
        scrollInstruction.textContent = "Continue Scrolling";
        scrollInstruction.style.opacity = '1';
      }
    } else {
      scrollInstruction.style.opacity = '0';
    }
  }

  /* -- Cursor -- */
  updateCursor();

  renderer.render(scene, camera);
}

/* ═══════════════════════════════════════════
   19. START
   ═══════════════════════════════════════════ */
document.getElementById('scroll-driver').style.height = '1400vh';
animate();
