/* ================================================================
   RK IP TV — script.js
   - API থেকে data load করে
   - Filter ঠিকমতো কাজ করে
   - Match/Channel click করলে player page এ যায়
================================================================ */

const API = 'api.php';

let allMatches = [];
let allChannels = [];
let activeSport = 'all';
let activeStatus = 'recent';

/* ----------------------------------------------------------------
   API থেকে data load
---------------------------------------------------------------- */
async function loadData() {
  try {
    const [mRes, cRes] = await Promise.all([
      fetch(`${API}?type=matches`),
      fetch(`${API}?type=channels`)
    ]);
    allMatches = await mRes.json();
    allChannels = await cRes.json();
    if (!Array.isArray(allMatches)) allMatches = [];
    if (!Array.isArray(allChannels)) allChannels = [];
  } catch (e) {
    console.error('API load failed, using fallback data', e);
    // Fallback — API না থাকলে hardcoded data দিয়ে চলবে
    allMatches = FALLBACK_MATCHES;
    allChannels = FALLBACK_CHANNELS;
  }
  updateCounts();
  renderMatches();
  renderChannels();
  requestAnimationFrame(syncPanelHeight);
}

/* ----------------------------------------------------------------
   FILTER
---------------------------------------------------------------- */
function filteredMatches(sport, status) {
  return allMatches.filter(m => {
    const sportOk = sport === 'all' || m.sport === sport;
    const statusOk =
      status === 'all' ? true :
        status === 'recent' ? (m.status === 'recent' || m.status === 'live') :
          status === 'upcoming' ? (m.status === 'upcoming' || m.status === 'recent') :
            status === 'live' ? m.status === 'live' :
              m.status === status;
    return sportOk && statusOk;
  });
}

function updateCounts() {
  ['recent', 'live', 'upcoming', 'all'].forEach(s => {
    const el = document.querySelector(`.count-${s}`);
    if (el) el.textContent = filteredMatches(activeSport, s).length;
  });
}

/* ----------------------------------------------------------------
   RENDER MATCHES
---------------------------------------------------------------- */
function renderMatches() {
  const list = document.getElementById('matchList');
  const toShow = filteredMatches(activeSport, activeStatus);

  if (!toShow.length) {
    list.innerHTML = `<div class="no-matches">No matches found.</div>`;
    syncPanelHeight();
    return;
  }

  list.innerHTML = toShow.map(m => {
    const flag1 = m.team1_logo || m.team1?.flag || 'assets/logo.png';
    const flag2 = m.team2_logo || m.team2?.flag || 'assets/logo.png';
    const name1 = m.team1_name || m.team1?.name || '';
    const name2 = m.team2_name || m.team2?.name || '';
    const sport = m.sport ? (m.sport.charAt(0).toUpperCase() + m.sport.slice(1)) : '';
    const tournament = m.tournament || '';
    const isLive = m.status === 'live';
    const timeBadge = isLive
      ? `<span class="badge-live">LIVE</span>`
      : `<span class="badge-time">${m.display_time || m.time || ''}</span>`;

    // Live match এ click করলে player এ যাবে
    const clickAttr = (isLive && m.stream_url)
      ? `onclick="goPlayer('${encodeURIComponent(m.stream_url)}', '${encodeURIComponent(name1 + ' vs ' + name2)}')"`
      : '';
    const liveClass = (isLive && m.stream_url) ? ' clickable' : '';

    return `
    <div class="match-card${liveClass}" data-id="${m.id}" ${clickAttr}>
      <div class="card-top">
        <div class="match-title">${sport} | ${tournament}</div>
        ${timeBadge}
      </div>
      <div class="teams">
        <div class="teams-row">
          <div class="t-flag1">
            <img src="${flag1}" alt="${name1}" loading="lazy" onerror="this.src='assets/logo.png'">
          </div>
          <div class="t-name1"><span class="team-name">${name1}</span></div>
          <div class="t-vs">VS</div>
          <div class="t-name2"><span class="team-name">${name2}</span></div>
          <div class="t-flag2">
            <img src="${flag2}" alt="${name2}" loading="lazy" onerror="this.src='assets/logo.png'">
          </div>
        </div>
      </div>
    </div>`;
  }).join('');

  requestAnimationFrame(syncPanelHeight);
}

