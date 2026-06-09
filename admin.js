/* ================================================================
   admin.js — RK IP TV Admin Panel
================================================================ */

const API = 'api.php';
let TOKEN = '';
let editMatchId = null;
let editChannelId = null;
let allMatches = [];
let allChannels = [];
let activeSport = 'all';
let activeCat = 'all';

/* ----------------------------------------------------------------
   SIDEBAR TOGGLE (mobile)
---------------------------------------------------------------- */
function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  const hamburger = document.getElementById('hamburger');
  sidebar.classList.toggle('open');
  overlay.classList.toggle('show');
  hamburger.classList.toggle('open');
}
function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebarOverlay').classList.remove('show');
  document.getElementById('hamburger')?.classList.remove('open');
}

/* ----------------------------------------------------------------
   LOGIN / LOGOUT
---------------------------------------------------------------- */
function doLogin() {
  const user = document.getElementById('loginUser').value.trim();
  const pass = document.getElementById('loginPass').value.trim();
  const err  = document.getElementById('loginError');
  err.textContent = '';

  if (!user || !pass) { err.textContent = 'Fill all fields.'; return; }

  fetch(`${API}?type=auth`, {
    method: 'GET',
    headers: { 'X-Admin-Token': pass }
  }).then(async r => {
    if (r.status === 401) { err.textContent = 'Wrong username or password.'; return; }
    if (!r.ok) { err.textContent = 'Server error. Try again.'; return; }
    TOKEN = pass;
    localStorage.setItem('rk_admin_token', pass);
    showPanel();
  }).catch(() => { err.textContent = 'Cannot reach server.'; });
}

function showPanel() {
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('adminWrap').style.display = 'flex';
  loadMatches();
  loadChannels();
}

function doLogout() {
  TOKEN = '';
  localStorage.removeItem('rk_admin_token');
  document.getElementById('loginScreen').style.display = 'flex';
  document.getElementById('adminWrap').style.display = 'none';
  closeSidebar();
}

window.addEventListener('load', () => {
  const saved = localStorage.getItem('rk_admin_token');
  if (saved) { TOKEN = saved; showPanel(); }
  document.getElementById('loginPass')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') doLogin();
  });
});

/* ----------------------------------------------------------------
   SECTION SWITCH
---------------------------------------------------------------- */
function switchSection(name, el) {
  document.querySelectorAll('.section').forEach(s => s.style.display = 'none');
  document.getElementById(`section-${name}`).style.display = 'block';
  document.querySelectorAll('.snav-item').forEach(i => i.classList.remove('active'));
  el.classList.add('active');
  closeSidebar();
}

/* ----------------------------------------------------------------
   API HELPERS
---------------------------------------------------------------- */
async function apiFetch(url, method = 'GET', body = null) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json', 'X-Admin-Token': TOKEN }
  };
  if (body) opts.body = JSON.stringify(body);
  const r = await fetch(url, opts);
  return r.json();
}

/* ----------------------------------------------------------------
   MATCHES — LOAD & RENDER
---------------------------------------------------------------- */
async function loadMatches() {
  setGrid('matchGrid', spinner());
  const data = await apiFetch(`${API}?type=matches`);
  allMatches = Array.isArray(data) ? data : [];
  renderMatchGrid();
}

