/**
 * ============================================================
 *  CareerAI — Page Controllers  (FIXED — No Mock Data)
 * ============================================================
 */

/* ════════════════════════════════════════════
   LANDING PAGE
════════════════════════════════════════════ */
function initLanding() {
  spawnParticles('hero-canvas', 20);

  const goSignup = () => showAuth('signup');
  const goLogin  = () => showAuth('login');

  document.getElementById('nav-signup-btn')?.addEventListener('click', goSignup);
  document.getElementById('nav-login-btn')?.addEventListener('click', goLogin);
  document.getElementById('hero-signup-btn')?.addEventListener('click', goSignup);
  document.getElementById('hero-login-btn')?.addEventListener('click', goLogin);
  document.getElementById('lcta-btn')?.addEventListener('click', goSignup);

  document.querySelectorAll('.nb-links a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      e.preventDefault();
      document.querySelector(a.getAttribute('href'))?.scrollIntoView({ behavior: 'smooth' });
    });
  });

  // Animate stats
  const statsObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.querySelectorAll('[data-count]').forEach(el => {
        animateCount(el, parseInt(el.dataset.count), 1400);
      });
      statsObserver.disconnect();
    });
  }, { threshold: 0.5 });
  const statsEl = document.getElementById('hero-stats');
  if (statsEl) statsObserver.observe(statsEl);

  // Scroll reveal
  const revealObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('fade-up');
        revealObs.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll('[data-reveal]').forEach(el => revealObs.observe(el));
}

/* ════════════════════════════════════════════
   AUTH PAGE
════════════════════════════════════════════ */
function showAuth(mode = 'login') {
  State.authMode = mode;
  goPage('auth');
  renderAuthForm(mode);
}

function renderAuthForm(mode) {
  State.authMode = mode;
  const isLogin = mode === 'login';
  document.getElementById('auth-title').textContent    = isLogin ? 'Welcome back' : 'Create account';
  document.getElementById('auth-sub-text').textContent = isLogin ? 'Sign in to your CareerAI account' : 'Start your AI-powered career journey today';
  document.getElementById('auth-name-grp').style.display    = isLogin ? 'none' : 'block';
  document.getElementById('auth-confirm-grp').style.display = isLogin ? 'none' : 'block';
  document.getElementById('auth-forgot-row').style.display  = isLogin ? 'block' : 'none';
  document.getElementById('auth-submit-btn').textContent    = isLogin ? 'Log In' : 'Create Account';
  document.getElementById('tab-login').classList.toggle('on', isLogin);
  document.getElementById('tab-signup').classList.toggle('on', !isLogin);

  document.querySelectorAll('#auth-form .ferror').forEach(e => e.remove());
  document.querySelectorAll('#auth-form .finput').forEach(i => { i.classList.remove('err'); i.value = ''; });
}

function initAuth() {
  State.authMode = 'login';
  document.getElementById('tab-login')?.addEventListener('click',  () => renderAuthForm('login'));
  document.getElementById('tab-signup')?.addEventListener('click', () => renderAuthForm('signup'));
  document.getElementById('auth-back')?.addEventListener('click',  () => goPage('landing'));
  document.getElementById('auth-logo-btn')?.addEventListener('click', () => goPage('landing'));

  const forgotBtn = document.querySelector('.auth-forgot span');
  if (forgotBtn) forgotBtn.onclick = () => { window.location.href = './reset.html'; };

  document.getElementById('auth-form')?.addEventListener('submit', async e => {
    e.preventDefault();
    await handleAuth();
  });
}

