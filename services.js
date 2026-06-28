/* ═════════════════════════════════════════════════════════════════════
   KLLEZO Services Page V2 — JavaScript Engine
   Ambient animations, IntersectionObserver 60fps, ScrollSpy, Accordion
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

  document.querySelectorAll('a, button, .apple-card, .philosophy-card, .chip, .acc-header').forEach(el => {
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

  /* ── 2. Common Questions Accordion Toggle ── */
  document.querySelectorAll('.acc-header').forEach(header => {
    header.addEventListener('click', () => {
      const item = header.parentElement;
      const isOpen = item.classList.contains('open');
      
      // Close other accordion items in the same group
      const parentAcc = item.parentElement;
      if (parentAcc) {
        parentAcc.querySelectorAll('.acc-item').forEach(other => {
          if (other !== item) other.classList.remove('open');
        });
      }

      item.classList.toggle('open', !isOpen);
    });
  });

  /* ── 3. Sticky Navigation ScrollSpy ── */
  const navItems = document.querySelectorAll('.sticky-nav .nav-item');
  const modules = document.querySelectorAll('.category-module');

  const spyObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');
        navItems.forEach(item => {
          const href = item.getAttribute('href').replace('#', '');
          item.classList.toggle('active', href === id);
        });
      }
    });
  }, { threshold: 0.25 });

  modules.forEach(mod => spyObserver.observe(mod));

  /* ── 4. Ambient Software Demo Counters & Lifecycle ── */
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

});