function filterMatches(sport, el) {
  activeSport = sport;
  document.querySelectorAll('#matchTabs .tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  renderMatchGrid();
}

function renderMatchGrid() {
  const list = activeSport === 'all'
    ? allMatches
    : allMatches.filter(m => m.sport === activeSport);

  const countEl = document.getElementById('matchCount');
  if (countEl) countEl.textContent = `${list.length} match${list.length !== 1 ? 'es' : ''}`;

  if (!list.length) {
    setGrid('matchGrid', emptyState('🏆', 'No matches found'));
    return;
  }

  const grid = document.getElementById('matchGrid');
  grid.innerHTML = list.map(m => {
    const t1img = m.team1_logo
      ? `<img class="m-team-img" src="${esc(m.team1_logo)}" alt="${esc(m.team1_name)}" onerror="this.src='assets/logo.png'">`
      : `<img class="m-team-img" src="assets/logo.png" alt="${esc(m.team1_name)}">`;
    const t2img = m.team2_logo
      ? `<img class="m-team-img" src="${esc(m.team2_logo)}" alt="${esc(m.team2_name)}" onerror="this.src='assets/logo.png'">`
      : `<img class="m-team-img" src="assets/logo.png" alt="${esc(m.team2_name)}">`;

    const sportClass = `badge-sport badge-${m.sport}`;
    const statusClass = `badge-status s-${m.status}`;
    const timeHtml = m.display_time
      ? `<div class="m-time">📅 ${esc(m.display_time)}</div>` : '';

    return `
    <div class="m-card">
      <div class="m-card-top">
        <div class="m-badges">
          <span class="${sportClass}">${m.sport}</span>
        </div>
        <span class="${statusClass}">${m.status}</span>
      </div>
      <div class="m-tournament">${esc(m.tournament)}</div>
      ${timeHtml}
      <div class="m-teams">
        <div class="m-team">
          ${t1img}
          <div class="m-team-name">${esc(m.team1_name)}</div>
        </div>
        <div class="m-vs">VS</div>
        <div class="m-team">
          ${t2img}
          <div class="m-team-name">${esc(m.team2_name)}</div>
        </div>
      </div>
      <div class="card-actions">
        <button class="btn-edit" onclick="openMatchModal(${m.id})">✏ Edit</button>
        ${m.status === 'live' ? `<button class="btn-end-live" onclick="confirmDelete('match',${m.id},true)">⏹ End Live</button>` : ''}
        <button class="btn-del"  onclick="confirmDelete('match',${m.id})">🗑 Delete</button>
      </div>
    </div>`;
  }).join('');
}

/* ----------------------------------------------------------------
   MATCH MODAL
---------------------------------------------------------------- */
function openMatchModal(id = null) {
  editMatchId = id;
  document.getElementById('matchModalTitle').textContent = id ? 'Edit Match' : 'Add Match';
  document.getElementById('matchError').textContent = '';
  clearPrev('prev1'); clearPrev('prev2');

  if (id) {
    const m = allMatches.find(x => x.id == id);
    if (!m) return;
    setVal('mId', m.id); setVal('mSport', m.sport);
    setVal('mTournament', m.tournament); setVal('mDate', m.match_date || '');
    setVal('mTime', m.match_time || ''); setVal('mT1Name', m.team1_name);
    setVal('mT1Logo', m.team1_logo || ''); setVal('mT2Name', m.team2_name);
    setVal('mT2Logo', m.team2_logo || ''); setVal('mStream', m.stream_url || '');
    showPrev('prev1', m.team1_logo); showPrev('prev2', m.team2_logo);
  } else {
    ['mTournament', 'mDate', 'mTime', 'mT1Name', 'mT1Logo', 'mT2Name', 'mT2Logo', 'mStream'].forEach(id => {
      document.getElementById(id).value = '';
    });
    setVal('mSport', 'cricket');
  }
  openModal('matchModal');
}

document.getElementById('mT1Logo').addEventListener('input', e => showPrev('prev1', e.target.value));
document.getElementById('mT2Logo').addEventListener('input', e => showPrev('prev2', e.target.value));

async function saveMatch() {
  const err = document.getElementById('matchError');
  err.textContent = '';
  const body = {
    sport: getVal('mSport'),
    tournament: getVal('mTournament').trim(),
    match_date: getVal('mDate') || null, match_time: getVal('mTime') || null,
    team1_name: getVal('mT1Name').trim(), team1_logo: getVal('mT1Logo').trim() || null,
    team2_name: getVal('mT2Name').trim(), team2_logo: getVal('mT2Logo').trim() || null,
    stream_url: getVal('mStream').trim() || null,
  };
  if (!body.tournament || !body.team1_name || !body.team2_name) {
    err.textContent = 'Fill required (*) fields.'; return;
  }
  const res = editMatchId
    ? await apiFetch(`${API}?type=matches&id=${editMatchId}`, 'PUT', body)
    : await apiFetch(`${API}?type=matches`, 'POST', body);
  if (res.error) { err.textContent = res.error; return; }
  closeModal('matchModal');
  loadMatches();
}

/* ----------------------------------------------------------------
   CHANNELS — LOAD & RENDER
---------------------------------------------------------------- */
async function loadChannels() {
  setGrid('channelGrid', spinner());
  const data = await apiFetch(`${API}?type=channels`);
  allChannels = Array.isArray(data) ? data : [];
  renderChannelGrid();
}

function filterChannels(cat, el) {
  activeCat = cat;
  document.querySelectorAll('#channelTabs .tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  renderChannelGrid();
}

// category icon map
const CAT_ICON = {
  Sports: '⚽', News: '📰', Movies: '🎬', Kids: '🧸', Islamic: '☪️', Others: '📡'
};
const CAT_CLASS = {
  Sports: 'cat-sports', News: 'cat-news', Movies: 'cat-movies',
  Kids: 'cat-kids', Islamic: 'cat-islamic', Others: 'cat-others'
};

function renderChannelGrid() {
  const list = activeCat === 'all'
    ? allChannels
    : allChannels.filter(c => c.meta === activeCat);

  const countEl = document.getElementById('channelCount');
  if (countEl) countEl.textContent = `${list.length} channel${list.length !== 1 ? 's' : ''}`;

  if (!list.length) {
    setGrid('channelGrid', emptyState('📺', 'No channels found'));
    return;
  }

  const grid = document.getElementById('channelGrid');
  grid.innerHTML = list.map(c => {
    const logo = c.logo
      ? `<img src="${esc(c.logo)}" alt="${esc(c.name)}" onerror="this.src='assets/logo.png'">`
      : `<img src="assets/logo.png" alt="${esc(c.name)}">`;
    const liveBadge = c.is_live
      ? `<span class="ch-live-badge live">● LIVE</span>`
      : `<span class="ch-live-badge offline">OFFLINE</span>`;
    const catIcon = CAT_ICON[c.meta] || '📡';
    const catClass = CAT_CLASS[c.meta] || 'cat-others';
    return `
    <div class="ch-card">
      <div class="ch-card-top">
        <div class="ch-logo">${logo}</div>
        <div class="ch-info">
          <div class="ch-name">${esc(c.name)}</div>
          <div class="ch-meta">
            <span class="${catClass}">${catIcon} ${esc(c.meta || 'Others')}</span>
          </div>
        </div>
        ${liveBadge}
      </div>
      <div class="ch-card-bottom">
        <button class="btn-edit" onclick="openChannelModal(${c.id})">✏ Edit</button>
        <button class="btn-del"  onclick="confirmDelete('channel',${c.id})">🗑 Delete</button>
      </div>
    </div>`;
  }).join('');
}

/* ----------------------------------------------------------------
   CHANNEL MODAL
---------------------------------------------------------------- */
function openChannelModal(id = null) {
  editChannelId = id;
  document.getElementById('chModalTitle').textContent = id ? 'Edit Channel' : 'Add Channel';
  document.getElementById('chError').textContent = '';
  clearPrev('prevCh');

  if (id) {
    const c = allChannels.find(x => x.id == id);
    if (!c) return;
    setVal('chName', c.name); setVal('chLogo', c.logo || '');
    setVal('chStream', c.stream_url || ''); setVal('chMeta', c.meta || 'Sports');
    document.getElementById('chLive').checked = !!c.is_live;
    showPrev('prevCh', c.logo);
  } else {
    ['chName', 'chLogo', 'chStream'].forEach(id => document.getElementById(id).value = '');
    setVal('chMeta', 'Sports');
    document.getElementById('chLive').checked = false;
  }
  updateToggleLabel();
  openModal('channelModal');
}

document.getElementById('chLogo').addEventListener('input', e => showPrev('prevCh', e.target.value));
document.getElementById('chLive').addEventListener('change', updateToggleLabel);

function updateToggleLabel() {
  const live = document.getElementById('chLive').checked;
  const lbl = document.getElementById('chLiveLabel');
  lbl.textContent = live ? 'Live' : 'Offline';
  lbl.style.color = live ? 'var(--red)' : '';
}

async function saveChannel() {
  const err = document.getElementById('chError');
  err.textContent = '';
  const body = {
    name: getVal('chName').trim(),
    logo: getVal('chLogo').trim() || null,
    stream_url: getVal('chStream').trim() || null,
    meta: getVal('chMeta') || 'Sports',
    is_live: document.getElementById('chLive').checked,
  };
  if (!body.name) { err.textContent = 'Channel name is required.'; return; }
  const res = editChannelId
    ? await apiFetch(`${API}?type=channels&id=${editChannelId}`, 'PUT', body)
    : await apiFetch(`${API}?type=channels`, 'POST', body);
  if (res.error) { err.textContent = res.error; return; }
  closeModal('channelModal');
  loadChannels();
}

/* ----------------------------------------------------------------
   DELETE
---------------------------------------------------------------- */
function confirmDelete(type, id, isEndLive = false) {
  const msg = isEndLive
    ? `End this live match and remove it?`
    : `Delete this ${type} permanently? This cannot be undone.`;
  document.getElementById('confirmMsg').textContent = msg;
  document.getElementById('confirmOkBtn').textContent = isEndLive ? 'End Live' : 'Delete';
  document.getElementById('confirmOkBtn').onclick = () => doDelete(type, id);
  openModal('confirmModal');
}

async function doDelete(type, id) {
  const endpoint = type === 'match' ? 'matches' : 'channels';
  await apiFetch(`${API}?type=${endpoint}&id=${id}`, 'DELETE');
  closeModal('confirmModal');
  if (type === 'match') loadMatches(); else loadChannels();
}

/* ----------------------------------------------------------------
   MODAL HELPERS
---------------------------------------------------------------- */
function openModal(id) { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

/* ----------------------------------------------------------------
   UI HELPERS
---------------------------------------------------------------- */
function spinner() {
  return `<div class="empty-state"><div class="spinner"></div><p>Loading...</p></div>`;
}
function emptyState(icon, msg) {
  return `<div class="empty-state"><div class="empty-icon">${icon}</div><p>${msg}</p></div>`;
}
function setGrid(id, html) { document.getElementById(id).innerHTML = html; }

function showPrev(divId, url) {
  const div = document.getElementById(divId);
  div.innerHTML = url
    ? `<img src="${esc(url)}" onerror="this.style.display='none'">`
    : '';
}
function clearPrev(divId) { document.getElementById(divId).innerHTML = ''; }

function getVal(id) { return document.getElementById(id).value; }
function setVal(id, v) { document.getElementById(id).value = v ?? ''; }

function esc(str) {
  return String(str ?? '').replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}