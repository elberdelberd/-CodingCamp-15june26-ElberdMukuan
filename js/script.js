/* ============================================================
   FocusNest — js/script.js
   ============================================================ */

/* ---- Constants ---- */
const KEYS = {
  tasks : 'fn-tasks',
  links : 'fn-links',
  name  : 'fn-name',
  theme : 'fn-theme',
  pomo  : 'fn-pomo',
};

const TIMER_R      = 85;
const TIMER_CX     = 100;
const TIMER_CY     = 100;
const TIMER_CIRCUM = 2 * Math.PI * TIMER_R;   // ≈ 534.07
const DONUT_CIRCUM = 2 * Math.PI * 48;          // ≈ 301.59

const DEFAULT_LINKS = [
  { id: 1, name: 'Google',      url: 'https://www.google.com' },
  { id: 2, name: 'GitHub',      url: 'https://github.com' },
  { id: 3, name: 'YouTube',     url: 'https://www.youtube.com' },
  { id: 4, name: 'ITS Official',url: 'https://www.its.ac.id' },
];

const QUOTES = [
  'Every great journey starts with a single step. Add your first task! 🌱',
  'Small progress is still progress. Keep going! You\'ve got this! 💪',
  'You\'re making great strides! Keep the momentum going! 🎯',
  'Amazing! Almost there — finish strong! 🚀',
  'Outstanding! You crushed all your tasks today! 🎉',
];

/* ---- State ---- */
let state = {
  tasks      : [],
  links      : [],
  userName   : 'User',
  theme      : 'light',
  pomoDur    : 25,
  sort       : 'default',
  editTaskId : null,
  timer: {
    total    : 25 * 60,
    left     : 25 * 60,
    running  : false,
    interval : null,
  },
};

let _lastGreetHour = -1;

/* ============================================================
   LOCAL STORAGE HELPERS
   ============================================================ */
const ls = {
  get(key, fallback) {
    try {
      const v = localStorage.getItem(key);
      return v !== null ? JSON.parse(v) : fallback;
    } catch { return fallback; }
  },
  set(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch { /* quota */ }
  },
};

/* ============================================================
   INIT
   ============================================================ */
function init() {
  state.tasks    = ls.get(KEYS.tasks, []);
  state.links    = ls.get(KEYS.links, DEFAULT_LINKS);
  state.userName = ls.get(KEYS.name,  'User');
  state.theme    = ls.get(KEYS.theme, 'light');
  state.pomoDur  = ls.get(KEYS.pomo,  25);

  applyTheme(state.theme);

  state.timer.total = state.pomoDur * 60;
  state.timer.left  = state.pomoDur * 60;

  /* Seed default tasks jika masih kosong */
  if (state.tasks.length === 0) {
    state.tasks = [
      { id: 1, text: 'Belajar HTML, CSS, dan JavaScript', done: false },
      { id: 2, text: 'Mengerjakan proyek To-Do List',     done: true  },
      { id: 3, text: 'Baca materi struktur data',         done: false },
      { id: 4, text: 'Olahraga 30 menit',                 done: false },
      { id: 5, text: 'Tidur lebih awal',                  done: false },
    ];
    ls.set(KEYS.tasks, state.tasks);
  }

  refreshName();
  refreshPomoLabel();
  updateTimerUI();
  renderTasks();
  renderLinks();
  updateProgress();

  /* Start clock */
  tickClock();
  setInterval(tickClock, 1000);

  /* Init pomo input */
  document.getElementById('pomo-input').value = state.pomoDur;

  bindEvents();
}

/* ============================================================
   CLOCK & GREETING
   ============================================================ */
function tickClock() {
  const now = new Date();
  const h   = now.getHours();
  const m   = now.getMinutes();
  const s   = now.getSeconds();
  const ap  = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;

  document.getElementById('time-display').textContent =
    `${pad(h12)}:${pad(m)}:${pad(s)} ${ap}`;

  document.getElementById('date-display').textContent =
    now.toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });

  if (h !== _lastGreetHour) {
    _lastGreetHour = h;
    updateGreeting();
  }
}