/* ----------------------------------------------------------------
   RENDER CHANNELS
---------------------------------------------------------------- */
function renderChannels() {
  const list = document.getElementById('channelList');
  if (!allChannels.length) {
    list.innerHTML = `<div class="no-matches">No channels found.</div>`;
    return;
  }

  list.innerHTML = allChannels.map(ch => {
    const logo = ch.logo || null;
    const isLive = ch.is_live || ch.isLive || false;
    const name = ch.name || '';
    const meta = ch.meta || '';

    const clickAttr = (isLive && ch.stream_url)
      ? `onclick="goPlayer('${encodeURIComponent(ch.stream_url)}', '${encodeURIComponent(name)}')"`
      : '';

    return `
    <div class="channel-item" data-id="${ch.id}" ${clickAttr}>
      <div class="channel-logo">
        ${logo
        ? `<img src="${logo}" alt="${name}" onerror="this.src='assets/logo.png'">`
        : `<img src="assets/logo.png" alt="${name}">`}
      </div>
      <div class="channel-info">
        <div class="channel-name">${name}</div>
        <div class="channel-meta">${meta}</div>
      </div>
      <div class="channel-right">
        ${isLive
        ? `<span class="ch-badge-live">LIVE</span>`
        : `<span class="ch-badge-offline">OFFLINE</span>`}
        <span class="channel-arrow">›</span>
      </div>
    </div>`;
  }).join('');
}

/* ----------------------------------------------------------------
   PLAYER — stream url দিয়ে player page এ যাওয়া
---------------------------------------------------------------- */
function goPlayer(encodedSrc, encodedTitle) {

  const src =
    decodeURIComponent(
      encodedSrc
    );

  const title =
    decodeURIComponent(
      encodedTitle
    );

  sessionStorage.setItem(

    "player_back",

    location.href

  );

  location.href =

    `player.html?src=${encodeURIComponent(src)}&title=${encodeURIComponent(title)}`;

}

/* ----------------------------------------------------------------
   FILTER EVENTS
---------------------------------------------------------------- */
document.querySelectorAll('.sport-item').forEach(el => {
  el.addEventListener('click', () => {
    document.querySelectorAll('.sport-item').forEach(s => s.classList.remove('active'));
    el.classList.add('active');
    activeSport = el.dataset.sport;
    updateCounts();
    renderMatches();
  });
});

document.querySelectorAll('.status-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.status-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeStatus = btn.dataset.status;
    renderMatches();
  });
});

document.querySelectorAll('.bottom-nav-item').forEach(item => {
  item.addEventListener('click', () => {
    document.querySelectorAll('.bottom-nav-item').forEach(i => i.classList.remove('active'));
    item.classList.add('active');
  });
});

/* ----------------------------------------------------------------
   PANEL HEIGHT SYNC
---------------------------------------------------------------- */
function syncPanelHeight() {
  const left = document.querySelector('.left-panel');
  const right = document.querySelector('.right-panel');
  if (!left || !right) return;
  right.style.height = left.offsetHeight + 'px';
}

window.addEventListener('resize', syncPanelHeight);

/* ----------------------------------------------------------------
   FALLBACK DATA (API না থাকলে)
---------------------------------------------------------------- */
const FALLBACK_MATCHES = [
  {
    id: 1, sport: 'cricket', tournament: 'T20 World Cup', status: 'live', display_time: null, stream_url: null,
    team1_name: 'India', team1_logo: 'https://flagcdn.com/w80/in.png',
    team2_name: 'Australia', team2_logo: 'https://flagcdn.com/w80/au.png'
  },
  {
    id: 2, sport: 'football', tournament: 'Champions League', status: 'upcoming', display_time: '10 Jun | 09:30 PM', stream_url: null,
    team1_name: 'Real Madrid', team1_logo: 'https://flagcdn.com/w80/es.png',
    team2_name: 'Man City', team2_logo: 'https://flagcdn.com/w80/gb-eng.png'
  },
  {
    id: 3, sport: 'cricket', tournament: 'Asia Cup', status: 'recent', display_time: '08 Jun | 02:00 PM', stream_url: null,
    team1_name: 'Pakistan', team1_logo: 'https://flagcdn.com/w80/pk.png',
    team2_name: 'Bangladesh', team2_logo: 'https://flagcdn.com/w80/bd.png'
  },
];
const FALLBACK_CHANNELS = [
  { id: 1, name: 'ESPN', logo: null, meta: 'Sports', is_live: true, stream_url: null },
  { id: 2, name: 'Sky Sports', logo: null, meta: 'Sports', is_live: true, stream_url: null },
  { id: 3, name: 'Sony Sports', logo: null, meta: 'Sports', is_live: false, stream_url: null },
  { id: 4, name: 'Star Sports', logo: null, meta: 'Sports', is_live: true, stream_url: null },
];

/* ----------------------------------------------------------------
   INIT
---------------------------------------------------------------- */
window.addEventListener('load', loadData);
