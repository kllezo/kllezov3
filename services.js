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
      if (e.target.closest('.solution-details-drawer a, .solution-details-drawer button, .solution-details-drawer video, .solution-badge, .solution-btn-secondary')) {
        return;
      }

      const drawer = card.querySelector('.solution-details-drawer');
      const isActive = card.classList.contains('active');

      if (isActive) {
        card.classList.remove('active');
        if (drawer) drawer.style.maxHeight = null;
      } else {
        // Close other cards in the same grid
        const parentGrid = card.closest('.solutions-grid-premium');
        if (parentGrid) {
          parentGrid.querySelectorAll('.solution-premium-card').forEach(otherCard => {
            otherCard.classList.remove('active');
            const otherDrawer = otherCard.querySelector('.solution-details-drawer');
            if (otherDrawer) otherDrawer.style.maxHeight = null;
          });
        }

        card.classList.add('active');
        if (drawer) drawer.style.maxHeight = drawer.scrollHeight + 'px';
      }
    });
  });

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