function updateGreeting() {
  const h = new Date().getHours();
  let word, emoji, sub;

  if      (h >= 5  && h < 12) { word = 'Good Morning';   emoji = '🌻'; sub = 'Have a productive day!'; }
  else if (h >= 12 && h < 17) { word = 'Good Afternoon';  emoji = '☀️'; sub = 'Keep up the great work!'; }
  else if (h >= 17 && h < 21) { word = 'Good Evening';    emoji = '🌆'; sub = 'You did great today!'; }
  else                         { word = 'Good Night';      emoji = '🌙'; sub = 'Time to rest and recharge.'; }

  document.getElementById('greeting-word').textContent = word;
  document.getElementById('greeting-emoji').textContent = emoji;
  document.getElementById('greeting-sub').textContent   = sub;
}

/* ============================================================
   NAME
   ============================================================ */
function refreshName() {
  document.getElementById('greeting-name').textContent = state.userName;
  document.getElementById('chip-name').textContent     = state.userName;
}

function openNameModal() {
  document.getElementById('name-inp').value = state.userName;
  openModal('modal-name');
  setTimeout(() => document.getElementById('name-inp').focus(), 80);
}

function saveName() {
  const val = document.getElementById('name-inp').value.trim();
  if (!val) { toast('Nama tidak boleh kosong!', 'err'); return; }
  state.userName = val;
  ls.set(KEYS.name, state.userName);
  refreshName();
  closeModal('modal-name');
  toast('Nama berhasil diperbarui! 👋', 'ok');
}

/* ============================================================
   THEME
   ============================================================ */
function applyTheme(t) {
  document.documentElement.setAttribute('data-theme', t);
  document.getElementById('theme-chk').checked = (t === 'dark');
  state.theme = t;
  ls.set(KEYS.theme, t);
}

/* ============================================================
   TIMER
   ============================================================ */
function updateTimerUI() {
  const { left, total } = state.timer;

  /* Text */
  const m = Math.floor(left / 60);
  const s = left % 60;
  document.getElementById('timer-time').textContent = `${pad(m)}:${pad(s)}`;

  /* Stroke offset — remaining time arc */
  const ratio  = total > 0 ? left / total : 1;
  const offset = TIMER_CIRCUM * (1 - ratio);
  document.getElementById('t-prog').style.strokeDashoffset = offset;

  /* Dot position — at the END of remaining arc */
  const remFrac = ratio;
  const angle   = -Math.PI / 2 + remFrac * 2 * Math.PI;
  const dotX    = TIMER_CX + TIMER_R * Math.cos(angle);
  const dotY    = TIMER_CY + TIMER_R * Math.sin(angle);
  const dot     = document.getElementById('t-dot');
  dot.setAttribute('cx', dotX.toFixed(3));
  dot.setAttribute('cy', dotY.toFixed(3));
}

function startTimer() {
  if (state.timer.running) return;
  if (state.timer.left === 0) resetTimer();
  state.timer.running = true;
  document.getElementById('timer-msg').textContent = 'Focusing... 🔥';
  state.timer.interval = setInterval(() => {
    state.timer.left--;
    updateTimerUI();
    if (state.timer.left <= 0) {
      clearInterval(state.timer.interval);
      state.timer.running = false;
      document.getElementById('timer-msg').textContent = '✅ Sesi selesai! Istirahat dulu.';
      toast('Sesi fokus selesai! 🎉', 'ok');
    }
  }, 1000);
}

function pauseTimer() {
  clearInterval(state.timer.interval);
  state.timer.running = false;
  if (state.timer.left > 0) {
    document.getElementById('timer-msg').textContent = 'Dijeda ⏸';
  }
}

function resetTimer() {
  clearInterval(state.timer.interval);
  state.timer.running = false;
  state.timer.left    = state.timer.total;
  updateTimerUI();
  document.getElementById('timer-msg').textContent = 'Ready to focus?';
}

function applyPomoDuration() {
  const val = parseInt(document.getElementById('pomo-input').value, 10);
  if (!val || val < 1 || val > 90) {
    toast('Durasi harus antara 1–90 menit', 'err'); return;
  }
  clearInterval(state.timer.interval);
  state.timer.running = false;
  state.timer.total   = val * 60;
  state.timer.left    = val * 60;
  state.pomoDur       = val;
  ls.set(KEYS.pomo, val);
  refreshPomoLabel();
  updateTimerUI();
  document.getElementById('timer-msg').textContent = 'Ready to focus?';
  toast(`Durasi diset ke ${val} menit ⏱`, 'ok');
}

function refreshPomoLabel() {
  document.getElementById('pomo-label').textContent  = state.pomoDur;
  document.getElementById('pomo-input').value        = state.pomoDur;
}