async function handleAuth() {
  const isLogin = State.authMode === 'login';
  const nameEl  = document.getElementById('auth-name');
  const emailEl = document.getElementById('auth-email');
  const passEl  = document.getElementById('auth-pass');
  const confEl  = document.getElementById('auth-confirm');

  let ok = true;
  if (!isLogin) ok &= validate(nameEl,  [V.required]);
  ok &= validate(emailEl, [V.required, V.email]);
  ok &= validate(passEl,  [V.required, V.minLen(6)]);
  if (!isLogin) ok &= validate(confEl, [V.required, V.match(passEl.value)]);
  if (!ok) return;

  const btn = document.getElementById('auth-submit-btn');
  setBtnLoading(btn, true, isLogin ? 'Logging in...' : 'Creating account...');

  try {
    const res = isLogin
      ? await API.Auth.login(emailEl.value, passEl.value)
      : await API.Auth.register(nameEl?.value, emailEl.value, passEl.value);

    State.user = res.user;
    // Save user in localStorage
localStorage.setItem(
  "user",
  JSON.stringify(res.user)
);
  try {

  if (!res.user) {

    res.user = {
      name: "User",
      email: emailEl.value,
      avatar: "U",
      plan: "Free Plan",
      education: "",
      goals: ""
    };
  }

  State.user = res.user;

if (!isLogin) {

  toast(
    'Account created successfully! Please login.'
  );

  renderAuthForm('login');

  return;
}

await bootApp(res.user);

goPage('app');

goView('dashboard');

} catch(err) {

  console.error(
    "BOOT ERROR:",
    err
  );

  toast(
    err.message,
    'err'
  );
}
    goPage('app');
    goView('dashboard');
    toast(`Welcome${isLogin ? ' back' : ''}, ${res.user?.name?.split(' ')[0] || 'User'}! 🎉`);
  } catch (err) {
    console.error(err);
    toast(err.message || 'Something went wrong. Try again.', 'err');
  } finally {
    setBtnLoading(btn, false, isLogin ? 'Log In' : 'Create Account');
  }
}

/* ════════════════════════════════════════════
   APP SHELL BOOT
════════════════════════════════════════════ */
async function bootApp(user) {
  // Fill user info in sidebar/profile
  document.querySelectorAll('[data-avatar]').forEach(el => el.textContent = initials(user.name));
  document.querySelectorAll('[data-uname]').forEach(el  => el.textContent = user.name);
  document.querySelectorAll('[data-uemail]').forEach(el => el.textContent = user.email);
  document.querySelectorAll('[data-uplan]').forEach(el  => el.textContent = user.plan || 'Free Plan');

  // Nav items
  document.querySelectorAll('.nav-item, .mn-item').forEach(item => {
    item.addEventListener('click', () => {
      const v = item.dataset.view;
      if (!v) return;
      goView(v);
      if (v === 'dashboard') {
        animateBars();
        loadDashboard();
      }
      if (v === 'results') renderResults();
    });
  });

  document.getElementById('theme-tog')?.addEventListener('click', toggleTheme);
  document.getElementById("sb-logout").addEventListener("click",()=>{

    // clear user
    localStorage.removeItem("user");

    // reset theme
    localStorage.removeItem("theme");
    document.body.removeAttribute("data-theme");

    const tog = document.getElementById("theme-tog");

    if(tog){
        tog.classList.remove("on");
    }

    // show login page
    document.getElementById("app-shell").style.display = "none";
    document.getElementById("auth-page").style.display = "block";

});
  // document.getElementById('sb-logout')?.addEventListener('click', () => {
  //   API.Auth.logout();
  //   State.user = null;
  //   State.careers = [];
  //   goPage('landing');
  //   toast('Signed out successfully.', 'info');
  // });

  // Dashboard quick links
  document.getElementById('dash-view-all')?.addEventListener('click',   () => goView('results'));
  document.getElementById('dash-go-profile')?.addEventListener('click', () => goView('profile'));

  initProfileView();
  initInputView();
  initFeedbackView();

  // Load real dashboard data
  try {

  await loadDashboard();
  const history =
  await API.Career.getHistory();
  // ✅ Latest Predictions First
  history.reverse();

  console.log(
    "Prediction History:",
    history
  );

} catch(err) {

  console.warn(
    "Dashboard failed:",
    err
  );
}
  
}

