'use strict';

/* ── Navbar scroll shadow ── */
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 10);
}, { passive: true });

/* ── Mobile hamburger ── */
const hamburger = document.getElementById('hamburger');
const navLinks  = document.getElementById('navLinks');
let menuOpen    = false;

hamburger.addEventListener('click', () => {
  menuOpen = !menuOpen;
  navLinks.classList.toggle('open', menuOpen);
  const [a, b, c] = hamburger.querySelectorAll('span');
  if (menuOpen) {
    a.style.transform = 'translateY(7px) rotate(45deg)';
    b.style.opacity   = '0';
    c.style.transform = 'translateY(-7px) rotate(-45deg)';
  } else {
    a.style.transform = b.style.opacity = c.style.transform = '';
  }
});
navLinks && navLinks.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    menuOpen = false;
    navLinks.classList.remove('open');
    hamburger.querySelectorAll('span').forEach(s => { s.style.transform = ''; s.style.opacity = ''; });
  });
});

/* ── How It Works: reveal on scroll ── */
const howSteps = document.querySelectorAll('.how-step[data-reveal]');
const howObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('revealed');
      howObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.15 });
howSteps.forEach(el => howObserver.observe(el));

/* ── Feature Tabs with auto-advance progress bar ── */
const TAB_DURATION  = 4500; // ms per tab
const tabBtns       = document.querySelectorAll('.tab-item');
const tabPanels     = document.querySelectorAll('.tab-panel');
const progBars      = document.querySelectorAll('.tab-prog-bar');
let   activeTab     = 0;
let   tabTimer      = null;
let   progStart     = null;
let   progRAF       = null;

function setTab(index) {
  tabBtns.forEach((btn, i) => {
    btn.classList.toggle('active', i === index);
  });
  tabPanels.forEach((panel, i) => {
    panel.classList.toggle('active', i === index);
  });
  progBars.forEach(pb => { pb.style.transition = 'none'; pb.style.width = '0%'; });
  activeTab = index;
}

function startProgress() {
  cancelAnimationFrame(progRAF);
  progStart = performance.now();
  const bar = progBars[activeTab];

  function tick(now) {
    const elapsed  = now - progStart;
    const progress = Math.min(elapsed / TAB_DURATION, 1);
    bar.style.transition = 'none';
    bar.style.width = (progress * 100) + '%';
    if (progress < 1) {
      progRAF = requestAnimationFrame(tick);
    } else {
      setTab((activeTab + 1) % tabBtns.length);
      startProgress();
    }
  }
  progRAF = requestAnimationFrame(tick);
}

tabBtns.forEach((btn, i) => {
  btn.addEventListener('click', () => {
    cancelAnimationFrame(progRAF);
    clearTimeout(tabTimer);
    setTab(i);
    startProgress();
  });
});

// Pause auto-advance when tabs section is off screen
if (tabBtns.length) {
  const tabsSection = document.querySelector('.tabs-section');
  const tabsVis = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
      startProgress();
    } else {
      cancelAnimationFrame(progRAF);
    }
  }, { threshold: 0.1 });
  if (tabsSection) tabsVis.observe(tabsSection);
}

/* ── Animated Stat Counters ── */
function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }

function animateCounter(el) {
  const raw    = el.dataset.target;
  const isFloat = 'float' in el.dataset;
  const target = parseFloat(raw);
  const suffix = el.dataset.suffix || '';
  const prefix = el.dataset.prefix || '';
  const duration = 1800;
  let start = null;

  function tick(now) {
    if (!start) start = now;
    const elapsed  = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased    = easeOutCubic(progress);
    const val      = eased * target;
    el.textContent = prefix + (isFloat ? val.toFixed(1) : Math.floor(val)) + suffix;
    if (progress < 1) {
      requestAnimationFrame(tick);
    } else {
      el.textContent = prefix + (isFloat ? target.toFixed(1) : target) + suffix;
      el.classList.add('counted');
      setTimeout(() => el.classList.remove('counted'), 300);
    }
  }
  requestAnimationFrame(tick);
}

const statBlocks  = document.querySelectorAll('.stat-block[data-reveal-stat]');
const counterEls  = document.querySelectorAll('[data-counter]');
const statsObs = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('revealed');
      const counter = entry.target.querySelector('[data-counter]');
      if (counter && !counter.dataset.animated) {
        counter.dataset.animated = 'true';
        setTimeout(() => animateCounter(counter), parseInt(entry.target.style.getPropertyValue('--delay') || '0') * 1000);
      }
      statsObs.unobserve(entry.target);
    }
  });
}, { threshold: 0.3 });
statBlocks.forEach(el => statsObs.observe(el));

/* ── Before / After cards reveal ── */
const baCards = document.querySelectorAll('.ba-card[data-ba-reveal]');
const baObs = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('revealed');
      baObs.unobserve(entry.target);
    }
  });
}, { threshold: 0.15 });
baCards.forEach(el => baObs.observe(el));

/* ── FAQ Accordion ── */
document.querySelectorAll('.faq-q').forEach(btn => {
  btn.addEventListener('click', () => {
    const item   = btn.closest('.faq-item');
    const isOpen = item.classList.contains('open');
    document.querySelectorAll('.faq-item.open').forEach(el => {
      el.classList.remove('open');
      el.querySelector('.faq-q').setAttribute('aria-expanded', 'false');
    });
    if (!isOpen) { item.classList.add('open'); btn.setAttribute('aria-expanded', 'true'); }
  });
});

/* ── Billing toggle ── */
const toggle  = document.getElementById('billingToggle');
const amounts = document.querySelectorAll('.p-amount');
toggle && toggle.addEventListener('click', () => {
  const isAnnual = toggle.getAttribute('aria-checked') === 'true';
  toggle.setAttribute('aria-checked', String(!isAnnual));
  amounts.forEach(el => { el.textContent = !isAnnual ? el.dataset.a : el.dataset.m; });
});

/* ── Pause marquee on reduced motion preference ── */
if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  document.querySelectorAll('.marquee-track').forEach(el => {
    el.style.animationPlayState = 'paused';
  });
}

/* ── Waitlist form → HubSpot (via serverless proxy) ── */
const waitlistForm    = document.getElementById('waitlistForm');
const waitlistSuccess = document.getElementById('waitlistSuccess');
const waitlistSubmit  = document.getElementById('waitlistSubmit');
const wfError         = document.getElementById('wfError');

waitlistForm && waitlistForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!waitlistForm.checkValidity()) { waitlistForm.reportValidity(); return; }

  const btnText    = waitlistSubmit.querySelector('.wf-btn-text');
  const btnLoading = waitlistSubmit.querySelector('.wf-btn-loading');
  btnText.hidden          = true;
  btnLoading.hidden       = false;
  waitlistSubmit.disabled = true;
  wfError.hidden          = true;

  const payload = {
    firstname:     waitlistForm.querySelector('[name="firstname"]').value.trim(),
    email:         waitlistForm.querySelector('[name="email"]').value.trim(),
    phone:         waitlistForm.querySelector('[name="phone"]').value.trim(),
    company:       waitlistForm.querySelector('[name="company"]').value.trim(),
    business_type: waitlistForm.querySelector('[name="business_type"]').value,
  };

  try {
    const res = await fetch('/.netlify/functions/submit-waitlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('submission failed');
    waitlistForm.hidden    = true;
    waitlistSuccess.hidden = false;
  } catch {
    wfError.hidden          = false;
    btnText.hidden          = false;
    btnLoading.hidden       = true;
    waitlistSubmit.disabled = false;
  }
});
