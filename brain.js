/* ══════════════════════════════════════════════════════════════════
   PORTFOLIO — app.js
   Author: Your Name
   Stack:  Vanilla JS · GSAP · Google Apps Script Backend
   ══════════════════════════════════════════════════════════════════ */

'use strict';

/* ──────────────────────────────────────────────────────────────────
   1. CONFIGURATION  (🔧 Edit this section)
   ────────────────────────────────────────────────────────────────── */
const CONFIG = {

  // 🔗 Paste your Google Apps Script Web App URL here
  GAS_URL: 'https://script.google.com/macros/s/AKfycbyEpvBR-rVTO3JHVhTrKo-LSLNUunpSA1f-uu9WqK-K7R9-crcKd9G4QaOOgMdrrFLW/exec',

  // 👤 Personal info
  AUTHOR: {
    name:      'Shivam kumar singh',
    firstName: 'Shivam',
    lastName:  'Singh',
    role:      'Full Stack Developer',
    roles:     ['Full Stack Developer', 'UI/UX Enthusiast', 'Open Source Contributor', 'Problem Solver'],
    bio:       'I craft fast, accessible, and beautiful web experiences. Passionate about clean code, modern tooling, and building products people love.',
    location:  'Mumbai, India',
    email:     'hello@yourname.dev',
    available: true,

    social: {
      github:   'https://github.com/yourusername',
      linkedin: 'https://linkedin.com/in/yourusername',
      twitter:  'https://twitter.com/yourusername',
    },

    stats: [
      { value: 42,  label: 'Projects'   },
      { value: 18,  label: 'Clients'    },
      { value: 5,   label: 'Years Exp'  },
      { value: '∞', label: 'Cups of Tea'},
    ],

    skills: [
      'JavaScript', 'TypeScript', 'React', 'Node.js',
      'Python', 'PostgreSQL', 'Docker', 'AWS',
      'Figma', 'REST APIs', 'GraphQL', 'Linux',
    ],

    info: {
      Location: 'Delhi, India',
      Email:    'shiva850681@gmail.com',
      Status:   'Available for hire',
      Focus:    'Web & Mobile',
    },
  },

  // 📋 Google Sheet names to expose in the Projects table selector
  // These should match your actual Sheet tab names
  TABLES: {
    projects: ['projects', 'webapps', 'opensource'],
    blog:     ['blog', 'tutorials', 'thoughts'],
  },
};

/* ──────────────────────────────────────────────────────────────────
   2. THEME
   ────────────────────────────────────────────────────────────────── */
const Theme = (() => {
  const KEY = 'pf-theme';
  const root = document.documentElement;
  const btn  = () => document.getElementById('themeToggle');

  function get()    { return root.getAttribute('data-theme'); }
  function set(t)   { root.setAttribute('data-theme', t); localStorage.setItem(KEY, t); }
  function toggle() { set(get() === 'dark' ? 'light' : 'dark'); }

  function init() {
    const saved = localStorage.getItem(KEY) || 'dark';
    set(saved);
    btn().addEventListener('click', toggle);
  }

  return { init, get, set, toggle };
})();

/* ──────────────────────────────────────────────────────────────────
   3. CUSTOM CURSOR
   ────────────────────────────────────────────────────────────────── */
const Cursor = (() => {
  let ring, dot, enabled = false;

  function init() {
    // Only on non-touch devices
    if (window.matchMedia('(pointer: coarse)').matches) return;
    ring    = document.getElementById('cursorRing');
    dot     = document.getElementById('cursorDot');
    enabled = true;

    document.addEventListener('mousemove', move);
    document.addEventListener('mousedown', () => gsap.to(ring, { scale: 0.7, duration: 0.1 }));
    document.addEventListener('mouseup',   () => gsap.to(ring, { scale: 1,   duration: 0.15 }));

    // Hover effect on interactive elements
    document.addEventListener('mouseover', e => {
      if (e.target.closest('a, button, .card, [data-hover], .tag, .filter-select, .filter-input')) {
        ring.classList.add('hover');
      }
    });
    document.addEventListener('mouseout', e => {
      if (e.target.closest('a, button, .card, [data-hover], .tag, .filter-select, .filter-input')) {
        ring.classList.remove('hover');
      }
    });
  }

  function move(e) {
    if (!enabled) return;
    gsap.to(ring, { x: e.clientX, y: e.clientY, duration: 0.12, ease: 'power2.out' });
    gsap.to(dot,  { x: e.clientX, y: e.clientY, duration: 0.04 });
  }

  return { init };
})();

/* ──────────────────────────────────────────────────────────────────
   4. NAVIGATION
   ────────────────────────────────────────────────────────────────── */
const Nav = (() => {
  let header, hamburger, menu, open = false;

  function init() {
    header    = document.getElementById('header');
    hamburger = document.getElementById('hamburger');
    menu      = document.getElementById('mobileMenu');

    // Scroll-based header styling
    window.addEventListener('scroll', () => {
      header.classList.toggle('scrolled', window.scrollY > 40);
    }, { passive: true });

    hamburger.addEventListener('click', toggleMenu);

    // Close menu on mobile link click
    document.querySelectorAll('.mobile-link').forEach(l =>
      l.addEventListener('click', closeMenu)
    );

    // Close on outside click
    menu.addEventListener('click', e => {
      if (e.target === menu) closeMenu();
    });

    // Keyboard close
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && open) closeMenu();
    });
  }

  function toggleMenu() {
    open = !open;
    menu.classList.toggle('open', open);
    hamburger.classList.toggle('active', open);
    hamburger.setAttribute('aria-expanded', open);
    document.body.style.overflow = open ? 'hidden' : '';
  }

  function closeMenu() {
    if (!open) return;
    open = false;
    menu.classList.remove('open');
    hamburger.classList.remove('active');
    hamburger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  function setActive(route) {
    document.querySelectorAll('.nav-link').forEach(l => {
      l.classList.toggle('active', l.dataset.route === route);
    });
  }

  return { init, setActive, closeMenu };
})();