/* ════════════════════════════════════════════
   DASHBOARD — load real data
════════════════════════════════════════════ */
async function loadDashboard() {

  try {

    // ✅ PROFILE DATA
    // ✅ PROFILE DATA
const profile =
  State.user;

console.log(
  "PROFILE DATA:",
  profile
);

    // ✅ HISTORY DATA
    const history =
      await API.Career.getHistory();

    console.log(
      "Dashboard History:",
      history
    );

    // ✅ TOTAL MATCHES
    const totalPredictions =
      history.length || 0;

    // ✅ TOP TITLE
    const titleEl =
      document.querySelector(
        '[data-view="dashboard"] .view-title'
      );

    if (
      titleEl &&
      State.user?.name
    ) {

      titleEl.textContent =
        `Welcome back, ${
          State.user.name.split(' ')[0]
        }`;
    }

    // ✅ STAT CARDS
    // ===============================
// ✅ DASHBOARD STAT CARDS
// ===============================

// Career Matches
const careerCountEl =
  document.getElementById(
    "career-count"
  );

if (careerCountEl) {

  careerCountEl.innerText =
    totalPredictions;
}

// ===============================
// ✅ PROFILE SCORE
// ===============================

const profileFields = [
  profile?.name,
  profile?.education,
  profile?.goals,
  profile?.email
];

const filledFields =
  profileFields.filter(
    field =>
      field &&
      field.toString().trim() !== ""
  ).length;

const profileScore =
  Math.round(
    (filledFields / profileFields.length) * 100
  );

console.log(
  "PROFILE SCORE:",
  profileScore
);

// Update UI
const profileScoreEl =
  document.getElementById(
    "profile-score"
  );

if (profileScoreEl) {

  profileScoreEl.innerText =
    profileScore + "%";
}

// ===============================
// ✅ DAYS ACTIVE
// ===============================

const daysActiveEl =
  document.getElementById(
    "days-active"
  );

if (daysActiveEl) {

  let joinDate =
    localStorage.getItem(
      "join_date"
    );

  if (!joinDate) {

    joinDate =
      new Date().toISOString();

    localStorage.setItem(
      "join_date",
      joinDate
    );
  }

  const startDate =
    new Date(joinDate);

  const currentDate =
    new Date();

  const diffTime =
    currentDate - startDate;

  const diffDays =
    Math.floor(
      diffTime /
      (1000 * 60 * 60 * 24)
    ) + 1;

  daysActiveEl.innerText =
    diffDays;
}

// ===============================
// ✅ PROGRESS OVERVIEW
// ===============================

const fills =
  document.querySelectorAll(
    ".prog-fill"
  );

const pcts =
  document.querySelectorAll(
    ".prog-pct"
  );

// Profile Complete
if (fills[0]) {

  fills[0].style.width =
    profileScore + "%";

  pcts[0].innerText =
    profileScore + "%";
}

// Career Paths Found
if (fills[1]) {

  const val =
    Math.min(
      totalPredictions * 55,
      100
    );

  fills[1].style.width =
    val + "%";

  pcts[1].innerText =
    totalPredictions;
}

// Input Data
if (fills[2]) {

  const done =
    totalPredictions > 0;

  fills[2].style.width =
    done
    ? "100%"
    : "35%";

  pcts[2].innerText =
    done
    ? "Completed"
    : "Pending";
}

    // ✅ TOP MATCHES
    const matchBox =
      document.getElementById(
        'dash-matches-list'
      );

    if (
      history &&
      history.length > 0
    ) {

      matchBox.innerHTML =
        history
        .slice(0, 3)
        .map(item => `

          <div
            class="match-row"
            style="
              display:flex;
              justify-content:space-between;
              align-items:center;
              padding:14px;
              margin-bottom:12px;
              border-radius:14px;
              background:rgba(124,92,252,0.08)
            "
          >

            <div>

              <div
                class="mr-name"
                style="
                  font-weight:700;
                  margin-bottom:4px
                "
              >
                ${item.prediction}
              </div>

              <div
                style="
                  font-size:12px;
                  color:var(--txt3)
                "
              >
                AI Career Match
              </div>

            </div>

            <div
              class="mr-score"
              style="
                color:#7c5cfc;
                font-weight:700
              "
            >
              ✓
            </div>

          </div>

        `).join('');

    } else {

      matchBox.innerHTML = `

        <div
          style="
            text-align:center;
            padding:30px 0;
            color:var(--txt3);
            font-size:13px
          "
        >
          No matches yet.<br/>
          Go to
          <strong>Input Data</strong>
          to generate recommendations.
        </div>
      `;
    }

    // ✅ UPDATE BADGE
    updateResultsBadge();

  } catch(err) {

    console.error(
      "Dashboard Error:",
      err
    );
  }
}

