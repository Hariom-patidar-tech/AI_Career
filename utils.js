/**
 * ============================================================
 *  CareerAI — Utility Functions & Global State
 * ============================================================
 */

/* ════════════════════════════════════════════
   GLOBAL STATE
════════════════════════════════════════════ */
window.State = {
  authMode: 'login',
  user: null,
  careers: [],
  inputData: null
};

/* ════════════════════════════════════════════
   PAGE ROUTING
════════════════════════════════════════════ */
function goPage(name) {
  document.getElementById('landing-page').style.display = name === 'landing' ? 'block' : 'none';
  document.getElementById('auth-page').style.display    = name === 'auth'    ? 'flex'  : 'none';
  document.getElementById('app-shell').style.display    = name === 'app'     ? 'flex'  : 'none';
}

function goView(name) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('on'));
  const target = document.querySelector(`.view[data-view="${name}"]`);
  if (target) target.classList.add('on');

  document.querySelectorAll('.nav-item, .mn-item').forEach(el => {
    el.classList.toggle('on', el.dataset.view === name);
  });

  // Update results badge
  const badge = document.querySelector('.nav-item[data-view="results"] .ni-badge');
  if (badge) badge.textContent = State.careers?.length || 0;
}

/* ════════════════════════════════════════════
   THEME
════════════════════════════════════════════ */
function initTheme() {
  const saved = localStorage.getItem('caai_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', saved);
  const tog = document.getElementById('theme-tog');
  if (tog) tog.classList.toggle('on', saved === 'dark');
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('caai_theme', next);
  const tog = document.getElementById('theme-tog');
  if (tog) tog.classList.toggle('on', next === 'dark');
}

/* ════════════════════════════════════════════
   TOAST
════════════════════════════════════════════ */
function toast(msg, type = 'ok') {
  const icons = { ok: '✅', err: '❌', info: 'ℹ️' };
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `<span>${icons[type] || '•'}</span><span>${msg}</span>`;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3800);
}

/* ════════════════════════════════════════════
   BUTTON LOADING STATE
════════════════════════════════════════════ */
function setBtnLoading(btn, loading, text) {
  if (!btn) return;
  btn.disabled = loading;
  btn.innerHTML = loading
    ? `<span class="spinner"></span> ${text}`
    : text;
}

/* ════════════════════════════════════════════
   FORM VALIDATION
════════════════════════════════════════════ */
const V = {
  required: v => v.trim() ? null : 'This field is required.',
  email:    v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? null : 'Enter a valid email.',
  minLen:   n => v => v.length >= n ? null : `Minimum ${n} characters required.`,
  match:    ref => v => v === ref ? null : 'Passwords do not match.'
};

function validate(input, rules) {
  if (!input) return true;
  // Remove previous error
  const prev = input.parentElement.querySelector('.ferror');
  if (prev) prev.remove();
  input.classList.remove('err');

  for (const rule of rules) {
    const err = rule(input.value);
    if (err) {
      input.classList.add('err');
      const d = document.createElement('div');
      d.className = 'ferror';
      d.textContent = err;
      input.parentElement.appendChild(d);
      return false;
    }
  }
  return true;
}

/* ════════════════════════════════════════════
   HELPERS
════════════════════════════════════════════ */
function initials(name) {
  if (!name) return 'U';
  return name.trim().split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function updateAvatars(name) {
  document.querySelectorAll('[data-avatar]').forEach(el => el.textContent = initials(name));
}

function animateCount(el, target, duration) {
  const suffix = el.dataset.suffix || '';
  let start = 0;
  const step = Math.ceil(target / (duration / 16));
  const timer = setInterval(() => {
    start = Math.min(start + step, target);
    el.textContent = start.toLocaleString() + suffix;
    if (start >= target) clearInterval(timer);
  }, 16);
}

function animateBars() {
  document.querySelectorAll('.prog-fill[data-w]').forEach(bar => {
    setTimeout(() => { bar.style.width = bar.dataset.w + '%'; }, 100);
  });
}

function spawnParticles(containerId, count) {
  const container = document.getElementById(containerId);
  if (!container) return;
  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    p.style.cssText = `
      left:${Math.random() * 100}%;
      top:${Math.random() * 100}%;
      animation-duration:${4 + Math.random() * 6}s;
      animation-delay:${Math.random() * 4}s;
      opacity:${0.2 + Math.random() * 0.4};
    `;
    container.appendChild(p);
  }
}

function initScrollSpy() {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('stuck', window.scrollY > 40);
  });
}