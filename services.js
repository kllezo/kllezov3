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

});