function populateDashboardMatches(careers) {

  if (
    !careers ||
    careers.length === 0
  ) return;

  const matchBox =
    document.getElementById(
      'dash-matches-list'
    );

  matchBox.innerHTML =
    careers
    .slice(0, 3)
    .map(c => `

      <div
        class="match-row"
        style="
          display:flex;
          justify-content:space-between;
          align-items:center;
          padding:14px;
          margin-bottom:12px;
          border-radius:14px;
          background:rgba(124,92,252,0.08)
        "
      >

        <div>

          <div
            class="mr-name"
            style="
              font-weight:700;
              margin-bottom:4px
            "
          >
            ${c.title || c.career}
          </div>

          <div
            style="
              font-size:12px;
              color:var(--txt3)
            "
          >
            Career Recommendation
          </div>

        </div>

        <div
          class="mr-score"
          style="
            color:#7c5cfc;
            font-weight:700
          "
        >
          ${c.match || 90}%
        </div>

      </div>

    `).join('');

  updateResultsBadge();
}

function updateResultsBadge() {

  const badge =
    document.querySelector(
      '.nav-item[data-view="results"] .ni-badge'
    );

  if (badge) {

    badge.textContent =
      State.careers?.length || 0;
  }
}

/* ════════════════════════════════════════════
   PROFILE VIEW
════════════════════════════════════════════ */
function initProfileView() {

  const user = State.user;

  if (!user) return;

  const pfName =
    document.getElementById('pf-name');

  const pfEmail =
    document.getElementById('pf-email');

  const pfEdu =
    document.getElementById('pf-edu');

  const pfGoals =
    document.getElementById('pf-goals');

  if (pfName) {
    pfName.value = user.name || '';
  }

  if (pfEmail) {
    pfEmail.value = user.email || '';
  }

  if (pfEdu) {
    pfEdu.value = user.education || '';
  }

  if (pfGoals) {
    pfGoals.value = user.goals || '';
  }

  const saveBtn =
  document.getElementById(
    'pf-save-btn'
  );

if (saveBtn) {

  saveBtn.addEventListener(
    'click',

    async () => {

      setBtnLoading(
        saveBtn,
        true,
        'Saving...'
      );

      try {

        // =====================
        // Updated Profile Data
        // =====================

        const updated = {

          name:
            pfName.value.trim(),

          email:
            pfEmail.value.trim(),

          education:
            pfEdu.value.trim(),

          goals:
            pfGoals.value.trim()
        };

        // =====================
        // API Call
        // =====================

        const response =
          await API.User
          .updateProfile(
            updated
          );

        console.log(
          "PROFILE RESPONSE:",
          response
        );

        // =====================
        // Update Local State
        // =====================

        State.user = {
          ...State.user,
          ...updated
        };

        console.log(
          "UPDATED USER:",
          State.user
        );

        // =====================
        // Reload Dashboard
        // =====================

        await loadDashboard();

        // =====================
        // Success Toast
        // =====================

        toast(
          'Profile updated successfully!'
        );

      }

      catch(err) {

        console.error(err);

        toast(
          'Failed to update profile',
          'err'
        );
      }

      finally {

        setBtnLoading(
          saveBtn,
          false,
          'Save Changes'
        );
      }
    }
  );
}
}



/* ════════════════════════════════════════════
   INPUT (STEPPER) — 2 steps, real API
════════════════════════════════════════════ */
let curStep = 0;
const TOTAL_STEPS = 2;

function initInputView() {
  // Wire step buttons (there are duplicates in HTML, use first occurrence)
  const nextBtns = document.querySelectorAll('#step-next');
  const backBtns = document.querySelectorAll('#step-back');

  nextBtns.forEach(btn => btn.addEventListener('click', stepNext));
  backBtns.forEach(btn => btn.addEventListener('click', stepPrev));

  gotoStep(0);
}

