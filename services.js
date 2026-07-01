/* ═════════════════════════════════════════════════════════════════════
   KLLEZO Services Page V3 — JavaScript Engine
   Ambient software demo animations & custom cursor
   ═════════════════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {

  /* ── 1. Custom Cursor ── */
  const curDot = document.getElementById('cur-dot');
  const curRing = document.getElementById('cur-ring');
  let cx = -100, cy = -100, rx = -100, ry = -100;
  let isInitialized = false;

  window.addEventListener('mousemove', e => {
    cx = e.clientX;
    cy = e.clientY;
    if (!isInitialized) {
      rx = cx; ry = cy;
      isInitialized = true;
      if (curDot && curRing) {
        curDot.classList.add('active');
        curRing.classList.add('active');
      }
    }
  });

  document.addEventListener('mouseleave', () => {
    if (curDot && curRing) {
      curDot.classList.remove('active');
      curRing.classList.remove('active');
    }
  });

  document.addEventListener('mouseenter', () => {
    if (isInitialized && curDot && curRing) {
      curDot.classList.add('active');
      curRing.classList.add('active');
    }
  });

  document.querySelectorAll('a, button, .solution-card, .video-placeholder-frame').forEach(el => {
    el.addEventListener('mouseenter', () => document.body.classList.add('hov'));
    el.addEventListener('mouseleave', () => document.body.classList.remove('hov'));
  });

  function renderCursor() {
    if (isInitialized && curDot && curRing) {
      rx += (cx - rx) * 0.14;
      ry += (cy - ry) * 0.14;
      curDot.style.left = cx + 'px';
      curDot.style.top = cy + 'px';
      curRing.style.left = rx + 'px';
      curRing.style.top = ry + 'px';
    }
    requestAnimationFrame(renderCursor);
  }
  renderCursor();

  /* ── 2. Ambient Software Demo Lifecycle ── */
  const demoObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const windowEl = entry.target;
      if (entry.isIntersecting) {
        windowEl.dataset.active = "true";
      } else {
        windowEl.dataset.active = "false";
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.demo-window').forEach(demo => demoObserver.observe(demo));

  // Periodically update graph bars for Content OS Demo
  const graphBars = document.querySelectorAll('#demo-content .graph-bar');
  if (graphBars.length > 0) {
    setInterval(() => {
      const contentDemo = document.getElementById('demo-content');
      if (contentDemo && contentDemo.dataset.active === "true") {
        graphBars.forEach(bar => {
          const randomH = Math.floor(Math.random() * 60) + 30;
          bar.style.height = randomH + '%';
        });
      }
    }, 2500);
  }

  /* ── 3. Accordion (FAQ) Toggle ── */
  const faqQuestions = document.querySelectorAll('.faq-question-premium');
  faqQuestions.forEach(button => {
    button.addEventListener('click', () => {
      const item = button.parentElement;
      const answer = item.querySelector('.faq-answer-premium');
      const isActive = item.classList.contains('active');

      // Close other accordion items
      document.querySelectorAll('.faq-item-premium').forEach(otherItem => {
        if (otherItem !== item) {
          otherItem.classList.remove('active');
          const otherAnswer = otherItem.querySelector('.faq-answer-premium');
          if (otherAnswer) otherAnswer.style.maxHeight = null;
        }
      });

      if (isActive) {
        item.classList.remove('active');
        answer.style.maxHeight = null;
      } else {
        item.classList.add('active');
        answer.style.maxHeight = answer.scrollHeight + 'px';
      }
    });
  });

  /* ── 4. Solution Card Expand ── */
  const solutionCards = document.querySelectorAll('.solution-premium-card');
  solutionCards.forEach(card => {
    card.addEventListener('click', (e) => {
      // Don't toggle if we click buttons or videos or custom links inside the card
      if (e.target.closest('.solution-drawer-left a, .solution-drawer-left button, .solution-preview-frame-premium, .solution-badge, .solution-btn-secondary')) {
        return;
      }

      const isActive = card.classList.contains('active');

      // Close other cards in the same grid
      const parentGrid = card.closest('.solutions-grid-premium');
      if (parentGrid) {
        parentGrid.querySelectorAll('.solution-premium-card').forEach(otherCard => {
          otherCard.classList.remove('active');
        });
      }

      if (!isActive) {
        card.classList.add('active');
      }
    });
  });

  /* ── 5. Process Scroll-driven Progress ── */
  function updateProcessProgress() {
    const processSections = document.querySelectorAll('.process-section');
    processSections.forEach(sec => {
      const rect = sec.getBoundingClientRect();
      const viewHeight = window.innerHeight;
      
      if (rect.top < viewHeight && rect.bottom > 0) {
        const totalHeight = rect.height + viewHeight * 0.3;
        const scrolled = viewHeight - rect.top;
        const pct = Math.min(Math.max(scrolled / totalHeight, 0), 1);
        
        const steps = sec.querySelectorAll('.process-step');
        const progressLine = sec.querySelector('.process-progress-line-fill');
        
        const mappedPct = (pct - 0.15) / 0.65;
        const activePctClamped = Math.min(Math.max(mappedPct, 0), 1);
        
        if (progressLine) {
          progressLine.style.width = (activePctClamped * 100) + '%';
        }
        
        steps.forEach((step, idx) => {
          const stepThreshold = idx / (steps.length - 1 || 1);
          if (activePctClamped >= stepThreshold - 0.05) {
            step.classList.add('illuminated');
          } else {
            step.classList.remove('illuminated');
          }
        });

        // Set the active-step class on the current active step
        let lastIlluminatedIdx = -1;
        steps.forEach((step, idx) => {
          if (step.classList.contains('illuminated')) {
            lastIlluminatedIdx = idx;
          }
        });

        steps.forEach((step, idx) => {
          if (idx === lastIlluminatedIdx && activePctClamped > 0.01) {
            step.classList.add('active-step');
          } else {
            step.classList.remove('active-step');
          }
        });
      }
    });
  }
  
  function getOffsetScroll(pct) {
    return Math.min(Math.max((pct - 0.15) / 0.65, 0), 1);
  }
  
  window.addEventListener('scroll', updateProcessProgress);
  updateProcessProgress();

  /* ── 6. Results Metrics Count-up & Graphs ── */
  const resultsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
        
        // Find graph box in current article section and active it
        const articleParent = entry.target.closest('article');
        if (articleParent) {
          const graphBox = articleParent.querySelector('.os-graph-box');
          if (graphBox) {
            graphBox.classList.add('active');
          }
        }
        
        // Trigger count up for numbers
        entry.target.querySelectorAll('.results-num-premium').forEach(numEl => {
          const targetStr = numEl.textContent.trim();
          const hasPlus = targetStr.includes('+');
          const hasPercent = targetStr.includes('%');
          const hasLess = targetStr.includes('<');
          const hasSlash = targetStr.includes('/');
          
          let numVal = parseFloat(targetStr.replace(/[^\d\.]/g, ''));
          let duration = 1200;
          let startTime = null;

          function animateCount(timestamp) {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / duration, 1);
            const val = progress * numVal;
            
            let displayVal = '';
            if (hasSlash) {
              const parts = targetStr.split('/');
              const den = parts[1];
              displayVal = Math.floor(progress * parseFloat(parts[0])) + '/' + den;
            } else if (targetStr.toLowerCase().includes('m')) {
              displayVal = val.toFixed(1) + 'M';
            } else if (numVal % 1 !== 0) {
              displayVal = val.toFixed(1);
            } else {
              displayVal = Math.floor(val).toString();
            }

            if (hasLess && !displayVal.includes('<')) displayVal = '< ' + displayVal;
            if (hasPlus && !displayVal.includes('+')) displayVal += '+';
            if (hasPercent && !displayVal.includes('%')) displayVal += '%';
            
            numEl.textContent = displayVal;

            if (progress < 1) {
              requestAnimationFrame(animateCount);
            } else {
              numEl.textContent = targetStr;
            }
          }
          requestAnimationFrame(animateCount);
        });
        resultsObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  document.querySelectorAll('.results-section').forEach(sec => resultsObserver.observe(sec));

  /* ── 5. Video Lightbox Modal ── */
  const lightbox = document.createElement('div');
  lightbox.className = 'video-lightbox';
  lightbox.innerHTML = `
    <div class="video-lightbox-content">
      <button class="video-lightbox-close">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style="margin-right: 5px; vertical-align: middle;"><path d="M3 3l10 10M3 13L13 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
        <span>Close</span>
      </button>
      <video class="video-lightbox-player" controls autoplay playsinline></video>
    </div>
  `;
  document.body.appendChild(lightbox);

  const lightboxPlayer = lightbox.querySelector('.video-lightbox-player');
  const closeBtn = lightbox.querySelector('.video-lightbox-close');

  function openLightbox(videoSrc) {
    lightboxPlayer.src = videoSrc;
    lightbox.classList.add('active');
    document.body.classList.add('hov');
  }

  function closeLightbox() {
    lightbox.classList.remove('active');
    lightboxPlayer.pause();
    lightboxPlayer.src = '';
    document.body.classList.remove('hov');
  }

  closeBtn.addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox || e.target.closest('.video-lightbox-close')) closeLightbox();
  });

  // Delegate lightbox triggers
  document.body.addEventListener('click', (e) => {
    const trigger = e.target.closest('[data-lightbox-video]');
    if (trigger) {
      e.preventDefault();
      const videoSrc = trigger.getAttribute('data-lightbox-video');
      openLightbox(videoSrc);
    }
  });

  /* ── 7. Interactive 3D Gold Glass Particle Orb ── */
  const logoImg = new Image();
  logoImg.src = '../assets/logo-removebg.png';

  const canvases = document.querySelectorAll('.kllezo-orb-canvas');
  canvases.forEach(canvas => {
    const ctx = canvas.getContext('2d');
    const container = canvas.closest('.hero-orb-container');
    if (!ctx || !container) return;

    let width = 0, height = 0;
    function resize() {
      const rect = container.getBoundingClientRect();
      width = rect.width * (window.devicePixelRatio || 1);
      height = rect.height * (window.devicePixelRatio || 1);
      canvas.width = width;
      canvas.height = height;
      ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);
    }
    resize();
    window.addEventListener('resize', resize);

    // Orb parameters
    const PARTICLE_COUNT = 450;
    const particles = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      particles.push({
        x: Math.sin(phi) * Math.cos(theta),
        y: Math.sin(phi) * Math.sin(theta),
        z: Math.cos(phi),
        brightness: Math.random() * 0.4 + 0.6,
        size: Math.random() * 1.5 + 1.0
      });
    }

    let angleX = 0;
    let angleY = 0;
    let targetSpeedX = 0.003;
    let targetSpeedY = 0.005;
    let currentSpeedX = 0.003;
    let currentSpeedY = 0.005;
    let radiusScale = 1.0;
    let targetRadiusScale = 1.0;

    let mx = -1, my = -1;
    let isMouseOver = false;

    container.addEventListener('mousemove', (e) => {
      const rect = container.getBoundingClientRect();
      mx = e.clientX - rect.left;
      my = e.clientY - rect.top;
      isMouseOver = true;

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const dx = (mx - centerX) / centerX;
      const dy = (my - centerY) / centerY;

      targetSpeedX = dy * 0.04;
      targetSpeedY = dx * 0.04;
      targetRadiusScale = 1.22;
    });

    container.addEventListener('mouseleave', () => {
      isMouseOver = false;
      targetSpeedX = 0.003;
      targetSpeedY = 0.005;
      targetRadiusScale = 1.0;
    });

    function draw() {
      const w = canvas.width / (window.devicePixelRatio || 1);
      const h = canvas.height / (window.devicePixelRatio || 1);
      ctx.clearRect(0, 0, w, h);

      const cx = w / 2;
      const cy = h / 2;
      const baseRadius = Math.min(w, h) * 0.35;
      const radius = baseRadius * radiusScale;

      currentSpeedX += (targetSpeedX - currentSpeedX) * 0.06;
      currentSpeedY += (targetSpeedY - currentSpeedY) * 0.06;
      radiusScale += (targetRadiusScale - radiusScale) * 0.06;

      angleX += currentSpeedX;
      angleY += currentSpeedY;

      if (!isMouseOver) {
        angleX += Math.sin(performance.now() * 0.001) * 0.0005;
        angleY += Math.cos(performance.now() * 0.0008) * 0.0005;
      }

      const cosX = Math.cos(angleX);
      const sinX = Math.sin(angleX);
      const cosY = Math.cos(angleY);
      const sinY = Math.sin(angleY);

      const projected = [];
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const p = particles[i];

        let x1 = p.x * cosY - p.z * sinY;
        let z1 = p.x * sinY + p.z * cosY;

        let y2 = p.y * cosX - z1 * sinX;
        let z2 = p.y * sinX + z1 * cosX;

        const fov = 2.5;
        const scale = fov / (fov + z2);

        const px = cx + x1 * radius * scale;
        const py = cy + y2 * radius * scale;

        projected.push({
          x: px,
          y: py,
          z: z2,
          brightness: p.brightness,
          size: p.size * scale
        });
      }

      projected.sort((a, b) => b.z - a.z);

      const gradBg = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius * 1.1);
      gradBg.addColorStop(0, 'rgba(255, 218, 140, 0.075)');
      gradBg.addColorStop(0.5, 'rgba(255, 204, 110, 0.025)');
      gradBg.addColorStop(1, 'rgba(255, 204, 110, 0.0)');
      ctx.fillStyle = gradBg;
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 1.15, 0, Math.PI * 2);
      ctx.fill();

      for (let i = 0; i < projected.length; i++) {
        const p = projected[i];
        if (p.z > 0) {
          const alpha = (1.0 - (p.z + 1.0) / 2.0) * p.brightness * 0.45;
          ctx.fillStyle = `rgba(255, 208, 120, ${alpha})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.strokeStyle = 'rgba(255, 215, 125, 0.15)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 1.0, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(255, 235, 185, 0.45)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(cx - 3, cy - 3, radius * 0.96, Math.PI * 0.95, Math.PI * 1.55);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(255, 220, 150, 0.25)';
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 1.02, Math.PI * 0.98, Math.PI * 1.45);
      ctx.stroke();

      ctx.fillStyle = 'rgba(255, 255, 255, 0.07)';
      ctx.beginPath();
      ctx.arc(cx - radius * 0.35, cy - radius * 0.35, radius * 0.3, 0, Math.PI * 2);
      ctx.fill();

      // 3. Draw official upright Kllezo logo inside the core of the orb (z = 0)
      if (logoImg.complete && logoImg.naturalWidth > 0) {
        ctx.save();
        ctx.translate(cx, cy);
        
        // Subtle gold glow
        ctx.shadowColor = 'rgba(255, 215, 125, 0.45)';
        ctx.shadowBlur = 18;
        
        // Upright logo with minimal slow breathing and subtle rotation
        const logoScale = 0.55 + 0.025 * Math.sin(performance.now() * 0.0015);
        ctx.scale(logoScale, logoScale);
        const logoAngle = 0.04 * Math.sin(performance.now() * 0.0006);
        ctx.rotate(logoAngle);

        const aspect = logoImg.naturalWidth / logoImg.naturalHeight;
        const logoH = radius * 0.65;
        const logoW = logoH * aspect;
        ctx.drawImage(logoImg, -logoW / 2, -logoH / 2, logoW, logoH);
        ctx.restore();
      }

      for (let i = 0; i < projected.length; i++) {
        const p = projected[i];
        if (p.z <= 0) {
          const alpha = (1.0 - (p.z + 1.0) / 2.0) * p.brightness * 0.95;
          ctx.fillStyle = `rgba(255, 218, 130, ${alpha})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();

          if (p.brightness > 0.92) {
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.7})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * 0.5, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      requestAnimationFrame(draw);
    }
    requestAnimationFrame(draw);
  });

});