/* ──────────────────────────────────────────────────────────────────
   5. API — Google Apps Script
   ────────────────────────────────────────────────────────────────── */
const API = (() => {
  const cache = new Map();
  const base  = CONFIG.GAS_URL;

  /**
   * Fetch data from a Google Sheet by table name.
   * @param {string} table      - Sheet tab name (e.g. "projects")
   * @param {Object} [filters]  - Key/value pairs to filter rows
   * @param {Object} [options]  - sort, limit
   */
  async function get(table, filters = {}, options = {}) {
    const key = JSON.stringify({ table, filters, options });
    if (cache.has(key)) return cache.get(key);

    const params = new URLSearchParams({ table });
    Object.entries(filters).forEach(([k, v]) => params.set(`filter[${k}]`, v));
    if (options.sort)  params.set('sort',  options.sort);
    if (options.limit) params.set('limit', options.limit);

    try {
      const res  = await fetch(`${base}?${params}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      cache.set(key, json);
      return json;
    } catch (err) {
      console.warn('API.get failed:', err.message);
      return { data: [], count: 0, error: err.message };
    }
  }

  /**
   * Get list of all available sheet names.
   */
  async function getTables() {
    try {
      const res  = await fetch(`${base}?action=tables`);
      const json = await res.json();
      return json.tables || [];
    } catch {
      return [];
    }
  }

  /**
   * Submit contact form data (via GET to avoid CORS issues).
   */
  async function submit(payload) {
    const params = new URLSearchParams({ action: 'submit', table: 'messages', ...payload });
    try {
      const res  = await fetch(`${base}?${params}`);
      const json = await res.json();
      return json;
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  return { get, getTables, submit };
})();

/* ──────────────────────────────────────────────────────────────────
   6. UTILS
   ────────────────────────────────────────────────────────────────── */
const Utils = {
  /** Escape HTML to prevent XSS */
  esc(str) {
    const d = document.createElement('div');
    d.textContent = str ?? '';
    return d.innerHTML;
  },

  /** Format ISO date → "Apr 12, 2025" */
  fmtDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d)) return dateStr;
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  },

  /** Truncate text with ellipsis */
  truncate(str, max = 120) {
    if (!str || str.length <= max) return str ?? '';
    return str.slice(0, max).trim() + '…';
  },

  /** Parse comma-separated tags string into array */
  parseTags(str) {
    if (!str) return [];
    return String(str).split(',').map(t => t.trim()).filter(Boolean);
  },

  /** Render tags as HTML badges */
  renderTags(tags) {
    return tags.map(t => `<span class="tag">${this.esc(t)}</span>`).join('');
  },

  /** Skeleton loader HTML */
  skeletons(count = 6) {
    return Array(count).fill('<div class="skeleton skeleton-card"></div>').join('');
  },

  /** Debounce a function */
  debounce(fn, ms = 300) {
    let t;
    return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
  },
};

/* ──────────────────────────────────────────────────────────────────
   7. GSAP ANIMATIONS
   ────────────────────────────────────────────────────────────────── */
const Animations = (() => {
  let scrollTriggers = [];

  function register() {
    gsap.registerPlugin(ScrollTrigger);
  }

  /** Animate home hero — called once after home page renders */
  function initHero() {
    const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });

    // Split name into characters for stagger
    ['hero-first', 'hero-last'].forEach(cls => {
      const el = document.querySelector(`.${cls}`);
      if (!el) return;
      el.innerHTML = el.textContent.split('').map(c =>
        c === ' ' ? '&nbsp;' : `<span class="char">${c}</span>`
      ).join('');
    });

    tl.set('#app', { opacity: 1 })
      .from('.hero-badge',      { y: 24, opacity: 0, duration: 0.6 }, 0.1)
      .from('.hero-first .char',{ y: 80, opacity: 0, stagger: 0.025, duration: 0.7 }, 0.2)
      .from('.hero-last .char', { y: 80, opacity: 0, stagger: 0.025, duration: 0.7 }, 0.35)
      .from('.hero-role',       { y: 24, opacity: 0, duration: 0.6 }, 0.55)
      .from('.hero-bio',        { y: 24, opacity: 0, duration: 0.6 }, 0.65)
      .from('.hero-cta > *',    { y: 24, opacity: 0, stagger: 0.1, duration: 0.5 }, 0.75)
      .from('.hero-scroll',     { opacity: 0, duration: 0.5 }, 1.0);

    // Subtle orb movement on mouse
    document.addEventListener('mousemove', e => {
      const x = (e.clientX / window.innerWidth  - 0.5) * 30;
      const y = (e.clientY / window.innerHeight - 0.5) * 30;
      gsap.to('.orb-1', { x:  x, y: y, duration: 2, ease: 'power1.out' });
      gsap.to('.orb-2', { x: -x, y: -y * 0.5, duration: 2.5, ease: 'power1.out' });
    }, { passive: true });
  }

  /** Typing effect for hero role */
  function initTyping(selector) {
    const el = document.querySelector(selector);
    if (!el) return;
    const roles = CONFIG.AUTHOR.roles;
    let ri = 0, ci = 0, deleting = false;

    function tick() {
      const word = roles[ri];
      el.textContent = deleting ? word.slice(0, ci - 1) : word.slice(0, ci + 1);
      ci += deleting ? -1 : 1;

      if (!deleting && ci > word.length) {
        setTimeout(() => { deleting = true; tick(); }, 1600);
        return;
      }
      if (deleting && ci < 0) {
        deleting = false;
        ri = (ri + 1) % roles.length;
        ci = 0;
      }
      setTimeout(tick, deleting ? 45 : 95);
    }
    setTimeout(tick, 1400);
  }

  /** Count-up animation for stats */
  function initCounters() {
    document.querySelectorAll('.stat-number[data-target]').forEach(el => {
      const target = el.dataset.target;
      if (isNaN(target)) { el.textContent = target; return; }

      const st = ScrollTrigger.create({
        trigger: el,
        start: 'top 85%',
        onEnter: () => {
          const obj = { val: 0 };
          gsap.to(obj, {
            val: parseFloat(target),
            duration: 2,
            ease: 'power2.out',
            onUpdate() { el.textContent = Math.round(obj.val) + '+'; },
          });
          st.kill();
        },
      });
      scrollTriggers.push(st);
    });
  }

  /** Scroll-triggered reveal for .reveal elements */
  function initScrollReveals() {
    document.querySelectorAll('.reveal').forEach(el => {
      const st = ScrollTrigger.create({
        trigger: el,
        start: 'top 88%',
        onEnter: () => {
          el.classList.add('animated');
          st.kill();
        },
      });
      scrollTriggers.push(st);
    });

    // Staggered card groups
    document.querySelectorAll('.cards-stagger').forEach(container => {
      const st = ScrollTrigger.create({
        trigger: container,
        start: 'top 85%',
        onEnter: () => {
          gsap.from(Array.from(container.children), {
            y: 32, opacity: 0, stagger: 0.08, duration: 0.55, ease: 'power3.out',
          });
          st.kill();
        },
      });
      scrollTriggers.push(st);
    });
  }

  /** Page transition (fade in) */
  function pageEnter(el) {
    gsap.fromTo(el, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power3.out' });
  }

  /** Kill all ScrollTriggers (cleanup before page change) */
  function killAll() {
    scrollTriggers.forEach(st => st.kill?.());
    scrollTriggers = [];
    ScrollTrigger.getAll().forEach(st => st.kill());
  }

  return { register, initHero, initTyping, initCounters, initScrollReveals, pageEnter, killAll };
})();

/* ──────────────────────────────────────────────────────────────────
   8. PAGES
   ────────────────────────────────────────────────────────────────── */

/* ─── 8a. HOME ───────────────────────────────────────────────────── */
async function renderHome() {
  const app = document.getElementById('app');
  const a   = CONFIG.AUTHOR;

  app.innerHTML = `
    <!-- HERO -->
    <section class="hero">
      <div class="hero-inner">
        ${a.available ? `<div class="hero-badge"><span class="dot"></span> Available for work</div>` : ''}

        <h1 class="hero-name">
          <span class="line hero-first">${a.firstName}</span>
          <span class="line hero-last accent-word">${a.lastName}</span>
        </h1>

        <p class="hero-role">
          <span class="typed-text"></span><span class="typed-cursor">_</span>
        </p>

        <p class="hero-bio">${Utils.esc(a.bio)}</p>

        <div class="hero-cta">
          <a href="#/projects" class="btn btn-primary">View My Work →</a>
          <a href="#/contact"  class="btn btn-ghost">Get in Touch</a>
        </div>
      </div>

      <div class="hero-scroll" aria-hidden="true">
        <span>Scroll</span>
        <div class="scroll-line"></div>
      </div>
    </section>

    <!-- STATS -->
    <section class="stats-section reveal">
      <div class="container">
        <div class="stats-grid">
          ${a.stats.map(s => `
            <div class="stat-item">
              <div class="stat-number" data-target="${s.value}">${isNaN(s.value) ? s.value : '0+'}</div>
              <div class="stat-label">${Utils.esc(s.label)}</div>
            </div>
          `).join('')}
        </div>
      </div>
    </section>

    <!-- SKILLS MARQUEE -->
    <div class="marquee-section" aria-label="Skills">
      <div class="marquee-track">
        ${[...a.skills, ...a.skills].map(s =>
          `<div class="marquee-item"><span>${Utils.esc(s)}</span><span class="sep">✦</span></div>`
        ).join('')}
      </div>
    </div>

    <!-- ABOUT -->
    <section class="about-section">
      <div class="container">
        <div class="about-grid">
          <div class="about-text reveal">
            <p class="section-label about-label">About Me</p>
            <h2 class="about-title">
              Turning ideas into<br><span>digital reality</span>
            </h2>
            <p class="about-desc">${Utils.esc(a.bio)}</p>
            <div class="about-info">
              ${Object.entries(a.info).map(([k, v]) => `
                <div class="info-item">
                  <span class="info-label">${Utils.esc(k)}</span>
                  <span class="info-value">${Utils.esc(v)}</span>
                </div>
              `).join('')}
            </div>
            <div style="display:flex;gap:1rem;flex-wrap:wrap;">
              <a href="${a.social.github}"   target="_blank" rel="noopener" class="btn btn-ghost btn-sm">GitHub ↗</a>
              <a href="${a.social.linkedin}" target="_blank" rel="noopener" class="btn btn-ghost btn-sm">LinkedIn ↗</a>
              <a href="#/contact" class="btn btn-primary btn-sm">Let's Talk</a>
            </div>
          </div>
          <div class="about-image-wrap reveal">
            <!-- <div class="about-placeholder">{ }</div> -->
            <!-- Replace the placeholder above with: <img src="your-photo.jpg" alt="Your Name" /> -->
            <img src="./shivam logo.jfif" alt="Your Name" />
          </div>
        </div>
      </div>
    </section>

    <!-- FEATURED PROJECTS -->
    <section class="featured-section">
      <div class="container">
        <div class="section-header reveal">
          <h2>Featured Work</h2>
          <a href="#/projects">See all projects →</a>
        </div>
        <div class="projects-grid cards-stagger" id="featuredGrid">
          ${Utils.skeletons(3)}
        </div>
      </div>
    </section>

    <!-- RECENT BLOG -->
    <section class="blog-preview-section">
      <div class="container">
        <div class="section-header reveal">
          <h2>Latest Writing</h2>
          <a href="#/blog">Read all posts →</a>
        </div>
        <div class="blog-list" id="blogList">
          ${Utils.skeletons(3)}
        </div>
      </div>
    </section>
  `;

  // Kick off GSAP
  Animations.initHero();
  Animations.initTyping('.typed-text');

  // Then fetch data
  await Promise.all([
    loadFeaturedProjects(),
    loadRecentBlog(),
  ]);

  Animations.initCounters();
  Animations.initScrollReveals();
}

async function loadFeaturedProjects() {
  const grid = document.getElementById('featuredGrid');
  if (!grid) return;

  const res = await API.get(CONFIG.TABLES.projects[0], { featured: 'true' }, { limit: 3 });
  const items = res.data || [];

  if (!items.length) {
    grid.innerHTML = renderProjectCards(getDemoProjects().slice(0, 3));
    return;
  }
  grid.innerHTML = renderProjectCards(items);
}

async function loadRecentBlog() {
  const list = document.getElementById('blogList');
  if (!list) return;

  const res = await API.get(CONFIG.TABLES.blog[0], {}, { sort: 'date:desc', limit: 4 });
  const items = res.data || [];

  if (!items.length) {
    list.innerHTML = renderBlogListItems(getDemoPosts().slice(0, 4));
    return;
  }
  list.innerHTML = renderBlogListItems(items);
  attachBlogListeners(list);
}

/* ─── 8b. PROJECTS PAGE ──────────────────────────────────────────── */
async function renderProjects() {
  const app = document.getElementById('app');

  // Show loading while we get table list
  const availableTables = CONFIG.TABLES.projects;
  const currentTable    = availableTables[0];

  app.innerHTML = `
    <!-- PAGE HERO -->
    <div class="page-hero">
      <div class="page-hero-inner">
        <p class="section-label">Portfolio</p>
        <h1 class="page-title">My Projects</h1>
        <p class="page-subtitle text-muted">Explore my work across different domains. Filter by sheet, tags, or search.</p>
      </div>
    </div>

    <div class="projects-page">
      <div class="container">

        <!-- FILTER BAR -->
        <div class="filter-bar">

          <!-- Table / Sheet selector -->
          <div class="filter-group">
            <label for="tableSelect">📋 Sheet / Category</label>
            <select class="filter-select" id="tableSelect">
              ${availableTables.map(t => `<option value="${t}">${t}</option>`).join('')}
            </select>
          </div>

          <!-- Search -->
          <div class="filter-group">
            <label for="searchInput">🔍 Search</label>
            <input type="text" class="filter-input" id="searchInput" placeholder="Filter by title or description…" />
          </div>

          <!-- Tag filter -->
          <div class="filter-group" style="flex:2">
            <label>🏷️ Tags</label>
            <div class="filter-tags-wrap" id="tagFilters">
              <!-- Populated after data loads -->
            </div>
          </div>

          <!-- Sort -->
          <div class="filter-group" style="min-width:140px">
            <label for="sortSelect">↕️ Sort</label>
            <select class="filter-select" id="sortSelect">
              <option value="">Default</option>
              <option value="date:desc">Newest first</option>
              <option value="date:asc">Oldest first</option>
              <option value="title:asc">A → Z</option>
            </select>
          </div>

        </div>

        <!-- Results meta -->
        <p class="results-meta" id="resultsMeta"></p>

        <!-- Grid -->
        <div class="projects-grid cards-stagger" id="projectsGrid">
          ${Utils.skeletons(6)}
        </div>
      </div>
    </div>
  `;

  Animations.pageEnter(app);

  // State
  let allProjects = [];
  let activeTag   = '';
  let searchVal   = '';

  const grid       = document.getElementById('projectsGrid');
  const meta       = document.getElementById('resultsMeta');
  const tagWrap    = document.getElementById('tagFilters');
  const tableEl    = document.getElementById('tableSelect');
  const searchEl   = document.getElementById('searchInput');
  const sortEl     = document.getElementById('sortSelect');

  async function loadTable(table) {
    grid.innerHTML = Utils.skeletons(6);
    tagWrap.innerHTML = '';
    activeTag = '';
    searchVal = '';
    if (searchEl) searchEl.value = '';

    const sort = sortEl?.value || '';
    const res  = await API.get(table, {}, sort ? { sort } : {});
    allProjects = res.data?.length ? res.data : getDemoProjects();

    // Collect all unique tags
    const allTags = [...new Set(allProjects.flatMap(p => Utils.parseTags(p.tags)))].sort();
    tagWrap.innerHTML = allTags.map(t =>
      `<span class="tag" data-tag="${Utils.esc(t)}">${Utils.esc(t)}</span>`
    ).join('');

    tagWrap.querySelectorAll('.tag').forEach(el => {
      el.addEventListener('click', () => {
        activeTag = activeTag === el.dataset.tag ? '' : el.dataset.tag;
        tagWrap.querySelectorAll('.tag').forEach(t => t.classList.remove('active'));
        if (activeTag) el.classList.add('active');
        renderGrid();
      });
    });

    renderGrid();
  }

  function renderGrid() {
    let filtered = allProjects;

    // Tag filter
    if (activeTag) {
      filtered = filtered.filter(p =>
        Utils.parseTags(p.tags).includes(activeTag)
      );
    }

    // Search filter
    if (searchVal) {
      const q = searchVal.toLowerCase();
      filtered = filtered.filter(p =>
        (p.title || '').toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q)
      );
    }

    // Update meta
    meta.innerHTML = `Showing <span>${filtered.length}</span> of ${allProjects.length} projects`;

    if (!filtered.length) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1">
          <div class="empty-icon">🔎</div>
          <h3>No projects found</h3>
          <p>Try adjusting your filters or search query.</p>
        </div>`;
      return;
    }

    grid.innerHTML = renderProjectCards(filtered);
    // Animate cards in
    gsap.fromTo(Array.from(grid.children),
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, stagger: 0.06, duration: 0.4, ease: 'power3.out' }
    );
  }

  // Events
  tableEl.addEventListener('change', () => loadTable(tableEl.value));
  sortEl.addEventListener('change', () => loadTable(tableEl.value));
  searchEl.addEventListener('input', Utils.debounce(e => {
    searchVal = e.target.value.trim();
    renderGrid();
  }, 280));

  // Initial load
  await loadTable(currentTable);
  Animations.initScrollReveals();
}

/* ─── 8c. BLOG PAGE ──────────────────────────────────────────────── */
async function renderBlog() {
  const app = document.getElementById('app');

  const availableTables = CONFIG.TABLES.blog;

  app.innerHTML = `
    <div class="page-hero">
      <div class="page-hero-inner">
        <p class="section-label">Writing</p>
        <h1 class="page-title">Blog</h1>
        <p class="page-subtitle text-muted">Thoughts on code, design, and everything in between.</p>
      </div>
    </div>

    <div class="blog-page">
      <div class="container">

        <!-- Filter bar -->
        <div class="blog-filter-bar">
          <div class="filter-group" style="min-width:180px">
            <label for="blogTableSelect" style="font-size:var(--text-xs);color:var(--text-muted);text-transform:uppercase;letter-spacing:.08em">📋 Category</label>
            <select class="filter-select" id="blogTableSelect">
              ${availableTables.map(t => `<option value="${t}">${t}</option>`).join('')}
            </select>
          </div>

          <div class="filter-group" style="flex:1">
            <label for="blogSearch" style="font-size:var(--text-xs);color:var(--text-muted);text-transform:uppercase;letter-spacing:.08em">🔍 Search</label>
            <input type="text" class="filter-input" id="blogSearch" placeholder="Search posts…" />
          </div>

          <div style="display:flex;flex-wrap:wrap;gap:.5rem;align-items:flex-end" id="blogTagFilters"></div>
        </div>

        <p class="results-meta" id="blogMeta"></p>

        <div class="blog-grid cards-stagger" id="blogGrid">
          ${Utils.skeletons(6)}
        </div>
      </div>
    </div>
  `;

  Animations.pageEnter(app);

  let allPosts  = [];
  let activeTag = '';
  let searchVal = '';

  const grid        = document.getElementById('blogGrid');
  const meta        = document.getElementById('blogMeta');
  const tagWrap     = document.getElementById('blogTagFilters');
  const tableEl     = document.getElementById('blogTableSelect');
  const searchEl    = document.getElementById('blogSearch');

  async function loadTable(table) {
    grid.innerHTML   = Utils.skeletons(6);
    tagWrap.innerHTML = '';
    activeTag = '';
    searchVal = '';
    if (searchEl) searchEl.value = '';

    const res = await API.get(table, {}, { sort: 'date:desc' });
    allPosts = res.data?.length ? res.data : getDemoPosts();

    const allTags = [...new Set(allPosts.flatMap(p => Utils.parseTags(p.tags)))].sort();
    tagWrap.innerHTML = allTags.map(t =>
      `<span class="tag" data-tag="${Utils.esc(t)}">${Utils.esc(t)}</span>`
    ).join('');

    tagWrap.querySelectorAll('.tag').forEach(el => {
      el.addEventListener('click', () => {
        activeTag = activeTag === el.dataset.tag ? '' : el.dataset.tag;
        tagWrap.querySelectorAll('.tag').forEach(t => t.classList.remove('active'));
        if (activeTag) el.classList.add('active');
        renderGrid();
      });
    });

    renderGrid();
  }

  function renderGrid() {
    let filtered = allPosts;

    if (activeTag) {
      filtered = filtered.filter(p => Utils.parseTags(p.tags).includes(activeTag));
    }
    if (searchVal) {
      const q = searchVal.toLowerCase();
      filtered = filtered.filter(p =>
        (p.title || '').toLowerCase().includes(q) ||
        (p.excerpt || '').toLowerCase().includes(q)
      );
    }

    meta.innerHTML = `Showing <span>${filtered.length}</span> of ${allPosts.length} posts`;

    if (!filtered.length) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1">
          <div class="empty-icon">📭</div>
          <h3>No posts found</h3>
          <p>Try a different search or category.</p>
        </div>`;
      return;
    }

    grid.innerHTML = filtered.map(p => `
      <article class="card blog-card" data-id="${Utils.esc(p.id || p.title)}" role="button" tabindex="0"
               aria-label="Read: ${Utils.esc(p.title)}">
        <div class="blog-card-img">${p.emoji || '📝'}</div>
        <div class="blog-card-body">
          <div class="blog-card-meta">
            <span>${Utils.fmtDate(p.date)}</span>
            ${p.readTime ? `<span>·</span><span>${Utils.esc(p.readTime)} min read</span>` : ''}
          </div>
          <h3 class="blog-card-title">${Utils.esc(p.title)}</h3>
          <p class="blog-card-excerpt">${Utils.esc(Utils.truncate(p.excerpt || p.content, 130))}</p>
          <div style="display:flex;flex-wrap:wrap;gap:.4rem;margin-top:.5rem">
            ${Utils.renderTags(Utils.parseTags(p.tags))}
          </div>
          <div class="blog-card-footer">
            <span class="text-muted" style="font-size:var(--text-xs)">${Utils.esc(p.author || CONFIG.AUTHOR.name)}</span>
            <span class="read-more">Read more →</span>
          </div>
        </div>
      </article>
    `).join('');

    // Card click → open modal
    grid.querySelectorAll('.blog-card').forEach((card, i) => {
      const open = () => openBlogModal(filtered[i]);
      card.addEventListener('click', open);
      card.addEventListener('keydown', e => e.key === 'Enter' && open());
    });

    gsap.fromTo(Array.from(grid.children),
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, stagger: 0.07, duration: 0.45, ease: 'power3.out' }
    );
  }

  tableEl.addEventListener('change', () => loadTable(tableEl.value));
  searchEl.addEventListener('input', Utils.debounce(e => {
    searchVal = e.target.value.trim();
    renderGrid();
  }, 280));

  await loadTable(availableTables[0]);
  Animations.initScrollReveals();
}

function openBlogModal(post) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', post.title);
  overlay.innerHTML = `
    <div class="modal-content">
      <button class="modal-close" id="modalClose" aria-label="Close">✕</button>
      <div class="modal-meta">
        <span>${Utils.fmtDate(post.date)}</span>
        ${post.readTime ? `<span>·</span><span>${Utils.esc(post.readTime)} min read</span>` : ''}
        ${post.author ? `<span>·</span><span>by ${Utils.esc(post.author)}</span>` : ''}
      </div>
      <h2 class="modal-title">${Utils.esc(post.title)}</h2>
      <div style="display:flex;flex-wrap:wrap;gap:.4rem;margin-bottom:1.5rem">
        ${Utils.renderTags(Utils.parseTags(post.tags))}
      </div>
      <div class="modal-body">${post.content ? Utils.esc(post.content).replace(/\n/g, '<br>') : Utils.esc(post.excerpt || 'No content available.')}</div>
    </div>
  `;

  document.body.appendChild(overlay);
  document.body.style.overflow = 'hidden';
  overlay.querySelector('#modalClose').focus();

  const close = () => {
    document.body.removeChild(overlay);
    document.body.style.overflow = '';
  };

  overlay.querySelector('#modalClose').addEventListener('click', close);
  overlay.addEventListener('click', e => e.target === overlay && close());
  document.addEventListener('keydown', function handler(e) {
    if (e.key === 'Escape') { close(); document.removeEventListener('keydown', handler); }
  });
}

/* ─── 8d. CONTACT PAGE ───────────────────────────────────────────── */
async function renderContact() {
  const app = document.getElementById('app');
  const a   = CONFIG.AUTHOR;

  app.innerHTML = `
    <div class="page-hero">
      <div class="page-hero-inner">
        <p class="section-label">Say Hello</p>
        <h1 class="page-title">Let's Talk</h1>
        <p class="page-subtitle text-muted">Have a project in mind? Let's build something great together.</p>
      </div>
    </div>

    <div class="contact-page">
      <div class="container">
        <div class="contact-grid">

          <!-- Left: Info -->
          <div class="contact-info reveal">
            <h2 class="contact-title">Get in touch</h2>
            <p class="contact-desc">
              I'm always open to discussing new projects, creative ideas, or opportunities to be part of your vision.
            </p>
            <ul class="contact-list">
              <li class="contact-item">
                <span class="contact-item-icon">📧</span>
                <div class="contact-item-text">
                  <span class="contact-item-label">Email</span>
                  <a href="mailto:${a.email}" class="contact-item-val">${Utils.esc(a.email)}</a>
                </div>
              </li>
              <li class="contact-item">
                <span class="contact-item-icon">📍</span>
                <div class="contact-item-text">
                  <span class="contact-item-label">Location</span>
                  <span class="contact-item-val">${Utils.esc(a.location)}</span>
                </div>
              </li>
              <li class="contact-item">
                <span class="contact-item-icon">💼</span>
                <div class="contact-item-text">
                  <span class="contact-item-label">Status</span>
                  <span class="contact-item-val" style="color:var(--accent-green)">
                    ${a.available ? '● Available for work' : '○ Not available'}
                  </span>
                </div>
              </li>
              <li class="contact-item">
                <span class="contact-item-icon">🐙</span>
                <div class="contact-item-text">
                  <span class="contact-item-label">GitHub</span>
                  <a href="${a.social.github}" target="_blank" rel="noopener" class="contact-item-val">@yourusername</a>
                </div>
              </li>
            </ul>
          </div>

          <!-- Right: Form -->
          <div class="contact-form-wrap reveal">
            <h3 class="form-title">Send a message</h3>
            <form id="contactForm" novalidate>
              <div class="form-row">
                <div class="form-group">
                  <label for="fname">First Name *</label>
                  <input class="form-input" type="text" id="fname" name="firstName" placeholder="John" required />
                </div>
                <div class="form-group">
                  <label for="lname">Last Name</label>
                  <input class="form-input" type="text" id="lname" name="lastName" placeholder="Doe" />
                </div>
              </div>
              <div class="form-group">
                <label for="femail">Email Address *</label>
                <input class="form-input" type="email" id="femail" name="email" placeholder="john@example.com" required />
              </div>
              <div class="form-group">
                <label for="fsubject">Subject *</label>
                <input class="form-input" type="text" id="fsubject" name="subject" placeholder="Project inquiry, collaboration…" required />
              </div>
              <div class="form-group">
                <label for="fmessage">Message *</label>
                <textarea class="form-textarea" id="fmessage" name="message" placeholder="Tell me about your project…" required></textarea>
              </div>
              <div class="form-submit-wrap">
                <button type="submit" class="btn btn-primary" id="submitBtn">
                  Send Message →
                </button>
              </div>
              <div class="form-status" id="formStatus"></div>
            </form>
          </div>

        </div>
      </div>
    </div>
  `;

  Animations.pageEnter(app);
  Animations.initScrollReveals();

  // Form submit handler
  document.getElementById('contactForm').addEventListener('submit', async e => {
    e.preventDefault();
    const form   = e.currentTarget;
    const btn    = document.getElementById('submitBtn');
    const status = document.getElementById('formStatus');

    // Validate
    const required = ['fname', 'femail', 'fsubject', 'fmessage'];
    const missing  = required.filter(id => !document.getElementById(id).value.trim());
    if (missing.length) {
      status.className = 'form-status error';
      status.textContent = 'Please fill in all required fields.';
      return;
    }

    // Collect data
    const data = {};
    new FormData(form).forEach((v, k) => { data[k] = v; });
    data.timestamp = new Date().toISOString();

    // Submit
    btn.textContent = 'Sending…';
    btn.disabled    = true;

    const res = await API.submit(data);

    btn.textContent = 'Send Message →';
    btn.disabled    = false;

    if (res.success !== false) {
      status.className  = 'form-status success';
      status.textContent = '✓ Message sent! I\'ll get back to you soon.';
      form.reset();
    } else {
      status.className  = 'form-status error';
      status.textContent = '✗ Something went wrong. Please try emailing me directly.';
    }
  });
}

/* ─── 8e. 404 ────────────────────────────────────────────────────── */
function renderNotFound() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="not-found">
      <div class="not-found-code">404</div>
      <h2>Page not found</h2>
      <p class="text-muted">The page you're looking for doesn't exist.</p>
      <a href="#/" class="btn btn-primary" style="margin-top:1.5rem">← Back Home</a>
    </div>
  `;
  Animations.pageEnter(app);
}

/* ──────────────────────────────────────────────────────────────────
   9. SHARED RENDER HELPERS
   ────────────────────────────────────────────────────────────────── */
function renderProjectCards(items) {
  if (!items.length) return `<div class="empty-state" style="grid-column:1/-1"><div class="empty-icon">📦</div><h3>No projects yet</h3><p>Check back soon!</p></div>`;

  return items.map(p => {
    const tags = Utils.parseTags(p.tags);
    return `
      <article class="card project-card">
        <div class="project-card-top">
          <span class="project-icon">${p.emoji || '🚀'}</span>
          <div class="project-links">
            ${p.github ? `<a href="${Utils.esc(p.github)}" class="project-link" target="_blank" rel="noopener" aria-label="GitHub">GH</a>` : ''}
            ${p.link   ? `<a href="${Utils.esc(p.link)}"   class="project-link" target="_blank" rel="noopener" aria-label="Live demo">↗</a>`   : ''}
          </div>
        </div>
        <h3 class="project-title">${Utils.esc(p.title)}</h3>
        <p class="project-desc">${Utils.esc(Utils.truncate(p.description, 140))}</p>
        <div class="project-tags">${Utils.renderTags(tags)}</div>
      </article>
    `;
  }).join('');
}

function renderBlogListItems(items) {
  return items.map((p, i) => `
    <div class="blog-list-item" data-idx="${i}" role="button" tabindex="0">
      <span class="blog-index">${String(i + 1).padStart(2, '0')}</span>
      <div>
        <div class="blog-item-title">${Utils.esc(p.title)}</div>
      </div>
      <div class="blog-item-meta">
        <span>${Utils.fmtDate(p.date)}</span>
        ${p.readTime ? `<span>· ${Utils.esc(p.readTime)} min</span>` : ''}
        <span class="blog-item-arrow">→</span>
      </div>
    </div>
  `).join('');
}

function attachBlogListeners(container) {
  container.querySelectorAll('.blog-list-item').forEach((el, i) => {
    const post = getDemoPosts()[i];
    if (post) {
      el.addEventListener('click', () => openBlogModal(post));
      el.addEventListener('keydown', e => e.key === 'Enter' && openBlogModal(post));
    }
  });
}

/* ──────────────────────────────────────────────────────────────────
   10. DEMO / FALLBACK DATA  (shown when GAS isn't configured)
   ────────────────────────────────────────────────────────────────── */
function getDemoProjects() {
  return [
    {
      title: 'Portfolio Site',
      description: 'Personal portfolio built with vanilla JS, GSAP animations, and Google Apps Script as backend. Fully responsive with dark/light mode.',
      tags: 'JavaScript, GSAP, Google Apps Script, CSS',
      emoji: '🚀',
      github: '#',
      link: '#',
      featured: 'true',
      date: '2025-01-01',
    },
    {
      title: 'FormCraft Builder',
      description: 'A drag-and-drop form builder that generates shareable form URLs with hash-based routing for GitHub Pages compatibility.',
      tags: 'JavaScript, CSS, HTML',
      emoji: '🛠️',
      github: '#',
      link: '#',
      featured: 'true',
      date: '2024-11-15',
    },
    {
      title: 'DevDash',
      description: 'Developer productivity dashboard with GitHub stats, Pomodoro timer, and notes. Stores data in Google Sheets via Apps Script.',
      tags: 'React, Node.js, Google Sheets API',
      emoji: '📊',
      github: '#',
      link: '#',
      featured: 'true',
      date: '2024-09-20',
    },
    {
      title: 'Auth SDK',
      description: 'Lightweight authentication SDK with JWT tokens, OAuth providers, and session management for single-page apps.',
      tags: 'TypeScript, Node.js, JWT, OAuth',
      emoji: '🔐',
      github: '#',
      link: '#',
      date: '2024-08-10',
    },
    {
      title: 'CLI Toolkit',
      description: 'Command-line utility collection for automating repetitive dev tasks: git-flow helpers, project scaffolding, and deployment scripts.',
      tags: 'Python, Shell, Node.js',
      emoji: '⌨️',
      github: '#',
      link: '#',
      date: '2024-06-05',
    },
    {
      title: 'UIKit',
      description: 'Open source component library with 40+ accessible components, dark/light theme support, and zero-dependency CSS.',
      tags: 'CSS, JavaScript, Accessibility',
      emoji: '🎨',
      github: '#',
      link: '#',
      date: '2024-04-01',
    },
  ];
}

function getDemoPosts() {
  return [
    {
      title: 'Hash Routing for GitHub Pages SPAs',
      excerpt: 'GitHub Pages throws 404s for client-side routes because it looks for actual files. Here\'s the definitive fix using hash-based routing in vanilla JS.',
      content: 'GitHub Pages throws 404s for client-side routes because it looks for actual files. Here\'s the definitive fix using hash-based routing in vanilla JS.\n\nThe core problem: when you navigate to /form/abc123, GitHub Pages tries to find a file at that path. It doesn\'t exist — only index.html does.\n\nThe fix: use hash-based URLs (#/form/abc123). GitHub Pages always serves index.html for any hash URL, then your JS router handles the rest.',
      tags: 'JavaScript, GitHub Pages, Routing',
      emoji: '🔗',
      date: '2025-03-10',
      readTime: '5',
      author: CONFIG.AUTHOR.name,
    },
    {
      title: 'GSAP for Beginners: Bring Your UI to Life',
      excerpt: 'GSAP (GreenSock Animation Platform) is the gold standard for web animations. Learn the core concepts — timelines, ease functions, and ScrollTrigger — with real examples.',
      content: 'GSAP is the most powerful animation library in the JavaScript ecosystem. In this post, we\'ll cover the core concepts you need to build stunning animations.\n\nTimelines let you sequence animations precisely. ScrollTrigger fires animations when elements enter the viewport. Ease functions control the feel of motion.',
      tags: 'GSAP, Animation, JavaScript',
      emoji: '✨',
      date: '2025-02-18',
      readTime: '8',
      author: CONFIG.AUTHOR.name,
    },
    {
      title: 'Google Apps Script as a Free Backend',
      excerpt: 'You don\'t need a server to have a backend. Google Apps Script turns any Google Sheet into a full REST API — for free. Here\'s how to build and deploy one.',
      content: 'Google Apps Script gives you a serverless backend that writes to Google Sheets — completely free. Deploy a doGet and doPost function, publish as a web app with "Anyone" access, and you have a working REST API.\n\nGreat for: contact forms, simple CRUD apps, portfolios, and prototypes.',
      tags: 'Google Apps Script, Backend, Sheets',
      emoji: '📋',
      date: '2025-01-25',
      readTime: '6',
      author: CONFIG.AUTHOR.name,
    },
    {
      title: 'CSS Custom Properties Done Right',
      excerpt: 'CSS variables are more powerful than most devs realize. Learn how to use them for theming, component variants, responsive design, and even animations.',
      content: 'CSS custom properties (variables) unlock a level of dynamism that preprocessors can\'t match. Unlike Sass variables, CSS vars are live — they respond to media queries, JS changes, and inherited scope.\n\nUse them for design tokens, theme switching, and component-level customization.',
      tags: 'CSS, Design Systems, Theming',
      emoji: '🎨',
      date: '2024-12-05',
      readTime: '4',
      author: CONFIG.AUTHOR.name,
    },
  ];
}

/* ──────────────────────────────────────────────────────────────────
   11. ROUTER  (Hash-based — works on GitHub Pages)
   ────────────────────────────────────────────────────────────────── */
const Router = (() => {
  const routes = {
    '':         renderHome,
    'home':     renderHome,
    'projects': renderProjects,
    'blog':     renderBlog,
    'contact':  renderContact,
  };

  function getRoute() {
    // #/projects?foo=bar  →  'projects'
    return window.location.hash
      .replace(/^#\/?/, '')
      .split('?')[0]
      .split('/')[0]
      .toLowerCase();
  }

  function navigate(path) {
    window.location.hash = `/${path}`;
  }

  function resolve() {
    const route = getRoute();
    const handler = routes[route] ?? renderNotFound;

    // Kill old scroll triggers before re-rendering
    Animations.killAll();

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'instant' });

    // Set nav active state
    Nav.setActive(route || 'home');
    Nav.closeMenu();

    // Render page
    handler();
  }

  function init() {
    window.addEventListener('hashchange', resolve);
    resolve(); // Initial render
  }

  return { init, navigate, getRoute };
})();

/* ──────────────────────────────────────────────────────────────────
   12. BOOTSTRAP
   ────────────────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  // Footer year
  const yr = document.getElementById('footerYear');
  if (yr) yr.textContent = new Date().getFullYear();

  // Init modules
  Animations.register();
  Theme.init();
  Cursor.init();
  Nav.init();
  Router.init();
});