function gotoStep(n) {
  curStep = n;

  // Show correct panel
  document.querySelectorAll('.step-panel').forEach(p => p.classList.remove('on'));
  document.getElementById(`step-panel-${n}`)?.classList.add('on');

  // Update stepper circles
  document.querySelectorAll('.step-node').forEach((node, i) => {
    const dot = node.querySelector('.step-circle');
    const lbl = node.querySelector('.step-lbl');
    if (!dot) return;
    dot.classList.remove('done', 'active', 'todo');
    if (i < n)       { dot.classList.add('done');   dot.textContent = '✓'; }
    else if (i === n){ dot.classList.add('active'); dot.textContent = i + 1; }
    else             { dot.classList.add('todo');   dot.textContent = i + 1; }
    if (lbl) lbl.classList.toggle('active', i === n);
  });

  document.querySelectorAll('.step-line').forEach((l, i) => l.classList.toggle('done', i < n));

  // Back buttons
  document.querySelectorAll('#step-back').forEach(btn => {
    btn.disabled = (n === 0);
    btn.style.opacity = (n === 0) ? '.3' : '1';
  });

  // Next button label
  const isLast = n === TOTAL_STEPS - 1;
  document.querySelectorAll('#step-next').forEach(btn => {
    btn.textContent = isLast ? 'Generate My Career Paths ✨' : 'Continue →';
  });

  // Step counter
  document.querySelectorAll('#step-counter').forEach(el => {
    el.textContent = `Step ${n + 1} of ${TOTAL_STEPS}`;
  });
}

function stepNext() {
  if (curStep < TOTAL_STEPS - 1) gotoStep(curStep + 1);
  else submitInput();
}

function stepPrev() {
  if (curStep > 0) gotoStep(curStep - 1);
}

async function submitInput() {
  // Gather form data
const education = document.getElementById('inp-edu')?.value || '';
const degree    = document.getElementById('inp-degree')?.value || '';
const skillsInput = document.getElementById('inp-skill')?.value || '';
const timeline  = document.getElementById('inp-timeline')?.value || '';

if (!education) {
  toast('Please select your education level.', 'err');
  gotoStep(0);
  return;
}

if (!skillsInput.trim()) {
  toast('Please enter your skills.', 'err');
  return;
}

const skillsArray = skillsInput
  .split(',')
  .map(skill => skill.trim())
  .filter(skill => skill !== '');

const payload = {
  
  skills: skillsArray,
  
};

  State.inputData = payload;

  const btns = document.querySelectorAll('#step-next');
  btns.forEach(btn => setBtnLoading(btn, true, 'AI is analyzing your profile...'));

  try {
    const res = await API.Career.getRecommendations(payload);

    // Normalize response — backend may return array or {careers:[...]}
    const predictions =
  res.top_predictions || [];

const careers = predictions.map((item, index) => ({

  id: index,

  title: item.career,

  match: Math.round(item.confidence || 0),

  desc: `${item.career} matches your skills.`,

  growth: item.future_growth,

  salary: item.salary,

  demand: item.market_demand,

  remote: item.hiring_trend,

  top_skills: item.top_skills || [],

  skills: item.top_skills || [],

  path: [],

  color: ["violet", "cyan", "pink"][index % 3],

  icon: ["💻", "🤖", "📊"][index % 3]

}));

State.careers = careers;

// ✅ Render Dashboard Matches
populateDashboardMatches(careers);

// ✅ Update Results Badge
updateResultsBadge();

// ✅ Render Results
renderResults(careers);

// ✅ Open Results Page
goView('results');

// ✅ Refresh Dashboard Stats Only
const cards =
  document.querySelectorAll(
    '.stat-card .sc-val'
  );

if (cards[0]) {

  cards[0].textContent =
    careers.length;
}

toast(
  'AI analysis complete! 🎯'
);
    toast('AI analysis complete! Your career paths are ready 🎯');
  } catch (err) {
    console.error('Predict error:', err);
    toast(err.message || 'Could not generate recommendations. Try again.', 'err');
  } finally {
    btns.forEach(btn => setBtnLoading(btn, false, 'Generate My Career Paths ✨'));
  }
}

