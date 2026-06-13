// Global utilities

function toggleNav() {
  const nav = document.getElementById('nav-links');
  if (nav) nav.classList.toggle('open');
}

async function postJSON(url, body) {
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await resp.json().catch(() => ({}));
  return { ok: resp.ok, data };
}

// Auto-dismiss flash messages
document.querySelectorAll('.flash').forEach(el => {
  setTimeout(() => el.remove(), 5000);
});

// ── Dark / Light mode ──────────────────────────────────────────
(function () {
  const stored = localStorage.getItem('theme');
  const preferred = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  const theme = stored || preferred;
  if (theme === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
})();

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  if (next === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
  } else {
    document.documentElement.removeAttribute('data-theme');
  }
  localStorage.setItem('theme', next);
}

// ── Notifications ──────────────────────────────────────────────
function toggleNotifDropdown() {
  const dd = document.getElementById('notif-dropdown');
  if (!dd) return;
  dd.classList.toggle('open');
  if (dd.classList.contains('open')) {
    // Mark all as read visually when opened
    setTimeout(() => {
      document.querySelectorAll('.notif-item.unread').forEach(el => el.classList.remove('unread'));
      document.querySelectorAll('.notif-dot').forEach(el => el.remove());
      const badge = document.getElementById('notif-badge');
      if (badge) badge.classList.add('hidden');
    }, 800);
  }
}

function markAllRead() {
  document.querySelectorAll('.notif-item.unread').forEach(el => el.classList.remove('unread'));
  document.querySelectorAll('.notif-dot').forEach(el => el.remove());
  const badge = document.getElementById('notif-badge');
  if (badge) badge.classList.add('hidden');
}

// Close notification dropdown when clicking outside
document.addEventListener('click', function (e) {
  const wrap = document.querySelector('.notif-wrap');
  if (wrap && !wrap.contains(e.target)) {
    const dd = document.getElementById('notif-dropdown');
    if (dd) dd.classList.remove('open');
  }
});