/* ============================================================
   TASKS
   ============================================================ */
function getSortedTasks() {
  const copy = [...state.tasks];
  if (state.sort === 'alpha') {
    copy.sort((a, b) => a.text.localeCompare(b.text));
  } else if (state.sort === 'done-last') {
    copy.sort((a, b) => Number(a.done) - Number(b.done));
  }
  return copy;
}

function renderTasks() {
  const list   = document.getElementById('task-list');
  const sorted = getSortedTasks();

  if (sorted.length === 0) {
    list.innerHTML =
      '<li class="task-empty">Belum ada tugas. Tambahkan satu di atas! 🌱</li>';
    updateTaskCount();
    updateProgress();
    return;
  }

  list.innerHTML = sorted.map(t => `
    <li class="task-item ${t.done ? 'done' : ''}" data-id="${t.id}">
      <input type="checkbox" class="task-cb" ${t.done ? 'checked' : ''}
        aria-label="Tandai selesai"/>
      <span class="task-txt">${esc(t.text)}</span>
      <div class="task-acts">
        <button class="task-btn edit" data-action="edit" aria-label="Edit">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </button>
        <button class="task-btn del" data-action="del" aria-label="Hapus">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
          </svg>
        </button>
      </div>
    </li>
  `).join('');

  updateTaskCount();
  updateProgress();
}

function updateTaskCount() {
  const total = state.tasks.length;
  const done  = state.tasks.filter(t => t.done).length;
  document.getElementById('task-count').textContent = `${done} of ${total} tasks completed`;
}

function addTask() {
  const inp  = document.getElementById('task-inp');
  const text = inp.value.trim();
  if (!text) return;

  /* Challenge: Cegah duplikat */
  const dup = state.tasks.some(t => t.text.toLowerCase() === text.toLowerCase());
  if (dup) {
    toast('Tugas ini sudah ada!', 'warn');
    inp.select();
    return;
  }

  state.tasks.push({ id: Date.now(), text, done: false });
  ls.set(KEYS.tasks, state.tasks);
  inp.value = '';
  inp.focus();
  renderTasks();
  toast('Tugas ditambahkan! ✅', 'ok');
}

function toggleTask(id) {
  const t = state.tasks.find(t => t.id === id);
  if (!t) return;
  t.done = !t.done;
  ls.set(KEYS.tasks, state.tasks);
  renderTasks();
}

function deleteTask(id) {
  state.tasks = state.tasks.filter(t => t.id !== id);
  ls.set(KEYS.tasks, state.tasks);
  renderTasks();
}

function openEditTask(id) {
  const t = state.tasks.find(t => t.id === id);
  if (!t) return;
  state.editTaskId = id;
  document.getElementById('task-edit-inp').value = t.text;
  openModal('modal-task-edit');
  setTimeout(() => document.getElementById('task-edit-inp').focus(), 80);
}

function saveEditTask() {
  const text = document.getElementById('task-edit-inp').value.trim();
  if (!text) { toast('Tugas tidak boleh kosong!', 'err'); return; }

  /* Challenge: Cegah duplikat (kecuali task yang sama) */
  const dup = state.tasks.some(
    t => t.id !== state.editTaskId && t.text.toLowerCase() === text.toLowerCase()
  );
  if (dup) { toast('Tugas ini sudah ada!', 'warn'); return; }

  const t = state.tasks.find(t => t.id === state.editTaskId);
  if (!t) return;
  t.text = text;
  ls.set(KEYS.tasks, state.tasks);
  renderTasks();
  closeModal('modal-task-edit');
  toast('Tugas diperbarui! ✏️', 'ok');
}

function clearTasks() {
  if (!state.tasks.length) return;
  if (!confirm('Hapus semua tugas?')) return;
  state.tasks = [];
  ls.set(KEYS.tasks, state.tasks);
  renderTasks();
  toast('Semua tugas dihapus', 'ok');
}

/* ============================================================
   QUICK LINKS
   ============================================================ */
function getFavicon(url) {
  try {
    const u = new URL(url);
    return `https://www.google.com/s2/favicons?domain=${u.hostname}&sz=32`;
  } catch { return ''; }
}