/* Normalize any shape of career object from backend */
function normalizeCareer(c, index) {
  const COLORS = ['violet', 'cyan', 'pink', 'amber', 'green'];
  const ICONS  = ['💻', '🤖', '📊', '🎨', '☁️', '🔐', '📱', '🚀'];

  return {
    id:     c.id     || c._id     || String(index),
    title:  c.title  || c.career  || c.name || c.role || 'Career Path',
    desc:   c.description || c.desc || c.summary || 'An exciting career path matched to your profile.',
    match:  c.match_score || c.match || c.score || c.compatibility || Math.floor(70 + Math.random() * 25),
    salary: c.salary_range || c.salary || c.avg_salary || 'Competitive',
    growth: c.growth_rate  || c.growth || c.market_growth || 'High',
    demand: c.demand || c.job_demand || 'High',
    remote: c.remote_work  || c.remote || '70%+',
    skills: Array.isArray(c.skills) ? c.skills : (c.required_skills || c.key_skills || []),
    path:   Array.isArray(c.roadmap) ? c.roadmap
          : Array.isArray(c.learning_path) ? c.learning_path
          : Array.isArray(c.path) ? c.path
          : [],
    color:  c.color || COLORS[index % COLORS.length],
    icon:   c.icon  || ICONS[index % ICONS.length]
  };
}

/* ════════════════════════════════════════════
   RESULTS
════════════════════════════════════════════ */
const COLOR_HEX = {
  violet: '#7c5cfc', cyan: '#22d3ee', pink: '#f472b6',
  amber:  '#fbbf24', green: '#4ade80'
};

