const loginPanel = document.querySelector('#login-panel');
const dashboard = document.querySelector('#dashboard');
const loginForm = document.querySelector('#login-form');
const loginMessage = document.querySelector('#login-message');
const list = document.querySelector('#application-list');
const dashboardMessage = document.querySelector('#dashboard-message');
const apiOrigin = 'https://the-alpha-x-gang.harinash12346.chatgpt.site';
let sessionToken = sessionStorage.getItem('ax_admin_token') || '';
let currentFilter = 'All';

async function api(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  if (options.body) headers['Content-Type'] = 'application/json';
  if (sessionToken) headers.Authorization = `Bearer ${sessionToken}`;
  const response = await fetch(`${apiOrigin}${path}`, { ...options, headers, credentials: 'omit' });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 401) showLogin();
    throw new Error(result.error || 'The request could not be completed.');
  }
  return result;
}

function showLogin() {
  sessionToken = '';
  sessionStorage.removeItem('ax_admin_token');
  dashboard.hidden = true;
  loginPanel.hidden = false;
}
function showDashboard(username) {
  loginPanel.hidden = true;
  dashboard.hidden = false;
  document.querySelector('#signed-in-as').textContent = `SIGNED IN · ${username}`;
}
function setMessage(element, text, error = true) {
  element.textContent = text;
  element.classList.toggle('success', !error);
  element.hidden = !text;
}
function formatDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}
function make(tag, className, text) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text !== undefined) el.textContent = text;
  return el;
}

function renderApplication(app) {
  const card = make('article', 'application-card');
  const applicant = make('div', 'applicant-block');
  applicant.append(make('div', 'applicant-name', app.full_name));
  applicant.append(make('div', 'applicant-date', `APPLICATION #${app.id} · ${formatDate(app.created_at)}`));
  const badge = make('span', `status-pill ${app.status.toLowerCase()}`, app.status.toUpperCase());
  applicant.append(badge);

  const copy = make('div', 'app-copy');
  copy.append(make('div', 'meta-label', 'WHY THEY WANT TO JOIN'));
  copy.append(make('div', 'app-detail', app.reason));
  copy.append(make('div', 'meta-label', 'GAME SKILLS'));
  copy.append(make('div', 'app-detail', app.skills || 'Not provided'));

  const meta = make('div', 'app-meta');
  meta.append(make('div', 'meta-label', 'FAVOURITE GAME'));
  meta.append(make('div', 'app-detail', app.favourite_game === 'Other' ? `Other · ${app.other_game}` : app.favourite_game));
  meta.append(make('div', 'meta-label', 'WHATSAPP'));
  const phone = make('div', 'app-detail', app.whatsapp);
  meta.append(phone);
  const waLink = make('a', '', 'CONTACT ON WHATSAPP ↗');
  waLink.href = `https://wa.me/${app.whatsapp.replace(/\D/g, '')}`;
  waLink.target = '_blank';
  waLink.rel = 'noopener noreferrer';
  waLink.setAttribute('aria-label', `Open WhatsApp chat with ${app.full_name}`);
  meta.append(waLink);

  const actions = make('div', 'app-actions');
  actions.append(make('div', 'meta-label', 'INTERNAL NOTE'));
  const note = make('textarea', 'note-area');
  note.maxLength = 1000;
  note.placeholder = 'Visible to admins only';
  note.value = app.note || '';
  note.setAttribute('aria-label', `Internal note for ${app.full_name}`);
  actions.append(note);
  const controls = make('div', 'card-actions');
  const status = document.createElement('select');
  status.setAttribute('aria-label', `Status for ${app.full_name}`);
  for (const value of ['Pending', 'Accepted', 'Rejected']) {
    const option = document.createElement('option'); option.value = value; option.textContent = value; status.append(option);
  }
  status.value = app.status;
  const save = make('button', 'save-button', 'SAVE CHANGES');
  save.type = 'button';
  save.addEventListener('click', async () => {
    const nextStatus = status.value;
    save.disabled = true;
    save.textContent = 'SAVING…';
    try {
      await api(`/api/admin/applications/${app.id}`, { method: 'POST', body: JSON.stringify({ status: nextStatus, note: note.value }) });
      setMessage(dashboardMessage, `Application #${app.id} saved.`, false);
      await loadApplications();
    } catch (error) {
      setMessage(dashboardMessage, error.message, true);
    } finally {
      save.disabled = false;
      save.textContent = 'SAVE CHANGES';
    }
  });
  controls.append(status, save);
  actions.append(controls);
  card.append(applicant, copy, meta, actions);
  return card;
}

async function loadApplications() {
  list.replaceChildren(make('div', 'empty-state', 'Loading applications…'));
  try {
    const result = await api(`/api/admin/applications?status=${encodeURIComponent(currentFilter)}`);
    list.replaceChildren();
    if (!result.applications.length) {
      list.append(make('div', 'empty-state', currentFilter === 'All' ? 'No applications yet. New submissions will appear here.' : `No ${currentFilter.toLowerCase()} applications.`));
      return;
    }
    for (const app of result.applications) list.append(renderApplication(app));
  } catch (error) {
    if (dashboard.hidden) return;
    list.replaceChildren(make('div', 'empty-state', error.message));
  }
}

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  setMessage(loginMessage, '');
  const button = loginForm.querySelector('button');
  button.disabled = true;
  try {
    const body = Object.fromEntries(new FormData(loginForm).entries());
    const result = await api('/api/login', { method: 'POST', body: JSON.stringify(body) });
    sessionToken = result.token;
    sessionStorage.setItem('ax_admin_token', sessionToken);
    loginForm.reset();
    setMessage(dashboardMessage, 'Signed in successfully.', false);
    showDashboard(result.username);
    await loadApplications();
  } catch (error) {
    setMessage(loginMessage, error.message, true);
  } finally {
    button.disabled = false;
  }
});

document.querySelector('#logout-button').addEventListener('click', async () => {
  try { await api('/api/logout', { method: 'POST', body: '{}' }); } catch (error) { setMessage(dashboardMessage, error.message); }
  showLogin();
});
document.querySelector('#refresh-button').addEventListener('click', loadApplications);
document.querySelectorAll('#filter-tabs button').forEach((button) => button.addEventListener('click', () => {
  currentFilter = button.dataset.filter;
  document.querySelectorAll('#filter-tabs button').forEach((tab) => tab.classList.toggle('active', tab === button));
  loadApplications();
}));

(async function start() {
  if (!sessionToken) return showLogin();
  try {
    const me = await api('/api/me');
    if (!me.authenticated) return showLogin();
    showDashboard(me.username);
    await loadApplications();
  } catch { showLogin(); }
})();