function renderLinks() {
  const grid  = document.getElementById('links-grid');
  const items = state.links.map(lk => {
    const fav = getFavicon(lk.url);
    const img = fav
      ? `<img class="link-favicon" src="${fav}" alt=""
           onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"
           loading="lazy"/>
         <div class="link-fallback" style="display:none">${esc(lk.name[0].toUpperCase())}</div>`
      : `<div class="link-fallback">${esc(lk.name[0].toUpperCase())}</div>`;

    return `
      <div class="link-item" data-url="${escAttr(lk.url)}" data-id="${lk.id}"
        title="${esc(lk.name)}">
        <button class="link-del" data-action="del-link" data-id="${lk.id}"
          title="Hapus link">×</button>
        ${img}
        <span>${esc(lk.name)}</span>
      </div>`;
  }).join('');

  const addBtn = `
    <button class="link-add-btn" data-action="open-add-link">
      <div class="link-add-ico">+</div>
      <span>Add New</span>
    </button>`;

  grid.innerHTML = items + addBtn;
}

function addLink() {
  const name = document.getElementById('link-name-inp').value.trim();
  const raw  = document.getElementById('link-url-inp').value.trim();
  if (!name) { toast('Masukkan nama link!', 'err'); return; }
  if (!raw)  { toast('Masukkan URL!',       'err'); return; }

  const url = raw.startsWith('http') ? raw : 'https://' + raw;
  try { new URL(url); } catch {
    toast('URL tidak valid!', 'err'); return;
  }

  state.links.push({ id: Date.now(), name, url });
  ls.set(KEYS.links, state.links);
  renderLinks();
  closeModal('modal-link');
  toast('Link ditambahkan! 🔗', 'ok');
}

function removeLink(id) {
  state.links = state.links.filter(l => l.id !== id);
  ls.set(KEYS.links, state.links);
  renderLinks();
}

function openLinkModal() {
  document.getElementById('link-name-inp').value = '';
  document.getElementById('link-url-inp').value  = '';
  openModal('modal-link');
  setTimeout(() => document.getElementById('link-name-inp').focus(), 80);
}

/* ============================================================
   PROGRESS
   ============================================================ */
function updateProgress() {
  const total = state.tasks.length;
  const done  = state.tasks.filter(t => t.done).length;
  const pct   = total === 0 ? 0 : Math.round((done / total) * 100);

  document.getElementById('stat-done').textContent = done;
  document.getElementById('stat-left').textContent = total - done;
  document.getElementById('donut-pct').textContent = `${pct}%`;

  /* Donut */
  const offset = DONUT_CIRCUM * (1 - pct / 100);
  document.getElementById('d-prog').style.strokeDashoffset = offset;

  /* Quote */
  let qi;
  if (total === 0 || pct === 0)  qi = 0;
  else if (pct < 50)             qi = 1;
  else if (pct < 75)             qi = 2;
  else if (pct < 100)            qi = 3;
  else                           qi = 4;
  document.getElementById('quote-txt').textContent = QUOTES[qi];

  /* Subtitle */
  document.getElementById('progress-sub').textContent =
    pct === 100 && total > 0 ? 'Amazing work today! 🎉' : "You're doing great!";
}

/* ============================================================
   MODAL HELPERS
   ============================================================ */