function renderResults(careers) {
  careers = careers || State.careers || [];
  const grid = document.getElementById('res-grid');
  if (!grid) return;

  // Update sub-title count
  const sub = document.querySelector('[data-view="results"] .view-sub');
  if (sub) sub.textContent = `Based on your profile, the AI found ${careers.length} path${careers.length !== 1 ? 's' : ''} ranked by compatibility score.`;

  if (careers.length === 0) {
    grid.innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:60px 20px;color:var(--txt2)">
        <div style="font-size:48px;margin-bottom:16px">🔍</div>
        <div style="font-size:18px;font-weight:700;margin-bottom:8px">No results yet</div>
        <div style="font-size:14px">Go to <strong>Input Data</strong> and fill in your profile to get AI career recommendations.</div>
      </div>`;
    return;
  }

  grid.innerHTML = careers.map((c, i) => {
    const col = COLOR_HEX[c.color] || '#7c5cfc';
    const skillChips = (c.top_skills || c.skills || []).slice(0, 3).map(s => `<span class="chip">${s}</span>`).join('');
    const extraCount = Math.max(0, (c.skills || []).length - 3);
    return `
    <div class="card res-card card-glow fade-up d${(i % 6) + 1}" data-id="${c.id}">
      <div class="res-card-glow" style="background:${col}"></div>
      <div class="rc-top">
        <div class="rc-icon">${c.icon}</div>
        <div>
          <div class="rc-score" style="color:${col}">${c.match}%</div>
          <div class="rc-score-lbl">AI match</div>
        </div>
      </div>
      <div class="rc-title">${c.title}</div>
      <div class="rc-desc">${(c.desc || '').substring(0, 95)}${c.desc && c.desc.length > 95 ? '...' : ''}</div>
      <div class="rc-chips">
        ${skillChips}
        ${extraCount > 0 ? `<span class="chip">+${extraCount}</span>` : ''}
      </div>
      <div class="rc-foot">
        <span class="rc-growth">📈 ${c.growth || "High"} Growth</span>
        <span class="rc-view">View details →</span>
      </div>
    </div>`;
  }).join('');

  grid.querySelectorAll('.res-card').forEach(card => {
    card.addEventListener('click', () => {
      const c = careers.find(x => String(x.id) === String(card.dataset.id));
      if (c) showCareerDetail(c);
    });
  });
}

function showCareerDetail(c) {
  const col = COLOR_HEX[c.color] || '#7c5cfc';
  document.getElementById('res-list').classList.add('hidden');
  const det = document.getElementById('res-detail');
  det.classList.add('on');

  const pathItems = (c.path && c.path.length > 0)

? c.path.map((p, i) => `

<li
  class="path-item fade-up"
  style="animation-delay:${i * 80}ms"
>

  <div
    class="path-num"
    style="
      background:${col}22;
      color:${col};
      border:2px solid ${col}40
    "
  >
    ${i + 1}
  </div>

  <div class="path-txt">

    <div
      style="
        font-weight:700;
        font-size:16px;
      "
    >
      ${p.title}
    </div>

    <div
      style="
        margin-top:8px;
        color:var(--txt2);
      "
    >
      ${p.description}
    </div>

    <div
      style="
        margin-top:8px;
        color:var(--cyan);
        font-size:13px;
      "
    >
      ⏳ ${p.duration}
    </div>

    <div
      style="
        margin-top:10px;
        display:flex;
        gap:6px;
        flex-wrap:wrap;
      "
    >
      ${
        (p.resources || [])

        .map(r => `
          <span class="chip">
            ${r}
          </span>
        `)

        .join('')
      }
    </div>

  </div>

</li>

`).join('')

: `

<li class="path-item">

  <div
    class="path-txt"
    style="color:var(--txt3)"
  >
    Learning roadmap coming soon.
  </div>

</li>
`;
  det.innerHTML = `
    <button class="btn btn-outline btn-sm" id="det-back" style="margin-bottom:26px">← Back to Results</button>
    <div class="card det-card">
      <div class="det-hero">
        <div>
          <div style="font-size:52px;margin-bottom:14px;line-height:1">${c.icon}</div>
          <div class="det-title">${c.title}</div>
          <div class="det-desc">${c.desc || ''}</div>
        </div>
        <div style="text-align:center">
          <div class="det-score" style="color:${col}">${c.match}%</div>
          <div class="det-score-lbl">AI Match Score</div>
        </div>
      </div>
      <div class="det-metrics">

  <div class="dmet-box">
    <div class="dmet-lbl">Salary Range</div>

    <div
      class="dmet-val"
      style="
        color:${col};
        font-size:15px
      "
    >
      ${c.salary || "N/A"}
    </div>
  </div>

  <div class="dmet-box">
    <div class="dmet-lbl">Future Growth</div>

    <div
      class="dmet-val"
      style="color:var(--green)"
    >
      ${c.growth || "Good"}
    </div>
  </div>

  <div class="dmet-box">
    <div class="dmet-lbl">Market Demand</div>

    <div class="dmet-val">
      ${c.demand || "Moderate"}
    </div>
  </div>

  <div class="dmet-box">
    <div class="dmet-lbl">Hiring Trend</div>

    <div class="dmet-val">
      ${c.remote || "Stable"}
    </div>
  </div>

</div>
      ${c.skills && c.skills.length > 0 ? `
      <div style="margin-bottom:26px">
        <div style="font-family:var(--font-head);font-size:16px;font-weight:700;margin-bottom:14px">Required Skills</div>
        <div style="display:flex;flex-wrap:wrap;gap:8px">${(c.top_skills || c.skills || []).map(s => `<span class="chip">${s}</span>`).join('')}</div>
      </div>` : ''}
      <div>

  <button
    class="btn btn-primary"
    id="generate-roadmap-btn"
    style="margin-bottom:20px"
  >
    Generate AI Roadmap ✨
  </button>

  <div
    style="
      font-family:var(--font-head);
      font-size:16px;
      font-weight:700;
      margin-bottom:16px
    "
  >
    Learning Roadmap
  </div>

  <ul class="path-list">
    ${pathItems}
  </ul>

</div>
    </div>`;

  document
.getElementById(
  'generate-roadmap-btn'
)

?.addEventListener(
  'click',

  async () => {

    const btn =
      document.getElementById(
        'generate-roadmap-btn'
      );

    btn.innerText =
      'Generating...';

    btn.disabled = true;

    try {

      const res =
        await API.Career
        .getRoadmap(c.title);

      c.path =
        res.roadmap || [];

      showCareerDetail(c);

    } catch(err) {

      console.error(err);

      alert(
        'Roadmap generation failed'
      );

    } finally {

      btn.disabled = false;

      btn.innerText =
        'Generate AI Roadmap ✨';
    }
  }
);

document.getElementById('det-back').addEventListener('click', () => {

  det.classList.remove('on');

  det.innerHTML = '';

  document
  .getElementById('res-list')
  .classList.remove('hidden');

});
}

/* ════════════════════════════════════════════
   FEEDBACK
════════════════════════════════════════════ */
function initFeedbackView() {
  let rating = 0;
  const lbls = ['', 'Poor — completely off target', 'Below average — missed the mark', 'Average — somewhat relevant', 'Good — mostly accurate', 'Excellent — spot on!'];

  function setRating(n) {
    rating = n;
    document.querySelectorAll('.star').forEach((s, i) => s.classList.toggle('on', i < n));
    const lbl = document.getElementById('fb-rating-lbl');
    if (lbl) lbl.textContent = lbls[n] || '';
  }

  document.querySelectorAll('.star').forEach((star, i) => {
    star.addEventListener('mouseenter', () => document.querySelectorAll('.star').forEach((s, j) => s.classList.toggle('on', j <= i)));
    star.addEventListener('mouseleave', () => setRating(rating));
    star.addEventListener('click', () => setRating(i + 1));
  });

  document.getElementById('fb-submit')?.addEventListener('click', async () => {
    if (!rating) { toast('Please select a star rating.', 'err'); return; }
    const text = document.getElementById('fb-text')?.value.trim();
    if (!text) { toast('Please write some feedback.', 'err'); return; }

    const btn = document.getElementById('fb-submit');
    setBtnLoading(btn, true, 'Submitting...');
    try {
      await API.Feedback.submit({
        rating,
        category:  document.getElementById('fb-category')?.value || 'overall',
        recommend: document.getElementById('fb-recommend')?.value || '',
        text
      });
      document.getElementById('fb-form-wrap').style.display = 'none';
      document.getElementById('fb-success').style.display   = 'block';
    } catch (err) {
      toast(err.message || 'Submission failed. Please try again.', 'err');
    } finally {
      setBtnLoading(btn, false, 'Submit Feedback');
    }
  });

  document.getElementById('fb-again')?.addEventListener('click', () => {
    document.getElementById('fb-form-wrap').style.display = 'block';
    document.getElementById('fb-success').style.display   = 'none';
    rating = 0;
    setRating(0);
    const fbText = document.getElementById('fb-text');
    if (fbText) fbText.value = '';
  });
}

/* ════════════════════════════════════════════
   BOOTSTRAP
════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initLanding();
  initAuth();
  initScrollSpy();
  // Auto login after refresh
const savedUser =
  localStorage.getItem(
    "user"
  );

if (savedUser) {

  State.user =
    JSON.parse(savedUser);

  bootApp(State.user);

  goPage('app');

  goView('dashboard');

} else {

  goPage('landing');
}

  // Avatar modal
  const avatarImg = document.getElementById('avatarPreview');
  const modal     = document.getElementById('avatarModal');
  const zoomed    = document.getElementById('zoomedAvatar');

  if (avatarImg) {
    avatarImg.addEventListener('click', () => {
      if (zoomed) zoomed.src = avatarImg.src;
      if (modal) modal.style.display = 'flex';
    });
  }

  window.addEventListener('click', e => {
    if (e.target === modal && modal) modal.style.display = 'none';
  });

  // Avatar upload
  const fileInput = document.getElementById('fileInput');
  const preview   = document.getElementById('avatarPreview');
  if (fileInput && preview) {
    fileInput.addEventListener('change', async () => {
      const file = fileInput.files[0];
      if (!file) return;
      preview.src = URL.createObjectURL(file);

      const formData = new FormData();
      formData.append('file', file);
      try {
        const token = localStorage.getItem('caai_token');
        const res = await fetch('http://127.0.0.1:8000/profile/upload', {
          method: 'POST',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: formData
        });
        const data = await res.json();
        if (data.avatar_url) preview.src = 'http://127.0.0.1:8000' + data.avatar_url;
      } catch (err) {
        console.warn('Avatar upload failed:', err);
      }
    });
  }
});

window.closeAvatar = function () {
  const modal = document.getElementById('avatarModal');
  if (modal) modal.style.display = 'none';
};