function openModal(id) {
  const el = document.getElementById(id);
  el.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal(id) {
  const el = document.getElementById(id);
  el.classList.remove('open');
  document.body.style.overflow = '';
}

/* ============================================================
   TOAST
   ============================================================ */
function toast(msg, type = 'ok') {
  let wrap = document.querySelector('.toast-wrap');
  if (!wrap) {
    wrap = document.createElement('div');
    wrap.className = 'toast-wrap';
    document.body.appendChild(wrap);
  }
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = msg;
  wrap.appendChild(el);
  setTimeout(() => {
    el.style.transition = '.3s ease';
    el.style.opacity    = '0';
    el.style.transform  = 'translateX(110%)';
    setTimeout(() => el.remove(), 320);
  }, 2600);
}

/* ============================================================
   UTILS
   ============================================================ */
function pad(n) { return String(n).padStart(2, '0'); }

function esc(s) {
  return String(s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;')
    .replace(/'/g,'&#39;');
}

function escAttr(s) {
  return String(s).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/* ============================================================
   EVENT BINDING
   ============================================================ */
function bindEvents() {

  /* Nav items */
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', e => {
      e.preventDefault();
      document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
      item.classList.add('active');
      const sec = item.dataset.sec;
      const target = document.getElementById(sec + '-anchor') ||
                     document.getElementById(sec);
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  /* Theme toggle */
  document.getElementById('theme-chk').addEventListener('change', e => {
    applyTheme(e.target.checked ? 'dark' : 'light');
  });

  /* User chip & greeting name → open name modal */
  document.getElementById('user-chip').addEventListener('click', openNameModal);
  document.getElementById('greeting-name').addEventListener('click', openNameModal);

  /* Name modal */
  document.getElementById('name-save-btn').addEventListener('click', saveName);
  document.getElementById('name-cancel-btn').addEventListener('click',
    () => closeModal('modal-name'));
  document.getElementById('name-inp').addEventListener('keydown', e => {
    if (e.key === 'Enter')  saveName();
    if (e.key === 'Escape') closeModal('modal-name');
  });

  /* Pomodoro */
  document.getElementById('pomo-set-btn').addEventListener('click', applyPomoDuration);
  document.getElementById('pomo-input').addEventListener('keydown', e => {
    if (e.key === 'Enter') applyPomoDuration();
  });

  /* Timer buttons */
  document.getElementById('btn-start').addEventListener('click', startTimer);
  document.getElementById('btn-stop') .addEventListener('click', pauseTimer);
  document.getElementById('btn-reset').addEventListener('click', resetTimer);

  /* Task: add */
  document.getElementById('task-add-btn').addEventListener('click', addTask);
  document.getElementById('task-inp').addEventListener('keydown', e => {
    if (e.key === 'Enter') addTask();
  });

  /* Task: clear all */
  document.getElementById('task-clear-btn').addEventListener('click', clearTasks);

  /* Task: sort */
  document.getElementById('sort-sel').addEventListener('change', e => {
    state.sort = e.target.value;
    renderTasks();
  });

  /* Task list: delegation for checkbox / edit / delete */
  const taskList = document.getElementById('task-list');
  taskList.addEventListener('change', e => {
    if (e.target.classList.contains('task-cb')) {
      const li = e.target.closest('.task-item');
      if (li) toggleTask(+li.dataset.id);
    }
  });
  taskList.addEventListener('click', e => {
    const btn = e.target.closest('.task-btn');
    if (!btn) return;
    const li = btn.closest('.task-item');
    if (!li) return;
    const id = +li.dataset.id;
    if (btn.dataset.action === 'edit') openEditTask(id);
    if (btn.dataset.action === 'del')  deleteTask(id);
  });

  /* Task edit modal */
  document.getElementById('task-edit-save').addEventListener('click', saveEditTask);
  document.getElementById('task-edit-cancel').addEventListener('click',
    () => closeModal('modal-task-edit'));
  document.getElementById('task-edit-inp').addEventListener('keydown', e => {
    if (e.key === 'Enter')  saveEditTask();
    if (e.key === 'Escape') closeModal('modal-task-edit');
  });

  /* Links: Add Link button in card header */
  document.getElementById('add-link-btn').addEventListener('click', openLinkModal);

  /* Links grid: delegation for open link / delete / add new */
  document.getElementById('links-grid').addEventListener('click', e => {
    /* Del button */
    const delBtn = e.target.closest('[data-action="del-link"]');
    if (delBtn) {
      e.stopPropagation();
      removeLink(+delBtn.dataset.id);
      return;
    }
    /* Add New button */
    const addBtn = e.target.closest('[data-action="open-add-link"]');
    if (addBtn) { openLinkModal(); return; }
    /* Link item click → open URL */
    const item = e.target.closest('.link-item');
    if (item && item.dataset.url) {
      window.open(item.dataset.url, '_blank', 'noopener,noreferrer');
    }
  });

  /* Link modal */
  document.getElementById('link-save-btn').addEventListener('click', addLink);
  document.getElementById('link-cancel-btn').addEventListener('click',
    () => closeModal('modal-link'));
  document.getElementById('link-name-inp').addEventListener('keydown', e => {
    if (e.key === 'Enter')  document.getElementById('link-url-inp').focus();
    if (e.key === 'Escape') closeModal('modal-link');
  });
  document.getElementById('link-url-inp').addEventListener('keydown', e => {
    if (e.key === 'Enter')  addLink();
    if (e.key === 'Escape') closeModal('modal-link');
  });

  /* Close modals on overlay click */
  ['modal-link', 'modal-task-edit', 'modal-name'].forEach(id => {
    document.getElementById(id).addEventListener('click', e => {
      if (e.target.id === id) closeModal(id);
    });
  });
}

/* ============================================================
   START
   ============================================================ */
document.addEventListener('DOMContentLoaded', init);